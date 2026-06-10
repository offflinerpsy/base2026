# Base2026 Research Console UI Audit

Date: 2026-06-01

## Fixed In This Pass

- Modal source title no longer behaves like a broken input-sized block.
- Modal now uses a real source header: source type, wrapped title, metadata grid, source actions, copy link.
- Truncated TikTok metadata is explicitly labeled instead of pretending the title is complete.
- Full title string is available as native hover title where the browser can show it.
- Modal transcript text now uses the full stored document text instead of search chunks, avoiding repeated overlap at chunk boundaries.

## Findings

1. Source titles can be truncated before they reach the UI.
   - Evidence: `videos.title_or_description` and `generic_items.title` already contain strings ending in `...`.
   - Impact: UI cannot recover the original full TikTok caption/title without a richer inventory scrape.
   - Recommendation: add a future `full_description` / `source_caption_full` field during TikTok collection.

2. Claims are useful but visually under-qualified.
   - Current risk: users may read pending claims as verified methodology.
   - Recommendation: show claim status chips and evidence links in the modal.

3. Search result cards still need trust metadata.
   - Recommendation: expose transcript QA status: `pass`, `needs_review`, `needs_asr`.

4. Current app JS is still one file.
   - Acceptable for local prototype.
   - Scale threshold: split when adding author profile, saved searches, or multi-source ingestion UI.

5. No dedicated author pages yet.
   - This is the next major UX unlock: author timeline, videos, topics, claims, and source links in one place.

6. Search snippets still come from chunks.
   - This is correct for search results.
   - Source detail views should continue using full document text.

## Architecture Recommendation

Stay on local SQLite + Python server until the workflow is stable.

Next upgrade should be schema/API quality, not framework migration:

- Add `source_title_full`
- Add transcript QA status to `/api/search`
- Add `/api/author?id=...`
- Add `/api/facets`
- Add saved searches as JSON files or SQLite table

Only consider React/Next/Typesense after filters, source detail, and author workflows are proven.
