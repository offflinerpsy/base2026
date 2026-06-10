# Public Product Gap Review

Last updated: 2026-06-08

Source: user-supplied ChatGPT review pasted on 2026-06-08.

## Core direction

Base2026 should be positioned as an open-source local-first research tool for turning public short-form expert videos into attributed, searchable, auditable knowledge records.

It should not be positioned as a public TikTok transcript dump.

## Implemented now

- searchable public UI;
- creator handle and profile URL;
- original post URL;
- post date when available;
- short passage/excerpt in search results;
- source record drawer;
- methodology page;
- creator opt-out/correction page;
- public JSONL separation into source records, passages, insight cards, and creators;
- export policy validator;
- local/private ingestion and ASR architecture docs;
- Meilisearch-backed fast search.

## Partially implemented

- full transcript handling: package currently includes full transcripts for the source drawer by explicit release flag, but launch policy still recommends excerpts-only or gated/noindexed full transcripts;
- insight cards: exported from existing claims, but public UI does not yet surface reviewed insight cards as first-class cards;
- topics/categories: topic architecture exists, but topic pages and topic filters are not yet implemented;
- creator pages: attribution exists in result cards, but dedicated `/creator/{handle}` pages do not exist yet;
- source pages: source drawer exists, but canonical `/source/{video_id}` pages do not exist yet.

## Not implemented yet

- comparison pages across creators;
- stance/caveat UI;
- editorial notes;
- reviewed claim validation workflow;
- cached topic panels;
- schema/clean indexable topic/source pages;
- public noindex/gated policy for full transcript views.

## Next product step

Keep the current search UI as the demo/search surface, but move the public roadmap toward:

1. source records with excerpts;
2. creator pages;
3. topic pages;
4. reviewed insight cards;
5. comparison pages;
6. private/gated/noindexed full transcript handling.
