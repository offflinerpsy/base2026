# TikTok Intake Record Schema

## Purpose

Normalize TikTok browser/caption extraction before export into public source records and passages.

## Input Queue Record

```json
{
  "platform": "tiktok",
  "handle": "joshuamaraney",
  "profile_url": "https://www.tiktok.com/@joshuamaraney",
  "video_url": "https://www.tiktok.com/@joshuamaraney/video/7648904862331145480",
  "status": "discovered_not_processed"
}
```

## Extracted Video Record

```json
{
  "platform": "tiktok",
  "creator_handle": "joshuamaraney",
  "creator_url": "https://www.tiktok.com/@joshuamaraney",
  "source_url": "https://www.tiktok.com/@joshuamaraney/video/7648904862331145480",
  "canonical_url": "https://www.tiktok.com/@joshuamaraney/video/7648904862331145480",
  "webpage_url": "https://www.tiktok.com/@joshuamaraney/video/7648904862331145480",
  "source_id": "7648904862331145480",
  "title": "How I Get the Perfect Lighting for My Social Media Videos...",
  "caption_text": "How I Get the Perfect Lighting for My Social Media Videos...",
  "caption_source": "tiktok_meta_description",
  "transcript_text": "",
  "transcript_source": "platform_caption",
  "quality_flags": ["caption_only", "needs_asr_if_caption_too_short"],
  "extracted_at": "2026-06-08T00:00:00Z"
}
```

## URL Normalization

Extractor outputs may include historical aliases:

- `source_url`
- `canonical_url`
- `webpage_url`

Before SQLite import, `scripts/import-tiktok-staging-to-kb.py` normalizes URL fields in this priority order:

1. `canonical_url`
2. `webpage_url`
3. `source_url`

The normalized value is written back to all three fields in memory, and SQLite receives the normalized value as `generic_items.canonical_url` / `videos.url`.

## Import Normalization

Before import, `scripts/import-tiktok-staging-to-kb.py` also normalizes:

- `creator_handle` from `creator_handle` / `handle` / `creator_url`;
- `creator_url` from `creator_url` / `profile_url` / `creator_handle`;
- `source_id` from `source_id` or the `/video/{id}` URL segment;
- `transcript_text` from `transcript_text` or `caption_text`;
- `quality_flags` from a JSON array or comma-separated string.

## Required Fields Before Public Export

- `platform`
- `creator_handle`
- `creator_url`
- `source_url`
- `source_id`
- `caption_text` or `transcript_text`
- `transcript_source`
- `quality_flags`

## Active Caption Isolation Rule

TikTok pages may include captions from recommended videos in the body text. The extractor must prefer:

1. `meta[property="og:description"]`
2. `meta[name="description"]` active video segment
3. visible active-video caption block near the current creator/video

Never use the full page body as transcript without isolating the active video.

## ASR Fallback Trigger

Use ASR only when:

- active caption is missing;
- active caption is under the configured minimum length;
- active caption is only hashtags;
- active caption is clearly not the spoken content;
- video is important enough for local/private ASR processing.
