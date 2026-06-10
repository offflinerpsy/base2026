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
