# Current Roadmap

Last updated: 2026-06-08

## Current state

Base2026 has a working public TikTok transcript search prototype, a deployed VPS release, a Meilisearch index, and a local zero-paid-token intake direction. Hermes is not a production dependency. It is only a local prototype/helper while the reproducible intake path is hardened.

The project has a deployed public UI release: `base2026-public-ay-style-ay3`. It includes full transcripts in the deploy package, source-record UI wording, methodology and opt-out pages, public export validation, auto-promoted high-confidence insight cards, a light Alex Yarosh-compatible visual system, and a fixed nginx Meilisearch search proxy.

The project is not GitHub-ready yet because production-grade TikTok/Instagram transcription intake, license choice, and final public/private audit are still open.

## Immediate order

1. Stabilize repo state
   - Review current uncommitted changes.
   - Keep private/generated artifacts out of git.
   - Commit only public-safe Hermes/docs/UI source changes after audit.

2. Production transcription research
   - Current synthesis exists: `docs/research/TRANSCRIPTION_PIPELINE_OPTIONS.md`.
   - Local-worker automation design exists: `docs/research/LOCAL_WORKER_AUTOMATION_ARCHITECTURE.md`.
   - Local cleanup model decision exists: `docs/research/LOCAL_LLM_CLEANUP_LAYER.md`.
   - Creator admin flow exists: `docs/research/CREATOR_ADMIN_FLOW.md`.
   - Current recommendation: local worker for fragile/heavy ingestion, VPS for clean storage/search/UI.
   - Current TikTok extraction pass checked 68 URLs, imported 14 new `@joshuamaraney` caption-ready records, skipped 12 duplicates, and left 36 records for ASR fallback.
   - Next required step: local ASR fallback only for `needs_asr` records before implementing the full worker.

3. Attributed intelligence architecture
   - Architecture doc exists: `docs/research/ATTRIBUTED_INTELLIGENCE_ARCHITECTURE.md`.
   - Public schema doc exists: `docs/schemas/PUBLIC_JSONL_SCHEMA.md`.
   - Public export must be excerpt-only by default.
   - Full transcripts require explicit private/gated/noindex policy.
   - Current release export produces `source_records.jsonl`, `passages.jsonl`, and `insight_cards.jsonl`.
   - Local/live release smoke: 957 source records, 1392 passages, 1538 insight cards, 1097 public insight cards.
   - Historical note: older package behavior and docs were excerpt/full-transcript-flag oriented. The corrected target is reviewed public source text, not raw transcript export.

4. Public UI model
   - Use `Platform` for social network: TikTok now, Instagram planned.
   - Use `Topic` or `Category` for content meaning: SEO, GEO, AEO, Schema, Local SEO, Google, Bing, Reviews, AI Overviews, Content Strategy.
   - Do not mix platform and topic naming.
   - Treat public pages as attributed source/insight pages, not a raw transcript dump.
   - Keep raw captions, raw ASR, media, private QA, and unreviewed transcripts private/local. Reviewed public source text can appear in source records when policy allows.

5. Public UI visual pass
   - Previous dark visual system was rejected as not matching the main WordPress site.
   - Live UI now uses a light Alex Yarosh-compatible system with `Source Sans 3`, warm off-white backgrounds, orange CTA, dark-green primary buttons, 8px controls, and restrained cards.
   - Root page no longer renders as an empty shell: empty query returns 1392 passages and populated facets.
   - Desktop/mobile QA passed; evidence is under `output/evidence/knowledge-live-ay3-*.png`.

6. Instagram intake planning
   - Do not bolt Instagram into TikTok scripts blindly.
   - First generalize the public data model from TikTok-only to platform-aware video/social posts.
   - Then add Instagram source adapter and only then ingestion.

7. GitHub readiness
   - Choose license.
   - Run publication/security audit.
   - Add methodology and opt-out/correction docs/pages.
   - Make README clear that public demo uses source-backed excerpts/insights, not bulk third-party transcript publication.
   - Stage only public-safe source and docs.
   - Do not push generated exports, private research, raw captions, audio/video, logs, local DB, or credentials.
   - Use `docs/project-memory/OPEN_SOURCE_POSITIONING.md` for honest public framing.

## Current active phase

Transcript intake gate before Phase 7: ASR fallback, repo stabilization, and open-source readiness.

## Next concrete task

Run local ASR fallback for the 36 staged `needs_asr` TikTok records, then start the GitHub publication/security audit.
