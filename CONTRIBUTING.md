# Contributing

Base2026 is pre-release. Contributions should improve the public-safe code, docs, UI, data model, deployment flow, or local ingestion pipeline.

## Before You Start

Read:

- `AGENTS.md`
- `docs/project-memory/PUBLICATION_BOUNDARY.md`
- `docs/GIT_PUBLICATION_AUDIT.md`
- `docs/project-memory/NEXT_ACTION.md`

## Public Boundary

Do not add private research data, raw captions, media, generated exports, local databases, logs, cookies, tokens, API keys, SSH keys, or release archives.

Generated folders such as `public-data/` and `output/` are deploy artifacts, not source.

## Development Checks

Run the smallest checks that match the change:

```powershell
python -m py_compile scripts\export-public-tiktok.py scripts\check-public-export-policy.py scripts\generate-public-pages.py scripts\meili-index-public.py
node --check web\static\meili.js
python .\scripts\check-public-export-policy.py .\public-data\tiktok
```

For UI work, verify a rendered page and capture evidence when layout or interaction changes.

## Pull Request Expectations

- explain the user-facing change;
- list verification commands;
- call out any public/private data boundary risk;
- avoid broad refactors unless needed;
- keep docs and project memory current when workflow changes.
