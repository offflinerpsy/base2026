# Base2026 Navigation Architecture Snapshot

Last updated: 2026-06-13

Purpose: this is a factual handoff for an independent navigation and
information-architecture audit. It describes how Base2026 currently works,
from TikTok/source intake through public export, search, generated pages,
desktop/mobile UI, and navigation paths.

This document is not a proposed fix. It records the current architecture,
including the confusing parts that need redesign.

## Current live checkpoint

- Live public app: `https://aggressorbulkit.online/knowledge/`
- Current UI release in project memory:
  `base2026-source-detail-workspace-ay83-20260613`
- Latest data/reindex checkpoint:
  `base2026-clean-replay-pipeline-ay81-20260613`
- Public export counts preserved by ay83:
  - 1218 source records
  - 1713 searchable passages
  - 1607 insight cards
  - 1034 public insight cards
  - 1504 topics
  - 987 public topics
  - 4 creators
- Meilisearch index: `base2026_public_tiktok`
- Public release policy at snapshot time: excerpt-first. This was later
  corrected by `BASE2026_PRODUCT_PASSPORT_2026_06_14.md`: raw/unreviewed
  transcripts stay private, but reviewed public source text may become the
  source-record reading surface when policy allows.

## Current product surfaces

Base2026 has several public surfaces that behave like different products:

1. `/knowledge/`
   - Meilisearch-backed search workspace.
   - Faceted filtering by creator, source, and year.
   - Result cards show matched source passages.
   - Result card primary action currently says `View source`.
   - `View source` opens an in-page source detail panel.

2. `/knowledge/sources/{item_id}.html`
   - Generated static source record page.
   - Intended for SEO, sharing, and canonical URLs.
   - Has a full page shell, header, footer, source excerpt, related passages,
     public insight cards, provenance, and links to creator/topic pages.

3. `/knowledge/creators/{handle}.html`
   - Generated static creator profile page.
   - Has a full page shell, creator hero, top topics, latest source records,
     public insight cards, and actions.
   - Does not preserve the search workspace visually.

4. `/knowledge/topics/{topic_id}.html`
   - Generated static topic page.
   - Has topic summary, related public insight cards, sources, and passages.
   - Does not preserve the search workspace visually.

5. `/knowledge/compare/{topic_id}.html`
   - Generated static comparison page for topic viewpoints.
   - Does not preserve the search workspace visually.

6. Static info pages under `/knowledge/`
   - Roadmap, methodology, support, privacy/source policy, opt-out/correction,
     site structure, and other project context pages.

7. Main WordPress site
   - Commercial pages such as services, pricing, about, and AI visibility audit.
   - Shares visual header/footer direction with Base2026, but is a separate
     content system.

## Pipeline and data architecture

The public UI is downstream of a local/source processing pipeline:

1. Creator/source discovery
   - Public creator config: `config/creators.example.json`
   - Local active queue: `config/tiktok-intake-queue.local.json`
   - Local queue is not committed.
   - Current public creator set:
     `@build_in_public`, `@tjrobertson52`, `@joshuamaraney`,
     `@webhivedigital`.

2. TikTok metadata and caption extraction
   - `scripts/tiktok-ytdlp-metadata-extract.py`
   - `scripts/tiktok-caption-browser-extract.mjs`
   - `scripts/import-tiktok-staging-to-kb.py`
   - `scripts/base2026-controller.py`

3. Local knowledge-base rebuild
   - `scripts/build-kb-sqlite.py`
   - Replays reviewed local archives for legacy insight decisions and candidate
     decisions.
   - Local raw/review archives are private and ignored.

4. Public export
   - `scripts/export-public-tiktok.py`
   - Main output directory: `public-data/tiktok`
   - Public JSONL files:
     - `documents.jsonl`
     - `source_records.jsonl`
     - `passages.jsonl`
     - `insight_cards.jsonl`
     - `topics.jsonl`
     - `creators.jsonl`
     - `manifest.json`
   - Compatibility file:
     - `chunks.jsonl`

5. Public export validation
   - `scripts/check-public-export-policy.py`
   - `scripts/repair-public-text-excerpts.py`
   - `scripts/validate-public-text-excerpts.py`
   - `scripts/validate-public-release-contract.py`
   - Contract file:
     `contracts/base2026.public-release-contract.json`

6. Static page generation
   - `scripts/generate-info-pages.py`
   - `scripts/generate-public-pages.py`
   - `scripts/generate-base2026-sitemap.py`

7. Release packaging and deploy
   - `scripts/package-public-release.ps1`
   - `scripts/package-public-hotfix-from-export.ps1`
   - `scripts/deploy-public-vps.ps1`
   - Release artifacts are generated output and are not committed.

8. Search index
   - `scripts/meili-index-public.py`
   - Indexes public passages into Meilisearch.
   - Search runtime uses `/knowledge-search/multi-search`.
   - Browser uses a search-only route, not the Meilisearch master key.

## Public data model

Current public data is not a single assembled object. The UI assembles source
detail from several files at runtime.

Source record fields include:

- `item_id`
- `source_id`
- `source_url`
- `source_type` / `platform`
- `handle` / creator fields
- `published_date`
- `title`
- `title_status`
- `excerpt`
- `transcript`
- `topics`
- `topic_labels`
- `public_policy`
- `full_transcript_public`

Important current policy:

- `transcript` is empty in normal public releases.
- `excerpt` is the main readable public evidence text.
- `title` may be platform caption/title metadata and can be truncated.
- `Platform Caption Metadata` is provenance, not necessarily a transcript.

Passages:

- Searchable units indexed in Meilisearch.
- Link back to a source record via `source_id` / `item_id`.
- Used for search result cards and related passages.

Insight cards:

- Topic-level reviewed annotations.
- Some cards are public.
- Public cards must have evidence excerpts.

Topics:

- Generated from topic IDs and labels.
- Some topics are indexable; singleton/weak topics can be `noindex,follow`.

Creators:

- Aggregated source, insight, and topic counts.
- Used for creator profile pages and filter facets.

## Runtime search app

Primary files:

- `web/static/meili.html`
- `web/static/meili.js`
- `web/static/styles.css`

The `/knowledge/` page contains these main blocks:

1. Search/hero area
   - Search box and query pills.
   - Selected terms/current refinements.

2. Mobile filter bar
   - Mobile-only filter drawer trigger.

3. `.meili-grid`
   - `aside.meili-filters`
   - `section.meili-results`
   - `aside#source-detail-panel`

4. Legacy `dialog#transcript-dialog`
   - Still exists in `meili.html`.
   - Still has rendering code in `meili.js` via `openTranscript()`.
   - It is no longer supposed to be the primary path, but it remains in DOM and
     code as architectural debt and QA risk.

Current InstantSearch widgets in `meili.js`:

- `configure`
- `searchBox`
- `stats`
- `currentRefinements`
- refinement lists for creator/source/year
- `hits`
- `pagination`

Current search result behavior:

- `hitTemplate()` renders each matched passage card.
- Each result card contains one primary `View source` button.
- The button calls `showSourceDetail(itemId)`.

Current source detail behavior:

- `showSourceDetail(itemId)`:
  - reads the matched hit from client cache;
  - loads a source row from `./static/documents.jsonl`;
  - loads related passages from `./public-data/tiktok/passages.jsonl`;
  - loads public insight cards from
    `./public-data/tiktok/insight_cards.jsonl`;
  - renders everything into `#source-detail-panel`.

- `renderSourceDetailShell()` currently renders:
  - `Public source` kicker;
  - source identity pill with avatar, handle, date, platform;
  - H2 generated by `sourceDisplayName()`, e.g. `@handle source record`;
  - short lead/excerpt;
  - actions:
    - `Open original`
    - `Creator`
    - `Correction / removal`
    - `Canonical URL`
  - metadata chips:
    - public policy
    - platform
    - language
  - topics
  - `Source Excerpt`
  - `Matched Passage`
  - `Related Passages`
  - `Public Insight Cards`
  - `Source Provenance`
  - `Platform Caption Metadata`

Current internal links from source detail:

- `Open original` goes to the external TikTok/source URL.
- `Creator` goes to `./creators/{handle}.html`.
- `Correction / removal` goes to `./opt-out.html`.
- `Canonical URL` goes to `./sources/{item_id}.html`.
- Topic chips go to `./topics/{topic_id}.html`.
- Public insight cards link to topic pages.

This means the search workspace is only preserved while using `View source`.
Most links from the right detail panel eject the user into standalone static
pages.

## Generated page architecture

Primary generator:

- `scripts/generate-public-pages.py`

Important functions:

- `page_shell()`
- `index_page()`
- `creator_page()`
- `source_page()`
- `topic_page()`
- `compare_page()`

Generated pages are static HTML pages with full header/footer shells. They do
not render inside the `/knowledge/` search workspace.

### Source pages

Route pattern:

- `/knowledge/sources/{item_id}.html`

Current source page content:

- canonical URL
- robots directive based on public evidence availability
- source hero
- `Open original`
- `Creator page`
- `Correction or opt-out`
- source excerpt
- related passages
- public insight cards
- topics/provenance/caption metadata
- JSON-LD where available

Problem: the static source page and the search source detail are rendered by
different systems:

- static page: Python generator
- search source detail: browser JS renderer

They can drift in labels, hierarchy, layout, and available context.

### Creator pages

Route pattern:

- `/knowledge/creators/{handle}.html`

Current creator page content:

- breadcrumb
- creator profile hero
- creator avatar and handle
- count chips for records/insights/topics
- action buttons:
  - `Open creator profile`
  - `Correction or opt-out`
  - `Search this creator`
- top topics
- latest source records
- public insight cards

Problem: selecting `Creator` from source detail changes the user from a search
workspace into a standalone profile page. Search and filters disappear.

### Topic pages

Route pattern:

- `/knowledge/topics/{topic_id}.html`

Current topic page content:

- topic hero
- public insight cards
- related source records
- related passages
- compare link if available

Problem: topic exploration is a separate static mode, not a filtered/search
state inside the main workspace.

### Compare pages

Route pattern:

- `/knowledge/compare/{topic_id}.html`

Current compare page content:

- viewpoints grouped by stance/source
- links back to topics, source pages, and creators

Problem: compare is also a standalone mode with no search/filter workspace.

## Desktop layout as implemented

The wide desktop search layout is currently a three-column grid:

```css
.meili-grid {
  display: grid;
  grid-template-columns: 280px minmax(0, 0.92fr) minmax(380px, 1.08fr);
  gap: 22px;
}
```

This creates:

1. left column: filters
2. middle column: matched source passages/results
3. right column: source detail

Current right panel:

```css
.source-detail-panel {
  position: sticky;
  top: 92px;
  max-height: calc(100dvh - 116px);
  overflow: auto;
}
```

Observed UX effect:

- Filters, results, and detail feel like three narrow vertical app columns.
- `Matched source passages` is visually compressed in the middle.
- Source detail is also compressed and reads like a narrow side card.
- The result list is no longer the main search surface.
- The right panel can scroll independently.
- The page itself also scrolls.
- The layout looks like several mobile layouts placed side by side instead of a
  desktop search workspace.

At `max-width: 1240px`:

```css
.meili-grid {
  grid-template-columns: 260px minmax(0, 1fr);
}

.source-detail-panel {
  grid-column: 2;
  position: relative;
  max-height: none;
}
```

This keeps filters on the left and moves source detail into the second column
flow, below/with results.

At `max-width: 900px`:

```css
.meili-grid {
  grid-template-columns: 1fr;
}

.source-detail-panel {
  display: none;
}

.source-detail-open .source-detail-panel {
  display: block;
}

.source-detail-open .results-panel {
  display: none;
}
```

This becomes a mobile stacked state:

- filters are a drawer;
- results show by default;
- selecting a source hides results and shows source detail;
- `Back to results` returns to the result list.

## Mobile behavior

Mobile is closer to the intended no-modal behavior than desktop:

- There is a filter drawer.
- The result list is the default view.
- `View source` opens an in-page detail state.
- The result list hides while detail is active.
- `Back to results` restores the list.

Remaining mobile architecture issues:

- Creator/topic/source actions still navigate away to standalone pages.
- Search/filter state preservation is not a first-class URL/router model.
- Legacy dialog DOM still exists.
- Static creator/source/topic pages do not share the same app shell.

## Current navigation graph

### Header and Base2026 dropdown

Main header links include:

- `/services/`
- `/pricing/`
- `/knowledge/`
- `/about/`
- `/ai-visibility-audit/`

Base2026 dropdown links include generated/static knowledge pages such as:

- `/knowledge/`
- `/knowledge/topics/`
- `/knowledge/creators/`
- `/knowledge/sources/`
- `/knowledge/roadmap.html`
- `/knowledge/methodology.html`
- `/knowledge/support.html`

### Search result card

Current path:

```text
/knowledge/ search result
  -> View source
    -> in-page #source-detail-panel
```

Topic chips on result cards:

```text
/knowledge/ result topic chip
  -> /knowledge/topics/{topic_id}.html
```

### Source detail panel

Current paths:

```text
Open original
  -> external TikTok/source URL

Creator
  -> /knowledge/creators/{handle}.html

Correction / removal
  -> /knowledge/opt-out.html

Canonical URL
  -> /knowledge/sources/{item_id}.html

Topic chip
  -> /knowledge/topics/{topic_id}.html

Public insight topic button
  -> /knowledge/topics/{topic_id}.html
```

### Source page

Current paths:

```text
/knowledge/sources/{item_id}.html
  -> Open original
  -> /knowledge/creators/{handle}.html
  -> /knowledge/opt-out.html
  -> /knowledge/topics/{topic_id}.html
```

### Creator page

Current paths:

```text
/knowledge/creators/{handle}.html
  -> external creator profile
  -> /knowledge/opt-out.html
  -> /knowledge/index.html?q={handle} or similar search URL
  -> /knowledge/sources/{item_id}.html
  -> /knowledge/topics/{topic_id}.html
```

### Topic page

Current paths:

```text
/knowledge/topics/{topic_id}.html
  -> /knowledge/sources/{item_id}.html
  -> /knowledge/creators/{handle}.html
  -> /knowledge/compare/{topic_id}.html
```

### Compare page

Current paths:

```text
/knowledge/compare/{topic_id}.html
  -> /knowledge/topics/{topic_id}.html
  -> /knowledge/sources/{item_id}.html
  -> /knowledge/creators/{handle}.html
```

## Current duplication and drift

The same source object is currently represented in several different ways:

1. Search passage result card
   - Shows a matched excerpt and `View source`.

2. Search source detail panel
   - Browser JS assembles detail from JSONL files.
   - Shows source excerpt, matched passage, related passages, insights, and
     provenance.

3. Legacy transcript/source dialog
   - Still exists in DOM and JS.
   - Uses different action labels:
     `Open original`, `Source page`, `Creator page`, `Copy transcript`.
   - Was the old primary path and can confuse future maintenance.

4. Static source page
   - Python-generated HTML.
   - SEO/canonical target.
   - Similar sections but separately rendered.

5. Creator static page
   - Python-generated profile view.
   - Different app mode from search.

6. Topic static page
   - Python-generated topic view.
   - Different app mode from search.

Result: the user can start in one search/filter context and then quickly land in
a completely different context, even though all pages are showing pieces of the
same public source database.

## Current user-visible problems

These are not theoretical. They are visible in the current ay83 layout and in
recent screenshots.

1. Desktop uses three columns.
   - Filters, results, and source detail are all narrow.
   - `Matched source passages` is compressed into a middle column.
   - The source detail panel is a narrow right column.
   - The result feels like three phone screens on a desktop.

2. Primary workspace is unclear.
   - Search results should feel like the main product surface.
   - Instead, results are squeezed between filters and detail.

3. Source detail repeats identity.
   - `Public Source` kicker.
   - Source identity pill with avatar, handle, date, platform.
   - Large H2 such as `@build_in_public source record`.
   - The same identity is visually restated too many times.

4. Action hierarchy is unclear.
   - `Open original` is styled as the strongest action inside detail.
   - Internal exploration actions and external exit actions sit together.
   - `Canonical URL` is a user-facing label even though it is mainly SEO/share
     infrastructure.

5. Creator navigation breaks continuity.
   - From source detail, `Creator` goes to a standalone creator page.
   - The creator page has no persistent search/filter workspace.
   - User lands in a different page architecture.

6. Topic navigation breaks continuity.
   - Result topic chips and detail topic links go to standalone topic pages.
   - Search/filter state is not preserved as a visible workspace.

7. Static and runtime renderers can diverge.
   - Runtime source detail is in `web/static/meili.js`.
   - Static SEO source page is in `scripts/generate-public-pages.py`.
   - Labels, hierarchy, and available sections can drift.

8. Legacy modal code remains.
   - `#transcript-dialog` is still in the HTML.
   - `openTranscript()` still exists in JS.
   - QA and future agents can accidentally target or revive the modal path.

9. Platform caption metadata is confusing.
   - It may be a shortened platform title/caption.
   - It is not the same as a full transcript.
   - It appears/disappears depending on available fields and renderer.

10. Search state is not a router contract.
    - Source selection is not clearly represented as a stable app route.
    - Static page navigation does not preserve the same left-side state.
    - Browser back behavior is not the central navigation model.

11. SEO and app UX are coupled awkwardly.
    - Static source pages are needed for indexing.
    - But user-facing app links to those pages eject users from search.
    - There is no clear policy for when to stay in the app shell versus when to
      open a canonical static page.

## Public/private and SEO constraints

Any redesign must keep these constraints:

1. Do not publish private raw research files.
2. Do not publish raw source vaults.
3. Do not publish local DBs, logs, release archives, credentials, audio, or
   video files.
4. Do not accidentally publish full third-party transcripts.
5. Public source records are currently excerpt-first.
6. Static source pages must remain available for SEO, sharing, canonical URLs,
   and direct indexing.
7. Pages without usable public evidence should remain `noindex,follow`.
8. Correction/removal controls must stay reachable.
9. Creator attribution and links to original sources must stay visible.
10. Future API/MCP consumers should receive the same public data shape the UI
    uses, not scraped generated HTML.

## Future API/MCP direction already implied

The project direction expects Base2026 data to be consumable through API/MCP
later. The current UI should therefore converge toward one assembled public
object shape.

Expected future source detail object:

```json
{
  "source": {},
  "creator": {},
  "matched_passages": [],
  "related_passages": [],
  "public_insights": [],
  "topics": [],
  "provenance": {},
  "seo": {}
}
```

Current gap:

- The browser assembles this partly from JSONL.
- The static generator assembles similar content separately.
- There is no shared source-detail assembler module or API response contract.

## Audit questions for the independent architect

1. What is the canonical navigation model?
   - Search app route with params, such as `/knowledge/?source=...`?
   - Static canonical route, such as `/knowledge/sources/{id}.html`?
   - Hybrid, where static routes hydrate into the same app shell?

2. Should `/knowledge/` become the only interactive app shell?
   - Search, filters, result list, source detail, creator detail, topic detail,
     and compare detail could all render inside one shell.

3. How should SEO pages coexist with the app shell?
   - Static pages can remain canonical/indexable.
   - Internal clicks may need to stay in the app shell.
   - Direct static-page landings may need a search/refinement entry point.

4. What is the desktop layout model?
   - Two-pane search workspace?
   - Left: filters plus results?
   - Right: selected detail?
   - Top: search always visible?
   - How wide should each region be?

5. What is the mobile route/state model?
   - Drawer filters?
   - Results list state?
   - Detail state?
   - Back behavior?
   - Deep links into source/creator/topic detail?

6. What should be one primary action?
   - `View source`?
   - `Open source`?
   - Should external `Open original` be secondary?
   - Should `Canonical URL` be hidden behind share/copy rather than a visible
     main button?

7. What labels should be standardized?
   - Source
   - Source record
   - Source detail
   - Creator
   - Creator profile
   - Topic
   - Insight card
   - Platform caption metadata
   - Source excerpt

8. Should creator/topic pages be separate destinations or detail modes?
   - Current behavior sends users to standalone pages.
   - A coherent search product may need creator/topic detail to open in the same
     app workspace while preserving filters/search.

9. How should search state persist?
   - Query params?
   - Hash route?
   - History API?
   - InstantSearch routing?
   - Shared route model for source/creator/topic selection?

10. What is the minimum data contract for source detail?
    - The same model must serve runtime UI, static SEO generation, and future
      API/MCP.

## Suggested deliverable from audit

The independent audit should produce:

1. A corrected information architecture.
2. A route map for search, source, creator, topic, compare, and SEO pages.
3. A desktop layout model.
4. A mobile layout model.
5. A source-detail data contract.
6. A policy for internal app navigation versus static canonical navigation.
7. A label/action taxonomy.
8. A migration plan that removes or quarantines legacy modal code.
9. QA gates for desktop, mobile, SEO pages, search state, and public/private
   publication boundary.

## Key files for audit

Project memory:

- `docs/project-memory/PROJECT_STATE.md`
- `docs/project-memory/ACTIVE_PHASE.md`
- `docs/project-memory/NEXT_ACTION.md`
- `docs/project-memory/DECISIONS.md`
- `docs/project-memory/DATA_SOURCES.md`
- `docs/project-memory/STATUS_BOARD.csv`
- `docs/project-memory/PUBLICATION_BOUNDARY.md`
- `docs/project-memory/VISUAL_SYSTEM_CONTRACT.md`
- `docs/project-memory/SOURCE_DETAIL_SEARCH_REDESIGN_2026_06_13.md`

Runtime UI:

- `web/static/meili.html`
- `web/static/meili.js`
- `web/static/styles.css`

Static page generation:

- `scripts/generate-public-pages.py`
- `scripts/generate-info-pages.py`
- `scripts/generate-base2026-sitemap.py`

Public export and validation:

- `scripts/export-public-tiktok.py`
- `scripts/check-public-export-policy.py`
- `scripts/repair-public-text-excerpts.py`
- `scripts/validate-public-text-excerpts.py`
- `scripts/validate-public-release-contract.py`
- `docs/schemas/PUBLIC_JSONL_SCHEMA.md`
- `contracts/base2026.public-release-contract.json`

Search and deploy:

- `scripts/meili-index-public.py`
- `scripts/package-public-release.ps1`
- `scripts/package-public-hotfix-from-export.ps1`
- `scripts/deploy-public-vps.ps1`
- `scripts/mobile-visual-qa.mjs`

Pipeline/intake:

- `scripts/tiktok-ytdlp-metadata-extract.py`
- `scripts/tiktok-caption-browser-extract.mjs`
- `scripts/import-tiktok-staging-to-kb.py`
- `scripts/build-kb-sqlite.py`
- `scripts/base2026-controller.py`
- `config/creators.example.json`

## Snapshot conclusion

Base2026 currently has a strong public data pipeline and a useful set of
generated SEO pages, but the public navigation is not one coherent product
architecture yet.

The central issue is not just visual polish. The current public app is a hybrid
of:

- a passage search app;
- a right-side source-detail panel;
- a leftover modal implementation;
- standalone generated source pages;
- standalone generated creator pages;
- standalone generated topic and compare pages.

The next architecture pass should decide whether Base2026 is primarily:

1. a search workspace with detail views that keep filters and state visible; or
2. a static SEO directory with search bolted onto it.

The current system is trying to be both at once, which is why navigation feels
fragmented.
