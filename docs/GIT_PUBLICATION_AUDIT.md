# Git Publication Audit

Date: 2026-06-06

## Commit Safe

- `.env.example`
- `.gitignore`
- `README.md`
- `SECURITY.md`
- `docs/`
- `scripts/`
- `web/static/`
- `10_agent-instructions/`
- public-safe readmes under `12_knowledge-base/`

## Do Not Commit

- `.planning/`
- `.playwright-mcp/`
- `output/`
- `meili_data/`
- `public-data/`
- `manifest.json`
- `00_sources/`
- `01_core-methodology/`
- `02_factor-maps/`
- `03_sops/`
- `04_checklists/`
- `05_templates/`
- `06_prompt-bank/`
- `07_client-workspaces/`
- `08_experiments/`
- `09_sales-packaging/`
- `11_dreamwood_offer/`
- `99_original_research/`
- `12_knowledge-base/indexes/`
- `12_knowledge-base/sources/`
- generated canonical claims/methods/risks/topic maps
- any `.env`, raw captions, ASR audio, screenshots, logs, release zips

## First Commit Shape

Recommended first commit:

```text
Initial Base2026 public TikTok knowledge app
```

Include only safe app code, docs, workflow scripts, and public-safe instructions.

Keep generated public export out of git. It is rebuilt by:

```powershell
python .\scripts\export-public-tiktok.py
```

