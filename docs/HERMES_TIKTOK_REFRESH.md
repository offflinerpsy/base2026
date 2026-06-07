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
- mechanical agent notes/status reports: GPT-5.3 or equivalent cheap model.
- normal transcript cleanup: GPT-5.4 low/medium or equivalent mid model.
- escalation to GPT-5.5 only when captions are damaged, ASR is uncertain, or QA status is `needs_review`.

Never send whole project context to Hermes for normal refresh. Send only current batch files.

## Hermes Task Split

Task A — inventory/dedupe/status:

- model: GPT-5.3 or no LLM
- allowed: inspect `videos.csv`, detect new video IDs, write status notes
- forbidden: transcript rewrite, deploy, reindex

Task B — captions/ASR routing:

- model: GPT-5.3 or no LLM
- allowed: run caption intake scripts, mark `queued`, `transcribed`, `needs_asr`, `needs_review`
- forbidden: invent transcript text

Task C — faithful transcript polish:

- model: GPT-5.4 low/medium
- allowed: punctuation, sentence boundaries, paragraph breaks, obvious caption artifact cleanup
- forbidden: summary, rewrite, translation, new claims

Task D — escalation QA:

- model: GPT-5.5 only when needed
- trigger: damaged captions, uncertain ASR, low preservation score, QA `needs_review`
- output: either corrected faithful transcript or explicit `needs_audio_review`

Task E — rebuild/export/package:

- model: no LLM or GPT-5.3 status-only
- allowed: rebuild SQLite, audit, export, package
- forbidden: deploy without maintainer approval

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
   - Preferred worker command: `scripts/run-hermes-polish-worker.ps1 -BatchSet <batch-set>`.
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

Normal QA JSON should record `"model_tier": "gpt-5.4-low-or-medium"`. Escalated QA JSON should record `"model_tier": "gpt-5.5-escalation"` and include the reason.

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
- If ASR fallback media contains no audio stream, mark `needs_source_review`; do not leave it in an endless `needs_asr` loop.
