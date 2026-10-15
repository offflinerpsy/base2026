# JSON-LD Graph Inspector

Paste raw JSON-LD to inspect its objects, types and @id references. Keep parsing, entity inventory and reference coverage separate while you review the supplied graph.

## Inputs

- **Raw JSON-LD**: Paste one JSON object or array, or choose a UTF-8 .json or .jsonld file. Exclude HTML and script tags. Maximum 2 MiB; no URL or remote context is requested.

Machine-readable inspection contract: [input-contract.json](./input-contract.json). This describes raw graph observations, not full JSON-LD or Schema.org validation.

## Result

A complete results CSV, findings CSV, readable Markdown report and JSON input manifest are created locally. The manifest includes input SHA-256 hashes, scope, counts and unknowns. No data is uploaded.

The compact browser preview uses Entity, Type, Reference and Details columns. Expand Raw fields for every original inventory field and Machine rule and source for finding codes. The results CSV retains all 12 columns and all calculated rows; the preview shows 30 rows at a time.

## Worked example: add a missing publisher

This is a synthetic Article, Person and Organization, not a client result.

1. Select **Try an example**, then **Inspect the graph**, or load [the original JSON-LD](./sample-schema_input.json). The publisher reference is unmatched locally; the external license definition is UNKNOWN.
2. Compare [the corrected JSON-LD](./sample-schema_input-corrected.json). It adds only {"@id":"#publisher","@type":"Organization","name":"Example Publishing"} to @graph. Use real entity details for your own content.
3. Choose the corrected file in the local JSON file input and run again. Choosing a file replaces pasted text. Editing the text clears the selected file and previous results; **Clear data & results** empties both. Exact @id strings must match; no base resolution is performed.

| Observation | Original | Corrected |
| --- | --- | --- |
| Parsing | Parsed JSON | Parsed JSON |
| Entity inventory | Inventoried | Inventoried |
| Reference coverage | Local gaps; external unknown | External definitions unknown |
| Typed entity objects | 2 | 3 |
| Entity rows | 5 | 6 |
| ID-only references | 3 | 3 |
| References matched in input | 1 | 2 |
| Local references not matched | 1 | 0 |
| External definitions unknown | 1 | 1 |

The first six observations are summary cards. Reference counts are recorded in the JSON manifest scope, with individual states in the entity rows and findings. The #publisher reference changes from LOCAL_REFERENCE_NOT_MATCHED to MATCHED_ONE_DEFINITION_IN_INPUT. The external license stays EXTERNAL_DEFINITION_UNKNOWN. The corrected summary still says “External definitions unknown”.

This demonstrates improved reference coverage only. It does not establish JSON-LD semantic validity, Schema.org conformance, Google rich-result eligibility or visible-page agreement. Review the real publisher and article content, then use checks appropriate to the intended structured-data feature. The page, license and remote context are not fetched.

## Questions about JSON-LD inspection

### Can I paste a page’s HTML?

Supply the raw JSON inside an application/ld+json script, without the script tags or surrounding HTML. Paste one JSON object or array. This inspector does not extract HTML or request a page URL. If a page has separate scripts, inspect each separately or prepare a combined array yourself; unmatched references describe only the input you supplied.

### Why is #publisher unmatched while the license is UNKNOWN?

The original input contains an @id-only #publisher reference without a definition using that exact string. Adding the synthetic Organization covers that local reference. The license uses an absolute @id with a URI scheme, but no definition with that exact string is supplied. No request is made, so its external definition stays UNKNOWN. Neither finding proves that the published graph is broken.

### Does Parsed JSON mean valid Schema.org or Google rich results?

Parsed JSON means JSON.parse accepted the syntax. The inspector then inventories literal objects, types and exact @id strings. It does not expand contexts, validate Schema.org vocabulary, compare visible page content or determine Google rich-result eligibility. Review the real content and applicable structured-data requirements separately.

### Are multiple definitions for one @id invalid?

Several objects may describe the same entity with the same @id. The inspector retains them and reports multiple definitions for review. It does not merge them or decide whether their properties conflict. Repeated member names inside a single object are different: native JSON.parse keeps the last value, and the inspector does not separately diagnose those duplicate names.

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

Shared JavaScript: [engine.mjs](../../static/free-tools/engine.mjs), [worker.mjs](../../static/free-tools/worker.mjs), [app.mjs](../../static/free-tools/app.mjs), [tools.mjs](../../static/free-tools/tools.mjs). Additional source: [batch5.mjs](../../static/free-tools/batch5.mjs), [batch5-tools.mjs](../../static/free-tools/batch5-tools.mjs), [jsonld-results.mjs](../../static/free-tools/jsonld-results.mjs). Raw input uses native JSON.parse with bounded iterative inspection. CSV exports reuse the unchanged shared serializer in [sitemap-core.mjs](../../static/free-tools/sitemap-core.mjs). Browser interface: [index.html](./index.html). Keep the shared static directory and tool route directories together when serving locally over HTTP. See the [source package README for test reproduction](https://github.com/offflinerpsy/base2026/blob/main/packages/free-tools/README.md).

Code/interface: [Apache-2.0](../../static/free-tools/LICENSE). Manrope font: [SIL Open Font License](../../static/free-tools/OFL.txt). Repository: https://github.com/offflinerpsy/base2026.
