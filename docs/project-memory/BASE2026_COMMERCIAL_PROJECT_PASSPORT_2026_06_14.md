# Base2026 Commercial Project Passport

Last updated: 2026-06-14

## One-line definition

Base2026 is an attributed, searchable knowledge base for short-form expert videos about SEO, GEO, AEO, AI visibility, content, search, and local business growth.

It turns public creator videos into reviewed text source records, then adds Base2026-authored summaries, topics, insights, search, canonical pages, and future API/MCP access.

## Why it exists

Short-form expert videos contain practical knowledge: tactics, warnings, playbooks, strategy fragments, and platform observations. The problem is that this knowledge is hard to search, compare, cite, revisit, or feed into AI workflows.

Base2026 solves that by converting public video knowledge into a structured research layer:

- who said it;
- what video/source it came from;
- what exact idea was discussed;
- what topics it connects to;
- what related creators or records discuss similar ideas;
- how the idea can be searched, cited, and reused responsibly.

The original internal purpose was a private text database for the operator. The public product keeps that database value, but adds attribution, review, commentary, summaries, correction/removal paths, and SEO-safe presentation so it is not a raw transcript dump.

## Current public scale

Current local public export snapshot from `public-data/tiktok/manifest.json`:

- created_at: `2026-06-14T07:44:20`
- source records: 1,219
- searchable passages: 1,715
- creators: 4
- documents: 1,219
- insight cards: 1,607
- public insight cards: 1,034
- topics: 1,504
- public full-transcript export flag: `include_full_transcripts=false`

Important interpretation:

- The public database already has enough scale to require programmatic SEO discipline.
- The current export contract does not publish raw full transcripts.
- Reviewed public source text is allowed when it is polished, contextualized, and passes the public boundary.
- Raw captions, raw ASR, media, QA notes, and private research remain private.

## Content acquisition model

Base2026 currently focuses on public short-form creator videos. The active public dataset is TikTok-oriented, with creator queues and source records maintained locally before public export.

High-level intake:

1. Discover public creator videos from configured creator sources.
2. Deduplicate against existing local inventory.
3. Store source metadata: source URL, platform, creator handle, public date, item id, and available platform metadata.
4. Extract captions when available.
5. Use ASR fallback only when captions are unavailable or insufficient and the source is allowed.
6. Hold uncertain or audio-sensitive items in private review.
7. Never expose raw media/audio/video or raw extraction logs publicly.

Current automation reality:

- Scheduled checks can refresh creator queues and detect new sources.
- The safest public lane is still review-gated, not fully autonomous publishing.
- A source can be held as `needs_source_review` rather than forced into public output.

## Processing pipeline

The pipeline is the value engine. It should not be discarded.

Canonical flow:

1. Public video discovered.
2. Metadata and caption extraction.
3. ASR fallback when allowed.
4. Private raw artifacts stored locally.
5. Transcript/source text is normalized into readable paragraphs.
6. Entity spelling and known platform/brand terms are cleaned through durable normalization rules.
7. Source text is chunked into searchable passages.
8. AI/Codex/GPT review packets extract candidate claims only from supplied evidence.
9. Reviewer gates approve, reject, or hold candidate insight cards.
10. Topics are generated from source records and insight cards.
11. Public JSONL export is generated.
12. Static HTML pages are generated for SEO, sharing, and canonical URLs.
13. Meilisearch is reindexed from public passage data.
14. Live deployment and visual/source QA are run before calling the work done.

Key existing scripts and surfaces:

- `scripts/export-public-tiktok.py`
- `scripts/generate-public-pages.py`
- `scripts/generate-base2026-sitemap.py`
- `scripts/package-public-release.ps1`
- `scripts/deploy-public-vps.ps1`
- `scripts/mobile-visual-qa.mjs`
- `public-data/tiktok/*.jsonl`
- `web/static/*`

## Public data model

The public product is built from JSONL files, not from WordPress posts.

Core files:

- `source_records.jsonl`: source identity, creator, platform, date, canonical URL, public source text, public summaries, and record-level metadata.
- `passages.jsonl`: searchable chunks used by Meilisearch and source-match highlighting.
- `insight_cards.jsonl`: reviewed Base2026-authored claim/insight cards with source-backed evidence.
- `topics.jsonl`: topic labels and topic relations.
- `creators.jsonl`: creator profiles and public source counts.
- `documents.jsonl`: runtime source-detail payload for `/knowledge/`.
- `manifest.json`: release/data counts and export flags.

The same public data should power:

- `/knowledge/` interactive search workspace;
- generated source pages;
- generated creator pages;
- generated topic pages;
- compare pages;
- sitemap output;
- future public API;
- future MCP/agent access.

## Public/private boundary

Private by default:

- raw captions;
- raw ASR;
- downloaded media/audio/video;
- extraction logs;
- local QA notes;
- unreviewed transcripts;
- private research notes;
- raw source vaults;
- credentials/API keys;
- generated release archives;
- local database files.

Public after review:

- creator attribution;
- original source URL;
- platform/date/language metadata;
- normalized public source text when policy allows;
- short Base2026-authored explanation;
- fuller Base2026-authored explanation;
- searchable passages;
- topics;
- reviewed insight cards;
- correction/removal links;
- methodology links.

Public pages must not look like copied video dumps. They must look like annotated, attributed, searchable knowledge records with meaningful Base2026 editorial value.

## User-facing product model

The product should behave like a search engine over expert video knowledge.

Main workspace:

```text
/knowledge/
  left: filters
  right: active workspace
```

The right workspace shows one state at a time:

- search results;
- selected source record;
- creator-filtered results;
- topic-filtered results;
- compare/topic state.

Search result contract:

- one result equals one creator video/source record;
- show creator, date, platform, topic chips, short title/explanation, and matched snippet;
- highlight query terms where possible;
- one primary action: view/open source;
- no modal source record;
- no duplicate `source page` versus `source record` decision for the user.

Source record contract:

1. Creator/date/platform identity.
2. Clear H1 based on the main idea, not duplicated metadata.
3. Short Base2026 summary.
4. Fuller Base2026 explanation or source intelligence.
5. Full normalized public source text when allowed.
6. Query-matched passage context inside the source text when opened from search.
7. Related topics and insight cards.
8. Compact action row: original, creator, correction/removal, canonical/share.
9. Compact trust/methodology links.

Do not render:

- caption metadata snippet blocks;
- bottom `Source Provenance` card stacks;
- empty public insight sections;
- repeated full transcript text as source excerpt, matched passage, related passage, and intelligence;
- many competing navigation buttons for the same object.

## Static page model

Generated static pages are still important.

They exist for:

- SEO;
- canonical URLs;
- sitemap discovery;
- direct sharing;
- crawlable records;
- stable references for citations and future API/MCP users.

Static pages should not replace the search workspace. They should include an `Open in Search Workspace` path back to `/knowledge/?source=...`, `/knowledge/?creator=...`, or `/knowledge/?topic=...`.

Static page types:

- `/knowledge/sources/{source_id}.html`
- `/knowledge/creators/{creator}.html`
- `/knowledge/topics/{topic}.html`
- `/knowledge/compare/{topic}.html`
- support/methodology/privacy/roadmap/site-structure pages

## SEO/GEO value proposition

Base2026 has three layers of SEO/GEO value:

1. Human search value: users can search expert video knowledge like a lightweight Google for short-form SEO/GEO/AEO content.
2. Search-engine value: source-backed static pages create crawlable, attributed, useful pages with canonical URLs and structured metadata.
3. AI/agent value: structured public data can support future API/MCP access, LLM context files, and evidence-backed AI workflows.

The strategy must avoid scaled-content abuse:

- do not generate pages only to capture keywords;
- do not republish raw captions as the main value;
- do not create thousands of thin topic pages with no source-backed substance;
- index only pages with meaningful unique value;
- use `noindex,follow` for thin singleton or utility pages where appropriate;
- keep creator attribution and original source links visible.

## Automatic SEO contract for new content

Every new public source should produce a complete SEO payload before deployment:

- stable `source_id`;
- clean canonical URL;
- SEO title;
- meta description;
- one H1;
- short source summary;
- fuller Base2026 explanation;
- primary topic;
- secondary topics;
- creator relation;
- visible original source link;
- correction/removal link;
- schema graph;
- sitemap inclusion decision;
- robots decision: `index,follow` or `noindex,follow`;
- search index payload;
- optional LLM/agent summary field;
- internal link targets to related topics, creator, and related sources.

Required QA gates:

- no raw captions in public HTML/JSONL;
- no raw ASR in public HTML/JSONL;
- no empty public source page;
- no arbitrary public source text truncation in source detail;
- no duplicate source text blocks on the same page;
- title and H1 are descriptive and not duplicated metadata;
- meta description exists and is unique enough;
- canonical URL exists;
- schema JSON-LD parses;
- sitemap includes only indexable canonical pages;
- mobile has no horizontal overflow;
- source workspace uses route-state, not modal fallback.

## Recommended schema model

Base2026 static pages should use schema only when it matches visible content.

Recommended graph types:

- `WebSite` for the Base2026 knowledge section.
- `CollectionPage` for search/topic/creator collection pages.
- `WebPage` for source and support pages.
- `BreadcrumbList` for generated pages.
- `Person` or profile-like entity for public creators where appropriate.
- `CreativeWork` for source records as annotated public knowledge records.
- `VideoObject` only when required visible properties and original video metadata are available and accurate.
- `ItemList` for topic/creator source lists.

Do not add schema as decoration. Schema must describe what the page actually shows.

## WordPress relationship

The WordPress site is the commercial and entity home:

- who Alex Yarosh is;
- what services are offered;
- why local service businesses should care about AI visibility;
- how to request the free roadmap/audit;
- pricing and trust pages;
- conversion flow.

Base2026 is the public evidence and research engine:

- source-backed proof that the site is built from live research;
- topic intelligence for SEO/GEO/AEO;
- public examples of the methodology;
- unique internal data for content strategy;
- future API/MCP layer.

The two should support each other:

- WordPress links to relevant Base2026 evidence pages from service pages.
- Base2026 footer and support pages link back to WordPress services and audit CTA.
- WordPress content should cite Base2026 topic pages when explaining AI visibility concepts.
- Base2026 should not become a disconnected second site.

## Commercial positioning

Commercial story:

> We do not sell generic SEO advice. We build AI-search visibility systems from live source intelligence, technical SEO, entity clarity, answer-ready content, schema, and evidence-backed research.

Base2026 makes this credible because it shows:

- a working source-intelligence pipeline;
- public evidence records;
- topic mapping;
- creator-sourced industry observations;
- technical ability to build custom data/search products;
- a practical research base behind the WordPress service offer.

This can support:

- free AI visibility roadmap lead magnet;
- technical foundation service;
- answer-ready content service;
- entity/schema optimization;
- local SEO and citations;
- custom knowledge-base builds for clients;
- future API/MCP access to public Base2026 data.

## Current gaps

Important remaining gaps:

- Public JSONL schema docs need to be updated for the corrected `public_source_text` and summary model.
- Source/topic templates still need an SEO template audit after the source-text/product-contract change.
- `llms.txt` does not appear to exist yet in the public tree.
- Topic pages need a stronger threshold between indexable hub pages and thin/noindex pages.
- WordPress and Base2026 internal linking should be deliberately mapped by service/topic cluster.
- Search Console, Bing Webmaster, GA4, server-log, and AI-crawler monitoring should become a recurring dashboard.
- Future API/MCP payloads need a public contract before release.

## Audit-ready questions

For an outside auditor or AI architecture reviewer:

- Does every public page add value beyond a transcript?
- Are thin topic pages blocked from indexing?
- Does every indexed source page have unique summary/context and visible attribution?
- Do source pages use consistent canonical URLs?
- Does schema match visible page content?
- Can Google and AI agents crawl meaningful static content without relying on client-side search state?
- Does the WordPress commercial site clearly connect to the Base2026 evidence engine?
- Is the public/private boundary enforceable in code, not only in docs?
- Does every new source automatically generate SEO, schema, sitemap, search, and QA artifacts?

## External standards and references

- Google Search Essentials: https://developers.google.com/search/docs/essentials
- Google AI features optimization guide: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google helpful, reliable, people-first content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google spam policies: https://developers.google.com/search/docs/essentials/spam-policies
- Google structured data introduction: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Google VideoObject guidance: https://developers.google.com/search/docs/appearance/structured-data/video
- Google sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- llms.txt proposal: https://llmstxt.org/

## Internal references

- `docs/project-memory/BASE2026_PRODUCT_PASSPORT_2026_06_14.md`
- `docs/project-memory/BASE2026_PIPELINE_INVENTORY_2026_06_09.md`
- `docs/project-memory/PUBLICATION_BOUNDARY.md`
- `docs/project-memory/DECISIONS.md`
- `docs/project-memory/NAVIGATION_ARCHITECTURE_SNAPSHOT_2026_06_13.md`
- `docs/project-memory/PUBLIC_INTELLIGENCE_IMPLEMENTATION_PLAN_2026_06_08.md`
- `docs/schemas/PUBLIC_JSONL_SCHEMA.md`
