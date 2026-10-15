# Base2026 local SEO tools

Ten complete browser jobs: Robots.txt Tester, Redirect Map Checker, Hreflang Map Checker, Broken Link Task Builder, SEO Crawl Comparison, Indexing Signal Reconciler, Redirect Rule Compiler, Internal Link & Anchor Auditor, GSC Period Change Analyzer, and Metadata CSV Auditor & Snippet Preview. Each accepts pasted data or local UTF-8 files, runs in a Web Worker, and exports results CSV, findings CSV, a Markdown report and a JSON scope/input manifest. These are supplied-data utilities; no target URL is fetched, no data is uploaded, and no storage, analytics or model calls are used.

Repository source: [packages/free-tools](https://github.com/offflinerpsy/base2026/tree/main/packages/free-tools).

The tool pages are under `assets/tools/`; shared source is under `assets/static/free-tools/`. Serve the **assets** directory over HTTP and open one of the tool routes. The frozen sitemap/CSV module is reused byte-for-byte; P1's original source is not edited.

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory assets
```

Open `http://127.0.0.1:8000/tools/robots-txt-tester/`, or another route. This standard development server does not apply deployment CSP headers. To preview the response policy locally, run `python3 preview-server.py` instead; it binds a free loopback port and prints the URL. Production integration must apply the same-origin script/worker/style/font policy with `connect-src 'none'` in `CSP-RULES.txt` to both the tool pages and the shared Worker directory.

Rebuild the HTML, samples, public registry and asset manifest with `node build.mjs`. The required shared source, frozen parser, stylesheet, logo, font and licenses are already in `assets/static/free-tools/`; the builder does not read a private checkout. Run the checks from this package directory, without installing dependencies or contacting a service:

```sh
node tests.mjs
node --test batch2.test.mjs
node --test batch3.test.mjs
node --test batch4.test.mjs
python3 oracle.py
python3 check-assets.py
```

The new suite was checked with Node.js 26.3.1 and Python 3.9.6. The tests include the five calculated examples, independent expected decisions, CSV/parser/Unicode/formula boundaries, ambiguous hreflang slots, the maximum redirect chain, and the exact shared Worker metadata/UTF-8/hash/export path. The Python standard-library oracle independently reads exported CSV and JSON. The asset check validates HTML contracts, metadata, local script/style references and source privacy boundaries. The commands write local technical evidence files; these are fixtures, not users, traffic or demand.

Limits: 5,000 data records per input (2,000 for Redirect Rule Compiler), 2 MiB per file and 4 MiB combined; robots.txt is limited to 64 KiB and large rule×URL workloads must be split. Inputs are treated as inert text. CSV column aliases are explicit; malformed quoting, duplicate/ambiguous headers, inconsistent widths and oversized cells fail clearly. Exact URL identity is preserved after surrounding whitespace trimming for the analysis tools. The redirect compiler rejects whitespace and never trims an emitted path. The analysis tools accept absolute HTTP(S) URLs without credentials or fragments; the compiler also accepts strict root-relative paths. Coverage, time and API limitations stay with the result.

Robots matching uses the supplied Google-style user-agent groups, longest path match, Allow on a tie, wildcard `*`, terminal `$`, and percent-escape handling. It does not implement every crawler's behavior or fetch live robots.txt. Hreflang checks a supplied alternate map, not live tags or Google acceptance; language-tag **shape** is not a full ISO code registry check. Broken-link tasks require supplied 404/410 and inlinks; blocked/missing/conflicting statuses remain unknown and 5xx is review. Crawl comparison describes field changes and supplied coverage; it does not infer ranking causes or verify that either crawl was complete.

Source/interface code follows the repository Apache-2.0 LICENSE. The bundled Manrope font retains its own SIL Open Font License notice beside the font. All sample URLs and crawl dates are made up. No private operational receipts, real user input or credentials belong in this source package.

Indexing Signal Reconciler accepts a required crawl CSV plus optional TXT/CSV/XML sitemap URLs and user-prepared Search Console observations with explicit url,gsc_status,google_canonical,last_crawl columns. Missing, invalid and conflicting evidence is kept separate; numeric status codes must be 100–599. It emits every applicable finding and a deterministic primary review label. Aligned supplied signals do not prove live indexability or Google indexing.

Redirect Rule Compiler emits only a draft Cloudflare static assets _redirects file, with results/findings CSV, Markdown report and JSON manifest. Test the draft in staging before use. Queries in sources and targets are excluded; no query-merging policy is invented. Mixed absolute source origins quarantine the entire batch. Cycles and paths reaching excluded/conflicting mappings are withheld. Chain flattening is off by default, and opt-in flattening requires identical codes in every hop. The compiler uses conservative URL/line caps and cannot verify host, asset or Worker routing. The additional implementation is in batch2.mjs and batch2-tools.mjs.


Internal Link & Anchor Auditor requires an explicit HTTP(S) site origin and an inlinks CSV with source,target,anchor,follow. It counts occurrences separately from unique source URLs, retains duplicate link rows, and exports anchor frequencies plus all input dispositions. Optional inventory with url,status,indexable adds supplied coverage; no observed inlinks does not establish an orphan. Foreign/invalid URLs and every URL containing a fragment marker are excluded. Inventory conflicts and unknown follow values stay unknown. Generic/shared anchors are contextual review findings, without a ranking score.

GSC Period Change Analyzer requires two CSVs and an explicit pages, queries or prepared-key mode. It rejects mixed key headers, keeps missing keys unknown, quarantines conflicting duplicate rows and never averages positions. Clicks and impressions are ungrouped nonnegative safe integers with clicks no greater than impressions. Provided CTR units are explicit percent or fraction; CTR for calculations is derived from valid counts, while raw supplied values remain in exports. Mismatches greater than 0.005 percentage points are flagged, allowing two decimal places of percent rounding or four decimal places of fraction rounding. Zero-impression CTR is unknown; a zero baseline has undefined percentage change. Optional symmetric click decomposition is descriptive and checks conservation; it is not an attribution model. Period length, property, search type and filters are not verified, and top-row/anonymized-query limitations remain visible.

Batch3 implementation is in `batch3.mjs` and `batch3-tools.mjs`; both tools publish an `input-contract.json` beside the page. The contracts document CSV semantics, not a claim that JSON Schema validates CSV cell contents. `batch3.test.mjs` covers the new fixtures and the unchanged shared Worker path. Previous seven tool pages, samples and calculations are preserved; full historical suites need not be rerun for an additive registration-only change.

Metadata CSV Auditor & Snippet Preview accepts one CSV with url,title,description and optional h1/OG/Twitter fields. It reports supplied missing values, case-sensitive normalized duplicates across distinct valid URL strings, Unicode code-point counts and informational title/H1 differences. Missing optional columns remain UNKNOWN; blank supplied cells are MISSING. Social values are text inventory, not image or tag validation. One selectable row is rendered with text nodes only; no supplied URL is linked or fetched. Google may choose other text. No pixel calibration, truncation/rewrite prediction or SEO score is implemented. Source: batch4.mjs, batch4-tools.mjs and snippet-preview.mjs; CSV semantics are in the tool input-contract.json.

Metadata CSV Auditor ignores blank CSV records. Counts and exports cover rows checked, and Result row numbers run sequentially from 1 without the header. They are not line numbers or original record positions in the input file. The additional rows-checked CSV preserves supplied values for rows checked only; the skipped-record count is unavailable.
