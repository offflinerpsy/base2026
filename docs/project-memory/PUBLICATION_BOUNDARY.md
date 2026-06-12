# Publication Boundary

Base2026 has two layers:

1. public open-source product
2. private local research and operations assets

## Public-safe

- `AGENTS.md`
- `.env.example`
- `.gitignore`
- `requirements-local-worker.txt`
- `README.md`
- `SECURITY.md`
- `docs/`
- `docs/public-pages/` public Markdown used to generate site info pages
- `scripts/`
- `contracts/`
- public-safe test fixtures under `tests/fixtures/public-export-*`
- `web/static/`
- `10_agent-instructions/`
- reviewed public-safe documentation under `12_knowledge-base/`
- `config/creator-profiles.json`
- public-safe examples under `config/`, such as `config/creators.example.json`

## Do not commit

- private research folders listed in `docs/GIT_PUBLICATION_AUDIT.md`
- `.env`
- secrets, cookies, API keys, tokens, SSH keys
- raw captions unless explicitly reviewed
- ASR audio/video
- logs
- screenshots unless intentionally documented
- release zips
- imported roadmap/support source ZIPs such as `docs/*_roadmap_pack.zip`
- generated public export folders
- TikTok intake queues and release target configs under `config/`
- Meilisearch local data
- private client workspaces

## Deployable but not committed

- `public-data/tiktok`
- release folder under `output/releases`
- `web/static/documents.jsonl` inside release package

Reason: these are generated artifacts. They can be uploaded to VPS, but should not become GitHub source unless intentionally sampled.

## Public demo content rule

The public demo should not default to a full third-party transcript dump.

Preferred public layer:

- attributed source records;
- short excerpts for search context;
- topic and insight cards;
- creator/source links;
- methodology and opt-out/correction path.

Full third-party transcripts should remain private/local by default, or be gated/noindexed/reviewed before broader public launch.

## Pre-stage rule

Before any `git add`, run:

```powershell
git status --short --branch
```

Then compare staged candidates against:

- `docs/GIT_PUBLICATION_AUDIT.md`
- this file
