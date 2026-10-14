# Redirect Map Checker

Check the redirect plan you already have. Find conflicting mappings and follow chains without sending a request to your site.

## Inputs

- **Redirect mappings CSV**: Required headers: from,to. Optional: status. Absolute HTTP(S) URLs only. Up to 5,000 mappings. Missing status stays unknown.

## Result

A complete results CSV, findings CSV, readable Markdown report and JSON input manifest are created locally. The manifest includes input SHA-256 hashes, scope, counts and unknowns. No data is uploaded.

## Scope

- This checks a supplied plan, not live redirects or response headers. Final targets are terminal entries in the map, not verified 200 pages.
- URL identity is exact after surrounding whitespace is trimmed. Case, query and trailing slash are preserved.
- Conflicting sources are excluded from chain resolution. You decide which mapping is correct; the tool never changes your server.

## Source

Shared JavaScript: [engine.mjs](../../static/free-tools/engine.mjs), [worker.mjs](../../static/free-tools/worker.mjs), [app.mjs](../../static/free-tools/app.mjs), [tools.mjs](../../static/free-tools/tools.mjs). The bounded CSV parser [sitemap-core.mjs](../../static/free-tools/sitemap-core.mjs) is reused unchanged. Browser interface: [index.html](./index.html). Keep the shared static directory and tool route directories together when serving locally over HTTP. See the [source package README for test reproduction](https://github.com/offflinerpsy/base2026/blob/main/packages/free-tools/README.md).

Code/interface: [Apache-2.0](../../static/free-tools/LICENSE). Manrope font: [SIL Open Font License](../../static/free-tools/OFL.txt). Repository: https://github.com/offflinerpsy/base2026.
