# Base2026 Roadmap

Last reviewed: 2026-06-22

## What Base2026 is

Base2026 is a public, source-backed knowledge base built from reviewed short-form expert videos.

It is designed to help people search, compare, and cite public creator knowledge without turning the project into a raw transcript dump or a video re-hosting site.

## Current live snapshot

Base2026 is already live at `/knowledge/` with:

- 10 public TikTok creators;
- 1,476 public source records;
- 2,016 searchable public passages;
- 1,060 public insight cards;
- creator, source, topic, and comparison pages;
- Base2026 Signal Lab analytics;
- public API/readability files for agents and researchers.

Raw captions, raw ASR output, downloaded media, private QA notes, local databases, and unreviewed source material are not published.

## Done and live

### Public search workspace

Users can search the reviewed public source library, filter by creator/topic/source/year, open source records, and follow links back to the original creator source.

### Source records

Source pages now have a clearer contract:

- reviewed public source text where policy allows;
- source summaries;
- Source Intelligence cards;
- creator attribution;
- correction/removal path;
- no raw caption or raw ASR dump.

### Creator, topic, and comparison pages

The site generates public pages for creators, topics, sources, and topic comparisons. Thin/singleton pages stay controlled so Base2026 does not become low-quality programmatic SEO.

### Signal Lab

Signal Lab is live as the public analytics surface. It shows creator/topic overlap, topic momentum, creator fingerprints, coverage gaps, and deterministic source-backed playbooks from public JSON only.

### Public trust layer

The public methodology, source policy, privacy, support, roadmap, API, and creator correction/removal pages are live.

### Deploy and safety gates

Public releases are packaged, audited, deployed to VPS, and reindexed through repeatable scripts. Publication-boundary checks remain required before staging or deploy.

## In progress

### Reviewed creator intake

New TikTok creator records can be discovered and imported locally, but public publishing is still gated. The current process is:

1. discover public creator posts;
2. import candidates into the private local queue;
3. polish and QA transcript/source text;
4. keep uncertain rows private;
5. export only reviewed public rows;
6. deploy through the release gate.

This protects the public site from weak transcripts, source-only pages, and unsupported claims.

### Historical source review

Some older rows still need source/audio verification. They remain private or gated until reviewed.

### Creator rights workflow

Correction/removal is live. Creator claim workflow, automated request processing, dispute review, and public changelog are still planned.

### Signal Lab v2

Signal Lab v1 is live. Remaining analytics work includes stronger topic pages, better workspace entry points, public chart polish, and later offline AI-assisted briefs with source verification.

## Next

### 1. Stronger workspace integration

Add more useful entry points from search results and topic pages into Signal Lab:

- “Build source-backed playbook” for strong queries;
- “Compare creators for this topic”;
- topic-level mini signal summaries.

### 2. Creator and source operations

Improve the public creator layer:

- complete creator avatars and metadata;
- improve creator profile summaries;
- add a clearer claim/correction workflow;
- keep source attribution consistent across search, source pages, and creator pages.

### 3. Pipeline hardening

Make fresh creator intake more reliable without making it fully automatic:

- better held-row review queue;
- clearer source-review reports;
- safer release-gate defaults;
- continued prevention of private/raw material leakage.

### 4. Public API readiness

Keep public JSON and documentation stable enough for future tools:

- source search;
- source lookup;
- creator comparison;
- topic signal lookup;
- source-backed playbook generation;
- coverage-gap inspection.

## Later

### Offline AI briefs

Use AI only as a build-time review/polish layer, not as a public live hallucination engine. Any AI-assisted brief should be generated offline, verified against source IDs, and shipped as static reviewed JSON.

### Visitor and search-demand analytics

Add privacy-respecting usage analytics only after the public source layer is stable.

### Monetization

Possible future product directions:

- private signal maps for a niche or competitor set;
- AI visibility audits;
- creator/source watchlists;
- paid reports;
- read-only API access.

Any monetization must preserve attribution, public/private boundaries, and creator trust.

## Not planned for the public v1 product

Base2026 should not become:

- a raw transcript archive;
- a TikTok or Instagram clone;
- a video re-hosting platform;
- a public live-LLM answer bot;
- a scraped private research dump;
- a heavy dashboard app separate from `/knowledge/`.

## Phase status

### Phase 1 — Public trust foundation

Status: done/live.

Public pages, methodology, policies, correction/removal path, and deployment boundary are live.

### Phase 2 — Content ingestion pipeline

Status: working, still gated.

The pipeline can publish reviewed public rows, but uncertain transcripts and source-review rows remain private.

### Phase 3 — AI/source intelligence layer

Status: live v1.

Public insight cards, topics, source summaries, and Source Intelligence are live. The next work is quality, dedupe, and better topic/playbook surfaces.

### Phase 4 — Creator and rights controls

Status: partial.

Correction/removal is live. Claims, changelog, and request automation remain planned.

### Phase 5 — Analytics and Signal Lab

Status: live v1.

Signal Lab is live. Next work is deeper integration with search and topic pages.

### Phase 6 — Monetization

Status: research.

No ads or banners are planned for the public knowledge layer. Commercial offers should be separate, transparent, and trust-preserving.
