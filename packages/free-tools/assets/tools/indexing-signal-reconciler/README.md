# Indexing Signal Reconciler

Bring your crawl signals and optional sitemap or Search Console observations. See where the supplied evidence agrees, conflicts or leaves a question open.

## Inputs

- **Crawl signals CSV**: Required: url and at least one of status,robots,canonical. HTTP status must be a numeric code from 100 to 599. Up to 5,000 rows.
- **Sitemap URLs (optional)**: One absolute HTTP(S) URL per line, a CSV with url or loc, or an XML urlset. Up to 5,000 URLs. Omit this input to keep sitemap membership unknown.
- **Search Console observations CSV (optional)**: Prepare these explicit columns: url, with any of gsc_status,google_canonical,last_crawl. This is a user-prepared column contract, not automatic support for every native Search Console export.

## Result

A complete results CSV, findings CSV, readable Markdown report and JSON input manifest are created locally. The manifest includes input SHA-256 hashes, scope, counts and unknowns. No data is uploaded.

## Scope

- Reports observations in supplied files only. Aligned supplied signals do not establish live indexability, Google indexing, rankings or an outcome.
- Missing, invalid and conflicting observations remain distinct. Canonical targets outside the crawl or in conflicting crawl rows stay unknown. All applicable findings are exported; the primary label is only a review order.
- URL joins preserve the exact trimmed string, including case, query and trailing slash. Robots none means noindex and nofollow. Unrecognized directives cannot prove an index signal. Crawler-scoped directives are preserved as text but their applicability remains unknown.
- Search Console status and dates are supplied text, not API verification. No native coverage export layout is assumed. Missing sitemap or Search Console input stays unknown.

## Source

Shared JavaScript: [engine.mjs](../../static/free-tools/engine.mjs), [worker.mjs](../../static/free-tools/worker.mjs), [app.mjs](../../static/free-tools/app.mjs), [tools.mjs](../../static/free-tools/tools.mjs). Additional source: [batch2.mjs](../../static/free-tools/batch2.mjs), [batch2-tools.mjs](../../static/free-tools/batch2-tools.mjs). The bounded CSV parser [sitemap-core.mjs](../../static/free-tools/sitemap-core.mjs) is reused unchanged. Browser interface: [index.html](./index.html). Keep the shared static directory and tool route directories together when serving locally over HTTP. See the [source package README for test reproduction](https://github.com/offflinerpsy/base2026/blob/main/packages/free-tools/README.md).

Code/interface: [Apache-2.0](../../static/free-tools/LICENSE). Manrope font: [SIL Open Font License](../../static/free-tools/OFL.txt). Repository: https://github.com/offflinerpsy/base2026.
