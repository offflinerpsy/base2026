# Agent Instruction: Use Base2026 Knowledge Database

Use this when an AI agent needs to answer, research, plan, or build SEO/GEO/AEO strategy from the local Base2026 knowledge database.

## Database

Primary DB:

`12_knowledge-base/indexes/kb.sqlite`

Schema:

`12_knowledge-base/indexes/kb.v2.schema.sql`

Canonical source files:

`12_knowledge-base/sources/`

Canonical reviewed knowledge:

`12_knowledge-base/canonical/`

Important: SQLite is the fast working index. Markdown/CSV/project files are the rebuildable evidence layer.

## First Commands

Run status:

```powershell
python .\scripts\kb-status.py
```

Run health audit:

```powershell
python .\scripts\kb-audit.py
```

Search claims:

```powershell
python .\scripts\kb-search.py "Reddit" --type claims --limit 10
```

Search TikTok transcripts/chunks:

```powershell
python .\scripts\kb-search.py "AI Overview" --type chunks --source-type tiktok_video --limit 10
```

Search local project files:

```powershell
python .\scripts\kb-search.py "entity audit" --type chunks --source-type local_file --limit 10
```

## Source Types

Use `generic_items.source_type`:

- `tiktok_video`: TikTok video/transcript evidence.
- `local_file`: local project source, SOP, checklist, template, research, prompt, methodology.

Excluded intentionally:

- `11_dreamwood_offer`: job/role/offer material, not SEO/GEO/AEO source material.

## Direct SQL Patterns

Chunk search:

```sql
SELECT i.item_id, i.source_type, i.canonical_url, substr(c.text, 1, 500) AS chunk
FROM chunks_fts f
JOIN chunks c ON c.chunk_id = f.chunk_id
JOIN generic_items i ON i.item_id = f.item_id
WHERE chunks_fts MATCH ?
LIMIT 20;
```

Claim search with evidence:

```sql
SELECT c.claim_id, c.topic, c.claim_text, c.suggested_action, e.video_id, e.evidence_path
FROM claims_fts f
JOIN claims c ON c.claim_id = f.claim_id
LEFT JOIN claim_evidence e ON e.claim_id = c.claim_id
WHERE claims_fts MATCH ?
LIMIT 20;
```

Local-only search:

```sql
SELECT i.canonical_url, substr(c.text, 1, 500) AS chunk
FROM chunks_fts f
JOIN chunks c ON c.chunk_id = f.chunk_id
JOIN generic_items i ON i.item_id = f.item_id
WHERE chunks_fts MATCH ?
  AND i.source_type = 'local_file'
LIMIT 20;
```

## Answering Rules

1. Search the DB before making recommendations.
2. Prefer reviewed methods/strategy blocks when available.
3. Treat `claims.review_status = pending` as useful but not verified.
4. Cite evidence by `claim_id`, `video_id`, or `canonical_url`.
5. Separate TikTok evidence from local methodology when they conflict.
6. Risk/manipulation claims are warnings, not automatic recommendations.
7. Do not use `11_dreamwood_offer` for SEO/GEO/AEO strategy.

## Updating The Index

Rebuild:

```powershell
python .\scripts\build-kb-sqlite.py
```

Audit:

```powershell
python .\scripts\kb-audit.py
```

Backup:

```powershell
python .\scripts\kb-backup.py
```

Before major edits or ingestion runs, create a backup. After rebuild, audit must print `audit=PASS`.

## Current Shape

The database includes:

- TikTok inventory, transcripts, source cards, extracted claims.
- Local SEO/GEO/AEO project files from methodology, factor maps, SOPs, checklists, templates, prompt bank, experiments, sales packaging, agent instructions, and original research.
- Universal ingestion tables for future Reddit/web/manual sources.

Use it as the evidence brain for client strategy, audits, workflows, experiments, SOP generation, and AI visibility planning.
