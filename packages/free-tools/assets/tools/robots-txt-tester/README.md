# Robots.txt Tester

See the matching rule for each supplied URL before you change robots.txt. Nothing is fetched or submitted.

## Inputs

- **robots.txt content**: Paste the file content or choose a UTF-8 .txt file. Maximum 64 KiB. Google-style Allow/Disallow matching; unsupported directives are reported.
- **URLs to test**: One absolute HTTP(S) URL per line, from one origin: the same scheme, host and port. Up to 5,000 URLs. The URLs are never visited.

## Result

A complete results CSV, findings CSV, readable Markdown report and JSON input manifest are created locally. The manifest includes input SHA-256 hashes, scope, counts and unknowns. No data is uploaded.

## Scope

- Tests supplied rules only; live robots.txt, HTTP status, page meta directives and indexing remain unknown.
- Allowing crawling does not guarantee indexing. A robots.txt block is not a noindex instruction.
- Supports Google-style group selection, Allow/Disallow, * and terminal $. Crawl-delay, Host, Noindex and unknown directives are displayed but not applied.

## Source

Shared JavaScript: [engine.mjs](../../static/free-tools/engine.mjs), [worker.mjs](../../static/free-tools/worker.mjs), [app.mjs](../../static/free-tools/app.mjs), [tools.mjs](../../static/free-tools/tools.mjs). The bounded CSV parser [sitemap-core.mjs](../../static/free-tools/sitemap-core.mjs) is reused unchanged. Browser interface: [index.html](./index.html). Keep the shared static directory and tool route directories together when serving locally over HTTP. See the [source package README for test reproduction](https://github.com/offflinerpsy/base2026/blob/main/packages/free-tools/README.md).

Code/interface: [Apache-2.0](../../static/free-tools/LICENSE). Manrope font: [SIL Open Font License](../../static/free-tools/OFL.txt). Repository: https://github.com/offflinerpsy/base2026.
