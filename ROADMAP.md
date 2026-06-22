# Roadmap

Base2026 is a public source-intelligence system for short-form expert videos.

It is already live as a searchable public demo at <https://aggressorbulkit.online/knowledge/>. This roadmap describes what exists now, what is being hardened next, and what is intentionally not in scope.

## Now: working public prototype

The current public product includes:

- searchable TikTok source records for SEO, GEO, AEO, AI search, local search, schema, and creator-led marketing topics;
- reviewed public source text where policy allows;
- source-backed insight cards;
- topic, source, creator, and comparison pages;
- a static public API/AI surface through JSONL and metadata files;
- a read-only Meilisearch proxy for live search;
- public methodology, source policy, correction/removal, support, and roadmap pages;
- local validation gates for publication safety.

Current live public export:

- 1,476 source records;
- 2,016 searchable passages;
- 1,631 insight cards;
- 1,060 public insight cards;
- 1,522 topics;
- 1,008 public topics;
- 10 creator profiles.

## Next: trust and release hardening

Near-term work focuses on making the public system safer, clearer, and easier to operate.

Planned improvements:

- keep newest-source readiness strict so a fresh source cannot ship as a plain text page with no reviewed topics or Source Intelligence;
- improve the source-review queue for held local-caption and weak-ASR rows;
- make release gates easier to run and understand for contributors;
- keep public API documentation aligned with the deployed JSONL fields;
- improve issue templates for correction/removal, bugs, and feature requests;
- add more public-safe fixtures for validators and static page tests.

## Next: useful public search experience

Public UI and data improvements planned next:

- better topic clustering for local SEO, AI visibility, and service-business use cases;
- clearer source pages with stronger attribution and less repeated evidence;
- richer creator pages that help users understand the public source slice without overstating endorsement;
- improved comparison pages for repeated claims, opposing views, and practical tactics;
- better social preview cards and metadata for public source/topic pages;
- more accessible navigation and mobile QA coverage.

## Next: public data and agent workflows

Base2026 is designed to be useful to AI tools without scraping the UI.

Planned API/agent improvements:

- keep `llms.txt`, `api-index.json`, and `data-dictionary.json` current with every release;
- document common recipes for local SEO research, AI-search visibility analysis, and topic discovery;
- add examples for reading `documents.jsonl`, `passages.jsonl`, `insight_cards.jsonl`, and topic signal briefs;
- publish clearer compatibility notes for scripts and agents that consume the static public files.

## Later: platform and source expansion

Base2026 currently focuses on a public TikTok source slice. Expansion should be careful and review-gated.

Possible future work:

- additional short-form platforms where public access and attribution can be handled safely;
- stronger creator correction/removal tooling;
- source-quality scoring and provenance labels;
- public benchmarks for transcript/source-text quality;
- optional local adapters for private research workflows that never leak into public exports.

## Not in scope

Base2026 is not trying to become:

- a video re-hosting platform;
- a raw caption or raw ASR dump;
- a private-data search engine;
- a way to bypass platform rights, creator attribution, or removal requests;
- a system that publishes unreviewed third-party transcripts by default.

## Funding use

If Base2026 receives grants, credits, or sponsorship, the priority is practical infrastructure and trust work:

- hosting, search, and storage costs;
- safer ingestion and review tooling;
- accessibility, SEO, and public documentation;
- public validation fixtures and tests;
- source-quality review and creator-rights workflows.

## How to propose roadmap changes

Open a GitHub issue and explain:

- the user or maintainer problem;
- why it fits Base2026;
- what data or rights boundary it touches;
- how success should be verified;
- what should remain private or out of scope.
