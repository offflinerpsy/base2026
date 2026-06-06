# Open Source Roadmap

Date: 2026-06-01

## Goal

Make Base2026 publishable as a clean open-source project without leaking private data or tying the public server to a local ChatGPT/Codex subscription.

## Phase 0 — Freeze Current Prototype

- keep branch: `codex/knowledge-ui-shell`
- do not push current worktree as-is
- keep local DB private
- keep Meilisearch POC local

## Phase 1 — Repository Hygiene

- add `.gitignore`
- add `LICENSE`
- add `.env.example`
- add `SECURITY.md`
- add `CONTRIBUTING.md`
- add `README.md` with install/run docs
- add `sample-data/`
- remove screenshots/audio/generated indexes from git scope

## Phase 2 — Public/Private Data Split

Create exporter:

```text
SQLite private DB
  -> public dataset JSONL
  -> Meilisearch public index
  -> static SEO pages
```

Public dataset fields:

- source id
- platform
- creator handle
- source URL
- date
- title/caption
- excerpt
- summary
- topics
- claims

Private-only:

- raw captions
- full transcripts unless policy says public
- audio/video
- job logs
- raw metadata snapshots

Current implementation:

```powershell
python .\scripts\export-public-tiktok.py
python .\scripts\meili-index-public.py --index base2026_public_tiktok
```

Current public export:

- `912` TikTok documents
- `1324` TikTok chunks
- `3` creators
- `0` local/private files

## Phase 3 — Production Search

- keep SQLite private/admin
- run Meilisearch with master key
- expose search-only key
- index only public-safe documents
- build frontend with bundled dependencies

## Phase 4 — Public SEO Pages

Generate:

- creator pages
- topic pages
- source pages
- claim pages
- quote pages
- sitemap
- robots.txt

Each page should have:

- canonical URL
- title/description
- source attribution
- original links
- internal links
- JSON-LD where appropriate

## Phase 5 — Intake Workflow

Options:

### Local Maintainer Intake

Best for now.

```text
maintainer adds creator/source
local worker processes
review
export public dataset
deploy
```

### Public Submission Queue

Later.

```text
user submits URL
moderation queue
local/server worker processes
review
publish
```

### Full Server Automation

Later and paid/API-based.

Requires:

- API keys
- queues
- retries
- cost limits
- auth
- observability

## Phase 6 — GitHub Launch

Before launch:

- secret scan clean
- repo size clean
- docs complete
- issue templates
- project board
- first release tag

Recommended repo name:

`base2026-knowledge`

Recommended license:

- code: MIT
- content/sample-data: CC BY 4.0 or custom attribution license

## Immediate Next Tasks

1. Create clean `sample-data/`.
2. Add public exporter.
3. Disable `/api/refresh` in public mode.
4. Add Docker Compose for web + Meili.
5. Generate first public creator/topic pages.
