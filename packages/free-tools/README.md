# Base2026 local SEO tools

Five complete browser jobs: Robots.txt Tester, Redirect Map Checker, Hreflang Map Checker, Broken Link Task Builder and SEO Crawl Comparison. Each accepts pasted data or local UTF-8 files, runs in a Web Worker, and exports results CSV, findings CSV, a Markdown report and a JSON scope/input manifest. These are supplied-data utilities; no target URL is fetched, no data is uploaded, and no storage, analytics or model calls are used.

Repository source: [packages/free-tools](https://github.com/offflinerpsy/base2026/tree/main/packages/free-tools).

The tool pages are under `assets/tools/`; shared source is under `assets/static/free-tools/`. Serve the **assets** directory over HTTP and open one of the tool routes. The frozen sitemap/CSV module is reused byte-for-byte; P1's original source is not edited.

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory assets
```

Open `http://127.0.0.1:8000/tools/robots-txt-tester/`, or another route. This standard development server does not apply deployment CSP headers. To preview the response policy locally, run `python3 preview-server.py` instead; it binds a free loopback port and prints the URL. Production integration must apply the same-origin script/worker/style/font policy with `connect-src 'none'` in `CSP-RULES.txt` to both the tool pages and the shared Worker directory.

Rebuild the HTML, samples, public registry and asset manifest with `node build.mjs`. The required shared source, frozen parser, stylesheet, logo, font and licenses are already in `assets/static/free-tools/`; the builder does not read a private checkout. Run the checks from this package directory, without installing dependencies or contacting a service:

```sh
node tests.mjs
python3 oracle.py
python3 check-assets.py
```

The new suite was checked with Node.js 26.3.1 and Python 3.9.6. The tests include the five calculated examples, independent expected decisions, CSV/parser/Unicode/formula boundaries, ambiguous hreflang slots, the maximum redirect chain, and the exact shared Worker metadata/UTF-8/hash/export path. The Python standard-library oracle independently reads exported CSV and JSON. The asset check validates HTML contracts, metadata, local script/style references and source privacy boundaries. The commands write local technical evidence files; these are fixtures, not users, traffic or demand.

Limits: 5,000 data records per input, 2 MiB per file and 4 MiB combined; robots.txt is limited to 64 KiB and large rule×URL workloads must be split. Inputs are treated as inert text. CSV column aliases are explicit; malformed quoting, duplicate/ambiguous headers, inconsistent widths and oversized cells fail clearly. Exact URL identity is preserved after surrounding whitespace trimming. HTTP(S) only, no credentials or fragments. Coverage, time and API limitations stay with the result.

Robots matching uses the supplied Google-style user-agent groups, longest path match, Allow on a tie, wildcard `*`, terminal `$`, and percent-escape handling. It does not implement every crawler's behavior or fetch live robots.txt. Hreflang checks a supplied alternate map, not live tags or Google acceptance; language-tag **shape** is not a full ISO code registry check. Broken-link tasks require supplied 404/410 and inlinks; blocked/missing/conflicting statuses remain unknown and 5xx is review. Crawl comparison describes field changes and supplied coverage; it does not infer ranking causes or verify that either crawl was complete.

Source/interface code follows the repository Apache-2.0 LICENSE. The bundled Manrope font retains its own SIL Open Font License notice beside the font. All sample URLs and crawl dates are made up. No private operational receipts, real user input or credentials belong in this source package.
