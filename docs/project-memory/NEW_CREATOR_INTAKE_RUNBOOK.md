# New Creator Intake Runbook

## Purpose

Add or refresh TikTok/Instagram creators without turning Codex chat memory into the source of truth.

## Creators Requested For This Run

- TikTok: `@joshuamaraney`
- TikTok refresh: `@webhivedigital`

## Intake Contract

Each source record must preserve:

- platform;
- creator handle;
- creator profile URL;
- original post URL;
- post/video id when available;
- post date when available;
- original platform caption when available;
- transcript source label: `platform_caption`, `asr`, or `manual_review`;
- polished transcript text in English;
- transcript quality flags;
- public excerpt/passages;
- source link for attribution.

## Processing Order

1. Discover creator posts.
2. De-duplicate against existing source records by platform + post id or canonical URL.
3. For each new post:
   - navigate to the individual video page and extract platform caption/meta from the loaded page;
   - isolate only the active source record; do not include captions from TikTok recommended videos on the same page;
   - if caption is missing or obviously incomplete, download audio for ASR only in the local/private worker;
   - transcribe with `faster-whisper`;
   - apply deterministic punctuation and paragraph cleanup;
   - run optional local/GPT-5.4 cleanup only under strict faithful-transcript rules.
4. Reject records that fail attribution or transcript-quality checks.
5. Export JSONL:
   - `source_records.jsonl`
   - `passages.jsonl`
   - `insight_cards.jsonl`
6. Validate public export policy.
7. Reindex Meilisearch.
8. Deploy only generated public release artifacts, never raw intake files.

## Faithful Transcript Rules

The cleanup layer may:

- add punctuation;
- split paragraphs;
- fix obvious ASR casing;
- keep the speaker's order and wording.

The cleanup layer must not:

- add new facts;
- summarize instead of transcribing;
- translate to Russian;
- remove uncertainty;
- rewrite the creator into polished marketing prose;
- merge separate claims without evidence.

## GPT Review Plan Alignment

The public product should be positioned as:

- attributed source discovery;
- searchable evidence passages;
- topic and insight cards;
- comparison-ready source records;
- original creator link-first UX.

It should not be positioned as:

- a bulk transcript dump;
- a replacement for creator channels;
- an SEO farm;
- a public archive of unreviewed raw captions.

## Evidence From 2026-06-08 Browser Check

- `@joshuamaraney` profile exposed 33 video links in DOM.
- `@webhivedigital` profile exposed 35 video links in DOM.
- individual TikTok video pages exposed useful caption text through page metadata and visible body text.
- video `textTracks` were empty and media source URLs were `blob:` URLs, so the current best no-paid-token path is caption/meta first, ASR fallback second.
- batch `fetch()` inside TikTok returned empty metadata for tested URLs, so extraction should use real browser navigation or the local worker, not plain page fetch.
