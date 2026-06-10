# TikTok Intake Execution Plan

## Current Queue

Use:

`config/tiktok-intake-queue.20260608.json`

Creators:

- `@joshuamaraney` — new creator, 33 discovered URLs
- `@webhivedigital` — existing creator refresh, 35 discovered URLs

## Execution Phases

### Phase A — Caption-first extraction

Run browser navigation per video URL and extract:

- page title;
- `og:description`;
- `description`;
- active visible caption when safely isolated;
- source id and canonical URL.

Do not run ASR yet.

Prepared script for this phase:

```powershell
node scripts\tiktok-caption-browser-extract.mjs --queue config\tiktok-intake-queue.20260608.json --out .planning\tiktok-caption-extract-20260608.jsonl
```

Smoke run:

```powershell
node scripts\tiktok-caption-browser-extract.mjs --queue config\tiktok-intake-queue.20260608.json --out .planning\tiktok-caption-extract-smoke.jsonl --limit 4
```

### Phase B — Deterministic cleanup

Clean caption/transcript text without LLM:

- normalize whitespace;
- separate hashtags from prose;
- remove TikTok UI labels;
- split sentences/paragraphs lightly;
- keep original English wording.

### Phase C — Quality gate

Mark each record:

- `caption_ready`
- `needs_asr`
- `needs_manual_review`
- `duplicate`
- `out_of_scope`

The prepared extractor emits initial `quality_flags`; use those flags to decide which records enter ASR fallback.

### Phase D — ASR fallback

For `needs_asr` only:

- extract audio locally/private;
- transcribe with `faster-whisper`;
- use deterministic cleanup first;
- optional local/GPT-5.4 cleanup only with faithful transcript guard.

### Phase E — Public export

Only after source records pass quality:

- rebuild public JSONL;
- validate public export policy;
- reindex Meilisearch;
- deploy release.

## Stop Conditions

Stop and do not publish a record if:

- active caption cannot be isolated;
- creator/source URL is missing;
- transcript mixes recommended-video content;
- caption language is not English and no faithful English transcript exists;
- raw data would cross the public/private boundary.
