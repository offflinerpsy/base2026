# Public Content Risk Model

Last updated: 2026-06-07

## Core verdict

Base2026 should not ship as a public dump of full third-party TikTok or Instagram transcripts.

The safer and stronger product shape is:

```text
private/local layer:
  full raw captions
  full ASR transcripts
  clean transcripts
  QA notes

public layer:
  attributed source records
  short evidence excerpts
  topic and insight cards
  creator pages
  comparison pages
  links to original posts
  methodology and opt-out
```

## Why this matters

Public short-form videos are public to watch, but that does not automatically make automated collection, republishing, or commercial reuse safe.

Google also has a clear quality risk: mass pages built from scraped or transformed third-party content can be treated as scaled or scraped content when they provide little original value.

This means the public product must add value beyond transcription:

- attribution;
- provenance;
- topic structure;
- source-backed claims;
- creator pages;
- comparison of viewpoints;
- editorial context;
- correction and opt-out flow.

## Product rule

Do not frame Base2026 as:

```text
We scraped TikTok and published the transcripts.
```

Frame it as:

```text
Base2026 is an open-source local-first research tool that turns public short-form expert videos into attributed, searchable, auditable knowledge records.
```

## Public-safe content model

Public pages can show:

- creator handle and profile URL;
- platform;
- original post URL;
- posted date if known;
- short transcript excerpt needed for search context;
- topic tags;
- source-backed insight cards;
- stance/claim labels with confidence;
- methodology notes;
- opt-out/correction path.

Public pages should avoid by default:

- full transcript replication as the primary page content;
- bulk pages that exist only to capture long-tail SEO traffic;
- AI summaries that replace or distort what a creator said;
- monetized pages built mainly from another creator's speech;
- implying creator endorsement.

## Full transcripts

Full transcripts remain useful, but the default location is private/local.

Before broad public launch, choose one of these policies:

1. no public full transcripts;
2. public excerpts only, full transcript noindexed;
3. full transcript available only in an authenticated/admin/research view;
4. public full transcript only for creators who opt in or for owned/demo content.

Current recommendation: option 1 for launch, option 3 for the private operator view.

## Insight and comparison layer

The comparison feature should be cached and source-backed, not generated live per query.

Suggested derived schema:

```json
{
  "topic_id": "ai-overviews",
  "source_id": "tiktok:tjrobertson52:7570500893028715789",
  "creator_handle": "tjrobertson52",
  "claim_text": "AI Overviews reduce clicks for informational queries.",
  "evidence_excerpt": "AI Overviews reduce clicks by 58%.",
  "stance": "supports",
  "confidence": 0.82,
  "needs_review": false
}
```

Rules:

- every claim must point to a source record;
- every public claim must include an evidence excerpt or source link;
- local LLM may classify topic/stance, but must not invent unsupported claims;
- low-confidence claims stay hidden until reviewed.

## Low-token implementation path

Do not use live GPT calls during user search.

Pipeline:

1. ASR/caption intake creates raw and clean transcript records.
2. Deterministic chunker splits transcript into short passages.
3. Local LLM extracts topics, claims, stance, caveats, and quality flags into JSON.
4. Validator checks every claim against an evidence excerpt.
5. Meilisearch indexes passages, creators, topics, and claim cards.
6. UI lets users search, filter, open source, and compare cached viewpoints.

This keeps the public app fast and cheap.

## Launch posture

Use a small curated demo first.

Launch checklist:

- methodology page;
- opt-out/correction page;
- creator attribution visible on every result;
- source link visible on every result;
- public excerpts rather than full transcript pages;
- noindex for any experimental full transcript pages;
- Search Console monitored after launch.
