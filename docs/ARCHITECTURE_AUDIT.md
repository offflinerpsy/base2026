# Architecture Audit

Date: 2026-06-01

## Executive Summary

The current system is a strong local prototype, but not public-server-ready.

Best next architecture:

```text
SQLite = durable source of truth
Meilisearch = fast human search
Static/public pages = SEO/GEO surface
Local workers = ingestion/transcription/AI processing
Public server = read-only product
```

## What Works

- SQLite knowledge base exists and passes integrity checks.
- Polished transcript layer exists.
- Meilisearch POC works locally.
- Search UI can show facets and highlights.
- The data model already separates creators, videos, transcripts, chunks, claims, jobs, and documents.

## Main Problems

### 1. Public Server Must Not Run Intake

Current `/api/refresh` starts local PowerShell scripts. This is fine locally, but unsafe publicly.

Production rule:

- public server: read-only
- admin worker: private network or local machine
- ingestion endpoint: disabled unless authenticated and queued

### 2. ChatGPT Subscription Is Not Server Infrastructure

Subscription-based ChatGPT/Codex/OpenClaw work is good for local operation.

For production:

- either keep ingestion local and deploy exports
- or use API-based workers with secrets, queues, logging, and costs

### 3. Current Repo Mixes Code and Data

The repo currently contains code, local data, generated indexes, audio files, screenshots, and research artifacts.

Open source needs separation:

- `app/` or `web/`
- `scripts/`
- `docs/`
- `schema/`
- `sample-data/`
- private data outside git

### 4. Meilisearch Is in Development Mode

Current local container is POC.

Production needs:

- master key
- private admin key
- public search key
- no unauthenticated admin endpoint
- persistent volume
- pinned version
- reverse proxy / firewall

## Recommended Target Modules

```text
base2026/
  apps/
    public-web/
    admin-console/
  packages/
    schema/
    search-indexer/
    ingestion-core/
  workers/
    tiktok-intake/
    transcript-polish/
    claims-extract/
    public-export/
  docs/
  sample-data/
```

Do not move everything yet. First stabilize boundaries.

## Data Flow

### Private Ingestion

```text
creator/source registry
  -> inventory fetch
  -> metadata enrichment
  -> caption fetch
  -> ASR fallback
  -> faithful transcript polish
  -> QA audit
  -> claims extraction
  -> SQLite
```

### Public Export

```text
SQLite
  -> public rows only
  -> Meilisearch documents
  -> static SEO pages
  -> sitemap
  -> deployment
```

## Public SEO/GEO Surface

Do not expect a search console to rank.

Generate pages:

- `/creators/{handle}`
- `/sources/{platform}/{id}`
- `/topics/{topic}`
- `/claims/{claim_id}`
- `/quotes/{quote_id}`

Each page should include:

- title
- date
- author attribution
- source link
- short summary
- excerpts
- related topics
- related creators
- internal links
- structured data where applicable

## GitHub Readiness

Before first public commit:

1. Run secret scan.
2. Remove private/generated data.
3. Add license.
4. Add security policy.
5. Add sample dataset.
6. Add `.env.example`.
7. Add setup docs.
8. Add CI checks.
9. Decide repo name.

## Open Questions

- Public full transcripts or excerpt-only?
- Which license: MIT for code, separate content license for dataset?
- Public contribution model: URL submissions, PRs, or private intake queue?
- Hosting target: VPS, Cloudflare, Vercel, Docker Compose?
