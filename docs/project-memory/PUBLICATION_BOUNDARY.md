# Publication Boundary

Base2026 has two layers:

1. public open-source product
2. private local research and operations assets

## Public-safe

- `AGENTS.md`
- `.env.example`
- `.gitignore`
- `README.md`
- `SECURITY.md`
- `docs/`
- `scripts/`
- `web/static/`
- `10_agent-instructions/`
- reviewed public-safe documentation under `12_knowledge-base/`

## Do not commit

- private research folders listed in `docs/GIT_PUBLICATION_AUDIT.md`
- `.env`
- secrets, cookies, API keys, tokens, SSH keys
- raw captions unless explicitly reviewed
- ASR audio/video
- logs
- screenshots unless intentionally documented
- release zips
- generated public export folders
- Meilisearch local data
- private client workspaces

## Deployable but not committed

- `public-data/tiktok`
- release folder under `output/releases`
- `web/static/documents.jsonl` inside release package

Reason: these are generated artifacts. They can be uploaded to VPS, but should not become GitHub source unless intentionally sampled.

## Pre-stage rule

Before any `git add`, run:

```powershell
git status --short --branch
```

Then compare staged candidates against:

- `docs/GIT_PUBLICATION_AUDIT.md`
- this file

