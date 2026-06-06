# Base2026 Project Guide

Status: pre-open-source audit
Date: 2026-06-01

## Working Prompt

Turn the current local SEO/GEO/AEO knowledge base into an open-source-ready project with a clean architecture, security boundaries, deployable public site, private/local ingestion workflow, and a roadmap for GitHub publication.

## Product Shape

Base2026 is two products, not one:

1. Private Research Console
   - full transcripts
   - local ingestion
   - AI polishing/extraction
   - claims, evidence, methods, strategy work

2. Public Citation Library
   - creator pages
   - topic pages
   - source/video pages
   - quote/claim pages
   - original links and attribution
   - SEO/GEO optimized summaries and internal links

## Current Local Pipeline

```text
TikTok creator URL
  -> inventory / video list
  -> captions where available
  -> ASR queue when captions are missing
  -> clean transcript
  -> polished faithful transcript
  -> claim extraction
  -> SQLite knowledge base
  -> Meilisearch index
  -> web UI / Meili search lab
```

Current source of truth:

- SQLite: `12_knowledge-base/indexes/kb.sqlite`
- schema: `12_knowledge-base/indexes/kb.v2.schema.sql`
- public search POC: `web/static/meili.html`
- Meili indexer: `scripts/meili-index.py`

## Target Architecture

```text
Local / private workstation
  ingest workers
  transcription / polish / claims
  SQLite source of truth
  export public dataset

Public server
  read-only web app
  Meilisearch with public search key
  static SEO pages
  no ingestion endpoint
  no local-agent endpoint
```

## AI / Agent Boundary

Do not make the public server depend on a ChatGPT subscription.

Recommended modes:

1. Local maintainer mode
   - ingestion runs on the maintainer machine
   - generated artifacts are exported/deployed
   - no server-side AI key needed

2. Server automation mode later
   - use API keys in server secret storage
   - authenticated admin only
   - job queue and rate limits

3. Contributor mode later
   - user submits creator/source URL
   - item enters moderation queue
   - maintainer/local worker processes it

OpenClaw is optional tooling, not architecture. Replace it with explicit workers where possible.

## Public Data Rule

Public pages should include attribution and original links.

Recommended public/private split:

- public: metadata, source links, excerpts, summaries, claims, topic maps
- private/local: full raw captions, full transcripts, audio, raw oEmbed snapshots, job logs
- optional public full transcript: only when project policy allows it

## GitHub Rule

Do not push the current worktree as-is.

Open-source repo should contain:

- app code
- scripts
- schema
- docs
- sample dataset
- `.env.example`
- license
- security policy

Keep out of GitHub:

- real SQLite DB
- Meilisearch data folder
- raw transcripts / captions
- audio/video files
- screenshots
- local job logs
- personal research files not intended for open source

## Current Commands

Start web:

```powershell
python .\web\server.py
```

Start Meilisearch:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-meili.ps1
```

Index Meilisearch:

```powershell
python .\scripts\meili-index.py
```

Audit SQLite:

```powershell
python .\scripts\kb-audit.py
```

## Local To Server Workflow

For the deploy rhythm, use:

- `docs/LOCAL_TO_SERVER_WORKFLOW.md`
- `docs/PUBLIC_TIKTOK_DEPLOYMENT.md`

Short version:

```text
improve locally
  -> rebuild SQLite
  -> export public TikTok dataset
  -> reindex Meilisearch
  -> QA locally
  -> package release
  -> deploy to /knowledge/ on VPS
```

Public server must stay read-only. Ingestion stays local or behind an authenticated admin worker.

## References

- Meilisearch Docker / master key: https://www.meilisearch.com/docs/guides/docker
- OWASP secrets management: https://owasp.org/www-project-devsecops-guideline/latest/01a-Secrets-Management
- Google helpful content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google video structured data: https://developers.google.com/search/docs/appearance/structured-data/video
