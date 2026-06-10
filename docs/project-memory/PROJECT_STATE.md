# Project State

Last updated: 2026-06-10

Base2026 is being split into a public open-source TikTok transcript search product and private local research assets.

Current public product:

- public TikTok knowledge search UI under `/knowledge/`
- Meilisearch-backed public index: `base2026_public_tiktok`
- public release deployed on VPS at `/var/www/base2026-knowledge/current`
- latest deployed release: `base2026-sitemap-index-ay31-20260610`
- canonical public domain: `https://aggressorbulkit.online`
- public dataset shape: TikTok source records, searchable passages, creator/source/topic/compare pages, public roadmap/policy/support pages, reviewed public insight cards, and excerpt-only source-dialog payload
- live search proxy fixed: nginx now adds the Meilisearch search-key Authorization header for `/knowledge-search/multi-search`

Current local repo state:

- branch: `main`
- GitHub public repository: `https://github.com/offflinerpsy/base2026`
- GitHub default branch: `main`
- working branch `codex/github-publication-staging` also exists on GitHub as the original publication staging branch
- first public-safe commit exists
- Hermes reliability pass completed: WebUI scheduled task repaired, GPT-5.4 worker script added, false ASR backlog closed
- active phase: pipeline hardening and private insight-card backfill after MacBook migration
- current UI/data-model decision: separate `Platform` filters (TikTok now, Instagram planned) from content `Topic/Category` filters
- current UI direction: light Alex Yarosh WordPress-compatible style, not the previous dark AI app shell
- GitHub publication is complete for the current public-safe source tree after final boundary audit and metadata validation
- open-source readiness files now exist locally: README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, `.github/workflows/ci.yml`
- repeatable VPS deploy script exists: `scripts/deploy-public-vps.ps1`
- public/private git boundary documented
- generated/private folders ignored in `.gitignore`

Latest verification:

- public proxy search for `AI Overviews`: 922 hits
- public export policy validation passed: 957 source records, 1392 passages, 1548 insight cards, 1097 public insight cards, 1449 topics, 1040 public topics
- live release verified: `base2026-site-funnel-clean-ay16`
- public static pages generated: 4 creator pages, 957 source pages, 1040 topic pages, 1040 compare pages
- public info pages generated and deployed: roadmap, project story, privacy, source/content policy, support, site structure, methodology, and creator opt-out
- public header/footer updated to match Alex Yarosh ecosystem: Base2026 nav link, dark footer, Roadmap CTA, orange text-only header hover/active state
- public info pages visually normalized to the light Base2026/Alex Yarosh system; roadmap no longer uses the dark standalone block
- separate roadmap data-visualization test page exists at `/knowledge/roadmap-dataviz-test.html`; it uses `docs/public-pages/01_ROADMAP.md` as source data and does not replace production `/knowledge/roadmap.html`
- production roadmap page now uses the approved data-visualization roadmap: Public Trust Foundation, Content Ingestion Pipeline, AI Knowledge Layer, Creator & Rights Controls, Analytics & Public Signals, and Monetization Layer. The production release is `base2026-roadmap-prod-ay14c`.
- domain migration completed: WordPress root and Base2026 `/knowledge/` are served over Let's Encrypt HTTPS at `https://aggressorbulkit.online`; `www.aggressorbulkit.online` is covered by the certificate and redirects to the apex domain.
- commercial site funnel cleanup deployed: WordPress header is reduced to Services, Pricing, Base2026, About, and `Get My Free Roadmap`; homepage, services, pricing, audit form, contact, privacy, footer, and cookie consent now use the `Free AI Visibility Roadmap` naming.
- Base2026 navigation/footer cleanup deployed under `/knowledge/`: agency header/footer alignment, Base2026 pilot positioning, `Creator Correction / Removal` wording, support/roadmap status cleanup, and shared cookie preferences link.
- live ay16 QA passed: 12 key URLs return 200; WordPress CSS version `1.5.9`; `/knowledge/` static cache-bust `20260609-ay16`; Playwright confirms no horizontal overflow, no console errors, cookie preferences open/reopen correctly, and `AI Overviews` search renders 20 cards.
- live ay20 QA passed: `/knowledge/` static cache-bust `20260609-ay20`; Roadmap phase tabs are lighter, roadmap flow no longer repeats the phase short labels, proof section is split into three cards; search cards render 20 real creator avatars and 20 inline TikTok SVG marks for `AI Overviews`; old fake TikTok mark count is 0; desktop checks have no horizontal overflow and no console errors.
- live ay21 QA passed: source modal actions moved to the sticky header, body action row removed, modal header shows creator avatar and TikTok source badge, caption preview remains visible and styled as an interactive disclosure.
- live ay22 QA passed: source modal header uses an inline TikTok SVG with no platform pill, title is normalized to `Source record`, policy/platform/language/evidence/caption areas have info hints, platform card includes the TikTok logo, and desktop/mobile checks have no horizontal overflow or console errors.
- live ay23 QA passed: source pages now explain `Public Evidence Excerpt`, `Related Passages`, and `Public Insight Cards` with info hints; the full-transcript public policy note is visually highlighted; empty insight-card states explain that no reviewed card is linked yet; desktop/mobile checks on `/knowledge/sources/tiktok-video-7647909694559767840.html` have no horizontal overflow or console errors.
- TikTok refresh automation reality: Windows task `Base2026 Hermes TikTok Check` runs twice daily at 03:30 and 15:30 Minsk time with `scripts/hermes-tiktok-refresh.ps1 -CheckOnly -PlaylistEnd 50`. It detects/inventories candidates only; it does not automatically polish, import, package, or deploy new TikToks yet.
- SEO readiness pass completed for Base2026 static pages: `/knowledge/`, roadmap, creators, topics, sources, and support now have meta descriptions, canonical URLs, `index,follow`, one H1, and WebPage/Search schema where appropriate.
- Base2026 sitemap is live at `https://aggressorbulkit.online/knowledge/sitemap.xml` with 1066 URLs, and WordPress `robots.txt` now includes the Base2026 sitemap alongside the WordPress sitemap.
- public policy pages now include correction/removal contact email: `offflinerpsy@gmail.com`
- Apache-2.0 license selected and applied
- indexable aggregate topics: 46; singleton topic/compare pages are `noindex,follow`
- public `/knowledge/static/documents.jsonl` verified with 957 records and `transcript_leaks=0`
- MacBook migration validation passed: required skills/memory are visible, Meilisearch and PowerShell are installed, publication boundary audit passes, GitHub metadata validation passes, and publication staging dry-run passes without staging files.
- GitHub repository `offflinerpsy/base2026` was created as public on 2026-06-10, `main` was pushed and set as the default branch, and `codex/github-publication-staging` was also pushed.
- MacBook publication dry-run: `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/stage-public-files.ps1 -SkipPreflight -SkipLicenseCheck -SkipRemoteCheck` reports `stage_path_count=57`, `changed_files=3168`, `forbidden=0`, and `secret_findings=0`.
- MacBook audit-only preflight: `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/preflight-github-launch.ps1 -SkipRemoteCheck -SkipExportPolicy -SkipLiveCheck` passes.
- local worker `.venv` created with `faster-whisper`, `ctranslate2`, and `requests`; `scripts/base2026-worker.py doctor` passes under `.venv/bin/python`.
- Ollama is running locally with `qwen3:8b`, `qwen3.5:9b`, `gemma3:4b`, and `llava:latest` available.
- GPT/Codex insight-card backfill completed for all currently exported sources with passages and no insight cards; promotion review is evidence-gated.
- current local public export after backfill completion: 1690 insight cards, 1226 public insight cards, 1584 topics, and 1159 public topics.
- backfill queue is 0 after marking 45 GPT/Codex-reviewed sources as reviewed-no-card in ignored `.planning/reviewed-no-card-sources.jsonl`.
- prepared release package: `output/releases/base2026-full-cards-ay24-20260610.zip`.
- VPS deploy access restored on MacBook with `~/.ssh/geo_contabo_ed25519` and SSH aliases `geo` / `geo-contabo`.
- `base2026-mobile-visual-qa-ay25-20260610` deployed successfully; server current symlink points to `/var/www/base2026-knowledge/releases/base2026-mobile-visual-qa-ay25-20260610`; public export confirms 957 source records, 1392 passages, 1690 insight cards, 1226 public insight cards, and 1584 topics.
- Mobile visual QA automation is live in `scripts/mobile-visual-qa.mjs` with runbook `docs/project-memory/MOBILE_VISUAL_QA_RUNBOOK.md`.
- Live mixed WordPress/Base2026 visual QA passed after mobile fixes: 66 route/viewport checks, 0 failures, 0 warnings. Evidence is under ignored `output/evidence/mobile-visual-qa-live-20260610-final/`.
- WordPress child-theme CSS `1.5.16` is live after increasing the footer `Cookie Preferences` tap target.
- Public-safe repository staging completed with `scripts/stage-public-files.ps1 -Apply -SkipRemoteCheck`; 3176 files are staged and publication boundary audit is green.
- `base2026-desktop-ui-ay27-20260610` is live after the second desktop typography correction pass; `/knowledge/` now loads `static/styles.css?v=20260610-desktopqa2`.
- Desktop UI QA passed on live roadmap, support, and source-policy after the correction: no horizontal overflow; H1 scale about 35px at 1159px viewport; roadmap/support H2 about 26px; policy section H2 about 19px.
- Live desktop UI evidence is under ignored `output/evidence/desktop-ui-live-ay27-20260610/`.
- `base2026-source-topic-ia-ay28-20260610` is live after source/topic information-architecture cleanup; `/knowledge/` now loads `static/styles.css?v=20260610-sourceia1`.
- Live source/topic/search QA passed for `/knowledge/topics/content-strategy.html`, `/knowledge/sources/tiktok-video-7646438628347956502.html`, and `/knowledge/?q=schema structured data AI Overviews keyword research`: no `@@`, no old `Public Evidence Excerpt` label, share actions present on topic/source pages, source metadata compact, TikTok platform displayed as icon-only in source metadata, selected-term close control reduced to 14px/10px, and no horizontal overflow.
- Live source/topic IA evidence is under ignored `output/evidence/source-topic-ia-ay28-live-topic.png`, `output/evidence/source-topic-ia-ay28-live-source.png`, and `output/evidence/source-topic-ia-ay28-live-search.png`.
- `base2026-ui-hotfix-ay29c-20260610` is live after removing the share-bar sparkle decoration, moving TikTok platform marks into the creator/date row on search cards and source modal attribution, rewriting the `/knowledge/` project identity block, linking Alex Yarosh to `/about/`, reducing the identity H2 to about 23px at 1159px viewport, and fixing source modal loading with streaming `documents.jsonl` lookup.
- Live ay29c QA passed: CSS/JS cache-bust `20260610-ay29c`; old identity copy absent; topic share label has no SVG/sparkle path; search result TikTok badge and source-modal TikTok mark align with creator/date; source modal opens successfully and uses `Source excerpt`; no horizontal overflow.
- `base2026-modal-meta-header-ay30-20260610` is live after moving source-modal policy/platform/language metadata from the modal body into the sticky dialog header.
- Live modal meta header QA passed: CSS/JS cache-bust `20260610-modalmeta1`; header has 3 meta cards; modal body has 0 policy grids; sticky header remains stable during body scroll; desktop/mobile checks have no horizontal overflow or console errors.
- `base2026-sitemap-index-ay31-20260610` is live after changing `/knowledge/sitemap.xml` from a single large URL set into a sitemap index with three child sitemaps under `/knowledge/sitemaps/`.
- Google Search Console accepted the updated Base2026 sitemap on 2026-06-10: type `Sitemap`, status `Success`, last read `2026-06-10`, discovered pages `1,080`.
- Live sitemap-index QA passed: root tag `sitemapindex`, child sitemap counts `400`, `400`, and `280`, total `1,080` URLs; consolidated WordPress/Base2026 indexing/schema QA passed with 104 checks and 0 failures.
- Local launch commit exists: `d025d71 launch: stage Base2026 public release`.
- MacBook check-only TikTok automation is loaded through launchd as `com.base2026.hermes-tiktok-check` and runs at 03:30 and 15:30 local time. The smoke run exits 0 and only inventories new videos; it does not import, promote, package, or deploy.
- Pending insight-card candidates are closed: 150 approved, 1 rejected for missing evidence, 1 parked as `needs_human`, and 0 remain `pending`.
- deploy script tested against `base2026-info-pages-clean-ay11b`; package zip uses POSIX archive paths, Meilisearch key handling strips CR/LF, and key info pages are verified before symlink switch
- light Alex Yarosh-compatible UI is deployed and verified on `/knowledge/`
- live screenshot evidence:
  - `output/evidence/knowledge-live-ay3-root-desktop.png`
  - `output/evidence/knowledge-live-ay3-root-results-desktop.png`
  - `output/evidence/knowledge-live-ay3-josh-dialog.png`
  - `output/evidence/knowledge-live-ay3-mobile-ai-overviews.png`
  - `output/evidence/knowledge-live-ay3-mobile-results.png`
  - `output/evidence/knowledge-live-ay4-caption-preview.png`
  - `output/evidence/knowledge-live-ay5-source-page.png`
  - `output/evidence/knowledge-live-ay6-search.png`
  - `output/evidence/knowledge-live-ay6-topic.png`
  - `output/evidence/knowledge-live-ay6-compare.png`
  - `output/evidence/knowledge-live-ay6-mobile.png`
  - `output/evidence/knowledge-live-ay6-source-dialog.png`
  - `output/evidence/base2026-info-pages-ay8-live-home-results.png`
  - `output/evidence/base2026-info-pages-ay8-live-roadmap.png`
  - `output/evidence/base2026-info-pages-ay8-live-support-mobile.png`
- ChatGPT public-product gap review is summarized in `docs/project-memory/PUBLIC_PRODUCT_GAP_REVIEW_2026_06_08.md`
- public intelligence implementation plan is summarized in `docs/project-memory/PUBLIC_INTELLIGENCE_IMPLEMENTATION_PLAN_2026_06_08.md`
- Phase 1/2/3/5 public intelligence foundation shipped: generated creator, source, topic, and compare pages are included in release packages and linked from search/search pages
- new TikTok queue prepared: `config/tiktok-intake-queue.20260608.json`
- caption-first browser extractor proved unreliable for TikTok full captions; `yt-dlp` metadata extraction worked for URL inventory and caption metadata
- `@joshuamaraney` import: 14 caption-ready records imported into local KB and public export
- current staged extraction summary: 68 videos checked, 26 caption-ready import candidates, 14 new imports, 12 duplicates, 36 need ASR, 5 out-of-scope candidates, 1 caption too short

Primary risk:

- remaining product/pipeline risk after GitHub publication: ASR fallback for 36 staged videos, source review for out-of-scope/short-caption records, automated safe promotion/deploy gates, and continued prevention of private research/raw source/generated artifact leakage.

Current pipeline risk:

- local extraction and GPT/Codex source-only card extraction work, but full automation is not complete until ASR smoke tests, batch timeout/latency controls, claim promotion review gates, and scheduled controller mode are implemented.
