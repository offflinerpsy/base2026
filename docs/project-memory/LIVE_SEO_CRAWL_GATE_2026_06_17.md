# Live SEO Crawl Gate - 2026-06-17

Status: **PASS**

Analyzed at: 2026-06-19T12:33:01.199Z

Base URL: https://aggressorbulkit.online

## Scope

- Live crawl starting from `/`, `/knowledge/`, and `/knowledge/sitemap.xml`.
- Max pages: 500.
- Robots respected for same-site crawl decisions.
- No GSC, IndexNow, Ahrefs recrawl, deploy, commit, push, or TikTok intake was run.

## Summary

- Crawled pages: 500
- Sitemap URLs: 1562
- Sitemap files: 4
- Internal links seen: 25827
- Unique internal links seen: 1296
- Redirected crawled pages: 0
- Status counts: {200:500}

## P0 Gate

- Bad link-contract links (`/contact/`, `/author/`, root `/topics|sources|creators|compare`): 0
- Crawled 4xx/5xx/fetch-error pages: 0
- Crawled 5xx pages: 0

No P0 crawl/link failures found in this bounded live crawl.

## SEO Basics

- noindex_pages: 0
- canonical_missing: 0
- canonical_mismatch_indexable: 0
- title_missing: 0
- meta_description_missing: 0
- h1_missing: 0
- h1_multiple: 0
- og_incomplete: 1
- twitter_incomplete: 1
- schema_missing: 0
- schema_invalid: 0

## Non-Blocking Warnings

- **OG_INCOMPLETE** (1): Indexable HTML pages with incomplete Open Graph tags.
  - https://aggressorbulkit.online/
- **TWITTER_INCOMPLETE** (1): Indexable HTML pages with incomplete X/Twitter card tags.
  - https://aggressorbulkit.online/

## Files

- Machine summary: `output/seo-crawl-gate/latest/summary.json`
- Crawled page details: `output/seo-crawl-gate/latest/pages.json`
- Link details: `output/seo-crawl-gate/latest/links.json`
- Issue details: `output/seo-crawl-gate/latest/issues.json`
- Cache summary: `.seo-cache/live-crawl-summary.json`

## Limitations

- This is a bounded live crawl, not an Ahrefs replacement for historical external crawl metrics.
- The crawl is capped at 500 pages; sitemap contains 1562 URLs.
- The gate validates current live HTML/link contracts and metadata basics; it does not submit URLs to GSC, IndexNow, or Ahrefs.

## Next Safe SEO Action

Use this gate as the local replacement for the blocked Ahrefs recrawl, then continue P1 crawl architecture work: source archive/internal links, query-state canonical/noindex policy, shared OG/X metadata, schema validation, and sitemap canonical hygiene.

