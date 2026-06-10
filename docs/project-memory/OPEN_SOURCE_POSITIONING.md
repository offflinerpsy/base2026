# Open Source Positioning

Last updated: 2026-06-07

## Honest public framing

Base2026 is a searchable knowledge-base framework for turning short-form public creator videos into structured searchable text.

Current focus:

- local-worker ingestion;
- TikTok first;
- Instagram planned;
- transcript provenance;
- creator attribution and original source links;
- public insight/search layer, not a transcript dump;
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

- short source-backed excerpts;
- creator/source pages;
- topic pages;
- insight cards;
- comparison of viewpoints;
- methodology and opt-out.

Avoid:

- full transcript pages as the main public product;
- SEO pages that exist only because transcripts contain keywords;
- AI-generated conclusions without source evidence;
- implying creator endorsement.

Full transcripts are private/local by default unless a creator opts in, the content is owned/demo content, or a reviewed access/noindex policy is selected.

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
- decide whether public demo uses excerpt-only or noindexed full transcript views;
- run publication audit;
- run secret scan;
- update README with honest ingestion status.
