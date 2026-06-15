# Base2026 API/MCP Public Contract Plan

Date: 2026-06-14

## Position

Base2026 should expose a read-only public data contract before it exposes any write, review, ingestion, or private pipeline tools. The first version can be powered by static public release files. A later API or MCP server should preserve the same public/private boundary.

## Public Surfaces

- Search workspace: `/knowledge/`
- Static source pages: `/knowledge/sources/*.html`
- Static creator pages: `/knowledge/creators/*.html`
- Static topic pages: `/knowledge/topics/*.html`
- Creator comparison pages: `/knowledge/compare/*.html`
- Base2026 agent file: `/knowledge/llms.txt`
- Root agent file: `/llms.txt`
- Data dictionary: `/knowledge/data-dictionary.json`
- API index: `/knowledge/api-index.json`

## Current Static Public Data

- `/knowledge/static/manifest.json`
- `/knowledge/static/documents.jsonl`
- `/knowledge/static/passages.jsonl`
- `/knowledge/static/insight_cards.jsonl`
- `/knowledge/static/topic_signal_briefs.jsonl`

## Future Read-only Tools

The future MCP/API layer should start with:

- `search_sources(query, filters)` returning public source records and matched public snippets.
- `get_source(source_id_or_item_id)` returning one public source record, public source text, summaries, topics, original attribution, and correction/removal URL.
- `get_creator(handle)` returning creator-level public source counts, topics, and source links.
- `get_topic(topic_id)` returning topic metadata, indexed/static URL, public insight cards, and source links.
- `get_topic_signal(topic_id)` returning a topic signal brief only when status is `strong`.
- `get_public_manifest()` returning release counts, policy flags, and generated timestamps.

## Boundary Rules

- Read-only public data first.
- No raw captions.
- No raw ASR.
- No media/audio/video.
- No private QA notes.
- No local database paths.
- No source vault paths.
- No credentials or cookies.
- No public write/review/import tools until authentication, audit logging, and owner approval are designed.

## SEO/GEO Contract

New public content should be discoverable through:

- canonical static HTML page;
- sitemap inclusion when indexable;
- source/topic/creator schema markup where useful;
- internal link from workspace and relevant static pages;
- llms/data dictionary/API index discoverability;
- stable public source ID or topic ID.

## Implementation Notes

The static public contract is intentionally simple. It gives crawlers, LLMs, and future MCP clients a stable map of public data without exposing private pipeline internals or creating a second source of truth.
