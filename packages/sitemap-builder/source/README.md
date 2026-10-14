# Base2026 Sitemap Builder

Build a sitemap from a supplied URL list and compare it with one supplied XML urlset. The app runs in the browser, without a backend or external dependencies.

## Use it

Choose a UTF-8 TXT file with one absolute HTTP(S) URL per line, or CSV with one column or a `url`/`loc` header. Optionally choose one existing XML urlset. Select one host, build, review exclusions and download XML, CSV, JSON manifest or the readable report. Limits: 5,000 records per input, 2 MiB per file, 4 MiB combined.

The included [sample URL list](./sample-urls.txt) and [sample sitemap](./sample-sitemap.xml) use made-up `example.test` URLs. With both imported, choose `example.test`: 3 included, 2 added, 1 missing and 1 duplicate. Added is expected-only; missing is existing-only.

## Source

- [core.mjs](./core.mjs): bounded parsing, exact URL classification, XML and report exports.
- [worker.mjs](./worker.mjs): in-memory file processing and SHA-256 input manifest.
- [app.mjs](./app.mjs): accessible preview, state reset and Blob downloads.
- [index.html](./index.html), [app.css](./app.css), [public.css](./public.css), [base2026-core.css](./base2026-core.css): interface and styling.

To run locally, keep these files together with `manrope-latin.woff2` and `b26-seal.webp`, then serve the folder over HTTP, for example `python3 -m http.server 8000 --bind 127.0.0.1`. Open `http://127.0.0.1:8000/`. JavaScript, Web Workers and a secure browser context are required. Production hosting should retain a Content Security Policy with `connect-src 'none'`, same-origin scripts/workers/styles/fonts and no third-party analytics script on the tool page.

## Scope and privacy

Inputs and results remain in tab memory until cleared or closed. The app does not upload inputs, fetch target URLs, store files in localStorage, use analytics or call an AI model. Downloads are files the user chooses to keep. Paths, queries, case and trailing slashes are preserved; only exact duplicates are removed. Credentials and fragments are excluded. DOCTYPE, entity declarations, sitemap indexes and XML extensions are unsupported.

A sitemap is a supplied URL list. The app does not verify site coverage, HTTP status, canonical choice, lastmod accuracy or search-engine indexing. It never submits or publishes a sitemap. Ruleset: `base2026.sitemap-local/1.0.2`.

## License

Code and Base2026 interface files follow the repository's [Apache License 2.0](./LICENSE). The bundled Manrope font is covered by its [SIL Open Font License](./OFL.txt); keep that notice with the font. Repository: https://github.com/offflinerpsy/base2026.
