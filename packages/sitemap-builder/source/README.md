# Base2026 Sitemap Builder

Build a sitemap from a supplied URL list and compare it with one supplied XML urlset. The app runs in the browser, without a backend or external dependencies.

## Use it

Choose a UTF-8 TXT file with one absolute HTTP(S) URL per line, or CSV with one column or a `url`/`loc` header. Optionally choose one existing XML urlset. Select one host, build, review exclusions and download XML, CSV, JSON manifest or the readable report. Limits: 5,000 records per input, 2 MiB per file, 4 MiB combined.

Select **Try example** to calculate the synthetic `example.test` demo immediately, with no sample download or re-upload. The bundled inputs are byte-identical to the [sample URL list](./sample-urls.txt) and [sample sitemap](./sample-sitemap.xml). They pass through the same Worker import, hashing, parser and build functions as ordinary files. Only the demo host is selected automatically; your own file import still requires an explicit host selection.

The result reports the counts it calculates. Added means expected-only; missing means existing-only. Neither describes Google indexing. Choosing a file or **Clear files & results** invalidates the demo and previous results. Late replies from a replaced Worker are ignored.

After reviewing your own output, upload the XML to a public location on the selected host, commonly `/sitemap.xml`, and use its URL in your site’s sitemap configuration or search-engine submission tool. The app does not publish, submit or promise indexing.

## Source

- [core.mjs](./core.mjs): bounded parsing, exact URL classification, XML and report exports.
- [worker.mjs](./worker.mjs): in-memory file processing and SHA-256 input manifest.
- [app.mjs](./app.mjs): accessible preview, state reset and Blob downloads.
- [sample.mjs](./sample.mjs): immutable synthetic inputs used by **Try example**, without URL requests.
- [index.html](./index.html), [app.css](./app.css), [public.css](./public.css), [base2026-core.css](./base2026-core.css): interface and styling.

To run locally, keep these files together with `manrope-latin.woff2` and `b26-seal.webp`, then serve the folder over HTTP, for example `python3 -m http.server 8000 --bind 127.0.0.1`. Open the loopback server address printed by the development server. JavaScript, Web Workers and a secure browser context are required. Production hosting should retain a Content Security Policy with `connect-src 'none'`, same-origin scripts/workers/styles/fonts and no third-party analytics script on the tool page.

## Scope and privacy

Inputs and results remain in tab memory until cleared or closed. The app does not upload inputs, fetch target URLs, store files in localStorage, use analytics or call an AI model. Downloads are files the user chooses to keep. Paths, queries, case and trailing slashes are preserved; only exact duplicates are removed. Credentials and fragments are excluded. DOCTYPE, entity declarations, sitemap indexes and XML extensions are unsupported.

A sitemap is a supplied URL list. The app does not verify site coverage, HTTP status, canonical choice, lastmod accuracy or search-engine indexing. It never submits or publishes a sitemap. Ruleset: `base2026.sitemap-local/1.0.2`.

## License

Code and Base2026 interface files follow the repository's [Apache License 2.0](./LICENSE). The bundled Manrope font is covered by its [SIL Open Font License](./OFL.txt); keep that notice with the font. Repository: https://github.com/offflinerpsy/base2026.
