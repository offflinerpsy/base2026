# Base2026 Data Quality Report

Last updated: 2026-06-10

## Current Public Export Counts

- source records: 957
- passages: 1392
- insight cards: 1548
- public insight cards: 1097
- topics: 1449
- public topics: 1040
- creators: 4
- platforms: TikTok only

## Insight-Card Gap

- sources without any insight cards: 173
- sources with passages but no insight cards: 166
- sources without public insight cards: 305

Interpretation:

- `166` sources are the current private backfill target.
- This is a claim extraction gap, not a source-page rendering bug.

## Public Boundary Checks

Latest known public policy check:

```powershell
python scripts/check-public-export-policy.py public-data/tiktok
```

Expected result:

- `ok: true`
- no full transcript publication by default;
- no public claim without `source_id`;
- no public claim without `evidence_excerpt`;
- no raw caption/media/log/token exposure.

## Latest Audit Command / Result

Last verified in this session:

```powershell
python scripts/check-public-export-policy.py public-data/tiktok
```

Result:

- ok: true
- source records: 957
- passages: 1392
- insight cards: 1548
- public insight cards: 1097
- public topics: 1040
- include full transcripts: false

Backfill queue verification:

```powershell
python scripts/base2026-build-backfill-queue.py --dry-run
```

Result:

- queued sources: 166
- criteria: `passage_count > 0 and insight_card_count = 0`

Local claim extraction samples:

```powershell
.venv/bin/python scripts/base2026-controller.py run-claim-extract-sample --queue .planning/backfill-insight-cards-20260610.jsonl --limit 3 --execute --model qwen3:8b
```

Result:

- endpoint detected: true
- model: qwen3:8b
- candidates: 11
- verified after evidence check: 9
- imported to SQLite as private/pending: 9
- average latency seconds/source: 39.007
- paid API cost: 0

Second local model smoke:

```powershell
.venv/bin/python scripts/base2026-claim-extract-local.py --queue .planning/backfill-insight-cards-20260610.jsonl --limit 1 --execute --model gemma3:4b
```

Result:

- candidates: 1
- exact verified: 1
- imported to SQLite as private/pending: 1
- average latency seconds/source: 9.720

Public promotion status:

- new backfill cards in local export: 10
- public backfill cards: 0
- `insight_card_candidate` claims are excluded from export auto-promotion until a separate review/promotion step.

Publication boundary audit:

```powershell
python scripts/audit-publication-boundary.py
```

Result:

- changed files: 3168
- public safe candidates: 3168
- needs review: 0
- forbidden: 0
- secret findings: 0
- ok to stage public safe candidates: true
