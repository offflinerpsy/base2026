# AY Style Deploy Checklist

## Release Name

Recommended release name:

`base2026-public-ay-style`

## Must Verify Before Deploy

- `web/static/meili.html` uses `Source Sans 3`, not Manrope/Space Grotesk.
- `web/static/meili.html` brand is `Alex Yarosh`, not `AI-Visibility`.
- `web/static/styles.css` uses the light main-site visual tokens from `VISUAL_SYSTEM_CONTRACT.md`.
- `/knowledge/` still contains all InstantSearch mount points.
- `web/static/meili.js` syntax check passes.
- public export policy check passes.

## Required Commands When Shell Is Available

```powershell
git status --short --branch
node --check web\static\meili.js
python -m py_compile scripts\export-public-tiktok.py scripts\check-public-export-policy.py
python scripts\check-public-export-policy.py public-data\tiktok
node scripts\tiktok-caption-browser-extract.mjs --queue config\tiktok-intake-queue.20260608.json --out .planning\tiktok-caption-extract-smoke.jsonl --limit 4
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\package-public-release.ps1 -ReleaseName base2026-public-ay-style -MeiliUrl /knowledge-search
```

## Required Browser QA

- desktop screenshot for `/knowledge/?q=AI%20Overviews`;
- mobile screenshot for `/knowledge/?q=AI%20Overviews`;
- verify results render;
- verify facets render;
- verify highlighted terms are visible;
- verify source record dialog opens and text is readable;
- compare visual tone against `https://aggressorbulkit.online/`;
- compare against `output/evidence/knowledge-ay-light-preview.png`.

## Required VPS Checks

- upload release zip only, not raw/private data;
- switch `/var/www/base2026-knowledge/current`;
- keep nginx `/knowledge-search/multi-search` Authorization injection;
- verify `/knowledge/`;
- verify `/knowledge/methodology.html`;
- verify `/knowledge/opt-out.html`;
- verify `/knowledge-search/multi-search` returns results.
