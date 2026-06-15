# Source Detail Search Redesign

Last updated: 2026-06-13

## Goal

Turn `/knowledge/` into one continuous search workspace:

- left side: search, filters, active refinements, result context;
- right side: source/result detail that updates in place;
- no source-record modal as the primary reading path;
- static source URLs stay for SEO, sharing, and direct indexing.

This is an IA/product rebuild, not another modal hotfix.

## Current problem

The live product has three competing source surfaces:

1. search result cards;
2. source-record modal;
3. generated source page.

They do not expose the same context. The modal has source identity and actions but misses source-page depth. The static source page has related passages and insight cards but loses the live search/filter workspace. Search has filters but sends the user into either a modal or a separate page.

This makes Base2026 feel like a stitched demo instead of a growing public knowledge base.

## Product decision

Use one source-detail model everywhere.

- Search result click opens source detail in the right-hand workspace.
- Static `/knowledge/sources/{id}.html` renders the same source-detail structure for SEO and sharing.
- The source modal is removed from the main path. It may remain temporarily as a fallback during migration, then be deleted.
- Search result actions collapse to one primary action: `View source`.
- `Open original`, `Creator`, `Correction / removal`, and copy/share live inside the source detail.

## Data model expectation

The public app must stay live-data friendly.

- Meilisearch remains the primary search/facet engine.
- Static JSONL payloads remain the public browser data source until an API/MCP layer is added.
- Source detail should be assembled from public `source_records`, `passages`, `insight_cards`, `topics`, and `creators` data, not from duplicated HTML-only logic.
- Future API/MCP consumers should receive the same source-detail shape the UI uses.

## Transcript / caption policy

There are two separate concepts:

- `Source Excerpt`: public, readable evidence text. This is what the current public policy allows by default.
- `Platform Caption Metadata`: original platform caption/title metadata, which may be short, truncated, or not equivalent to transcript text.

Do not label truncated platform metadata as a transcript.

Future full transcript/caption display requires a policy/data change first:

- a public field that explicitly marks transcript availability and publication status;
- export validation proving no accidental full third-party transcript dump;
- SEO/indexing decision for full transcript pages or panels.

Until that exists, source detail should explain platform metadata as provenance only and keep the public source excerpt as the main readable text.

## Desktop layout

Use a two-pane search workspace.

Left pane:

- search box;
- filters;
- selected filters;
- result count/sort;
- result list/passages;
- persistent on source open.

Right pane:

- empty/search guidance state before selection;
- selected result/source detail after click;
- source identity row;
- source actions;
- source excerpt;
- matched passages for the current query;
- related passages from the same source;
- public insight cards;
- topics;
- platform/provenance metadata;
- correction/removal link.

The right pane should feel like Google-style result inspection, not a database modal.

## Mobile layout

No source modal.

Mobile should use a stacked workspace:

1. search header;
2. compact filter drawer/button;
3. result list;
4. tapping `View source` navigates to an in-page detail state or same-route detail view;
5. a clear `Back to results` control returns to the prior search state.

Filters must remain reachable without losing the selected source. The mobile source detail can become the main vertical view, but it must preserve search state in URL/state so back navigation is predictable.

## SEO contract

Generated source pages remain required.

Every generated source page should get automated SEO from the same source-detail model:

- one H1: creator/source identity, not a vague duplicate heading;
- H2 sections: `Source Excerpt`, `Related Passages`, `Public Insight Cards`, `Topics`, `Source Provenance`;
- title: `{creator} source record about {main topic or compact title} | Base2026`;
- meta description: creator, date, topic/excerpt summary, original-source attribution;
- canonical URL;
- `index,follow` only when public evidence exists;
- `noindex,follow` when no usable public evidence exists;
- JSON-LD: `WebPage` plus safe `CreativeWork`/`VideoObject` reference to the original post when enough metadata exists;
- internal links to creator, topics, related insight cards, and original source.

This should not be positioned as scraped transcript pages. The public framing is: attributed source records, evidence excerpts, annotations, topic links, and correction/removal controls.

## API / MCP direction

Design the UI data shape as the future API shape:

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

Later API/MCP endpoints should serve this assembled object so external users can pull the same public evidence without scraping generated HTML.

## Implementation tasks

1. Create a source-detail assembler in JS for `/knowledge/` that combines source record, passages, insights, topics, creator, and current query match.
2. Replace `Open source record` and `Source page` buttons in search results with one `View source` action.
3. Render source detail in the right-hand results pane instead of opening `dialog`.
4. Preserve URL/search state when a source is selected.
5. Add mobile source-detail state with `Back to results` and no modal.
6. Refactor `scripts/generate-public-pages.py` so static source pages use the same section order and SEO contract.
7. Add public export/validation checks for SEO fields and source-detail shape.
8. Add browser QA gates for desktop two-pane, mobile no-modal flow, SEO source page, and no horizontal overflow.

## Non-goals for the first pass

- Do not publish full transcripts by accident.
- Do not add paid/live LLM calls to search.
- Do not replace Meilisearch.
- Do not build the full API/MCP server yet.
- Do not deploy until desktop/mobile QA and public boundary checks pass.
