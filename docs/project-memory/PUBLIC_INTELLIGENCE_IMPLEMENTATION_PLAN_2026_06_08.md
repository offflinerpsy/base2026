# Public Intelligence Implementation Plan

Last updated: 2026-06-08

## Goal

Turn Base2026 from a useful transcript-search demo into a public, open-source, source-backed intelligence product.

The public product must show attribution, provenance, excerpts, topics, reviewed insights, creator controls, and comparison pages. It must not become a mass public dump of third-party transcripts.

## Research anchors

- Google Search Central: people-first content and spam policies. Public pages need added value, not scaled/scraped content.
- Google Search Central: `VideoObject` structured data. Source pages can reference original videos with clean metadata.
- Schema.org: `Claim`, `ClaimReview`, `Person`, `CreativeWork`, `CollectionPage`. Insight/claim pages should use source-backed schema only when reviewed.
- Meilisearch docs: filterable attributes and facets require explicit index settings.
- Meilisearch docs: multi-search/federated search can query passages, sources, insights, creators, and topics without client-side hacks.
- GitHub docs: serious open-source repos need README, license, contributing guide, code of conduct, security policy, and clear contribution expectations.
- OpenSSF Scorecard: use automated security-health checks before grant/public submission.

## Architecture decision

Keep the current static UI and Meilisearch backend. Do not replace the stack yet.

Upgrade the product in layers:

1. public static pages generated from JSONL;
2. separate public data files for sources, passages, insights, topics, and creators;
3. Meilisearch indexes for search/facets;
4. no live LLM calls during search;
5. local/private full transcript storage;
6. reviewed/cached insight and comparison layer.

## Public data contract

Public export files:

- `source_records.jsonl`
- `passages.jsonl`
- `insight_cards.jsonl`
- `topics.jsonl`
- `creators.jsonl`
- `manifest.json`

Compatibility files may stay for now:

- `documents.jsonl`
- `chunks.jsonl`

Forbidden in GitHub:

- raw captions;
- media/audio;
- local SQLite DB;
- logs;
- cookies/tokens;
- generated release zips;
- full third-party transcript dumps.

## UI/pages to build

### Phase 1 — Creator Pages

Route shape:

```text
/knowledge/creators/{handle}.html
```

Each page shows:

- creator handle;
- platform/profile link;
- indexed source count;
- latest posts;
- top topics;
- links to source records;
- correction/opt-out link;
- no claim of creator endorsement.

### Phase 2 — Source Pages

Route shape:

```text
/knowledge/sources/{source_id}.html
```

Each page shows:

- original post link;
- creator/date/platform;
- short public excerpt;
- related passages;
- reviewed insights if available;
- transcript method/provenance;
- no public full transcript by default.

Full transcript handling:

- private/local by default;
- public only if explicit reviewed policy allows it;
- otherwise keep transcript drawer as admin/private or noindex.

### Phase 3 — Topic Pages

Route shape:

```text
/knowledge/topics/{topic_id}.html
```

Each page shows:

- topic definition;
- related source excerpts;
- top creators speaking about it;
- related insight cards;
- caveats and methodology.

### Phase 4 — Insight Cards

Insight card fields:

- `topic_id`;
- `claim_text`;
- `evidence_excerpt`;
- `source_id`;
- `creator_handle`;
- `stance`;
- `confidence`;
- `review_status`;
- `public`.

Only reviewed or high-confidence validated cards appear publicly.

### Phase 5 — Comparison Pages

Route shape:

```text
/knowledge/compare/{topic_id}.html
```

Each page groups creator viewpoints:

- supports;
- contradicts;
- adds nuance;
- caveat/risk.

Every row links to a source record and evidence excerpt.

### Phase 6 — Search UI Upgrade

Current `/knowledge/` remains the main search console.

Add:

- topic chips from real exported topics;
- result type tabs: Passages, Sources, Insights, Creators;
- creator page links;
- source page links;
- related insights panel;
- clear public/private transcript wording.

Use Meilisearch multi-search/federated search after indexes are separated.

### Phase 7 — Open-source Readiness

Before GitHub:

- choose license;
- write README for local-first pipeline, not public transcript database;
- add CONTRIBUTING;
- add CODE_OF_CONDUCT;
- add SECURITY;
- add `.github/workflows` for tests and OpenSSF Scorecard;
- run publication boundary audit;
- stage only public-safe files.

## Implementation order

Do this in order:

1. Add `topics.jsonl` export from deterministic topic extraction over existing claim topics and keyword buckets.
2. Add static page generator for creators, sources, topics, and compare pages.
3. Add noindex/full-transcript policy controls in generated pages.
4. Add Meilisearch index settings for topics/sources/insights.
5. Add multi-search UI only after static pages exist.
6. Add review queue for insight cards.
7. Run desktop/mobile QA and public export validation.
8. Run GitHub publication audit.

## First build target

Build Phase 1 + Phase 2 first:

- creator pages;
- source pages;
- excerpt-only public page content;
- links from search results to generated pages;
- `VideoObject`/`Person` JSON-LD where safe;
- noindex guard for any full transcript view.

This gives immediate product value without risky transcript-dump behavior.

## Current implementation status

Shipped in release `base2026-public-intel-pages-ay6`:

- Phase 1 creator pages.
- Phase 2 excerpt-first source pages.
- Phase 3 topic pages.
- Phase 5 deterministic comparison pages.
- Search result topic chips.
- Excerpt-only public source-dialog payload.
- Meilisearch topic fields: `topic_labels` searchable, `topics` filterable.

Indexing policy:

- aggregate topics with at least two public insight cards are `index,follow`;
- singleton topic/compare pages are generated for user navigation but marked `noindex,follow`;
- full third-party transcripts remain private/local by default.

Remaining:

- Phase 4 reviewed insight queue UI;
- Phase 6 multi-index search tabs;
- Phase 7 open-source readiness, license, security/publication audit, and GitHub workflow.
