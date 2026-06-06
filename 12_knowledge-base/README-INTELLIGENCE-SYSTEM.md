# Base2026 Intelligence System

Status: operational local-first knowledge database.

## Consensus

Six-agent architecture review converged on:

- Markdown/YAML as canonical evidence and reviewable knowledge.
- SQLite + FTS5 as the operational database and fast exact-search layer.
- Vector search later as a derived semantic layer, not source of truth.
- One ingestion queue and stable source-specific workflows.
- Strategy layer above the evidence layer: methods, risks, experiments, SOP blocks, strategy blocks.

## Working Database

SQLite database:

`12_knowledge-base/indexes/kb.sqlite`

AI usage guide:

`12_knowledge-base/AI-USAGE-GUIDE.md`

Full agent instruction:

`10_agent-instructions/06-use-knowledge-base.md`

Schema:

`12_knowledge-base/indexes/kb.v2.schema.sql`

Builder:

`scripts/build-kb-sqlite.py`

Current imported state:

- creators: 3
- videos: 2332
- in-scope videos: 912
- old/out-of-scope videos: 1420
- transcripts: 908
- source cards: 908
- source registry entries: 17
- generic items: 2476
- generic documents: 1052
- local files: 144
- chunks: 1544
- queued ASR transcript jobs: 4
- claims: 1538
- claim cards: 1538
- methods: 1
- strategy blocks: 1

Latest audit:

- integrity: ok
- foreign key errors: 0
- FTS counts match canonical tables
- generic chunk FTS count matches chunks
- missing in-scope transcripts are queued as ASR jobs
- backup created under `12_knowledge-base/indexes/backups/`

## Canonical Files

TikTok evidence:

`12_knowledge-base/sources/tiktok/`

Source cards:

`12_knowledge-base/sources/tiktok/source-cards/`

Claim cards:

`12_knowledge-base/canonical/claims/`

## Search Examples

```powershell
python .\scripts\kb-search.py Reddit --type claims --limit 10
python .\scripts\kb-search.py "AI Overview" --type transcripts --limit 10
python .\scripts\kb-search.py schema --type chunks --limit 10
python .\scripts\kb-search.py "entity audit" --type chunks --source-type local_file --limit 10
python .\scripts\kb-status.py
python .\scripts\kb-audit.py
python .\scripts\kb-backup.py
```

Useful query terms:

- `AI Overview`
- `Reddit`
- `schema`
- `local SEO`
- `llms.txt`
- `GSC`
- `internal links`

## Source Workflow

```text
source -> item -> raw artifact -> transcript/document -> chunk -> claim -> review -> method -> SOP/strategy block
```

Universal tables for all future sources:

- `source_registry`: TikTok creators, Reddit queries/subreddits/threads, web domains/pages, manual research drops.
- `generic_items`: one row per source item, regardless of platform.
- `raw_artifacts`: raw captions, HTML, screenshots, exports, source cards.
- `generic_documents`: cleaned text ready for chunking.
- `chunks` + `chunks_fts`: fast chunk-level search and later vector sidecar.
- `jobs` and `events`: queue/ledger for agent runs, retries, and audit trail.

Imported local project folders:

- `00_sources`
- `01_core-methodology`
- `02_factor-maps`
- `03_sops`
- `04_checklists`
- `05_templates`
- `06_prompt-bank`
- `07_client-workspaces`
- `08_experiments`
- `09_sales-packaging`
- `10_agent-instructions`
- `99_original_research`
- root `README.md` and `manifest.json`

Excluded by rule:

- `11_dreamwood_offer`: job/role/offer material, not SEO/GEO/AEO evidence.

OpenClaw skills:

- `tiktok-kb-intake`: full TikTok creator inventory, last-year scope, transcripts, batches.
- `kb-ingest-router`: routes TikTok, Reddit, web, and manual source intake into this database contract.

## Rules

- TikTok creator link means full discoverable inventory, not 5-video sample.
- Active default scope: last year.
- Older videos stay in inventory as `out_of_scope_old`.
- Claims stay `pending` until reviewed.
- Risk/manipulation items are stored as risk/avoid, not recommendations.
- No method enters strategy without evidence links.

## Next Steps

1. Deduplicate claims.
2. Cluster claims into topic maps and contradictions.
3. Review and promote claims into validated methods, risks, experiments, SOP blocks, and strategy blocks.
4. Add optional sqlite-vec semantic sidecar after exact FTS is stable.
