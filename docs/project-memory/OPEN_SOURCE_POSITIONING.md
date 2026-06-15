# Open Source Positioning

Last updated: 2026-06-14

## 2026-06-14 product-passport correction

This file originally used `not a transcript dump` to mean `excerpt-only public source pages`. That is no longer the product contract.

Correct meaning:

- raw captions, raw ASR, media, private QA, and unreviewed transcripts stay private;
- reviewed polished public source text/transcript may be exposed as the source-record reading surface when policy allows;
- public pages must add Base2026-authored context, topics, insight cards, attribution, methodology, and correction/removal paths;
- search result cards should stay short, but selected source records should not be arbitrarily truncated.

Source of truth: `docs/project-memory/BASE2026_PRODUCT_PASSPORT_2026_06_14.md`.

## Honest public framing

Base2026 is a searchable knowledge-base framework for turning short-form public creator videos into structured searchable text.

Current focus:

- local-worker ingestion;
- TikTok first;
- Instagram planned;
- transcript provenance;
- creator attribution and original source links;
- public insight/search layer with reviewed public source text, not raw transcript dumps;
- Meilisearch-powered search UI;
- modular extractors.

## Do not claim

Do not claim:

- fully automatic universal TikTok/Instagram transcription;
- stable social scraping from a VPS;
- official TikTok/Instagram support;
- perfect captions;
- no-rate-limit operation;
- AI summaries as source truth.
- permission to republish every full third-party transcript.

## What to say instead

Use direct language:

```text
Social-video extraction changes often. Base2026 keeps ingestion modular:
local workers can try captions first, fall back to audio ASR, preserve provenance,
and upload clean JSONL to a small VPS search/UI layer.
```

```text
The project is looking for better extractor adapters, ASR benchmarks,
Instagram/TikTok reliability reports, and review workflows.
```

## Public data posture

Public Base2026 should be presented as an attributed research/search layer.

Prefer:

- reviewed polished public source text on selected source records where policy allows;
- short source-backed excerpts for search previews;
- creator/source pages;
- topic pages;
- insight cards;
- comparison of viewpoints;
- methodology and opt-out.

Avoid:

- raw/unreviewed transcript pages as the main public product;
- SEO pages that exist only because transcripts contain keywords;
- AI-generated conclusions without source evidence;
- implying creator endorsement.

Raw captions, raw ASR, media, private QA notes, and unreviewed transcripts are private/local. Reviewed public source text/transcript is allowed when it is contextualized as a Base2026 source record rather than published as a scraped standalone transcript.

## GitHub contribution hooks

Invite contributions for:

- TikTok extractor adapters;
- Instagram extractor adapters;
- caption detection;
- ASR model benchmarks;
- local LLM cleanup guards;
- Meilisearch/UI improvements;
- VPS ingest API;
- creator registry/admin UX.

## Stop-slop rule

Public docs should sound like engineering notes, not AI marketing copy.

Avoid:

- "revolutionary";
- "seamless";
- "unlock the power";
- "game-changing";
- "transform your workflow";
- vague claims without implementation detail.

Prefer:

- what works;
- what breaks;
- what is local;
- what is public;
- what is not solved yet;
- how contributors can help.

## README direction

README should include:

1. What Base2026 does.
2. What is currently working.
3. What is local-only.
4. What is not solved yet.
5. How ingestion is designed.
6. How to run the public UI.
7. How to contribute adapters/benchmarks.
8. What data must not be committed.

## GitHub readiness blocker

Before public GitHub:

- choose license;
- remove or classify untracked `web/` files;
- decide whether local server code is public or internal;
- add sample creator registry only, no real cookies;
- add methodology and opt-out docs/pages;
- decide the public source-text implementation contract: reviewed public source text in source records, with raw/unreviewed transcripts blocked;
- run publication audit;
- run secret scan;
- update README with honest ingestion status.
