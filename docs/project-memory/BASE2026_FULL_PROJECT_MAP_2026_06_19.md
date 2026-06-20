# Base2026 Full Project Map

Last updated: 2026-06-19

Worktree for this document:

- Path: `/Users/alexyarosh/Projects/base2026-migration/DW/base2026-analytics-upgrades`
- Branch: `codex/base2026-analytics-upgrades`
- Branch base: `f50e25d4a` from `codex/base2026-launch-next`

Purpose of this file:

- give GPT Pro, Codex, or a future operator one complete Markdown map of the Base2026 project;
- explain the product passport, public/private boundary, data model, pipeline, release logic, UI logic, analytics layer, and operational rules in one file;
- avoid private raw data, logs, credentials, raw captions, raw ASR, media, local databases, `.planning/`, `output/`, and generated `public-data/` payloads.

This file is a public-safe architecture and operating snapshot. It is not a data dump.

---

## 1. One-Line Definition

Base2026 is an attributed, searchable source-intelligence system for short-form expert videos about SEO, GEO, AEO, AI search visibility, local SEO, content, schema, marketing, and local business growth.

It turns public creator videos into reviewed text source records, then adds Base2026-authored summaries, topics, insight cards, search, canonical pages, analytics, and future read-only API/MCP access.

---

## 2. Why The Project Exists

Short-form expert videos contain practical knowledge:

- tactics;
- warnings;
- playbooks;
- platform observations;
- product and marketing fragments;
- local SEO and AI visibility tips;
- creator-specific viewpoints.

The problem is that this knowledge is hard to:

- search;
- compare;
- cite;
- revisit;
- cluster by topic;
- connect across creators;
- use inside AI workflows;
- preserve without becoming a raw transcript dump.

Base2026 solves this by converting public creator-video knowledge into a structured source layer:

- who said it;
- where it came from;
- what exact source record it belongs to;
- what topic it connects to;
- what other creators discuss similar ideas;
- what source-backed insight or action can be derived;
- how it can be searched, cited, corrected, removed, or reused responsibly.

The original internal purpose was a private text database for the operator. The public product keeps that database value but adds attribution, review, summaries, correction/removal paths, methodology, policy pages, canonical pages, and SEO-safe presentation.

---

## 3. Product Passport

### 3.1 Product Promise

Base2026 should let a user:

1. Search across public short-form expert videos by keyword, topic, creator, platform, and year.
2. See results in a familiar search-engine style list.
3. Open one source record from a result.
4. Read the reviewed public source text when policy allows.
5. See Base2026-authored short and fuller explanations.
6. Inspect reviewed Source Intelligence cards.
7. Navigate topics, creators, source pages, compare pages, and API/AI access.
8. Follow attribution, original source, methodology, support, and correction/removal paths.

### 3.2 One-Sentence Product Definition

Base2026 is a public, attributed, searchable video-source knowledge base: it turns reviewed creator-video transcripts into searchable source records, then adds Base2026-authored context, topics, and insight cards so people can find who said what and understand why it matters.

### 3.3 What It Is Not

Base2026 is not:

- a raw scraped transcript mirror;
- a video rehosting platform;
- a mass caption dump;
- a private research leak;
- an autonomous publisher of unreviewed creator content;
- a WordPress blog pretending to be a database;
- a client campaign deliverable;
- a replacement for the original creators.

---

## 4. Public And Private Boundary

The project has two layers:

1. Public open-source product and public `/knowledge/` website.
2. Private local research, raw source, QA, automation, and operations assets.

### 4.1 Public-Safe Content

Allowed in public code/docs or public deploy artifacts:

- attributed public source records;
- creator handle and public profile/source links;
- platform/date/language metadata;
- reviewed public source text when policy allows;
- public searchable passages;
- Base2026-authored summaries;
- reviewed public insight cards;
- public topic and creator metadata;
- deterministic topic signal briefs;
- public analytics derived only from public JSONL;
- public docs, methodology, source policy, privacy, support, roadmap, API index, data dictionary, and `llms.txt`.

### 4.2 Private Or Forbidden Content

Do not commit or publish:

- raw captions;
- raw ASR;
- downloaded audio/video/media;
- extraction logs;
- local QA notes;
- unreviewed transcripts;
- private research/source vaults;
- local SQLite databases;
- credentials, keys, cookies, tokens, SSH keys;
- generated release archives;
- `.planning/`;
- `output/`;
- generated `public-data/`;
- generated Meilisearch local data;
- private client workspaces.

### 4.3 Corrected Public Source Text Rule

The old safety shorthand was "do not publish full transcripts." The corrected contract is more precise:

- do not publish raw or unreviewed transcript dumps;
- reviewed polished public source text may be shown when policy and QA allow it;
- the public source text must be contextualized with attribution, original source link, Base2026 summary, topics, Source Intelligence, methodology, and correction/removal path;
- raw captions, raw ASR, media, logs, private QA, and unreviewed transcript material remain private.

---

## 5. Current Public Product Shape

Canonical public domain:

- `https://aggressorbulkit.online`

Base2026 product root:

- `https://aggressorbulkit.online/knowledge/`

Public search proxy:

- `/knowledge-search/multi-search`

Meilisearch public index:

- `base2026_public_tiktok`

Current public surface:

- `/knowledge/`
- `/knowledge/analytics.html`
- `/knowledge/api.html`
- `/knowledge/llms.txt`
- `/knowledge/api-index.json`
- `/knowledge/data-dictionary.json`
- `/knowledge/sitemap.xml`
- `/knowledge/sources/{item_id}.html`
- `/knowledge/topics/{topic_id}.html`
- `/knowledge/compare/{topic_id}.html`
- `/knowledge/creators/{handle}.html`
- `/knowledge/methodology.html`
- `/knowledge/roadmap.html`
- `/knowledge/story.html`
- `/knowledge/privacy.html`
- `/knowledge/source-policy.html`
- `/knowledge/support.html`
- `/knowledge/site-structure.html`
- `/knowledge/opt-out.html`

Current major UI contract:

```text
filters | workspace
```

The right workspace shows one state at a time:

- default search results;
- selected source detail;
- creator-filtered results;
- topic-filtered results;
- compare/topic state.

Static generated pages exist for SEO, canonical URLs, direct sharing, sitemap discovery, and future API/MCP references. They should not replace the `/knowledge/` workspace. They should link back to the workspace route state.

---

## 6. Current State And Release Context

Active phase:

- public product architecture correction;
- launch monitoring;
- check-only TikTok intake pipeline hardening;
- public analytics can be developed as a separate branch/workstream.

Current public product decisions:

- Base2026 behaves like a searchable video-source text database.
- Source detail uses one readable source text surface plus a separate Source Intelligence layer.
- Insight evidence is collapsed by default where it would duplicate the source text.
- Search follows a familiar search-engine result model.
- Desktop does not use a permanent three-column layout.
- Runtime source detail and generated source pages should stay structurally aligned.
- Analytics is a compact signal layer, not another competing navigation mode.

Important worktree note:

- This analytics branch was created from `f50e25d4a`.
- The original main worktree had uncommitted ay45 pipeline/memory updates at branch creation.
- This file intentionally does not include private raw artifacts.
- If an implementation depends on the latest pipeline facts, sync from committed upstream changes first.

---

## 7. Repository Structure

Top-level structure:

```text
.
├── 10_agent-instructions/
├── 12_knowledge-base/
├── config/
├── contracts/
├── docs/
│   ├── project-memory/
│   ├── public-pages/
│   ├── research/
│   └── schemas/
├── scripts/
├── tests/
│   └── fixtures/
├── web/
│   └── static/
└── wordpress/
    └── novamira-sandbox/
```

Approximate tracked-file snapshot in this worktree:

- about 241 tracked files;
- about 76 scripts in `scripts/`;
- major file types: Markdown, Python, PowerShell, HTML, JSONL fixtures, JavaScript, JSON, CSS.

### 7.1 `docs/project-memory/`

Operational source of truth for agents and future work:

- `PROJECT_STATE.md`: broad project state and release history.
- `ACTIVE_PHASE.md`: active phase and exact task.
- `NEXT_ACTION.md`: next safe action and do-not-do rules.
- `DECISIONS.md`: durable decisions.
- `DATA_SOURCES.md`: public/private source status.
- `STATUS_BOARD.csv`: operational phase board.
- `PHASES.md`: phase definitions.
- `PUBLICATION_BOUNDARY.md`: public/private boundary.
- `DEPLOYMENT_RUNBOOK.md`: deploy and rollback notes.
- `HERMES_RUNBOOK.md`: local Hermes automation notes.
- `VISUAL_SYSTEM_CONTRACT.md`: UI/design constraints.
- `PROMPT_LOG.md`: session history and handoffs.
- `CURRENT_HANDOFF.md`: compact active handoff.
- `PIPELINE_ERROR_LEDGER.md`: known pipeline failure modes.
- `LAUNCH_COMMAND_CENTER.md`: launch/growth task board.

### 7.2 `docs/public-pages/`

Markdown source for public static info pages:

- methodology;
- project story;
- privacy policy;
- source and content policy;
- support;
- site structure;
- creator correction/removal;
- API access;
- roadmap.

These are transformed by `scripts/generate-info-pages.py` into HTML under `web/static/`.

### 7.3 `docs/schemas/`

Public data schemas:

- `PUBLIC_JSONL_SCHEMA.md`
- `TIKTOK_INTAKE_RECORD_SCHEMA.md`

### 7.4 `contracts/`

Release policy and public safety contract:

- `base2026.public-release-contract.json`

Core ideas:

- public releases allow reviewed public source text;
- public releases forbid raw/unreviewed full transcript shortcuts;
- implicit auto-promotion of insight cards is disabled;
- public insight cards must come from reviewed/approved/public rows.

### 7.5 `web/static/`

Static source shell and public info pages:

- `meili.html`: production search workspace shell used for `/knowledge/`.
- `index.html`: related static entry shell.
- `meili.js`: runtime search/source-detail/analytics logic.
- `styles.css`: shared public UI CSS.
- `analytics.html`: generated static analytics page in the repo snapshot.
- `api.html`, `api-index.json`, `data-dictionary.json`, `llms.txt`: public API/AI access surface.
- `cookie-consent.js`, `share-actions.js`, `roadmap.js`: frontend helpers.
- public info HTML pages.
- public assets including favicon, avatar, creator avatars.

Generated source/topic/compare/creator HTML pages are deploy artifacts and should not be committed by default.

### 7.6 `scripts/`

Main categories:

- public export;
- data validation;
- static page generation;
- analytics generation;
- sitemap generation;
- Meilisearch indexing;
- packaging and deploy;
- live SEO/visual QA;
- TikTok/social discovery and import;
- transcript polish and QA;
- insight-card review/promotion;
- local worker and Hermes automation;
- GitHub/publication safety checks.

### 7.7 `tests/fixtures/`

Public export fixtures for contract validation:

- valid public export fixture;
- leaky export fixture;
- auto-promote fixture.

The tests/fixtures layer is public-safe and intentionally small.

---

## 8. Core Data Model

The public product is built from JSONL files, not WordPress posts.

### 8.1 `manifest.json`

Release-level public export metadata:

- documents/source records count;
- passages/chunks count;
- creator count;
- topic count;
- insight card count;
- public insight card count;
- policy flags such as `include_full_transcripts=false`.

### 8.2 `source_records.jsonl`

One row per public source item.

Common fields:

- `item_id`
- `source_id`
- `platform`
- `post_id`
- `source_url`
- `creator_handle`
- `creator_url`
- `published_at` or `published_date`
- `title`
- `excerpt`
- `public_source_text`
- `public_source_text_available`
- `source_summary_short`
- `source_summary_long`
- `language`
- `topics`
- `topic_labels`
- `transcript_method`
- `full_transcript_public`
- `public_policy`

Meaning:

- source identity and reading surface;
- public source text is reviewed text when allowed;
- legacy raw transcript fields must remain empty or non-public in public export.

### 8.3 `documents.jsonl`

Runtime search/source-detail document payload.

Common fields:

- `item_id`
- `source_id`
- `creator_handle`
- `published_date`
- `source_type`
- `language`
- `source_url`
- `public_source_text`
- `source_summary_short`
- `source_summary_long`
- `topics`
- `topic_labels`

Used by:

- runtime source detail in `/knowledge/`;
- delayed static JSONL lookup;
- agent-readable public data.

### 8.4 `passages.jsonl`

One row per searchable evidence passage.

Common fields:

- `id`
- `source_id`
- `item_id`
- `creator_handle`
- `source_url`
- `published_at`
- `year`
- `body`
- `topics`
- `public_policy`

Used by:

- Meilisearch indexing;
- search result snippets;
- matched passage context;
- topic/source counts;
- supporting evidence.

### 8.5 `insight_cards.jsonl`

Reviewed public source-backed insight cards.

Common fields:

- `id`
- `claim_id`
- `source_id`
- `source_url`
- `topic_id`
- `topic`
- `creator_handle`
- `claim_text`
- `suggested_action`
- `evidence_excerpt`
- `stance`
- `confidence`
- `review_status`
- `promotion_method`
- `public`
- `needs_review`
- `public_policy`

Rules:

- no public claim without `source_id`;
- no public claim without evidence;
- no public card from pending/private review state;
- public cards must be reviewed, approved, or explicitly public.

### 8.6 `topics.jsonl`

Public topic metadata.

Common fields:

- `id`
- `topic_id`
- `topic`
- `definition`
- `source_count`
- `public_source_count`
- `passage_count`
- `insight_count`
- `public_insight_count`
- `creator_count`
- `top_creators`
- `latest_published_at`
- `public`
- `public_policy`

Rules:

- no public topic without at least one public source-backed insight card;
- thin topic/compare pages should be `noindex,follow`;
- indexable topic pages need meaningful source-backed substance.

### 8.7 `creators.jsonl`

Public creator metadata.

Common fields:

- `creator_id`
- `handle`
- `display_name`
- `url`
- `creator_url`
- `avatar_url`
- source counts.

Used by:

- creator pages;
- analytics cards;
- result identity rows;
- source attribution.

### 8.8 `topic_signal_briefs.jsonl`

Deterministic compact summaries for strong topics.

Strong topic threshold:

- `source_count >= 5`
- `creator_count >= 2`
- `public_insight_count >= 3`

Common fields:

- `topic_id`
- `topic_label`
- `status`
- `robots`
- `source_count`
- `creator_count`
- `public_insight_count`
- `passage_count`
- `latest_source_date`
- `first_source_date`
- `freshness_score`
- `creator_angles`
- `repeated_tactics`
- `source_backed_actions`
- `monthly_activity`
- `top_sources`
- `generated_at`
- `generator_version`

Used by:

- topic pages;
- compare pages;
- analytics;
- future API/MCP signal lookup.

### 8.9 `analytics_summary.json`

Compact public analytics payload.

Current fields include:

- `schema`
- `generated_at`
- `totals`
- `topics`
- `creators`
- `strong_topic_signals`
- `monthly_sources`
- `latest_sources`
- `lookups`
- `top_topics`
- `top_creators`
- `sources_by_year`

Used by:

- `/knowledge/` analytics strip;
- topic chips with source counts;
- result-level analytics chips;
- generated `/knowledge/analytics.html`.

### 8.10 `base2026_analytics.json`

Older/fallback analytics payload.

Current role:

- generated during release package;
- copied to static deploy;
- used as fallback if `analytics_summary.json` is unavailable.

Potential cleanup:

- consolidate duplicated analytics logic into one schema once downstream consumers are updated.

---

## 9. Canonical Pipeline

High-level flow:

```text
public creator video
  -> discovery / inventory
  -> dedupe
  -> captions or metadata extraction
  -> ASR fallback only when needed and allowed
  -> private raw artifacts stay local
  -> faithful polish / cleanup
  -> QA gate
  -> chunking into passages
  -> topic and insight candidate generation
  -> evidence verification
  -> human/GPT/Codex review lane
  -> public promotion gate
  -> public JSONL export
  -> public policy checks
  -> topic signal briefs
  -> public analytics JSON
  -> generated static pages
  -> sitemap generation
  -> Meilisearch indexing
  -> deploy
  -> live crawl and mobile visual QA
```

### 9.1 Discovery And Intake

Current discovery path:

- `scripts/social-discover.py`
- `scripts/import-social-discovery-to-tiktok-csv.py`

Principles:

- discovery output is private and ignored;
- importer is dry-run by default;
- TikTok-only rows are imported into private local compatibility CSV;
- dedupe by video/source id;
- backup before apply;
- no public export, no deploy, no Meilisearch mutation during discovery/import.

### 9.2 Caption And ASR Processing

Relevant scripts:

- `scripts/tiktok-ytdlp-metadata-extract.py`
- `scripts/tiktok-caption-browser-extract.mjs`
- `scripts/tiktok-process-transcripts.ps1`
- `scripts/base2026-worker.py`
- `scripts/tiktok-faithful-polish-local.py`
- `scripts/run-hermes-polish-worker.ps1`

Rules:

- captions are preferred when available;
- ASR fallback only when needed and source/audio quality permits;
- weak/no-speech ASR rows stay private;
- audio-backed uncertain rows remain `needs_source_review`;
- transcript cleanup preserves meaning and does not invent content.

### 9.3 Transcript Polish And QA

Relevant scripts:

- `scripts/tiktok-polish-audit.py`
- `scripts/tiktok-polish-status.py`
- `scripts/tiktok-polish-spotcheck.py`
- `scripts/tiktok-normalize-polished-entities.py`
- `scripts/tiktok-qa-review-apply.py`
- `scripts/tiktok-qa-triage.py`
- `scripts/tiktok-source-review-audit.py`
- `scripts/tiktok-source-review-queue.py`

Rules:

- faithful polish only;
- fix punctuation, casing, paragraphing, known entity spellings;
- do not translate into Russian;
- do not add new meaning;
- do not bulk-pass held rows;
- source-review rows require verified evidence before public release.

### 9.4 Local Knowledge Base Build

Relevant script:

- `scripts/build-kb-sqlite.py`

Role:

- builds local SQLite knowledge base from local/private source material and reviewed outputs;
- replays ignored reviewed candidate archives locally;
- keeps private/pending/non-public records out of public export.

### 9.5 Claim And Insight Candidate Pipeline

Relevant scripts:

- `scripts/base2026-claim-extract-local.py`
- `scripts/base2026-evidence-verify.py`
- `scripts/base2026-import-claim-candidates.py`
- `scripts/base2026-build-chatgpt-review-packet.py`
- `scripts/base2026-apply-chatgpt-review.py`
- `scripts/base2026-review-insight-candidates.py`
- `scripts/base2026-review-legacy-insights.py`
- `scripts/base2026-promote-insight-candidates.py`
- `scripts/base2026-prepare-needs-human-review.py`
- `scripts/base2026-resolve-candidate-decisions.py`

Rules:

- candidate generation can be local or GPT-assisted;
- candidates remain private until reviewed;
- exact evidence matching is required but not sufficient alone;
- public promotion must be explicit;
- visual-dependent cards remain gated until a visual evidence lane exists;
- no implicit public-card promotion in release lane.

### 9.6 Public Export

Relevant scripts:

- `scripts/export-public-tiktok.py`
- `scripts/check-public-export-policy.py`
- `scripts/validate-public-text-excerpts.py`
- `scripts/validate-public-release-contract.py`
- `scripts/check-public-content-readiness.py`

Export produces:

- `documents.jsonl`
- `chunks.jsonl`
- `source_records.jsonl`
- `passages.jsonl`
- `insight_cards.jsonl`
- `topics.jsonl`
- `creators.jsonl`
- `manifest.json`

Public export rules:

- `include_full_transcripts=false`;
- raw captions and raw ASR are not exposed;
- reviewed public source text is allowed;
- source records without usable public text/chunks should be excluded;
- newest/fresh public source records need topic/insight readiness;
- public insight cards must be reviewed/approved/public.

### 9.7 Topic Signal Briefs

Relevant script:

- `scripts/generate-topic-signal-briefs.py`

Role:

- reads public JSONL only;
- produces deterministic topic summaries for strong topics;
- creates creator angles, repeated tactics, source-backed actions, freshness, top sources, and monthly activity;
- does not create unsupported editorial claims.

### 9.8 Analytics Generation

Relevant scripts:

- `scripts/generate-base2026-analytics.py`
- `scripts/generate-public-analytics.py`

Role:

- read public JSONL only;
- generate `base2026_analytics.json`;
- generate `analytics_summary.json`;
- provide totals, topic rankings, creator rankings, latest sources, time counts, lookups.

Potential analytics upgrade direction:

- creator comparison matrix;
- topic intelligence graph;
- signal chains;
- consensus/divergence;
- coverage gaps;
- freshness analytics;
- evidence-quality scoring;
- API/MCP-ready public lookup payloads.

### 9.9 Static Page Generation

Relevant scripts:

- `scripts/generate-info-pages.py`
- `scripts/generate-public-pages.py`
- `scripts/generate-base2026-sitemap.py`

Outputs:

- info pages;
- creator pages;
- source pages;
- topic pages;
- compare pages;
- analytics page;
- sitemap index and child sitemaps.

Rules:

- generated pages should stay under `/knowledge/`;
- static pages should link back to the workspace;
- generated pages are deploy artifacts and should not be committed by default;
- analytics links should stay inside `/knowledge/`.

### 9.10 Packaging

Relevant script:

- `scripts/package-public-release.ps1`

Package flow:

```text
export-public-tiktok
  -> check-public-export-policy
  -> validate-public-text-excerpts
  -> validate-public-release-contract
  -> check-public-content-readiness
  -> generate-topic-signal-briefs
  -> generate-base2026-analytics
  -> generate-public-analytics
  -> generate-info-pages
  -> copy static shell/assets/data
  -> generate-public-pages
  -> generate-base2026-sitemap
  -> normalize cache-bust query strings
  -> create release package
```

Important package rule:

- cache-bust is derived from release name and normalized after generators run.

### 9.11 Deploy

Relevant scripts:

- `scripts/deploy-public-vps.ps1`
- `scripts/base2026-release-gate.ps1`
- `scripts/meili-index-public.py`
- `scripts/server-patch-nginx-base2026.py`

Deploy responsibilities:

- package or use existing package;
- upload release zip;
- unpack under VPS release folder;
- switch `/var/www/base2026-knowledge/current`;
- verify nginx;
- reload nginx;
- reindex Meilisearch when data/index fields changed;
- smoke test live paths.

For data-changing TikTok/source releases, use the canonical release gate instead of ad hoc deploy steps.

### 9.12 Canonical Release Gate

Relevant script:

- `scripts/base2026-release-gate.ps1`

Role:

- command center for data-changing releases;
- owns polish state, optional `AfterPolish`, newest-source readiness, publication boundary, metadata validation, export policy, release contract, packaging, optional deploy/reindex, live SEO crawl, and mobile visual QA.

Important release gate rule:

- fresh creator/video batches should use `-LatestReadiness 3` until readiness is batch-aware.

---

## 10. Public UI Logic

### 10.1 Main Search Workspace

Core files:

- `web/static/meili.html`
- `web/static/meili.js`
- `web/static/styles.css`

Search workspace responsibilities:

- connect to Meilisearch through `/knowledge-search/multi-search`;
- render filters;
- render search results;
- manage route state;
- open source detail in the workspace;
- load delayed `documents.jsonl`;
- load `analytics_summary.json`;
- show topic chips, result analytics, and search signal;
- preserve a compact, readable layout.

Route states:

- `?q=...`
- `?source=...`
- `?creator=...`
- `?topic=...`
- `?compare=...`
- `?year=...`
- `?source_type=...`

### 10.2 Search Result Contract

Each result should show:

- source identity;
- creator;
- date;
- platform;
- title or short summary;
- matched snippet;
- topic chips;
- compact result analytics if available;
- one primary "Open source" action.

Avoid:

- modal source reading;
- duplicate source/detail/page choices;
- button proliferation;
- hidden context.

### 10.3 Source Detail Contract

Source detail should show:

1. Back to results.
2. Source identity row.
3. Compact metadata.
4. Share/copy/print controls.
5. H1/title.
6. Short Base2026 summary.
7. Fuller Base2026 explanation.
8. Source actions: original source, creator, canonical/static page.
9. Source Text.
10. Matched passage only when distinct and useful.
11. Related passages only when distinct.
12. Source Intelligence cards.
13. Related topics.

Avoid:

- duplicated source text;
- platform caption metadata blocks;
- bottom provenance card stacks;
- empty insight sections without explanation;
- repeated large topic CTAs under each card.

### 10.4 Generated Source Pages

Generated source pages should mirror runtime source detail:

- same source text policy;
- same Source Intelligence grouping;
- same identity pattern;
- same compact actions;
- canonical URL;
- static SEO/schema metadata;
- `Open in Search Workspace` link.

### 10.5 Topic Pages

Topic pages show:

- topic identity;
- source/creator/insight counts;
- signal brief when threshold is met;
- source-backed answer/Q&A sections where available;
- related sources;
- related insight cards;
- compare link.

Indexing rule:

- strong and meaningful topics can be `index,follow`;
- thin/singleton topics should be `noindex,follow`.

### 10.6 Creator Pages

Creator pages show:

- creator identity and avatar when available;
- creator source list;
- public insight count;
- topic distribution;
- links into workspace/search.

User exploration should still feel like applying a creator filter in `/knowledge/`.

### 10.7 Compare Pages

Compare pages group creator viewpoints by topic.

They should:

- link every viewpoint back to source evidence;
- avoid unsupported synthesis;
- show where creators overlap or differ;
- stay deterministic.

### 10.8 Analytics Page

Current generated analytics page:

- totals;
- topic signal ranking;
- creators;
- years;
- latest records.

Generated by:

- `scripts/generate-public-pages.py` using `analytics_summary.json` or `base2026_analytics.json`.

Upgrade direction:

- creator comparison matrix;
- topic graph;
- signal chains;
- source-backed tactic library;
- consensus/divergence;
- freshness/coverage gaps;
- public API-friendly derived payloads.

---

## 11. Analytics Layer

### 11.1 Analytics Design Principle

Analytics must be:

- deterministic;
- generated at build time;
- derived from public JSONL only;
- source-attributed;
- safe for public API/AI access;
- useful for humans and agents;
- integrated without creating a competing navigation system.

### 11.2 Current Analytics Data Flow

```text
public JSONL export
  -> topic_signal_briefs.jsonl
  -> base2026_analytics.json
  -> analytics_summary.json
  -> /knowledge/static/*.json
  -> /knowledge/ analytics strip
  -> result-level analytics chips
  -> /knowledge/analytics.html
```

### 11.3 Current Analytics Calculations

Existing analytics currently compute:

- totals;
- top topics;
- top creators;
- sources by year;
- monthly sources;
- latest sources;
- topic source counts;
- topic creator counts;
- public insight counts;
- passage counts;
- signal scores;
- strong topic signal flags.

Existing topic signal score roughly combines:

- source count;
- creator count;
- public insight count;
- passage count;
- signal brief bonus.

### 11.4 Current Runtime Analytics Usage

`web/static/meili.js`:

- loads `analytics_summary.json`;
- falls back to `base2026_analytics.json`;
- builds `topicsById`;
- builds `creatorsByHandle`;
- renders analytics strip;
- adds source counts to topic chips;
- adds result analytics to cards;
- shows current search signal when enough sources and creators appear.

### 11.5 Advanced Analytics Opportunities

Best next feature candidates:

1. Creator comparison matrix:
   - rows: creators;
   - columns: topics, source count, public insight count, freshness, overlap, unique topics;
   - links to filtered workspace and creator pages.

2. Topic intelligence graph:
   - topic -> creators -> sources -> insights -> repeated tactics.

3. Signal chains:
   - topic -> repeated tactic -> supporting creators -> source records -> evidence excerpts.

4. Consensus vs divergence:
   - where multiple creators repeat similar tactics;
   - where creator angles differ.

5. Coverage gap analytics:
   - strong topics;
   - weak topics;
   - source-rich but insight-poor topics;
   - creator-heavy but topic-thin areas;
   - stale topics.

6. Freshness analytics:
   - latest source date by topic;
   - latest source date by creator;
   - monthly growth;
   - stale but important clusters.

7. Evidence quality score:
   - creator diversity;
   - public source count;
   - public insight count;
   - freshness;
   - signal brief presence;
   - evidence density.

8. Research workflows:
   - "Find strongest source-backed tactics";
   - "Compare creators on this topic";
   - "Find newest AI-search signals";
   - "Find topics with weak coverage";
   - "Find source records with no public Source Intelligence yet."

### 11.6 Analytics Implementation Rule

For new analytics features:

1. Extend a build-time public analytics JSON payload first.
2. Keep all derived rows source-attributed.
3. Add static page UI second.
4. Add workspace integration third.
5. Do not introduce live backend analytics unless explicitly planned.
6. Do not use private pipeline records as public analytics unless a reviewed promotion gate exists.

---

## 12. API And AI Access Surface

Public human entry:

- `/knowledge/api.html`

Machine-readable:

- `/knowledge/api-index.json`
- `/knowledge/data-dictionary.json`
- `/knowledge/llms.txt`
- `/llms.txt` at root points to Base2026.

Public static data endpoints:

- `/knowledge/static/manifest.json`
- `/knowledge/static/documents.jsonl`
- `/knowledge/static/passages.jsonl`
- `/knowledge/static/insight_cards.jsonl`
- `/knowledge/static/topic_signal_briefs.jsonl`
- `/knowledge/static/analytics_summary.json`
- `/knowledge/static/base2026_analytics.json`

Search endpoint:

- `/knowledge-search/multi-search`

Search endpoint note:

- server-side proxy injects public search key;
- bulk/agent analytics should prefer static JSONL;
- search proxy is for live ranking/search behavior.

Future MCP principles:

- read-only public data first;
- source attribution required;
- no raw caption/private pipeline exposure;
- stable source, creator, topic, and signal lookup tools before write tools.

---

## 13. WordPress And Commercial Site Relationship

Base2026 lives under `/knowledge/` on the same domain as the Alex Yarosh commercial site.

WordPress root site handles:

- services;
- pricing;
- about;
- lead capture / AI visibility audit;
- general commercial positioning.

Base2026 handles:

- source intelligence;
- public video-source search;
- topic/source/creator pages;
- analytics;
- API/AI access;
- methodology and source policy.

Shared design direction:

- light Alex Yarosh-compatible visual system;
- compact product/search feel using Geist/Geist Mono in Base2026;
- shared header/footer ecosystem;
- Base2026 should not look like an unrelated dark AI app shell.

Important integration points:

- footer CTAs connect Base2026 and commercial site;
- `/ai-visibility-audit/` is the main commercial CTA;
- Base2026 public pages include support, source/content policy, and creator correction/removal paths;
- WordPress links should preserve package/pricing context where needed.

---

## 14. Deployment And Hosting

Canonical domain:

- `https://aggressorbulkit.online`

Base2026 deploy root on VPS:

- `/var/www/base2026-knowledge/current`

Release folders:

- `/var/www/base2026-knowledge/releases/{release-name}`

Deployment pattern:

1. Build release locally.
2. Package static files and public data.
3. Upload zip to VPS.
4. Unpack to release folder.
5. Switch `current` symlink.
6. Test nginx.
7. Reload nginx.
8. Reindex Meilisearch if data/index changed.
9. Verify live routes.
10. Run crawl/visual QA.

Rollback:

- switch `current` symlink back to prior release;
- run nginx test;
- reload nginx;
- verify `/knowledge/`.

Never:

- overwrite WordPress root;
- print or commit Meilisearch keys;
- deploy raw/private/gated data;
- deploy without boundary/export checks for data-changing releases.

---

## 15. Validation And QA Gates

Core local gates:

- `python3 scripts/audit-publication-boundary.py`
- `python3 scripts/check-public-export-policy.py public-data/tiktok`
- `python3 scripts/validate-public-text-excerpts.py --data public-data/tiktok`
- `python3 scripts/validate-public-release-contract.py --export-dir public-data/tiktok --baseline-export-dir public-data/tiktok --enforce-count-floor`
- `python3 scripts/check-public-content-readiness.py --data-root public-data/tiktok --latest 3 --fail`
- `python3 scripts/validate-github-metadata.py`
- `git diff --check`

Visual/live gates:

- `scripts/mobile-visual-qa.mjs`
- `scripts/live-seo-crawl-gate.mjs`
- HTTP smoke checks for key pages;
- no horizontal overflow;
- no console errors;
- mobile menu works;
- source detail loads;
- analytics page links stay under `/knowledge/`;
- generated source/topic/creator pages return expected status;
- sitemap and robots behavior remain correct.

Publication boundary audit checks:

- forbidden paths;
- secret findings;
- generated/private artifacts;
- source status needing review.

Release contract checks:

- no raw/unreviewed transcript dump;
- no implicit public-card auto-promotion;
- minimum public insight retention ratio;
- public source text allowed only through reviewed field/policy.

---

## 16. Git And Worktree Workflow

Current analytics branch:

- `codex/base2026-analytics-upgrades`

Analytics worktree:

- `/Users/alexyarosh/Projects/base2026-migration/DW/base2026-analytics-upgrades`

Main launch/pipeline worktree:

- `/Users/alexyarosh/Projects/base2026-migration/DW/base2026`

Why separate worktree:

- analytics work can proceed without switching the main worktree branch;
- main launch/pipeline session can continue separately;
- this branch can become a PR later;
- conflicts and generated artifacts stay easier to reason about.

Rules:

- do not commit/push/deploy unless the user asks in the current task;
- check `git status` at task start;
- run boundary audit before staging;
- stage only public-safe source/docs files;
- never revert user or other-chat changes unless explicitly asked.

Suggested branch workflow:

```text
analytics worktree
  -> implement scoped analytics feature
  -> validate locally
  -> audit publication boundary
  -> stage public-safe files only
  -> commit
  -> push branch
  -> open PR
  -> review against main workstream
  -> merge when safe
```

---

## 17. Source And Data Status

Current public data sources include TikTok creators such as:

- `@webhivedigital`
- `@tjrobertson52`
- `@build_in_public`
- `@joshuamaraney`
- `@darrenshawseo`
- `@heytonyagency`
- `@iamdandavies`
- `@harrysandersseo`
- `@ray_fu`
- `@gobigsystems`

Public export status:

- public reviewed export only;
- uncertain source/audio rows remain private;
- source-review backlog must not be bulk-passed;
- public output is limited to QA-pass polished/reviewed rows.

Private/gated categories:

- source-review backlog;
- ASR too-little/no-usable rows;
- no local caption/audio rows;
- private insight-card candidates;
- visual-dependent claims without visual evidence lane.

Generated deploy artifact status:

- `public-data/tiktok` is generated local export and should not be committed;
- release packages live under `output/releases` and should not be committed;
- generated source/topic/compare/creator HTML should not be committed by default.

---

## 18. Durable Decisions That Matter

Key project decisions:

1. Use file-based project memory under `docs/project-memory/`.
2. Keep public TikTok product separate from private research base.
3. Public product is an attributed intelligence layer, not raw transcript dump.
4. Reviewed public source text is allowed; raw/unreviewed transcript dumps are not.
5. Generate public topic and comparison pages, but index only meaningful aggregate pages.
6. Use existing Rank Math on WordPress; implement Base2026 SEO statically.
7. Use GPT/Codex review lanes for low-volume, quality-sensitive insight cards.
8. Require explicit promotion reports before public insight-card promotion.
9. Use mobile visual QA for public UI changes.
10. Use one canonical source identity system.
11. `/knowledge/` is the primary navigation workspace.
12. Desktop workspace stays `filters | workspace`, not three columns.
13. Source detail uses Source Text plus Source Intelligence without duplication.
14. Analytics is deterministic, public-data-only, and compact.
15. Generated analytics links must stay inside `/knowledge/`.
16. Data-changing releases must use the canonical release gate.
17. Social discovery stays private and non-mutating first.
18. Check-only refresh must be read-only.
19. Fresh creator releases use `LatestReadiness 3`.
20. ASR-too-little rows stay private.

---

## 19. Main Script Inventory By Role

### 19.1 Public Export And Validation

- `scripts/export-public-tiktok.py`
- `scripts/check-public-export-policy.py`
- `scripts/validate-public-text-excerpts.py`
- `scripts/validate-public-release-contract.py`
- `scripts/check-public-content-readiness.py`
- `scripts/audit-publication-boundary.py`
- `scripts/validate-github-metadata.py`

### 19.2 Static Site And Public Pages

- `scripts/generate-info-pages.py`
- `scripts/generate-public-pages.py`
- `scripts/generate-base2026-sitemap.py`
- `scripts/generate-topic-signal-briefs.py`
- `scripts/generate-base2026-analytics.py`
- `scripts/generate-public-analytics.py`

### 19.3 Release And Deploy

- `scripts/package-public-release.ps1`
- `scripts/package-public-hotfix-from-export.ps1`
- `scripts/deploy-public-vps.ps1`
- `scripts/base2026-release-gate.ps1`
- `scripts/meili-index-public.py`
- `scripts/server-patch-nginx-base2026.py`

### 19.4 QA And Monitoring

- `scripts/mobile-visual-qa.mjs`
- `scripts/live-seo-crawl-gate.mjs`
- `scripts/base2026-controller.py`
- `scripts/base2026-daily-digest.py`

### 19.5 Local Worker And Knowledge Base

- `scripts/base2026-worker.py`
- `scripts/build-kb-sqlite.py`
- `scripts/kb-audit.py`
- `scripts/kb-search.py`
- `scripts/kb-status.py`
- `scripts/generate-analysis-layer.py`

### 19.6 TikTok Intake And Transcript Pipeline

- `scripts/social-discover.py`
- `scripts/import-social-discovery-to-tiktok-csv.py`
- `scripts/tiktok-ytdlp-metadata-extract.py`
- `scripts/tiktok-caption-browser-extract.mjs`
- `scripts/tiktok-process-transcripts.ps1`
- `scripts/tiktok-faithful-polish-local.py`
- `scripts/tiktok-create-polish-batches.ps1`
- `scripts/tiktok-polish-runner.ps1`
- `scripts/tiktok-polish-audit.py`
- `scripts/tiktok-polish-status.py`
- `scripts/tiktok-polish-spotcheck.py`
- `scripts/tiktok-normalize-polished-entities.py`
- `scripts/tiktok-qa-review-apply.py`
- `scripts/tiktok-qa-triage.py`
- `scripts/tiktok-source-review-audit.py`
- `scripts/tiktok-source-review-queue.py`

### 19.7 Insight Cards And Review

- `scripts/base2026-claim-extract-local.py`
- `scripts/base2026-evidence-verify.py`
- `scripts/base2026-import-claim-candidates.py`
- `scripts/base2026-build-chatgpt-review-packet.py`
- `scripts/base2026-apply-chatgpt-review.py`
- `scripts/base2026-review-insight-candidates.py`
- `scripts/base2026-review-legacy-insights.py`
- `scripts/base2026-promote-insight-candidates.py`
- `scripts/base2026-prepare-needs-human-review.py`
- `scripts/base2026-resolve-candidate-decisions.py`

### 19.8 Hermes And Scheduled Local Automation

- `scripts/hermes-tiktok-refresh.ps1`
- `scripts/run-hermes-polish-worker.ps1`
- `scripts/register-hermes-tiktok-check-task.ps1`
- `scripts/register-hermes-webui-task.ps1`
- `scripts/register-tiktok-refresh-task.ps1`

---

## 20. Local Development Commands

Export and validate public TikTok data:

```bash
python3 scripts/export-public-tiktok.py
python3 scripts/check-public-export-policy.py public-data/tiktok
```

Generate topic signals and analytics:

```bash
python3 scripts/generate-topic-signal-briefs.py --data public-data/tiktok --out public-data/tiktok/topic_signal_briefs.jsonl --max-topics 50
python3 scripts/generate-public-analytics.py --data public-data/tiktok --out public-data/tiktok/analytics_summary.json
python3 scripts/generate-base2026-analytics.py --data public-data/tiktok --out public-data/tiktok/base2026_analytics.json
```

Generate public pages:

```bash
python3 scripts/generate-info-pages.py --source docs/public-pages --out web/static
python3 scripts/generate-public-pages.py --data public-data/tiktok --out web/static
python3 scripts/generate-base2026-sitemap.py --web-root web/static
```

Package release:

```bash
pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/package-public-release.ps1 -ReleaseName <release-name>
```

Deploy release:

```bash
pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/deploy-public-vps.ps1 -ReleaseName <release-name>
```

Data-changing release gate:

```bash
pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/base2026-release-gate.ps1 `
  -ReleaseName <release-name> `
  -LatestReadiness 3 `
  -Deploy
```

Publication safety:

```bash
git status --short --branch
git diff --check
python3 scripts/audit-publication-boundary.py
python3 scripts/validate-github-metadata.py
```

---

## 21. Current Analytics Branch Goals

This branch exists to improve public analytics without interfering with the main launch/pipeline branch.

Scope:

- public analytics page;
- public analytics JSON schema;
- creator comparison;
- topic/source signal intelligence;
- workspace analytics hints;
- API/MCP-ready public analytics payloads;
- documentation and design for analytics.

Out of scope unless explicitly requested:

- TikTok intake automation;
- source discovery/import;
- raw transcript processing;
- deploy;
- reindexing Meilisearch;
- changing private source-review states;
- committing generated public export artifacts.

Best first implementation slice:

1. Design a new `analytics_summary.v2` or companion public analytics file.
2. Add creator-topic matrix data from public JSONL.
3. Render a compact creator comparison section on `/knowledge/analytics.html`.
4. Link rows back to workspace filters and generated creator/topic pages.
5. Run diff, boundary audit, and page/visual checks.

---

## 22. Recommended GPT Pro Planning Prompt

Use this file as project context and ask GPT Pro for a design spec like this:

```text
You are designing the next public analytics layer for Base2026.

Use only the public-safe architecture and data model described in this Markdown file.
Do not use raw captions, raw ASR, private QA, local databases, logs, media, or generated private artifacts.

Design advanced public analytics for:
- creator comparison;
- topic intelligence;
- signal chains;
- consensus/divergence;
- freshness and coverage gaps;
- source-backed action/tactic discovery;
- API/MCP-ready public analytics payloads.

Return an implementation-ready Markdown spec in English with:
1. Product objective
2. User jobs-to-be-done
3. Proposed modules
4. Data inputs
5. Derived JSON schemas
6. Scoring formulas
7. UI layout
8. Source attribution rules
9. Safety/public-private rules
10. Implementation phases
11. Validation checklist
12. First implementation slice
```

---

## 23. Reviewer Checklist For Any Future Work

Before reporting an analytics implementation done:

- Does it match the user's request?
- Does it use only public-safe data?
- Does every claim-like output link back to public sources?
- Does it preserve the `/knowledge/` workspace model?
- Does it avoid private/raw/gated data?
- Does it avoid committing generated deploy artifacts?
- Does it keep analytics deterministic and reproducible?
- Does it avoid unsupported editorial claims?
- Does it run `git diff --check`?
- Does it run publication boundary audit?
- Does it update `NEXT_ACTION.md` and `PROMPT_LOG.md`?
- If UI changed, was desktop/mobile rendering checked?

---

## 24. Do Not Do

- Do not commit or publish raw captions, raw ASR, media, logs, local DB files, credentials, or private source vaults.
- Do not commit generated `public-data/`, `output/`, release zips, or generated source/topic/compare/creator pages by default.
- Do not bypass source-review flags.
- Do not bulk-pass ASR-too-little or no-source rows.
- Do not deploy or reindex without explicit user request and full gates.
- Do not reintroduce source modal as the main reading experience.
- Do not build a three-column desktop workspace.
- Do not split analytics links outside `/knowledge/`.
- Do not make unsupported claims from aggregate data.
- Do not treat GPT output as public truth without source-backed review.

---

## 25. Mental Model For Future Agents

Think of Base2026 as five connected layers:

```text
1. Private intake and review
   Raw platform/video/caption material stays local.

2. Public source data
   Reviewed source records, passages, insight cards, topics, creators.

3. Deterministic intelligence
   Topic signals, analytics, creator comparisons, source-backed actions.

4. Public product UI
   Search workspace, source detail, generated pages, analytics, API docs.

5. Operations and trust
   Release gates, publication boundary, source policy, correction/removal, QA.
```

Every good change should strengthen at least one layer without breaking the boundary between private intake and public source intelligence.

