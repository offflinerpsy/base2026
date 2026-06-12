# Next Action

Last updated: 2026-06-12

## Current next action

Continue launch operation after the Base2026 ay72 roadmap-status sync deploy and live QA pass.

Active phase: launch monitoring plus check-only TikTok intake pipeline hardening.

VPS SSH access is restored on MacBook through `~/.ssh/geo_contabo_ed25519` and aliases `geo` / `geo-contabo`.

Current next safe action:

1. Continue source-only GPT/Codex review batches from a freshly filtered no-card queue; promote only exact-evidence candidates that pass `review-insight-candidates`.
2. Do not use local LLMs as the primary card-extraction/rewrite path. Local models can remain installed, but current reviewed text work should use Codex/GPT review packets, preferably the ChatGPT 5.5 Medium quality lane when available.
3. Do not bulk-pass the remaining 619 transcript QA rows: every row is currently audio/source-verification sensitive.
4. Retry the remaining source-review row only when source access is available. Current known blocker: TikTok blocks access to `tiktok-video-7648746368739118350`.
5. Retry Google Search Console manual indexing for `/pricing/`, `/about/`, and `/ai-visibility-audit/` after the daily quota resets. Do not keep clicking while GSC shows `Quota Exceeded`.
6. Capture the first GSC/GA4 baseline after Google processes the submitted WordPress and Base2026 sitemaps and GA4 UI catches up with verified collect hits.
7. Keep generated `public-data`, release zips, local DB backups, `.planning`, raw media, and transcript working folders out of GitHub commits.
8. Continue GitHub work from the public repo `https://github.com/offflinerpsy/base2026` on default branch `main`.

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
40. Roadmap execution-order status markers are compact system marks instead of large visual pills; long internal statuses render as short public labels while preserving the full status in tooltip/ARIA.
41. `/knowledge/` mobile filters are now a visible top control that opens a fixed drawer with creator/source/year refinements instead of leaving filters hidden below results.
42. Base2026 static pages now use the WordPress-aligned avatar header with a desktop Base2026 dropdown and mobile hamburger menu.
43. Source-page topics render as orange hashtag text, and source policy/count metadata sits with the hero tools instead of framed topic/metadata pills.
44. `/knowledge/creators/` now uses creator cards with avatars, source/insight counts, public attribution copy, and TikTok/profile actions instead of empty text-only cards.
45. WordPress and Base2026 desktop Base2026 dropdowns have hover bridges so the submenu stays open while moving from the parent nav item into the submenu.
46. WordPress homepage/services/footer now include the acid-green Base2026 CTA/card treatment.
47. TikTok QA triage now separates boilerplate local polish notes from real entity/spelling review and recognizes audio/source verification notes more accurately.
48. Durable TikTok entity normalization now covers the ay64 source-backed public ASR/entity cleanup set, including Leadferno, Gary Illyes, Qwoted, n8n, Schemawriter.ai, Comet browser, Claude, Descript, Claude Projects, AIPodcastMatcher.com, sourceofsources.com, NPR, NotebookLM, and PowerPoint.
49. Durable TikTok entity normalization now also covers the ay65 text/entity cleanup set, including Eli Schwartz, r/MinMaxMarketing, Google My Business, Copilot, and spoken Gemini version references.
50. ay67 added 4 GPT/Codex-reviewed public insight cards from queued no-card sources and kept 5 exact-evidence candidates private after the source promotion-limit reviewer gate.
51. ay68 added 13 GPT/Codex-reviewed public insight cards from 16 queued no-card sources across two source-only batches, skipped 3 weak/fragile sources, rebuilt/exported/deployed, and reindexed Meilisearch.
52. ay69 added 15 GPT/Codex-reviewed public insight cards from 16 queued no-card sources across two source-only batches, skipped 1 giveaway/engagement source, rebuilt/exported/deployed, and reindexed Meilisearch.
53. ay70 added 20 GPT/Codex-reviewed public insight cards from two more source-only batches, rejected 1 over-source-limit candidate, rebuilt/exported/deployed, and passed 66-check live visual QA.
54. ay71 refreshed the four TikTok creator queues, found 1 new `@build_in_public` source, caption-polished it via Codex/GPT review, added 2 exact-evidence public cards for that source, rebuilt/exported/deployed, and passed 66-check live visual QA.
55. ay72 synced the public roadmap with the actual ay71 pipeline state: source metadata model and transcription workflow are marked completed; evidence-gated insight-card extraction/review, entity/topic cleanup, and moderation queue are marked in progress; source-backed public insight cards are marked live.

## Latest verification

- Deployed release: `base2026-roadmap-status-sync-ay72-20260612`.
- Live path: `https://aggressorbulkit.online/knowledge/`.
- Live ay72 public export: 1216 source records, 1709 passages, 1607 insight cards, 1165 public insight cards, 1505 topics, 1096 public topics.
- Live ay72 Meilisearch reindex: 1709 passages indexed into `base2026_public_tiktok`.
- ay70/ay71 GPT/Codex card work: 18 queued/no-card sources plus 1 new intake source reviewed from public passages, 22 exact-evidence candidates imported/promoted after reviewer gates, 1 over-limit candidate rejected, and weak/ASR-fragile sources skipped rather than forced into public cards.
- Live ay71 deploy QA: `kb-audit.py` passed; public export policy passed; live source page `/knowledge/sources/tiktok-video-7650481268206931222.html` returns the new source excerpt; 66-check mixed mobile visual QA passed with 0 failures.
- Live ay72 roadmap sync QA: live `/knowledge/static/roadmap.js` contains the updated statuses; publication boundary audit and GitHub metadata validation passed; 66-check mixed mobile visual QA passed with 0 failures.
- ay66 full four-creator refresh: `@build_in_public` 1000 discovered/0 added, `@tjrobertson52` 347/0, `@joshuamaraney` 639/0, `@webhivedigital` 1000/0; local inventory remains 3014 rows and 1215 active rows.
- Live ay63 all-creator refresh: 1 new `@joshuamaraney` row, 0 queued transcripts, 0 `needs_asr`, 0 queued ASR jobs, and 0 missing polish files. ay63 added a durable entity normalizer and source-backed the new NVIDIA founder correction before deploy.
- Post-ay63 2026-06-12 refresh: latest 160 public posts per configured creator produced 0 added rows, 0 queued transcripts, 0 `needs_asr`, and 0 missing polish; deep `PlaylistEnd=1000` inventory check-only also produced 0 added rows.
- ay64 entity QA cleanup: 11 source-backed entity rows moved from private QA review to pass through an explicit ignored manifest; triage now has 626 remaining review flags: 611 audio-verification rows, 6 entity/spelling rows, and 9 human text-review rows.
- Live ay64 public JSONL scan found 0 tracked old ASR/entity tokens; targeted live source pages confirmed `Gary Illyes`, `n8n`, `Comet browser`, `Schemawriter.ai`, `Descript`, `Claude Projects`, `sourceofsources.com`, and `NPR` render correctly.
- ay65 text/entity QA cleanup: 7 source-backed rows moved to pass; 8 unsafe rows were explicitly kept review-gated with audio/source verification reasons; triage now has 619 remaining review flags, all audio/source-verification rows.
- Live ay65 public JSONL scan found 0 tracked old text/entity tokens and confirmed public `Eli Schwartz`, `r/MinMaxMarketing`, and `Google My Business` render in the public payload.
- Durable reviewed/private candidate replay now has 62 `insight_card_candidate` rows replaying locally from ignored `12_knowledge-base/sources/tiktok/insight-candidates/reviewed-candidates.jsonl` during a clean SQLite rebuild.
- Public export gate verified: public export excludes private `needs_human` candidates; live `documents.jsonl` has 1215 rows under excerpt-only policy.
- Live ay65 deploy QA: static endpoint checks, public export policy, SQLite audit, transcript QA triage, publication boundary audit, GitHub metadata validation, live JSONL ASR-slop scan, and 66-check mixed mobile visual QA passed with 0 failures.

- Deployed release: `base2026-asr-pipeline-ay51-20260611`.
- Live path: `https://aggressorbulkit.online/knowledge/`.
- Live ay51 public export: 1209 source records, 1696 passages, 1538 insight cards, 1097 public insight cards, 1442 topics, 1040 public topics.
- Live ay51 Meilisearch reindex: 1696 passages indexed into `base2026_public_tiktok`.
- Live ay51 mobile QA: 44 checks, 0 failures, evidence under ignored `output/evidence/ay51-live-mobile-qa/`.
- Live ay51 source smoke: `/knowledge/sources/tiktok-video-7649635621287316743.html`, `/knowledge/sources/tiktok-video-7649262955514580232.html`, and `/knowledge/sources/tiktok-video-7647809342548266258.html` return 200, contain `Source Excerpt`, and do not show the old empty-source message.
- Live ay49 creator/dropdown QA: `/knowledge/creators/` CSS `20260611-creatorcta1`, 4 creator cards, 4 avatars, 4 TikTok profile links, no horizontal overflow.
- Live ay49 navigation QA: Base2026 dropdown hover path stays open on both WordPress and `/knowledge/`; submenu hit target reaches `Search`; no horizontal overflow.
- Live WordPress CTA QA: theme CSS `1.5.40`, homepage Base2026 block present, services Base2026 card present, footer Base2026 button uses acid green.
- Canonical root domain: `https://aggressorbulkit.online/`.
- GitHub public repository: `https://github.com/offflinerpsy/base2026`.
- Default branch: `main`.
- Launch commit: `c1869d8c launch: finalize Base2026 GitHub readiness`.
- Live public export: 957 source records, 1396 passages, 1692 insight cards, 1228 public insight cards, 1586 topics, 1161 public topics.
- Backfill queue: 0 queued sources after promoting 2 evidence-verified approved cards for `/knowledge/sources/tiktok-video-7648365806375488782.html`.
- Live source repair verified: `/knowledge/sources/tiktok-video-7648365806375488782.html` contains `Source Excerpt`, 4 passage cards, `AI knowledge base architecture`, and `AI workflow documentation`; old empty text is absent.
- Public export policy: `ok=true`, `include_full_transcripts=false`.
- Publication boundary audit: `forbidden=0`, `secret_findings=0`, `needs_review=0`.
- GitHub metadata validation: ok.
- Live ay46 launch UX QA: `/knowledge/` mobile filter button visible and opens drawer with creator facets; source page mobile/desktop loads CSS `20260611-launchux1`; source tags have no border/background/radius; Base2026 mobile menu opens; all checked pages have no horizontal overflow and 0 console errors. Evidence under ignored `output/evidence/launchux-live-ay46/`.
- Live ay44 roadmap QA: desktop 1159px and mobile 390px, CSS `20260611-roadmapstatus1`, 17 compact status badges, no rendered `COMPLETED - BUILT IN-HOUSE` text, no horizontal overflow, and 0 console errors. Evidence under ignored `output/evidence/roadmap-status-ay44-live-*.png`.
- Live ay41 mobile visual QA: 66 checks, 0 failures; evidence under ignored `output/evidence/mobile-visual-qa-live-20260611-mobilevideo-ay41/`.
- Live ay41 targeted checks: Base2026 header CTA is `Check My AI Visibility`; roadmap mobile/desktop overflow offenders are 0; `/knowledge/` and the inspected source page load `20260611-mobilevideo1`.
- WordPress launch readiness QA after lead-recipient fix: `siteReady=true`, `failedSteps=[]`, WordPress editability debt `0`, schema/indexing/analytics checks green.
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

1. Continue the source-only GPT/Codex review lane for queued no-card sources; promote only exact-evidence candidates that pass `review-insight-candidates`. Use GPT/Codex review packets for this text work; do not use local LLMs as the quality source.
2. Keep the 619 historical transcript QA flags open until audio/source verification exists; do not bulk-pass them.
3. Keep the remaining source-review blocker parked unless `tiktok-video-7648746368739118350` becomes accessible.
4. Request GSC indexing for `/pricing/`, `/about/`, and `/ai-visibility-audit/` after the daily quota resets.
5. Capture the first GSC/GA4 baseline after Google has processed the submitted sitemaps.
6. Continue TikTok refresh as a reviewed local update flow: check -> captions/ASR -> polish -> claim extraction -> review -> import -> export -> package -> deploy gate.
7. Re-run publication boundary audit before every future GitHub push.

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
- Current routing result: do not use local LLMs as the quality source for public card copy. Use ChatGPT Pro/GPT-5.5 Medium or Codex packets as the primary semantic/copy quality lane for small batches, then require exact evidence verification and reviewer promotion gates before export.
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

## Latest shipped UI architecture pass

- `base2026-identity-unification-ay42b-20260611` is live under `/knowledge/`.
- Source pages, creator pages, and the search modal now use the same source identity pattern: avatar, `@handle`, date where relevant, TikTok icon, compact meta chips, and icon-only share actions.
- Visible source-page titles no longer repeat `source record`; schema names can still include the machine-readable source-record phrase where useful.
- Modal policy text now reads `excerpt only`, and caption metadata uses the shorter `Caption metadata` label.
- Verification passed: publication boundary audit, GitHub metadata validation, targeted live DOM checks, and full live mixed visual QA with 66 checks and 0 failures.
- `base2026-topic-ia-ay43-20260611` is live after compacting topic pages: share icons and public insight/source/creator counts now live inside the `Topic evidence page` hero, and the hero width matches the lower content sections.

## Parallel backlog

- ASR fallback for 36 staged TikTok records.
- Source review for out-of-scope and short-caption records.
- Separate Meilisearch indexes for sources, passages, insights, creators, and topics.
- Richer search UI tabs for Passages / Sources / Insights / Creators.
- Continue polishing result cards using the canonical identity row, without creating another page-specific source/creator pattern.
- Reviewed insight queue before stronger comparison claims.
- Keep WordPress and Base2026 mobile navigation in one shared visual contract: avatar header, compact light drawer, thin Base2026 submenu links, and no direct navigation from the Base2026 parent item on mobile.

## Do not do yet

- Do not add new TikTok creators.
- Do not use GPT-5.5 for UI work.
- Do not present Hermes as a production dependency.
- Do not publish private Base2026 research folders.
- Do not commit generated `public-data`, release zips, raw captions, audio/video, cookies, local DB files, or logs.
- Do not push private/generated artifacts. Public-safe generated `web/static` output can be pushed only after boundary audit, metadata validation, and allowlist staging pass.
