# Metadata CSV Auditor & Snippet Preview

Review the metadata in your export. Find missing or repeated titles and descriptions, then select a row to see an illustrative text preview.

## Inputs

- **Page metadata CSV**: Required: url,title,description. Optional: h1,og_title,og_description,og_image,twitter_card. Explicit crawler aliases are supported; duplicate or ambiguous headers are rejected.

Machine-readable CSV semantics: [input-contract.json](./input-contract.json). This documents the CSV contract; it is not a JSON Schema validator for CSV cells.

## Result

A complete results CSV, findings CSV, readable Markdown report and JSON input manifest are created locally. The manifest includes input SHA-256 hashes, scope, counts and unknowns. No data is uploaded.

## Scope

- Blank CSV records are ignored. Counts and exports cover the rows checked. Result rows are numbered sequentially and are not line numbers in your input file. No skipped-record count is inferred.
- Audits supplied CSV observations only. Missing columns are UNKNOWN; a supplied blank cell is MISSING. No live tags, URLs, image files, indexing or search results are verified.
- Character counts use Unicode code points after NFC normalization, whitespace collapse and trimming. They are not grapheme counts, pixel measurements, length recommendations or Google truncation limits.
- Duplicate titles/descriptions mean identical case-sensitive normalized text across distinct valid supplied URL strings. Repeated rows for one URL are reported separately; invalid URL rows stay visible but do not enter cross-URL duplicate groups.
- Title/H1 equality or difference is informational. It does not predict a Google title rewrite, quality, rankings or CTR. Social states inventory supplied text only; SUPPLIED does not validate tag syntax, image availability, dimensions or a rendered card.
- The selectable preview formats your supplied text illustratively. Google may choose different title or snippet text. It is not a live SERP or a device-specific simulation.
- CSV exports quote cells and prefix common spreadsheet formula-leading values with an apostrophe. Review imported spreadsheet behavior; exported copies are files you choose to retain.
- Supported aliases and normalization are documented in input-contract.json. No implicit column positions, fuzzy header matching or inferred social data.

## Source

Shared JavaScript: [engine.mjs](../../static/free-tools/engine.mjs), [worker.mjs](../../static/free-tools/worker.mjs), [app.mjs](../../static/free-tools/app.mjs), [tools.mjs](../../static/free-tools/tools.mjs). Additional source: [batch4.mjs](../../static/free-tools/batch4.mjs), [batch4-tools.mjs](../../static/free-tools/batch4-tools.mjs), [snippet-preview.mjs](../../static/free-tools/snippet-preview.mjs). The bounded CSV parser [sitemap-core.mjs](../../static/free-tools/sitemap-core.mjs) is reused unchanged. Browser interface: [index.html](./index.html). Keep the shared static directory and tool route directories together when serving locally over HTTP. See the [source package README for test reproduction](https://github.com/offflinerpsy/base2026/blob/main/packages/free-tools/README.md).

Code/interface: [Apache-2.0](../../static/free-tools/LICENSE). Manrope font: [SIL Open Font License](../../static/free-tools/OFL.txt). Repository: https://github.com/offflinerpsy/base2026.
