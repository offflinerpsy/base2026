# Local Worker PoC Spec

Last updated: 2026-06-07

## Goal

Validate a zero-paid-token local worker for TikTok and Instagram transcription before building the full ingestion system.

## Test matrix

Use 40 public videos:

| Group | Count | Purpose |
| --- | ---: | --- |
| TikTok with visible captions | 10 | Measure caption extraction success. |
| TikTok without visible captions | 10 | Measure ASR fallback quality. |
| Instagram Reels with visible app captions | 10 | Test whether extractors can access speech captions. |
| Instagram Reels without visible app captions | 10 | Measure Instagram audio fallback. |

## Tools

Required:

- `yt-dlp`
- `ffmpeg`
- Python 3.11+
- `faster-whisper`

Current local check:

- `faster-whisper` Python API is available.
- Smoke test completed on one existing local audio fallback:
  - model: `small.en`
  - device: `cpu`
  - compute: `int8`
  - audio duration: ~88.8 seconds
  - transcription time: ~50 seconds
  - word count: 327
  - deterministic cleanup guard: pass

Optional:

- `whisper.cpp`
- `instaloader`
- `gallery-dl`
- local LLM endpoint for Phase B cleanup only

Optional intake adapters are capability-only dependencies. Missing optional tools should not fail the local worker doctor. Install them into the project virtualenv when testing platform-neutral discovery:

```bash
.venv/bin/python -m pip install gallery-dl instaloader
```

Optional CPU ASR fallback can be installed separately when needed:

```bash
brew install whisper-cpp
```

Verify capabilities with:

```bash
.venv/bin/python scripts/base2026-worker.py doctor
```

The doctor is the source of truth for whether TikTok fallback discovery, Instagram discovery, and optional CPU ASR fallback are available.

## Phase A: no LLM

Run:

```text
discover -> probe captions -> fetch media if needed -> extract audio -> transcribe -> deterministic cleanup -> token guard -> JSONL
```

No Hermes. No Codex. No paid LLM.

## Phase B: local LLM cleanup

Only after Phase A baseline:

```text
raw ASR -> local LLM cleanup -> token-diff guard -> accept/reject
```

Primary target:

- Gemma 4 12B through local endpoint.

Fallback:

- Gemma 4 E4B;
- Gemma 3 12B/27B;
- another configured local model.

## Metrics

For every test URL, record:

```text
platform
creator_handle
source_url
post_id
duration_sec
has_visible_app_captions
metadata_success
caption_probe_success
media_download_success
audio_extract_success
asr_engine
asr_model
asr_seconds
raw_word_count
clean_word_count
cleanup_method
cleanup_guard_passed
manual_quality_score_1_5
failure_reason
notes
```

## Success criteria

MVP is viable if:

- TikTok discovery/download works on a small allowlist with conservative rate limits.
- Instagram test confirms whether local cookies/session are required.
- ASR produces usable English transcripts for most audio-fallback samples.
- Cleanup guard rejects meaning-changing output.
- JSONL schema is sufficient for VPS ingest.
- No paid LLM is required for daily successful runs.

## Failure criteria

MVP is not ready if:

- extractor failures dominate even with local residential IP and conservative rate limits;
- ASR quality is too poor on real creator videos;
- cleanup guard regularly fails;
- Instagram account/session risk is too high;
- local run cannot finish within an acceptable daily window.

## Output files

Local-only:

```text
.planning/local-worker-poc/
  urls.csv
  runs/
  media/
  audio/
  transcripts/
  reports/
```

Public-safe:

```text
docs/research/LOCAL_WORKER_POC_RESULTS_TEMPLATE.md
```

## Next implementation step

Continue the minimal CLI:

```text
python scripts/base2026-worker.py creators:list
python scripts/base2026-worker.py probe <url>
python scripts/base2026-worker.py fetch <url>
python scripts/base2026-worker.py extract-audio <media-file>
python scripts/base2026-worker.py transcribe <audio-file>
python scripts/base2026-worker.py clean <transcript-file>
python scripts/base2026-worker.py export-jsonl
```

Next missing piece:

- create the 40-video URL matrix file;
- wire processed records into `export-jsonl`;
- add optional local LLM cleanup only after Phase A baseline.

## Platform-neutral discovery adapter smoke

Phase 2 discovery adds a private JSONL spool without changing the current TikTok runner or `videos.csv`:

```bash
.venv/bin/python scripts/social-discover.py \
  --config config/tiktok-intake-queue.local.json \
  --creator build_in_public \
  --out .planning/social-discovered-smoke.jsonl \
  --limit-per-creator 3
```

Rules:

- TikTok uses `yt-dlp --flat-playlist` first.
- TikTok may use `gallery-dl` only as a fallback if installed.
- Instagram discovery is disabled/degraded unless `gallery-dl` or `instaloader` is installed.
- The script writes normalized private JSONL only and must not modify `12_knowledge-base/sources/tiktok/videos.csv`.

## Discovery-to-TikTok queue bridge

Phase 3 bridges the private discovery spool into the existing TikTok queue, but only after a dry run:

```bash
.venv/bin/python scripts/import-social-discovery-to-tiktok-csv.py \
  --input .planning/social-discovered.jsonl \
  --report .planning/social-discovery-import-dry-run.json
```

If the report is clean, apply the local queue update:

```bash
.venv/bin/python scripts/import-social-discovery-to-tiktok-csv.py \
  --input .planning/social-discovered.jsonl \
  --apply \
  --report .planning/social-discovery-import-report.json
```

Rules:

- Only `platform == "tiktok"` source records are imported.
- Discovery failures and Instagram rows are skipped.
- Existing `video_id` rows are not duplicated; only missing safe metadata fields are filled.
- New recent rows become `queued`; rows older than the cutoff become `out_of_scope_old`.
- Every apply creates an ignored local backup under `.planning/backups/`.
- This bridge must not trigger public export, Meilisearch, deploy, or Git staging.
