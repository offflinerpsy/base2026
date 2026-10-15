# JSON-LD Graph Inspector

Paste raw JSON-LD to inspect its objects, types and @id references. Keep parsing, entity inventory and reference coverage separate while you review the supplied graph.

## Inputs

- **Raw JSON-LD**: Paste one JSON object or array, or choose a UTF-8 .json or .jsonld file. Exclude HTML and script tags. Maximum 2 MiB; no URL or remote context is requested.

Machine-readable inspection contract: [input-contract.json](./input-contract.json). This describes raw graph observations, not full JSON-LD or Schema.org validation.

## Result

A complete results CSV, findings CSV, readable Markdown report and JSON input manifest are created locally. The manifest includes input SHA-256 hashes, scope, counts and unknowns. No data is uploaded.

## Scope

- Inspect raw JSON-LD only. HTML extraction, URL requests, remote contexts, JSON-LD expansion and Schema.org vocabulary validation are not performed.
- Parsing, entity inventory and reference coverage are separate observations. Parsed JSON or matching references do not establish fully valid JSON-LD, Google rich-result eligibility, visible-page agreement, rankings or traffic effects.
- Objects in root arrays, @graph and nested properties are inspected. Empty objects, pure @graph/@context containers and @value/@list/@set wrappers are not entity rows; their nested objects are still inspected. Objects inside @context are counted for limits but are not entities.
- Only literal keywords are recognized. Contexts and aliases are not expanded or applied, and types are supplied labels rather than verified vocabulary terms. A missing context or type is not automatically an invalid graph.
- An @id-only reference has exactly one member, @id, with a string value. A definition has a string @id and another member besides @id or @context. Exact supplied strings match without trimming, URL normalization or base resolution; reference strings are not followed.
- An unmatched reference with a URI scheme has external-definition state UNKNOWN. Other unmatched strings, including fragments, relative paths, blank-node labels and the empty string, are local references not matched in this input. Neither observation proves that the published graph is broken.
- Several definition objects can share an @id. They are retained as multiple definitions for review; fragments are not inherently invalid. Merging, equivalence and conflicting-property semantics are not implemented.
- Native JSON.parse keeps the last value of repeated member names within one object; these duplicate member names are not separately diagnosed. Separate objects with the same @id are retained.
- Limits apply before a complete result is returned: 2 MiB UTF-8, 5,000 objects including contexts, 20,000 total values, 64 nested object/array levels, 16,384 UTF-16 units per string/member name and 4,096 per JSON pointer. Reduce or split the input if a limit is reached; partial inventories are not exported.
- CSV copies use the unchanged shared quoting and formula-prefix protection. Input and results stay in tab memory until cleared, navigation or closing; downloads are files you choose to keep.
- input-contract.json defines the raw inspection rules and result states. This tool does not run a JSON Schema or Google rich-result validator.

## Source

Shared JavaScript: [engine.mjs](../../static/free-tools/engine.mjs), [worker.mjs](../../static/free-tools/worker.mjs), [app.mjs](../../static/free-tools/app.mjs), [tools.mjs](../../static/free-tools/tools.mjs). Additional source: [batch5.mjs](../../static/free-tools/batch5.mjs), [batch5-tools.mjs](../../static/free-tools/batch5-tools.mjs). Raw input uses native JSON.parse with bounded iterative inspection. CSV exports reuse the unchanged shared serializer in [sitemap-core.mjs](../../static/free-tools/sitemap-core.mjs). Browser interface: [index.html](./index.html). Keep the shared static directory and tool route directories together when serving locally over HTTP. See the [source package README for test reproduction](https://github.com/offflinerpsy/base2026/blob/main/packages/free-tools/README.md).

Code/interface: [Apache-2.0](../../static/free-tools/LICENSE). Manrope font: [SIL Open Font License](../../static/free-tools/OFL.txt). Repository: https://github.com/offflinerpsy/base2026.
