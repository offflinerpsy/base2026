# Broken Link Task Builder

Stop handing over a list of dead URLs without their source pages. Join your two exports and prepare a concrete repair list.

## Inputs

- **Response status CSV**: Required headers: url,status. Optional: observed_at. Only supplied 404/410 responses become broken-link tasks.
- **Inlinks CSV**: Required headers: source,target. Optional: anchor. A Screaming Frog-style From/To/Anchor Text export is also supported. Up to 5,000 records per file.

## Result

A complete results CSV, findings CSV, readable Markdown report and JSON input manifest are created locally. The manifest includes input SHA-256 hashes, scope, counts and unknowns. No data is uploaded.

## Scope

- A supplied 404/410 is evidence at the observation time, not a live check. A 403, 429, timeout, absent status or conflicting status is unknown; a 5xx needs review.
- Source pages and anchors come only from your supplied inlinks. Link counts are counts in this export, not a complete site graph.
- The output is a repair handoff. It never chooses replacements, edits links or submits changes.

## Source

Shared JavaScript: [engine.mjs](../../static/free-tools/engine.mjs), [worker.mjs](../../static/free-tools/worker.mjs), [app.mjs](../../static/free-tools/app.mjs), [tools.mjs](../../static/free-tools/tools.mjs). The bounded CSV parser [sitemap-core.mjs](../../static/free-tools/sitemap-core.mjs) is reused unchanged. Browser interface: [index.html](./index.html). Keep the shared static directory and tool route directories together when serving locally over HTTP. See the [source package README for test reproduction](https://github.com/offflinerpsy/base2026/blob/main/packages/free-tools/README.md).

Code/interface: [Apache-2.0](../../static/free-tools/LICENSE). Manrope font: [SIL Open Font License](../../static/free-tools/OFL.txt). Repository: https://github.com/offflinerpsy/base2026.
