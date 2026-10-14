# SEO Crawl Comparison

Compare the observations before and after a site change. Keep field changes separate from missing coverage and planned changes.

## Inputs

- **Before crawl CSV**: Required: url. Compare any shared columns: status,title,canonical,robots,h1,description,link_count. Standard header aliases are supported.
- **After crawl CSV**: Use the same columns and crawler scope where possible. Up to 5,000 rows per file. Exact URL joins; no automatic mapping between different URLs.

## Result

A complete results CSV, findings CSV, readable Markdown report and JSON input manifest are created locally. The manifest includes input SHA-256 hashes, scope, counts and unknowns. No data is uploaded.

## Scope

- Reports supplied snapshot changes, not live page behavior, a ranking effect or the cause of a traffic change.
- A URL found in one partial export is an observation about coverage, not proof that the page was added or deleted.
- Only shared supported fields are compared. Missing columns stay unknown. Invalid or conflicting duplicate rows are excluded from comparison.

## Source

Shared JavaScript: [engine.mjs](../../static/free-tools/engine.mjs), [worker.mjs](../../static/free-tools/worker.mjs), [app.mjs](../../static/free-tools/app.mjs), [tools.mjs](../../static/free-tools/tools.mjs). The bounded CSV parser [sitemap-core.mjs](../../static/free-tools/sitemap-core.mjs) is reused unchanged. Browser interface: [index.html](./index.html). Keep the shared static directory and tool route directories together when serving locally over HTTP. See the [source package README for test reproduction](https://github.com/offflinerpsy/base2026/blob/main/packages/free-tools/README.md).

Code/interface: [Apache-2.0](../../static/free-tools/LICENSE). Manrope font: [SIL Open Font License](../../static/free-tools/OFL.txt). Repository: https://github.com/offflinerpsy/base2026.
