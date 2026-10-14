# GSC Period Change Analyzer

Compare two exported periods without uploading client data. Review the largest observed changes, keep missing rows unknown and use a descriptive click decomposition when both periods have impressions.

## Inputs

- **Before period CSV**: English headers only: Page / Top pages / URL, Query / Top queries, or Key; plus Clicks and Impressions. Optional CTR and Position / Average position. Counts are ungrouped nonnegative integers.
- **After period CSV**: Use the same key type and comparable period length, search type and filters. These conditions cannot be verified from the CSV. Missing rows are UNKNOWN, never zero.

Machine-readable CSV semantics: [input-contract.json](./input-contract.json). This documents the CSV contract; it is not a JSON Schema validator for CSV cells.

## Result

A complete results CSV, findings CSV, readable Markdown report and JSON input manifest are created locally. The manifest includes input SHA-256 hashes, scope, counts and unknowns. No data is uploaded.

## Scope

- Describes supplied exported rows only. Period length, search type, filters and property comparability are NOT VERIFIED. GSC exports can be limited to top rows; anonymized queries and omitted rows prevent treating the export as complete property totals.
- Missing rows, blank metrics, invalid metrics and conflicting duplicate keys stay distinct. Exact identical rows may collapse with notice; conflicting rows are quarantined. Positions are never aggregated across duplicates.
- CTR is clicks / impressions when impressions are positive. With zero impressions, CTR and decomposition are UNKNOWN. Percentage change from a zero baseline is undefined, not Infinity. Lower position numbers are better; the reported position delta is after minus before.
- No algorithm penalty, technical cause, ranking explanation or guaranteed opportunity is inferred. Findings identify observed deltas and evidence needing review, without a confidence or SEO score.
- Supported English aliases: page/top pages/url; query/top queries; key; clicks; impressions; ctr; position/average position. Header matching ignores case and maps spaces or hyphens to underscores. Any two headers mapping to one field are ambiguous and rejected.
- Clicks and impressions must be safe nonnegative integers, with clicks <= impressions. Position is optional, finite and positive when observed. Provided CTR is retained raw; a mismatch exceeding 0.00005 in fractional CTR (0.005 percentage points plus floating-point tolerance) is flagged. This allows rounding to two decimals in percent units or four decimals in fraction units.
- Symmetric decomposition: impression component = (I1-I0)*(CTR0+CTR1)/2; CTR component = (CTR1-CTR0)*(I0+I1)/2. Their sum equals the click delta within a reported floating-point tolerance. The split is descriptive, not a causal attribution.
- A delta is calculated only when both corresponding metrics are valid. Coverage-only and conflicted keys remain in results with UNKNOWN deltas. Metric details export preserves provided raw values, validation states and numeric values.

## Source

Shared JavaScript: [engine.mjs](../../static/free-tools/engine.mjs), [worker.mjs](../../static/free-tools/worker.mjs), [app.mjs](../../static/free-tools/app.mjs), [tools.mjs](../../static/free-tools/tools.mjs). Additional source: [batch3.mjs](../../static/free-tools/batch3.mjs), [batch3-tools.mjs](../../static/free-tools/batch3-tools.mjs). The bounded CSV parser [sitemap-core.mjs](../../static/free-tools/sitemap-core.mjs) is reused unchanged. Browser interface: [index.html](./index.html). Keep the shared static directory and tool route directories together when serving locally over HTTP. See the [source package README for test reproduction](https://github.com/offflinerpsy/base2026/blob/main/packages/free-tools/README.md).

Code/interface: [Apache-2.0](../../static/free-tools/LICENSE). Manrope font: [SIL Open Font License](../../static/free-tools/OFL.txt). Repository: https://github.com/offflinerpsy/base2026.
