# Base2026 Backfill Insight Cards Runbook

Last updated: 2026-06-09

## Why Backfill Exists

Some sources have searchable passages but no insight cards because claim extraction did not run or did not create `claims` / `claim_evidence` rows.

Current target:

- 166 sources with passages and zero insight cards after the first MacBook local model pilot.

## Queue Build

Dry-run:

```powershell
python scripts/base2026-build-backfill-queue.py --dry-run
```

Write queue:

```powershell
python scripts/base2026-build-backfill-queue.py --write
```

Controller route:

```powershell
python scripts/base2026-controller.py build-backfill-queue --write
```

Output:

- `.planning/backfill-insight-cards-YYYYMMDD.jsonl`

## Extraction Route

Default:

- local endpoint only;
- strict JSON;
- 0-5 claims per source;
- candidates remain private/pending.

Dry-run sample:

```powershell
python scripts/base2026-claim-extract-local.py --queue .planning/backfill-insight-cards-YYYYMMDD.jsonl --limit 10 --dry-run
```

No paid API unless owner explicitly approves and a future `--allow-paid-api` path is implemented.

## Evidence Verification

Run:

```powershell
python scripts/base2026-evidence-verify.py --input .planning/claim-candidates-YYYYMMDD.jsonl --dry-run
```

Verifier order:

1. exact substring;
2. normalized substring;
3. fuzzy phrase match;
4. reject unsupported claims.

Write verified output:

```powershell
python scripts/base2026-evidence-verify.py --input .planning/claim-candidates-YYYYMMDD.jsonl --output .planning/claim-candidates-YYYYMMDD.verified.jsonl
```

## Private SQLite Import

Dry-run:

```powershell
python scripts/base2026-controller.py import-claim-candidates --input .planning/claim-candidates-YYYYMMDD.verified.jsonl
```

Apply to local SQLite only:

```powershell
python scripts/base2026-controller.py import-claim-candidates --input .planning/claim-candidates-YYYYMMDD.verified.jsonl --apply
```

Import rules:

- imports only `status = verified` by default;
- writes `claims.review_status = pending`;
- writes `claims.claim_type = insight_card_candidate`;
- creates a SQLite backup before apply;
- does not promote public cards.

## Private/Pending First

All generated candidates must use:

- `public = false`
- `needs_review = true`
- `status = candidate`

## Manual Review Rule

No candidate is public until:

- evidence excerpt is verified;
- topic is sane;
- claim text is useful and faithful;
- owner/reviewer approves promotion policy.

## GPT Pro Manual Review Lane

Use this lane when high-quality card text matters more than local-model throughput.

GPT-first extraction from public passages:

```powershell
python scripts/base2026-controller.py build-chatgpt-review-packet --queue .planning/backfill-insight-cards-YYYYMMDD.jsonl --mode extract --limit 10
```

This route skips Qwen as a required step. ChatGPT Pro/GPT-5.4 or Codex returns strict JSON `new_candidate` decisions with exact evidence excerpts.

Local draft plus GPT review:

Build a packet:

```powershell
python scripts/base2026-controller.py build-chatgpt-review-packet --queue .planning/backfill-insight-cards-YYYYMMDD.jsonl --candidates .planning/claim-candidates-YYYYMMDD.verified.jsonl --limit 10
```

Manual rule:

- paste only the generated packet into ChatGPT Pro/GPT-5.4;
- use only public search passages and private/pending candidates included in the packet;
- reject semantic mismatches even if deterministic evidence matching passed;
- return strict JSON only.

Apply the returned review JSON:

```powershell
python scripts/base2026-controller.py apply-chatgpt-review --packet .planning/chatgpt-review-packet-YYYYMMDD.json --review .planning/chatgpt-review-response-YYYYMMDD.json --out .planning/claim-candidates-YYYYMMDD-chatgpt-reviewed.jsonl
```

Then run evidence verification again before any import:

```powershell
python scripts/base2026-controller.py verify-evidence --input .planning/claim-candidates-YYYYMMDD-chatgpt-reviewed.jsonl --output .planning/claim-candidates-YYYYMMDD-chatgpt-reviewed.verified.jsonl
```

## Promotion Rule

Public promotion is a separate future task. It must not happen in the backfill queue build task.

`scripts/export-public-tiktok.py --auto-promote-insights` must not auto-promote `claim_type = insight_card_candidate`.

## Promotion Review Report

Before any public promotion, generate a read-only report over private/pending candidates:

```powershell
python scripts/base2026-controller.py review-insight-candidates --status pending
```

The report checks:

- public evidence exact/normalized match;
- source record presence;
- claim/action/evidence length;
- generic action language;
- maximum promotion candidates per source.

Outputs:

- `.planning/pending-insight-candidate-review-YYYYMMDD.json`
- `.planning/pending-insight-candidate-review-YYYYMMDD.md`

The report does not write to SQLite and does not promote cards. A future promotion apply command must use the report output explicitly.

## Rollback Plan

Backfill queue and candidates live under `.planning/`.

Rollback:

- delete the specific `.planning/backfill-insight-cards-*.jsonl`;
- delete the matching `.planning/claim-candidates-*.jsonl`;
- do not touch public export or deployed release.
