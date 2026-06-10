# Base2026 Research Console Guide

## Product Goal

Turn the SQLite knowledge base into a research console for SEO, GEO, and AEO work.
The interface must feel like a searchable intelligence archive, not a generic wiki.

Primary language is English. Translation can be added later as an optional layer.

## Current Decision

Keep the current local stack for the next iteration:

- Python HTTP server
- SQLite FTS5
- Plain HTML/CSS/JavaScript

Reason: the database is already SQLite, the dataset is small enough for fast local queries,
and the next bottleneck is UX/facets, not infrastructure.

Do not migrate to React or an external search engine until the product workflow is stable.

## Research Notes

Useful patterns found:

- Datasette: SQLite-first data publishing with JSON API, FTS, facets, and table exploration.
  Good model for local-first inspectable data products.
  Source: https://docs.datasette.io/
- Datasette FTS: supports SQLite FTS, column search, advanced operators, and custom SQL search.
  Source: https://docs.datasette.io/en/stable/full_text_search.html
- Meilisearch: filters, sorting, and faceting as first-class search primitives.
  Useful if/when this needs a dedicated search server.
  Source: https://www.meilisearch.com/docs/capabilities/filtering_sorting_faceting/overview
- Typesense: strong open-source option for facet fields, numeric/date filters, and fast search.
  Good later candidate if SQLite FTS becomes limiting.
  Source: https://typesense.org/docs/30.2/api/search.html
- Algolia InstantSearch: best UI pattern reference for refinement lists, date filters, and URL-driven search state.
  Source: https://www.algolia.com/doc/guides/managing-results/refine-results/filtering/how-to/filter-by-attributes/

## UX Model

Use a faceted research-console pattern:

1. Search bar: broad intent, e.g. `AI Overview`, `Reddit citations`, `inbound marketing`.
2. Mention filter: required entity/keyword, e.g. `ChatGPT`, `Bing`, `schema`.
3. Source filter: TikTok, local files, future web/reddit/doc sources.
4. Author filter: creator/source owner.
5. Date range: exact `from` / `to`.
6. Sort: relevance, newest, oldest, source type.
7. Facet sidebar: clickable source/year counts that narrow the current result set.
8. Result cards: author, date, source, link, readable passage, open full source.

## Data Rules

- Search should use polished transcripts when available.
- Raw captions remain preserved as source material, not primary reading layer.
- `needs_review` QA means the transcript is faithful but has caption/audio uncertainty.
- Do not hide `needs_review`; later UI should expose it as a trust flag.

## Next UX Iterations

- Add QA trust chips: `pass`, `needs review`, `needs ASR`.
- Add author profile page with all videos, timeline, topics, and claim clusters.
- Add saved searches / shareable URLs.
- Add quoted passage export for strategy docs.
- Add semantic layer later: cached embeddings or RRF hybrid search, not live token-heavy search.
- Add optional translation toggle only after English product flow is stable.
