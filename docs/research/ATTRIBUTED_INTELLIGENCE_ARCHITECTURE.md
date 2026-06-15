# Attributed Intelligence Architecture

Last updated: 2026-06-14

## 2026-06-14 product-passport correction

This architecture note originally pushed the public layer too far toward `excerpt-only`. The corrected source of truth is `docs/project-memory/BASE2026_PRODUCT_PASSPORT_2026_06_14.md`.

Keep the anti-scraping boundary, but distinguish raw artifacts from reviewed public source text:

- raw captions, raw ASR, media, logs, private QA, and unreviewed transcripts remain private;
- reviewed polished public source text/transcript may become the selected source-record reading surface;
- passages and snippets remain search units/previews, not the only readable source context;
- Base2026-authored summaries, topics, insights, methodology, original links, and correction/removal controls provide the public value layer.

## Goal

Move Base2026 from a transcript-search prototype to a source-backed intelligence product.

The product should answer:

```text
Who said this?
Where did they say it?
What short evidence supports it?
What topic does it belong to?
Who else agrees, disagrees, or adds nuance?
```

It should not be optimized around publishing raw third-party transcript dumps.

## Layers

### 1. Private local transcript layer

Lives on the local machine only.

Contains raw captions, ASR output, private transcript drafts, QA notes, local media/audio when needed, and failure logs.

Purpose: research, correction, reprocessing, and admin review.

### 2. Public source-record layer

Safe for public demo and GitHub-generated release packages.

Contains platform, creator, profile URL, original post URL, post date, transcript method, reviewed public source text when policy allows, short preview/excerpt fields for cards, and public policy flags.

Does not contain raw/unreviewed transcript dumps.

### 3. Public passage layer

Searchable Meilisearch unit.

Contains passage text, source id, creator, platform, date/year, topic/category fields when available, and original URL.

Passages can be short enough to act as search evidence and highlighting targets. They should not replace the selected source-record reading surface when reviewed public source text is available.

### 4. Public insight layer

Derived offline, cached, and source-backed.

Contains topic id, claim text, evidence excerpt, stance, confidence, source id, creator, and review status.

No live LLM call is needed when a user searches.

### 5. Comparison layer

Built from reviewed insight cards.

Example:

```text
Topic: AI Overviews
  TJ Robertson: supports "AI Overviews reduce clicks for informational queries"
  WebHiveDigital: adds nuance on schema / structured data
  Build In Public: practical implementation angle
```

Comparison pages should show source links and evidence excerpts, not unsupported summaries.

## Data flow

```text
creator registry
  -> discover URLs
  -> captions or media
  -> local ASR
  -> clean transcript
  -> passage chunking
  -> topic/claim extraction
  -> evidence validation
  -> public JSONL export
  -> VPS ingest / Meilisearch index
  -> public UI
```

## Public indexes

Recommended indexes:

- `base2026_sources`
- `base2026_passages`
- `base2026_insights`
- `base2026_creators`
- `base2026_topics`

Current MVP can keep a single passages index, but the export schema should already separate records.

## Search behavior

Default search:

- query passages;
- highlight terms;
- show creator, platform, date, source URL;
- show short passage/excerpt;
- offer `Open source record`;
- offer `Open original`.

Future search:

- if query matches a topic, show topic panel;
- if reviewed insight cards exist, show `Related viewpoints`;
- if comparison exists, show grouped creator positions.

## Indexing policy

Indexable:

- creator pages;
- topic pages;
- source-record pages with excerpts;
- insight/comparison pages with added value.

Noindex/private by default:

- full transcript pages;
- admin review pages;
- raw caption/ASR pages;
- failed extraction logs.

## Worker contract

The local worker should produce records in this order:

1. `source_records.jsonl`
2. `passages.jsonl`
3. `insight_cards.jsonl`
4. `topics.jsonl`
5. `run_report.json`

Each record must include enough provenance to debug it without chat memory.

## Current MVP implementation

Current export behavior:

- `scripts/export-public-tiktok.py` creates compatibility files: `documents.jsonl` and `chunks.jsonl`.
- It also creates architecture files: `source_records.jsonl`, `passages.jsonl`, `insight_cards.jsonl`, and `creators.jsonl`.
- Full raw/unreviewed transcripts are off by default.
- Existing claim rows are exported as `insight_cards`.
- Because current claims are `pending`, exported insight cards are `public=false` until review/validation is added.
- `scripts/check-public-export-policy.py` currently validates that excerpt-only exports do not leak full transcripts. The next public contract should validate that reviewed public source text is allowed while raw/unreviewed transcript artifacts remain blocked.

## Reviewer rule

Before deploying or publishing a release:

- confirm no raw/unreviewed transcript is exported; reviewed public source text requires explicit policy support;
- confirm every public claim has a source id and evidence excerpt;
- confirm every public result links to the original post;
- confirm opt-out/correction docs are visible.
