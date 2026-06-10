#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";

const DEFAULT_BASE_URL = "https://aggressorbulkit.online";
const require = createRequire(import.meta.url);

const ROUTES = [
  { id: "wp-home", label: "WordPress home", path: "/", group: "wordpress" },
  { id: "wp-services", label: "WordPress services", path: "/services/", group: "wordpress" },
  { id: "wp-pricing", label: "WordPress pricing", path: "/pricing/", group: "wordpress" },
  { id: "wp-audit", label: "WordPress audit form", path: "/ai-visibility-audit/", group: "wordpress", expectForm: true },
  { id: "wp-about", label: "WordPress about", path: "/about/", group: "wordpress" },
  { id: "wp-contact", label: "WordPress contact", path: "/contact/", group: "wordpress", expectForm: true },
  { id: "base-search", label: "Base2026 search", path: "/knowledge/", group: "base2026", expectHits: true },
  {
    id: "base-search-query",
    label: "Base2026 search results",
    path: "/knowledge/?q=AI%20Overviews",
    group: "base2026",
    expectHits: true,
    expectSourceModal: true,
  },
  { id: "base-roadmap", label: "Base2026 roadmap", path: "/knowledge/roadmap.html", group: "base2026" },
  { id: "base-support", label: "Base2026 support", path: "/knowledge/support.html", group: "base2026" },
  {
    id: "base-source-page",
    label: "Base2026 source page",
    path: "/knowledge/sources/tiktok-video-7647909694559767840.html",
    group: "base2026",
  },
];

const VIEWPORT_SETS = {
  mobile: [
    { id: "iphone-se", width: 320, height: 568 },
    { id: "android-small", width: 360, height: 740 },
    { id: "iphone-modern", width: 390, height: 844 },
    { id: "iphone-plus", width: 414, height: 896 },
  ],
  full: [
    { id: "iphone-se", width: 320, height: 568 },
    { id: "android-small", width: 360, height: 740 },
    { id: "iphone-modern", width: 390, height: 844 },
    { id: "iphone-plus", width: 414, height: 896 },
    { id: "tablet", width: 768, height: 1024 },
    { id: "desktop", width: 1440, height: 1000 },
  ],
  desktop: [
    { id: "tablet", width: 768, height: 1024 },
    { id: "desktop", width: 1440, height: 1000 },
  ],
};

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    out: "",
    viewports: "full",
    only: "",
    screenshots: true,
    fullPageScreenshots: false,
    fail: true,
    headed: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-url") {
      options.baseUrl = argv[++index];
    } else if (arg.startsWith("--base-url=")) {
      options.baseUrl = arg.split("=").slice(1).join("=");
    } else if (arg === "--out") {
      options.out = argv[++index];
    } else if (arg.startsWith("--out=")) {
      options.out = arg.split("=").slice(1).join("=");
    } else if (arg === "--viewports") {
      options.viewports = argv[++index];
    } else if (arg.startsWith("--viewports=")) {
      options.viewports = arg.split("=").slice(1).join("=");
    } else if (arg === "--only") {
      options.only = argv[++index];
    } else if (arg.startsWith("--only=")) {
      options.only = arg.split("=").slice(1).join("=");
    } else if (arg === "--no-screenshots") {
      options.screenshots = false;
    } else if (arg === "--full-page-screenshots") {
      options.fullPageScreenshots = true;
    } else if (arg === "--no-fail") {
      options.fail = false;
    } else if (arg === "--headed") {
      options.headed = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!VIEWPORT_SETS[options.viewports]) {
    throw new Error(`Unknown viewport set "${options.viewports}". Use: ${Object.keys(VIEWPORT_SETS).join(", ")}`);
  }

  return options;
}

function printHelp() {
  console.log(`Mobile visual QA

Usage:
  node scripts/mobile-visual-qa.mjs [options]

Options:
  --base-url <url>          Site root to test. Default: ${DEFAULT_BASE_URL}
  --out <dir>               Output directory. Default: output/evidence/mobile-visual-qa-<timestamp>
  --viewports <set>         mobile, full, or desktop. Default: full
  --only <ids>              Comma-separated route ids or groups.
  --no-screenshots          Do not save screenshots.
  --full-page-screenshots   Capture full pages instead of first viewport.
  --no-fail                 Always exit 0 after writing the report.
  --headed                  Run Chromium headed.
`);
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const candidates = [
      process.env.PLAYWRIGHT_MODULE_PATH,
      "/opt/homebrew/lib/node_modules/playwright",
      "/usr/local/lib/node_modules/playwright",
    ].filter(Boolean);

    for (const candidate of candidates) {
      try {
        return require(candidate);
      } catch {
        // Try the next known install location.
      }
    }
  }

  throw new Error(
    "Playwright is not importable. Install it globally with `npm install -g playwright`, " +
      "or set PLAYWRIGHT_MODULE_PATH to the absolute playwright package directory."
  );
}

function timestampForPath(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/[:]/g, "").replace(/[TZ]/g, "-").replace(/-$/, "");
}

function resolveOutputDir(options) {
  if (options.out) return resolve(options.out);
  return resolve("output", "evidence", `mobile-visual-qa-${timestampForPath()}`);
}

function routeUrl(baseUrl, path) {
  return new URL(path, baseUrl).toString();
}

function selectRoutes(only) {
  if (!only) return ROUTES;
  const selectors = new Set(only.split(",").map((item) => item.trim()).filter(Boolean));
  return ROUTES.filter((route) => selectors.has(route.id) || selectors.has(route.group));
}

function sanitizeFilePart(value) {
  return String(value || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function relevantConsole(messages) {
  return messages.filter((entry) => {
    const text = `${entry.type} ${entry.text}`;
    if (/favicon/i.test(text)) return false;
    if (/net::ERR_ABORTED/i.test(text)) return false;
    return entry.type === "error";
  });
}

async function dismissCookieBanner(page) {
  const reject = page.locator("[data-cookie-reject]");
  try {
    if ((await reject.count()) > 0 && await reject.first().isVisible()) {
      await reject.first().click({ timeout: 3000 });
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

async function waitForRouteReadiness(page, route) {
  const readiness = {
    hitCount: null,
    formControlCount: null,
  };

  if (route.expectHits) {
    try {
      await page.locator(".ais-Hits-item").first().waitFor({ state: "visible", timeout: 15000 });
      readiness.hitCount = await page.locator(".ais-Hits-item").count();
    } catch {
      readiness.hitCount = 0;
    }
  }

  if (route.expectForm) {
    readiness.formControlCount = await page.locator("form input, form textarea, form select, form button").count();
  }

  return readiness;
}

async function collectDiagnostics(page) {
  return page.evaluate(() => {
    const isVisible = (el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (el.matches(".screen-reader-text:not(:focus):not(:active), .sr-only:not(:focus):not(:active)")) {
        return false;
      }
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity || "1") > 0.01;
    };

    const textOf = (el) => (el.textContent || el.getAttribute("aria-label") || el.getAttribute("value") || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);

    const summarize = (el, rect) => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || "",
      className: String(el.className || "").slice(0, 120),
      role: el.getAttribute("role") || "",
      text: textOf(el),
      left: Math.round(rect.left),
      right: Math.round(rect.right),
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });

    const doc = document.documentElement;
    const body = document.body;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollWidth = Math.max(doc.scrollWidth, body ? body.scrollWidth : 0);
    const h1 = Array.from(document.querySelectorAll("h1")).filter(isVisible).map((item) => textOf(item));

    const overflowOffenders = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      if (overflowOffenders.length >= 12) break;
      if (!isVisible(el)) continue;
      const rect = el.getBoundingClientRect();
      const overRight = Math.ceil(rect.right - viewportWidth);
      const overLeft = Math.ceil(0 - rect.left);
      if (overRight > 2 || overLeft > 2) {
        overflowOffenders.push({
          ...summarize(el, rect),
          overRight,
          overLeft,
        });
      }
    }

    const clippedText = [];
    const clipSelector = [
      "a",
      "button",
      "input",
      "select",
      "textarea",
      "label",
      "summary",
      "h1",
      "h2",
      "h3",
      ".ay-button",
      ".ay-button-secondary",
      ".button-link",
      ".topic-chip",
      ".platform-badge",
      ".site-header__cta",
      ".query-presets button",
      ".ais-CurrentRefinements-category",
    ].join(",");
    for (const el of Array.from(document.querySelectorAll(clipSelector))) {
      if (clippedText.length >= 12) break;
      if (!isVisible(el)) continue;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const inlineClipped = el.scrollWidth > el.clientWidth + 2 && style.overflowX !== "visible";
      const blockClipped = el.scrollHeight > el.clientHeight + 2 && style.overflowY !== "visible" && style.whiteSpace === "nowrap";
      if (inlineClipped || blockClipped) {
        clippedText.push({
          ...summarize(el, rect),
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          overflowX: style.overflowX,
          whiteSpace: style.whiteSpace,
        });
      }
    }

    const smallTapTargets = [];
    const tapSelector = [
      "button",
      "input:not([type='checkbox']):not([type='radio']):not([type='hidden'])",
      "select",
      "textarea",
      ".ay-button",
      ".ay-button-secondary",
      ".button-link",
      ".site-header__cta",
      ".query-presets button",
      ".ais-Pagination-link",
      ".ais-SearchBox-submit",
      ".ais-SearchBox-reset",
      "[role='button']",
    ].join(",");
    for (const el of Array.from(document.querySelectorAll(tapSelector))) {
      if (smallTapTargets.length >= 12) break;
      if (!isVisible(el)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 24 || rect.height < 24) {
        smallTapTargets.push(summarize(el, rect));
      }
    }

    return {
      url: window.location.href,
      title: document.title,
      viewport: { width: viewportWidth, height: viewportHeight },
      scrollWidth,
      clientWidth: doc.clientWidth,
      overflowX: scrollWidth > doc.clientWidth + 2,
      h1,
      overflowOffenders,
      clippedText,
      smallTapTargets,
      activeElement: document.activeElement ? document.activeElement.tagName.toLowerCase() : "",
    };
  });
}

async function exerciseSourceModal(page, route, viewport, outputDir, options) {
  if (!route.expectSourceModal) return null;
  const result = {
    attempted: true,
    open: false,
    overflowX: false,
    screenshot: "",
    failure: "",
  };

  try {
    const buttons = page.locator(".read-transcript");
    if ((await buttons.count()) === 0) {
      result.failure = "No source-record buttons found.";
      return result;
    }
    await buttons.first().click({ timeout: 5000 });
    const dialog = page.locator("#transcript-dialog[open]");
    await dialog.waitFor({ state: "visible", timeout: 10000 });
    result.open = true;
    result.overflowX = await page.evaluate(() => {
      const dialogEl = document.querySelector("#transcript-dialog[open]");
      if (!dialogEl) return false;
      return dialogEl.scrollWidth > dialogEl.clientWidth + 2;
    });

    if (options.screenshots) {
      const file = `${sanitizeFilePart(route.id)}--${viewport.id}--modal.png`;
      const path = join(outputDir, file);
      await page.screenshot({ path, fullPage: false });
      result.screenshot = file;
    }

    const close = page.locator("#transcript-close");
    if ((await close.count()) > 0) {
      await close.first().click({ timeout: 3000 });
    }
  } catch (error) {
    result.failure = error.message;
  }

  return result;
}

function buildFailures({ status, route, readiness, diagnostics, consoleMessages, pageErrors, modal }) {
  const failures = [];
  const consoleErrors = relevantConsole(consoleMessages);

  if (!status || status >= 400) {
    failures.push(`HTTP status ${status || "missing"}`);
  }
  if (diagnostics.h1.length !== 1) {
    failures.push(`Expected one visible H1, found ${diagnostics.h1.length}`);
  }
  if (diagnostics.overflowX) {
    failures.push(`Horizontal overflow: scrollWidth ${diagnostics.scrollWidth}, clientWidth ${diagnostics.clientWidth}`);
  }
  if (diagnostics.clippedText.length > 0) {
    failures.push(`Clipped control/heading text: ${diagnostics.clippedText.length}`);
  }
  if (consoleErrors.length > 0) {
    failures.push(`Console errors: ${consoleErrors.length}`);
  }
  if (pageErrors.length > 0) {
    failures.push(`Page errors: ${pageErrors.length}`);
  }
  if (route.expectHits && readiness.hitCount === 0) {
    failures.push("Expected search hits, found 0");
  }
  if (route.expectForm && readiness.formControlCount === 0) {
    failures.push("Expected form controls, found 0");
  }
  if (modal?.attempted && (!modal.open || modal.overflowX || modal.failure)) {
    failures.push(`Source modal failed: ${modal.failure || (modal.overflowX ? "horizontal overflow" : "not open")}`);
  }

  return failures;
}

function markdownReport(summary) {
  const lines = [];
  lines.push(`# Mobile Visual QA Report`);
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Base URL: ${summary.baseUrl}`);
  lines.push(`Viewport set: ${summary.viewportSet}`);
  lines.push(`Overall: ${summary.failures.length === 0 ? "PASS" : "FAIL"}`);
  lines.push("");
  lines.push("## Matrix");
  lines.push("");
  lines.push("| Route | Viewport | Status | H1 | Hits | Issues | Screenshot |");
  lines.push("| --- | --- | --- | --- | ---: | --- | --- |");
  for (const item of summary.results) {
    lines.push([
      item.routeId,
      `${item.viewport.id} (${item.viewport.width}x${item.viewport.height})`,
      item.failures.length ? "FAIL" : "PASS",
      item.diagnostics.h1.join(" / ").replace(/\|/g, "\\|") || "none",
      item.readiness.hitCount ?? "",
      item.failures.join("; ").replace(/\|/g, "\\|") || "none",
      item.screenshot || "",
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  const failing = summary.results.filter((item) => item.failures.length > 0);
  if (failing.length) {
    lines.push("");
    lines.push("## Findings");
    for (const item of failing) {
      lines.push("");
      lines.push(`### ${item.routeId} / ${item.viewport.id}`);
      for (const failure of item.failures) lines.push(`- ${failure}`);
      if (item.diagnostics.overflowOffenders.length) {
        lines.push("- Overflow offenders:");
        for (const offender of item.diagnostics.overflowOffenders.slice(0, 5)) {
          lines.push(`  - ${offender.tag}.${offender.className || "-"} width=${offender.width} right=${offender.right} text="${offender.text}"`);
        }
      }
      if (item.diagnostics.clippedText.length) {
        lines.push("- Clipped text:");
        for (const clipped of item.diagnostics.clippedText.slice(0, 5)) {
          lines.push(`  - ${clipped.tag}.${clipped.className || "-"} ${clipped.clientWidth}/${clipped.scrollWidth} text="${clipped.text}"`);
        }
      }
      if (item.consoleMessages.length) {
        lines.push("- Console errors:");
        for (const entry of relevantConsole(item.consoleMessages).slice(0, 5)) {
          lines.push(`  - ${entry.type}: ${entry.text}`);
        }
      }
    }
  }

  const warnings = summary.results.filter((item) => item.diagnostics.smallTapTargets.length > 0);
  if (warnings.length) {
    lines.push("");
    lines.push("## Warnings");
    lines.push("");
    lines.push("Small tap target findings are warnings because some controls may use a larger label as the effective target.");
    for (const item of warnings.slice(0, 12)) {
      lines.push(`- ${item.routeId} / ${item.viewport.id}: ${item.diagnostics.smallTapTargets.length} small tap targets.`);
    }
  }

  lines.push("");
  lines.push("## Re-run");
  lines.push("");
  lines.push("```bash");
  lines.push(`node scripts/mobile-visual-qa.mjs --base-url ${summary.baseUrl} --viewports ${summary.viewportSet}`);
  lines.push("```");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const { chromium } = await loadPlaywright();
  const routes = selectRoutes(options.only);
  if (!routes.length) throw new Error("No routes matched --only.");

  const viewports = VIEWPORT_SETS[options.viewports];
  const outputDir = resolveOutputDir(options);
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: !options.headed });
  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: options.baseUrl,
    viewportSet: options.viewports,
    outputDir,
    routes: routes.map((route) => ({ id: route.id, path: route.path, group: route.group })),
    viewports,
    results: [],
    failures: [],
  };

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
      });

      for (const route of routes) {
        const page = await context.newPage();
        const consoleMessages = [];
        const pageErrors = [];
        page.on("console", (message) => {
          consoleMessages.push({ type: message.type(), text: message.text() });
        });
        page.on("pageerror", (error) => {
          pageErrors.push(error.message);
        });

        const url = routeUrl(options.baseUrl, route.path);
        let status = null;
        let readiness = {};
        let diagnostics = null;
        let modal = null;
        let screenshot = "";
        let navigationError = "";

        try {
          const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
          status = response ? response.status() : null;
          await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
          await dismissCookieBanner(page);
          await page.waitForTimeout(500);
          readiness = await waitForRouteReadiness(page, route);
          diagnostics = await collectDiagnostics(page);

          if (options.screenshots) {
            const file = `${sanitizeFilePart(route.id)}--${viewport.id}.png`;
            const path = join(outputDir, file);
            await page.screenshot({ path, fullPage: options.fullPageScreenshots });
            screenshot = file;
          }

          modal = await exerciseSourceModal(page, route, viewport, outputDir, options);
        } catch (error) {
          navigationError = error.message;
          diagnostics = diagnostics || {
            url,
            title: "",
            viewport: { width: viewport.width, height: viewport.height },
            scrollWidth: null,
            clientWidth: null,
            overflowX: false,
            h1: [],
            overflowOffenders: [],
            clippedText: [],
            smallTapTargets: [],
          };
        }

        const failures = buildFailures({ status, route, readiness, diagnostics, consoleMessages, pageErrors, modal });
        if (navigationError) failures.push(`Navigation/check failed: ${navigationError}`);

        const item = {
          routeId: route.id,
          label: route.label,
          url,
          finalUrl: diagnostics.url,
          viewport,
          status,
          readiness,
          diagnostics,
          consoleMessages: relevantConsole(consoleMessages),
          pageErrors,
          modal,
          screenshot,
          failures,
        };
        summary.results.push(item);
        if (failures.length) {
          summary.failures.push({ routeId: route.id, viewport: viewport.id, failures });
        }

        await page.close().catch(() => {});
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  await writeFile(join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeFile(join(outputDir, "report.md"), markdownReport(summary), "utf8");

  console.log(`report=${join(outputDir, "report.md")}`);
  console.log(`summary=${join(outputDir, "summary.json")}`);
  console.log(`results=${summary.results.length}`);
  console.log(`failures=${summary.failures.length}`);

  if (summary.failures.length && options.fail) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
