# Hreflang Map Checker

Bring your alternate URL map. Review conflicting language targets, self references and return links in the data you supplied.

## Inputs

- **Hreflang map CSV**: Required headers: page_url,hreflang,alternate_url. One alternate link per row. Up to 5,000 rows. Include all pages you want to compare.

## Result

A complete results CSV, findings CSV, readable Markdown report and JSON input manifest are created locally. The manifest includes input SHA-256 hashes, scope, counts and unknowns. No data is uploaded.

## Scope

- Checks the supplied map only. It does not fetch page HTML, HTTP headers, canonicals or Google indexing.
- A return link can be checked only when the destination page is present in the supplied map. Missing maps and links in conflicting language slots remain unknown.
- Language-tag shape is checked, not every ISO language/region assignment or Google support. Conflicting language slots are excluded from self-reference and return-link inference.

## Source

Shared JavaScript: [engine.mjs](../../static/free-tools/engine.mjs), [worker.mjs](../../static/free-tools/worker.mjs), [app.mjs](../../static/free-tools/app.mjs), [tools.mjs](../../static/free-tools/tools.mjs). The bounded CSV parser [sitemap-core.mjs](../../static/free-tools/sitemap-core.mjs) is reused unchanged. Browser interface: [index.html](./index.html). Keep the shared static directory and tool route directories together when serving locally over HTTP. See the [source package README for test reproduction](https://github.com/offflinerpsy/base2026/blob/main/packages/free-tools/README.md).

Code/interface: [Apache-2.0](../../static/free-tools/LICENSE). Manrope font: [SIL Open Font License](../../static/free-tools/OFL.txt). Repository: https://github.com/offflinerpsy/base2026.
