#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_BASE_URL = "https://aggressorbulkit.online";
const DEFAULT_OUT_DIR = "output/seo-crawl-gate/latest";
const DEFAULT_REPORT_PATH = "docs/project-memory/LIVE_SEO_CRAWL_GATE_2026_06_17.md";
const DEFAULT_CACHE_PATH = ".seo-cache/live-crawl-summary.json";
const DEFAULT_MAX_PAGES = 500;
const DEFAULT_CONCURRENCY = 5;
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_DELAY_MS = 150;

const args = parseArgs(process.argv.slice(2));
const baseUrl = new URL(args["base-url"] || DEFAULT_BASE_URL);
const outDir = args.out || DEFAULT_OUT_DIR;
const reportPath = args.report || DEFAULT_REPORT_PATH;
const cachePath = args.cache || DEFAULT_CACHE_PATH;
const maxPages = numberArg(args["max-pages"], DEFAULT_MAX_PAGES);
const concurrency = numberArg(args.concurrency, DEFAULT_CONCURRENCY);
const timeoutMs = numberArg(args.timeout, DEFAULT_TIMEOUT_MS);
const delayMs = numberArg(args.delay, DEFAULT_DELAY_MS);
const userAgent = args["user-agent"] || "Base2026LiveSeoCrawlGate/1.0 (+https://aggressorbulkit.online/knowledge/)";

const now = new Date().toISOString();
const rootOrigin = baseUrl.origin;
const rootHost = baseUrl.hostname.replace(/^www\./, "");
const seedUrls = [
  new URL("/", baseUrl).href,
  new URL("/knowledge/", baseUrl).href,
  new URL("/knowledge/sitemap.xml", baseUrl).href,
];

const pageMap = new Map();
const linkRows = [];
const queue = [];
const queued = new Set();
const sitemapState = {
  root_url: new URL("/knowledge/sitemap.xml", baseUrl).href,
  sitemap_index_urls: [],
  page_urls: [],
  page_count: 0,
  child_sitemap_counts: [],
  errors: [],
};
const robotsState = {
  url: new URL("/robots.txt", baseUrl).href,
  fetched: false,
  status: null,
  disallows: [],
  sitemaps: [],
  error: null,
};

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const part = argv[i];
    if (!part.startsWith("--")) continue;
    const key = part.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function numberArg(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: options.redirect || "follow",
      signal: controller.signal,
      headers: {
        "user-agent": userAgent,
        "accept": options.accept || "text/html,application/xhtml+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
      },
    });
    const text = await response.text();
    return { response, text, error: null };
  } catch (error) {
    return { response: null, text: "", error: error?.message || String(error) };
  } finally {
    clearTimeout(timeout);
  }
}

function isInternalUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl, baseUrl);
    return parsed.protocol.startsWith("http") && parsed.hostname.replace(/^www\./, "") === rootHost;
  } catch {
    return false;
  }
}

function normalizeUrl(rawUrl) {
  const parsed = new URL(rawUrl, baseUrl);
  parsed.hash = "";
  if (parsed.hostname.replace(/^www\./, "") === rootHost) {
    parsed.protocol = baseUrl.protocol;
    parsed.hostname = baseUrl.hostname;
  }
  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/index.html")) {
    parsed.pathname = parsed.pathname.slice(0, -"index.html".length);
  }
  return parsed.href;
}

function displayPath(rawUrl) {
  try {
    const parsed = new URL(rawUrl, baseUrl);
    return parsed.pathname + parsed.search;
  } catch {
    return rawUrl;
  }
}

async function loadRobots() {
  const { response, text, error } = await fetchText(robotsState.url, { accept: "text/plain,*/*" });
  robotsState.fetched = true;
  robotsState.status = response?.status || null;
  if (error) {
    robotsState.error = error;
    return;
  }
  const lines = text.split(/\r?\n/);
  let applies = false;
  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*/, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === "user-agent") {
      applies = value === "*" || value.toLowerCase().includes("base2026");
      continue;
    }
    if (key === "disallow" && applies && value) {
      robotsState.disallows.push(value);
    }
    if (key === "sitemap" && value) {
      robotsState.sitemaps.push(value);
    }
  }
}

function allowedByRobots(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl, baseUrl);
  } catch {
    return false;
  }
  if (!isInternalUrl(parsed.href)) return false;
  const target = parsed.pathname;
  return !robotsState.disallows.some((rule) => {
    if (!rule || rule === "/") return rule === "/";
    return target.startsWith(rule);
  });
}

function enqueue(rawUrl, source = "link") {
  if (pageMap.size + queued.size >= maxPages) return false;
  if (!isInternalUrl(rawUrl)) return false;
  const normalized = normalizeUrl(rawUrl);
  if (!allowedByRobots(normalized)) return false;
  if (queued.has(normalized) || pageMap.has(normalized)) return false;
  queued.add(normalized);
  queue.push({ url: normalized, source });
  return true;
}

function extractXmlLocs(xml) {
  const locs = [];
  const pattern = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  let match;
  while ((match = pattern.exec(xml))) {
    locs.push(decodeHtml(match[1].trim()));
  }
  return locs;
}

async function loadSitemap() {
  const root = sitemapState.root_url;
  const rootResult = await fetchText(root, { accept: "application/xml,text/xml,*/*" });
  if (rootResult.error || !rootResult.response || rootResult.response.status >= 400) {
    sitemapState.errors.push({
      url: root,
      status: rootResult.response?.status || null,
      error: rootResult.error,
    });
    return;
  }
  const locs = extractXmlLocs(rootResult.text);
  const childSitemaps = locs.filter((loc) => /\/sitemaps\/[^/]+\.xml(?:$|\?)/.test(new URL(loc, baseUrl).pathname));
  sitemapState.sitemap_index_urls = childSitemaps;
  if (!childSitemaps.length) {
    const urls = locs.filter(isInternalUrl).map(normalizeUrl);
    sitemapState.page_urls = unique(urls);
    sitemapState.page_count = sitemapState.page_urls.length;
    return;
  }
  for (const child of childSitemaps) {
    const childResult = await fetchText(child, { accept: "application/xml,text/xml,*/*" });
    if (childResult.error || !childResult.response || childResult.response.status >= 400) {
      sitemapState.errors.push({
        url: child,
        status: childResult.response?.status || null,
        error: childResult.error,
      });
      continue;
    }
    const urls = extractXmlLocs(childResult.text).filter(isInternalUrl).map(normalizeUrl);
    sitemapState.child_sitemap_counts.push({ url: child, count: urls.length });
    sitemapState.page_urls.push(...urls);
  }
  sitemapState.page_urls = unique(sitemapState.page_urls);
  sitemapState.page_count = sitemapState.page_urls.length;
}

function unique(items) {
  return [...new Set(items)];
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function attrValue(tag, attr) {
  const pattern = new RegExp(`${attr}\\s*=\\s*(['"])(.*?)\\1`, "i");
  const match = tag.match(pattern);
  return match ? decodeHtml(match[2].trim()) : "";
}

function metaContent(html, key, value) {
  const tagPattern = /<meta\b[^>]*>/gi;
  let match;
  while ((match = tagPattern.exec(html))) {
    const tag = match[0];
    const attr = attrValue(tag, key);
    if (attr.toLowerCase() === value.toLowerCase()) {
      return attrValue(tag, "content");
    }
  }
  return "";
}

function linkHref(html, rel) {
  const tagPattern = /<link\b[^>]*>/gi;
  let match;
  while ((match = tagPattern.exec(html))) {
    const tag = match[0];
    const relValue = attrValue(tag, "rel").toLowerCase();
    if (relValue.split(/\s+/).includes(rel.toLowerCase())) {
      return attrValue(tag, "href");
    }
  }
  return "";
}

function extractAnchors(html, pageUrl) {
  const anchors = [];
  const pattern = /<a\b[^>]*href\s*=\s*(['"])(.*?)\1[^>]*>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const href = decodeHtml(match[2].trim());
    if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) continue;
    let absolute;
    try {
      absolute = new URL(href, pageUrl).href;
    } catch {
      continue;
    }
    anchors.push({ href, absolute: normalizeUrl(absolute), internal: isInternalUrl(absolute) });
  }
  return anchors;
}

function analyzePage(url, response, html, elapsedMs, source) {
  const finalUrl = response.url ? normalizeUrl(response.url) : url;
  const contentType = response.headers.get("content-type") || "";
  const isHtml = contentType.includes("text/html") || /^\s*<!doctype html|<html[\s>]/i.test(html);
  const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription = metaContent(html, "name", "description");
  const robotsMeta = metaContent(html, "name", "robots");
  const canonicalRaw = linkHref(html, "canonical");
  const canonicalUrl = canonicalRaw ? normalizeUrl(new URL(canonicalRaw, finalUrl).href) : "";
  const h1Matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => stripTags(m[1]));
  const anchors = isHtml ? extractAnchors(html, finalUrl) : [];
  const og = {
    title: metaContent(html, "property", "og:title"),
    description: metaContent(html, "property", "og:description"),
    url: metaContent(html, "property", "og:url"),
    type: metaContent(html, "property", "og:type"),
    image: metaContent(html, "property", "og:image"),
  };
  const twitter = {
    card: metaContent(html, "name", "twitter:card"),
    title: metaContent(html, "name", "twitter:title"),
    description: metaContent(html, "name", "twitter:description"),
    image: metaContent(html, "name", "twitter:image"),
  };
  const schemaScripts = [...html.matchAll(/<script\b[^>]*type\s*=\s*(['"])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => decodeHtml(m[2].trim()))
    .filter(Boolean);
  const schemaErrors = [];
  for (const script of schemaScripts) {
    try {
      JSON.parse(script);
    } catch (error) {
      schemaErrors.push(error?.message || String(error));
    }
  }

  return {
    url,
    final_url: finalUrl,
    source,
    status: response.status,
    redirected: finalUrl !== url,
    content_type: contentType,
    elapsed_ms: elapsedMs,
    is_html: isHtml,
    title: stripTags(title),
    title_present: Boolean(stripTags(title)),
    meta_description_present: Boolean(metaDescription),
    h1_count: h1Matches.length,
    h1: h1Matches.slice(0, 5),
    robots: robotsMeta,
    noindex: /noindex/i.test(robotsMeta),
    canonical: canonicalUrl,
    canonical_present: Boolean(canonicalUrl),
    canonical_self: canonicalUrl ? sameUrlNoTrailingSlash(canonicalUrl, finalUrl) : false,
    og,
    og_missing: Object.entries(og).filter(([, v]) => !v).map(([k]) => k),
    twitter,
    twitter_missing: Object.entries(twitter).filter(([, v]) => !v).map(([k]) => k),
    schema_count: schemaScripts.length,
    schema_error_count: schemaErrors.length,
    schema_errors: schemaErrors,
    link_count: anchors.length,
  };
}

function firstMatch(text, pattern) {
  const match = text.match(pattern);
  return match ? match[1] : "";
}

function sameUrlNoTrailingSlash(a, b) {
  return stripTrailingSlash(a) === stripTrailingSlash(b);
}

function stripTrailingSlash(value) {
  const parsed = new URL(value);
  parsed.hash = "";
  const pathname = parsed.pathname;
  if (pathname !== "/" && pathname.endsWith("/")) {
    parsed.pathname = pathname.slice(0, -1);
  }
  return parsed.href;
}

function classifyLink(from, link) {
  const target = new URL(link.absolute, baseUrl);
  const pathName = target.pathname;
  const pathSearch = pathName + target.search;
  const rootBase2026 = /^\/(topics|sources|creators|compare)(?:\/|$)/.test(pathName);
  const contact = pathName === "/contact" || pathName === "/contact/";
  const author = pathName === "/author" || pathName === "/author/" || pathName.startsWith("/author/");
  return {
    from,
    href: link.href,
    to: link.absolute,
    path: pathSearch,
    internal: link.internal,
    root_base2026_link: rootBase2026,
    contact_link: contact,
    author_link: author,
  };
}

async function crawlOne(job) {
  const started = Date.now();
  const result = await fetchText(job.url);
  const elapsed = Date.now() - started;
  queued.delete(job.url);
  if (result.error || !result.response) {
    pageMap.set(job.url, {
      url: job.url,
      final_url: job.url,
      source: job.source,
      status: null,
      fetch_error: result.error,
      elapsed_ms: elapsed,
      is_html: false,
    });
    return;
  }
  const page = analyzePage(job.url, result.response, result.text, elapsed, job.source);
  pageMap.set(job.url, page);
  if (!page.is_html) return;
  const anchors = extractAnchors(result.text, page.final_url);
  for (const anchor of anchors) {
    const row = classifyLink(page.final_url, anchor);
    linkRows.push(row);
    if (anchor.internal && pageMap.size + queued.size < maxPages && allowedByRobots(anchor.absolute)) {
      enqueue(anchor.absolute, "internal-link");
    }
  }
}

async function crawl() {
  await loadRobots();
  await loadSitemap();
  for (const seed of seedUrls) enqueue(seed, "seed");
  for (const url of sitemapState.page_urls) {
    if (pageMap.size + queued.size >= maxPages) break;
    enqueue(url, "sitemap");
  }
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length && pageMap.size < maxPages) {
      const job = queue.shift();
      if (!job) break;
      await crawlOne(job);
      if (delayMs) await sleep(delayMs);
    }
  });
  await Promise.all(workers);
}

function summarize() {
  const pages = [...pageMap.values()];
  const statusCounts = countBy(pages, (page) => String(page.status || "fetch_error"));
  const crawledUrlSet = new Set(pages.map((page) => page.final_url));
  const criticalLinks = linkRows.filter((row) => row.contact_link || row.author_link || row.root_base2026_link);
  const errorPages = pages.filter((page) => !page.status || page.status >= 400);
  const serverErrorPages = pages.filter((page) => page.status >= 500);
  const redirectPages = pages.filter((page) => page.redirected || (page.status >= 300 && page.status < 400));
  const internalLinks = linkRows.filter((row) => row.internal);
  const uncrawledInternalLinks = unique(internalLinks.map((row) => row.to)).filter((url) => !crawledUrlSet.has(url));
  const canonicalMissing = pages.filter((page) => page.is_html && !page.canonical_present);
  const canonicalMismatch = pages.filter((page) => page.is_html && page.canonical_present && !page.canonical_self && !page.noindex);
  const noindexPages = pages.filter((page) => page.noindex);
  const titleMissing = pages.filter((page) => page.is_html && !page.title_present);
  const metaDescriptionMissing = pages.filter((page) => page.is_html && !page.meta_description_present);
  const h1Missing = pages.filter((page) => page.is_html && page.h1_count === 0);
  const h1Multiple = pages.filter((page) => page.is_html && page.h1_count > 1);
  const ogIncomplete = pages.filter((page) => page.is_html && !page.noindex && page.og_missing.length > 0);
  const twitterIncomplete = pages.filter((page) => page.is_html && !page.noindex && page.twitter_missing.length > 0);
  const schemaMissing = pages.filter((page) => page.is_html && !page.noindex && page.schema_count === 0);
  const schemaInvalid = pages.filter((page) => page.schema_error_count > 0);
  const sitemapUrls = new Set(sitemapState.page_urls);
  const sitemapCrawled = pages.filter((page) => sitemapUrls.has(page.url) || sitemapUrls.has(page.final_url));

  const critical = [];
  if (robotsState.error || (robotsState.status && robotsState.status >= 400)) {
    critical.push({
      code: "ROBOTS_UNAVAILABLE",
      severity: "critical",
      message: "robots.txt was not readable during the live crawl.",
      count: 1,
      sample: [robotsState.error || robotsState.status],
    });
  }
  if (sitemapState.errors.length) {
    critical.push({
      code: "SITEMAP_FETCH_ERROR",
      severity: "critical",
      message: "One or more Base2026 sitemap files failed to load.",
      count: sitemapState.errors.length,
      sample: sitemapState.errors.slice(0, 10),
    });
  }
  if (criticalLinks.length) {
    critical.push({
      code: "P0_BAD_INTERNAL_LINK_CONTRACT",
      severity: "critical",
      message: "Found internal links to /contact/, /author/, or root-level Base2026 paths outside /knowledge/.",
      count: criticalLinks.length,
      sample: criticalLinks.slice(0, 20),
    });
  }
  if (errorPages.length) {
    critical.push({
      code: "CRAWLED_4XX_5XX_OR_FETCH_ERROR",
      severity: "critical",
      message: "At least one crawled internal URL returned 4xx/5xx or failed to fetch.",
      count: errorPages.length,
      sample: errorPages.slice(0, 20).map(pickPageSample),
    });
  }
  if (serverErrorPages.length) {
    critical.push({
      code: "CRAWLED_5XX",
      severity: "critical",
      message: "At least one crawled internal URL returned 5xx.",
      count: serverErrorPages.length,
      sample: serverErrorPages.slice(0, 20).map(pickPageSample),
    });
  }

  const warnings = [
    issue("CANONICAL_MISSING", "warning", canonicalMissing, "HTML pages missing canonical URL."),
    issue("CANONICAL_MISMATCH_INDEXABLE", "warning", canonicalMismatch, "Indexable HTML pages whose canonical URL differs from the final URL."),
    issue("TITLE_MISSING", "warning", titleMissing, "HTML pages missing title."),
    issue("META_DESCRIPTION_MISSING", "warning", metaDescriptionMissing, "HTML pages missing meta description."),
    issue("H1_MISSING", "warning", h1Missing, "HTML pages missing H1."),
    issue("H1_MULTIPLE", "warning", h1Multiple, "HTML pages with more than one H1."),
    issue("OG_INCOMPLETE", "warning", ogIncomplete, "Indexable HTML pages with incomplete Open Graph tags."),
    issue("TWITTER_INCOMPLETE", "warning", twitterIncomplete, "Indexable HTML pages with incomplete X/Twitter card tags."),
    issue("SCHEMA_MISSING", "warning", schemaMissing, "Indexable HTML pages with no JSON-LD schema."),
    issue("SCHEMA_INVALID", "warning", schemaInvalid, "HTML pages with invalid JSON-LD schema."),
  ].filter(Boolean);

  return {
    cache_type: "live-seo-crawl-gate",
    analyzed_at: now,
    base_url: rootOrigin,
    max_pages: maxPages,
    crawled_pages: pages.length,
    crawled_sitemap_pages: sitemapCrawled.length,
    status_counts: statusCounts,
    redirect_pages: redirectPages.length,
    internal_links_seen: internalLinks.length,
    unique_internal_links_seen: unique(internalLinks.map((row) => row.to)).length,
    uncrawled_internal_links: uncrawledInternalLinks.length,
    sitemap: {
      root_url: sitemapState.root_url,
      sitemap_index_count: sitemapState.sitemap_index_urls.length,
      page_count: sitemapState.page_count,
      child_sitemap_counts: sitemapState.child_sitemap_counts,
      error_count: sitemapState.errors.length,
    },
    robots: {
      url: robotsState.url,
      fetched: robotsState.fetched,
      status: robotsState.status,
      disallow_count: robotsState.disallows.length,
      sitemap_count: robotsState.sitemaps.length,
      error: robotsState.error,
    },
    p0: {
      bad_link_contract_count: criticalLinks.length,
      crawled_error_pages: errorPages.length,
      crawled_server_error_pages: serverErrorPages.length,
      passed: critical.length === 0,
    },
    seo_basics: {
      noindex_pages: noindexPages.length,
      canonical_missing: canonicalMissing.length,
      canonical_mismatch_indexable: canonicalMismatch.length,
      title_missing: titleMissing.length,
      meta_description_missing: metaDescriptionMissing.length,
      h1_missing: h1Missing.length,
      h1_multiple: h1Multiple.length,
      og_incomplete: ogIncomplete.length,
      twitter_incomplete: twitterIncomplete.length,
      schema_missing: schemaMissing.length,
      schema_invalid: schemaInvalid.length,
    },
    critical,
    warnings,
    limitations: [
      "This is a bounded live crawl, not an Ahrefs replacement for historical external crawl metrics.",
      `The crawl is capped at ${maxPages} pages; sitemap contains ${sitemapState.page_count} URLs.`,
      "The gate validates current live HTML/link contracts and metadata basics; it does not submit URLs to GSC, IndexNow, or Ahrefs.",
    ],
  };
}

function issue(code, severity, pages, message) {
  if (!pages.length) return null;
  return {
    code,
    severity,
    message,
    count: pages.length,
    sample: pages.slice(0, 20).map(pickPageSample),
  };
}

function pickPageSample(page) {
  return {
    url: page.url,
    final_url: page.final_url,
    status: page.status,
    title: page.title,
    robots: page.robots,
    canonical: page.canonical,
    h1_count: page.h1_count,
  };
}

function countBy(items, fn) {
  const out = {};
  for (const item of items) {
    const key = fn(item);
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

function markdownReport(summary) {
  const status = summary.p0.passed ? "PASS" : "FAIL";
  const lines = [
    "# Live SEO Crawl Gate - 2026-06-17",
    "",
    `Status: **${status}**`,
    "",
    `Analyzed at: ${summary.analyzed_at}`,
    "",
    `Base URL: ${summary.base_url}`,
    "",
    "## Scope",
    "",
    "- Live crawl starting from `/`, `/knowledge/`, and `/knowledge/sitemap.xml`.",
    `- Max pages: ${summary.max_pages}.`,
    "- Robots respected for same-site crawl decisions.",
    "- No GSC, IndexNow, Ahrefs recrawl, deploy, commit, push, or TikTok intake was run.",
    "",
    "## Summary",
    "",
    `- Crawled pages: ${summary.crawled_pages}`,
    `- Sitemap URLs: ${summary.sitemap.page_count}`,
    `- Sitemap files: ${summary.sitemap.sitemap_index_count || 1}`,
    `- Internal links seen: ${summary.internal_links_seen}`,
    `- Unique internal links seen: ${summary.unique_internal_links_seen}`,
    `- Redirected crawled pages: ${summary.redirect_pages}`,
    `- Status counts: ${inlineJson(summary.status_counts)}`,
    "",
    "## P0 Gate",
    "",
    `- Bad link-contract links (` + "`/contact/`, `/author/`, root `/topics|sources|creators|compare`" + `): ${summary.p0.bad_link_contract_count}`,
    `- Crawled 4xx/5xx/fetch-error pages: ${summary.p0.crawled_error_pages}`,
    `- Crawled 5xx pages: ${summary.p0.crawled_server_error_pages}`,
    "",
  ];
  if (summary.critical.length) {
    lines.push("### Critical Findings", "");
    for (const finding of summary.critical) {
      lines.push(`- **${finding.code}** (${finding.count}): ${finding.message}`);
      for (const sample of finding.sample.slice(0, 5)) {
        const value = typeof sample === "string" ? sample : sample.url || sample.to || JSON.stringify(sample);
        lines.push(`  - ${value}`);
      }
    }
    lines.push("");
  } else {
    lines.push("No P0 crawl/link failures found in this bounded live crawl.", "");
  }

  lines.push("## SEO Basics", "");
  for (const [key, value] of Object.entries(summary.seo_basics)) {
    lines.push(`- ${key}: ${value}`);
  }
  lines.push("");

  if (summary.warnings.length) {
    lines.push("## Non-Blocking Warnings", "");
    for (const finding of summary.warnings) {
      lines.push(`- **${finding.code}** (${finding.count}): ${finding.message}`);
      for (const sample of finding.sample.slice(0, 3)) {
        lines.push(`  - ${sample.url}`);
      }
    }
    lines.push("");
  }

  lines.push("## Files", "");
  lines.push("- Machine summary: `output/seo-crawl-gate/latest/summary.json`");
  lines.push("- Crawled page details: `output/seo-crawl-gate/latest/pages.json`");
  lines.push("- Link details: `output/seo-crawl-gate/latest/links.json`");
  lines.push("- Issue details: `output/seo-crawl-gate/latest/issues.json`");
  lines.push("- Cache summary: `.seo-cache/live-crawl-summary.json`");
  lines.push("");
  lines.push("## Limitations", "");
  for (const limitation of summary.limitations) {
    lines.push(`- ${limitation}`);
  }
  lines.push("");
  lines.push("## Next Safe SEO Action", "");
  if (summary.p0.passed) {
    lines.push("Use this gate as the local replacement for the blocked Ahrefs recrawl, then continue P1 crawl architecture work: source archive/internal links, query-state canonical/noindex policy, shared OG/X metadata, schema validation, and sitemap canonical hygiene.");
  } else {
    lines.push("Fix the listed P0 failures before any GSC/IndexNow submission or public SEO push.");
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function inlineJson(value) {
  return JSON.stringify(value).replace(/"/g, "");
}

async function writeOutputs(summary) {
  await mkdir(outDir, { recursive: true });
  await mkdir(path.dirname(reportPath), { recursive: true });
  await mkdir(path.dirname(cachePath), { recursive: true });
  const pages = [...pageMap.values()].sort((a, b) => a.url.localeCompare(b.url));
  const links = linkRows.sort((a, b) => `${a.from} ${a.to}`.localeCompare(`${b.from} ${b.to}`));
  await writeFile(path.join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(path.join(outDir, "pages.json"), `${JSON.stringify(pages, null, 2)}\n`);
  await writeFile(path.join(outDir, "links.json"), `${JSON.stringify(links, null, 2)}\n`);
  await writeFile(path.join(outDir, "issues.json"), `${JSON.stringify({ critical: summary.critical, warnings: summary.warnings }, null, 2)}\n`);
  await writeFile(path.join(outDir, "sitemap.json"), `${JSON.stringify(sitemapState, null, 2)}\n`);
  await writeFile(path.join(outDir, "robots.json"), `${JSON.stringify(robotsState, null, 2)}\n`);
  await writeFile(reportPath, markdownReport(summary));
  await writeFile(cachePath, `${JSON.stringify(summary, null, 2)}\n`);
}

await crawl();
const summary = summarize();
await writeOutputs(summary);
console.log(JSON.stringify({
  status: summary.p0.passed ? "pass" : "fail",
  crawled_pages: summary.crawled_pages,
  sitemap_urls: summary.sitemap.page_count,
  bad_link_contract_count: summary.p0.bad_link_contract_count,
  crawled_error_pages: summary.p0.crawled_error_pages,
  warning_groups: summary.warnings.length,
  out_dir: outDir,
  report: reportPath,
}, null, 2));

process.exit(summary.p0.passed ? 0 : 1);
