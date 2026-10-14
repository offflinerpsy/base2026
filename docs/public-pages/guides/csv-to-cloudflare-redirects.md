---
title: "Convert a Redirect CSV to a Cloudflare _redirects File | Base2026"
description: "Convert a redirect CSV to a Cloudflare _redirects file. Reproduce the example, review excluded rows and verify routing on staging."
canonical: "https://base2026.dev/guides/csv-to-cloudflare-redirects/"
og_image: "https://base2026.dev/static/assets/tools-studio/tools-studio-social.png"
---

# Convert a redirect CSV to a Cloudflare `_redirects` file

Use the [Redirect Rule Compiler](/tools/redirect-rule-compiler/) to turn a CSV map into a draft for Cloudflare static assets. The six-row example below produces three rules you can inspect, download and test on staging.

The compiler processes your supplied data locally. It does not visit the URLs, change your Cloudflare configuration or deploy the file. Start by reproducing the example, then adapt a copy for your own site.

## 1. Prepare a CSV with the destinations you intend

Use `from,to` headers and an optional `status` column. This example uses made-up paths:

```csv
from,to,status
/old-guide,/middle-guide,301
/middle-guide,/guides/current/,301
/temporary,/offers/,302
/conflict,/one/,301
/conflict,/two/,301
/unsafe?item=9,/catalog/,301
```

<a href="./sample-map.csv" download>Download the six-row CSV</a>, or copy the block into the tool. Its **Try an example** button loads the same mappings.

Use exact root-relative paths, or HTTP(S) source URLs from one origin. Keep case, percent escapes and trailing slashes as intended: `/guide` and `/guide/` are different inputs. Mixed absolute source origins cause the entire batch to be withheld. A generated root-relative rule applies on the deployment host; a hostname in your CSV does not configure a domain redirect.

Choose the replacement content before compiling. The [redirect map checklist](/guides/redirect-map-checklist/) helps review that decision and the map's connections. Do not remove a query string just to make a row pass: it may distinguish content that needs a different routing decision.

## 2. Compile with chain flattening off

In the compiler:

1. Paste the CSV into **Redirect mappings CSV**, or choose the downloaded file. A selected file takes precedence over pasted text.
2. Keep **Default redirect status** at `301`.
3. Leave **Flatten chains with identical status codes** unchecked.
4. Select **Compile the draft**.

The sample supplies a status on every row, so the default does not override any of them. For your own map, a blank status uses the selected default. The compiler supports `301`, `302`, `307` and `308` and writes each code explicitly.

With those settings, the result is **6 input mappings, 3 draft rules, 3 excluded mappings and 0 flattened chains**. The draft is sorted by source path:

```text
/middle-guide /guides/current/ 301
/old-guide /middle-guide 301
/temporary /offers/ 302
```

<a href="./sample-redirects.txt" download>Download this exact sample draft</a>. It contains 88 UTF-8 bytes, with LF line endings and a final newline. The `.txt` filename makes this example easy to inspect; the file used in your project's asset directory must be named `_redirects`, without an extension.

The output is a plan derived from the CSV. It does not establish that `/guides/current/` exists or that the server will return any of these responses.

## 3. Resolve the excluded rows and review the retained chain

A smaller draft does not mean the whole map is ready. Review the findings before using it:

| Supplied mapping | What the compiler does | Your next decision |
| --- | --- | --- |
| `/old-guide` → `/middle-guide` → `/guides/current/`, both 301 | Retains both hops because flattening is off. | Decide whether the intermediate hop is intentional. |
| `/temporary` → `/offers/`, 302 | Keeps the supplied 302. | Confirm that the move is temporary and the offer is the right destination. |
| Two targets for `/conflict` | Excludes both rows. | Choose the intended target; the compiler does not pick the first row. |
| `/unsafe?item=9` → `/catalog/` | Excludes the row because the source contains a query. | Decide how the query identifies the request and use a routing approach that supports that requirement. |

Correct the conflict in your source CSV and rerun it. The compiler excludes queries in either the source or destination. Keep any unresolved query-dependent mapping in your review notes so it is not mistaken for a completed redirect. Cycles and paths that reach an excluded mapping are also withheld.

Use 301 for an intended permanent move and 302 for an intended temporary move, as described in [Google's redirect guidance](https://developers.google.com/search/docs/crawling-indexing/301-redirects). Chain flattening is an optional content and routing decision. When enabled, this compiler can shorten a supplied chain only when every hop has the same status code; it retains mixed-status chains. Do not flatten a 301 → 302 sequence by silently turning the temporary hop into a permanent move. Neither setting verifies the live destination.

## 4. Fit the draft to your Cloudflare project

Cloudflare's [static assets redirect documentation](https://developers.cloudflare.com/workers/static-assets/redirects/) defines one rule per line as `[source] [destination] [code?]`. Cloudflare uses 302 when the code is omitted; the compiler's default is 301 for blank CSV statuses, and its draft includes the code on every line.

Put the reviewed `_redirects` file in the configured static asset directory. In a framework project, a `public/` or `static/` source directory is suitable only if the build copies that file into the final asset output. Inspect the built output before staging.

Review the existing `_redirects` file before merging a draft. For multiple rules with the same source path, Cloudflare documents that the top-most rule applies. Preserve existing intentional rules and check for overlap. The compiler sorts its exact-path output; it does not inspect your project's other redirect layers.

Cloudflare permits up to 2,000 static and 100 dynamic redirects, with a 1,000-character limit per declaration. This compiler accepts at most 2,000 mappings and 2 MiB per CSV. It emits exact paths only and excludes wildcards, placeholders, fragments and queries. Cloudflare supports some syntax that this tool deliberately leaves out; a compiler result is not a check of every platform limit or deployment setting.

Check which handler serves each old path. Cloudflare warns that `_redirects` rules do not apply to requests served by Worker code. Its [Worker routing documentation](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/) explains asset-first behavior and the `assets.run_worker_first` setting. For Pages projects, the [Pages redirect documentation](https://developers.cloudflare.com/pages/configuration/redirects/) gives the corresponding exception for requests served by Pages Functions. A file copied into an asset directory cannot replace redirect logic in the handler that actually serves the request.

## 5. Test the status, destination and queries on staging

Deploy the reviewed draft through your project's normal staging process. Use an HTTP client or crawler that records status codes, `Location` headers and every hop. Replace the reserved example host below with your real staging hostname:

```sh
curl -sS -D - -o /dev/null "https://staging.example.test/old-guide"
curl -sS -L -D - -o /dev/null --max-redirs 10 "https://staging.example.test/old-guide"
curl -sS -D - -o /dev/null "https://staging.example.test/old-guide?utm_source=redirect-test"
```

The first command inspects one response. The second follows redirects and prints each response's headers. With the unflattened example, inspect the planned 301 to `/middle-guide`, then the planned 301 to `/guides/current/`. Confirm the final page's real response and content separately.

The third command tests an incoming query on an otherwise supported path. Excluding queries from the CSV does not establish what happens to query parameters on real requests. Cloudflare's format allows query strings in destinations but does not support query-parameter matching. Decide the query behavior you need, then inspect the actual `Location` and final URL on your deployment. Do not infer preservation or removal from the compiler's result.

Before accepting the change, record these checks:

- Each emitted source returns the intended status and `Location` on the intended host.
- The complete chain reaches the correct content without a loop or an unintended hop.
- The temporary mapping still returns its planned 302.
- Relevant query, case and trailing-slash variants behave as intended.
- Static asset and Worker- or Function-handled routes use the routing layer you expected.
- The destinations, internal links and final canonical URLs match the reviewed content plan.

Keep the reviewed CSV, draft, compiler findings and staging observations together. After release, repeat the response checks on the public host and update the internal links you control to the final URLs. The [crawl comparison guide](/guides/compare-seo-crawl-exports/) explains how to compare equivalent exports for changed status, canonical and robots fields without treating an absent row as proof that a page was deleted.

