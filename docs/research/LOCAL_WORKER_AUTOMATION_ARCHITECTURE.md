# Local Worker Automation Architecture

Last updated: 2026-06-07

## Goal

Make Base2026 daily ingestion run with minimal paid tokens and without relying on Hermes or Codex as the daily worker.

Codex remains the command center for architecture, debugging, audits, and deploy decisions. The daily work should be done by a local worker on the powerful local machine.

## Core decision

Default production-like loop:

```text
local machine:
  discover -> captions/media -> ffmpeg -> ASR -> conservative cleanup -> JSONL spool

VPS:
  ingest JSONL -> DB/search -> public UI
```

Paid LLM usage:

- default: none;
- allowed only as manual fallback for failed/high-value transcripts;
- never part of normal scheduled ingestion.

Hermes:

- local/private prototype helper only;
- optional wrapper if useful;
- not production dependency;
- not required for GitHub/public architecture.

## Why local worker

The local machine has better compute and residential/network context. The small VPS should not:

- scrape TikTok/Instagram;
- store browser cookies;
- run heavy ASR;
- hold personal social sessions;
- retry fragile social downloads forever.

The VPS should only run stable infrastructure:

- ingest endpoint;
- database/JSONL archive;
- Meilisearch;
- public UI;
- backups.

## Worker components

### 1. Scheduler

Windows Task Scheduler or a local service runs the worker 1-2 times per day.

Modes:

- `check`: discover new posts only;
- `ingest`: process new posts locally;
- `publish`: upload reviewed JSONL to VPS;
- `dry-run`: no writes outside local logs/spool.

### 2. Creator registry

Local config stores selected creators:

```json
{
  "platform": "tiktok",
  "handle": "tjrobertson52",
  "enabled": true,
  "policy": "public_recent_posts",
  "max_new_per_run": 20
}
```

Instagram and TikTok use the same registry shape.

### 3. Discovery and acquisition

Preferred tools:

- TikTok: `yt-dlp` first.
- Instagram: `yt-dlp` first, `instaloader`/`gallery-dl` fallback.

Order:

1. discover post IDs/URLs;
2. dedupe by `platform + post_id`;
3. try captions/subtitles first;
4. download media only if captions are missing;
5. mark failures with reason codes.

### 4. Audio extraction

Use `ffmpeg` to normalize audio:

```text
16 kHz, mono, pcm_s16le WAV
```

No LLM involved.

### 5. ASR

Primary:

- `faster-whisper` on local machine.

Fallback:

- `whisper.cpp` for CPU/edge mode.

Model policy:

- speed test: `small.en`;
- quality test: `medium.en`;
- do not silently translate;
- store `language`, `is_translation`, `asr_model`.

### 6. Cleanup layer

Preferred default:

- deterministic punctuation/casing/paragraph cleanup;
- token-diff guard.

Optional local LLM:

- only via local endpoint;
- never paid API by default;
- model configurable: Gemma/Qwen/Llama/Mistral-class model;
- use OpenAI-compatible local server when possible.

Local LLM runtimes to support:

- Ollama;
- LM Studio local server;
- llama.cpp server;
- vLLM if available.

Local LLM tasks allowed:

- punctuation improvement;
- paragraph segmentation;
- topic/category extraction;
- quality flags;
- short internal title suggestion.

Local LLM tasks forbidden:

- summarizing transcript as replacement;
- adding claims;
- rewriting argument;
- resolving unclear names/numbers without evidence;
- translating silently.

### 7. Cleanup guard

Every cleanup output must pass:

```text
raw transcript -> normalized tokens
clean transcript -> normalized tokens

Accept only if:
  - word sequence is identical or near-identical;
  - numbers are unchanged;
  - proper nouns are not rewritten;
  - no new claim-bearing sentence appears.
```

If guard fails:

- keep raw ASR transcript;
- mark `needs_review`;
- do not publish as polished.

### 8. JSONL spool

Worker writes reviewed local records:

```json
{
  "id": "tiktok:123",
  "platform": "tiktok",
  "creator_handle": "",
  "source_url": "",
  "post_id": "",
  "posted_at": "",
  "raw_transcript": "",
  "clean_transcript": "",
  "caption_source": "yt_dlp_subtitle|asr_local|manual",
  "asr_model": "faster-whisper:medium.en",
  "cleanup_method": "local_llm_guarded|punctuation_guarded|none",
  "quality_flags": [],
  "failure_reason": ""
}
```

### 9. VPS upload

Local worker uploads only clean structured JSONL.

VPS endpoint:

```text
POST /ingest/jsonl
```

Security:

- signed token or HMAC;
- no social cookies on VPS;
- no raw media required on VPS;
- idempotent upsert by `platform + post_id`.

## Daily flow

```text
01:00 local time
  run check
  if new posts:
    run ingest
    run local QA
    write JSONL spool
  if QA passes:
    upload to VPS
    trigger reindex
  write run report
```

Codex daily involvement:

- none by default.

Codex manual involvement:

- inspect failures;
- improve scripts;
- run release/deploy;
- review UI/search behavior;
- update architecture.

## Relationship to Hermes

Hermes can be used as a temporary local operator if it helps orchestrate scripts, but the real worker must be scriptable without Hermes:

```text
PowerShell/Python CLI > local LLM endpoint > ASR tools > JSONL
```

If Hermes breaks, the worker still runs.

## Recommended MVP implementation

Phase A — no local LLM:

- `yt-dlp`;
- `ffmpeg`;
- `faster-whisper`;
- paragraph split by simple rules;
- token guard;
- local JSONL output.

Phase B — optional local LLM:

- add local OpenAI-compatible cleanup endpoint;
- test one model;
- enforce token guard;
- compare against no-LLM baseline.

Phase C — upload:

- add signed VPS ingest endpoint;
- upload JSONL;
- reindex Meilisearch.

Phase D — scheduler:

- Windows Task Scheduler;
- daily run logs;
- failure report.

## First proof-of-concept

Use 40 videos:

- 10 TikTok with captions;
- 10 TikTok without captions;
- 10 Instagram Reels with visible app captions;
- 10 Instagram Reels without captions.

Measure:

- discovery success;
- caption success;
- media download success;
- ASR speed;
- ASR quality;
- cleanup drift;
- upload readiness.

## Final operating principle

Paid LLMs are for exception handling, not the pipeline.

The pipeline should work if Codex, Hermes, and paid APIs are all unavailable.
