# Base2026 Intelligence Marketing Plan

Last updated: 2026-06-17

Status: v0 command-center plan from public Base2026 data only.

This plan uses public-safe Base2026 artifacts as a marketing intelligence source
for the Alex Yarosh WordPress site and the Base2026 `/knowledge/` product.

## Public Data Used

- `public-data/tiktok/source_records.jsonl`: 1,388 source records.
- `public-data/tiktok/passages.jsonl`: 1,906 passages.
- `public-data/tiktok/insight_cards.jsonl`: 1,623 insight cards, including 1,052 public insights.
- `public-data/tiktok/topics.jsonl`: 1,516 topics, including 1,001 public topics.
- Public creators: `@build_in_public`, `@tjrobertson52`, `@joshuamaraney`, `@webhivedigital`, `@darrenshawseo`.

No raw private captions, local DB files, audio/video, or private research vaults
are part of this plan.

## Growth Thesis

Base2026 is not only a public demo. It is the proprietary evidence engine behind
the WordPress business site. The main site should sell the service; Base2026
should prove the thinking with searchable public sources, topic evidence pages,
creator profiles, and source-intelligence cards.

## Pillars

1. AI Search Visibility / Citability  
   AI citations, AI search reporting, AI search tracking, cited-source strategy,
   LLM source influence.

2. Local Entity Trust  
   Google Business Profile, local reviews, local service pages, directories,
   local business visibility.

3. On-Page + Internal Linking Foundation  
   Internal linking and on-page SEO are strong public evidence clusters and
   should connect directly to WordPress service claims.

4. Content Quality / Anti-Slop / Refresh  
   Scaled content risk, self-promotional listicles, content freshness, fact
   density, AI content quality.

5. Commercial SEO / BOFU Pages  
   High-intent service pages, landing pages, conversion tracking, pricing
   objections, buyer-intent SEO.

6. Off-Site Authority + Social Proof  
   Backlink quality, YouTube/Reddit citations, brand mentions, reviews,
   third-party proof pages.

7. Base2026 As Evidence Engine  
   Public source text, source intelligence, topic evidence pages, API/AI access,
   and searchable proof that supports Alex Yarosh positioning.

## P0 Actions

1. Keep `scripts/live-seo-crawl-gate.mjs` as the local Ahrefs-quota fallback before GSC/IndexNow batches.
2. Build a WordPress content plan around AI visibility, local entity trust, internal linking, content quality, and commercial SEO.
3. Create an internal-link map from WordPress commercial/service pages to relevant `/knowledge/` topic/source proof pages.
4. Add shared OG/X-card metadata across WordPress and Base2026 generated pages so citations and shares render professionally.

## P1 Actions

1. Publish or draft five quick-win WordPress pages/posts:
   - AI Search Visibility Audit;
   - Internal Linking for AI Search;
   - Google Business Profile for AI Visibility;
   - Why Scaled AI Content Fails;
   - How to Build Pages AI Can Cite.
2. Improve Base2026 topic pages into stronger evidence hubs with summaries, creator viewpoints, source counts, key claims, related sources, Q&A, and a WordPress CTA.
3. Add an explicit LLM/citability layer: `/knowledge/api.html`, `llms.txt`, quotable definitions, and clear author/entity references.
4. Repurpose source insights into social posts: one insight, one source, one practical action, one link back to a topic/source page.

## P2 Actions

1. Expand programmatic SEO only where data is rich enough: topic evidence pages, creator profiles, source pages, and compare pages.
2. Avoid doorway/thin variants. Every generated page must have real source count, evidence, and internal links.
3. Produce a monthly Base2026 Signal Report: top topics, creator shifts, AI search trends, content risks, and practical marketing actions.

## Current Constraints

- Ahrefs recrawl quota is exhausted; local crawl gate is the near-term validator.
- GSC URL inspection quota is limited; use sitemap plus selective manual requests.
- Some public-source pages still need content-quality gates before being used as growth pages.
- Base2026 pSEO expansion must be evidence-led, not keyword-variant spam.

## Next Safe Step

Turn the P0 actions into two implementation lanes:

1. SEO technical lane: OG/X cards, sitemap/canonical hygiene, schema validation, and crawl-gate CI/local runbook.
2. Growth/content lane: WordPress proof-linked content plan plus Base2026 topic evidence hub improvements.

