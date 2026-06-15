# Base2026 Product Passport

Last updated: 2026-06-14

## Core idea

Base2026 started as a private text database for creator videos: take videos, turn them into faithful text, make that text searchable, and let the operator quickly find who said what, in which context, and around which topic.

The public product should preserve that database value. It should not become a gallery of short cropped snippets, disconnected source pages, or repeated cards that all show the same transcript fragment.

The product promise is:

- search across short-form expert videos by keyword, topic, creator, platform, and year;
- show search results in a familiar Google-like list: each result is a video/source record, like each Google result is a site/page;
- open a selected result into one full source record;
- show the full normalized transcript/source text for that record;
- explain what the creator was talking about through short and fuller Base2026-authored explanations, topics, and insight cards;
- keep attribution, original source links, methodology, and correction/removal paths visible;
- avoid presenting raw scraped captions as standalone content.

## What the pipeline is for

The pipeline is not the problem. The pipeline is the value engine.

Current intended flow:

1. Discover public creator video.
2. Extract platform metadata and captions when available.
3. Fall back to ASR only when needed and source/audio quality permits.
4. Store raw captions, raw ASR, media, logs, and QA artifacts locally/private.
5. Produce a faithful polished transcript/source text.
6. Chunk the text into searchable passages.
7. Produce a short explanation and a fuller explanation of what the video is about.
8. Extract topics, claims, and public insight cards only through reviewed evidence gates.
9. Export public source records, passages, creators, topics, and insight cards.
10. Render the public search workspace, static SEO pages, and future API/MCP payloads from the same public data model.

The pipeline should continue to use strict review gates. The UI and public export contract need correction so the public surface reflects the database, not only a cropped evidence preview.

## Public/private boundary, corrected

Keep private by default:

- raw captions;
- raw ASR;
- downloaded media/audio/video;
- source extraction logs;
- local QA notes;
- unreviewed transcripts;
- private research notes;
- credentials, API keys, and generated release archives.

Public after review/polish:

- creator identity and public source attribution;
- original source URL;
- platform/date/language/policy metadata;
- reviewed polished public source text/transcript;
- Base2026-authored short explanation;
- Base2026-authored fuller explanation;
- searchable passages generated from that source text;
- Base2026-authored summaries, topics, and insight cards;
- correction/removal and methodology links.

Important distinction:

- Do not publish raw caption dumps.
- Do publish a readable public source record when the transcript/source text has passed the pipeline and is contextualized by Base2026.
- Do not arbitrarily truncate the selected source detail as the only readable source surface.

## Product shape

`/knowledge/` is the main interactive workspace.

Desktop contract:

```text
filters | workspace
```

The right workspace shows one active state at a time:

- search results;
- selected source record;
- creator-filtered results;
- topic-filtered results;
- compare/topic state.

Mobile contract:

- one main reading surface at a time;
- filters open as a drawer/control, not as a competing page;
- no modals for source reading;
- no duplicate source/provenance/card stacks after the main source text.

Static pages stay for SEO, canonical URLs, sitemap, direct sharing, and crawlable long-form records. They should follow the same source-record structure as the workspace, with an `Open in Search Workspace` path back to `/knowledge/?source=...`.

## Source record contract

A public source record should read like a useful database entry, not a repeated transcript dump.

Recommended order:

1. Source identity: creator, date, platform icon, compact metadata.
2. Base2026-authored short explanation: what this video is about in plain language.
3. Base2026-authored fuller explanation: what the useful point/context is.
4. Full readable public transcript/source text, normalized into sentences and paragraphs.
5. Matched passage context only when a search hit selected a specific passage, with highlighting inside the full text.
6. Related topics and source intelligence: reviewed insight cards, related records, and comparisons.
7. One compact action group: open original, creator filter/profile, correction/removal, copy canonical URL.
8. Methodology/correction links in compact trust footer or page-level support links.

Do not render:

- platform caption metadata snippet blocks;
- bottom `Source Provenance` card stacks;
- empty `Public Insight Cards` sections;
- duplicated `Source Excerpt`, `Matched Passage`, and `Related Passages` blocks that show the same text;
- many separate buttons that all navigate to variants of the same record.

Button rule:

- search result card has one primary open action, or the whole result is clickable;
- source record has a small compact action row;
- navigation must not depend on several competing buttons for source page, source record, creator page, original, and modal variants.

## Search contract

Search results should be short previews. Source detail should be the long reading surface.

Search should:

- find keywords across public source text/passages;
- show matching creators and videos as a simple vertical result list, like a search engine result page;
- show title/topic, creator/date/platform, short explanation or matched snippet, and topic chips;
- show highlighted snippets around the query;
- keep filters and route state stable;
- let one `View source` action open the full source record in the workspace.

Search should not:

- force the user to guess between modal, source page, creator page, and original source;
- show three narrow columns on desktop;
- hide full source context behind several repeated excerpt sections.

Creator filtering:

- clicking a creator should behave like applying the creator facet/filter in the search workspace;
- a creator static page may exist for SEO/sharing, but user exploration should still feel like filtered search results;
- searching within a creator should be the same search UI with the creator filter applied.

## SEO and trust contract

The public SEO value comes from source-backed, attributed, contextual pages, not from mass raw transcript dumps.

Static source pages should include:

- clear H1 based on the source/topic, not repeated metadata;
- canonical URL;
- structured source metadata;
- short and fuller Base2026-authored explanation;
- public source text where policy allows;
- related topics/insights;
- original source link;
- correction/removal link;
- methodology context.

This frames the page as an annotated, searchable source record and knowledge-base entry rather than a scraped transcript mirror.

## Current implementation mismatch

The live release `base2026-public-hermes-20260614-060556` still follows the older excerpt-first public contract:

- public export uses excerpt-only source records;
- generated source pages render a short `Evidence Excerpt`;
- runtime source detail renders source evidence once but does not expose the full readable public source text;
- full polished transcript/source text exists locally and/or in passage chunks, but the selected source UI intentionally hides most of it;
- old docs treated `excerpt-only` as the product architecture instead of a temporary risk-control mode.

This explains the user-visible confusion: the search database exists, but the selected record does not consistently behave like a complete database entry.

## Implementation target

Next implementation pass should:

1. Add a public source-text field that contains reviewed polished transcript/source text when policy allows.
2. Add public short and fuller explanation fields for each reviewed source record.
3. Keep raw captions and private transcript artifacts out of public export.
4. Render source detail from one source-record component shared by runtime `/knowledge/?source=` and static source pages.
5. Show full public source text in source detail, optionally with a disclosure/long-read control on mobile.
6. Keep search cards as Google-like previews only.
7. Highlight query matches inside selected source text.
8. Deduplicate matched/related sections so the same text is not repeated three or four times.
9. Keep actions compact and top-level; remove duplicate navigation buttons.
10. Update public release contract from "never full transcripts" to "no raw/unreviewed transcripts; reviewed public source text allowed".
11. Update QA to fail on arbitrary source-detail truncation, duplicate source text blocks, caption metadata snippets, button proliferation, and modal/source-page split regressions.

## Do not do

- Do not throw away the pipeline.
- Do not publish raw source vaults or raw caption dumps.
- Do not rebuild the whole project from scratch.
- Do not reintroduce the legacy modal.
- Do not make a three-column desktop workspace.
- Do not make static SEO pages disconnected from `/knowledge/`.
- Do not use local LLM output as final public claims without evidence gates.

## One-sentence product definition

Base2026 is a public, attributed, searchable video-source knowledge base: it turns reviewed creator-video transcripts into searchable source records, then adds Base2026-authored context, topics, and insight cards so people can find who said what and understand why it matters.
