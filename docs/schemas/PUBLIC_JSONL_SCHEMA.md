# Public JSONL Schema

Last updated: 2026-06-07

## `source_records.jsonl`

One row per public source item.

```json
{
  "source_id": "tiktok:tjrobertson52:7570500893028715789",
  "platform": "tiktok",
  "post_id": "7570500893028715789",
  "source_url": "https://www.tiktok.com/@tjrobertson52/video/7570500893028715789",
  "creator_handle": "tjrobertson52",
  "creator_url": "https://www.tiktok.com/@tjrobertson52",
  "published_at": "2026-05-14",
  "title": "Platform caption or reviewed title",
  "excerpt": "Short evidence excerpt only.",
  "language": "en",
  "transcript_method": "caption|asr_local|manual",
  "full_transcript_public": false,
  "public_policy": "excerpt_only"
}
```

## `passages.jsonl`

One row per searchable passage.

```json
{
  "id": "tiktok:tjrobertson52:7570500893028715789:p003",
  "source_id": "tiktok:tjrobertson52:7570500893028715789",
  "platform": "tiktok",
  "creator_handle": "tjrobertson52",
  "source_url": "https://www.tiktok.com/@tjrobertson52/video/7570500893028715789",
  "published_at": "2026-05-14",
  "year": "2026",
  "body": "A short transcript passage used as search evidence.",
  "topics": ["ai-overviews", "seo"],
  "public_policy": "search_passage"
}
```

## `insight_cards.jsonl`

One row per extracted claim or viewpoint.

```json
{
  "id": "insight:ai-overviews:001",
  "topic_id": "ai-overviews",
  "source_id": "tiktok:tjrobertson52:7570500893028715789",
  "creator_handle": "tjrobertson52",
  "claim_text": "AI Overviews reduce clicks for informational queries.",
  "evidence_excerpt": "AI Overviews reduce clicks by 58%.",
  "stance": "supports",
  "confidence": 0.82,
  "review_status": "needs_review",
  "public": false,
  "needs_review": true,
  "public_policy": "needs_review"
}
```

## `topics.jsonl`

One row per public topic extracted from source-backed insight cards.

```json
{
  "id": "topic:ai-overviews",
  "topic_id": "ai-overviews",
  "topic": "AI Overviews",
  "definition": "Source-backed creator statements and evidence excerpts related to AI Overviews.",
  "source_count": 42,
  "public_source_count": 18,
  "passage_count": 61,
  "insight_count": 55,
  "public_insight_count": 24,
  "creator_count": 3,
  "top_creators": [{"handle": "tjrobertson52", "count": 12}],
  "latest_published_at": "2026-05-14",
  "public": true,
  "public_policy": "topic_index"
}
```

## Rules

- No public claim without `source_id`.
- No public claim without `evidence_excerpt`.
- No full transcript in public exports by default.
- No public topic without at least one public source-backed insight card.
- Topic and comparison pages with fewer than two public insight cards must be generated as `noindex,follow` and excluded from topic index pages.
- Pending claims may be exported for private review, but must use `public=false`.
- `raw_transcript`, `clean_transcript`, media paths, logs, cookies, and local file paths stay private.
