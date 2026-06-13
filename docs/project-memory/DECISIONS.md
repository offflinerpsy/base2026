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

## 2026-06-11 — Keep mobile navigation visually unified across WordPress and Base2026

Decision: WordPress and Base2026 mobile headers should use one shared visual contract: avatar header, compact light floating drawer, a non-navigating `Base2026` parent item that expands submenu links, and a high-contrast CTA hover/focus state.

Reason: the public site spans WordPress and a static Base2026 app. If the two mobile menus behave differently, users experience the product as stitched together rather than intentional. Keeping one navigation contract reduces launch QA risk and makes future page additions easier to verify.

## 2026-06-11 — Use h264-first media fallback and local worker ASR on macOS

Decision: TikTok ASR fallback on Mac must use POSIX-safe yt-dlp output templates, prefer known h264/downloadable media formats before generic `best`, and invoke the project `base2026-worker.py transcribe` faster-whisper path instead of relying on a global `whisper` CLI.

Reason: macOS PowerShell path separators created bad backslash-named media paths, TikTok H265/bytevc1 downloads failed ffmpeg audio extraction in the local environment, and the old global `whisper` command was not installed. The local worker path is reproducible, checked by `doctor`, and keeps ASR inside the project runtime.

## 2026-06-11 — Derive Base2026 static cache-bust from release name

Decision: release packages should use the release name as the static CSS/JS cache-bust value instead of a manually edited hardcoded marker.

Reason: manual cache-bust constants go stale and can make a successful deploy appear broken in the browser. Release-derived cache busting makes every package self-identifying and reduces launch QA ambiguity.

## 2026-06-12 — Version delayed static payloads with the release cache-bust

Decision: static JSONL payloads loaded by Base2026 JavaScript after page load, starting with `documents.jsonl`, must use the same release cache-bust/version as the JS/CSS assets when immutable cache headers are active.

Reason: Meilisearch results can update with a new deploy while a browser still holds an older immutable JSONL payload. Versioning delayed payload fetches keeps source-modal record lookup aligned with the deployed search index and prevents false `Source record unavailable` states.

## 2026-06-12 — Normalize Base2026 asset versions after all static generators run

Decision: `scripts/package-public-release.ps1` must run a final recursive HTML pass over the release `web/` folder after every generator has finished and rewrite all public CSS/JS asset query strings to the current release cache-bust, including `../static/...` paths used by source/topic pages.

Reason: generator-local hardcoded style versions can overwrite earlier package-time replacements. With immutable `/knowledge/static/` cache headers, stale query strings make mobile fixes appear missing on live source/topic pages even when the deployed CSS file is correct.

## 2026-06-11 — Replay approved insight-card candidates from private archive

Decision: approved/reviewed/public `insight_card_candidate` rows are persisted in an ignored private JSONL archive under `12_knowledge-base/sources/tiktok/insight-candidates/reviewed-candidates.jsonl` and replayed by `build-kb-sqlite.py` during clean SQLite rebuilds. These replayed candidates do not create markdown claim cards under `12_knowledge-base/canonical/claims`; `kb-audit.py` now treats the difference between SQLite claims and markdown claim-card files as valid only when it equals the `insight_card_candidate` count.

Reason: reviewed candidate promotion must be durable without committing private review artifacts or generated claim-card files. Clean rebuilds should preserve approved public cards, while private `needs_human` candidates remain local and unpublished until separately reviewed.

## 2026-06-11 — Replay private candidate queues locally but exclude them from public export

Decision: ignored `insight-card` review archives may replay private queue statuses such as `needs_human` during clean local SQLite rebuilds, but `export-public-tiktok.py` must exclude every non-public `insight_card_candidate` row from public JSONL artifacts.

Reason: the operator needs durable private review state after clean rebuilds, but public deployment must not expose unapproved candidate claims even with `public=false` flags.

## 2026-06-11 — Keep the local TikTok refresh queue at all current public creators

Decision: the MacBook local refresh default is `config/tiktok-intake-queue.local.json`, ignored by Git, with all four current public TikTok creator sources. The committed `config/creators.example.json` also lists the same four public sources as a safe example.

Reason: a partial default creator config caused a full refresh command to check only two creator accounts. The local queue must match the public source set so scheduled and manual runs do not silently miss active creators.

## 2026-06-11 — Count existing approved cards before candidate promotion

Decision: insight-card promotion review must count already approved/reviewed/public candidate cards for the same source before recommending more candidates from that source. The reviewer must also flag speculative claims, generic actions, and overbroad actions as `needs_human`.

Reason: evidence-exact text can still be bad public product copy, and source pages should not be overfilled by repeatedly promoting mechanically verified candidates from the same video.

## 2026-06-12 — Use GPT/Codex as the current card text review lane

Decision: for the current launch-quality insight-card backlog, use GPT/Codex source-only review packets as the primary semantic/card-writing lane. The preferred working model is ChatGPT/GPT 5.5 Medium through Codex when available. Do not use local LLMs as the primary extractor or final writer for public card text.

Reason: the backlog is low-volume enough that quality and source faithfulness matter more than cheap local throughput. Scripts still own queueing, exact evidence verification, private import, reviewer promotion, rebuild/export, and deployment gates.

## 2026-06-12 — Enforce the public release contract in code and CI

Decision: public Base2026 package/deploy paths must obey `contracts/base2026.public-release-contract.json`: no full transcript release flag, no implicit public insight auto-promotion, no tracked generated export artifacts, fixture-backed positive/negative CI checks, and staged release exports before packaging.

Reason: the public boundary cannot depend on chat memory or manual operator discipline. The live ay76 export is excerpt-only, but it still contains legacy `auto_evidence_match` public cards. Future public data-changing deploys must either explicitly review/migrate those cards or block before replacing the live release.

## 2026-06-12 — Split legacy public-card migration into text and visual lanes

Decision: legacy `auto_evidence_match` public cards must be migrated through `scripts/base2026-review-legacy-insights.py`. Text-only cards can be approved deterministically or repaired through GPT/Codex source-only JSON packets. Cards whose meaning depends on what the TikTok shows must be marked `needs_visual_context` until a thumbnail/frame evidence layer confirms the visible context.

Reason: rough TikTok transcripts often omit or distort the visual point of the video. Rewriting those cards from text alone can create confident but false public claims. A separate visual-context lane keeps the public insight layer useful without inventing screenshots, UI states, charts, or visual demonstrations that the supplied public passages do not prove.

## 2026-06-13 — Replay reviewed legacy public cards during clean rebuilds

Decision: reviewed legacy public insight cards are persisted in an ignored local archive at `12_knowledge-base/sources/tiktok/insight-candidates/reviewed-legacy-insights.jsonl` and replayed by `scripts/build-kb-sqlite.py` during clean SQLite rebuilds. The replay deletes any prior claim evidence for that claim before inserting reviewed evidence so one claim cannot duplicate in public export.

Reason: the ay80 pipeline showed that a clean SQLite rebuild can erase DB-only reviewed legacy approvals and collapse public cards unless those approvals have a replayable source of truth. Keeping the replay hook in code and the reviewed archive local/ignored preserves launch-quality public cards without committing private review artifacts or generated exports.
