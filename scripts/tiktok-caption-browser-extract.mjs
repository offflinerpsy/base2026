#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const args = {
    queue: path.join(repoRoot, "config", "tiktok-intake-queue.20260608.json"),
    out: path.join(repoRoot, ".planning", `tiktok-caption-extract-${Date.now()}.jsonl`),
    limit: 0,
    delayMs: 1200
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--queue" && next) {
      args.queue = path.resolve(next);
      i += 1;
    } else if (arg === "--out" && next) {
      args.out = path.resolve(next);
      i += 1;
    } else if (arg === "--limit" && next) {
      args.limit = Number(next);
      i += 1;
    } else if (arg === "--delay-ms" && next) {
      args.delayMs = Number(next);
      i += 1;
    }
  }

  return args;
}

function sourceIdFromUrl(url) {
  const match = String(url).match(/\/video\/(\d+)/);
  return match ? match[1] : "";
}

function normalizeCaption(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/^\s*Video in TikTok.*?:\s*/i, "")
    .trim();
}

function classify(record) {
  const text = record.caption_text || "";
  const prose = text.replace(/#[\w-]+/g, "").trim();
  const flags = [];

  if (!text) flags.push("missing_caption");
  if (text && prose.length < 40) flags.push("caption_too_short");
  if (text && prose.length >= 40) flags.push("caption_ready");
  if (record.body_text_sample && /Recommended|You may like|Comments/i.test(record.body_text_sample)) {
    flags.push("body_contains_recommendations");
  }

  return flags;
}

async function main() {
  const args = parseArgs(process.argv);
  const { chromium } = await import("playwright");
  const queue = JSON.parse(fs.readFileSync(args.queue, "utf8"));
  const jobs = [];

  for (const creator of queue.creators || []) {
    for (const videoUrl of creator.first_video_urls || []) {
      jobs.push({
        platform: creator.platform || "tiktok",
        creator_handle: creator.handle,
        creator_url: creator.profile_url,
        source_url: videoUrl,
        source_id: sourceIdFromUrl(videoUrl)
      });
    }
  }

  const selected = args.limit > 0 ? jobs.slice(0, args.limit) : jobs;
  fs.mkdirSync(path.dirname(args.out), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1200 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
  });

  const out = fs.createWriteStream(args.out, { encoding: "utf8" });

  for (const job of selected) {
    const started = new Date().toISOString();
    let record = { ...job, extracted_at: started, extraction_status: "pending" };

    try {
      await page.goto(job.source_url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(args.delayMs);

      const extracted = await page.evaluate(() => {
        const meta = (selector) => document.querySelector(selector)?.getAttribute("content") || "";
        return {
          title: document.title || "",
          description: meta('meta[name="description"]'),
          og_description: meta('meta[property="og:description"]'),
          og_url: meta('meta[property="og:url"]'),
          body_text_sample: document.body?.innerText?.slice(0, 1800) || "",
          video_text_tracks: Array.from(document.querySelectorAll("video")).map((video) => {
            return Array.from(video.textTracks || []).map((track) => ({
              kind: track.kind,
              label: track.label,
              language: track.language
            }));
          })
        };
      });

      const caption = normalizeCaption(extracted.og_description || extracted.description);
      record = {
        ...record,
        title: extracted.title,
        canonical_url: extracted.og_url || job.source_url,
        webpage_url: extracted.og_url || job.source_url,
        caption_text: caption,
        caption_source: extracted.og_description ? "tiktok_og_description" : "tiktok_meta_description",
        transcript_text: caption,
        transcript_source: "platform_caption",
        extractor: "playwright_browser",
        body_text_sample: extracted.body_text_sample,
        video_text_tracks: extracted.video_text_tracks,
        quality_flags: [],
        extraction_status: "ok"
      };
      record.quality_flags = classify(record);
    } catch (error) {
      record = {
        ...record,
        extraction_status: "failed",
        error: String(error && error.message ? error.message : error).slice(0, 500),
        quality_flags: ["needs_retry"]
      };
    }

    out.write(`${JSON.stringify(record)}\n`);
  }

  out.end();
  await browser.close();
  console.log(JSON.stringify({ ok: true, queue: args.queue, out: args.out, jobs: selected.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
