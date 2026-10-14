# Redirect Rule Compiler

Turn your supplied map into an exact-path _redirects draft for Cloudflare static assets. Review excluded rows, then test the draft in staging before use.

## Inputs

- **Redirect mappings CSV**: Required headers: from,to. Optional: status. Use exact root-relative paths or HTTP(S) source URLs from one origin. Up to 2,000 mappings. Queries in either source or target are excluded.

## Result

A draft _redirects file, results CSV, findings CSV, readable Markdown report and JSON input manifest are created locally. The manifest includes input SHA-256 hashes, scope, counts and unknowns. No data is uploaded.

## Scope

- Emits a draft for exact paths in Cloudflare static assets _redirects only. It does not generate Workers routing, Bulk Redirects, Apache, NGINX or Vercel configuration. Test host routing, asset and Worker precedence, incoming-query behavior and redirects in staging. No server behavior is verified here.
- Queries in either source or target are excluded: this MVP does not choose query preservation or replacement behavior. Incoming request queries still require staging checks. Fragments, dot segments, protocol-relative URLs, whitespace, controls, wildcards, placeholders and ambiguous escapes are excluded.
- Absolute source URLs must have one origin. Mixed origins quarantine the entire batch; no first-row origin wins. With one origin, the draft paths apply to the deployment host, which you must verify. Paths keep exact case, slash and percent-escape spelling.
- Cycles, conflicting sources and paths reaching excluded mappings are withheld. Chain flattening is off by default; opting in permits only identical status codes. Terminal targets are supplied map endpoints, not verified live destinations.
- Local safety caps: 2,000 input rows, 4,096 characters per URL and 1,000 characters per emitted line. ASCII paths or unambiguous percent-encoded UTF-8 only. These bounds do not establish compatibility with your deployment.

## Source

Shared JavaScript: [engine.mjs](../../static/free-tools/engine.mjs), [worker.mjs](../../static/free-tools/worker.mjs), [app.mjs](../../static/free-tools/app.mjs), [tools.mjs](../../static/free-tools/tools.mjs). Additional source: [batch2.mjs](../../static/free-tools/batch2.mjs), [batch2-tools.mjs](../../static/free-tools/batch2-tools.mjs). The bounded CSV parser [sitemap-core.mjs](../../static/free-tools/sitemap-core.mjs) is reused unchanged. Browser interface: [index.html](./index.html). Keep the shared static directory and tool route directories together when serving locally over HTTP. See the [source package README for test reproduction](https://github.com/offflinerpsy/base2026/blob/main/packages/free-tools/README.md).

Code/interface: [Apache-2.0](../../static/free-tools/LICENSE). Manrope font: [SIL Open Font License](../../static/free-tools/OFL.txt). Repository: https://github.com/offflinerpsy/base2026.
