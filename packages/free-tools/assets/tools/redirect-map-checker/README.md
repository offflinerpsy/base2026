# Redirect Map Checker

Check the redirect plan you already have. Find conflicting mappings and follow chains without sending a request to your site.

## Inputs

- **Redirect mappings CSV**: Required headers: from,to. Optional: status. Absolute HTTP(S) URLs only. Up to 5,000 mappings. Missing status stays unknown.

## Result

A complete results CSV, findings CSV, readable Markdown report and JSON input manifest are created locally. The manifest includes input SHA-256 hashes, scope, counts and unknowns. No data is uploaded.

## Worked example

All example URLs are synthetic and use https://example.test.

1. Use **Try an example**, then **Check the redirect map**, or load [the original CSV](./sample-map.csv). Expect 1 multi-hop source, 2 sources entering loops and 1 conflicting source. 4 sources appear in the result table. The two rows for /conflict count as one conflicting source and are excluded from that table.
2. Review the changes below. A hop is one planned redirect from a source to its next target.
3. Download [the corrected CSV](./sample-map-corrected.csv), choose it in the local file input and run the check again. A selected file is used instead of pasted text.

- **Chain: /old → /middle → /new.** The /old source takes two planned hops to reach /new. Point /old directly to /new. Keep /middle → /new for visits to the old middle URL.
- **Loop: /a → /b → /a.** Neither source reaches a terminal target in this map. Choose an intended destination. In this example, point both /a and /b directly to /new; keep their supplied 302 status.
- **Conflicting source: /conflict → /one and /conflict → /two.** One source has two different targets. It is excluded from chain resolution until you choose a mapping. Confirm which destination is intended and keep one mapping. This example keeps /conflict → /one.

The corrected run should show 5 valid unique sources, 0 conflicting sources, 0 sources entering loops and 0 multi-hop sources. All 5 result rows have one planned hop. These destinations are choices for the made-up site, not suggested destinations for your own URLs.

Confirm intended destinations and status codes before implementing a plan, then test the deployed redirects and target responses. No listed map issues does not establish live HTTP status, target-page availability or indexing.

## Scope

- This checks a supplied plan, not live redirects or response headers. Final targets are terminal entries in the map, not verified 200 pages.
- URL identity is exact after surrounding whitespace is trimmed. Case, query and trailing slash are preserved.
- Conflicting sources are excluded from chain resolution. You decide which mapping is correct; the tool never changes your server.

## Source

Shared JavaScript: [engine.mjs](../../static/free-tools/engine.mjs), [worker.mjs](../../static/free-tools/worker.mjs), [app.mjs](../../static/free-tools/app.mjs), [tools.mjs](../../static/free-tools/tools.mjs). The bounded CSV parser [sitemap-core.mjs](../../static/free-tools/sitemap-core.mjs) is reused unchanged. Browser interface: [index.html](./index.html). Keep the shared static directory and tool route directories together when serving locally over HTTP. See the [source package README for test reproduction](https://github.com/offflinerpsy/base2026/blob/main/packages/free-tools/README.md).

Code/interface: [Apache-2.0](../../static/free-tools/LICENSE). Manrope font: [SIL Open Font License](../../static/free-tools/OFL.txt). Repository: https://github.com/offflinerpsy/base2026.
