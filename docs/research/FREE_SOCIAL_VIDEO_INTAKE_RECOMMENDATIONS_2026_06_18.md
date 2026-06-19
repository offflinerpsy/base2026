# Base2026 Free Social Video Intake Recommendations

Date: 2026-06-18
Author: Hermes review
Audience: Codex / Base2026 implementation worker
Scope: local-first, no-paid-scraper intake pipeline for TikTok first, Instagram next, and generic short-form video later.

## Executive summary

Base2026 already has the correct core architecture:

```text
local machine:
  creator discovery -> captions/media acquisition -> ffmpeg -> ASR -> faithful cleanup -> reviewed JSONL/SQLite

VPS/public layer:
  public-safe export -> Meilisearch -> static /knowledge/ UI/API
```

Do **not** replace this architecture with a paid scraper API or a new custom stack. The project should evolve the existing TikTok-only local intake into a small adapter-based social video intake layer.

Recommended direction:

1. Keep `yt-dlp` as the primary TikTok and generic-video tool.
2. Add `gallery-dl` as the first fallback for creator/profile discovery and Instagram/TikTok metadata/media extraction.
3. Add `instaloader` only as an Instagram-specific fallback, not as the universal downloader.
4. Keep ASR local with `faster-whisper`; optionally add `whisper.cpp` later for CPU fallback.
5. Keep raw captions, raw ASR, media, cookies, logs, and source-review artifacts private/local.
6. Add a platform-neutral local queue/spool layer before trying to expand beyond TikTok.

The important implementation principle is: **do not make “scraping more sites” the first task. Make the intake pipeline observable, idempotent, and adapter-based first.**

## Why this recommendation

The user’s actual product is not a scraper. It is a searchable database of creator video meaning:

```text
public creator videos
  -> local transcript/source text
  -> faithful cleanup
  -> source records/passages/topics/insights
  -> searchable public/private knowledge base
```

So the pipeline should optimize for:

- repeatability;
- dedupe;
- attribution;
- transcript quality;
- private/public boundary safety;
- cheap daily operation;
- recoverability after extractor failures.

It should **not** optimize for maximum scraping volume at the cost of blocked accounts, broken public data, or unreviewed transcript dumps.

Paid scraper APIs solve anti-bot infrastructure with money. This project’s constraint is explicitly no paid scraping. Therefore the correct free strategy is:

- selected creator allowlist;
- slow incremental refresh;
- local cookies/session context only when needed;
- caption-first extraction;
- ASR fallback only when captions are unavailable or insufficient;
- hard daily caps;
- clear source-review gates.

## Current Base2026 reality observed on 2026-06-18

Project path:

```text
/Users/alexyarosh/Projects/base2026-migration/DW/base2026
```

Current relevant files:

```text
scripts/hermes-tiktok-refresh.ps1
scripts/tiktok-backfill-inventory.ps1
scripts/tiktok-process-transcripts.ps1
scripts/tiktok-create-polish-batches.ps1
scripts/base2026-worker.py
scripts/tiktok-ytdlp-metadata-extract.py
scripts/tiktok-caption-browser-extract.mjs
config/tiktok-intake-queue.local.json
config/creators.example.json
12_knowledge-base/sources/tiktok/videos.csv
docs/research/TRANSCRIPTION_PIPELINE_OPTIONS.md
docs/research/LOCAL_WORKER_AUTOMATION_ARCHITECTURE.md
docs/project-memory/TIKTOK_INTAKE_EXECUTION_PLAN.md
docs/project-memory/NEW_CREATOR_INTAKE_RUNBOOK.md
```

Current local worker doctor result:

```text
required tools present:
  yt-dlp
  ffmpeg

Python modules present:
  faster_whisper
  ctranslate2
  requests

optional tools missing:
  gallery-dl
  instaloader
  whisper.cpp

optional tool present:
  ollama
```

Current `videos.csv` snapshot:

```text
total rows: 3345
transcribed: 1392
out_of_scope_old: 1937
needs_source_review: 16
caption-based: 1314
ASR-based: 92
```

Creators currently present:

```text
tiktok-build-in-public: 1024
tiktok-webhivedigital: 1012
tiktok-joshuamaraney: 642
tiktok-tjrobertson52: 353
tiktok-darrenshawseo: 314
```

This proves the existing TikTok intake is already operational. The next work should harden and generalize it, not restart it.

## Non-goals

Do not do these as part of this intake hardening pass:

1. Do not deploy Base2026.
2. Do not reindex Meilisearch.
3. Do not submit URLs to GSC/IndexNow.
4. Do not publish raw captions, raw ASR, media, private QA files, or unreviewed transcripts.
5. Do not move scraping/cookies/ASR to the VPS.
6. Do not make paid scraper APIs a required dependency.
7. Do not turn Instagram intake on at scale before a small controlled proof test.
8. Do not replace existing TikTok scripts until the new adapter path can reproduce their current output safely.

## Recommended target architecture

Add a thin platform-neutral intake layer above the existing TikTok pipeline:

```text
config/creators.local.json
  -> social discover adapters
      -> tiktok_yt_dlp
      -> tiktok_gallery_dl fallback
      -> instagram_gallery_dl
      -> instagram_instaloader fallback
      -> generic_yt_dlp
  -> local intake queue/spool
  -> caption/subtitle acquisition
  -> media/audio acquisition if needed
  -> faster-whisper ASR
  -> faithful transcript cleanup/polish
  -> import into current Base2026 KB pipeline
```

The existing public export/search/UI layer should stay unchanged until intake output is proven.

## Adapter order by platform

### TikTok

Preferred order:

```text
1. yt-dlp --flat-playlist for creator discovery
2. yt-dlp subtitles/captions for transcript acquisition
3. yt-dlp audio/media download for ASR fallback
4. gallery-dl only if yt-dlp discovery or media acquisition fails
5. source-review gate if captions/ASR are missing, tiny, or suspicious
```

Reason:

- Base2026 already works this way.
- `yt-dlp` flat playlist already populates `videos.csv`.
- Most current successful transcripts are caption-based.
- Keep the known working path as the primary path.

### Instagram

Preferred order:

```text
1. gallery-dl for profile/reels discovery and media/metadata
2. instaloader as fallback for profile/reels/session-based acquisition
3. yt-dlp for individual Reel URLs only
4. audio fallback for actual speech transcript
5. strict source-review gate
```

Reason:

- Instagram post captions are not speech transcripts.
- Instagram auto-captions are not reliably exposed.
- Account/session risk is higher than TikTok.
- Instagram should start with a tiny allowlist and hard daily caps.

### Generic video URLs

Preferred order:

```text
1. yt-dlp metadata/caption probe
2. yt-dlp media download
3. ffmpeg audio extraction
4. faster-whisper ASR
5. faithful cleanup
```

Reason:

- This supports YouTube Shorts and many other supported platforms without creating a custom scraper per site.

## Minimum schema for a platform-neutral local queue

The current `videos.csv` should not be overloaded forever. Keep it for TikTok compatibility, but add a JSONL or SQLite spool with this normalized shape:

```json
{
  "id": "tiktok:7642714384510356758",
  "platform": "tiktok",
  "creator_id": "tiktok-webhivedigital",
  "creator_handle": "webhivedigital",
  "creator_url": "https://www.tiktok.com/@webhivedigital",
  "source_url": "https://www.tiktok.com/@webhivedigital/video/7642714384510356758",
  "post_id": "7642714384510356758",
  "published_at": "2026-05-22",
  "discovered_at": "2026-06-18T00:00:00Z",
  "title_or_description": "",
  "post_caption": "",
  "duration_seconds": null,
  "discovery_adapter": "tiktok_yt_dlp_flat_playlist",
  "acquisition_adapter": "yt_dlp_subtitles",
  "transcript_status": "queued|transcribed|needs_asr|needs_source_review|out_of_scope_old",
  "caption_source": "yt_dlp_vtt|platform_meta|post_caption|asr|manual|",
  "media_path": "",
  "raw_transcript_path": "",
  "clean_transcript_path": "",
  "asr_metadata_path": "",
  "quality_flags": [],
  "failure_reason": "",
  "review_status": "new|needs_source_review|approved|rejected|",
  "private": true
}
```

Implementation note:

- JSONL is enough for the first pass.
- SQLite is better once multiple workers/adapters exist.
- Do not block the first adapter pass on a full migration from `videos.csv`.

## Recommended implementation phases

### Phase 1 — Dependency and doctor hardening

Goal: make the local worker explicitly aware of optional free intake tools.

Tasks:

1. Update local setup/runbook to include install commands for:

```text
gallery-dl
instaloader
whisper.cpp optional
```

2. Keep `base2026-worker.py doctor` as the source of truth for installed tools.
3. Do not fail doctor if optional tools are missing; report capability instead.
4. Add a short note that Instagram support is disabled/degraded unless `gallery-dl` or `instaloader` is present.

Acceptance:

```text
.venv/bin/python scripts/base2026-worker.py doctor
```

prints required and optional tool capability clearly.

### Phase 2 — Add discovery adapter script without changing current TikTok runner

Goal: prove platform-neutral discovery while preserving the existing TikTok scripts.

Create:

```text
scripts/social-discover.py
```

Input:

```bash
python3 scripts/social-discover.py \
  --config config/creators.local.json \
  --out .planning/social-discovered.jsonl \
  --limit-per-creator 20
```

Behavior:

- Read current creator config shape used by `config/creators.example.json` and `config/tiktok-intake-queue.local.json`.
- For TikTok, call the same effective discovery method as `tiktok-backfill-inventory.ps1`: `yt-dlp --flat-playlist`.
- If TikTok yt-dlp discovery fails, record failure and optionally try `gallery-dl` if installed.
- For Instagram, use `gallery-dl` if installed; otherwise record `missing_adapter_gallery_dl`.
- Do not write to `videos.csv` in the first version.
- Write normalized JSONL only.

Acceptance:

- A dry run over current TikTok creators writes discovered records to `.planning/social-discovered.jsonl`.
- It does not modify `videos.csv`.
- It reports adapter, success/failure, and counts per creator.

### Phase 3 — Add importer from social-discovered JSONL to existing TikTok CSV only for TikTok

Goal: bridge the new adapter layer into the current proven pipeline.

Create or extend:

```text
scripts/import-social-discovery-to-tiktok-csv.py
```

Behavior:

- Read `.planning/social-discovered.jsonl`.
- Only import `platform == tiktok` records.
- Dedupe by `post_id` / `video_id` against `videos.csv`.
- Preserve current status semantics:
  - new recent row -> `queued`
  - old row before cutoff -> `out_of_scope_old`
- Do not import Instagram into `videos.csv`.

Acceptance:

- Running discovery + import produces the same or compatible result as current `tiktok-backfill-inventory.ps1` for TikTok.
- No public export or deploy is triggered.

### Phase 4 — Add media acquisition fallback archive discipline

Goal: prevent repeated downloads and make retries cheap/safe.

For all future `yt-dlp` media downloads, add archive files under ignored local state, for example:

```text
.planning/download-archives/yt-dlp-tiktok.txt
.planning/download-archives/yt-dlp-instagram.txt
.planning/download-archives/gallery-dl.txt
```

For `yt-dlp` calls that download media, include:

```bash
--download-archive .planning/download-archives/yt-dlp-tiktok.txt
```

Do not use download archives for metadata-only probes if they prevent later media acquisition.

Acceptance:

- Re-running a fetch does not redownload already archived media.
- Archive files are ignored/private.

### Phase 5 — Make `base2026-worker.py export-jsonl` real

Current issue:

`base2026-worker.py export-jsonl` is a skeleton and does not wire processed records into a durable JSONL handoff.

Goal:

Make the worker able to export a processed local record from known paths:

```text
media/audio path
raw transcript path
clean transcript path
ASR metadata path
source URL
creator/platform metadata
quality flags
```

Recommended output:

```text
.planning/local-worker-poc/exports/base2026-worker-YYYYMMDD-HHMMSS.jsonl
```

Do not connect this directly to public export on the first pass. It should be an internal handoff file.

Acceptance:

- Given a small processed test record, `export-jsonl` outputs one complete JSONL record.
- The record contains no cookies, media blobs, raw logs, or secrets.

### Phase 6 — Controlled Instagram proof test

Only after Phases 1-5.

Goal: test whether free Instagram intake is viable without destabilizing TikTok.

Test set:

```text
2 Instagram creators
max 5 recent Reels each
no public import
no public deploy
```

Run order:

```text
social-discover -> social fetch/probe -> ASR if needed -> local JSONL only
```

Record per URL:

- discovery success;
- media download success;
- post caption availability;
- speech transcript availability;
- ASR quality;
- account/session/rate-limit issues;
- whether the record is suitable for Base2026.

Acceptance:

- Produce a local report under `.planning/instagram-intake-proof-YYYYMMDD.md`.
- Do not add Instagram to public Base2026 until the report is reviewed.

## Recommended rate limits

Free scraping should be slow and boring.

TikTok starting limits:

```json
{
  "max_profiles_per_run": 5,
  "max_new_videos_per_creator": 20,
  "sleep_between_creators_sec": [60, 240],
  "sleep_between_downloads_sec": [10, 90],
  "daily_hard_cap": 300
}
```

Instagram starting limits:

```json
{
  "max_profiles_per_run": 2,
  "max_new_videos_per_creator": 5,
  "sleep_between_creators_sec": [180, 600],
  "sleep_between_downloads_sec": [30, 180],
  "daily_hard_cap": 50
}
```

These limits are intentionally conservative. Increase only after successful logs over several days.

## Public/private boundary rules

Always private/local:

- raw captions;
- raw ASR;
- media/audio/video files;
- cookies/session files;
- browser profiles;
- extractor logs;
- failed downloads;
- source-review rows;
- unreviewed transcripts;
- Instagram proof-test artifacts.

Potentially public only after review/export policy:

- reviewed public source text;
- public source records;
- public passages;
- public insight cards;
- creator/source attribution;
- public-safe metadata.

Before any Git staging or deploy, run the existing boundary checks from the repo, not new improvised checks.

## Suggested Codex task prompt

Use this prompt when handing the work to Codex:

```text
You are working in /Users/alexyarosh/Projects/base2026-migration/DW/base2026.
Read AGENTS.md and docs/research/FREE_SOCIAL_VIDEO_INTAKE_RECOMMENDATIONS_2026_06_18.md first.

Task: implement Phase 1 and Phase 2 only from the recommendations file.

Constraints:
- Do not deploy.
- Do not reindex Meilisearch.
- Do not run public export.
- Do not modify public-data/tiktok.
- Do not commit or publish private artifacts.
- Do not replace existing TikTok scripts.
- New output should go only to scripts/docs and ignored .planning test output.

Expected work:
1. Update local worker/setup docs if needed so optional tools gallery-dl and instaloader are clearly surfaced.
2. Create scripts/social-discover.py that reads current creator config shape and writes normalized discovery JSONL.
3. TikTok adapter should use yt-dlp flat playlist first.
4. Instagram adapter should report missing gallery-dl/instaloader capability if tools are absent; do not fake results.
5. Add a small dry-run/smoke command in docs or script help.
6. Verify with a bounded run against 1 current TikTok creator and write output to .planning/social-discovered-smoke.jsonl.
7. Report exact files changed and command output.
```

## Final recommendation

The correct next move is **not** “add Instagram scraping everywhere.”

The correct next move is:

```text
make discovery platform-neutral
keep TikTok behavior compatible
add gallery-dl/instaloader as optional adapters
write normalized local JSONL
only then test Instagram in a tiny private proof run
```

This keeps Base2026 aligned with its actual product: a faithful, searchable creator-video source intelligence database, not a fragile bulk scraper.
