# Decisions

## 2026-06-06 — Use file-based project memory

Decision: use `docs/project-memory/` as the operational source of truth for Base2026 planning, status, handoffs, public/private boundaries, deploy notes, and Hermes automation notes.

Reason: long Codex chats are disposable and can compact. Repo files remain inspectable by Codex, Hermes, maintainers, and future contributors.

## 2026-06-06 — Keep public TikTok product separate from private research base

Decision: publish only the public TikTok knowledge product and safe project code/docs. Keep private SEO/GEO/AEO research folders local unless explicitly reviewed and exported.

Reason: the project is moving toward open source and public deployment.

## 2026-06-06 — Use status board as operational planning board

Decision: use `STATUS_BOARD.csv` and `PHASES.md` as the planning board for Base2026 work.

Reason: CSV is easy for agents to update and easy for humans to inspect.

## 2026-06-06 — Separate ASR backlog from source-review backlog

Decision: use `needs_source_review` when captions fail and fallback media has no audio stream. Do not keep those videos in `needs_asr`.

Reason: ASR cannot succeed without an audio track. Retrying Whisper wastes time and creates false queued jobs.

## 2026-06-06 — Gate public UI through visual-system review

Decision: before broader public/GitHub exposure, run a dedicated visual-system pass for controls, spacing, filters, result cards, transcript expansion, desktop/mobile screenshots, and strict reviewer checks.

Reason: the UI works technically, but the current visual quality is not good enough to show as the public face of the product.

## 2026-06-07 — Treat Hermes as local prototype only

Decision: Hermes is a local/private helper for testing the knowledge-base idea, not a production or GitHub dependency.

Reason: the public project needs a Hermes-free transcription intake path for TikTok and Instagram. Before production hardening or GitHub publication, research and choose a reproducible pipeline that can run on VPS or use reliable free/self-hosted components.

## 2026-06-07 — Default daily ingestion to zero paid LLM usage

Decision: the daily TikTok/Instagram ingestion loop should use local tools by default: `yt-dlp`/fallback extractors, `ffmpeg`, local ASR, deterministic cleanup, token-diff guards, JSONL upload, and optional local LLM cleanup only after validation.

Reason: paid LLMs and Codex subscriptions should not be consumed by routine daily ingestion. Codex remains the command center for architecture/debugging/review, not the scheduled worker.

## 2026-06-07 — Use Gemma 4 12B as primary local cleanup LLM target

Decision: `faster-whisper` or `whisper.cpp` handles transcription. Gemma 4 12B is the primary local LLM target for transcript cleanup, topic extraction, quality flags, and admin/operator tasks. The exact model remains configurable by local endpoint.

Reason: transcription should be ASR, not LLM guessing. Cleanup can use a local open model, but only behind token-diff guards and with paid LLM disabled by default.

## 2026-06-07 — Keep public prose direct and stop AI slop

Decision: apply a stop-slop style review to README, docs, UI copy, and public GitHub positioning. Do not apply it as a rewrite policy for creator transcripts.

Reason: public docs should sound like engineering notes, not generated marketing. Transcripts must preserve how the creator spoke.

## 2026-06-07 — Public product is an attributed intelligence layer

Decision: Base2026 public launch should not be framed or implemented as a mass dump of full third-party TikTok/Instagram transcripts. The public layer should prioritize attributed excerpts, source records, topic pages, insight cards, comparison views, methodology, and opt-out/correction flow. Full transcripts stay private/local by default unless a reviewed opt-in, gated, or noindex policy is selected.

Reason: this reduces platform, SEO, creator-trust, and product-quality risk while increasing the actual value of the project.

## 2026-06-07 — Public exports are excerpt-only by default

Decision: public export scripts must not include full third-party transcripts by default. Full transcript export requires an explicit flag and must be treated as private, gated, noindex, reviewed, or opt-in depending on the release context.

Reason: default public artifacts should match the source-record/insight architecture and avoid accidental transcript dumping.

## 2026-06-08 — Index only aggregate topic and comparison pages

Decision: generate topic and comparison pages for public UX, but only allow `index,follow` when a topic has at least two public source-backed insight cards. Singleton topic/compare pages must be `noindex,follow` and excluded from topic index pages.

Reason: this keeps navigation useful without turning Base2026 into thin programmatic SEO pages or scaled content abuse.

## 2026-06-08 — Generate public info pages from Markdown source

Decision: keep public roadmap, project story, privacy, source/content policy, support, and site-structure copy in `docs/public-pages/`, then generate static HTML with `scripts/generate-info-pages.py`.

Reason: the public site needs visible trust/roadmap pages, while future agents need editable Markdown source instead of hand-maintaining generated HTML.

## 2026-06-09 — Use existing Rank Math; add static SEO directly to Base2026

Decision: do not install Yoast or another SEO plugin on top of the already active Rank Math plugin. Keep WordPress SEO under Rank Math and add Base2026 static metadata, canonical URLs, schema, and sitemap generation directly in the Base2026 build pipeline.

Reason: two SEO plugins create conflicts. Base2026 is static under `/knowledge/`, so it needs build-time SEO output and a dedicated sitemap instead of relying only on WordPress plugin discovery.

## 2026-06-10 — Keep backfill candidates private until explicit promotion

Decision: local model claim backfill may import verified candidates into SQLite as `claim_type = insight_card_candidate` and `review_status = pending`, but those candidates must not be auto-promoted into public insight cards by the normal export auto-promotion flag.

Reason: the backfill layer is new and must prove evidence fidelity before it changes public source/topic pages. Public promotion remains a separate reviewed step.

## 2026-06-10 — Use a project-local Python worker environment

Decision: use `.venv` plus `requirements-local-worker.txt` for local worker dependencies such as `faster-whisper`, `ctranslate2`, and `requests`.

Reason: MacBook system Python is not a stable production worker environment, and ASR dependencies should not be installed ad hoc into global Python.

## 2026-06-10 — Keep Qwen primary for claim extraction; test Gemma 4 as reviewer

Decision: do not promote `gemma4:12b` to primary private claim extractor yet. Keep `qwen3:8b` as the primary extractor for the next controlled backfill batch, and test `gemma4:12b` as a semantic reviewer/precision gate before broader import.

Reason: on the same current 3-source backfill queue sample, `gemma4:12b` produced 1 verified candidate at 49.870 seconds/source, while `qwen3:8b` produced 5 verified candidates at 33.972 seconds/source. Gemma 4's single candidate was clean, but yield and latency are not good enough to make it the main extractor without a prompt/reviewer redesign.

## 2026-06-10 — Use ChatGPT Pro as a manual review lane, not a production worker

Decision: ChatGPT Pro/GPT-5.4 may be used through generated review packets for small-batch semantic and copy review of private insight-card candidates. It must not be treated as scheduled browser automation, a limit-bypass architecture, or a replacement for deterministic evidence verification.

Reason: Base2026 needs high-quality, faithful insight-card copy more than raw candidate volume. Local models can generate candidates cheaply, but exact evidence matching does not prove semantic entailment. A manual GPT review lane gives better text quality while keeping the durable pipeline scriptable, auditable, private-by-default, and safe to continue without publishing private material.

## 2026-06-10 — Prefer GPT/Codex for small-batch insight-card text quality

Decision: for the current low-volume backfill and launch-quality card work, ChatGPT Pro/GPT-5.4 or Codex may act as the primary source-backed claim extraction and semantic/copy quality lane. `qwen3:8b` remains useful as optional local draft/prefilter/offline mode, but it is not required before GPT review and must not be trusted as a final writer.

Reason: the project does not currently have mass throughput pressure. The important failure mode is not cost; it is bad public-facing claims that sound plausible but do not follow from the source. GPT-first packets let the system skip weak local drafts when quality matters, while local scripts still enforce repeatable queueing, strict JSON handoff, evidence verification, private/pending import, and public promotion gates.

## 2026-06-10 — Require promotion reports before public insight-card promotion

Decision: pending `insight_card_candidate` rows must pass a read-only promotion review report before any future command can promote them into public insight cards.

Reason: evidence verification and private import prove that claims are source-backed enough to store locally, but public promotion also needs source-level selection, duplicate control, text-quality checks, and explicit reviewer accountability. The report is a gate; it does not publish or mutate SQLite.

## 2026-06-10 — Gate public UI changes with mixed mobile visual QA

Decision: use `scripts/mobile-visual-qa.mjs` as the repeatable visual QA gate for the mixed WordPress root site and Base2026 `/knowledge/` app before public UI deploys.

Reason: the public site spans WordPress theme CSS and static Base2026 pages. Mobile bugs can appear in either layer, so the gate must check both surfaces across phone, tablet, and desktop viewports for horizontal overflow, clipped controls/headings, console errors, search readiness, forms, and the Base2026 source dialog.

## 2026-06-11 — Use one canonical source identity system

Decision: Base2026 source pages, creator pages, search cards, and source modals must render creator/source identity through one shared pattern: avatar, `@handle`, date when relevant, platform icon, compact meta chips, and compact share actions. Do not introduce separate page-specific layouts for the same source metadata.

Reason: inconsistent repeated labels made the product look improvised and hard to scale. A canonical identity system keeps static generation, modal rendering, SEO/schema naming, and future multi-index UI work aligned without rebuilding every page surface separately.

## 2026-06-11 — Keep Base2026 filters native to the static app

Decision: Base2026 mobile search filters should be implemented as a native static-app drawer in the `/knowledge/` UI, not through a WordPress or Contact Form plugin.

Reason: the filter state belongs to the Meilisearch/InstantSearch app under `/knowledge/`, not to WordPress form handling. A native drawer avoids plugin coupling, keeps the public app fast, works with the existing static export, and is easier to test in repeatable live QA.
