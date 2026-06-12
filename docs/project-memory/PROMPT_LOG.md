# Prompt Log

## 2026-06-06 — Project control system

User asked to adapt a separate project-control pattern for Base2026, create a durable todo/control system, and use a strict reviewer role.

Outcome:

- created `AGENTS.md`
- created `docs/project-memory/`
- created status board, phases, handoff template, public/private boundary, deploy runbook, Hermes runbook, and reviewer protocol
- set next action to first public-safe git commit preparation

## 2026-06-06 — First public-safe commit prep

User confirmed moving by the new project-control scheme and approved doing the next step.

Outcome:

- staged only public-safe files
- strengthened `.gitignore`
- sanitized deployment docs and agent prompts to remove local absolute paths and concrete server host
- rewrote `README.md` for the public TikTok/video knowledge product
- reviewer pass found no forbidden staged private paths

## 2026-06-06 — Hermes model-routed refresh

User asked to split Hermes work by model tier and avoid GPT-5.5 token waste.

Outcome:

- documented Hermes model routing: GPT-5.3/no LLM for mechanics, GPT-5.4 for normal faithful polish, GPT-5.5 only for escalation
- ran local Hermes refresh without deploy
- pulled captions for two queued videos; ASR was not needed
- created polish batch `hermes-polish-20260606-164846`
- ran Hermes worker with model `gpt-5.4`
- wrote polished outputs and QA for two newest videos
- corrected two QA items using source verification instead of GPT-5.5
- patched `tiktok-polish-status.py` and `hermes-tiktok-refresh.ps1` so `-AfterPolish` checks only the current batch instead of failing on historical `needs_review` items
- ran `-AfterPolish` for `hermes-polish-20260606-164846`
- rebuilt SQLite, audit passed, exported 942 documents and 1371 chunks
- reindexed local Meilisearch and deployed/reindexed VPS release `base2026-public-hermes-20260606-1705`
- verified remote search finds both new TikTok videos

## 2026-06-06 — Hermes reliability and UI backlog

User asked to fix Hermes WebUI reliability, add lean worker path, close pipeline tails, keep the guide updated, and record the weak visual UI as the next serious workstream.

Outcome:

- repaired `Hermes WebUI` scheduled task by switching action to absolute `C:\Program Files\PowerShell\7\pwsh.exe` and setting working directory
- added `scripts/register-hermes-webui-task.ps1` for reproducible WebUI task repair/start
- added `scripts/run-hermes-polish-worker.ps1` for durable GPT-5.4 batch polish handoff with ignored `.planning/` logs
- fixed ASR fallback media detection to accept mp3/mp4/m4a/webm/wav
- marked two no-audio fallback videos as `needs_source_review` instead of endless `needs_asr`
- verified `needs_asr=0`, `queued_asr_jobs=0`, and `kb-audit.py` PASS after rebuild
- moved active phase to Public web UI visual-system pass and created `UI_VISUAL_BACKLOG.md`

## 2026-06-07 — Hermes-free transcription research synthesis

User supplied three external research outputs about TikTok/Instagram transcription without Hermes.

Outcome:

- created `docs/research/TRANSCRIPTION_PIPELINE_OPTIONS.md`
- set recommendation: local worker handles scraping/download/ASR; VPS handles ingest/search/UI
- confirmed Hermes is local prototype only, not production dependency
- updated next action to design/run 40-video PoC before UI/GitHub production hardening

## 2026-06-07 — Zero-paid-token local worker architecture

User asked how to avoid paid subscriptions and paid LLM/token usage for daily TikTok/Instagram ingestion.

Outcome:

- created `docs/research/LOCAL_WORKER_AUTOMATION_ARCHITECTURE.md`
- set daily ingestion default to local tools: extractor, `ffmpeg`, local ASR, deterministic cleanup, token guard, JSONL upload
- local LLM is optional and configurable through a local endpoint; paid LLMs are manual fallback only
- Codex role clarified as command center/debugger/reviewer, not daily scheduled worker

## 2026-06-07 — Local LLM, creator admin, and open-source positioning

User asked which local LLM should clean transcripts, how Hermes should use it, how new creators should be added, and how to prepare GitHub without AI slop.

Outcome:

- created `docs/research/LOCAL_LLM_CLEANUP_LAYER.md`
- selected Gemma 4 12B as primary local cleanup LLM target, with model configurable by endpoint
- created `docs/research/CREATOR_ADMIN_FLOW.md`
- created `docs/project-memory/HERMES_LOCAL_OPERATOR_GUIDE.md`
- created `docs/project-memory/OPEN_SOURCE_POSITIONING.md`
- clarified that stop-slop applies to public docs/UI copy, not faithful transcript rewriting

## 2026-06-07 — faster-whisper local worker smoke test

User asked to connect ASR and implement the real transcribe path.

Outcome:

- confirmed `faster-whisper` Python package is installed and importable
- updated `scripts/base2026-worker.py transcribe` to use the Python API, not a missing CLI binary
- added transcript text, segments JSON, and ASR metadata outputs
- smoke-tested one existing local audio fallback with `small.en`, `cpu`, `int8`
- result: ~88.8 seconds audio transcribed in ~50 seconds, 327 words, cleanup guard passed

## 2026-06-07 — Public content risk and positioning review

User supplied an external ChatGPT review of Base2026's public-product idea and asked for an engineering opinion.

Outcome:

- agreed with the core critique: the public project must not become a transcript dump or SEO farm;
- created `docs/research/PUBLIC_CONTENT_RISK_MODEL.md`;
- created `docs/research/EXTERNAL_REVIEW_PROMPT.md`;
- updated public/private publication boundary;
- set durable decision: public layer is attributed excerpts, source records, topic/insight cards, comparison views, methodology, and opt-out/correction; full third-party transcripts are private/local by default.

## 2026-06-07 — Attributed intelligence architecture pass

User approved the new public-safe direction and asked to lay the new architecture and continue work.

Outcome:

- created `docs/research/ATTRIBUTED_INTELLIGENCE_ARCHITECTURE.md`;
- created `docs/schemas/PUBLIC_JSONL_SCHEMA.md`;
- changed `scripts/export-public-tiktok.py` so full transcripts are not exported by default;
- added compatibility export files plus new architecture files: `source_records.jsonl`, `passages.jsonl`, and empty `insight_cards.jsonl`;
- smoke-tested public export into `.planning`: 943 source records, 1371 passages, `include_full_transcripts=false`;
- updated `web/static/meili.html` and `web/static/meili.js` from `Full transcript` language to source-record/excerpt-first language;
- updated project memory to treat public attribution architecture as part of the current research gate.

## 2026-06-07 — Deterministic insight-card baseline

User asked what a Microsoft-style engineer would do next: simple, efficient, low-token, checked, and plan-following.

Outcome:

- implemented zero-LLM `insight_cards.jsonl` export from existing claims;
- added deterministic evidence excerpt matching against passages;
- kept all current insight cards `public=false` because all claims are currently `pending`;
- added `scripts/check-public-export-policy.py`;
- smoke-tested export: 943 source records, 1371 passages, 1538 insight cards, 0 public insight cards, no full transcripts in excerpt-only export.

## 2026-06-07 — MVP release candidate with full transcript drawer

User clarified the desired UI behavior: result cards can show excerpts, but clicking the source record should open the full transcript.

Outcome:

- package script now exports deploy data with `--include-full-transcripts` and validates export policy;
- package script auto-promotes high-confidence insight cards;
- added methodology and opt-out pages to `web/static/`;
- added navigation links to the search UI;
- built local release candidate `base2026-public-mvp-smoke`;
- local release validation: 943 source records, 1371 passages, 1538 insight cards, 1097 public insight cards;
- HTTP checks passed for index, methodology, opt-out, and documents JSONL;
- uploaded release zip to VPS through SSH alias `geo-contabo`;
- deployed `/var/www/base2026-knowledge/releases/base2026-public-mvp-smoke`;
- reindexed Meilisearch: 1371 passages;
- switched `/var/www/base2026-knowledge/current`;
- nginx config test passed and nginx reloaded;
- server HTTP checks passed for `/knowledge/`, `/knowledge/methodology.html`, `/knowledge/opt-out.html`, and full-transcript `documents.jsonl`;
- Meilisearch search check passed for `AI Overviews`;
- browser MCP timed out, so screenshot QA remains pending.

## 2026-06-07 — Live search proxy and main-site visual remediation

User reported that the deployed `/knowledge/` page looked visually weak and returned no visible results.

Outcome:

- confirmed the empty result issue was real: `/knowledge-search/multi-search` was missing the Meilisearch Authorization header through nginx;
- fixed nginx on the VPS so the search key is injected server-side, without exposing the key in browser code;
- deployed release `base2026-public-mainstyle-fix`;
- restyled the public UI toward the main site system: dark shell, Manrope/Space Grotesk typography, header/footer, stronger controls, chips, result cards, facets, and source buttons;
- rebuilt and deployed the public package with 943 source records, 1371 passages, 1538 insight cards, and 1097 public insight cards;
- reindexed Meilisearch and verified public search for `AI Overviews`: 807 hits;
- captured live JS-loaded screenshot evidence at `output/releases/base2026-public-mainstyle-fix-live-wait.png`;
- remaining UI work: mobile screenshot QA and further visual polish after user review.

## 2026-06-08 — Light main-site UI correction and TikTok creator discovery

User rejected the dark `AI-Visibility` knowledge UI because it did not match the main WordPress site now served at `https://aggressorbulkit.online/`.

Outcome:

- inspected the main WordPress site style through browser automation;
- recorded the actual main-site visual direction: `Source Sans 3`, warm off-white background, dark charcoal text, orange CTA, dark-green primary buttons, 8px controls, compact sticky header;
- changed local `web/static/meili.html` and `web/static/styles.css` to the light Alex Yarosh-compatible design system;
- changed local methodology and opt-out pages to the same visual system;
- discovered TikTok profile data and first video URL queues for `@joshuamaraney` and `@webhivedigital`;
- confirmed individual TikTok video pages expose useful caption/meta text while browser `textTracks` are empty;
- created `docs/project-memory/TIKTOK_DISCOVERY_2026_06_08.md`;
- created `docs/project-memory/NEW_CREATOR_INTAKE_RUNBOOK.md`;
- created `docs/project-memory/NIGHT_RUN_2026_06_08.md`;
- created `config/tiktok-intake-queue.20260608.json`;
- created `scripts/tiktok-caption-browser-extract.mjs`;
- created `docs/schemas/TIKTOK_INTAKE_RECORD_SCHEMA.md`;
- created `docs/project-memory/TIKTOK_INTAKE_EXECUTION_PLAN.md`;
- created `docs/project-memory/VISUAL_SYSTEM_CONTRACT.md`;
- created `docs/project-memory/AY_STYLE_DEPLOY_CHECKLIST.md`;
- created `config/release-target.20260608-ay-style.json`;
- blocker: shell runner failed with `windows sandbox: spawn setup refresh`, so release packaging, SSH deploy, Python validation, and actual intake execution remain pending.

## 2026-06-08 — ay3 public UI deploy and TikTok staging import

User restarted the task with full local permissions and asked to continue visibly without degraded direction.

Outcome:

- fixed `scripts/package-public-release.ps1` so cache-bust URLs are replaced generically instead of hardcoded old versions;
- switched the live UI to cache-bust `20260608-ay3`;
- fixed empty first-screen search by enabling `placeholderSearch: true` in `web/static/meili.js`;
- fixed mobile header overflow by hiding the full nav under the mobile breakpoint;
- fixed the stretched source-dialog `Close` button by aligning the dialog header to flex-start;
- moved mobile results above filters for a more useful search-first flow;
- verified public export policy: 957 source records, 1392 passages, 1538 insight cards, 1097 public insight cards;
- deployed VPS release `base2026-public-ay-style-ay3`;
- verified `/knowledge/` is no longer empty: empty query returns 1392 passages and populated facets;
- verified search `Search Console Josh`: 670 passages, first visible result from `@joshuamaraney`;
- verified source dialog loads a polished `@joshuamaraney` transcript and direct original/copy controls;
- verified mobile QA: no horizontal overflow, nav hidden, results before filters;
- screenshot evidence saved under `output/evidence/knowledge-live-ay3-*.png`;
- current ingestion state: 68 staged TikTok URLs checked, 14 new `@joshuamaraney` records imported, 12 duplicates skipped, 36 records need ASR, 5 out-of-scope candidates, 1 short caption.

## 2026-06-08 — ChatGPT public-product review and caption preview fix

User supplied the external ChatGPT product critique again and pointed out that `Platform caption` looked clipped on the live site.

Outcome:

- confirmed the pasted critique matches the existing strategic decision: Base2026 should be an attributed intelligence/source layer, not a public transcript dump;
- created `docs/project-memory/PUBLIC_PRODUCT_GAP_REVIEW_2026_06_08.md`;
- identified that the live `Platform caption` text is truncated in the available TikTok metadata itself, not just CSS;
- changed UI copy to `Platform caption preview` when metadata ends in `...`;
- added a visible note explaining that the caption metadata is truncated and that the source record/original post should be used for full context;
- deployed release `base2026-public-ay-style-ay4`;
- verified live `/knowledge/?q=Search%20Console%20Josh`: 670 passages, first creator `@joshuamaraney`, caption summary `Platform caption preview`, warning note visible;
- clarified creator count: current queue had one new creator, `@joshuamaraney`; the second queued block was `@webhivedigital`, an existing creator refresh, so the live count of 4 creators is correct for processed data.

## 2026-06-08 — Public intelligence implementation planning

User asked to stop patching and implement the full public-product idea as a serious open-source/grant-ready project.

Outcome:

- researched current anchors: Google people-first/spam guidance, Google `VideoObject`, Schema.org `Claim`/`ClaimReview`, Meilisearch filters/facets and multi-search/federated search, GitHub repository best practices, and OpenSSF Scorecard;
- created `docs/project-memory/PUBLIC_INTELLIGENCE_IMPLEMENTATION_PLAN_2026_06_08.md`;
- set active phase to public intelligence layer implementation;
- set next execution target to static creator/source pages generated from public JSONL;
- preserved ASR fallback as a parallel ingestion task, not the immediate product/UI task.

## 2026-06-08 — Creator and source pages shipped

Outcome:

- added `scripts/generate-public-pages.py`;
- release package now generates static creator pages under `/knowledge/creators/`;
- release package now generates excerpt-first source pages under `/knowledge/sources/`;
- search results now include `Source page` and `Creator page` links;
- source pages include original link, creator link, excerpt, related passages, safe JSON-LD, and a full-transcript guard;
- generated 4 creator pages and 957 source pages in the release package;
- deployed `base2026-public-intel-pages-ay5`;
- verified live `Search Console Josh` result links to `/knowledge/sources/tiktok-video-7647809342548266258.html`;
- verified source page loads, has JSON-LD, and does not present raw/full transcript as standalone public content.

## 2026-06-08 — Topic and comparison pages shipped

Outcome:

- added deterministic `topics.jsonl` export from source-backed insight cards and passage topic fields;
- added topic policy validation to `scripts/check-public-export-policy.py`;
- added generated topic pages under `/knowledge/topics/{topic_id}.html`;
- added generated comparison pages under `/knowledge/compare/{topic_id}.html`;
- changed public package default to excerpt-only; full transcripts now require explicit `-IncludeFullTranscripts` for private/gated review exports;
- updated Meilisearch index settings so `topic_labels` are searchable and `topics` are filterable;
- added topic chips to live search result cards;
- deployed `base2026-public-intel-pages-ay6`;
- reindexed VPS Meilisearch with 1392 passages and topic fields;
- verified live `/knowledge/?q=AI%20Overviews`: 922 hits, 20 rendered result cards, 31 topic chips, no console errors;
- verified live topic page `/knowledge/topics/local-seo-google-business-profile.html`: `index,follow`, 10 cards, compare link present;
- verified live compare page `/knowledge/compare/local-seo-google-business-profile.html`: `index,follow`, 3 creator groups;
- verified singleton topic pages are `noindex,follow` and excluded from topic index pages;
- verified live `/knowledge/static/documents.jsonl`: 957 records checked, `transcript_leaks=0`;
- verified source dialog now shows `Platform caption preview`, `Public evidence excerpt`, and the private-transcript policy note instead of `Transcript text`;
- screenshot evidence saved under `output/evidence/knowledge-live-ay6-*.png`;
- next phase: GitHub/open-source readiness and publication audit.

## 2026-06-08 — Open-source readiness checkpoint

Outcome:

- rewrote `README.md` around the current local-first, excerpt-first public intelligence architecture;
- added `CONTRIBUTING.md`;
- added `CODE_OF_CONDUCT.md`;
- rewrote `SECURITY.md` for the current read-only public demo;
- added `.github/workflows/ci.yml` for Python and JavaScript syntax checks;
- updated `.env.example` to use `base2026_public_tiktok`;
- added `scripts/deploy-public-vps.ps1` for repeatable VPS deploys;
- fixed `scripts/package-public-release.ps1` to write Linux-friendly zip archives with POSIX paths instead of Windows backslash entries;
- tested `scripts/deploy-public-vps.ps1` against `base2026-public-intel-pages-ay6`;
- fixed deploy failure handling so native command errors fail the PowerShell script;
- fixed Meilisearch master-key handling by stripping CR/LF in both deploy script and `scripts/meili-index-public.py`;
- updated `.gitignore`, `docs/GIT_PUBLICATION_AUDIT.md`, and `docs/project-memory/PUBLICATION_BOUNDARY.md` so `config/creators.example.json` can be public-safe while release targets and TikTok intake queues remain ignored;
- added `docs/PUBLICATION_STAGING_PLAN.md` to prevent accidental `git add .`;
- added `scripts/audit-publication-boundary.py` as a repeatable public/private staging gate;
- added `docs/PUBLICATION_AUDIT_REPORT_2026_06_08.md`;
- added `docs/LICENSE_DECISION_NOTES.md`;
- added `docs/GITHUB_LAUNCH_CHECKLIST.md`;
- added `scripts/preflight-github-launch.ps1`;
- added `scripts/stage-public-files.ps1`;
- added `scripts/apply-license.ps1`;
- current audit result: 70 changed files, 70 public-safe candidates, 0 needs-review, 0 forbidden paths, 0 secret findings;
- default launch preflight now intentionally fails until `LICENSE` exists;
- audit-only preflight passes with `-SkipLicenseCheck`: publication audit, Python syntax, JavaScript syntax, PowerShell parse, public export policy, live search proxy;
- staging helper dry-run passes with `-SkipLicenseCheck`, covers all public-safe changed files, and refuses actual launch staging unless `LICENSE` exists;
- verification passed: Python syntax, JS syntax, PowerShell parse, public export policy, live deploy script, and basic secret grep.

Remaining before GitHub:

- license choice;
- GitHub remote target;
- final staged diff/publication audit;
- then stage only public-safe files.

## 2026-06-08 — Public source-record contract hardening

User asked to implement the external GPT critique instead of shipping a public transcript/caption dump.

Outcome:

- changed the public data contract so `documents.jsonl`, `source_records.jsonl`, `chunks.jsonl`, and `passages.jsonl` no longer include raw `claims` fields;
- strengthened `scripts/check-public-export-policy.py` so excerpt-only exports fail if source records or passages leak `claims`;
- kept full transcripts private by default: regenerated public export has 957 source records, 1392 passages, `claims_field=0`, and `transcripts=0` in public source/passages files;
- changed the search source dialog into an attributed source record: public policy, platform, language, topics, public evidence excerpt, original/source/creator links, and platform-caption metadata below the evidence text;
- removed inline `Platform caption` from result cards so truncated platform metadata is not mistaken for primary evidence;
- added query highlighting inside opened public evidence excerpts and set Meilisearch highlight tags to `<mark>`;
- changed generated source pages so H1 is stable attribution text such as `@tjrobertson52 source record`, while platform titles/captions stay in supporting copy/cards;
- renamed misleading `Reviewed` UI wording to `Public Insight Cards` where cards can be auto evidence-matched;
- packaged smoke release `base2026-ui-contract-check` passed: main search HTML present, static documents present, sample source page has stable H1, public excerpt, public insight cards, and full-transcript warning;
- GitHub metadata validator passes;
- publication audit now reports 78 changed files, 78 public-safe candidates, 0 needs-review, 0 forbidden, 0 secret findings;
- audit-only preflight passes with `-SkipLicenseCheck`; default preflight still blocks until `LICENSE` exists;
- staging dry-run passes with `stage_path_count=42` and does not stage without `-Apply`.

Remaining:

- choose license;
- choose GitHub remote/repo name;
- run final launch preflight without `-SkipLicenseCheck`;
- stage public-safe files only after license exists.

## 2026-06-08 — ay7 public source-record deploy

Outcome:

- packaged excerpt-only release `base2026-public-source-record-ay7`;
- deployed ay7 to VPS and switched `/var/www/base2026-knowledge/current`;
- nginx config test and reload passed;
- reindexed Meilisearch with 1392 passages;
- verified live `/knowledge/` returns the search UI and uses `/knowledge-search`;
- verified live sample source page `/knowledge/sources/tiktok-video-7388244947352210734.html` has H1 `@tjrobertson52 source record`, no stale `Reviewed` wording, `Public Evidence Excerpt`, `Public Insight Cards`, and the full-transcript warning;
- verified live `/knowledge/static/documents.jsonl`: 957 rows, `claims_field=0`, `transcripts=0`;
- verified live `/knowledge-search/multi-search` for `AI Overviews`: 922 hits, topic fields present;
- ran Playwright visual smoke checks on desktop and mobile: 20 rendered results, 20 source buttons, no horizontal overflow, source dialog opens with policy/excerpt/caption metadata;
- saved screenshots:
  - `output/evidence/knowledge-live-ay7-desktop.png`
  - `output/evidence/knowledge-live-ay7-mobile.png`
  - `output/evidence/knowledge-live-ay7-source-dialog.png`.

Remaining:

- GitHub launch still needs license and remote decision.

## 2026-06-08 — GitHub launch preflight live-data guard

Outcome:

- strengthened `scripts/preflight-github-launch.ps1` so live checks now validate both `/knowledge-search/multi-search` and `/knowledge/static/documents.jsonl`;
- fixed the first implementation after reviewer pass: PowerShell returned `documents.Content` as `byte[]`, so the script now decodes UTF-8 explicitly before counting JSONL rows;
- verified audit-only preflight passes with:
  - live search hits: 922
  - live documents rows: 957
  - claimLeaks: 0
  - transcriptLeaks: 0;
- updated GitHub launch checklist and publication audit report with the new guard.

Remaining:

- `LICENSE` is still intentionally missing until maintainer chooses `Apache-2.0` or `MIT`;
- `git remote -v` is empty.

## 2026-06-08 — GitHub remote guard

Outcome:

- added `-SkipRemoteCheck` to `scripts/preflight-github-launch.ps1` for interim audit runs;
- default launch preflight now requires GitHub `origin` remote after the license check;
- added `-SkipRemoteCheck` passthrough to `scripts/stage-public-files.ps1`;
- verified audit-only preflight passes with `-SkipLicenseCheck -SkipRemoteCheck`;
- verified remote guard blocks launch checks when `origin` is missing;
- updated `docs/GITHUB_LAUNCH_CHECKLIST.md`, `docs/PUBLICATION_AUDIT_REPORT_2026_06_08.md`, and `docs/project-memory/NEXT_ACTION.md` to use the new audit-only commands.

Remaining:

- choose `Apache-2.0` or `MIT`;
- add GitHub `origin` remote.

## 2026-06-08 — ay8 public roadmap and policy pages

User provided `docs/base2026_roadmap_pack.zip` with public roadmap/story/privacy/source-policy/support/site-structure Markdown and asked to publish the pages in the Base2026 site style, with Roadmap visible near the top.

Outcome:

- extracted public page source Markdown into `docs/public-pages/`;
- added `scripts/generate-info-pages.py` to generate `roadmap.html`, `story.html`, `privacy.html`, `source-policy.html`, `support.html`, and `site-structure.html`;
- linked Roadmap visibly from the `/knowledge/` hero and added footer links for roadmap, methodology, source policy, privacy, support, and creator opt-out;
- updated `scripts/package-public-release.ps1` so public info pages are regenerated and copied into every release package;
- updated `scripts/deploy-public-vps.ps1` so deploy fails if key info pages are missing;
- ignored the imported source ZIP with `docs/*_roadmap_pack.zip` and kept generated release zips out of GitHub;
- deployed `base2026-public-info-pages-ay8` to VPS;
- verified live HTTP 200 for `/knowledge/`, `/knowledge/roadmap.html`, `/knowledge/story.html`, `/knowledge/privacy.html`, `/knowledge/source-policy.html`, `/knowledge/support.html`, `/knowledge/site-structure.html`, `/knowledge/methodology.html`, and `/knowledge/opt-out.html`;
- verified live `/knowledge-search/multi-search` for `AI Overviews`: 922 hits;
- verified live browser render: 20 search results for `AI Overviews`, no horizontal overflow, Roadmap visible, Roadmap has 6 phase cards, mobile Support page renders.

Evidence:

- `output/evidence/base2026-info-pages-ay8-live-home-results.png`
- `output/evidence/base2026-info-pages-ay8-live-roadmap.png`
- `output/evidence/base2026-info-pages-ay8-live-support-mobile.png`

Remaining:

- choose license;
- add GitHub `origin` remote;
- run final preflight and stage public-safe files when maintainer approves.

## 2026-06-08 — ay9 Alex Yarosh header/footer and license pass

User reviewed the public pages and requested:

- remove smart apostrophe/quote/dash artifacts from Roadmap/Privacy/source pages;
- add `offflinerpsy@gmail.com` to correction/removal request copy;
- make Base2026 header/footer match the Alex Yarosh ecosystem;
- add Base2026 to the main WordPress header;
- add Roadmap/Base2026 links and orange Roadmap CTA in the footer;
- remove pill/oval active/hover state from the main header navigation;
- choose the recommended open-source license.

Outcome:

- normalized smart punctuation in `docs/public-pages/` and generated `/knowledge/*.html`;
- added correction/removal email to privacy/source/site-structure/opt-out copy and footer contact links;
- deployed `base2026-public-header-footer-ay9` to VPS;
- reindexed Meilisearch with 1392 passages;
- selected and applied Apache-2.0 license;
- updated the Alex Yarosh WordPress source project (`C:\Users\Makkaroshka\Desktop\geo`) with Base2026 main nav link, footer Roadmap links/CTA, and text-only orange active/hover state;
- deployed WordPress theme/import changes and bumped theme CSS to `1.5.2`.

Verification:

- `python .\scripts\audit-publication-boundary.py`: changed files 92, forbidden 0, secret findings 0;
- `scripts/preflight-github-launch.ps1 -SkipRemoteCheck`: pass;
- live `/knowledge/?q=AI Overview`: 20 rendered cards, creator facets present, CSS `20260608-ay9`;
- live `/knowledge/roadmap.html`: no smart quote/dash characters in rendered text;
- live WordPress home: Base2026 header link present, footer Base2026/Roadmap links and CTA present, active header state has transparent background and no pill/shadow;
- only observed console error: existing `/favicon.ico` 404.

Remaining:

- run the dedicated Roadmap scrollytelling redesign task for `/knowledge/roadmap.html`;
- add GitHub `origin` remote and run final launch preflight without skip flags;
- stage public-safe files only after final review.

## 2026-06-08 — ay10 roadmap scrollytelling redesign

User provided a dedicated roadmap redesign prompt and asked to run it after the header/footer/license work.

Inventory:

- current roadmap page was generated Markdown HTML from `docs/public-pages/01_ROADMAP.md`;
- related CSS lived in `web/static/styles.css`;
- no dedicated roadmap JS existed;
- global header/footer came from `scripts/generate-info-pages.py`.

Outcome:

- added a custom roadmap experience to `scripts/generate-info-pages.py` while preserving the generated Markdown as readable no-JS fallback;
- added `web/static/roadmap.js` with a structured `roadmapItems` array;
- roadmap JS renders phase navigation, milestone cards, status badges, quarter labels, expandable milestone details, and active section behavior;
- added CSS for a premium dark technical/product roadmap block, vertical progress rail, soft cards, sticky phase nav, and mobile accordion behavior;
- updated `scripts/package-public-release.ps1` so `roadmap.js` ships with releases;
- deployed `base2026-roadmap-scrolly-ay10`.

What was intentionally not used:

- no Motion/GSAP/third-party animation library; native CSS and IntersectionObserver were sufficient and cheaper/performance-safer;
- no Mermaid/Frappe/full roadmap app because the page needs public product storytelling, not dependency/task scheduling.

Verification:

- `node --check web\static\roadmap.js`: pass;
- `python -m py_compile scripts\generate-info-pages.py`: pass;
- local release QA: desktop/tablet/mobile, no console errors, no mobile overflow after fix;
- live `/knowledge/roadmap.html?qa=ay10`: 6 cards, nav Now/Next/Scale/Platform, statuses Done/In progress/Planned/Research, 6 details blocks, fallback present, desktop/mobile overflowX false, console errors 0;
- deployed ay10, nginx config test passed, Meilisearch reindexed with 1392 passages.

Known limitations:

- roadmap copy is still curated static data in `roadmap.js`; future changes should keep `docs/public-pages/01_ROADMAP.md` and `roadmapItems` aligned until a shared data source is introduced;
- fallback is readable but not as visually rich without JS.

Next:

- add GitHub `origin` remote and run final launch preflight without skip flags.

## 2026-06-09 — ay11b public info page visual normalization

User rejected the ay10 dark roadmap as visually inconsistent and requested the public info pages to match the main Base2026/Alex Yarosh visual system.

Outcome:

- removed the dark standalone roadmap treatment and restyled it as a light, clean Base2026 product section;
- kept structured `web/static/roadmap.js` and interactive cards, but changed the visual layer to warm surfaces, orange accents, restrained borders, and matching spacing;
- normalized all public info pages through shared `page-hero`, `content-section`, and footer button styles;
- changed footer CTA markup from mixed `hero-actions` / `ay-button-orange` to consistent `ay-actions` / `ay-button`;
- bumped cache-bust to `20260609-ay11` in generators, static pages, and release packaging;
- deployed `base2026-info-pages-clean-ay11b`.

Verification:

- live roadmap loads `styles.css?v=20260609-ay11` and `roadmap.js?v=20260609-ay11`;
- roadmap has 6 cards, no dark block, no desktop/mobile horizontal overflow;
- privacy page has correction email and matching 42px footer buttons;
- `/knowledge/?q=AI Overview` still renders 20 results and creator facets;
- publication audit and preflight pass with only remote check skipped.

## 2026-06-09 — separate roadmap data-visualization test page

User requested a complete roadmap rethink using the requested `build-web-data-visualization` plugin, without touching anything else, and asked to use the original Markdown roadmap data.

Finding:

- `build-web-data-visualization` was not available in installed or installable plugins for this session.
- The original source file exists at `docs/public-pages/01_ROADMAP.md`.

Outcome:

- created a separate test page, not a replacement for production roadmap:
  - `web/static/roadmap-dataviz-test.html`
  - `web/static/roadmap-dataviz-test.css`
  - `web/static/roadmap-dataviz-test.js`
- added test page assets to `scripts/package-public-release.ps1`;
- deployed `base2026-roadmap-dataviz-test-ay12`;
- live test URL: `/knowledge/roadmap-dataviz-test.html`.

Verification:

- `node --check web/static/roadmap-dataviz-test.js`: pass;
- local and live Playwright checks: 6 phase tabs, 6 SVG nodes, 6 workload bars, 3 funding cards, 3 priority columns, source MD label present;
- desktop/mobile overflowX false;
- production `/knowledge/roadmap.html` was not replaced.

## 2026-06-09 — roadmap data-visualization test copy logic refinement

User supplied technical/content fixes for the separate roadmap data-visualization test page and asked not to change the current visualization technology.

Outcome:

- updated only the separate test page assets:
  - `web/static/roadmap-dataviz-test.html`
  - `web/static/roadmap-dataviz-test.css`
  - `web/static/roadmap-dataviz-test.js`
- replaced internal todo-like roadmap wording with public product maturity wording;
- changed Phase 1 to `Public Trust Foundation`;
- reorganized the test data into six public-facing phases: trust foundation, ingestion pipeline, AI knowledge layer, creator/rights controls, analytics/signals, and monetization;
- added status badges for `Live`, `In progress`, `Next`, `Planned`, and `Research`;
- added top Now/Next/Later summary strip;
- added final `What this roadmap proves` section;
- added a no-JS fallback list of phases.

Verification:

- `node --check web/static/roadmap-dataviz-test.js`: pass;
- local Playwright desktop/mobile: 1 H1, 6 phase tabs, 6 SVG nodes, 3 summary cards, no forbidden `Publish Roadmap`-style todo wording, no horizontal overflow, console errors 0;
- JS-disabled mobile fallback: readable, 6 phases, no horizontal overflow.

Deployment:

- not deployed in this task. Production `/knowledge/roadmap.html` was not touched.

## 2026-06-09 — roadmap data-visualization test ay13 deploy

User requested deployment of the refined separate roadmap data-visualization test page.

Outcome:

- deployed release `base2026-roadmap-dataviz-test-ay13`;
- current symlink switched on VPS;
- nginx config tested and reloaded by deploy script;
- Meilisearch reindexed with 1392 passages.

Live verification:

- `/knowledge/roadmap-dataviz-test.html?qa=ay13` returns 200;
- `/knowledge/` returns 200;
- desktop/mobile Playwright checks: 1 H1, 6 phase tabs, 6 SVG nodes, 3 summary cards, proof section present, no forbidden `Publish Roadmap`-style todo wording, no horizontal overflow, console errors 0;
- phase-switching check confirms all five statuses are present: `Live`, `In progress`, `Next`, `Planned`, `Research`.

## 2026-06-09 — production roadmap ay14c deploy

User approved the roadmap data-visualization test and requested promotion from test mode to the live roadmap page.

Outcome:

- promoted the approved roadmap visualization into production `/knowledge/roadmap.html`;
- removed the `Source file` plaque from the public roadmap experience;
- updated `docs/public-pages/01_ROADMAP.md` so no-JS fallback and source copy match the public-facing roadmap;
- replaced production `web/static/roadmap.js` with the public phase data model and live status badges;
- added production-scoped roadmap visualization styles to `web/static/styles.css`;
- bumped roadmap/static cache-bust to `20260609-ay14c`;
- deployed release `base2026-roadmap-prod-ay14c`.

Verification:

- package-shape local QA passed for desktop and mobile;
- live `/knowledge/roadmap.html?qa=ay14c` returns 200;
- live QA: header/footer present, 1 H1, 6 phase tabs, 6 SVG nodes, active SVG node uses warm orange-soft fill, 3 summary cards, proof section present, source-file plaque absent, 13 `Live` badges, no forbidden `Publish Roadmap` todo wording, no horizontal overflow, console errors 0;
- all five statuses verified after phase switching: `Live`, `In progress`, `Next`, `Planned`, `Research`;
- publication audit and preflight passed with `forbidden=0`, `secret_findings=0`, `preflight=ok`.

## 2026-06-09 — domain and SSL migration

User requested moving the split WordPress/Base2026 site from IP access to the new domain `aggressorbulkit.online`.

Outcome:

- verified DNS: `aggressorbulkit.online` and `www.aggressorbulkit.online` point to `207.244.242.42`;
- updated nginx `server_name` for the existing `alex-yarosh` site to include the apex and www domain;
- installed Certbot and issued a Let's Encrypt certificate for both names;
- enabled HTTPS redirect through Certbot's nginx integration;
- updated WordPress `home` and `siteurl` to `https://aggressorbulkit.online`;
- ran WordPress search-replace from the old IP URL to the new HTTPS domain, with 23 replacements;
- updated repo docs/scripts that still referenced the old IP or placeholder domain.

Verification:

- `https://aggressorbulkit.online/` returns 200 and serves the WordPress site;
- `https://aggressorbulkit.online/knowledge/` returns 200 and serves Base2026;
- `https://aggressorbulkit.online/knowledge/roadmap.html` returns 200;
- `www.aggressorbulkit.online` is covered by the certificate and redirects to the apex domain;
- WordPress dry-run search-replace reports 0 remaining old-IP replacements;
- public HTML checks found no old IP and no `http://aggressorbulkit.online`;
- Meilisearch proxy works on the new domain with 922 hits for `AI Overviews`;
- Certbot timer is active and certificate expires on 2026-09-07;
- publication preflight passes against the new HTTPS domain.

## 2026-06-09 — commercial funnel and Base2026 cleanup ay16

User requested cleanup of the live `aggressorbulkit.online` hierarchy, navigation, CTA flow, copy consistency, footer structure, privacy/cookie handling, and Base2026 separation. User also asked to prepare the work so the next finishing stage can be SEO optimization without breaking the current structure.

Outcome:

- backed up the live WordPress theme and database on the VPS before edits;
- unified the commercial lead magnet as `Free AI Visibility Roadmap` and CTA as `Get My Free Roadmap`;
- simplified WordPress header navigation to Services, Pricing, Base2026, About, and the primary roadmap CTA;
- rewrote/updated live WordPress Home, Services, Pricing, AI Visibility Audit, Contact, and Privacy Policy pages through WP CLI;
- removed the `$499` pricing conflict and kept the Pricing package card as source of truth for the `$750` Diagnostic Audit price;
- rebuilt the WordPress footer into the agreed five-column structure;
- aligned Base2026 header/footer/navigation with the Alex Yarosh ecosystem while keeping `/knowledge/` product search intact;
- updated Base2026 roadmap/support/status language to distinguish live/completed/planned work;
- added cookie consent and footer Cookie Preferences on both WordPress and Base2026;
- bumped WordPress theme CSS to `1.5.9` and Base2026 static cache-bust to `20260609-ay16`;
- deployed `/knowledge/` release `base2026-site-funnel-clean-ay16`.

Verification:

- `php -l` passed for the WordPress theme `functions.php` locally and on the VPS;
- `node --check web/static/cookie-consent.js` passed;
- `python -m py_compile` passed for generation/export policy scripts;
- deploy script passed: public export policy ok, 957 source records, 1392 passages, 1040 topics, 46 indexable topics, Meilisearch reindexed with 1392 passages;
- 12 key live URLs returned 200;
- Playwright desktop/mobile QA passed: one H1 per checked page, no horizontal overflow, no console errors, unified CTA/copy present, no `$499`, no old Snapshot main-offer naming;
- focused QA passed: cookie banner hides after Reject/Save, Cookie Preferences reopens dialog, `/knowledge/?q=AI Overviews` renders 20 cards, header/footer internal links return 200.

Evidence:

- `output/evidence/site-cleanup-ay15/home-desktop.png`
- `output/evidence/site-cleanup-ay15/audit-mobile.png`
- `output/evidence/site-cleanup-ay15/knowledge-search-ai-overviews-desktop.png`
- `output/evidence/site-cleanup-ay16/cookie-modal-desktop.png`
- `output/evidence/site-cleanup-ay16/knowledge-search-ai-overviews-desktop.png`

Next action:

- run the dedicated SEO readiness pass: page titles/meta, canonical URLs, robots/noindex, sitemap coverage, schema, internal linking, Open Graph, and test/thin-page exposure before GitHub publication.

## 2026-06-09 — services page editorial width fix

User marked the Services page editorial system block in the browser and requested that the container be widened to match the homepage width because the service cards looked squeezed.

Outcome:

- widened the Services editorial wrapper to `min(100%, 1500px)`, matching the homepage hero wrapper;
- bumped the WordPress child theme version to `1.5.10` for CSS cache-busting;
- deployed the updated `style.css` to the VPS and cleared WordPress/cache-enabler cache.

Verification:

- live `/services/?qa=services-width-fix` loads `style.css?ver=1.5.10`;
- selected Services editorial shell width is 1205px in a 1245px viewport;
- no horizontal overflow and no browser console errors;
- screenshot evidence: `output/evidence/services-width-fix/services-1245-desktop.png`.

## 2026-06-09 — services starting-point grid padding fix

User marked the lower Services page starting-point card grid and noted that the internal cards were pressed against the container edges.

Outcome:

- added Services-specific padding to `.ay-services-editorial > .ay-grid.two` so the lower cards align optically with the upper service-card grid;
- bumped the WordPress child theme version to `1.5.11` for CSS cache-busting;
- deployed the updated `style.css` to the VPS and cleared WordPress/cache-enabler cache.

Verification:

- live `/services/?qa=services-grid-padding-fix` loads `style.css?ver=1.5.11`;
- desktop lower grid padding is 74px left/right and 58px bottom;
- mobile lower grid padding is 20px left/right, one column;
- no horizontal overflow and no browser console errors;
- screenshot evidence: `output/evidence/services-grid-padding-fix/services-1245-desktop.png`.

## 2026-06-09 — audit form UX restore

User marked the AI Visibility Roadmap form and reported that the previous comfortable form UX had regressed: checkboxes looked huge, required/optional status was unclear, and the small hover information blocks were missing.

Outcome:

- reduced required audit-form fields to the real minimum: website URL, name, work email, and consent;
- restored `Required` / `Optional` badges beside field labels;
- restored small `i` hover/focus tooltips using the existing `.ay-info` / `.ay-tooltip` CSS system;
- restored visible helper text for fields and sections;
- added `.ay-check-option` markup so checkbox inputs render as 18px controls instead of inheriting text-input sizing;
- changed optional readiness selects to start from neutral values like `Not sure`;
- bumped the WordPress child theme version to `1.5.12` for CSS cache-busting;
- deployed updated `functions.php` and `style.css` to the VPS and cleared WordPress/cache-enabler cache.

Verification:

- live `/ai-visibility-audit/?qa=audit-form-ux-restore` loads `style.css?ver=1.5.12`;
- PHP lint passed locally and on the VPS;
- required fields verified: `ay_website`, `ay_name`, `ay_email`, `ay_consent`;
- live form has 18 optional badges, 4 required badges, 20 info icons, 14 helper text blocks;
- checkbox controls render at 18x18px;
- tooltip visibility verified on hover;
- desktop/mobile Playwright checks: no horizontal overflow and no console errors;
- screenshot evidence:
  - `output/evidence/audit-form-ux-restore/audit-form-desktop.png`
  - `output/evidence/audit-form-ux-restore/audit-form-mobile.png`

## 2026-06-09 — About hero, sticky header, and Base2026 navigation

User requested:

- make About top hero use the same orange Contact-style banner pattern;
- constrain the Contact/About Alex cutout so it stays inside the hero card and attaches to the bottom;
- keep sticky header readable after scroll and make it more compact/smoother;
- add clear breadcrumbs/internal navigation for Base2026 pages such as Creators, Topics, Roadmap and Support.

Outcome:

- updated WordPress child theme CSS to `1.5.13`;
- replaced About hero content via WP API after backing up current theme/About content on VPS;
- fixed Contact/About hero image sizing and mobile constraints;
- kept sticky header compact with readable dark glass scrolled state;
- added generated Base2026 project nav and breadcrumbs to `scripts/generate-info-pages.py` and `scripts/generate-public-pages.py`;
- added the same nav/breadcrumb shell to `web/static/meili.html`;
- bumped Base2026 cache bust to `20260609-ay17`;
- deployed release `base2026-site-nav-ay17-20260609` and reindexed Meilisearch.

Verification:

- live `/about/` has `ay-about-contact-hero` and CSS `1.5.13`;
- live `/contact/` and `/about/` hero cutouts are contained and bottom-attached in checked desktop geometry;
- live scrolled header has fixed dark glass row, white nav links, compact CTA, and about 62px header row height;
- live `/knowledge/?q=ChatGPT` renders 20 results with project nav and breadcrumb;
- live `/knowledge/creators/` has active `Creators` project nav, breadcrumb, and 4 creator cards;
- `python -m py_compile scripts/generate-info-pages.py scripts/generate-public-pages.py` passed;
- deploy script passed with 957 documents, 1392 passages, 1040 public topics, 46 indexable topics.

Evidence:

- `output/evidence/about-desktop-ay17.png`
- `output/evidence/contact-desktop-ay17.png`
- `output/evidence/knowledge-search-desktop-ay17.png`
- `output/evidence/knowledge-creators-desktop-ay17.png`
- `output/evidence/about-mobile-ay17.png`

Note:

- The first PowerShell regex attempt to update About timed out and temporarily emptied the page content. The saved backup was used immediately, and About was restored/updated through a simpler positional replacement. Backup path: `/root/backups/base2026-ui-pass-20260609/about-before-1.5.13.html`.

## 2026-06-09 — ay18 UI pass: About/contact balance, Base2026 dropdown, search attribution

User requested:

- make the Alex cutout balanced between About being too small and Contact being too large;
- remove the small `01` / `02` markers from the About method cards and make that block feel closer to the Services design language;
- remove/rethink the duplicated Base2026 navigation strip under the main header;
- make active Base2026 page buttons clear;
- improve search result creator/platform attribution and support real creator avatars where possible.

Outcome:

- deployed WordPress child theme CSS `1.5.14`;
- deployed Base2026 release `base2026-nav-dropdown-ay18-20260609`;
- replaced the second Base2026 nav strip with a main-header dropdown generated from the shared static-page templates;
- set active hero actions on Search, Roadmap, and Support;
- changed result metadata to show one creator line plus a cleaner TikTok platform badge;
- added `avatar_url` / `creator_display_name` support to the public export and result-card UI, with fallback initials when current source data has no real avatar URL;
- verified TikTok profile oEmbed does not provide avatar URLs, and `yt-dlp` profile metadata provides video thumbnails rather than reliable creator avatars.

Verification:

- `python -m py_compile scripts/export-public-tiktok.py scripts/generate-info-pages.py scripts/generate-public-pages.py` passed;
- `node --check web/static/meili.js` passed;
- Meilisearch reindex completed with 1392 passages;
- live `/knowledge/?q=AI Overviews` renders 20 cards, 20 platform badges, no duplicate handle metadata line;
- live Base2026 generated pages have no `base-project-nav` in checked pages and use CSS `20260609-ay18`;
- live About/Contact hero geometry: cutout 446x403 in desktop QA, bottom delta 1px, head/right edge inside hero;
- live About method: 2 panels, no visible numeric spans, 24px radius, no horizontal overflow;
- desktop and mobile Playwright checks: no console errors and no horizontal overflow.

Evidence:

- `output/evidence/ay18-ui-pass/about-desktop.png`
- `output/evidence/ay18-ui-pass/contact-desktop.png`
- `output/evidence/ay18-ui-pass/knowledge-desktop.png`
- `output/evidence/ay18-ui-pass/support-desktop.png`
- `output/evidence/ay18-ui-pass/about-method-desktop.png`
- `output/evidence/ay18-ui-pass/knowledge-dropdown-desktop.png`
- `output/evidence/ay18-ui-pass/about-mobile.png`
- `output/evidence/ay18-ui-pass/knowledge-mobile.png`

## 2026-06-09 — ay20 Roadmap, TikTok avatars, and Base2026 SEO readiness

User requested:

- reduce heavy Roadmap phase typography;
- remove duplicate phase naming in Roadmap Flow;
- make `What this roadmap proves` readable instead of one dense paragraph;
- replace fake TikTok badges with an official-style TikTok SVG mark;
- use real TikTok creator avatars wherever author attribution appears;
- run SEO readiness and use a rational free plugin choice.

Outcome:

- deployed `base2026-roadmap-tiktok-seo-ay20-20260609`;
- kept Rank Math as the active SEO plugin and did not install Yoast on top;
- added stable local creator avatar assets for all 4 creators;
- added `scripts/fetch-tiktok-avatars.py`;
- added `scripts/generate-base2026-sitemap.py`;
- added Base2026 metadata, canonicals, robots directives, Open Graph, and schema;
- deployed `/knowledge/sitemap.xml` and added it to WordPress `robots.txt`.

Verification:

- live `/knowledge/roadmap.html?qa=ay20-final`: 6 phase tabs, 6 flow nodes, 3 proof cards, no duplicate flow short labels, overflow false;
- live `/knowledge/?q=AI Overviews&qa=ay20-final`: 20 results, 20 real avatars, 20 TikTok SVG marks, fake marks 0, overflow false;
- live `/knowledge/sitemap.xml`: 1066 URLs;
- live `/robots.txt`: Base2026 sitemap present;
- live SEO sample pages have description, canonical, `index,follow`, one H1, and schema.

## 2026-06-09 — ay21 Source modal polish

User requested:

- move source modal action buttons from the body up near the title/Close area;
- make modal actions visually clearer with better hover styling;
- add creator avatar and TikTok source badge in the modal header;
- make platform caption preview feel clearer and more clickable.

Outcome:

- deployed `base2026-source-modal-ay21-20260609`;
- modal header now includes creator avatar, handle/date, TikTok source badge, action buttons, and Close;
- modal body starts with policy/platform/language cards and evidence text, not action buttons.

Verification:

- live `/knowledge/?q=AI Overviews&qa=ay21-final`: source modal opened with 3 header actions, 0 body action rows, 1 loaded avatar, 1 TikTok SVG, caption preview present, overflow false, console errors 0.

## 2026-06-09 — ay22 Source modal premium pass

User requested:

- improve source modal navigation and mobile behavior;
- remove the TikTok oval/pill in modal attribution;
- keep creator avatar, handle/date, and TikTok logo in one clean attribution line;
- avoid duplicated creator/source-title text;
- add small info hints explaining public policy, platform, evidence excerpt, and platform caption metadata.

Outcome:

- deployed `base2026-source-modal-premium-ay22-20260609`;
- modal title is now `Source record`;
- modal attribution line uses creator avatar + handle/date + bare TikTok SVG;
- record policy cards include info hints and platform logo;
- caption preview has an info hint and clearer disclosure styling.

Verification:

- live desktop/mobile `/knowledge/?q=AI Overviews&qa=ay22`: header actions 3, body action rows 0, avatar 1, inline TikTok logo 1, attribution pills 0, info hints 5, policy cards 3, caption preview present, overflow false, console errors 0.

## 2026-06-09 — Queued result-card attribution polish

User requested a follow-up UI task for search result cards:

- align creator avatar, creator handle/date, and TikTok logo in one clean line;
- remove the oval/pill wrapper around the TikTok logo;
- make the result card/excerpt block feel more polished and production-ready while staying readable.

Status: queued in `NEXT_ACTION.md` parallel backlog. Not implemented in this pass.

## 2026-06-09 — ay23 Source page explainers and TikTok automation truth

User requested:

- make static source pages less confusing;
- highlight the full-transcript publication boundary note;
- explain `Public Evidence Excerpt`, `Related Passages`, and `Public Insight Cards`;
- investigate why a sample source page has no public insight cards;
- explain whether new TikToks are currently added automatically.

Outcome:

- deployed `base2026-source-page-explainers-ay23-20260609`;
- added accessible info hints and a highlighted policy note to generated source pages;
- changed related passage copy to explain that public snippets can be shortened;
- changed empty insight-card copy to explain that no reviewed card is linked yet;
- verified the sample source has 1 related passage and 0 insight cards in data;
- verified `Base2026 Hermes TikTok Check` is check-only and not a full auto-import/deploy pipeline.

Verification:

- live desktop/mobile `/knowledge/sources/tiktok-video-7647909694559767840.html?qa=ay23`: CSS ay23, 3 info hints, policy note, related helper, empty insight explanation, no overflow, no console errors.

## 2026-06-09 — Pipeline inventory and insight-card gap diagnosis

User asked why public insight cards are empty and requested a full MD inventory of the Base2026 pipeline for GPT Pro review.

Outcome:

- created `docs/project-memory/BASE2026_PIPELINE_INVENTORY_2026_06_09.md`;
- verified that empty cards are not a source-page rendering bug;
- diagnosed a real claim-extraction/backfill gap: public pages can have passages while no `claims` / `claim_evidence` rows exist for that source;
- counted 170 sources with passages but no insight cards as the immediate backfill target;
- documented the target local-worker pipeline: inventory, captions/ASR, faithful cleanup, claim extraction, evidence matching, public export, Meili reindex, deploy gate.

Key finding:

- Insight cards are generated from SQLite `claims` + `claim_evidence`, not directly from passages. If claim extraction did not run for a transcript, the source page will have no cards even when a useful passage exists.

## 2026-06-09 — Controller, model routing, and private insight-card backfill queue

User provided a strict task to harden the current Base2026 pipeline without redesign, deployment, GitHub push, public promotion, or paid/batch LLM extraction.

Files created:

- `docs/project-memory/MODEL_ROUTING.md`
- `docs/project-memory/PIPELINE_STATUS.md`
- `docs/project-memory/DATA_QUALITY_REPORT.md`
- `docs/project-memory/ACTIVE_QUEUE.md`
- `docs/project-memory/DO_NOT_DO.md`
- `docs/project-memory/OWNER_DECISIONS.md`
- `docs/project-memory/PIPELINE_CONTROLLER_RUNBOOK.md`
- `docs/project-memory/BACKFILL_INSIGHT_CARDS_RUNBOOK.md`
- `scripts/base2026-build-backfill-queue.py`
- `scripts/base2026-evidence-verify.py`
- `scripts/base2026-claim-extract-local.py`
- `scripts/base2026-controller.py`
- `scripts/base2026-daily-digest.py`

Files updated:

- `docs/project-memory/NEXT_ACTION.md`
- `docs/project-memory/PROMPT_LOG.md`
- `docs/project-memory/PIPELINE_STATUS.md`
- `docs/project-memory/DATA_QUALITY_REPORT.md`
- `docs/project-memory/ACTIVE_QUEUE.md`

Commands run:

- `python -m py_compile scripts\base2026-build-backfill-queue.py scripts\base2026-evidence-verify.py scripts\base2026-claim-extract-local.py scripts\base2026-controller.py scripts\base2026-daily-digest.py`
- `python scripts\check-public-export-policy.py public-data\tiktok`
- `python scripts\base2026-build-backfill-queue.py --dry-run`
- `python scripts\base2026-controller.py build-backfill-queue --write`
- `python scripts\base2026-controller.py doctor`
- `python scripts\base2026-controller.py run-claim-extract-sample --limit 10`
- `python scripts\base2026-controller.py public-boundary-audit`
- `python scripts\base2026-controller.py verify-evidence`
- `python scripts\base2026-controller.py status`
- `python scripts\base2026-controller.py daily-digest`
- `python scripts\audit-publication-boundary.py`

Result:

- private backfill queue written to `.planning/backfill-insight-cards-20260609.jsonl`;
- queued sources: 170;
- local model endpoint: unavailable;
- paid API fallback: not used;
- candidates written: 0;
- evidence verifier ran against empty candidates and passed with zero matches/rejections;
- public export policy passed;
- publication boundary audit passed with `needs_review=0`, `forbidden=0`, `secret_findings=0`;
- daily digest written to `.planning/digests/base2026-digest-20260609.md`;
- no deploy, no GitHub staging/push, no public promotion, no new creators.

Unresolved:

- owner must configure/approve a local LLM endpoint/model before running a real 10-source private extraction sample with `--execute`.

## 2026-06-10 — MacBook Git branch and publication-staging validation

User asked whether migrated skills were available, whether Codex needed a restart, and what to do about the dirty Git state after migrating from Windows to MacBook.

Outcome:

- confirmed `~/.codex/skills`, `~/.agents/skills`, and `~/.codex/memory/global-hot-cache.md` are present and visible in the current Codex session;
- confirmed no Codex restart is needed for the currently listed skills;
- renamed the local branch from `codex/knowledge-ui-shell` to `codex/github-publication-staging`;
- installed stable PowerShell via Homebrew formula `powershell` 7.6.2;
- verified Meilisearch was already installed earlier in the MacBook activation pass;
- patched `scripts/stage-public-files.ps1` and `scripts/preflight-github-launch.ps1` so MacBook runs can use `python3`, POSIX-safe paths, and `pwsh`;
- added the 10 public-safe files discovered by dry-run audit to the staging allowlist;
- updated publication boundary docs to explicitly allow `config/creator-profiles.json`;
- corrected `docs/project-memory/DEPLOYMENT_RUNBOOK.md` so the latest deployed release is ay23, not ay16.

Verification:

- `python3 scripts/audit-publication-boundary.py` passed with `changed_files=3168`, `public_safe_candidates=3168`, `needs_review=0`, `forbidden=0`, `secret_findings=0`;
- `python3 scripts/validate-github-metadata.py` passed;
- `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/preflight-github-launch.ps1 -SkipRemoteCheck -SkipExportPolicy -SkipLiveCheck` passed;
- `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/stage-public-files.ps1 -SkipPreflight -SkipLicenseCheck -SkipRemoteCheck` passed with `stage_path_count=57`;
- `git diff --cached --name-only` was empty after the dry-run.

Pipeline clarification:

- project files already document the intended local-first pipeline: inventory/dedupe, caption metadata extraction, ASR fallback, faithful cleanup, claim/insight extraction, evidence verification, public export, Meilisearch reindex, package/deploy gate;
- current automation is not a finished pipeline yet: the Windows Hermes task was check-only and did not import, polish, extract claims, package, or deploy;
- next pipeline engineering work is separate from GitHub publication staging and should begin with local LLM endpoint approval plus a private 10-source claim extraction sample.

## 2026-06-10 — Local worker environment and private insight-card backfill pilot

User clarified that the Windows PC had a planned but unfinished pipeline, and that the MacBook migration is meant to continue building a production-ready local-first automation system rather than rushing GitHub publication.

Files created:

- `requirements-local-worker.txt`
- `scripts/base2026-import-claim-candidates.py`

Files updated:

- `scripts/base2026-worker.py`
- `scripts/base2026-controller.py`
- `scripts/base2026-evidence-verify.py`
- `scripts/export-public-tiktok.py`
- `scripts/audit-publication-boundary.py`
- `scripts/preflight-github-launch.ps1`
- `scripts/stage-public-files.ps1`
- project memory/publication docs

Environment changes:

- created `.venv`;
- installed `faster-whisper`, `ctranslate2`, and `requests` into `.venv`;
- started Ollama via Homebrew service;
- pulled `qwen3:8b`;
- existing Ollama models also present: `qwen3.5:9b`, `gemma3:4b`, `llava:latest`.

Pipeline fixes:

- `base2026-worker.py doctor` is now Mac-aware and reports current Python executable, required tools, ASR modules, optional tools, and local LLM env;
- controller now supports `--model` for claim extraction;
- controller run IDs now include microseconds to avoid run-folder collisions;
- controller JSON parsing is more robust;
- evidence verifier can write verified JSONL output;
- verified claim candidates can now be imported to SQLite as private/pending `insight_card_candidate` claims;
- export excludes `insight_card_candidate` from auto-promotion even when `--auto-promote-insights` is enabled.

Commands run:

- `.venv/bin/python scripts/base2026-worker.py doctor`
- `.venv/bin/python scripts/base2026-controller.py build-backfill-queue --write`
- `.venv/bin/python scripts/base2026-controller.py run-claim-extract-sample --queue .planning/backfill-insight-cards-20260610.jsonl --limit 3 --execute --model qwen3:8b`
- `.venv/bin/python scripts/base2026-controller.py verify-evidence --input .planning/claim-candidates-20260610.jsonl --output .planning/claim-candidates-20260610.verified.jsonl`
- `.venv/bin/python scripts/base2026-controller.py import-claim-candidates --input .planning/claim-candidates-20260610.verified.jsonl --apply`
- `.venv/bin/python scripts/base2026-claim-extract-local.py --queue .planning/backfill-insight-cards-20260610.jsonl --limit 1 --execute --model gemma3:4b --out .planning/claim-candidates-20260610-gemma3-4b.jsonl --report .planning/claim-candidates-20260610-gemma3-4b.report.md`
- `.venv/bin/python scripts/base2026-evidence-verify.py --input .planning/claim-candidates-20260610-gemma3-4b.jsonl --output .planning/claim-candidates-20260610-gemma3-4b.verified.jsonl`
- `.venv/bin/python scripts/base2026-controller.py import-claim-candidates --input .planning/claim-candidates-20260610-gemma3-4b.verified.jsonl --apply`
- `.venv/bin/python scripts/export-public-tiktok.py --auto-promote-insights --insight-threshold 0.45`
- `.venv/bin/python scripts/check-public-export-policy.py public-data/tiktok`

Results:

- `qwen3:8b`: 3 sources, 11 candidates, 9 verified, 9 imported private/pending, average 39.007 seconds/source;
- `gemma3:4b`: 1 source, 1 candidate, 1 exact verified, 1 imported private/pending, average 9.720 seconds/source;
- local SQLite now has 10 `claim-backfill-*` pending claims and 10 matching evidence rows;
- local public export now has 1548 insight cards, 1097 public insight cards, 1449 topics, 1040 public topics;
- backfill queue decreased from 170 to 166 sources;
- public policy check passed;
- new backfill cards are not public.

## 2026-06-10 — Gemma 4 install and same-queue model routing test

User asked to install `gemma4:12b`, test it for the unfinished insight-card backfill, and keep it as the main model only if it actually works for this project.

Environment changes:

- upgraded Ollama to 0.30.7 earlier, then pulled `gemma4:12b`;
- Homebrew formula `ollama` 0.30.7 could list models but failed inference because the bottle lacked `llama-server`;
- installed `ollama-app` cask 0.30.7;
- removed the broken Homebrew formula so the cask owns `/opt/homebrew/bin/ollama`;
- copied `/Applications/Ollama.app/Contents/Resources/` to `/Users/alexyarosh/.local/ollama-app-resources/` because the app bundle kept `com.apple.quarantine` xattrs that could not be removed without elevated macOS permissions;
- started the working server with `/Users/alexyarosh/.local/ollama-app-resources/ollama serve`; after the benchmark, moved it into detached `screen` session `base2026-ollama`.

Commands run:

- `ollama pull gemma4:12b`
- `brew reinstall ollama`
- `brew install --cask ollama --force`
- `brew services stop ollama`
- `brew uninstall --formula ollama`
- `brew reinstall --cask ollama --force`
- `rsync -a --delete /Applications/Ollama.app/Contents/Resources/ /Users/alexyarosh/.local/ollama-app-resources/`
- `/Users/alexyarosh/.local/ollama-app-resources/ollama serve`
- direct `/api/generate` Gemma 4 JSON smoke test
- `.venv/bin/python scripts/base2026-claim-extract-local.py --queue .planning/backfill-insight-cards-20260610.jsonl --limit 3 --execute --model gemma4:12b --out .planning/claim-candidates-20260610-gemma4-12b.jsonl --report .planning/claim-candidates-20260610-gemma4-12b.report.md`
- `.venv/bin/python scripts/base2026-evidence-verify.py --input .planning/claim-candidates-20260610-gemma4-12b.jsonl --output .planning/claim-candidates-20260610-gemma4-12b.verified.jsonl`
- `.venv/bin/python scripts/base2026-claim-extract-local.py --queue .planning/backfill-insight-cards-20260610.jsonl --limit 3 --execute --model qwen3:8b --out .planning/claim-candidates-20260610-current-qwen3-8b.jsonl --report .planning/claim-candidates-20260610-current-qwen3-8b.report.md`
- `.venv/bin/python scripts/base2026-evidence-verify.py --input .planning/claim-candidates-20260610-current-qwen3-8b.jsonl --output .planning/claim-candidates-20260610-current-qwen3-8b.verified.jsonl`

Results on the same current first 3 queue rows:

- `gemma4:12b`: 3 sources, 1 candidate, 1 verified, 49.870 seconds/source, 0 errors;
- `qwen3:8b`: 3 sources, 5 candidates, 5 verified, 33.972 seconds/source, 0 errors.

Decision:

- do not set `gemma4:12b` as primary claim extractor yet;
- keep `qwen3:8b` as primary extractor for the next controlled private batch;
- test `gemma4:12b` as a semantic-review/precision gate before importing a broader batch;
- no deployment, git staging, commit, push, or public promotion was performed.

## 2026-06-10 — ChatGPT Pro manual review lane for insight-card quality

User challenged whether `qwen3:8b` quality is actually good enough for public-facing card text, and suggested using ChatGPT Pro/GPT-5.4 through the browser for small batches because quality matters more than throughput.

Engineering response:

- agreed that deterministic evidence matching proves only substring presence, not semantic entailment or good writing;
- kept `qwen3:8b` as a candidate generator, not a trusted final writer;
- did not make browser ChatGPT a production worker or limit-bypass architecture;
- added a manual GPT review lane that works from generated packets and returns strict JSON for local validation.

Files created:

- `scripts/base2026-build-chatgpt-review-packet.py`
- `scripts/base2026-apply-chatgpt-review.py`
- `docs/project-memory/GPT_PRO_REVIEW_RUNBOOK.md`

Files updated:

- `scripts/base2026-controller.py`
- `scripts/audit-publication-boundary.py`
- `docs/project-memory/ACTIVE_PHASE.md`
- `docs/project-memory/BACKFILL_INSIGHT_CARDS_RUNBOOK.md`
- `docs/project-memory/DECISIONS.md`
- `docs/project-memory/MODEL_ROUTING.md`
- `docs/project-memory/NEXT_ACTION.md`
- `docs/project-memory/PIPELINE_STATUS.md`
- `docs/project-memory/STATUS_BOARD.csv`

Pipeline behavior added:

- `build-chatgpt-review-packet` creates bounded Markdown/JSON packets from public passages and private pending candidates;
- manual ChatGPT review can approve, rewrite, reject, mark needs_human, or add at most one supported missed claim per source;
- `apply-chatgpt-review` converts only approve/rewrite/new_candidate decisions back to private candidate JSONL;
- deterministic evidence verification must run again after review and before import;
- reviewed candidates remain private/pending and cannot publish directly.

Commands run:

- `.venv/bin/python -m py_compile scripts/base2026-build-chatgpt-review-packet.py scripts/base2026-apply-chatgpt-review.py scripts/base2026-controller.py`
- `.venv/bin/python scripts/base2026-controller.py doctor`
- `.venv/bin/python scripts/base2026-controller.py build-chatgpt-review-packet --queue .planning/backfill-insight-cards-20260610.jsonl --candidates .planning/claim-candidates-20260610-current-qwen3-8b.verified.jsonl --limit 3 --out-md .planning/chatgpt-review-packet-20260610-current-qwen3-8b.md --out-json .planning/chatgpt-review-packet-20260610-current-qwen3-8b.json`
- `.venv/bin/python scripts/base2026-apply-chatgpt-review.py --packet .planning/chatgpt-review-packet-20260610-current-qwen3-8b.json --review <empty synthetic review via /dev/fd> --out /tmp/base2026-empty-chatgpt-reviewed.jsonl --report /tmp/base2026-empty-chatgpt-reviewed.report.json`
- `.venv/bin/python scripts/base2026-apply-chatgpt-review.py --packet .planning/chatgpt-review-packet-20260610-current-qwen3-8b.json --review <one synthetic approve decision via /dev/fd> --out /tmp/base2026-one-approved-chatgpt-reviewed.jsonl --report /tmp/base2026-one-approved-chatgpt-reviewed.report.json`
- `python3 scripts/audit-publication-boundary.py`
- `python3 scripts/validate-github-metadata.py`
- `.venv/bin/python scripts/base2026-controller.py status`

Results:

- generated `.planning/chatgpt-review-packet-20260610-current-qwen3-8b.md`;
- generated `.planning/chatgpt-review-packet-20260610-current-qwen3-8b.json`;
- packet contains 3 sources, 5 candidates, and 5 public passages;
- apply script accepted a matching empty synthetic review and wrote 0 rows to `/tmp`, proving the response path starts correctly;
- apply script accepted one synthetic approval for a real packet candidate and wrote 1 row to `/tmp` with evidence present;
- one Qwen candidate visibly mismatches semantics: claim about longer AI queries used evidence about fewer clicks/relying on impressions, proving exact evidence matching alone is insufficient;
- `git diff --check` passed after removing one trailing whitespace issue in `README.md`;
- publication boundary audit passed with `changed_files=3171`, `public_safe_candidates=3171`, `needs_review=0`, `forbidden=0`, `secret_findings=0`;
- GitHub metadata validation passed.

Forbidden actions still in force:

- no TikTok intake;
- no ASR batch;
- no deployment;
- no staging, commit, push, or public promotion;
- no raw captions, full private transcripts, DB files, media, logs, cookies, tokens, or credentials in ChatGPT packets.

## 2026-06-10 — GPT/Codex becomes primary small-batch card quality lane

User clarified that Base2026 has low expected volume now, a ChatGPT Pro subscription is available, and public-facing card text quality matters more than forcing Qwen/Gemma into the center of the workflow.

Engineering response:

- agreed that GPT-5.4 high/Codex is the right primary lane for small-batch claim extraction and semantic/copy review;
- moved `qwen3:8b` to optional local draft/prefilter/offline mode;
- kept deterministic scripts as the durable pipeline: queue -> packet -> strict JSON -> apply -> evidence verify -> private import;
- kept Hermes as a local operator that may orchestrate scripts, not a production dependency or hidden browser worker.

Files updated:

- `scripts/base2026-build-chatgpt-review-packet.py`
- `scripts/base2026-controller.py`
- `docs/project-memory/ACTIVE_PHASE.md`
- `docs/project-memory/BACKFILL_INSIGHT_CARDS_RUNBOOK.md`
- `docs/project-memory/DECISIONS.md`
- `docs/project-memory/DO_NOT_DO.md`
- `docs/project-memory/GPT_PRO_REVIEW_RUNBOOK.md`
- `docs/project-memory/HERMES_LOCAL_OPERATOR_GUIDE.md`
- `docs/project-memory/HERMES_RUNBOOK.md`
- `docs/project-memory/MODEL_ROUTING.md`
- `docs/project-memory/NEXT_ACTION.md`
- `docs/project-memory/PIPELINE_STATUS.md`
- `docs/project-memory/STATUS_BOARD.csv`

Pipeline behavior added:

- `scripts/base2026-build-chatgpt-review-packet.py` now supports `--mode extract` with no local candidate file;
- source-only packets ask GPT/Codex to return `new_candidate` decisions from public passages;
- review packets with Qwen candidates still work for optional local draft review;
- `scripts/base2026-apply-chatgpt-review.py` already accepts `new_candidate` decisions and re-checks exact/normalized evidence presence against the packet passages.

Commands run:

- `.venv/bin/python -m py_compile scripts/base2026-build-chatgpt-review-packet.py scripts/base2026-apply-chatgpt-review.py scripts/base2026-controller.py`
- `.venv/bin/python scripts/base2026-controller.py build-chatgpt-review-packet --queue .planning/backfill-insight-cards-20260610.jsonl --mode extract --limit 3 --out-md .planning/chatgpt-extract-packet-20260610-source-only.md --out-json .planning/chatgpt-extract-packet-20260610-source-only.json`
- `.venv/bin/python scripts/base2026-apply-chatgpt-review.py --packet .planning/chatgpt-extract-packet-20260610-source-only.json --review <one synthetic new_candidate via /dev/fd> --out /tmp/base2026-source-only-gpt-reviewed.jsonl --report /tmp/base2026-source-only-gpt-reviewed.report.json`
- `.venv/bin/python scripts/base2026-evidence-verify.py --input /tmp/base2026-source-only-gpt-reviewed.jsonl --output /tmp/base2026-source-only-gpt-reviewed.verified.jsonl`
- `.venv/bin/python scripts/base2026-controller.py apply-chatgpt-review --packet .planning/chatgpt-extract-packet-20260610-source-only.json --review .planning/chatgpt-extract-response-20260610-source-only.codex.json --out .planning/claim-candidates-20260610-source-only-codex.jsonl`
- `.venv/bin/python scripts/base2026-controller.py verify-evidence --input .planning/claim-candidates-20260610-source-only-codex.jsonl --output .planning/claim-candidates-20260610-source-only-codex.verified.jsonl`
- `.venv/bin/python scripts/base2026-controller.py import-claim-candidates --input .planning/claim-candidates-20260610-source-only-codex.verified.jsonl`
- `.venv/bin/python scripts/base2026-controller.py import-claim-candidates --input .planning/claim-candidates-20260610-source-only-codex.verified.jsonl --apply`
- `.venv/bin/python scripts/export-public-tiktok.py --auto-promote-insights --insight-threshold 0.45`
- `.venv/bin/python scripts/check-public-export-policy.py public-data/tiktok`

Results:

- generated `.planning/chatgpt-extract-packet-20260610-source-only.md`;
- generated `.planning/chatgpt-extract-packet-20260610-source-only.json`;
- packet contains 3 sources, 0 local candidates, and 5 public passages;
- synthetic source-only `new_candidate` apply test wrote 1 private candidate row to `/tmp`;
- deterministic evidence verification over that row passed with 1 exact match and 1 verified candidate.
- Codex processed the real 3-source source-only packet and wrote `.planning/chatgpt-extract-response-20260610-source-only.codex.json`;
- apply step wrote 8 private candidate rows;
- evidence verification passed with 8 exact matches, 8 verified, 0 rejected;
- dry-run import selected 8, with 0 duplicates and 0 missing videos;
- apply import inserted 8 claims and 8 evidence rows as `review_status = pending`;
- SQLite backup created: `12_knowledge-base/indexes/kb.sqlite.bak-claim-import-20260610-030928`;
- local SQLite now has 18 pending `insight_card_candidate` claims;
- local export now has 957 source records, 1392 passages, 1556 insight cards, 1455 topics, 4 creators;
- public insight cards remain 1097 and public backfill candidates remain 0;
- policy check passed.

## 2026-06-10 — Controlled 10-source GPT/Codex source-only batch

User pushed to move faster on the working pipeline. Continued the GPT/Codex source-only path with guardrails instead of running unbounded extraction.

Files updated:

- `scripts/base2026-apply-chatgpt-review.py`
- `scripts/base2026-build-chatgpt-review-packet.py`
- `scripts/base2026-controller.py`
- `docs/project-memory/DATA_SOURCES.md`
- `docs/project-memory/NEXT_ACTION.md`
- `docs/project-memory/PIPELINE_STATUS.md`
- `docs/project-memory/PROJECT_STATE.md`
- `docs/project-memory/STATUS_BOARD.csv`

Guardrails added:

- `apply-chatgpt-review` now enforces minimum `quality_score` default 4;
- maximum 3 new candidates per source;
- maximum claim/action/evidence length limits;
- stats now report low-quality, too-long, and too-many-new-candidate skips;
- packet builder now includes a reviewer checklist in generated Markdown.

Commands run:

- `.venv/bin/python -m py_compile scripts/base2026-build-chatgpt-review-packet.py scripts/base2026-apply-chatgpt-review.py scripts/base2026-controller.py`
- `.venv/bin/python scripts/base2026-controller.py build-backfill-queue --write`
- `.venv/bin/python scripts/base2026-controller.py build-chatgpt-review-packet --queue .planning/backfill-insight-cards-20260610.jsonl --mode extract --limit 10 --out-md .planning/chatgpt-extract-packet-20260610-source-only-10.md --out-json .planning/chatgpt-extract-packet-20260610-source-only-10.json`
- `.venv/bin/python scripts/base2026-controller.py apply-chatgpt-review --packet .planning/chatgpt-extract-packet-20260610-source-only-10.json --review .planning/chatgpt-extract-response-20260610-source-only-10.codex.json --out .planning/claim-candidates-20260610-source-only-10-codex.jsonl`
- `.venv/bin/python scripts/base2026-controller.py verify-evidence --input .planning/claim-candidates-20260610-source-only-10-codex.jsonl --output .planning/claim-candidates-20260610-source-only-10-codex.verified.jsonl`
- `.venv/bin/python scripts/base2026-controller.py import-claim-candidates --input .planning/claim-candidates-20260610-source-only-10-codex.verified.jsonl`
- `.venv/bin/python scripts/base2026-controller.py import-claim-candidates --input .planning/claim-candidates-20260610-source-only-10-codex.verified.jsonl --apply`
- `.venv/bin/python scripts/export-public-tiktok.py --auto-promote-insights --insight-threshold 0.45`
- `.venv/bin/python scripts/base2026-controller.py build-backfill-queue --write`
- `.venv/bin/python scripts/check-public-export-policy.py public-data/tiktok`
- `.venv/bin/python scripts/base2026-controller.py status`

Results:

- generated `.planning/chatgpt-extract-packet-20260610-source-only-10.md`;
- generated `.planning/chatgpt-extract-packet-20260610-source-only-10.json`;
- Codex wrote `.planning/chatgpt-extract-response-20260610-source-only-10.codex.json`;
- apply guardrails accepted 20/20 decisions and skipped 0;
- evidence verification passed with 20 exact matches, 20 verified, 0 rejected;
- dry-run import selected 20, with 0 duplicates and 0 missing videos;
- apply import inserted 20 claims and 20 evidence rows as `review_status = pending`;
- SQLite backup created: `12_knowledge-base/indexes/kb.sqlite.bak-claim-import-20260610-033846`;
- local SQLite now has 38 pending `insight_card_candidate` claims and 38 matching evidence rows;
- local export now has 957 source records, 1392 passages, 1576 insight cards, 1472 topics, 4 creators;
- public insight cards remain 1097 and public backfill candidates remain 0;
- backfill queue estimate is now 153.

Next engineering stop:

- do not keep importing batches blindly;
- add promotion review/report for the 38 private/pending candidates before any public promotion.

## 2026-06-10 — Pending insight-card promotion review report

User approved continuing with the promotion review gate.

Files created:

- `scripts/base2026-review-insight-candidates.py`

Files updated:

- `scripts/base2026-controller.py`
- `scripts/audit-publication-boundary.py`
- `docs/project-memory/BACKFILL_INSIGHT_CARDS_RUNBOOK.md`
- `docs/project-memory/DECISIONS.md`
- `docs/project-memory/NEXT_ACTION.md`
- `docs/project-memory/PIPELINE_STATUS.md`
- `docs/project-memory/PROMPT_LOG.md`
- `docs/project-memory/STATUS_BOARD.csv`

Behavior added:

- controller command `review-insight-candidates`;
- read-only promotion review over pending `insight_card_candidate` rows;
- evidence exact/normalized check against public passages;
- source record check;
- text/action/evidence length checks;
- generic action warning;
- max promotion candidates per source default 2;
- report output to Markdown and JSON under `.planning/`.

Commands run:

- `.venv/bin/python -m py_compile scripts/base2026-review-insight-candidates.py scripts/base2026-controller.py scripts/audit-publication-boundary.py`
- `.venv/bin/python scripts/base2026-controller.py doctor`
- `.venv/bin/python scripts/base2026-controller.py review-insight-candidates --status pending --out-json .planning/pending-insight-candidate-review-20260610.json --out-md .planning/pending-insight-candidate-review-20260610.md`

Results:

- generated `.planning/pending-insight-candidate-review-20260610.json`;
- generated `.planning/pending-insight-candidate-review-20260610.md`;
- reviewed 38 pending candidates across 17 sources;
- 38 exact evidence matches;
- 0 hard failures;
- 32 `promotion_candidate`;
- 6 `needs_human`;
- 0 `reject_candidate`;
- warnings: 5 `over_source_promotion_limit`, 1 `generic_action_language`;
- no SQLite writes and no public promotion performed.

## 2026-06-10 — Full insight-card backfill, release package, deploy blocker

User requested all current videos/cards processed and deployed.

Actions taken:

- Promoted previously reviewed safe pending candidates.
- Ran GPT/Codex source-only extraction batches `01` through `09` over all sources with public passages and no insight cards.
- Applied guardrails, deterministic evidence verification, import, review, and explicit promotion after each batch.
- Added `scripts/base2026-promote-insight-candidates.py` and controller integration for explicit reviewed promotion.
- Added reviewed-no-card support to `scripts/base2026-build-backfill-queue.py` so sources reviewed by GPT/Codex but lacking a promotion-safe card do not stay in an infinite queue.
- Created ignored local registry `.planning/reviewed-no-card-sources.jsonl` for 45 reviewed-no-card sources.
- Fixed MacBook compatibility in release scripts: `pwsh`, POSIX paths, Python 3.9-safe text writes, and default VPS host `root@207.244.242.42`.

Commands/checks run:

- `.venv/bin/python scripts/base2026-controller.py build-chatgpt-review-packet ...`
- `codex exec --ignore-user-config --ignore-rules -m gpt-5.4 ...`
- `.venv/bin/python scripts/base2026-controller.py apply-chatgpt-review ...`
- `.venv/bin/python scripts/base2026-controller.py verify-evidence ...`
- `.venv/bin/python scripts/base2026-controller.py import-claim-candidates ... --apply`
- `.venv/bin/python scripts/base2026-controller.py review-insight-candidates ...`
- `.venv/bin/python scripts/base2026-controller.py promote-insight-candidates ... --apply`
- `.venv/bin/python scripts/export-public-tiktok.py --auto-promote-insights --insight-threshold 0.45`
- `.venv/bin/python scripts/base2026-controller.py build-backfill-queue --write`
- `python3 scripts/audit-publication-boundary.py`
- `python3 scripts/validate-github-metadata.py`
- `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/preflight-github-launch.ps1 -SkipRemoteCheck`
- `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/package-public-release.ps1 -ReleaseName base2026-full-cards-ay24-20260610`

Results:

- local public export: 957 source records, 1392 passages, 1690 insight cards, 1226 public insight cards, 1584 topics, 1159 public topics;
- backfill queue: 0 queued sources;
- reviewed-no-card: 45 sources;
- package built: `output/releases/base2026-full-cards-ay24-20260610.zip`;
- package sitemap: 1080 URLs;
- publication boundary audit: `forbidden=0`, `secret_findings=0`;
- public export policy: `ok=true`, full transcripts excluded;
- GitHub metadata validation: ok;
- preflight with live remote checks skipped passed.

Deploy blocker:

- Deploy did not complete because this MacBook does not have an SSH private key accepted by `root@207.244.242.42`.
- Tried `~/.ssh/id_rsa`, `~/.ssh/hiddify_key`, and `~/.ssh/github_actions_dtb`; all returned `Permission denied (publickey,password)`.
- Host key was added for `207.244.242.42`; the blocker is authentication, not DNS or packaging.
- Next safe action after restoring server SSH access: `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/deploy-public-vps.ps1 -ReleaseName base2026-full-cards-ay24-20260610`.

Update:

- User provided the migrated deploy key paths: `~/.ssh/geo_contabo_ed25519`, `~/.ssh/geo_contabo_ed25519.pub`, and `~/.ssh/config`.
- SSH aliases `geo` / `geo-contabo` work against `root@207.244.242.42`.
- Ran `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/deploy-public-vps.ps1 -ReleaseName base2026-full-cards-ay24-20260610 -SshHost geo`.
- Deploy succeeded: nginx config tested, current symlink switched to `/var/www/base2026-knowledge/releases/base2026-full-cards-ay24-20260610`, and Meilisearch reindexed 1392 chunks.
- Server manifest confirms 957 source records, 1392 passages, 1690 insight cards, 1226 public insight cards, and 1584 topics.
- Live search smoke for `AI Overviews` returned 926 estimated hits.

## 2026-06-10 — Command-center queue and PIPE-01.1 controller entrypoints

User corrected the workflow: new site and pipeline tasks must be captured in a real queue, delegated when useful, and then verified by Codex instead of being lost in chat.

Files updated:

- `docs/project-memory/ACTIVE_QUEUE.md`
- `docs/project-memory/NEXT_ACTION.md`
- `docs/project-memory/PIPELINE_STATUS.md`
- `scripts/base2026-controller.py`

Actions taken:

- Created/updated the command-center queue with `GEO-01`, `GEO-02`, `PIPE-01`, `GIT-01`, and `PUB-01`.
- Integrated worker findings for pipeline, git hygiene, and publication gates.
- Closed completed explorer workers after their results were folded into the queue.
- Added controller command `tiktok-metadata-extract` as the tracked wrapper around `scripts/tiktok-ytdlp-metadata-extract.py`.
- Added controller command `import-tiktok-staging` as the tracked wrapper around `scripts/import-tiktok-staging-to-kb.py`.
- Kept `import-tiktok-staging` dry-run by default; SQLite writes require explicit `--apply`.
- Extended `doctor` to check the TikTok metadata extractor, browser caption extractor, and staging importer.

Commands run:

- `.venv/bin/python -m py_compile scripts/base2026-controller.py`
- `.venv/bin/python scripts/base2026-controller.py doctor`
- `.venv/bin/python scripts/base2026-controller.py list-runs --limit 5`
- `.venv/bin/python scripts/base2026-controller.py tiktok-metadata-extract --help`
- `.venv/bin/python scripts/base2026-controller.py import-tiktok-staging --help`

Results:

- controller compile passed;
- `doctor` passed and now includes TikTok intake script checks;
- run listing works;
- new controller commands are available;
- no TikTok intake, ASR batch, staging, commit, push, or deploy was run.

Next:

- Continue `PIPE-01.2`: replace hardcoded TikTok creator inventory with config-driven public-safe examples while keeping real intake queues private/uncommitted.

## 2026-06-10 — PIPE-01.2 config-driven TikTok creator inventory

Continued the new-source pipeline hardening after controller entrypoints.

Files updated:

- `scripts/tiktok-backfill-inventory.ps1`
- `scripts/hermes-tiktok-refresh.ps1`
- `docs/project-memory/ACTIVE_QUEUE.md`
- `docs/project-memory/NEXT_ACTION.md`
- `docs/project-memory/PIPELINE_STATUS.md`
- `docs/project-memory/PROMPT_LOG.md`

Behavior added:

- removed the hardcoded TikTok creator list from `scripts/tiktok-backfill-inventory.ps1`;
- added `-CreatorsConfig`;
- added default creator config resolution order:
  - `config/tiktok-intake-queue.local.json`;
  - `config/tiktok-intake-queue.20260608.json`;
  - `config/creators.example.json`;
- supported both public example array config and private intake queue config with a `creators` array;
- added `-ResolveCreatorsOnly` to validate config parsing without network access, CSV writes, or TikTok intake;
- passed `-CreatorsConfig` through from `scripts/hermes-tiktok-refresh.ps1` to inventory.

Commands run:

- `pwsh -NoProfile -Command '[System.Management.Automation.Language.Parser]::ParseFile(...)'` for `scripts/tiktok-backfill-inventory.ps1`
- `pwsh -NoProfile -Command '[System.Management.Automation.Language.Parser]::ParseFile(...)'` for `scripts/hermes-tiktok-refresh.ps1`
- `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/tiktok-backfill-inventory.ps1 -CreatorsConfig config/creators.example.json -ResolveCreatorsOnly`
- `pwsh -NoProfile -Command './scripts/tiktok-backfill-inventory.ps1 -ResolveCreatorsOnly | ConvertFrom-Json | Select-Object config,count | ConvertTo-Json -Compress'`
- `git diff --check -- scripts/base2026-controller.py scripts/tiktok-backfill-inventory.ps1 scripts/hermes-tiktok-refresh.ps1 docs/project-memory/ACTIVE_QUEUE.md docs/project-memory/NEXT_ACTION.md docs/project-memory/PIPELINE_STATUS.md docs/project-memory/PROMPT_LOG.md`
- `.venv/bin/python -m py_compile scripts/base2026-controller.py`
- `.venv/bin/python scripts/base2026-controller.py doctor`

Results:

- PowerShell syntax checks passed;
- public example config resolves to one enabled TikTok creator;
- default private config resolves without dumping private rows;
- targeted `git diff --check` passed;
- controller compile and doctor passed;
- no `yt-dlp`, TikTok intake, ASR batch, staging, commit, push, or deploy was run.

Next:

- Continue `PIPE-01.3`: unify staging schema across yt-dlp metadata, browser caption extraction, and SQLite import.

## 2026-06-10 — PIPE-01.3 TikTok staging schema normalization

Continued pipeline hardening after config-driven creator inventory.

Files updated:

- `scripts/tiktok-ytdlp-metadata-extract.py`
- `scripts/tiktok-caption-browser-extract.mjs`
- `scripts/import-tiktok-staging-to-kb.py`
- `docs/schemas/TIKTOK_INTAKE_RECORD_SCHEMA.md`
- `docs/project-memory/ACTIVE_QUEUE.md`
- `docs/project-memory/NEXT_ACTION.md`
- `docs/project-memory/PIPELINE_STATUS.md`
- `docs/project-memory/PROMPT_LOG.md`

Behavior added:

- yt-dlp extractor now emits `canonical_url`;
- browser caption extractor now emits `webpage_url` and `extractor`;
- staging importer normalizes URL aliases in this priority order: `canonical_url`, `webpage_url`, `source_url`;
- staging importer normalizes `creator_handle`, `creator_url`, `source_id`, `transcript_text`, and `quality_flags`;
- schema doc now describes URL alias and import normalization rules.

Commands run:

- `.venv/bin/python -m py_compile scripts/tiktok-ytdlp-metadata-extract.py scripts/import-tiktok-staging-to-kb.py scripts/base2026-controller.py`
- `node --check scripts/tiktok-caption-browser-extract.mjs`
- `.venv/bin/python scripts/base2026-controller.py doctor`
- `.venv/bin/python scripts/base2026-controller.py import-tiktok-staging`
- `git diff --check -- scripts/tiktok-ytdlp-metadata-extract.py scripts/tiktok-caption-browser-extract.mjs scripts/import-tiktok-staging-to-kb.py docs/schemas/TIKTOK_INTAKE_RECORD_SCHEMA.md`

Results:

- Python compile passed;
- Node syntax check passed;
- controller doctor passed;
- import dry-run over `.planning/tiktok-ytdlp-20260608.jsonl` selected 26 rows and skipped 42;
- no SQLite writes, TikTok intake, ASR batch, staging, commit, push, or deploy was run.

Next:

- Continue `PIPE-01.4`: smoke-test one existing local audio sample through the `faster-whisper` worker path; do not run broad ASR.

## 2026-06-10 — PIPE-01.4 one-file faster-whisper ASR smoke

Continued pipeline hardening after staging schema normalization.

Files updated:

- `scripts/base2026-worker.py`
- `docs/project-memory/ACTIVE_QUEUE.md`
- `docs/project-memory/NEXT_ACTION.md`
- `docs/project-memory/PIPELINE_STATUS.md`
- `docs/project-memory/PROMPT_LOG.md`

Behavior added:

- `scripts/base2026-worker.py transcribe` now retries the same file without VAD when `--vad-filter` produces empty text;
- ASR metadata records `vad_filter` and `retry_without_vad`;
- this prevents a false-success empty transcript path in future batches.

Commands run:

- `find ... audio-fallback ... | ffprobe ... | sort -n | head -10`
- `.venv/bin/python scripts/base2026-worker.py doctor`
- `.venv/bin/python scripts/base2026-worker.py transcribe 12_knowledge-base/sources/tiktok/transcripts/audio-fallback/7576358465585630486.mp3 --model tiny.en --device cpu --compute-type int8 --vad-filter`
- `.venv/bin/python scripts/base2026-worker.py transcribe 12_knowledge-base/sources/tiktok/transcripts/audio-fallback/7576358465585630486.mp3 --model tiny.en --device cpu --compute-type int8`
- `.venv/bin/python -m py_compile scripts/base2026-worker.py`
- `.venv/bin/python scripts/base2026-worker.py transcribe 12_knowledge-base/sources/tiktok/transcripts/audio-fallback/7576358465585630486.mp3 --model tiny.en --device cpu --compute-type int8 --vad-filter`
- `.venv/bin/python scripts/base2026-worker.py clean .planning/local-worker-poc/transcripts/7576358465585630486.raw.txt`
- `git diff --check -- scripts/base2026-worker.py docs/project-memory/ACTIVE_QUEUE.md docs/project-memory/NEXT_ACTION.md docs/project-memory/PIPELINE_STATUS.md docs/project-memory/PROMPT_LOG.md`

Results:

- local worker doctor passed with `ffmpeg`, `yt-dlp`, `faster_whisper`, `ctranslate2`, and `requests` available;
- shortest local sample found: 6.15 seconds;
- first VAD smoke returned `segment_count=0`, `word_count=0`;
- non-VAD run returned `segment_count=1`, `word_count=10`;
- worker retry fix then made the `--vad-filter` command return `segment_count=1`, `word_count=10`, `retry_without_vad=true`;
- deterministic cleanup guard passed with 10 raw words and 10 clean words;
- no broad ASR batch, TikTok intake, SQLite import apply, staging, commit, push, or deploy was run.

Next:

- Continue `PIPE-01.5`: make new-source import resumable and dry-run first before any SQLite writes.

## 2026-06-10 — PIPE-01.5 dry-run-first resumable TikTok staging import

Continued pipeline hardening after ASR smoke.

Files updated:

- `scripts/import-tiktok-staging-to-kb.py`
- `scripts/base2026-controller.py`
- `docs/project-memory/ACTIVE_QUEUE.md`
- `docs/project-memory/NEXT_ACTION.md`
- `docs/project-memory/PIPELINE_STATUS.md`
- `docs/project-memory/PROMPT_LOG.md`

Behavior added:

- importer dry-run now reports total rows, selected/skipped rows, existing/new rows, and skip reasons;
- importer supports `--limit`, `--source-id`, and `--report`;
- controller `import-tiktok-staging` forwards `--limit`, `--source-id`, and `--report`;
- current staging file can be checked for resumability before any SQLite writes.

Commands run:

- `.venv/bin/python -m py_compile scripts/import-tiktok-staging-to-kb.py scripts/base2026-controller.py`
- `.venv/bin/python scripts/base2026-controller.py import-tiktok-staging --help`
- `.venv/bin/python scripts/base2026-controller.py import-tiktok-staging --report .planning/tiktok-staging-import-dry-run-20260610.json`
- `git diff --check -- scripts/import-tiktok-staging-to-kb.py scripts/base2026-controller.py`
- `.venv/bin/python scripts/base2026-controller.py doctor`
- `.venv/bin/python scripts/base2026-controller.py list-runs --limit 8`

Results:

- compile passed;
- controller help shows new import controls;
- dry-run report created under ignored `.planning/`;
- current staging file: 68 rows, 26 selected, 42 skipped, 26 existing, 0 new;
- skip reasons: 37 `not_caption_ready`, 5 `blocked_quality_flag`;
- reviewer pass updated publication allowlist/staging allowlist for public-safe pipeline scripts `scripts/hermes-tiktok-refresh.ps1` and `scripts/tiktok-backfill-inventory.ps1`;
- publication boundary audit passed after the update: 3176 changed files, 3176 public-safe candidates, 0 needs review, 0 forbidden, 0 secret findings;
- GitHub metadata validation passed;
- no SQLite writes, TikTok intake, broad ASR, staging, commit, push, or deploy was run.

Next:

- Continue `PIPE-01.6`: wire source-backed card extraction for newly imported sources, gated by deterministic evidence verification and manual review.

## 2026-06-10 — Stage, deploy, publish checkpoint

User clarified that local-only work is not enough and asked to stage/deploy/publish visible work.

Actions taken:

- ran publication boundary audit;
- ran GitHub metadata validation;
- ran preflight with remote check skipped;
- deployed release `base2026-stage-ay25-20260610` through `scripts/deploy-public-vps.ps1 -SshHost geo`;
- reindexed Meilisearch on the VPS;
- verified live URLs and public data contract;
- staged public-safe repository files through `scripts/stage-public-files.ps1 -Apply -SkipRemoteCheck`.

Verification:

- boundary audit: 3176 changed files, 3176 public-safe candidates, 0 needs review, 0 forbidden, 0 secret findings;
- preflight: ok;
- deployed path: `/var/www/base2026-knowledge/releases/base2026-stage-ay25-20260610`;
- public export policy: 957 source records, 1392 passages, 1690 insight cards, 1226 public insight cards;
- live `documents.jsonl`: 957 rows, 0 claim leaks, 0 transcript leaks;
- live search proxy for `AI Overviews`: 926 hits;
- live URL checks passed for `/knowledge/`, roadmap, story, source-policy, support, topics, creators, and a sample source page;
- browser checks passed for desktop/mobile overflow on Base2026 and WordPress home/about;
- public-safe git staging completed with 3176 staged files.

Remaining publication blocker:

- GitHub remote is not configured, so GitHub push/public repo publication still needs a repo target before push.

## 2026-06-10 — Mixed mobile visual QA automation and deploy

User asked to architect, automate, test, fix, deploy, and verify the mobile visual QA workflow for the mixed WordPress + Base2026 public site.

Actions taken:

- added `scripts/mobile-visual-qa.mjs`, a Playwright-based live QA runner for WordPress root pages and Base2026 `/knowledge/` pages;
- added `docs/project-memory/MOBILE_VISUAL_QA_RUNBOOK.md`;
- ran an initial full live matrix: 66 checks, 7 failures;
- fixed Base2026 320px overflow on search/source pages, tablet footer overflow, roadmap flow containment, long H1 wrapping, and Base2026 footer tap target;
- bumped Base2026 cache-bust to `20260610-mobileqa1`;
- bumped WordPress child theme CSS to `1.5.16` and fixed the footer `Cookie Preferences` tap target;
- deployed Base2026 release `base2026-mobile-visual-qa-ay25-20260610` with `-SshHost geo -SkipReindex`;
- backed up and deployed WordPress `style.css` to `/var/www/alex-yarosh/wp-content/themes/alex-yarosh/style.css`, cleared WordPress/cache-enabler cache, and reloaded nginx.

Verification:

- live WordPress root loads `style.css?ver=1.5.16`;
- live Base2026 loads `static/styles.css?v=20260610-mobileqa1`;
- server current symlink points to `/var/www/base2026-knowledge/releases/base2026-mobile-visual-qa-ay25-20260610`;
- final live matrix: 66 route/viewport checks, 0 failures, 0 warnings;
- evidence written under ignored `output/evidence/mobile-visual-qa-live-20260610-final/`;
- no TikTok intake, SQLite writes, Git commit, Git push, or GitHub publication was run.

## 2026-06-10 — Desktop Base2026 UI polish and deploy

User reviewed live Base2026 desktop pages and asked to fix source-record modal scrolling, cramped creator/source cards, oversized typography, roadmap density, and support page structure.

Actions taken:

- reduced global Base2026 desktop type scale and generated public-page cache-bust;
- replaced the large roadmap SVG flow with compact phase tabs and phase sequence cards;
- added a support explainer section matching the roadmap/product style;
- widened generated card grids to reduce four-column cramped layouts on smaller desktop monitors;
- changed the source-record modal to lock background scrolling and scroll only the modal body;
- regenerated public info/source/creator/topic/compare pages and sitemap;
- deployed release `base2026-desktop-ui-ay26-20260610` via `scripts/deploy-public-vps.ps1 -SshHost geo`;
- reindexed Meilisearch with 1392 passages.

Verification:

- live roadmap, support, source-policy, and creator page desktop checks have no horizontal overflow;
- live creator page renders 3 generated card columns at 1159px viewport;
- live source modal background lock is true, dialog overflow is hidden, modal body overflow is auto, and modal body has internal scroll;
- evidence is under ignored `output/evidence/desktop-ui-live-20260610/`;
- no Git commit, Git push, GitHub publication, TikTok intake, or SQLite write was run.

## 2026-06-10 — Desktop typography correction after live review

User reported that the live Roadmap and Support pages still looked unchanged: flow did not feel fixed and headings were still too large.

Actions taken:

- confirmed live ay26 had deployed, but the typography reduction was too weak;
- made a stronger desktop density correction in `web/static/styles.css`;
- bumped generated cache-bust to `20260610-desktopqa2`;
- packaged and deployed `base2026-desktop-ui-ay27-20260610`;
- reindexed Meilisearch with 1392 passages.

Verification:

- live roadmap/support/source-policy load CSS `20260610-desktopqa2`;
- live H1 at 1159px viewport is about 34.77px;
- live roadmap/support section H2 is about 26.08px;
- live policy section H2 is 19px;
- live roadmap/support/source-policy have no horizontal overflow;
- evidence is under ignored `output/evidence/desktop-ui-live-ay27-20260610/`;
- no Git commit, Git push, GitHub publication, TikTok intake, or SQLite write was run.

## 2026-06-10 — Source/topic IA cleanup after live review

User reviewed live topic/source/search pages and reported double `@@` handles, unclear evidence passage structure, oversized source metadata/topic chips, hard-to-read source excerpt copy, missing share/save affordances, too-large selected-term close controls, and visible text `tiktok` where TikTok should be represented by logo.

Actions taken:

- normalized generated creator handles to a single visible `@`;
- added compact share/copy/citation/print controls to generated creator/topic/source pages using inline neutral SVG controls;
- replaced source-page metric/topic sections with a compact source metadata strip;
- changed generated source metadata and Meili search badges/modal platform values to icon-only TikTok presentation;
- renamed `Public Evidence Excerpt` to `Source Excerpt`;
- paragraphized source excerpts and passage previews;
- rebuilt topic evidence passages as source-linked cards with creator/date context;
- reduced selected search term close control styling;
- bumped Base2026 cache-bust to `20260610-sourceia1`;
- packaged and deployed `base2026-source-topic-ia-ay28-20260610`;
- reindexed Meilisearch with 1392 passages.

Verification:

- boundary audit and GitHub metadata validation passed before deploy;
- local Playwright QA passed on the release package for topic, source, and search pages;
- live Playwright QA passed on `https://aggressorbulkit.online/knowledge/topics/content-strategy.html`, `https://aggressorbulkit.online/knowledge/sources/tiktok-video-7646438628347956502.html`, and `/knowledge/?q=schema structured data AI Overviews keyword research`;
- live checks confirmed no `@@`, no old `Public Evidence Excerpt` label, share controls present, compact source metadata, icon-only TikTok metadata, selected close control at 14px/10px, and no horizontal overflow;
- evidence written under ignored `output/evidence/source-topic-ia-ay28-live-*.png`;
- no Git commit, Git push, GitHub publication, TikTok intake, or SQLite write was run.

## 2026-06-10 — ay29c UI hotfix after live review

User reported that the generated share bar had an unwanted decorative AI-style sparkle, TikTok source icons were sitting below the creator/date row, and the `/knowledge/` independent-pilot copy/heading felt oversized and weak.

Actions taken:

- removed the sparkle mark from generated share bars;
- moved TikTok platform marks into the creator/date row on search cards;
- verified source modal attribution also keeps the TikTok mark in the creator/date row;
- fixed source-record modal loading by streaming `documents.jsonl` until the requested `item_id` is found;
- rewrote the `/knowledge/` project identity block, linked `Alex Yarosh` to `/about/`, and reduced the project identity H2;
- changed the modal label from `Public evidence excerpt` to `Source excerpt`;
- bumped Base2026 cache-bust to `20260610-ay29c`;
- packaged and deployed `base2026-ui-hotfix-ay29c-20260610`;
- reindexed Meilisearch with 1392 passages.

Verification:

- live `/knowledge/` loads CSS/JS cache-bust `20260610-ay29c`;
- old project-identity copy is absent and the `Alex Yarosh` link is present;
- topic share label has no decorative sparkle SVG/path;
- search result TikTok badge and source-modal TikTok mark align with creator/date;
- source modal opens successfully and uses `Source excerpt`;
- checked pages have no horizontal overflow;
- evidence written to ignored `output/evidence/ui-hotfix-ay29c-live-modal.png` and `output/evidence/ui-hotfix-ay29c-live-topic.png`;
- no Git commit, Git push, GitHub publication, TikTok intake, or SQLite write was run.

## 2026-06-10 — Launch commit and MacBook check-only automation

User explicitly requested deployment/launch activation instead of further visual iteration.

Actions taken:

- committed the public-safe staged launch state as `d025d71 launch: stage Base2026 public release`;
- confirmed no Git remote is configured, so GitHub push is blocked until the exact `origin` URL is provided;
- ran controller `doctor`, `inventory-check`, `data-quality-report`, `daily-digest`, and public export policy checks;
- confirmed the 32 `promotion_candidate` insight-card candidates from the earlier report are already `approved`;
- reviewed the remaining 2 pending insight-card candidates, rejected the missing-evidence candidate, and parked the generic `needs_human` candidate outside public export;
- fixed `scripts/hermes-tiktok-refresh.ps1` for macOS PowerShell by passing named parameters to `tiktok-backfill-inventory.ps1`;
- installed and loaded the Mac launchd check-only job `com.base2026.hermes-tiktok-check` for 03:30 and 15:30 local time;
- ran a launchd smoke test with exit code 0.

Verification:

- live site remains `base2026-ui-hotfix-ay29c-20260610`;
- public export policy: 957 source records, 1392 passages, 1690 insight cards, 1226 public insight cards, 1159 public topics, `include_full_transcripts=false`;
- pending insight-card candidates: 0;
- Mac launchd check-only run: 2419 total TikTok rows, 999 active, 57 queued transcripts, 0 `needs_asr`, 940 transcribed, 0 `needs_polish`;
- no raw/private data was staged or pushed;
- no GitHub push was run because no remote is configured.

## 2026-06-10 — Public GitHub publication

User requested final GitHub publication for Base2026 after launch QA and public/private boundary checks.

Actions taken:

- confirmed `geo` launch analytics were deployed and pushed separately;
- ran Base2026 publication boundary audit, GitHub metadata validation, and preflight before publication;
- created public repository `https://github.com/offflinerpsy/base2026`;
- pushed audited Base2026 source to `main`;
- set GitHub default branch to `main`;
- also pushed `codex/github-publication-staging` as the original publication staging branch;
- updated project memory so future agents do not treat GitHub remote selection as blocked.

Verification:

- `python3 scripts/audit-publication-boundary.py`: `forbidden=0`, `secret_findings=0`;
- `python3 scripts/validate-github-metadata.py`: `github-metadata=ok`;
- `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/preflight-github-launch.ps1 -SkipRemoteCheck -SkipExportPolicy -SkipLiveCheck`: `preflight=ok`;
- GitHub reports `offflinerpsy/base2026` as `PUBLIC` with default branch `main`.

## 2026-06-10 — Source modal metadata moved to sticky header

User selected the source modal `Public policy / Platform / Language` block and asked to move it into the non-scrolling top header near the controls.

Actions taken:

- added `#transcript-header-meta` to the source modal sticky header;
- moved policy/platform/language rendering from `#transcript-body` into the sticky header;
- shortened header labels to `Policy`, `Platform`, and `Lang`;
- kept the body focused on the policy note, topics, and `Source excerpt`;
- added compact header styles and mobile-specific behavior;
- bumped release cache-bust to `20260610-modalmeta1`;
- packaged and deployed `base2026-modal-meta-header-ay30-20260610`;
- reindexed Meilisearch with 1392 passages.

Verification:

- local release QA: `0` failures;
- live QA: `0` failures;
- live CSS/JS cache-bust: `20260610-modalmeta1`;
- source modal header meta cards: `3`;
- body policy grids: `0`;
- sticky header remains stable during modal body scroll;
- desktop/mobile horizontal overflow: false;
- console errors: `0`;
- evidence:
  - `output/evidence/modal-meta-header-live-desktop.png`;
  - `output/evidence/modal-meta-header-live-mobile.png`;
  - `output/evidence/modal-meta-header-live-report.json`.

## 2026-06-10 — Base2026 sitemap accepted by GSC

User wanted the launch/indexing work finished rather than leaving the Base2026 sitemap in Search Console as a `Couldn't fetch` open loop.

Actions taken:

- confirmed Search Console still showed `/knowledge/sitemap.xml` as `Couldn't fetch`;
- changed `scripts/generate-base2026-sitemap.py` to generate a sitemap index plus child sitemaps;
- packaged and deployed `base2026-sitemap-index-ay31-20260610`;
- verified live XML as Googlebot: sitemap index with three child files and 1080 total URLs;
- updated the `geo` live indexing/schema QA script to recursively read sitemap indexes;
- resubmitted `/knowledge/sitemap.xml` in Search Console through the authenticated Chrome session.

Verification:

- GSC status: `Success`;
- GSC type: `Sitemap`;
- GSC last read: `2026-06-10`;
- GSC discovered pages: `1,080`;
- live indexing/schema QA: 104 checks, 0 failures;
- publication boundary audit after code change: `forbidden=0`, `secret_findings=0`.

## 2026-06-10 — Priority URL inspection after sitemap acceptance

Actions taken:

- inspected priority URLs in Google Search Console after the Base2026 sitemap started showing `Success`;
- confirmed `https://aggressorbulkit.online/` is already on Google and indexed;
- confirmed `https://aggressorbulkit.online/knowledge/` is already on Google and indexed;
- requested indexing for `https://aggressorbulkit.online/services/`.

Verification:

- `/services/`: GSC confirmed `Indexing requested` and added the URL to a priority crawl queue;
- `/pricing/`, `/about/`, and `/ai-visibility-audit/`: GSC showed `URL is not on Google`, but manual request submission hit `Quota Exceeded`;
- next GSC manual action is to request those three URLs after the daily quota resets.

## 2026-06-10 — Source modal metadata moved into control area

User selected the source modal `Public policy / Platform / Language` block again and clarified that it should sit in the fixed top control area where the action buttons are, not as a wide row that still feels like body content.

Actions taken:

- moved `#transcript-header-meta` inside `.transcript-dialog-controls`;
- added `.transcript-dialog-actions-row` so actions/close stay together and metadata sits directly below them;
- kept metadata out of `#transcript-body`;
- fixed mobile CSS specificity so the header metadata remains compact instead of becoming a tall single column;
- bumped release cache-bust to `20260610-modalmeta2`;
- packaged and deployed `base2026-modal-meta-controls-ay32-20260610` with `-SkipReindex`;
- retried GSC indexing for `/pricing/`, but the daily quota is still exceeded.

Verification:

- local release QA: `ok=true`;
- live QA: `ok=true`;
- live CSS/JS cache-bust: `20260610-modalmeta2`;
- source modal header meta parent: `.transcript-dialog-controls`;
- header meta cards: `3`;
- body policy grids: `0`;
- desktop/mobile horizontal overflow: false;
- console errors: `0`;
- evidence:
  - `output/evidence/modal-meta-controls-ay32-local/desktop.png`;
  - `output/evidence/modal-meta-controls-ay32-local/mobile.png`;
  - `output/evidence/modal-meta-controls-ay32-live/desktop.png`;
  - `output/evidence/modal-meta-controls-ay32-live/mobile.png`.

## 2026-06-10 — Source modal metadata cache refresh

User selected the live source modal metadata block again and asked to move it into the fixed top control area. Local and clean live QA already showed the ay32 structure was correct, but the user's open browser tab could still show the older asset state.

Actions taken:

- confirmed live clean-load DOM already had `#transcript-header-meta` inside `.transcript-dialog-controls`;
- synchronized `web/static/meili.html` cache-bust with the package cache-bust;
- bumped Base2026 cache-bust to `20260610-modalmeta3`;
- changed `scripts/deploy-public-vps.ps1` default SSH host to the working `geo` alias after the first upload attempt failed with the raw `root@207.244.242.42` host;
- packaged and deployed `base2026-modal-meta-cache-ay33-20260610` with `-SkipReindex`.

Verification:

- live CSS/JS cache-bust: `20260610-modalmeta3`;
- source modal header meta parent: `.transcript-dialog-controls`;
- header meta cards: `3`;
- body policy grids: `0`;
- sticky header remains stable during modal body scroll;
- desktop/mobile horizontal overflow: false;
- console errors: `0`;
- nginx verification: pass.

## 2026-06-10 — Empty source page diagnosis and targeted hydration repair

User reported that `/knowledge/sources/tiktok-video-7648365806375488782.html` was empty on live.

Actions taken:

- confirmed live page still showed the empty-source state;
- traced the cause to a `generic_items` row with no `generic_documents`/`chunks`, while the TikTok video had available `eng-US` platform subtitles;
- downloaded the platform subtitle locally, created a cleaned caption transcript, and hydrated the local SQLite KB with one document and four chunks;
- regenerated the public export with `--auto-promote-insights` so public insight cards did not collapse;
- added a source-page evidence gate in `scripts/generate-public-pages.py`: source records with no excerpt, no public passages, and no public insight cards are now `noindex,follow` and excluded from source index / creator latest-source cards;
- regenerated static pages and sitemap index/children locally.
- packaged ignored release artifact `base2026-source-hydration-ay34-20260610.zip` without deploying.

Verification:

- public export policy: `ok=true`, `include_full_transcripts=false`;
- local export: 957 source records, 1396 passages, 1690 insight cards, 1226 public insight cards, 1584 topics, 1159 public topics;
- local repaired page contains `OpenAI just announced ChatGPT sites`;
- local repaired page no longer contains `No public excerpt is available`;
- child sitemap includes `tiktok-video-7648365806375488782.html`;
- packaged release sitemap has 1078 URLs; the one-count difference from the local web root is expected because the deploy package serves `meili.html` as `/knowledge/index.html`;
- two older no-audio `@tjrobertson52` source-review pages are excluded from child sitemaps;
- publication boundary audit: `forbidden=0`, `secret_findings=0`;
- GitHub metadata validation: `ok`.

Next step:

- package and deploy the repaired Base2026 public export, then verify the live page has the excerpt and no empty-state text.

## 2026-06-10 — Source page hero metadata/share consolidation

User selected the source-page metadata strip on `/knowledge/sources/tiktok-video-7648365806375488782.html` and asked to move the wide `Published / Platform / Insights / Topics` strip upward into the source-record hero, with share controls also raised and reduced to neutral icon controls.

Actions taken:

- added source-page-specific compact share controls in `scripts/generate-public-pages.py`;
- moved source metadata into `.source-hero-meta` inside `.source-page-hero`;
- removed the separate `.source-meta-strip` from generated source pages;
- kept source share actions as icon-only controls with accessible labels and orange hover/focus color;
- bumped Base2026 static cache-bust to `20260610-sourcehero1`;
- packaged and deployed `base2026-source-hero-ay35-20260610`;
- reindexed Meilisearch with 1396 passages.

Verification:

- deploy script reported `deployed=base2026-source-hero-ay35-20260610`;
- deploy script reported `indexed=1396 index=base2026_public_tiktok`;
- live source page contains `.source-page-hero`, `.source-share-actions`, and `.source-hero-meta`;
- live source page has no `.source-meta-strip`;
- live source page contains `OpenAI just announced ChatGPT sites`;
- live source page does not contain `No public excerpt is available`;
- live desktop/mobile browser QA: overflow false, console errors 0;
- evidence:
  - `output/evidence/source-hero-ay35-live/desktop.png`;
  - `output/evidence/source-hero-ay35-live/mobile.png`.

## 2026-06-10 — GitHub SEO readiness, static compression, and ay37 deploy

User asked to finish Base2026 GitHub/open-source readiness, clean up SEO/performance, deploy, and push the public-safe project state.

Actions taken:

- updated `README.md` for the public GitHub repo with live demo, current data counts, maintainer/contact, public boundary, and contribution areas;
- added generated-source Markdown pages for Base2026 Methodology and Creator Correction / Removal under `docs/public-pages/`;
- updated `scripts/generate-info-pages.py` so Methodology and opt-out/correction pages are generated consistently with the other public info pages;
- synchronized `web/static/index.html` with the current public search UI;
- added metadata/canonical/schema/noindex to the roadmap data-viz test page;
- fixed mobile source-page `Public Insight Cards` overflow by letting card grids shrink below 340px;
- bumped Base2026 static cache-bust to `20260610-ay37`;
- updated server nginx `/knowledge/static/` handling for gzip, `Vary: Accept-Encoding`, and immutable cache headers;
- updated GitHub repo metadata: homepage `https://aggressorbulkit.online/knowledge/`, description, and topics;
- deployed `base2026-mobile-overflow-fix-ay37-20260610` through the repeatable VPS deploy script;
- reindexed Meilisearch with 1396 passages.

Verification:

- public export policy: ok, `include_full_transcripts=false`;
- publication boundary audit: `forbidden=0`, `secret_findings=0`, `needs_review=0`;
- GitHub metadata validation: ok;
- local static SEO metadata audit: 3294 HTML files, 0 missing title/description/canonical/H1/schema;
- live root/methodology/opt-out/source smoke: title, description, canonical, schema, and one H1 present; old empty-source text absent;
- live CSS/JS headers: gzip plus immutable cache headers;
- full live mobile visual QA: 66 checks, 0 failures; evidence under ignored `output/evidence/mobile-visual-qa-live-ay37-20260610/`.

Next step:

- stage the public-safe allowlisted paths, commit, push `main` to GitHub, then resume GSC priority indexing and check-only TikTok pipeline work.

## 2026-06-11 — Launch contour, lead-flow recipient, and ay38 card backfill

User asked to stop reporting and close the launch contour: GSC indexing, analytics events, lead flow, card pipeline, and Base2026 launch readiness.

Actions taken:

- used the authenticated Chrome/GSC tab to inspect `/pricing/`; GSC reported `URL is not on Google` with `Discovered - currently not indexed`, then `Quota Exceeded` after requesting indexing;
- confirmed both submitted sitemaps are accepted in GSC: WordPress sitemap and Base2026 sitemap index;
- verified live consent-gated analytics: GTM `GTM-M73PZ47H`, GA4 `G-D7EF02H9D2`, and real GA4 collect hits for `page_view`, `cta_clicked`, and `form_submitted`;
- fixed WordPress lead delivery so all lead forms send to `AY_CONTACT_EMAIL` (`offflinerpsy@gmail.com`) instead of the local WordPress admin email placeholder;
- processed the final Base2026 source-with-passages/no-card queue item, created 2 source-backed candidates, promoted them to `approved`, regenerated the public export, and closed the queue to 0;
- regenerated public pages and sitemap;
- deployed `base2026-card-backfill-ay38-20260611`;
- reindexed Meilisearch with 1396 passages.

Verification:

- WordPress server PHP lint passed before replacing `functions.php`;
- nginx config test and reload passed;
- live `ay_lead_recipient_email()` returns `offflinerpsy@gmail.com`;
- public export policy: `ok=true`, `include_full_transcripts=false`;
- publication boundary audit: `forbidden=0`, `secret_findings=0`, `needs_review=0`;
- GitHub metadata validation: ok;
- live source page `/knowledge/sources/tiktok-video-7648365806375488782.html` contains `Source Excerpt`, `Public Insight Cards`, `AI knowledge base architecture`, and `AI workflow documentation`; old empty-state text is absent;
- live launch readiness QA: `siteReady=true`, `failedSteps=[]`;
- live mobile visual QA: 66 checks, 0 failures.

Next step:

- retry manual indexing for `/pricing/`, `/about/`, and `/ai-visibility-audit/` only after the GSC daily quota resets; otherwise move to check-only TikTok intake automation.

## 2026-06-11 — Mobile video UX pass and ay41 deploy

User provided a mobile walkthrough video and asked to turn it into shipped fixes, not more discussion.

Actions taken:

- transcribed/reviewed the video evidence and converted it into a mobile UX backlog;
- tightened WordPress homepage/services/pricing/about mobile density through source-controlled generator/CSS changes;
- connected the Google Calendar booking link in the About contact block and Thank You CTA;
- deployed WordPress child-theme CSS `1.5.32`, `functions.php`, and targeted page updates for `home`, `pricing`, `about`, and `thank-you-ai-visibility-audit`;
- tightened Base2026 `/knowledge/` mobile search, source modal, source page controls, share/meta controls, and roadmap mobile/fallback behavior;
- fixed `web/static/meili.html` so the live Base2026 search header CTA is `Check My AI Visibility`;
- deployed `base2026-mobile-video-ux-ay41-20260611` with `-SkipReindex` after the data-preserving CSS/template pass.

Verification:

- WordPress native audit: 69 checks, 0 failures;
- WordPress launch-readiness QA: `READY_FOR_GSC_GTM_BROWSER_ACTIONS`, 0 failed steps;
- Base2026 publication boundary audit: `forbidden=0`, `secret_findings=0`, `needs_review=0`;
- GitHub metadata validation: ok;
- final live mixed visual QA: 66 checks, 0 failures; evidence under `output/evidence/mobile-visual-qa-live-20260611-mobilevideo-ay41/`;
- targeted live checks: Base2026 header CTA is `Check My AI Visibility`, roadmap overflow offenders are 0, `/knowledge/sources/tiktok-video-7648365806375488782.html` has source excerpt content, 4 passage cards, 2 topic chips, and no empty-source text.

Next step:

- settle GitHub staging policy for the ay41 generated public HTML before pushing; then continue GSC manual indexing after quota reset and check-only TikTok intake hardening.

## 2026-06-11 — Canonical Base2026 source identity and ay42b deploy

User pointed out that source pages, creator pages, and source modals rendered the same creator/source data with different hierarchy, repeated `source record` text, inconsistent share controls, and inconsistent TikTok/date placement.

Actions taken:

- introduced a single source/creator identity pattern in the public page generator and modal JS;
- changed source-page H1s to show the handle/title cleanly without repeating `source record`;
- moved creator/date/TikTok into the same identity row across source pages, creator pages, and modals;
- unified share actions as compact icon-only controls;
- replaced source-page metric strips with compact hero meta chips;
- changed modal policy copy from `excerpt_only` to `excerpt only` and shortened caption metadata labels;
- regenerated public source, creator, topic, compare, and info pages;
- deployed `base2026-identity-unification-ay42b-20260611` with `-SkipReindex`.

Verification:

- Python compile and JS syntax checks passed;
- publication boundary audit passed with `forbidden=0`, `secret_findings=0`, `needs_review=0`;
- GitHub metadata validation passed;
- live targeted DOM checks passed on a source page, creator page, and search modal;
- full live mixed visual QA passed: 66 checks, 0 failures, 0 warnings.

Next step:

- stage allowlisted public-safe files, commit, push `main`, then continue check-only TikTok intake and GSC indexing.

## 2026-06-11 — Topic page IA compaction and ay43 deploy

User marked the topic-page metrics block and asked to remove the separate `Share Topic Page` bar plus the standalone public insight/source/creator metric row. The requested product direction was to make `Topic Evidence Page` the single hero/control block and keep its width aligned with lower sections.

Actions taken:

- changed topic-page generation so share icons render inline inside the `Topic evidence page` hero without a visible `Share Topic Page` label;
- moved public insight card, source record, and creator counts into compact hero stats;
- removed the standalone topic `metric-row`;
- made topic hero width match `content-section` width across desktop, narrow desktop, and mobile;
- bumped Base2026 static cache-bust to `20260611-topicia2`;
- deployed `base2026-topic-ia-ay43-20260611` with `-SkipReindex`.

Verification:

- Python compile and JS syntax checks passed;
- publication boundary audit passed with `forbidden=0`, `secret_findings=0`, `needs_review=0`;
- GitHub metadata validation passed;
- package-layout Playwright QA passed on 1159px, 919px, and 390px viewports;
- live Playwright QA passed on `/knowledge/topics/ai-search-query-decomposition.html`: equal hero/content widths, no old share bar, no metric row, inline share controls present, 3 stats present, no horizontal overflow, and 0 console errors.

Next step:

- stage allowlisted public-safe files, commit, push `main`, then continue check-only TikTok intake and GSC indexing.

## 2026-06-11 — Roadmap status marker compaction and ay44 deploy

User marked the roadmap execution-order cards and called out that status values were visually heavier than the actual roadmap items, especially on mobile.

Actions taken:

- converted roadmap status rendering to compact public labels such as `Done`, `Live`, `In progress`, `Planned`, `Research`, and `Next`;
- preserved full internal status strings in tooltip/ARIA so `Completed - Built In-House` remains available without dominating the layout;
- split roadmap status styles from normal pill styles so statuses are 10px, 17px high, borderless, and non-wrapping;
- kept mobile roadmap priority rows as text plus compact status, instead of stacking statuses as separate blocks;
- regenerated public/info pages, bumped Base2026 cache-bust to `20260611-roadmapstatus1`, and deployed `base2026-roadmap-status-ay44-20260611` with `-SkipReindex`.

Verification:

- Python compile and JS syntax checks passed;
- publication boundary audit passed with `forbidden=0`, `secret_findings=0`, `needs_review=0`;
- GitHub metadata validation passed;
- package-layout QA passed on desktop 1159px and mobile 390px;
- live QA passed on `/knowledge/roadmap.html`: CSS `20260611-roadmapstatus1`, 17 compact status badges, no rendered `COMPLETED - BUILT IN-HOUSE` text, no horizontal overflow, and 0 console errors.

Next step:

- stage allowlisted public-safe files, commit, push `main`, then continue GSC indexing and check-only TikTok intake hardening.

## 2026-06-11 — Mobile search filters, header parity, hashtag topics, and ay46 deploy

User pointed out that `/knowledge/` mobile filters were effectively hidden below results and asked for a visible, ergonomic filter control near the search flow. The same pass also continued the Base2026 launch UX cleanup for header parity and source metadata/tag consistency.

Actions taken:

- added a visible mobile `Filters` control under the search command on `/knowledge/`;
- implemented a native fixed filter drawer with creator, source, and year refinements plus backdrop/close/Escape handling;
- aligned Base2026 static headers with the WordPress avatar header and added desktop/mobile Base2026 navigation menus;
- moved source-page `excerpt only` and insight count metadata into the hero tool row;
- changed source/topic keywords to orange hashtag-style links instead of framed pills;
- fixed the deploy package template `web/static/meili.html` and cache-bust so live `/knowledge/` receives the mobile filter/header changes;
- deployed `base2026-mobile-filters-header-tags-ay46-20260611` with Meilisearch reindex.

Verification:

- Python compile, JS syntax, and `git diff --check` passed;
- public export policy check passed: 957 source records, 1396 passages, 1692 insight cards, 1228 public insight cards;
- publication boundary audit passed with `forbidden=0`, `secret_findings=0`, `needs_review=0`;
- GitHub metadata validation passed;
- live Playwright QA passed for mobile `/knowledge/`, mobile/desktop source page, and homepage mobile step-card state with no horizontal overflow and 0 console errors.

Next step:

- stage audited public-safe files, commit, push `main`, then continue GSC indexing and the reviewed intake pipeline.

## 2026-06-11 — ay51 ASR pipeline refresh and deploy

User asked to run the whole pipeline because new videos may have appeared, process them, and deploy after the work.

Actions taken:

- ran `hermes-tiktok-refresh.ps1 -CheckOnly -PlaylistEnd 1000`; no new TikTok inventory rows were added after ay50;
- confirmed current active TikTok state: 3008 total inventory rows, 1209 active rows, 1206 transcribed, 0 queued transcripts, 0 `needs_asr`, and 3 `needs_source_review`;
- rebuilt SQLite from current local sources;
- ran `kb-audit.py` and public export policy validation;
- exported public TikTok data as excerpt-only with 1209 source records and 1696 passages;
- fixed `scripts/tiktok-process-transcripts.ps1` for macOS ASR: POSIX-safe yt-dlp output templates, h264-first audio fallback selection, and local `base2026-worker.py transcribe` instead of missing `whisper` CLI;
- fixed `scripts/package-public-release.ps1` so CSS/JS cache-bust uses the release name instead of a stale hardcoded value;
- added `scripts/tiktok-process-transcripts.ps1` to the public-safe audit/staging allowlists;
- deployed `base2026-asr-pipeline-ay51-20260611` to VPS and reindexed Meilisearch with 1696 passages.

Verification:

- `build-kb-sqlite.py`: creators=4, transcripts=1206, source_cards=1206, chunks=1922, queued_asr_jobs=0;
- `kb-audit.py`: `audit=PASS`;
- `check-public-export-policy.py`: `ok=true`, `include_full_transcripts=false`;
- `audit-publication-boundary.py`: 0 forbidden, 0 secret findings, 0 needs review;
- `validate-github-metadata.py`: ok;
- live `/knowledge/static/documents.jsonl`: 1209 rows, no public full transcript/claims fields;
- live source pages `7649635621287316743`, `7649262955514580232`, and `7647809342548266258`: 200, `Source Excerpt` present, old empty-source text absent;
- live mobile visual QA: 44 checks, 0 failures, evidence under ignored `output/evidence/ay51-live-mobile-qa/`.

Not completed automatically:

- 265 clean transcripts still need faithful polish/QA before being considered final-quality polished transcript text;
- 3 source records remain in `needs_source_review`;
- no unreviewed insight-card candidates were promoted.

Next step:

- stage, commit, and push the public-safe ay51 pipeline/memory changes, then continue faithful transcript polish and evidence-gated insight-card backfill as separate quality queues.

## 2026-06-11 — Creator index, dropdown hover, and green Base2026 CTA ay49

User reported that the `/knowledge/creators/` index looked empty and unfinished, the Base2026 desktop dropdown disappeared before the pointer could reach the submenu, and the main WordPress site had lost the acid-green Base2026 CTA treatment.

Actions taken:

- rebuilt `/knowledge/creators/` cards with creator avatars, source counts, public-insight counts, attribution copy, profile links, and TikTok profile links;
- added a hover bridge to the Base2026 desktop header dropdown so the submenu remains reachable;
- deployed `base2026-creator-index-dropdown-ay49-20260611` with `-SkipReindex`;
- deployed WordPress child theme CSS `1.5.40`;
- added hover-bridge/light-dropdown styling to the WordPress desktop Base2026 submenu;
- added an acid-green Base2026 footer button and WordPress content blocks for the homepage and services page.

Verification:

- live `/knowledge/creators/` shows 4 creator cards, 4 avatars, 4 TikTok profile links, and no horizontal overflow;
- live WordPress and Base2026 desktop dropdown hover paths stay open and reach the `Search` submenu link;
- live homepage has the Base2026 block, live services page has the Base2026 service card, and live footer has the acid-green Base2026 button;
- evidence under ignored `output/evidence/ay49-creator-cta-live/`.

Next step:

- run publication boundary and metadata audits, stage allowlisted public-safe files, commit, push, then continue launch monitoring and the reviewed intake pipeline.

## 2026-06-11 — TikTok refresh ay50, Mac pipeline fixes, and deploy

User asked to run the pipeline for newly available TikToks, finish work to Git, and deploy after verification.

Actions taken:

- ran `hermes-tiktok-refresh.ps1 -CheckOnly -PlaylistEnd 50`: no new rows at that depth;
- ran full refresh with `PlaylistEnd 100`, which discovered 49 new `@joshuamaraney` rows;
- ran `-AfterPolish` with default `PlaylistEnd 1000`, which expanded the full `@joshuamaraney` archive to 638 rows and left older rows out of active scope where applicable;
- polished the one caption-ready transcript in batch `hermes-polish-20260611-144528`: `tiktok-video-7648365806375488782`;
- fixed Mac runner portability in `hermes-tiktok-refresh.ps1` and `tiktok-polish-runner.ps1` by resolving `python3`/`python` and `pwsh`/`powershell` dynamically;
- fixed `build-kb-sqlite.py` so SQLite rebuilds are deterministic: stale rows are cleared, and missing TikTok creators/source registry rows are auto-registered from `videos.csv`;
- extended the publication-boundary allowlist for the newly public-safe pipeline scripts;
- rebuilt SQLite, exported public TikTok data, packaged, deployed, and reindexed Meilisearch as `base2026-tiktok-refresh-ay50-20260611`.

Verification:

- `kb-audit.py` passes with `integrity=ok`, `foreign_key_errors=0`, 941 transcripts/source cards, and 266 queued ASR jobs;
- public export policy passes with `include_full_transcripts=false`;
- ay50 public export has 1209 source records, 1373 passages, 1538 insight cards, 1097 public insight cards, 1442 topics, and 1040 public topics;
- live `/knowledge/static/documents.jsonl` has 1209 rows;
- live Meilisearch proxy returns hits after reindex;
- live source page `/knowledge/sources/tiktok-video-7648365806375488782.html` now contains the polished OpenAI/ChatGPT Sites source excerpt;
- mobile visual QA passed: 44 checks, 0 failures, evidence under ignored `output/evidence/ay50-live-mobile-qa/`.

Not complete:

- 266 ASR jobs remain queued; many newly discovered source records are published only as attribution/source shells until transcript extraction succeeds;
- no unreviewed new insight cards were auto-promoted.

Next step:

- commit/push the public-safe pipeline script and memory updates, then run a focused ASR/source-review slice before the next card-promotion pass.

## 2026-06-11 — Unified mobile navigation across WordPress and Base2026

User reported that the WordPress hamburger menu and Base2026 hamburger menu had diverged: the WordPress drawer was dark and navigated directly from `Base2026`, while the Base2026 drawer was light but had an awkward pre-open submenu and inconsistent CTA hover behavior.

Actions taken:

- injected the same Base2026 submenu into the WordPress Kadence menu from `functions.php`;
- changed the WordPress mobile `Base2026` parent click so it opens the submenu instead of navigating away;
- restyled the WordPress mobile drawer as the same compact light floating panel used by Base2026;
- changed Base2026 generated headers so the mobile Base2026 submenu is closed by default and opens in-place;
- bumped Base2026 cache-bust to `20260611-mobilemenu1`;
- deployed Base2026 release `base2026-mobile-menu-unified-ay47b-20260611`;
- deployed WordPress child theme CSS `1.5.38`.

Verification:

- live WordPress mobile menu: `Base2026` click stays on the current page, submenu changes from hidden to grid, submenu links are 13.5px, horizontal overflow is 0, console errors are 0;
- live Base2026 mobile menu: submenu is closed by default, opens in place, panel is the same light floating style, horizontal overflow is 0, console errors are 0;
- evidence under ignored `output/evidence/mobile-menu-unified-final-v2/`.

Next step:

- stage audited public-safe files, commit, push `main`, then continue GSC indexing and the reviewed intake pipeline.

## 2026-06-11 — Base2026 mobile menu spacing hotfix and ay48 deploy

User pointed out that the Base2026 mobile drawer still looked wrong: the `Base2026` item appeared pressed into the left edge of the panel and the translucent drawer allowed the page breadcrumb behind it to visually bleed through.

Actions taken:

- made the Base2026 mobile drawer background opaque `#fffaf0` instead of translucent;
- increased mobile drawer internal padding;
- added a stronger left offset for the Base2026 submenu links;
- bumped Base2026 cache-bust to `20260611-mobilemenu2`;
- deployed `base2026-mobile-menu-padding-ay48-20260611` with `-SkipReindex`.

Verification:

- live `/knowledge/` mobile QA confirmed CSS `20260611-mobilemenu2`;
- drawer panel background is opaque `rgb(255, 250, 240)`;
- Base2026 summary offset is 17px from panel left;
- first submenu link offset is 39px from panel left;
- horizontal overflow is 0 and console errors are 0;
- evidence under ignored `output/evidence/base2026-mobile-menu-padding-ay48-live/`.

Next step:

- stage audited public-safe files, commit, push `main`, then continue GSC indexing and the reviewed intake pipeline.

## 2026-06-11 — Full creator TikTok refresh and ay52 deploy

User asked to run the whole pipeline because new videos may have appeared, process them, and deploy after the work.

Actions taken:

- verified repo status and project memory before running intake;
- ran the default check-only refresh and confirmed the tracked discovery config only covers `@joshuamaraney` and `@webhivedigital`;
- created an ignored `.planning` runtime config for all four indexed TikTok creators and ran full check-only inventory at playlist depth 1000;
- found 5 new active rows: 3 for `@build_in_public` and 2 for `@tjrobertson52`;
- canonicalized the temporary `@build_in_public` creator id back to existing `tiktok-build-in-public`;
- transcribed all 5 new videos from captions; ASR fallback was not needed;
- ran deterministic faithful polish for the 5 new clean transcripts: 3 passed, 2 retained honest `needs_review` QA flags because the raw caption text may need audio/source review;
- rebuilt SQLite, ran `kb-audit.py`, exported public TikTok data, and validated excerpt-only public export policy;
- generated 21 local insight-card candidates for the 5 new sources, evidence-verified all 21, promoted 6 reviewed candidates, and left 15 private as `needs_human`;
- deployed `base2026-tiktok-refresh-ay52-20260611` and reindexed Meilisearch with 1703 passages.

Verification:

- public export policy passed with `include_full_transcripts=false`;
- live export counts: 1214 source records, 1703 passages, 1559 insight cards, 1103 public insight cards, 1452 topics, 1044 public topics;
- live `/knowledge/static/documents.jsonl` has 1214 rows and includes all 5 new videos;
- all 5 new source pages return 200, contain `Source Excerpt`, and do not show the old empty-source message;
- the 6 promoted public-card claim texts are present on the expected live source pages;
- live mixed WordPress/Base2026 visual QA passed with 66 checks and 0 failures.

Not complete:

- reviewed candidate imports/promotions are not yet durable across a clean `build-kb-sqlite.py` rebuild; future card backfill needs a replay/persistence layer before being called fully production-grade;
- 794 historical transcript polish QA files still say `needs_review`;
- 3 source-review rows remain;
- 15 ay52 candidates remain private as `needs_human`.

Next step:

- stage audited public-safe script/docs changes, commit, push `main`, then implement durable reviewed-candidate replay before the next larger card backfill.

## 2026-06-11 — Durable candidate replay, full refresh check, and ay53 deploy

User asked to run the whole pipeline again because new videos may have appeared, process them, and deploy after the work.

Actions taken:

- implemented durable approved-candidate replay:
  - `scripts/base2026-promote-insight-candidates.py` now archives promoted `insight_card_candidate` rows to ignored `12_knowledge-base/sources/tiktok/insight-candidates/reviewed-candidates.jsonl`;
  - `scripts/build-kb-sqlite.py` now replays `approved/reviewed/public` candidate rows from that ignored archive during clean SQLite rebuilds;
  - `scripts/kb-audit.py` now allows the expected claim-count difference when it equals the `insight_card_candidate` count;
- backfilled the ignored reviewed-candidate archive from the 6 already approved ay52 candidates;
- fixed `scripts/hermes-tiktok-refresh.ps1` so its final public export uses `--auto-promote-insights` and does not accidentally publish a reduced public-card export;
- ran full all-creator TikTok refresh with `.planning/tiktok-intake-all-creators-20260611.json`;
- found 0 new videos: `@build_in_public` added 0, `@tjrobertson52` added 0, `@joshuamaraney` added 0, `@webhivedigital` added 0;
- confirmed 0 queued transcripts, 0 `needs_asr`, 0 queued ASR jobs, and 0 missing polish files;
- rebuilt SQLite, exported public TikTok data, packaged, deployed, and reindexed Meilisearch as `base2026-pipeline-refresh-ay53-20260611`.

Verification:

- clean SQLite rebuild imported `reviewed_candidate_claims=6`;
- `kb-audit.py` passed;
- `check-public-export-policy.py public-data/tiktok` passed with `include_full_transcripts=false`, 1214 source records, 1703 passages, 1544 insight cards, 1103 public insight cards, 1446 topics, and 1044 public topics;
- publication boundary audit passed with 0 forbidden paths and 0 secret findings;
- GitHub metadata validation passed;
- live deploy current symlink points to `/var/www/base2026-knowledge/releases/base2026-pipeline-refresh-ay53-20260611`;
- live `/knowledge/`, sample source page, sample creator page, sitemap, and `documents.jsonl` checks passed;
- live `documents.jsonl` has 1214 rows with no `claims` field and no full transcript fields;
- live static CSS/JS return gzip and immutable cache headers;
- mixed WordPress/Base2026 visual QA passed: 66 checks, 0 failures, evidence under ignored `output/evidence/mobile-visual-qa-live-ay53/`.

Next step:

- stage audited public-safe script/docs changes, commit, push `main`, then continue the source-review/transcript-QA queue and GSC/GA4 launch monitoring.

## 2026-06-11 — ay54 private-candidate export gate and full default refresh

User asked to run the whole pipeline again because new videos may have appeared, process them, and deploy after all work.

Actions taken:

- ran a full default TikTok refresh and found a configuration problem: the ignored dated queue checked only `@joshuamaraney` and `@webhivedigital`;
- reran the full refresh with the existing all-creator runtime config and verified all four public creators: `@build_in_public`, `@tjrobertson52`, `@joshuamaraney`, and `@webhivedigital`;
- found 0 new videos across all four creators, 0 queued transcripts, 0 `needs_asr`, 0 queued ASR jobs, and 0 missing polish files;
- added ignored `config/tiktok-intake-queue.local.json` locally with all four public creator sources so future default runs cover the whole current source set;
- updated committed `config/creators.example.json` to list the same four public TikTok creator sources with stable IDs;
- made private `needs_human` insight-card candidates durable by archiving report rows and replaying private queue statuses during clean local SQLite rebuilds;
- changed `export-public-tiktok.py` so non-public `insight_card_candidate` rows are excluded from public JSONL, not merely marked private;
- rebuilt SQLite, ran `kb-audit.py`, exported public TikTok data, packaged, deployed, and reindexed Meilisearch as `base2026-private-candidate-gate-ay54-20260611`.

Verification:

- clean SQLite rebuild imported `reviewed_candidate_claims=21`;
- `kb-audit.py` passed;
- `check-public-export-policy.py public-data/tiktok` passed with `include_full_transcripts=false`, 1214 source records, 1703 passages, 1544 insight cards, 1103 public insight cards, 1452 topics, and 1044 public topics;
- live deploy current symlink points to `/var/www/base2026-knowledge/releases/base2026-private-candidate-gate-ay54-20260611`;
- live `insight_cards.jsonl` has 1544 rows, 6 approved candidate cards, and 0 private candidates exported;
- live `documents.jsonl` has 1214 rows and 0 transcript/claim leaks;
- live `/knowledge/`, sitemap, creators index, sample source page, and sample topic page return 200;
- live static CSS/JS return gzip and immutable cache headers;
- publication boundary audit, GitHub metadata validation, and `git diff --check` passed.

Next step:

- stage audited public-safe changes, commit, push `main`, then continue with source-review/transcript-QA cleanup and GSC/GA4 launch monitoring.

## 2026-06-11 — Source-review audit gate after ay54

User asked to bring the project to Git with senior engineering discipline and no sloppy manual state.

Actions taken:

- added `scripts/tiktok-source-review-audit.py` to make parked TikTok `needs_source_review` rows auditable without publishing private source data;
- ran the audit with network probing and confirmed 3 parked rows:
  - 2 older `@tjrobertson52` fallback MP4 files have no audio stream and no subtitles;
  - 1 newer `@tjrobertson52` source is currently blocked by TikTok IP access;
- ran full transcript polish audit over 1211 polished transcripts: 0 high-risk flags, 794 `needs_review`, 417 low/pass;
- confirmed public export counts remain ay54: 1214 source records, 1703 passages, 1544 insight cards, 1103 public insight cards, 1452 topics;
- confirmed SQLite candidate queue remains 6 approved public candidate cards and 15 private `needs_human` candidates;
- updated project memory, data-source notes, status board, active queue, and publication audit allowlist for the new public-safe audit script.

Verification:

- `python3 scripts/tiktok-source-review-audit.py --probe-network --out .planning/source-review-audit-20260612-rerun.json` passed;
- `python3 scripts/tiktok-polish-audit.py --limit 2000 --json` passed with `high_risk=0`;
- `python3 scripts/check-public-export-policy.py public-data/tiktok` passed with `include_full_transcripts=false`;
- `python3 scripts/validate-github-metadata.py` passed;
- `python3 -m py_compile` passed for the touched/related pipeline scripts.

Next step:

- rerun publication boundary audit, stage only public-safe script/docs changes, commit, push `main`, then continue the 794 transcript-QA batch review and 15 private card-candidate rewrite/review queue.

## 2026-06-11 — Controller-backed transcript QA and stricter candidate review

User asked to keep working toward production level without sloppy automation or AI slop.

Actions taken:

- upgraded `scripts/tiktok-polish-audit.py` so it can emit filtered transcript-QA batches by risk and QA status, write JSON/Markdown reports under ignored `.planning/`, and report full risk/QA status counts;
- added controller commands for `tiktok-polish-audit` and `tiktok-source-review-audit` so QA work is traceable in `.planning/runs`;
- synced `scripts/stage-public-files.ps1` with the source-review audit script so publication staging and publication audit allowlists do not drift;
- hardened `scripts/base2026-review-insight-candidates.py`:
  - flags speculative claim language;
  - flags generic and overbroad suggested actions;
  - counts existing approved/reviewed/public candidate cards per source before recommending more promotions.

Verification:

- `python3 scripts/base2026-controller.py tiktok-polish-audit --limit 25 --risk review --qa-status needs_review ...` passed and produced a 25-row private QA batch from 794 review rows;
- `python3 scripts/base2026-controller.py tiktok-source-review-audit --probe-network ...` passed and confirmed the 3 source-review blocker reasons;
- `python3 scripts/base2026-controller.py review-insight-candidates --status needs_human ...` now keeps all 15 private candidates as `needs_human`;
- `python3 scripts/base2026-controller.py doctor` passed with the new audit tools detected.

Next step:

- run publication/preflight gates, commit/push the public-safe tooling/memory changes, then continue the transcript-QA batches and private card rewrite queue.

## 2026-06-12 — Full TikTok pipeline refresh and ay55 deploy

User asked to run the whole pipeline because new videos may have appeared, process them, and deploy after all work.

Actions taken:

- ran the full four-creator TikTok refresh through `scripts/hermes-tiktok-refresh.ps1` with the ignored local queue config;
- checked `@build_in_public`, `@tjrobertson52`, `@joshuamaraney`, and `@webhivedigital`;
- found 0 new videos, 0 queued transcripts, 0 `needs_asr`, 0 queued ASR jobs, and 0 missing polish files;
- rebuilt SQLite, ran `kb-audit.py`, exported public TikTok data, packaged, deployed, and reindexed Meilisearch as `base2026-full-pipeline-refresh-ay55-20260612`;
- reran source-review, transcript-QA, and private candidate-review gates.

Verification:

- public export policy passed with `include_full_transcripts=false`, 1214 source records, 1703 passages, 1544 insight cards, 1103 public insight cards, 1452 topics, and 1044 public topics;
- source-review audit still has 3 private blockers: 2 fallback media files with no audio stream and 1 TikTok IP-blocked source;
- transcript polish audit still has 0 high-risk rows and 794 historical `needs_review` rows;
- strict private candidate review kept all 15 private `needs_human` candidates unpublished;
- publication boundary audit, GitHub metadata validation, and controller doctor passed;
- live `/knowledge/`, sitemap, roadmap, and sample source page returned 200;
- live `documents.jsonl` had 1214 rows with 0 transcript/claim leaks;
- live CSS/JS returned gzip and immutable cache headers;
- full mixed live mobile visual QA passed with 66 checks and 0 failures, evidence under ignored `output/evidence/mobile-visual-qa-live-ay55/`.

Next step:

- continue controlled transcript-QA slices and private `needs_human` card rewrite/review; no new TikTok videos were available in this refresh.

## 2026-06-12 — Full TikTok refresh, source-review recovery, and ay56 deploy

User asked to run the whole pipeline again because new videos may have appeared, process them, deploy after all work, and bring the project to Git.

Actions taken:

- ran the full four-creator TikTok refresh through `scripts/hermes-tiktok-refresh.ps1` with the ignored local queue config and `PlaylistEnd=1000`;
- checked `@build_in_public`, `@tjrobertson52`, `@joshuamaraney`, and `@webhivedigital`;
- found 0 new videos, 0 queued transcripts, 0 `needs_asr`, 0 queued ASR jobs, and 0 missing polish files;
- before the refresh, retried two `needs_source_review` rows through h264-first ASR fallback, transcribed and polished them locally, rebuilt SQLite, and exported them as excerpt-only public records;
- added `scripts/tiktok-qa-review-apply.py` and controller wiring for explicit transcript-QA reviewer manifests;
- rebuilt SQLite, ran `kb-audit.py`, exported public TikTok data, packaged, deployed, and reindexed Meilisearch as `base2026-pipeline-refresh-ay56-20260612`.

Verification:

- public export policy passed with `include_full_transcripts=false`, 1214 source records, 1707 passages, 1544 insight cards, 1103 public insight cards, 1452 topics, and 1044 public topics;
- source-review audit now has 1 private blocker: `tiktok-video-7648746368739118350`, blocked by TikTok IP access;
- transcript polish status has 1213 transcribed/clean/polished transcripts, 0 missing polished files, and 794 historical `needs_review` QA flags;
- publication boundary audit, GitHub metadata validation, controller doctor, and Python compile checks passed;
- live `/knowledge/`, sitemap, roadmap, support, and a sample source page returned 200;
- live `documents.jsonl` has 1214 rows, 0 full-public transcript rows, and empty public `transcript` payloads under the excerpt-only policy;
- live CSS/JS returned gzip and immutable cache headers;
- full mixed live mobile visual QA passed with 66 checks and 0 failures, evidence under ignored `output/evidence/mobile-visual-qa-live-ay56/`.

Next step:

- commit and push the public-safe pipeline/QA tooling and memory updates; then continue controlled transcript-QA batches and private `needs_human` card rewrite/review.

## 2026-06-12 — Needs-human card review, transcript QA triage, and ay57 deploy

User asked to continue the pipeline honestly, process anything new, deploy after the work, and bring the project to Git.

Actions taken:

- confirmed the ay56 all-creator TikTok refresh had already found 0 new videos and left 0 queued transcripts, 0 `needs_asr`, 0 queued ASR jobs, and 0 missing polish files;
- added `scripts/tiktok-qa-triage.py` to categorize the 794 historical transcript QA flags without bulk-passing uncertain transcript text;
- added `scripts/base2026-prepare-needs-human-review.py` to convert `needs_human` candidate reports into private review-packet JSONL inputs;
- extended `scripts/base2026-import-claim-candidates.py` with `--default-archive` so approved reviewed candidates are written to SQLite and the ignored private replay archive in one step;
- added controller wiring for `prepare-needs-human-review`, `tiktok-qa-triage`, and archived candidate imports;
- reviewed the 15 private `needs_human` candidates: 8 rewritten and promoted after exact evidence verification, 5 rejected, and 2 left private for source/audio verification;
- rebuilt SQLite from the private replay archive, exported public TikTok data, deployed `base2026-reviewed-cards-ay57-20260612`, and reindexed Meilisearch.

Verification:

- transcript QA triage: 576 audio-verification rows, 193 entity/spelling rows, and 25 human text-review rows;
- clean SQLite rebuild replayed 29 reviewed/private candidate rows;
- public export policy passed with `include_full_transcripts=false`, 1214 source records, 1707 passages, 1552 insight cards, 1111 public insight cards, 1460 topics, and 1052 public topics;
- live deploy active release is `base2026-reviewed-cards-ay57-20260612`;
- live `documents.jsonl` has 1214 rows;
- live CSS/JS returned gzip and long-lived cache headers;
- live mixed mobile visual QA passed with 66 checks and 0 failures, evidence under ignored `output/evidence/mobile-visual-qa-live-ay57-20260612/`.

Next step:

- commit and push public-safe tooling/memory changes; continue transcript QA triage slices and retry the remaining TikTok IP-blocked source only when accessible.

## 2026-06-12 — ay58 full creator refresh, candidate resolver, transcript QA slice, deploy

User asked to run the whole pipeline because new videos may have appeared, process them, deploy after all work, and bring public-safe changes to Git.

Actions taken:

- ran `scripts/hermes-tiktok-refresh.ps1` against ignored `config/tiktok-intake-queue.local.json` with the latest 80 public posts per configured creator;
- refresh found 0 new videos, 0 queued transcripts, 0 `needs_asr`, 0 queued ASR jobs, and 0 missing polish files;
- added `scripts/base2026-resolve-candidate-decisions.py` and controller wiring so old reviewed `needs_human` candidate rows are resolved after rewrite/reject decisions instead of reappearing after clean rebuilds;
- applied the resolver to the ignored private reviewed-candidates archive and local SQLite: 8 old rows marked `reject_candidate` because they were superseded by rewritten approved cards, 5 marked `rejected`, 2 left private as `needs_human`;
- ran a conservative transcript-QA human-text slice: 8 clean technical artifact rows passed, 17 source-sensitive rows stayed `needs_review`;
- rebuilt SQLite, exported public TikTok data, deployed `base2026-pipeline-refresh-ay58-20260612`, and reindexed Meilisearch.

Verification:

- public export policy passed with `include_full_transcripts=false`, 1214 source records, 1707 passages, 1552 insight cards, 1111 public insight cards, 1460 topics, and 1052 public topics;
- source-review audit still has 1 private blocker: `tiktok-video-7648746368739118350`, blocked by TikTok IP access;
- transcript QA triage now has 786 `needs_review` rows: 576 audio-verification, 193 entity/spelling, and 17 human text-review;
- reviewed insight-card candidate queue now shows only 2 private `needs_human` rows;
- controller doctor, publication boundary audit, GitHub metadata validation, Python compile, export policy, and `git diff --check` passed;
- live `/knowledge/`, `documents.jsonl`, sitemap, roadmap, and source-policy returned 200;
- live mixed mobile visual QA passed with 66 checks and 0 failures, evidence under ignored `output/evidence/mobile-visual-qa-live-ay58/`.

Next step:

- commit and push the public-safe resolver/tooling/memory changes; then continue transcript QA audio/entity slices and retry the IP-blocked source when TikTok access is available.

## 2026-06-12 — ay59 full creator refresh, safe card sync, deploy

User asked to run the whole pipeline again because new videos may have appeared, process them, and deploy after all work.

Actions taken:

- ran `scripts/hermes-tiktok-refresh.ps1` against ignored `config/tiktok-intake-queue.local.json` with the latest 80 public posts per configured creator;
- refresh found 0 new videos, 0 queued transcripts, 0 `needs_asr`, 0 queued ASR jobs, and 0 missing polish files;
- imported one additional exact-evidence Fable/software-engineering insight card through the private reviewed-candidate archive before this run, then rebuilt/exported the public dataset;
- retried the source-review audit with network probing; the only remaining source-review row is still blocked by TikTok IP access;
- deployed `base2026-night-card-refresh-ay59-20260612` and reindexed Meilisearch.

Verification:

- public export policy passed with `include_full_transcripts=false`, 1214 source records, 1707 passages, 1553 insight cards, 1112 public insight cards, 1460 topics, and 1053 public topics;
- live `documents.jsonl` has 1214 rows, 0 full transcript payloads, and 0 raw `claims` fields;
- live sitemap index has 4 child sitemap files;
- live Meilisearch search proxy returned results for `Fable software engineering`;
- live CSS returned gzip and long-lived immutable cache headers;
- publication boundary audit and GitHub metadata validation passed;
- live mixed mobile visual QA passed with 66 checks and 0 failures, evidence under ignored `output/evidence/mobile-visual-qa-live-20260612-ay59/`.

Next step:

- continue controlled transcript-QA slices and retry the remaining TikTok IP-blocked source when access is available; keep the remaining private `needs_human` candidate unpublished until source/audio evidence resolves it.

## 2026-06-12 — ay60 human-text transcript QA slice and deploy

User's overnight goal is to keep closing the honest launch-quality gaps without bulk-passing uncertain transcript text or publishing private/raw material.

Actions taken:

- reran private `needs_human` card review: 1 candidate remains private because the evidence text still needs source/audio verification;
- reran source-review audit with network probing: 1 `@tjrobertson52` source remains blocked by TikTok IP access;
- generated full transcript QA triage and selected the 17 human-text review rows for a controlled slice;
- corrected 8 obvious polished-transcript artifacts: mojibake, duplicated caption tokens, `M dashes`/`em dashes`, `SEO. S`, `spamy`, domain casing, and numeric formatting;
- kept 9 source-sensitive rows in `needs_review` rather than guessing damaged phrases;
- applied an explicit private QA manifest with audit trail, rebuilt SQLite, exported public data, deployed `base2026-transcript-qa-ay60-20260612`, and reindexed Meilisearch.

Verification:

- transcript QA debt moved from 786 to 778 rows;
- current QA triage: 576 audio-verification rows, 193 entity/spelling rows, and 9 human text-review rows;
- public export policy passed with `include_full_transcripts=false`, 1214 source records, 1707 passages, 1553 insight cards, 1112 public insight cards, 1460 topics, and 1053 public topics;
- SQLite audit, controller doctor, publication boundary audit, GitHub metadata validation, and Python compile passed;
- live `documents.jsonl` has 1214 rows, 0 transcript payloads, 0 raw `claims` fields, and 0 mojibake rows;
- live corrected-source smoke confirmed `If you are not making short YouTube videos...` and no old `If you you are` text;
- live mixed mobile visual QA passed with 66 checks and 0 failures, evidence under ignored `output/evidence/mobile-visual-qa-live-20260612-ay60/`.

Next step:

- continue transcript QA through smaller audio/entity/source-verification batches; keep the remaining private card and IP-blocked source parked until stronger evidence is available.

## 2026-06-12 — ay62 intake refresh, public-text cleanup, and deploy

User asked to run the full pipeline because new TikToks may have appeared, process anything new, deploy after the work, and keep the project Git-ready.

Actions taken:

- ran `scripts/hermes-tiktok-refresh.ps1` against ignored `config/tiktok-intake-queue.local.json` with the latest 160 public posts per configured creator;
- refresh found 0 new videos, 0 queued transcripts, 0 `needs_asr`, 0 queued ASR jobs, and 0 missing polish files;
- rebuilt SQLite and exported public data: 1214 source records, 1707 passages, 1553 insight cards, 1112 public insight cards, 1460 topics, and 1053 public topics;
- deployed intermediate `base2026-intake-refresh-ay61-20260612`, then live JSONL smoke found four public mojibake/title artifacts;
- corrected those public text artifacts in private local TikTok source files, including one polished transcript QA row, rebuilt/exported again, deployed `base2026-intake-refresh-ay62-20260612`, and reindexed Meilisearch.

Verification:

- public export policy passed with `include_full_transcripts=false`;
- transcript QA debt moved from 778 to 777 rows: 575 audio-verification rows, 193 entity/spelling rows, and 9 human text-review rows;
- source-review audit still has 1 private blocker: `tiktok-video-7648746368739118350`, blocked by TikTok IP access;
- live `/knowledge/` contains the ay62 release marker;
- live `documents.jsonl` has 1214 rows, 0 mojibake rows, and 0 unsafe public full-transcript/raw-caption/claims fields;
- live Meilisearch search proxy returned results for `AI Overviews`;
- live mixed mobile visual QA passed with 66 checks and 0 failures, evidence under ignored `output/evidence/mobile-visual-qa-live-20260612-ay62/`.

Next step:

- commit and push public-safe memory updates, then continue controlled transcript QA slices and retry the IP-blocked TikTok source when network access allows.

## 2026-06-12 — ay64 source-backed entity QA cleanup and deploy

User asked to run the whole pipeline because new videos may have appeared, process them, and deploy after all work.

Actions taken:

- confirmed the previous post-ay63 intake scan found 0 new videos across the configured public creator queue;
- fixed `scripts/tiktok-qa-triage.py` so boilerplate local polish notes no longer inflate the entity queue and audio/source-verification notes classify correctly;
- expanded durable TikTok entity normalization in `scripts/tiktok-normalize-polished-entities.py` and `scripts/tiktok-faithful-polish-local.py` for source-backed public ASR/entity artifacts;
- applied an explicit ignored QA manifest for 11 source-backed entity rows, moving them from private QA review to pass;
- rebuilt SQLite, exported public data, deployed `base2026-entity-qa-cleanup-ay64-20260612`, and reindexed Meilisearch.

Verification:

- SQLite audit passed with 1214 polished transcripts, 1215 source records, and 1708 passages;
- public export policy passed with `include_full_transcripts=false`;
- transcript QA triage is now 626 review flags: 611 audio-verification rows, 6 entity/spelling rows, and 9 human text-review rows;
- live public JSONL scan found 0 tracked old ASR/entity tokens;
- targeted live source-page smoke checks confirmed corrected public names such as `Gary Illyes`, `n8n`, `Comet browser`, `Schemawriter.ai`, `Descript`, `Claude Projects`, `sourceofsources.com`, and `NPR`;
- live mixed mobile visual QA passed with 66 checks and 0 failures.

Next step:

- commit/push public-safe script and memory updates, then continue controlled transcript QA slices and retry the IP-blocked TikTok source when network access allows.

## 2026-06-12 — ay62 follow-up false-positive transcript QA cleanup

Continuation of the overnight launch-quality task after ay62 deploy.

Actions taken:

- reran transcript QA triage, private `needs_human` candidate review, and source-review audit;
- confirmed the remaining `needs_human` insight candidate should stay private because its evidence text is damaged (`click UPS`), action is empty, and the source already has public cards;
- selected only entity/spelling QA rows whose notes were boilerplate local faithful-polish notes and whose clean/polished token streams matched after allowed acronym/entity normalization;
- applied an explicit private QA manifest that moved 131 false-positive entity rows from `needs_review` to `pass`;
- rebuilt SQLite, exported public data, and reran the public export policy gate.

Verification:

- transcript QA triage moved from 777 to 646 rows: 575 audio-verification rows, 62 real entity/spelling rows, and 9 human text-review rows;
- public export counts remained unchanged: 1214 source records, 1707 passages, 1553 insight cards, 1112 public insight cards, 1460 topics, and 1053 public topics;
- public export policy passed with `include_full_transcripts=false`;
- `git diff` showed no public-data changes after rebuild/export, so no duplicate VPS deploy was needed beyond live `base2026-intake-refresh-ay62-20260612`.

Next step:

- continue only evidence-backed transcript QA slices; do not bulk-pass the remaining audio/source-sensitive rows without stronger evidence.

## 2026-06-12 — ay63 new TikTok intake, entity normalizer, and deploy

User asked to run the full TikTok pipeline again because new videos may have appeared, process them, and deploy after the work.

Actions taken:

- ran `scripts/hermes-tiktok-refresh.ps1` against ignored `config/tiktok-intake-queue.local.json`;
- refresh found 1 new `@joshuamaraney` video (`7650378444122901768`), added it to the local inventory, transcribed it from caption metadata, and produced a polish batch;
- ran local faithful polish for the new caption transcript and corrected the source-backed entity artifact `Jason Wang is a C O and founder` to `Jensen Huang is CEO and founder` using the official NVIDIA executive bio as the review source;
- added `scripts/tiktok-normalize-polished-entities.py` and expanded the existing local polish normalizer so obvious ASR/entity artifacts are fixed durably before public export;
- normalized existing private polished transcripts for public-facing artifacts including `s c o`, `Chat GBT`, `Chat GPT`, `Open AI`, `AR models`, `AR SEO`, `C m s`, `m dash`, and `Paypal`;
- rebuilt SQLite, exported public data, deployed `base2026-intake-entity-normalizer-ay63-20260612`, and reindexed Meilisearch.

Verification:

- public export policy passed with `include_full_transcripts=false`;
- local export now has 1215 source records, 1708 passages, 1553 insight cards, 1112 public insight cards, 1460 topics, and 1053 public topics;
- current queues: 0 queued transcripts, 0 `needs_asr`, 0 queued ASR jobs, and 0 missing polish files;
- live source page `/knowledge/sources/tiktok-video-7650378444122901768.html` contains `Jensen Huang` and does not contain `Jason Wang`;
- live public JSONL scan found 0 matches for the tracked ASR-slop patterns;
- live mixed mobile visual QA passed with 66 checks and 0 failures, evidence under ignored `output/evidence/mobile-visual-qa-live-20260612-ay63/`.

Next step:

- commit/push public-safe script and memory updates, then continue controlled transcript QA slices and retry the IP-blocked TikTok source when network access allows.

## 2026-06-12 — post-ay63 no-new-video pipeline scan

User asked to run the whole TikTok pipeline again because new videos may have appeared, process them, and deploy after the work.

Actions taken:

- ran `scripts/hermes-tiktok-refresh.ps1` against ignored `config/tiktok-intake-queue.local.json` with `PlaylistEnd=160`, transcript processing, rebuild, SQLite audit, and public export;
- ran a deeper `PlaylistEnd=1000` check-only inventory pass after the rebuild/export pass;
- confirmed all four configured public creator sources returned 0 added rows and 0 updated rows;
- did not deploy a duplicate VPS release because the public payload did not change after rebuild/export.

Verification:

- current local inventory remains 3014 total rows, 1215 active rows, 0 queued transcripts, 0 `needs_asr`, 0 queued ASR jobs, and 0 missing polish files;
- public export policy passed with `include_full_transcripts=false`;
- public export counts remained 1215 source records, 1708 passages, 1553 insight cards, 1112 public insight cards, 1460 topics, and 1053 public topics;
- publication boundary audit passed with 0 forbidden files and 0 secret findings;
- GitHub metadata validation passed;
- transcript QA triage remains 637 review flags: 583 audio-verification rows, 45 entity/spelling rows, and 9 human text-review rows;
- source-review audit still has 1 private blocker: `tiktok-video-7648746368739118350`, blocked by TikTok IP access.

Next step:

- continue controlled transcript QA slices and retry the IP-blocked TikTok source when network access allows; deploy only when the reviewed public payload changes.
