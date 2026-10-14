# Internal Link & Anchor Auditor

See which pages receive links in your export, which source pages link to them and how the anchor text is distributed. Keep missing coverage separate from an actual site problem.

## Inputs

- **Inlinks CSV**: Required: source,target,anchor,follow. One occurrence per row; repeats remain counted. follow accepts true/1/yes/follow or false/0/no/nofollow. Other values stay UNKNOWN.
- **URL inventory CSV (optional)**: Required when supplied: url,status,indexable. indexable uses true/1/yes or false/0/no. Conflicting rows stay unknown. An inventory URL with no observed links is not proof of an orphan page.

Machine-readable CSV semantics: [input-contract.json](./input-contract.json). This documents the CSV contract; it is not a JSON Schema validator for CSV cells.

## Result

A complete results CSV, findings CSV, readable Markdown report and JSON input manifest are created locally. The manifest includes input SHA-256 hashes, scope, counts and unknowns. No data is uploaded.

## Scope

- Counts occurrences and unique source URLs only in the supplied export. No crawl, actual orphan classification, crawl depth, live indexability or ranking effect is established. Without URL inventory, coverage is UNKNOWN.
- URLs keep exact identity after surrounding whitespace trimming, including case, trailing slash and query. Fragments, credentials, invalid URLs and links whose source or target is outside the selected origin are excluded and reported.
- Exact duplicate input rows remain link occurrences and are flagged. Inventory conflicts stay UNKNOWN; no first row wins. Known followed, known nofollow and unknown-follow counts stay separate.
- Anchors are grouped by Unicode NFC, lowercase and collapsed whitespace. Shared text across targets is SHARED_ANCHOR_TARGETS_REVIEW, not cannibalization. Generic examples are click here, read more, learn more, here and read the related guide; context may make them useful.
- Exports include per-target results, anchor frequencies and record details with every excluded input row. Empty anchors remain distinct from generic anchor examples.
- NO_INLINKS_IN_SUPPLIED_EXPORT means zero observed occurrences for an inventory URL. Even a supplied 200/true row is an unverified observation, not an indexability or orphan verdict.

## Source

Shared JavaScript: [engine.mjs](../../static/free-tools/engine.mjs), [worker.mjs](../../static/free-tools/worker.mjs), [app.mjs](../../static/free-tools/app.mjs), [tools.mjs](../../static/free-tools/tools.mjs). Additional source: [batch3.mjs](../../static/free-tools/batch3.mjs), [batch3-tools.mjs](../../static/free-tools/batch3-tools.mjs). The bounded CSV parser [sitemap-core.mjs](../../static/free-tools/sitemap-core.mjs) is reused unchanged. Browser interface: [index.html](./index.html). Keep the shared static directory and tool route directories together when serving locally over HTTP. See the [source package README for test reproduction](https://github.com/offflinerpsy/base2026/blob/main/packages/free-tools/README.md).

Code/interface: [Apache-2.0](../../static/free-tools/LICENSE). Manrope font: [SIL Open Font License](../../static/free-tools/OFL.txt). Repository: https://github.com/offflinerpsy/base2026.
