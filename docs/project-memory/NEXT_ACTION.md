# Next Action

Last updated: 2026-06-10

## Current next action

Continue live pipeline operation after the Base2026 ay37 GitHub/open-source readiness deploy, static asset gzip/cache optimization, and mobile source-card overflow fix.

Active phase: pipeline hardening and launch deployment after the MacBook insight-card backfill completion.

VPS SSH access is restored on MacBook through `~/.ssh/geo_contabo_ed25519` and aliases `geo` / `geo-contabo`.

Current next safe action:

1. Commit and push the ay37 public-safe GitHub readiness bundle after the final boundary audit and staged-file review.
2. Request indexing for `/pricing/`, `/about/`, and `/ai-visibility-audit/` after Google Search Console daily quota resets. Home and `/knowledge/` are already indexed; `/services/` was added to the priority crawl queue on 2026-06-10.
3. Capture the first GSC/GA4 baseline after Google has processed the submitted WordPress and Base2026 sitemaps.
4. Process the newly inventoried check-only TikTok queue through the safe local pipeline: captions/ASR decision -> import staging dry-run -> evidence verification -> reviewed promotion gate.
5. Keep public promotion gated: only `approved` and evidence-verified insight-card candidates can enter the public export.
6. Keep full automated deploy behind explicit release checks; the Mac launchd job is check-only and does not publish.
7. Continue GitHub work from the public repo `https://github.com/offflinerpsy/base2026` on default branch `main`; keep generated/private artifacts out of commits.

Task queue source of truth:

- `docs/project-memory/ACTIVE_QUEUE.md`

## What is now shipped

1. `/knowledge/` remains the main Meilisearch-backed search console.
2. Creator pages exist at `/knowledge/creators/{handle}.html`.
3. Source pages exist at `/knowledge/sources/{item_id}.html`.
4. Topic pages exist at `/knowledge/topics/{topic_id}.html`.
5. Compare pages exist at `/knowledge/compare/{topic_id}.html`.
6. Search results link to source pages and creator pages.
7. Search results show topic chips from real indexed `topics` / `topic_labels` fields.
8. Public source-dialog payload is excerpt-only by default; full third-party transcripts are not shipped in `web/static/documents.jsonl`.
9. `scripts/package-public-release.ps1` defaults to excerpt-only public export. Use `-IncludeFullTranscripts` only for private/gated review exports.
10. Singleton topic/compare pages are generated for UX but marked `noindex,follow`; only aggregate topics with at least two public insight cards are included in topic index pages.
11. Public roadmap, project story, privacy, source/content policy, support, and site-structure pages are generated from `docs/public-pages/` and deployed under `/knowledge/`.
12. Public header/footer now use the Alex Yarosh ecosystem style: Base2026 nav link, dark footer, Roadmap CTA, correction/removal email, and text-only orange header hover/active state.
13. `/knowledge/roadmap.html` now has a clean light roadmap rendered from `web/static/roadmap.js`, aligned with the main `/knowledge/` visual system.
14. `/knowledge/roadmap-dataviz-test.html` is a separate test prototype using source data from `docs/public-pages/01_ROADMAP.md`; production roadmap was promoted separately.
15. WordPress commercial pages now use the unified `Free AI Visibility Roadmap` offer and `Get My Free Roadmap` CTA.
16. WordPress and Base2026 share the cleaned header/footer hierarchy and cookie preferences flow.
17. WordPress About now uses the orange Contact-style hero with text left and Alex cutout image right.
18. WordPress Contact/About hero cutout image is constrained inside the hero card and bottom-aligned across checked desktop/mobile viewports.
19. WordPress sticky header scrolled state is compact, readable, and uses a stable dark glass layer.
20. Base2026 pages have breadcrumbs across search, topics, creators, sources, roadmap, methodology, and support.
21. Base2026 section navigation now lives in a main-header dropdown instead of a second persistent strip.
22. Search, Roadmap, and Support hero actions expose the active page state.
23. Search result cards no longer duplicate the creator handle in the metadata line.
24. Search result cards support real creator avatars from stable local `/knowledge/static/assets/creators/` assets.
25. WordPress About/Contact hero cutouts now share a balanced size and bottom alignment.
26. WordPress About method cards now match the warmer Services-style panel language and hide the small numeric labels.
27. Roadmap phase tabs are lighter, roadmap flow no longer repeats phase short labels, and the proof section is split into readable proof cards.
28. Base2026 static pages now include SEO metadata, canonical URLs, robots directives, WebPage/Search schema, and a generated `/knowledge/sitemap.xml`.
29. WordPress `robots.txt` now references the Base2026 sitemap.
30. Source record modal actions now live in the sticky header, with creator avatar and TikTok source badge shown beside the record title.
31. Static source pages now explain public evidence excerpts, related passage previews, public insight card empty states, and the full-transcript publication boundary.
32. Full project/pipeline inventory exists for GPT Pro review at `docs/project-memory/BASE2026_PIPELINE_INVENTORY_2026_06_09.md`.
33. Topic/source pages now use compact share/copy/citation/print controls, normalized single-`@` handles, structured passage cards, compact source metadata, icon-only TikTok platform display, and the `Source Excerpt` label.
34. `/knowledge/` project identity copy is more compact, links `Alex Yarosh` to `/about/`, and no longer uses the oversized duplicate independent-pilot heading.
35. Generated share bars no longer include the decorative sparkle/AI-style mark.
36. Search cards and source modal attribution show the TikTok platform mark in the same creator/date row.
37. Source modal loading uses a streaming `documents.jsonl` lookup so opening one record no longer waits on a full client-side index build.
38. Source modal `Policy / Platform / Lang` metadata lives in the sticky `.transcript-dialog-controls` area below the action buttons, not in the scrollable body.
39. Static source pages now mark source records without public evidence as `noindex,follow` and exclude them from the source index and creator latest-source cards.

## Latest verification

- Deployed release: `base2026-mobile-overflow-fix-ay37-20260610`.
- Live path: `https://aggressorbulkit.online/knowledge/`.
- Canonical root domain: `https://aggressorbulkit.online/`.
- GitHub public repository: `https://github.com/offflinerpsy/base2026`.
- Default branch: `main`.
- Launch commit: `d025d71 launch: stage Base2026 public release`.
- Live public export: 957 source records, 1396 passages, 1690 insight cards, 1226 public insight cards, 1584 topics, 1159 public topics.
- Live repair for `/knowledge/sources/tiktok-video-7648365806375488782.html`: platform caption was downloaded from TikTok subtitles, imported as public excerpt/passages, and deployed in `base2026-source-hero-ay35-20260610`.
- Source-page hero/share release: `base2026-mobile-overflow-fix-ay37-20260610`; CSS/JS cache-bust `20260610-ay37`; package sitemap has 1078 public URLs and includes the repaired source page.
- Live ay37 mobile visual QA: 66 checks, 0 failures; evidence under ignored `output/evidence/mobile-visual-qa-live-ay37-20260610/`.
- Live ay37 static asset headers: CSS and JS return gzip plus immutable cache headers under `/knowledge/static/`.
- Empty source-page gate: two older `@tjrobertson52` records with no usable audio/text remain private-review/noindex candidates and are excluded from public source listings and child sitemaps.
- Live `/knowledge/sources/tiktok-video-7648365806375488782.html?qa=sourcehero1`: `.source-page-hero`, `.source-share-actions`, and `.source-hero-meta` present; `.source-meta-strip` absent; `OpenAI just announced ChatGPT sites` excerpt present; old empty-source text absent.
- Live ay35 browser QA: desktop/mobile overflow false, console errors 0, source hero desktop height 283px at 1159px viewport, source hero metadata row height 30px.
- Live ay35 evidence:
  - `output/evidence/source-hero-ay35-live/desktop.png`
  - `output/evidence/source-hero-ay35-live/mobile.png`
- Backfill queue: 0 queued sources after GPT/Codex review; 45 sources marked in ignored `.planning/reviewed-no-card-sources.jsonl` as reviewed with no promotion-safe public card.
- Live server manifest confirms 1690 insight cards and 1226 public insight cards.
- Pending insight-card candidates are closed: 150 approved, 1 rejected for missing evidence, 1 parked as `needs_human`; 0 `pending` insight-card candidates remain.
- Mac launchd check-only automation is installed and loaded as `com.base2026.hermes-tiktok-check` at 03:30 and 15:30 local time.
- Mac launchd check-only smoke run succeeded with exit code 0; it inventories only and does not import, promote, package, or deploy.
- Latest check-only inventory run found 2419 total TikTok rows, 999 active rows, 57 queued transcripts, 0 `needs_asr`, 940 transcribed, and 0 `needs_polish`.
- Public-safe repository staging completed through `scripts/stage-public-files.ps1 -Apply -SkipRemoteCheck`: 3176 files staged, boundary audit green.
- WordPress child-theme CSS `1.5.15` is live after the homepage Base2026 CTA green highlight and About hero portrait/pullquote pass.
- Live `geo` QA for CSS `1.5.15`: homepage Base2026 CTA green/white; audit CTA remains white; About desktop portrait height ratio about 0.95; desktop/mobile overflow false.
- Base2026 CSS/JS cache-bust `20260610-ay29c` is live after the share/icon/project-identity hotfix pass.
- Base2026 CSS/JS cache-bust `20260610-modalmeta3` is live after refreshing the source-modal metadata control-area release.
- Base2026 sitemap is now a sitemap index at `/knowledge/sitemap.xml` with child files `/knowledge/sitemaps/base2026-001.xml`, `/knowledge/sitemaps/base2026-002.xml`, and `/knowledge/sitemaps/base2026-003.xml`.
- Google Search Console now shows `/knowledge/sitemap.xml` as `Success`, type `Sitemap`, last read `2026-06-10`, discovered pages `1,080`.
- GSC URL Inspection on 2026-06-10: home and `/knowledge/` are already indexed; `/services/` was added to the priority crawl queue; `/pricing/`, `/about/`, and `/ai-visibility-audit/` hit the manual indexing daily quota and should be requested after reset.
- Live indexing/schema QA after sitemap-index deploy: 104 checks, 0 failures, WordPress sitemap URL count 10, Base2026 sitemap URL count 1080.
- Live `/knowledge/`: old identity copy absent, `Alex Yarosh` links to `/about/`, project identity H2 is about 23px at 1159px viewport.
- Live `/knowledge/?q=schema structured data AI Overviews keyword research`: TikTok platform badge is in the creator/date row and source modal opens successfully.
- Live source modal: TikTok mark is in the creator/date row and the label is `Source excerpt`.
- Live source modal meta controls QA: `Policy / Platform / Lang` cards render inside `.transcript-dialog-controls`; body policy grid count is 0; sticky header stays stable during modal body scroll; desktop/mobile checks have no horizontal overflow or console errors.
- Live ay33 modal meta QA: desktop/mobile cache-bust `20260610-modalmeta3`; header meta parent `.transcript-dialog-controls`; header meta cards `3`; body policy grids `0`; sticky header stable during modal body scroll; horizontal overflow false; console errors `0`.
- Live `/knowledge/topics/content-strategy.html`: share label has no decorative sparkle SVG/path, no horizontal overflow.
- Live ay29c evidence:
  - `output/evidence/ui-hotfix-ay29c-live-modal.png`
  - `output/evidence/ui-hotfix-ay29c-live-topic.png`
- Live `/knowledge/topics/content-strategy.html`: no `@@`, share actions present, 4 structured passage cards, no horizontal overflow.
- Live `/knowledge/sources/tiktok-video-7646438628347956502.html`: no `@@`, `Source Excerpt` label present, old `Public Evidence Excerpt` label absent, compact source metadata present, TikTok platform is icon-only in source metadata, no horizontal overflow.
- Live `/knowledge/?q=schema structured data AI Overviews keyword research`: selected-term close control is 14px with 10px glyph, no horizontal overflow.
- Live source/topic IA evidence:
  - `output/evidence/source-topic-ia-ay28-live-topic.png`
  - `output/evidence/source-topic-ia-ay28-live-source.png`
  - `output/evidence/source-topic-ia-ay28-live-search.png`
- Desktop Base2026 live QA passed: roadmap/support/source-policy overflow false; H1 about 35px at 1159px viewport; roadmap/support H2 about 26px; policy section H2 about 19px; evidence under ignored `output/evidence/desktop-ui-live-ay27-20260610/`.
- WordPress child-theme CSS `1.5.16` remains live after the mobile visual QA pass; footer `Cookie Preferences` now has a 24px minimum tap target.
- Mobile visual QA runner added: `scripts/mobile-visual-qa.mjs`.
- Mobile visual QA runbook added: `docs/project-memory/MOBILE_VISUAL_QA_RUNBOOK.md`.
- Final live mobile visual QA passed: 66 WordPress/Base2026 route/viewport checks, 0 failures, 0 warnings; evidence under ignored `output/evidence/mobile-visual-qa-live-20260610-final/`.
- Generated public pages: 4 creators, 957 sources, 1040 topics, 1040 compare pages.
- Generated public info pages: roadmap, story, privacy, source-policy, support, site-structure, methodology, opt-out.
- Indexable aggregate topics: 46.
- Live `documents.jsonl`: 957 records checked, `claims_field=0`, `transcripts=0`.
- Live search proxy for `AI Overviews`: 922 hits, topic fields present.
- Live `/knowledge/?q=AI Overviews`: 20 rendered result cards on desktop, 20 real creator avatars loaded, 20 inline TikTok SVG marks rendered, fake TikTok mark count 0, CSS `20260609-ay20` loaded.
- Live `/knowledge/support.html?qa=ay18`: active hero button is `Support`, no old `base-project-nav`, no horizontal overflow.
- Live `/knowledge/roadmap.html?qa=ay20-final`: 6 phase tabs, 6 flow nodes, 3 proof cards, no repeated short phase labels in flow, no horizontal overflow.
- Live `/knowledge/sitemap.xml`: sitemap index accepted by Google Search Console; child sitemap total 1080 URLs.
- Live `/robots.txt`: includes `https://aggressorbulkit.online/knowledge/sitemap.xml`.
- Live `/knowledge/?q=AI Overviews&qa=ay21-final` source modal: header actions 3, body action rows 0, avatar images 1, TikTok SVGs 1, caption preview present, overflow false, console errors 0.
- Live `/knowledge/?q=AI Overviews&qa=ay22` source modal desktop/mobile: title `Source record`, header actions 3, body action rows 0, loaded avatar 1, inline TikTok logo 1, attribution platform pills 0, info hints 5, policy cards 3, platform card TikTok logo 1, caption preview present, overflow false, console errors 0.
- Live `/knowledge/sources/tiktok-video-7647909694559767840.html?qa=ay23` source page desktop/mobile: CSS `20260609-ay23`, section info hints 3, highlighted source policy note present, related passage helper present, empty insight-card explanation present, overflow false, console errors 0.
- Data check for `tiktok-video-7647909694559767840`: source exists as `tiktok:build_in_public:7647909694559767840`, related passages 1, public insight cards 0. Empty state is data-accurate, not a rendering bug.
- Insight-card gap check: 957 source records, 1392 passages, 1548 insight cards, 1097 public insight cards, 166 sources with passages but no insight cards after the first private backfill pilot. This is a real claim-extraction/backfill gap, not only a UI issue.
- Windows scheduled task `Base2026 Hermes TikTok Check`: Ready, runs daily at 03:30 and 15:30 Minsk time, last result 0, next run 2026-06-10 03:30. It runs `hermes-tiktok-refresh.ps1 -CheckOnly -PlaylistEnd 50`, so it inventories new TikToks only and does not auto-import/deploy.
- Live Base2026 dropdown hover/focus: visible, active Search link present on `/knowledge/`, no console errors.
- Live search result cards: 20 TikTok platform badges rendered and duplicate handle metadata line removed.
- Live `/knowledge/roadmap.html`: no smart quote/dash characters detected in rendered text, footer/header present.
- Live `/knowledge/roadmap.html?qa=ay10`: enhanced roadmap true, 6 cards, nav Now/Next/Scale/Platform, statuses Done/In progress/Planned/Research, 6 expandable details, fallback present, desktop/mobile overflowX false, console errors 0.
- Live `/knowledge/roadmap.html?qa=ay11b`: CSS/JS cache-bust `20260609-ay11`, 6 cards, no dark roadmap block, desktop/mobile overflowX false, footer CTA buttons both 42px high.
- Live `/knowledge/privacy.html?qa=ay11b`: CSS `20260609-ay11`, 15 sections, correction email present, footer CTA buttons both 42px high, overflowX false.
- Live `/knowledge/?q=AI Overview&qa=ay11b`: 20 results, creator facets present, CSS `20260609-ay11`, overflowX false.
- Live `/knowledge/roadmap-dataviz-test.html?qa=ay12`: 6 phase tabs, 6 SVG nodes, 6 workload bars, 3 funding cards, 3 priority columns, source MD label present, desktop/mobile overflowX false. Only observed console error is shared `/favicon.ico` 404.
- Live `/knowledge/roadmap.html?qa=ay14c`: approved roadmap data visualization promoted to production, source-file plaque removed, 6 phase tabs, 6 SVG nodes, active SVG node uses warm orange-soft fill, 3 summary cards, proof section present, 13 live badges, all five statuses present after phase switching, no forbidden `Publish Roadmap`-style todo wording, desktop/mobile overflowX false, console errors 0.
- Domain/SSL migration: DNS for `aggressorbulkit.online` and `www.aggressorbulkit.online` points to `207.244.242.42`; nginx server_name includes both; Let's Encrypt certificate installed for both names; WordPress `home` and `siteurl` are `https://aggressorbulkit.online`; root, `/knowledge/`, and `/knowledge/roadmap.html` pass HTTPS browser smoke tests with no old IP in rendered text/HTML.
- Live main WordPress site: Base2026 header link present; footer Base2026/Roadmap links and Base2026 Roadmap CTA present; active menu state has transparent background, no pill/shadow.
- Live info page checks: `/knowledge/roadmap.html`, `/knowledge/story.html`, `/knowledge/privacy.html`, `/knowledge/source-policy.html`, `/knowledge/support.html`, and `/knowledge/site-structure.html` all return 200.
- Live sample source page: `/knowledge/sources/tiktok-video-7388244947352210734.html` returns H1 `@tjrobertson52 source record`, no stale `Reviewed` wording, and includes public excerpt/full-transcript warning.
- Live Playwright visual smoke test: 20 rendered results on desktop and mobile, 20 source buttons, no horizontal overflow, source dialog opens with policy/excerpt/caption metadata.
- Live WordPress `/about/`: theme CSS version `1.5.14`, desktop hero cutout contained and bottom-attached; method block has 2 panels, no visible numeric spans, 24px radius.
- Live WordPress `/contact/`: desktop hero cutout contained and bottom-attached after CSS `1.5.14`.
- Live WordPress sticky header after scroll: fixed header height about 62px, dark glass row background, white nav links, compact CTA.
- Live `/knowledge/creators/`: breadcrumb `Base2026 / Creator Source Profiles`, active project nav `Creators`, 4 creator cards.
- Screenshot evidence:
  - `output/evidence/about-desktop-ay17.png`
  - `output/evidence/contact-desktop-ay17.png`
  - `output/evidence/knowledge-search-desktop-ay17.png`
  - `output/evidence/knowledge-creators-desktop-ay17.png`
  - `output/evidence/about-mobile-ay17.png`
  - `output/evidence/ay18-ui-pass/about-desktop.png`
  - `output/evidence/ay18-ui-pass/contact-desktop.png`
  - `output/evidence/ay18-ui-pass/knowledge-desktop.png`
  - `output/evidence/ay18-ui-pass/support-desktop.png`
  - `output/evidence/ay18-ui-pass/about-method-desktop.png`
  - `output/evidence/ay18-ui-pass/knowledge-dropdown-desktop.png`
  - `output/evidence/ay18-ui-pass/about-mobile.png`
  - `output/evidence/ay18-ui-pass/knowledge-mobile.png`
- Packaged public UI contract check: `base2026-ui-contract-check`.
- Packaged `web/static/documents.jsonl`: 957 records checked, `claims_field=0`, `transcripts=0`.
- Sample generated source page now uses stable attribution H1 (`@tjrobertson52 source record`) instead of platform-caption H1.
- Screenshot evidence:
  - `output/evidence/knowledge-live-ay7-desktop.png`
  - `output/evidence/knowledge-live-ay7-mobile.png`
  - `output/evidence/knowledge-live-ay7-source-dialog.png`
  - `output/evidence/base2026-info-pages-ay8-live-home-results.png`
  - `output/evidence/base2026-info-pages-ay8-live-roadmap.png`
  - `output/evidence/base2026-info-pages-ay8-live-support-mobile.png`
  - `output/evidence/site-cleanup-ay15/home-desktop.png`
  - `output/evidence/site-cleanup-ay15/audit-mobile.png`
  - `output/evidence/site-cleanup-ay15/knowledge-search-ai-overviews-desktop.png`
  - `output/evidence/site-cleanup-ay16/cookie-modal-desktop.png`
  - `output/evidence/site-cleanup-ay16/knowledge-search-ai-overviews-desktop.png`

## Latest funnel cleanup verification

- WordPress theme version is `1.5.9` for CSS cache-busting.
- 12 key URLs return 200: root, services, pricing, audit form, contact, WordPress privacy, and core `/knowledge/` info pages.
- Header nav is reduced to Services, Pricing, Base2026, About, and `Get My Free Roadmap`.
- Pricing page has no `$499` conflict; the paid diagnostic package keeps the existing `$750` source-of-truth price.
- Audit form H1 is `Get a free AI Visibility Roadmap for your business`; typo `structure d clearly` is gone.
- Required form fields verified: website URL, business name, industry, market, services/products, name, work email, consent.
- Cookie banner appears, hides after Reject/Save, and footer `Cookie Preferences` reopens the dialog.
- `/knowledge/?q=AI Overviews` renders 20 cards with no console errors and no horizontal overflow.
- Header/footer internal links checked from WordPress root and Base2026 return 200.

## Exact next steps

1. Request GSC indexing for `/pricing/`, `/about/`, and `/ai-visibility-audit/` after the daily quota resets.
2. Capture the first GSC/GA4 baseline after Google has processed the submitted sitemaps.
3. Run the next checked local queue step for the queued transcripts discovered by Mac launchd check-only inventory.
4. Keep the one `needs_human` insight-card candidate private until rewritten or rejected.
5. Convert TikTok refresh from check-only to a reviewed local update flow: check -> captions/ASR -> polish -> claim extraction -> review -> import -> export -> package -> deploy gate.
6. Re-run publication boundary audit before every future GitHub push.

## Open-source readiness already added

- `README.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `.github/workflows/ci.yml`
- `scripts/deploy-public-vps.ps1`
- `scripts/generate-info-pages.py`
- `scripts/audit-publication-boundary.py`
- `scripts/apply-license.ps1`
- `scripts/preflight-github-launch.ps1`
- `scripts/stage-public-files.ps1`
- `.env.example` updated to `base2026_public_tiktok`
- `docs/PUBLICATION_STAGING_PLAN.md`
- `docs/PUBLICATION_AUDIT_REPORT_2026_06_08.md`
- `docs/LICENSE_DECISION_NOTES.md`
- `docs/GITHUB_LAUNCH_CHECKLIST.md`
- `.github/pull_request_template.md`
- `.github/ISSUE_TEMPLATE/`
- `.github/dependabot.yml`
- `.github/workflows/scorecard.yml`
- `scripts/validate-github-metadata.py`

## Latest publication audit

MacBook publication audit after migration passes:

- `python3 scripts/audit-publication-boundary.py`
- changed files: 3168
- public-safe candidates: 3168
- needs review: 0
- forbidden: 0
- secret findings: 0

`python3 scripts/validate-github-metadata.py` passes.

`pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/preflight-github-launch.ps1 -SkipRemoteCheck -SkipExportPolicy -SkipLiveCheck` passes on MacBook.

## GitHub publication

Published on 2026-06-10:

- Repository: `https://github.com/offflinerpsy/base2026`
- Visibility: public
- Default branch: `main`
- Staging branch also pushed: `codex/github-publication-staging`
- Pre-push checks:
  - `python3 scripts/audit-publication-boundary.py`
  - `python3 scripts/validate-github-metadata.py`
  - `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/preflight-github-launch.ps1 -SkipRemoteCheck -SkipExportPolicy -SkipLiveCheck`

`pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/stage-public-files.ps1 -SkipPreflight -SkipLicenseCheck -SkipRemoteCheck` dry-run passes with `stage_path_count=57` and covers all 3168 public-safe changed files without staging unless `-Apply` is passed.

Notes:

- Current branch was renamed to `codex/github-publication-staging`.
- No files are staged.
- No remote is configured yet.
- `pwsh` is installed via Homebrew as stable PowerShell 7.6.2.
- `meilisearch` is installed via Homebrew as 1.45.2.

## Latest pipeline pilot

- Controller now owns the first TikTok intake entrypoints:
  - `.venv/bin/python scripts/base2026-controller.py tiktok-metadata-extract --queue <queue.json> --out <staging.jsonl> --limit <n>`
  - `.venv/bin/python scripts/base2026-controller.py import-tiktok-staging --input <staging.jsonl>`
- `import-tiktok-staging` is dry-run by default; SQLite writes require explicit `--apply`.
- Verified on MacBook: controller `py_compile`, `doctor`, `list-runs --limit 5`, and `--help` for both new commands.
- No TikTok intake run was started during this controller patch.
- TikTok inventory no longer hardcodes creators in `scripts/tiktok-backfill-inventory.ps1`.
- `scripts/tiktok-backfill-inventory.ps1` now accepts `-CreatorsConfig`, supports public example arrays and private intake queue `creators`, and has `-ResolveCreatorsOnly` for no-network verification.
- `scripts/hermes-tiktok-refresh.ps1` can pass `-CreatorsConfig` through to inventory.
- Verified on MacBook: PowerShell AST parse for inventory/Hermes; `-ResolveCreatorsOnly` with `config/creators.example.json`; default private config count check without dumping private rows; targeted `git diff --check`.
- TikTok staging schema is now normalized at import:
  - URL priority: `canonical_url`, then `webpage_url`, then `source_url`;
  - handle, creator URL, source ID, transcript text, and quality flags are normalized before import checks;
  - yt-dlp and browser extractors now both emit canonical/webpage URL fields.
- Dry-run import over current staging file selected 26 rows and skipped 42, with no SQLite writes.
- One-file ASR smoke passed through `scripts/base2026-worker.py transcribe` using `faster-whisper` `tiny.en`, CPU/int8.
- The first `--vad-filter` run produced an empty transcript; worker now retries without VAD when that happens and records `retry_without_vad`.
- Retried smoke produced 1 segment, 10 words, and deterministic cleanup guard passed.
- TikTok staging import now reports rows, selected/skipped, existing/new, and skip reasons before apply.
- Controller `import-tiktok-staging` now supports `--limit`, `--source-id`, and `--report`.
- Current staging dry-run: 68 rows, 26 selected, 42 skipped, 26 existing, 0 new; no apply needed for this file.
- Local worker environment: `.venv` with `faster-whisper`, `ctranslate2`, and `requests`.
- Ollama runtime: working through detached `screen` session `base2026-ollama` running `/Users/alexyarosh/.local/ollama-app-resources/ollama serve` after replacing the broken Homebrew formula with `ollama-app` cask 0.30.7.
- Models available: `gemma4:12b`, `qwen3:8b`, `qwen3.5:9b`, `gemma3:4b`, `llava:latest`.
- `qwen3:8b` sample: 3 sources, 11 candidates, 9 verified, 9 imported private/pending, average 39.007 seconds/source.
- `gemma3:4b` sample: 1 source, 1 candidate, 1 exact verified, 1 imported private/pending, average 9.720 seconds/source.
- `gemma4:12b` same-current-queue benchmark: 3 sources, 1 candidate, 1 verified, 0 imported, average 49.870 seconds/source.
- `qwen3:8b` same-current-queue benchmark: 3 sources, 5 candidates, 5 verified, 0 imported, average 33.972 seconds/source.
- Routing result: do not set `gemma4:12b` as primary extractor yet; keep `qwen3:8b` optional as a local draft/prefilter and use ChatGPT Pro/GPT-5.4 or Codex packets as the primary semantic/copy quality lane for small batches.
- Review tooling added: `scripts/base2026-build-chatgpt-review-packet.py`, `scripts/base2026-apply-chatgpt-review.py`, and controller commands `build-chatgpt-review-packet` / `apply-chatgpt-review`.
- Current review packet generated: `.planning/chatgpt-review-packet-20260610-current-qwen3-8b.md` and `.planning/chatgpt-review-packet-20260610-current-qwen3-8b.json` with 3 sources, 5 candidates, and 5 public passages.
- Current source-only GPT/Codex extraction packet generated: `.planning/chatgpt-extract-packet-20260610-source-only.md` and `.planning/chatgpt-extract-packet-20260610-source-only.json` with 3 sources, 0 local candidates, and 5 public passages.
- Codex processed the 3-source source-only packet and imported 8 evidence-verified candidates as private/pending.
- Guardrails added to the GPT/Codex apply path: minimum quality score, maximum 3 new candidates per source, claim/action/evidence length limits.
- Codex processed a controlled 10-source source-only packet and imported 20 more evidence-verified candidates as private/pending.
- Local export now has 1576 insight cards, 1097 public insight cards, 1472 topics, and a queued sources estimate of 153.
- Promotion review tooling added: `scripts/base2026-review-insight-candidates.py` and controller command `review-insight-candidates`.
- Promotion review report generated: `.planning/pending-insight-candidate-review-20260610.md` / `.json`; 32 promotion candidates, 6 needs_human, 0 rejects, 38 exact evidence matches.
- SQLite backups created before import:
  - `12_knowledge-base/indexes/kb.sqlite.bak-claim-import-20260610-013338`
  - `12_knowledge-base/indexes/kb.sqlite.bak-claim-import-20260610-013639`
- Local public export now has 1548 insight cards, 1097 public insight cards, 10 private/pending backfill cards, and 0 public backfill cards.

## Parallel backlog

- ASR fallback for 36 staged TikTok records.
- Source review for out-of-scope and short-caption records.
- Separate Meilisearch indexes for sources, passages, insights, creators, and topics.
- Richer search UI tabs for Passages / Sources / Insights / Creators.
- Result card polish: keep creator avatar, handle/date, and TikTok SVG in one clean attribution line; remove the oval platform badge around TikTok; make result cards feel more polished/presentable while preserving compact scannability.
- Reviewed insight queue before stronger comparison claims.

## Do not do yet

- Do not add new TikTok creators.
- Do not use GPT-5.5 for UI work.
- Do not present Hermes as a production dependency.
- Do not publish private Base2026 research folders.
- Do not commit generated `public-data`, release zips, raw captions, audio/video, cookies, local DB files, or logs.
- Do not push to GitHub until remote and final staged diff review are approved.
