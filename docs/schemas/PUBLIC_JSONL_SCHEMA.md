# Public JSONL Schema

Last updated: 2026-06-14

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
  "public_source_text": "Reviewed public source text normalized for reading and search when policy allows.",
  "public_source_text_available": true,
  "source_summary_short": "Short Base2026-authored summary of what this source is about.",
  "source_summary_long": "Fuller Base2026-authored explanation of the source context and value.",
  "language": "en",
  "transcript_method": "caption|asr_local|manual",
  "full_transcript_public": false,
  "public_policy": "excerpt_only"
}
```

## `documents.jsonl`

One row per public search document copied into the static runtime package.

```json
{
  "item_id": "tiktok-video-7570500893028715789",
  "source_id": "tiktok:tjrobertson52:7570500893028715789",
  "creator_handle": "tjrobertson52",
  "published_date": "2026-05-14",
  "source_type": "tiktok",
  "source_url": "https://www.tiktok.com/@tjrobertson52/video/7570500893028715789",
  "public_source_text": "Reviewed readable public source text.",
  "source_summary_short": "Short Base2026-authored source summary.",
  "source_summary_long": "Longer Base2026-authored source explanation.",
  "topics": ["ai-overviews", "seo"],
  "topic_labels": ["AI Overviews", "SEO"]
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

## `topic_signal_briefs.jsonl`

One row per strong public topic with enough source-backed evidence to summarize repeated signals.

Strong topic threshold:

- `source_count >= 5`
- `creator_count >= 2`
- `public_insight_count >= 3`

```json
{
  "topic_id": "internal-linking",
  "topic_label": "Internal Linking",
  "status": "strong",
  "robots": "index,follow",
  "source_count": 5,
  "creator_count": 2,
  "public_insight_count": 5,
  "passage_count": 8,
  "latest_source_date": "2026-06-05",
  "first_source_date": "2026-05-15",
  "freshness_score": 90,
  "creator_angles": [
    {
      "creator_handle": "webhivedigital",
      "creator_display_name": "webhivedigital",
      "source_count": 2,
      "public_insight_count": 2,
      "main_angle": "Short source-backed creator angle.",
      "representative_source_ids": ["tiktok-video-..."],
      "latest_source_date": "2026-05-15"
    }
  ],
  "repeated_tactics": [
    {
      "label": "Use internal links to route authority and context toward priority pages.",
      "supporting_creator_count": 2,
      "supporting_source_count": 4,
      "source_ids": ["tiktok-video-..."]
    }
  ],
  "source_backed_actions": [
    {
      "action": "Short public action summary.",
      "source_ids": ["tiktok-video-..."],
      "creator_handles": ["build_in_public"]
    }
  ],
  "monthly_activity": [
    {"month": "2026-06", "source_count": 2, "creator_count": 1, "public_insight_count": 2}
  ],
  "top_sources": [
    {
      "source_id": "tiktok:...",
      "item_id": "tiktok-video-...",
      "creator_handle": "build_in_public",
      "published_date": "2026-06-05",
      "title": "Reviewed source title or summary.",
      "public_insight_count": 2
    }
  ],
  "generated_at": "2026-06-14T00:00:00Z",
  "generator_version": "signal-briefs-v1"
}
```

## Agent-readable public files

- `/knowledge/llms.txt` describes the Base2026 public library for crawlers and AI agents.
- `/llms.txt` describes the root Alex Yarosh site and points agents to Base2026.
- `/knowledge/data-dictionary.json` documents the public data files and public/private boundary.
- `/knowledge/api-index.json` documents current static public data endpoints and the future read-only API/MCP contract.

## Rules

- No public claim without `source_id`.
- No public claim without `evidence_excerpt`.
- Reviewed `public_source_text` is allowed when policy and QA allow it; raw captions and raw ASR stay private.
- No full raw/unreviewed transcript dump in public exports.
- No public topic without at least one public source-backed insight card.
- No public topic signal brief unless the topic meets the strong threshold.
- Topic and comparison pages with fewer than two public insight cards must be generated as `noindex,follow` and excluded from topic index pages.
- Pending claims may be exported for private review, but must use `public=false`.
- `raw_transcript`, `clean_transcript`, media paths, logs, cookies, and local file paths stay private.
