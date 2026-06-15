# WordPress + Base2026 SEO/GEO Growth Plan

Last updated: 2026-06-14

## Executive position

The project should be treated as one domain ecosystem with two roles:

1. WordPress is the commercial/entity layer.
   - It explains who Alex Yarosh is.
   - It sells AI visibility, SEO, GEO, AEO, content, schema, and local search services.
   - It converts visitors into roadmap/audit requests.

2. Base2026 is the proof and source-intelligence layer.
   - It shows a working research engine.
   - It turns public expert videos into searchable, attributed knowledge records.
   - It feeds topic intelligence, evidence, and examples back into WordPress.
   - It can become an API/MCP-accessible knowledge base.

The goal is not "more pages." The goal is more indexable, useful, source-backed pages that prove expertise and make the site easier for humans, Google, and AI systems to understand.

## Data tier used

Primary evidence for this plan:

- local repo docs and project memory;
- public JSONL counts from `public-data/tiktok`;
- current local static generation/search architecture;
- Google Search Central documentation;
- llms.txt proposal documentation.

No private client data, credentials, raw captions, or raw media were used.

## What Google/AI guidance implies for this project

Google's current guidance says generative AI features are still grounded in Search systems. That means Base2026 should not chase a separate magic "AI SEO" format. It should make content crawlable, useful, well-structured, and source-worthy.

Practical implications:

- Keep foundational SEO excellent: crawlable links, canonical URLs, titles, headings, metadata, fast pages, sitemaps, and index controls.
- Add original value: summaries, commentary, topic mapping, source intelligence, comparisons, and editorial context.
- Avoid scaled-content abuse: no pages created only to manipulate rankings, no raw copied/transcribed content as the only value.
- Use schema where it matches visible content.
- Use `llms.txt` as an experimental AI-agent convenience layer, not as a Google ranking requirement.

## North star

Build a public AI visibility proof system:

> The WordPress site says "we help local service businesses improve AI/search visibility"; Base2026 proves the method by showing the research engine, source records, topic map, and evidence-backed content system behind the service.

## WordPress SEO/GEO plan

### Role

WordPress should become the clean commercial hub:

- entity home for Alex Yarosh;
- service landing pages;
- conversion funnel;
- trust/methodology layer;
- case study and proof layer;
- internal link bridge into Base2026.

### Keep

- Keep Rank Math as the WordPress SEO plugin.
- Do not install a second SEO plugin.
- Keep the current visual direction, but enforce a consistent design system.
- Keep the free AI visibility roadmap as the primary CTA.

### Required WordPress page architecture

Core pages:

- `/` - primary commercial homepage.
- `/services/` - service overview.
- `/pricing/` - pricing/engagement model.
- `/about/` - person/entity trust page.
- `/contact/` or roadmap/audit request page - conversion.
- `/knowledge/` - Base2026 product/search entry.

Recommended service sections or future child pages:

- AI Visibility Audit.
- SEO/GEO Technical Foundation.
- Answer-Ready Content.
- Local SEO and Citations.
- Entity and Schema Optimization.
- Content System / Knowledge Base Builds.

Recommended trust pages:

- Methodology.
- AI Visibility Roadmap example.
- Base2026 case study: "How this site built a searchable source-intelligence library."
- Source and content policy.
- Privacy and correction/removal.

### WordPress schema

Use only schema that matches the visible page:

- `WebSite` and `SearchAction` if site search is available.
- `Person` for Alex Yarosh.
- `Organization` only if the business entity is defined clearly enough.
- `Service` for service pages.
- `BreadcrumbList` for internal pages.
- `FAQPage` only where real visible FAQs exist and only if it helps users, not as a ranking trick.
- Avoid `LocalBusiness` until NAP, service area, and business identity are stable.

### WordPress content clusters

Use Base2026 as an editorial source map. Build WordPress content only where it supports the commercial offer.

Initial clusters:

- AI visibility for local service businesses.
- How Google, ChatGPT, Gemini, Perplexity, and Bing discover service businesses.
- Entity clarity and schema for small/local businesses.
- Answer-ready service pages.
- Reviews, citations, and off-site signals for AI search.
- What Base2026 is teaching us about AI/search visibility.

Every WordPress content piece should have:

- one business purpose;
- one search intent;
- one CTA;
- links to 2-5 relevant Base2026 evidence pages or topic pages when useful;
- original operator commentary, not just a summary of other creators.

## Base2026 SEO/GEO plan

### Role

Base2026 should become a crawlable, useful source library and AI-readable research layer.

It should not be:

- a raw transcript dump;
- a thin programmatic SEO farm;
- a disconnected static directory;
- an interface where the same source text repeats three or four times.

### Page types and index policy

Indexable by default:

- `/knowledge/` search homepage.
- Source pages with reviewed public source text and Base2026-authored summary/intelligence.
- Creator pages with enough sources and meaningful topic distribution.
- Topic pages with enough public insight cards/related sources to be a real hub.
- Methodology, roadmap, support, privacy, site-structure pages.

Usually `noindex,follow`:

- singleton topic pages with only one weak source;
- compare pages without enough evidence diversity;
- pages generated only for utility/navigation;
- pages where public content is too thin after policy filtering.

### Source page SEO template

Each source page should generate:

- SEO title: `{main idea} | {creator} source record | Base2026`
- meta description: one useful sentence that explains the idea and the source context.
- H1: the main idea, not just `@creator source record`.
- visible creator/date/platform row.
- Base2026 short summary.
- Base2026 fuller explanation/source intelligence.
- normalized source text when allowed.
- related topics.
- related/contrasting source links.
- original source link.
- correction/removal path.
- canonical URL.
- `BreadcrumbList` JSON-LD.
- `CreativeWork`/`WebPage` JSON-LD.
- `VideoObject` only when video metadata is complete and visible/accurate.

### Topic page SEO template

Each indexable topic page should answer:

- What is this topic?
- What do creators say about it?
- Which points repeat?
- Which points conflict?
- Which source records support it?
- What should a local service business or SEO operator do with this?

This is where Base2026 can become stronger than raw search results. Topic hubs should summarize patterns across sources instead of only listing cards.

### Creator page SEO template

Each creator page should include:

- creator identity and platform attribution;
- public disclaimer that Base2026 does not imply endorsement;
- topic distribution;
- latest source records;
- most cited/most connected insights;
- search-within-creator path back to `/knowledge/?creator=...`;
- original creator profile link where available;
- correction/removal path.

## Automatic SEO pipeline for new Base2026 content

Add a dedicated SEO/GEO enrichment step after review/export and before static generation.

Suggested generated fields:

- `seo_title`
- `meta_description`
- `h1`
- `slug`
- `canonical_url`
- `robots`
- `primary_topic`
- `secondary_topics`
- `entity_mentions`
- `creator_entity`
- `short_summary`
- `full_summary`
- `answer_blocks`
- `related_source_ids`
- `related_topic_ids`
- `schema_graph`
- `sitemap_lastmod`
- `llm_summary`
- `api_public_payload_version`

Pipeline position:

```text
discover
  -> metadata/caption/asr
  -> polish source text
  -> chunk passages
  -> insight/topic review
  -> public export
  -> SEO/GEO enrichment
  -> static page generation
  -> sitemap generation
  -> Meilisearch reindex
  -> release QA
  -> deploy
```

QA gates:

- title exists and is not duplicated across many pages;
- meta description exists and does not use raw clipped text;
- one H1 exists;
- canonical URL exists;
- robots decision exists;
- JSON-LD parses;
- sitemap includes only indexable URLs;
- source page contains visible summary, source text, attribution, and correction path;
- no raw captions/ASR/media/logs leak;
- no arbitrary truncation in source detail;
- no repeated source text blocks;
- search workspace link works;
- mobile and desktop pass overflow checks.

## LLM/agent readiness

Recommended additions:

- `/llms.txt` at the root domain, summarizing the commercial site, services, Base2026, policies, and key URLs.
- `/knowledge/llms.txt` for Base2026-specific agent context.
- `/knowledge/data-dictionary.json` describing public JSONL files and fields.
- `/knowledge/api-index.json` when public API/MCP contracts exist.
- Markdown versions of methodology, source/content policy, and project passport if public-safe.

Important: `llms.txt` is a proposal, not an official Google ranking requirement. Treat it as an agent-readability layer.

## Internal linking system

WordPress to Base2026:

- service pages link to relevant Base2026 topic hubs;
- content pages cite 2-5 relevant source records;
- methodology links to Base2026 roadmap and source/content policy;
- homepage can mention the Base2026 research engine as proof.

Base2026 to WordPress:

- footer links to commercial services;
- support/methodology pages link to roadmap/audit CTA;
- topic pages can include a compact "For service businesses" block linking to the relevant service page;
- do not over-commercialize source records.

Rules:

- links must help the reader;
- do not stuff repeated exact-match anchors;
- keep creator attribution clear;
- keep source pages primarily informational.

## Measurement plan

Install or verify:

- Google Search Console for root domain and `/knowledge/`;
- Bing Webmaster Tools;
- GA4 or privacy-conscious analytics;
- Rank Math sitemap/metadata health for WordPress;
- Base2026 sitemap submission;
- server-log review for Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot, and other AI crawlers;
- weekly indexed-page and query report;
- conversion tracking for roadmap/audit form.

Track:

- indexed WordPress pages;
- indexed Base2026 pages by type;
- search impressions/clicks by cluster;
- topic pages that get impressions but low CTR;
- source pages that get impressions for long-tail questions;
- AI/referral bot visits;
- roadmap/audit conversion rate;
- pages excluded by `noindex`, duplicate, crawl anomaly, or canonical issues.

## 30/60/90 day execution plan

### First 30 days

- Finalize WordPress design system and content architecture.
- Audit all live WordPress titles/descriptions/schema.
- Add or verify root sitemap and Base2026 sitemap submission.
- Update Base2026 JSONL schema docs for `public_source_text` and summaries.
- Add SEO/GEO enrichment fields to the public export contract.
- Create root `/llms.txt` and `/knowledge/llms.txt`.
- Audit generated source/topic templates for titles, descriptions, H1s, canonicals, robots, schema, and duplicate text.
- Build the first Base2026-powered WordPress article/case study.

### Days 31-60

- Create 3-5 service cluster pages or sections with Base2026 evidence links.
- Build stronger indexable topic hubs for high-value topics: AI visibility, schema, local SEO, AI Overviews, entity SEO, content strategy.
- Add topic-quality scoring and index/noindex rules.
- Add Search Console/Bing/analytics dashboard notes.
- Add internal link QA between WordPress and Base2026.
- Define public API/MCP read-only payload contract.

### Days 61-90

- Publish a public methodology/case-study page showing how Base2026 informs AI visibility work.
- Build recurring "what creators are saying about..." topic reports from Base2026.
- Add source-backed content briefs for WordPress pages.
- Measure rankings/impressions/clicks and prune/merge weak pages.
- Prepare commercial offer pages for custom knowledge-base/search systems if this becomes a service.

## Risks

- Raw transcript risk: publishing copied speech without added value can make pages look like scraping.
- Thin programmatic SEO risk: too many weak topic pages can damage quality perception.
- Navigation risk: disconnected static pages and search workspace can confuse users.
- Schema risk: invalid or misleading schema can create trust and eligibility issues.
- Entity risk: no registered company/GBP means the site should avoid pretending to be a local business entity until that exists.
- Measurement risk: without Search Console/Bing/analytics, SEO work becomes guesswork.

## Immediate next implementation backlog

1. Create `llms.txt` drafts for root and `/knowledge/`.
2. Update public JSONL schema docs for reviewed source text and SEO fields.
3. Add SEO/GEO enrichment fields to source/topic generation.
4. Update source page SEO template wording away from "excerpt-only" language.
5. Add topic hub quality scoring and stricter index/noindex logic.
6. Map WordPress service pages to Base2026 topic/source evidence.
7. Add weekly SEO/GEO measurement checklist to project memory.

## Suggested commit message

```text
docs: define Base2026 SEO/GEO growth architecture
```

## Sources

- Local project memory and public JSONL export.
- Google Search Essentials: https://developers.google.com/search/docs/essentials
- Google AI features optimization guide: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google helpful content guide: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google spam policies: https://developers.google.com/search/docs/essentials/spam-policies
- Google VideoObject guidance: https://developers.google.com/search/docs/appearance/structured-data/video
- Google sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- llms.txt proposal: https://llmstxt.org/
