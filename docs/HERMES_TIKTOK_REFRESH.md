# Hermes TikTok Refresh Pipeline

Status: active draft
Date: 2026-06-05

## Goal

Hermes keeps the public TikTok knowledge base fresh without touching the private Base2026 research corpus.

Scope:

- TikTok only.
- Existing creators only unless maintainer adds another creator.
- Public website: `/knowledge/`.
- Source of truth remains local SQLite and local source files.

Creators:

- `@webhivedigital`
- `@tjrobertson52`
- `@build_in_public`

## Token Budget Rule

Use tools and scripts before model calls.

Model use:

- inventory, diff, CSV updates, SQLite rebuild, export, package: no LLM.
- transcript cleanup: low/medium model first.
- escalation to stronger model only when captions are damaged, ASR is uncertain, or QA status is `needs_review`.

Never send whole project context to Hermes for normal refresh. Send only current batch files.

## Pipeline

1. Inventory
   - Run `scripts/tiktok-backfill-inventory.ps1`.
   - Detect new video IDs.
   - Keep one-year active cutoff unless maintainer changes it.

2. Transcript intake
   - Run `scripts/tiktok-process-transcripts.ps1`.
   - Prefer captions via `yt-dlp`.
   - Use ASR fallback only for missing captions.
   - Mark failed/uncertain items as `needs_asr` or `needs_review`.

3. Faithful polish
   - Create polish batches with `scripts/tiktok-create-polish-batches.ps1`.
   - Hermes reads only those batch files.
   - Output:
     - `12_knowledge-base/sources/tiktok/transcripts/polished/<video_id>.txt`
     - `12_knowledge-base/sources/tiktok/transcripts/polished-qa/<video_id>.json`

4. Rebuild
   - Run `scripts/build-kb-sqlite.py`.
   - Run `scripts/kb-audit.py`.
   - Run `scripts/export-public-tiktok.py`.
   - Package public release.

5. Deploy
   - Deploy only after audit pass.
   - Server remains read-only public search.
   - Do not expose ingestion endpoint.

## Faithful Polish Rules

Output language: English.

Allowed:

- punctuation,
- sentence boundaries,
- paragraph breaks by topic/beat,
- removing duplicated caption fragments,
- preserving spoken wording.

Forbidden:

- summarizing,
- adding missing claims,
- improving argument quality,
- translating to Russian,
- changing technical meaning,
- inventing title, date, source, or context.

If unsure, preserve raw wording and mark QA `needs_review`.

## QA JSON Shape

```json
{
  "video_id": "...",
  "status": "pass",
  "notes": [],
  "raw_word_count": 0,
  "polished_word_count": 0,
  "paragraph_count": 0,
  "model_tier": "low_or_medium",
  "meaning_added": false
}
```

Status values:

- `pass`
- `needs_review`
- `failed`

## Safety

- Do not rewrite private folders into public export.
- Do not delete old releases automatically.
- Do not deploy when audit fails.
- Do not run two refresh jobs at the same time.
- Do not trust TikTok inventory counts without checking `videos.csv`.

