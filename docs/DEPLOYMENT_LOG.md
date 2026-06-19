# Deployment Log

## 2026-06-12 — ay66 Full Pipeline Refresh Deploy

Release:

```text
base2026-full-pipeline-refresh-ay66-20260612
```

What changed:

```text
Ran the full four-creator TikTok refresh with PlaylistEnd=1000.
No new TikTok inventory rows were added and no existing rows were updated.
Rebuilt SQLite, audited the KB, exported public TikTok data, packaged, deployed, and reindexed Meilisearch.
```

Dataset:

```text
source_records=1215
passages=1708
insight_cards=1553
public_insight_cards=1113
topics=1460
public_topics=1054
creators=4
include_full_transcripts=false
```

Meilisearch:

```text
index=base2026_public_tiktok
indexed=1708
task=243
```

Verification:

```text
build-kb-sqlite.py: pass
kb-audit.py: PASS
check-public-export-policy.py: ok=true
tiktok-qa-triage: 619 needs_review, all audio_verification_required
tiktok-source-review-audit --probe-network: 1 row, source_blocked_by_tiktok_ip
review-insight-candidates --status needs_human: 1 candidate remains needs_human
audit-publication-boundary.py: forbidden=0, secret_findings=0
validate-github-metadata.py: ok
mobile-visual-qa.mjs --viewports full: 66 checks, 0 failures
```

Live smoke:

```text
/knowledge/: 200
/knowledge/static/documents.jsonl: 200
/knowledge/sitemap.xml: 200
/knowledge/roadmap.html: 200
/knowledge/creators/: 200
```

Remaining non-deploy debt:

```text
619 transcript QA rows remain private audio/source-verification debt.
1 TikTok source-review row remains blocked by TikTok IP access.
1 private needs_human insight-card candidate remains parked for source/audio verification.
```

## 2026-06-11 — ay51 ASR Pipeline Deploy

Release:

```text
base2026-asr-pipeline-ay51-20260611
```

What changed:

```text
Mac TikTok transcript processor now uses POSIX-safe yt-dlp output templates, h264-first audio fallback downloads, and the local faster-whisper worker instead of a missing whisper CLI.
No new TikTok inventory rows were found at playlist depth 1000 after ay50.
The remaining ASR queue was closed before deploy: queued transcripts=0, needs_asr=0, queued ASR jobs=0.
```

Dataset:

```text
source_records=1209
passages=1696
insight_cards=1538
public_insight_cards=1097
topics=1442
public_topics=1040
creators=4
include_full_transcripts=false
```

Meilisearch:

```text
index=base2026_public_tiktok
indexed=1696
task=183
```

Verification:

```text
build-kb-sqlite.py: pass
kb-audit.py: PASS
check-public-export-policy.py: ok=true
audit-publication-boundary.py: ok_to_stage_public_safe_candidates=true
validate-github-metadata.py: ok
mobile-visual-qa.mjs --viewports mobile: 44 checks, 0 failures
```

Live smoke:

```text
/knowledge/static/documents.jsonl: 1209 rows, transcripts_field_nonempty=0, claims_field_nonempty=0
/knowledge/sources/tiktok-video-7649635621287316743.html: 200, Source Excerpt present, empty-source text absent
/knowledge/sources/tiktok-video-7649262955514580232.html: 200, Source Excerpt present, empty-source text absent
/knowledge/sources/tiktok-video-7647809342548266258.html: 200, Source Excerpt present, empty-source text absent
```

Remaining non-deploy debt:

```text
265 clean transcripts still need faithful polish/QA.
3 source records remain in needs_source_review.
Insight-card backfill still needs source-only review and evidence-gated promotion; no unreviewed cards were promoted in this deploy.
```

## 2026-06-02 — First Public TikTok Deploy

Release:

```text
base2026-public-20260602-163921
```

Server:

```text
<server-host>
```

Public URL:

```text
https://aggressorbulkit.online/knowledge/
```

Server paths:

```text
/var/www/base2026-knowledge/releases/base2026-public-20260602-163921
/var/www/base2026-knowledge/current -> /var/www/base2026-knowledge/releases/base2026-public-20260602-163921
/var/www/base2026-knowledge/shared/meili_data
```

Dataset:

```text
documents=912
chunks=1324
creators=3
private/local files=0
```

Meilisearch:

```text
service=base2026-meilisearch
listen=127.0.0.1:7700
index=base2026_public_tiktok
```

Nginx:

```text
/                  -> existing WordPress
/knowledge/        -> Base2026 static public app
/knowledge-search/ -> search proxy; admin-like paths blocked
```

Backups:

```text
/root/alex-yarosh-nginx-pre-base2026-20260602-155311.conf
/root/alex-yarosh-nginx-pre-base2026-20260602-155121.conf
```

Verification:

```text
WordPress root: 200
/knowledge/: 200
/knowledge-search/keys: 403
nginx -t: pass
nginx: active
base2026-meilisearch: active
Meilisearch public port: localhost only
Playwright desktop/mobile: pass
```

Screenshots:

```text
base2026-vps-knowledge-desktop.png
base2026-vps-knowledge-mobile.png
```

Notes:

- Docker was not installed on the VPS, so Meilisearch was installed as a standalone Linux binary and run via systemd.
- The public app uses a search-only key embedded in the static HTML.
- The Meilisearch master key stays on the server in `/var/www/base2026-knowledge/shared/`.

## 2026-06-09 — Funnel cleanup and cookie preferences deploy

Release:

```text
base2026-site-funnel-clean-ay16
```

Public URLs:

```text
https://aggressorbulkit.online/
https://aggressorbulkit.online/knowledge/
```

Server state:

```text
/var/www/base2026-knowledge/current -> /var/www/base2026-knowledge/releases/base2026-site-funnel-clean-ay16
WordPress theme alex-yarosh version: 1.5.9
nginx: active
```

Dataset:

```text
documents=957
chunks=1392
creators=4
topics=1442
indexable_topics=46
```

Verification:

```text
12 key live URLs: 200
Meilisearch reindex: 1392 passages
/knowledge/?q=AI Overviews: 20 rendered cards
Cookie Preferences: banner hide/reopen pass
Desktop/mobile overflow: pass
Console errors: 0
```

## 2026-06-09 — About hero, sticky header, and Base2026 navigation deploy

Release:

```text
base2026-site-nav-ay17-20260609
```

Public URLs:

```text
https://aggressorbulkit.online/about/
https://aggressorbulkit.online/contact/
https://aggressorbulkit.online/knowledge/
https://aggressorbulkit.online/knowledge/creators/
https://aggressorbulkit.online/knowledge/topics/
```

Server state:

```text
/var/www/base2026-knowledge/current -> /var/www/base2026-knowledge/releases/base2026-site-nav-ay17-20260609
WordPress theme alex-yarosh version: 1.5.13
nginx: active
```

Dataset:

```text
documents=957
chunks=1392
creators=4
topics=1442
indexable_topics=46
```

Verification:

```text
About hero: new Contact-style orange hero present
Contact/About cutout: contained inside hero card and bottom-attached on checked desktop/mobile geometry
Sticky header after scroll: fixed dark glass row, about 62px height, white links, compact CTA
Base2026 project navigation: present across search, creators, topics, sources, roadmap, methodology, support
Breadcrumbs: present on search and generated Base2026 pages
/knowledge/?q=ChatGPT: 20 rendered result cards, 457 matching passages in QA run
Meilisearch reindex: 1392 passages
nginx -t: pass
```

## 2026-06-10 — ay26 Desktop Base2026 UI Polish Release

Release:

```text
base2026-desktop-ui-ay26-20260610
```

Outcome:

- reduced Base2026 desktop typography scale so policy/roadmap/support pages read less like oversized landing-page posters;
- rebuilt the production roadmap from a large SVG flow into compact phase controls plus a readable phase sequence;
- added a roadmap-style support explainer block for what support funds;
- widened generated card grids so creator/source/topic pages avoid four cramped cards on smaller desktop viewports;
- fixed the source-record modal scroll model: the page background locks while the modal is open, the dialog is contained, and only the modal body scrolls;
- updated public cache-bust to `20260610-desktopqa1`.

Verification:

```text
server current: /var/www/base2026-knowledge/releases/base2026-desktop-ui-ay26-20260610
public export policy: source_records=957, passages=1392, insight_cards=1690, public_insight_cards=1226, topics=1584, public_topics=1159
Meilisearch reindex: indexed=1392 index=base2026_public_tiktok task=127
live desktop checks: roadmap, support, source-policy, creator page overflow false
live H1 size at 1159px viewport: 46.36px
live creator card grid at 1159px viewport: 3 columns
live source modal: background locked true, dialog overflow hidden, modal body overflow auto, modal body scroll true
evidence: output/evidence/desktop-ui-live-20260610/
nginx -t: pass
```

## 2026-06-10 — ay27 Desktop Typography Correction Release

Release:

```text
base2026-desktop-ui-ay27-20260610
```

Outcome:

- corrected the ay26 desktop UI pass after live review showed typography was still too large;
- reduced Base2026 page hero H1s to about 35px at a 1159px desktop viewport;
- reduced roadmap/support product-section H2s to about 26px;
- reduced policy/content section H2s to about 19px;
- made the roadmap flow visibly compact above the fold;
- updated public cache-bust to `20260610-desktopqa2`.

Verification:

```text
server current: /var/www/base2026-knowledge/releases/base2026-desktop-ui-ay27-20260610
public export policy: source_records=957, passages=1392, insight_cards=1690, public_insight_cards=1226, topics=1584, public_topics=1159
Meilisearch reindex: indexed=1392 index=base2026_public_tiktok task=131
live CSS cache-bust: 20260610-desktopqa2
live desktop checks: roadmap, support, source-policy overflow false
live sizes at 1159px viewport: H1 34.77px, roadmap/support H2 26.0775px, policy section H2 19px
evidence: output/evidence/desktop-ui-live-ay27-20260610/
nginx -t: pass
```

Evidence:

```text
output/evidence/about-desktop-ay17.png
output/evidence/contact-desktop-ay17.png
output/evidence/knowledge-search-desktop-ay17.png
output/evidence/knowledge-creators-desktop-ay17.png
output/evidence/about-mobile-ay17.png
```

## 2026-06-09 — ay18 About/contact balance and Base2026 dropdown navigation

Release:

```text
base2026-nav-dropdown-ay18-20260609
```

Server state:

```text
/var/www/base2026-knowledge/current -> /var/www/base2026-knowledge/releases/base2026-nav-dropdown-ay18-20260609
WordPress theme alex-yarosh version: 1.5.14
Meilisearch index: base2026_public_tiktok
nginx -t: pass
```

Outcome:

- balanced the Alex cutout geometry on WordPress `/about/` and `/contact/`;
- restyled the About method block to the Services-style warm editorial panel and hid the small `01` / `02` markers;
- removed the persistent Base2026 project nav strip from generated public pages;
- moved Base2026 section navigation into the main header dropdown on `/knowledge/` pages;
- added active states for page hero navigation buttons on Search, Roadmap, and Support;
- simplified search result attribution by removing the duplicate handle line;
- added public UI/data support for `avatar_url` and a cleaner TikTok platform badge fallback. Real creator avatar URLs are not present in current public source data.

Verification:

```text
public export: 957 documents, 1392 passages, 1538 insight cards, 1442 topics
Meilisearch reindex: 1392 passages
/knowledge/?q=AI Overviews: 20 rendered cards
Base2026 dropdown: visible on hover/focus, active Search link present
Old base-project-nav: 0 instances in checked generated pages
About/Contact hero: cutout 446x403 in desktop QA, bottom delta 1px, head/right edge inside hero
About method: 2 panels, no visible number spans, 24px radius, no horizontal overflow
Desktop/mobile overflow: pass
Console errors: 0
```

Evidence:

```text
output/evidence/ay18-ui-pass/about-desktop.png
output/evidence/ay18-ui-pass/contact-desktop.png
output/evidence/ay18-ui-pass/knowledge-desktop.png
output/evidence/ay18-ui-pass/support-desktop.png
output/evidence/ay18-ui-pass/about-method-desktop.png
output/evidence/ay18-ui-pass/knowledge-dropdown-desktop.png
output/evidence/ay18-ui-pass/about-mobile.png
output/evidence/ay18-ui-pass/knowledge-mobile.png
```

## 2026-06-09 — ay20 Roadmap, TikTok attribution, and SEO readiness

Release:

```text
base2026-roadmap-tiktok-seo-ay20-20260609
```

Outcome:

- softened Roadmap phase tab typography;
- changed Roadmap flow so it no longer repeats the phase short labels;
- split `What this roadmap proves` into three readable proof cards;
- added `scripts/fetch-tiktok-avatars.py` and stable creator avatar assets under `/knowledge/static/assets/creators/`;
- replaced the handmade TikTok badge mark with an inline TikTok SVG mark;
- generated and deployed `/knowledge/sitemap.xml`;
- added Base2026 sitemap reference to WordPress `robots.txt`;
- added Base2026 meta descriptions, canonical URLs, robots directives, Open Graph tags, and WebPage/Search schema.

Verification:

```text
Meilisearch reindex: 1392 passages
Base2026 sitemap: 1066 URLs
/robots.txt: includes https://aggressorbulkit.online/knowledge/sitemap.xml
/knowledge/roadmap.html: 6 phase tabs, 6 flow nodes, 3 proof cards, duplicate flow labels false, overflow false
/knowledge/?q=AI Overviews: 20 results, 20 real avatars, 20 TikTok SVG marks, fake marks 0, overflow false
Base2026 SEO head: checked pages have descriptions, canonicals, index/follow, one H1, and schema
nginx -t: pass
```

## 2026-06-09 — ay21 Source modal polish

Release:

```text
base2026-source-modal-ay21-20260609
```

Outcome:

- moved source modal action buttons from the body into the sticky modal header;
- added creator avatar and TikTok source badge to the modal header attribution line;
- styled header actions with clearer hover/focus states and an accent primary action;
- improved platform caption disclosure styling.

Verification:

```text
/knowledge/?q=AI Overviews&qa=ay21-final source modal:
css ay21 true
header actions 3
body action rows 0
avatar images 1
TikTok SVGs 1
caption preview present
overflow false
console errors 0
Meilisearch reindex: 1392 passages
nginx -t: pass
```

## 2026-06-09 — ay22 Source modal premium pass

Release:

```text
base2026-source-modal-premium-ay22-20260609
```

Outcome:

- removed the platform pill from the modal attribution line;
- kept creator avatar, handle/date, and bare TikTok SVG in a clean attribution row;
- normalized modal title to `Source record` to avoid duplicate creator/title text;
- added info hints for public policy, platform, language, evidence excerpt, and platform caption metadata;
- added TikTok SVG to the platform metadata card;
- improved mobile modal sizing and header flow.

Verification:

```text
desktop and mobile /knowledge/?q=AI Overviews&qa=ay22:
css ay22 true
title Source record
header actions 3
body action rows 0
loaded avatar 1
inline TikTok logo 1
attribution platform pills 0
info hints 5
policy cards 3
platform card TikTok logo 1
caption preview present
overflow false
console errors 0
Meilisearch reindex: 1392 passages
nginx -t: pass
```

## 2026-06-09 — ay23 Source page explainers

Release:

```text
base2026-source-page-explainers-ay23-20260609
```

Outcome:

- added info hints to generated source-page sections: `Public Evidence Excerpt`, `Related Passages`, and `Public Insight Cards`;
- highlighted the full-transcript publication boundary as a policy note instead of a muted paragraph;
- clarified that related passages are public discovery snippets and may be shortened;
- replaced the vague empty insight-card state with a data-accurate explanation.

Verification:

```text
/knowledge/sources/tiktok-video-7647909694559767840.html?qa=ay23:
css ay23 true
section info hints 3
source policy note present
related passage helper present
empty insight explanation present
desktop overflow false
mobile overflow false
console errors 0
Meilisearch reindex: 1392 passages
nginx -t: pass
```

## 2026-06-10 — ay25 Stage/Public Deploy

Release:

```text
base2026-stage-ay25-20260610
```

Outcome:

- packaged excerpt-only public Base2026 export;
- deployed release to VPS via SSH alias `geo`;
- switched `/var/www/base2026-knowledge/current`;
- reindexed Meilisearch with 1392 public chunks;
- staged public-safe repository files through `scripts/stage-public-files.ps1 -Apply -SkipRemoteCheck`.

Verification:

```text
boundary audit: changed_files=3176, public_safe_candidates=3176, needs_review=0, forbidden=0, secret_findings=0
preflight: ok
server current: /var/www/base2026-knowledge/releases/base2026-stage-ay25-20260610
public export policy: source_records=957, passages=1392, insight_cards=1690, public_insight_cards=1226, topics=1584, public_topics=1159
live documents contract: rows=957, claimLeaks=0, transcriptLeaks=0
live search proxy: AI Overviews hits=926
live URL status: /knowledge/, roadmap, story, source-policy, support, topics, creators, sample source page all 200
browser checks: desktop/mobile overflow false for knowledge, roadmap, source page, WordPress home, and WordPress about
```

## 2026-06-10 — ay25 Mobile Visual QA Release

Release:

```text
base2026-mobile-visual-qa-ay25-20260610
```

Outcome:

- added repeatable mobile visual QA runner for the mixed WordPress/Base2026 public surface;
- fixed Base2026 320px search/source overflow;
- fixed Base2026 tablet footer overflow;
- contained roadmap SVG flow inside its scroll container;
- made long Base2026 headings wrap safely;
- increased Base2026 and WordPress footer `Cookie Preferences` tap targets;
- deployed WordPress child-theme CSS `1.5.16`.

Verification:

```text
server current: /var/www/base2026-knowledge/releases/base2026-mobile-visual-qa-ay25-20260610
Base2026 CSS cache-bust: 20260610-mobileqa1
WordPress CSS version: 1.5.16
mobile visual QA: 66 checks, 0 failures, 0 warnings
evidence: output/evidence/mobile-visual-qa-live-20260610-final/
nginx -t: pass
```

## 2026-06-10 — ay28 Source/Topic IA and Share Controls

Release:

```text
base2026-source-topic-ia-ay28-20260610
```

Outcome:

- fixed generated topic/source pages so creator handles render with one `@`, not `@@`;
- added compact share/copy/citation/print controls to creator, topic, and source pages;
- replaced oversized source-page metric/topic blocks with a compact source metadata strip;
- changed source platform display to an icon-only TikTok mark in generated source pages and search badges/modals;
- renamed `Public Evidence Excerpt` to `Source Excerpt`;
- paragraphized source excerpts and passage snippets;
- rebuilt topic evidence passages as source-linked cards with creator/date context;
- reduced selected search term remove controls from oversized text crosses to small contained controls;
- bumped Base2026 cache-bust to `20260610-sourceia1`;
- deployed release to VPS through SSH alias `geo`;
- reindexed Meilisearch with 1392 public passages.

Verification:

```text
server current: /var/www/base2026-knowledge/releases/base2026-source-topic-ia-ay28-20260610
Base2026 CSS cache-bust: 20260610-sourceia1
live topic: /knowledge/topics/content-strategy.html
live source: /knowledge/sources/tiktok-video-7646438628347956502.html
live checks: no @@, no old Public Evidence Excerpt label, share actions present, source metadata compact, no visible TikTok text in source metadata, no horizontal overflow
search selected-term close: 14px control, 10px glyph
evidence: output/evidence/source-topic-ia-ay28-live-topic.png, output/evidence/source-topic-ia-ay28-live-source.png, output/evidence/source-topic-ia-ay28-live-search.png
nginx -t: pass
```

## 2026-06-10 — ay29c UI Hotfix

Release:

```text
base2026-ui-hotfix-ay29c-20260610
```

Outcome:

- removed the decorative sparkle/AI-style drawing from generated share bars;
- moved the TikTok platform mark into the same author/date row on search result cards;
- verified the source-record modal also renders the TikTok platform mark on the same author/date row;
- fixed source-record modal loading by streaming `documents.jsonl` until the requested `item_id` is found instead of waiting for a full client-side index build;
- rewrote the `/knowledge/` project identity block with clearer copy and linked `Alex Yarosh` to `/about/`;
- reduced the project identity H2 scale;
- renamed the modal `Public evidence excerpt` label to `Source excerpt`;
- bumped Base2026 cache-bust to `20260610-ay29c`;
- deployed release to VPS through SSH alias `geo`;
- reindexed Meilisearch with 1392 public passages.

Verification:

```text
server current: /var/www/base2026-knowledge/releases/base2026-ui-hotfix-ay29c-20260610
Base2026 CSS/JS cache-bust: 20260610-ay29c
live /knowledge/: old identity copy absent, About link present, identity H2 about 23px at 1159px viewport
live search: TikTok platform badge is in the creator/date row
live source modal: opens successfully, TikTok mark is in the creator/date row, label is Source excerpt
live topic share bar: no decorative sparkle SVG/path remains
overflow: false on checked pages
evidence: output/evidence/ui-hotfix-ay29c-live-modal.png, output/evidence/ui-hotfix-ay29c-live-topic.png
nginx -t: pass
```

## 2026-06-10 — ay30 Modal Meta Header

Release:

```text
base2026-modal-meta-header-ay30-20260610
```

Outcome:

- moved the source modal `Policy / Platform / Lang` metadata from the scrollable body into the sticky dialog header;
- kept source modal body focused on the policy note, topics, and `Source excerpt`;
- kept TikTok platform rendering as the platform mark, not text;
- bumped Base2026 cache-bust to `20260610-modalmeta1`;
- deployed release to VPS through SSH alias `geo`;
- reindexed Meilisearch with 1392 public passages.

Verification:

```text
server current: /var/www/base2026-knowledge/releases/base2026-modal-meta-header-ay30-20260610
Base2026 CSS/JS cache-bust: 20260610-modalmeta1
live source modal: 3 header meta cards, 0 body policy grids
sticky header: stable during modal body scroll
desktop/mobile overflow: false
console errors: 0
evidence: output/evidence/modal-meta-header-live-desktop.png, output/evidence/modal-meta-header-live-mobile.png, output/evidence/modal-meta-header-live-report.json
nginx -t: pass
```

## 2026-06-10 — ay31 Sitemap Index

Release:

```text
base2026-sitemap-index-ay31-20260610
```

Outcome:

- changed `/knowledge/sitemap.xml` from one large URL set into a sitemap index;
- generated three child sitemap files under `/knowledge/sitemaps/`;
- kept public export excerpt-only and did not change search data, UI content, or Meilisearch documents;
- deployed release to VPS through SSH alias `geo`;
- skipped Meilisearch reindex because only sitemap XML changed.

Verification:

```text
server current: /var/www/base2026-knowledge/releases/base2026-sitemap-index-ay31-20260610
live /knowledge/sitemap.xml: sitemapindex
child sitemap files: base2026-001.xml=400, base2026-002.xml=400, base2026-003.xml=280
total URLs: 1080
Google Search Console: Success, type Sitemap, last read 2026-06-10, discovered pages 1080
live indexing/schema QA: 104 checks, 0 failures
nginx -t: pass
```

## 2026-06-10 — ay32 Modal Meta Controls

Release:

```text
base2026-modal-meta-controls-ay32-20260610
```

Outcome:

- moved the source modal `Policy / Platform / Lang` metadata into the right-side sticky control area, directly below the action buttons;
- kept the scrollable modal body free of policy metadata cards;
- tightened mobile behavior so the header metadata remains a compact three-column control strip;
- bumped Base2026 cache-bust to `20260610-modalmeta2`;
- deployed release to VPS through SSH alias `geo`;
- skipped Meilisearch reindex because search documents did not change.

Verification:

```text
server current: /var/www/base2026-knowledge/releases/base2026-modal-meta-controls-ay32-20260610
Base2026 CSS/JS cache-bust: 20260610-modalmeta2
live source modal: header meta parent .transcript-dialog-controls, 3 meta cards, 0 body policy grids
desktop/mobile overflow: false
console errors: 0
evidence: output/evidence/modal-meta-controls-ay32-live/desktop.png, output/evidence/modal-meta-controls-ay32-live/mobile.png
nginx -t: pass
```

## 2026-06-10 — ay33 Modal Meta Cache Refresh

Release:

```text
base2026-modal-meta-cache-ay33-20260610
```

Outcome:

- refreshed the source-modal metadata control-area release with Base2026 cache-bust `20260610-modalmeta3`;
- synchronized `web/static/meili.html` with the package cache-bust so local source and deployed HTML stay aligned;
- kept the source modal `Policy / Platform / Lang` metadata inside `.transcript-dialog-controls`, directly below the action buttons;
- kept the scrollable modal body free of policy metadata cards;
- changed the default deploy SSH host to the working MacBook alias `geo`;
- deployed release to VPS through SSH alias `geo`;
- skipped Meilisearch reindex because search documents did not change.

Verification:

```text
server current: /var/www/base2026-knowledge/releases/base2026-modal-meta-cache-ay33-20260610
Base2026 CSS/JS cache-bust: 20260610-modalmeta3
live source modal: header meta parent .transcript-dialog-controls, 3 meta cards, 0 body policy grids
sticky header: stable during modal body scroll
desktop/mobile overflow: false
console errors: 0
nginx -t: pass
```

## 2026-06-10 — ay37 GitHub SEO Readiness and Mobile Overflow Fix

Release:

```text
base2026-mobile-overflow-fix-ay37-20260610
```

Outcome:

- generated Methodology and Creator Correction / Removal pages from `docs/public-pages/`;
- synchronized `web/static/index.html` with the current public search UI;
- fixed mobile source-page insight-card overflow by allowing card grids to shrink below 340px;
- bumped Base2026 cache-bust to `20260610-ay37`;
- added `/knowledge/static/` nginx asset optimization with gzip, `Vary: Accept-Encoding`, and immutable cache headers;
- updated GitHub repository metadata with homepage and topics;
- deployed release to VPS through SSH alias `geo`;
- reindexed Meilisearch with 1396 passages.

Verification:

```text
server current: /var/www/base2026-knowledge/releases/base2026-mobile-overflow-fix-ay37-20260610
Base2026 CSS/JS cache-bust: 20260610-ay37
public export policy: ok, include_full_transcripts=false
local static SEO metadata audit: 3294 HTML files, 0 missing title/description/canonical/H1/schema
live CSS/JS headers: Content-Encoding gzip, Vary Accept-Encoding, immutable cache
live visual QA: 66 checks, 0 failures
evidence: output/evidence/mobile-visual-qa-live-ay37-20260610/
nginx -t: pass
```
## 2026-06-11 — base2026-tiktok-refresh-ay50-20260611

- release: `base2026-tiktok-refresh-ay50-20260611`
- deployed path: `/var/www/base2026-knowledge/releases/base2026-tiktok-refresh-ay50-20260611`
- public export: 1209 source records, 1373 passages, 1538 insight cards, 1097 public insight cards, 1442 topics, 1040 public topics
- Meilisearch reindex: 1373 passages indexed into `base2026_public_tiktok`
- policy: `include_full_transcripts=false`
- QA: mobile visual runner passed 44 checks with 0 failures
- note: TikTok refresh expanded the local inventory and left 266 ASR jobs queued; no unreviewed cards were auto-promoted.

## 2026-06-12 — base2026-text-qa-cleanup-ay65-20260612

- release: `base2026-text-qa-cleanup-ay65-20260612`
- deployed path: `/var/www/base2026-knowledge/releases/base2026-text-qa-cleanup-ay65-20260612`
- reason: close remaining text/entity transcript QA bucket without bulk-passing audio-sensitive rows.
- public export: 1215 source records, 1708 passages, 1553 insight cards, 1113 public insight cards, 1460 topics, 1054 public topics.
- Meilisearch: reindexed 1708 passages into `base2026_public_tiktok`.
- verification: public export policy passed; live public JSONL scan found 0 tracked old text/entity tokens and confirmed corrected public names; mixed mobile visual QA passed with 66 checks and 0 failures.

## 2026-06-12 — base2026-entity-qa-cleanup-ay64-20260612

- release: `base2026-entity-qa-cleanup-ay64-20260612`
- deployed path: `/var/www/base2026-knowledge/releases/base2026-entity-qa-cleanup-ay64-20260612`
- reason: source-backed TikTok entity QA cleanup after the post-ay63 no-new-video scan.
- public export: 1215 source records, 1708 passages, 1553 insight cards, 1113 public insight cards, 1460 topics, 1054 public topics.
- Meilisearch: reindexed 1708 passages into `base2026_public_tiktok`.
- verification: public export policy passed; live public JSONL scan found 0 tracked old ASR/entity tokens; targeted live source pages confirmed corrected entity/product names; mixed mobile visual QA passed with 66 checks and 0 failures.

## 2026-06-12 — base2026-intake-entity-normalizer-ay63-20260612

- release: `base2026-intake-entity-normalizer-ay63-20260612`
- deployed path: `/var/www/base2026-knowledge/releases/base2026-intake-entity-normalizer-ay63-20260612`
- public export: 1215 source records, 1708 passages, 1553 insight cards, 1112 public insight cards, 1460 topics, 1053 public topics
- Meilisearch reindex: 1708 passages indexed into `base2026_public_tiktok`
- policy: `include_full_transcripts=false`
- QA: live source page for `tiktok-video-7650378444122901768` contains `Jensen Huang` and not `Jason Wang`; live public JSONL ASR-slop scan found 0 tracked bad patterns; mobile visual runner passed 66 checks with 0 failures
- note: the refresh found 1 new `@joshuamaraney` video, closed transcript/polish queues, and deployed after source-backed entity correction.

## 2026-06-12 — base2026-chatgpt-card-batch01-ay67-20260612

- release: `base2026-chatgpt-card-batch01-ay67-20260612`
- deployed path: `/var/www/base2026-knowledge/releases/base2026-chatgpt-card-batch01-ay67-20260612`
- reason: first source-only GPT/Codex review batch for queued no-card sources.
- public export: 1215 source records, 1708 passages, 1557 insight cards, 1117 public insight cards, 1464 topics, 1058 public topics.
- Meilisearch: reindexed 1708 passages into `base2026_public_tiktok`.
- policy: `include_full_transcripts=false`.
- QA: `kb-audit.py` passed; public export policy passed; live source page for `tiktok-video-7650000106489433352` contains the new `AI Workflow Automation` card context with `Claude` and `Google Calendar`; mixed mobile visual QA passed with 66 checks and 0 failures.
- note: 4 reviewed exact-evidence cards were promoted; 5 exact-evidence candidates stayed private due the source promotion-limit reviewer gate.

## 2026-06-12 — base2026-chatgpt-card-batch02-03-ay68-20260612

- release: `base2026-chatgpt-card-batch02-03-ay68-20260612`
- deployed path: `/var/www/base2026-knowledge/releases/base2026-chatgpt-card-batch02-03-ay68-20260612`
- reason: second and third source-only GPT/Codex review batches for queued no-card sources.
- public export: 1215 source records, 1708 passages, 1570 insight cards, 1129 public insight cards, 1473 topics, 1066 public topics.
- Meilisearch: reindexed 1708 passages into `base2026_public_tiktok`.
- policy: `include_full_transcripts=false`.
- QA: `kb-audit.py` passed; public export policy passed; live source page for `tiktok-video-7647713851504463117` contains the new `AI Content Workflow` card context; live topic page `/knowledge/topics/internal-linking.html` contains the new `Internal Linking` card context; mixed mobile visual QA passed with 66 checks and 0 failures.
- note: 13 reviewed exact-evidence cards were promoted; 3 weak or fragile sources were skipped.

## 2026-06-12 — base2026-chatgpt-card-batch04-05-ay69-20260612

- release: `base2026-chatgpt-card-batch04-05-ay69-20260612`
- deployed path: `/var/www/base2026-knowledge/releases/base2026-chatgpt-card-batch04-05-ay69-20260612`
- reason: fourth and fifth source-only GPT/Codex review batches for queued no-card sources.
- public export: 1215 source records, 1708 passages, 1585 insight cards, 1144 public insight cards, 1486 topics, 1079 public topics.
- Meilisearch: reindexed 1708 passages into `base2026_public_tiktok`.
- policy: `include_full_transcripts=false`.
- QA: `kb-audit.py` passed; public export policy passed; live source page for `tiktok-video-7646800096583044374` contains the new `Robots.txt` card context; live topic page `/knowledge/topics/faq-seo.html` contains the new `FAQ SEO` card context; live topic page `/knowledge/topics/ai-skills.html` contains the new `AI Skills` card context; mixed mobile visual QA passed with 66 checks and 0 failures.
- note: 15 reviewed exact-evidence cards were promoted; 1 giveaway/engagement source was skipped.

## 2026-06-18 — base2026-tiktok-refresh-ay40-20260618

- release: `base2026-tiktok-refresh-ay40-20260618`
- deployed path: `/var/www/base2026-knowledge/releases/base2026-tiktok-refresh-ay40-20260618`
- reason: canonical release-gate TikTok refresh after 4 queued sources were polished, reviewed, exported, packaged, deployed, and reindexed.
- public export: 1392 source records, 1911 passages, 1624 insight cards, 1053 public insight cards, 1516 topics, 1001 public topics, 5 creators.
- Meilisearch: reindexed 1911 passages into `base2026_public_tiktok`; deploy task `339`.
- policy: `include_full_transcripts=false`.
- QA: newest-source readiness passed after one exact-evidence `@webhivedigital` insight was reviewed/promoted; live fresh source page returned 200; live SEO crawl gate passed 500 crawled pages with 0 P0 bad links and 0 crawled error pages; mobile visual QA passed on rerun with 78 checks and 0 failures after one transient connection reset on the first run.
- note: this release introduced `scripts/base2026-release-gate.ps1` as the required command center for future data-changing releases.

## 2026-06-18 — base2026-pipeline-3sources-ay41-20260618

- release: `base2026-pipeline-3sources-ay41-20260618`
- deployed path: `/var/www/base2026-knowledge/releases/base2026-pipeline-3sources-ay41-20260618`
- reason: prove the social-discovery bridge can feed the existing TikTok pipeline through the canonical release gate without ad hoc steps.
- processed sources: `tiktok-video-7652732487843581206` (`@build_in_public`), `tiktok-video-7652742095228210450` (`@joshuamaraney`), and `tiktok-video-7652758207361731847` (`@darrenshawseo`).
- public export: 1395 source records, 1915 passages, 1625 insight cards, 1054 public insight cards, 1517 topics, 1002 public topics, 5 creators.
- Meilisearch: reindexed 1915 passages into `base2026_public_tiktok`; deploy task `343`.
- policy: `include_full_transcripts=false`.
- QA: newest-source readiness passed after one exact-evidence `@build_in_public` insight was reviewed/promoted; release contract passed; live SEO crawl gate passed 500 crawled pages with 0 P0 bad links and 0 crawled error pages; mobile visual QA passed with 78 checks and 0 failures.
- note: the 3-source queue created by the social-discovery bridge is closed live. Future creator additions should enter through discovery, importer dry-run/apply, and then `scripts/base2026-release-gate.ps1`.

## 2026-06-18 — base2026-ai-recommends-creators-ay42-20260618

- release: `base2026-ai-recommends-creators-ay42-20260618`
- deployed path: `/var/www/base2026-knowledge/releases/base2026-ai-recommends-creators-ay42-20260618`
- reason: process the AI Recommends Solutions creator pass through the canonical creator discovery/import/polish/review/release route.
- creators: `@heytonyagency`, `@iamdandavies`, `@harrysandersseo`, `@ray_fu`, and `@gobigsystems`.
- private discovery/import: 200 discovered source records across 10 configured creators; 100 new candidate rows imported into private local `videos.csv` with ignored backup.
- polish gate: 77 polished transcripts; 30 QA-pass rows shipped publicly; 47 QA-needs-review rows and 23 `needs_asr` rows stayed private/gated.
- public export: 1425 source records, 1953 passages, 1626 insight cards, 1055 public insight cards, 1518 topics, 1003 public topics, 10 creators.
- Meilisearch: reindexed 1953 passages into `base2026_public_tiktok`.
- policy: `include_full_transcripts=false`.
- QA: newest-source readiness passed after one exact-evidence `@iamdandavies` insight was reviewed/promoted for `WordPress static homepage setup`; release contract passed; publication boundary and export policy passed; live SEO crawl gate passed 500 crawled pages with 0 P0 bad links and 0 crawled error pages; mobile visual QA passed with 78 checks and 0 failures.
- note: `scripts/hermes-tiktok-refresh.ps1 -AfterPolish` was fixed before the successful deploy so release packaging skips inventory/caption intake and cannot silently expand the private queue.

## 2026-06-19 — base2026-ai-recommends-readiness-fix-ay44-20260619

- release: `base2026-ai-recommends-readiness-fix-ay44-20260619`
- deployed path: `/var/www/base2026-knowledge/releases/base2026-ai-recommends-readiness-fix-ay44-20260619`
- reason: supersede the ay43 intermediate package after `-LatestReadiness 3` caught two fresh `@gobigsystems` source-only pages that needed reviewed public Source Intelligence before launch.
- private review/import: mechanically cleaned and approved 3 caption-polish rows through `tiktok-qa-review-apply.py`; added 3 exact-evidence reviewed Source Intelligence cards for the latest AI Recommends pass.
- public export: 1450 source records, 1978 passages, 1629 insight cards, 1058 public insight cards, 1521 topics, 1006 public topics, 10 creators.
- Meilisearch: reindexed 1978 passages into `base2026_public_tiktok`.
- policy: `include_full_transcripts=false`.
- QA: `-LatestReadiness 3` passed with 0 blockers; publication boundary, GitHub metadata, public export policy, and public release contract passed; live SEO crawl gate passed 500 crawled pages with 0 P0 bad links and 0 crawled error pages; mobile visual QA passed with 78 checks and 0 failures; live smoke confirmed the two `@gobigsystems` pages render `Source Intelligence`.

## 2026-06-19 — base2026-asr-gobig-pipeline-ay45-20260619

- release: `base2026-asr-gobig-pipeline-ay45-20260619`
- deployed path: `/var/www/base2026-knowledge/releases/base2026-asr-gobig-pipeline-ay45-20260619`
- reason: retry audio-backed source-review rows through ASR and ship only the one QA-pass recovered `@gobigsystems` source.
- public export: 1452 source records, 1980 passages, 1629 insight cards, 1058 public insight cards, 1521 topics, 1006 public topics, 10 creators.
- Meilisearch: reindexed 1980 passages into `base2026_public_tiktok`.
- policy: `include_full_transcripts=false`.
- QA: release gate passed with `-LatestReadiness 3`; live SEO crawl gate passed 500 pages with 0 P0 bad links and 0 crawled error pages; mobile visual QA rerun passed 78 checks with 0 failures after one transient Meilisearch reset on the first attempt.
- note: 13 audio-backed rows stayed private because ASR produced too little/no usable speech.

## 2026-06-19 — base2026-gobig-readiness-card-ay46-20260619

- release: `base2026-gobig-readiness-card-ay46-20260619`
- deployed path: `/var/www/base2026-knowledge/releases/base2026-gobig-readiness-card-ay46-20260619`
- reason: add one strict exact-evidence Source Intelligence card for `Google Business Profile Categories` after newest-source readiness caught one ay45 source-only `@gobigsystems` row.
- public export: 1452 source records, 1980 passages, 1630 insight cards, 1059 public insight cards, 1521 topics, 1007 public topics, 10 creators.
- Meilisearch: unchanged at 1980 passages because passage data did not change.
- policy: `include_full_transcripts=false`.
- QA: newest-source readiness, public export policy, public release contract, and live smoke passed.

## 2026-06-19 — base2026-source-review-local-caption-ay47-20260619

- release: `base2026-source-review-local-caption-ay47-20260619`
- deployed path: `/var/www/base2026-knowledge/releases/base2026-source-review-local-caption-ay47-20260619`
- reason: ship three local-caption source-review rows after mechanical transcript cleanup, explicit QA pass, and guarded CSV clearance back to `transcribed`.
- public export: 1455 source records, 1986 passages, 1630 insight cards, 1059 public insight cards, 1521 topics, 1007 public topics, 10 creators.
- Meilisearch: reindexed 1986 passages into `base2026_public_tiktok`.
- policy: `include_full_transcripts=false`.
- QA: canonical release gate passed: current-batch polish status, AfterPolish rebuild/export, newest-source readiness, publication boundary, GitHub metadata, public export policy, public release contract, package, VPS deploy/reindex, live SEO crawl gate, and mobile visual QA.
- note: private source-review backlog is now 57 rows: 42 local-caption rows, 13 audio-backed too-little/no-speech rows, and 2 rows with no usable source/audio.

## 2026-06-19 — base2026-source-review-local-caption-ay48-20260619

- release: `base2026-source-review-local-caption-ay48-20260619`
- deployed path: `/var/www/base2026-knowledge/releases/base2026-source-review-local-caption-ay48-20260619`
- reason: ship three more local-caption source-review rows after mechanical transcript cleanup, explicit QA pass, and guarded CSV clearance back to `transcribed`.
- public export: 1458 source records, 1989 passages, 1630 insight cards, 1059 public insight cards, 1521 topics, 1007 public topics, 10 creators.
- Meilisearch: reindexed 1989 passages into `base2026_public_tiktok`; deploy task `371`.
- policy: `include_full_transcripts=false`.
- QA: canonical release gate passed: current-batch polish status, AfterPolish rebuild/export, newest-source readiness, publication boundary, GitHub metadata, public export policy, public release contract, package, VPS deploy/reindex, live SEO crawl gate, and mobile visual QA with 78 checks and 0 failures.
- note: private source-review backlog is now 54 rows: 39 local-caption rows, 13 audio-backed too-little/no-speech rows, and 2 rows with no usable source/audio.

## 2026-06-19 — base2026-source-review-local-caption-ay49-20260619

- release: `base2026-source-review-local-caption-ay49-20260619`
- deployed path: `/var/www/base2026-knowledge/releases/base2026-source-review-local-caption-ay49-20260619`
- reason: ship three additional `@ray_fu` local-caption source-review rows after mechanical transcript cleanup, explicit QA pass, and guarded CSV clearance back to `transcribed`.
- public export: 1461 source records, 1994 passages, 1630 insight cards, 1059 public insight cards, 1521 topics, 1007 public topics, 10 creators.
- Meilisearch: reindexed 1994 passages into `base2026_public_tiktok`; deploy task `375`.
- policy: `include_full_transcripts=false`.
- QA: canonical release gate passed: current-batch polish status, AfterPolish rebuild/export, newest-source readiness `--latest 3`, publication boundary, GitHub metadata, public export policy, public release contract, package, VPS deploy/reindex, live SEO crawl gate, and mobile visual QA with 78 checks and 0 failures.
- note: private source-review backlog is now 51 rows: 36 local-caption rows, 13 audio-backed too-little/no-speech rows, and 2 rows with no usable source/audio.

## 2026-06-19 — base2026-source-review-local-caption-ay50-20260619

- release: `base2026-source-review-local-caption-ay50-20260619`
- deployed path: `/var/www/base2026-knowledge/releases/base2026-source-review-local-caption-ay50-20260619`
- reason: ship three more `@ray_fu` local-caption source-review rows after mechanical transcript cleanup, explicit QA pass, and guarded CSV clearance back to `transcribed`.
- public export: 1464 source records, 1998 passages, 1630 insight cards, 1059 public insight cards, 1521 topics, 1007 public topics, 10 creators.
- Meilisearch: reindexed 1998 passages into `base2026_public_tiktok`; deploy task `379`.
- policy: `include_full_transcripts=false`.
- QA: canonical release gate passed: current-batch polish status, AfterPolish rebuild/export, newest-source readiness `--latest 3`, publication boundary, GitHub metadata, public export policy, public release contract, package, VPS deploy/reindex, live SEO crawl gate, and mobile visual QA with 78 checks and 0 failures.
- note: private source-review backlog is now 48 rows: 33 local-caption rows, 13 audio-backed too-little/no-speech rows, and 2 rows with no usable source/audio.
