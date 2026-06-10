# Base2026 Recommended Site Structure

## Main navigation

Recommended top-level navigation:

1. Search
2. Topics
3. Creators
4. Roadmap
5. About
6. Support

Footer links:

- Project Story
- Source & Content Policy
- Privacy Policy
- Creator Correction / Removal
- GitHub
- Contact

---

# Core pages

## 1. Home

Purpose: explain the project in 10 seconds and push users to search/support.

Sections:

1. Hero
   - Headline: "Search what experts actually said in short-form videos."
   - Subheadline: "Base2026 turns public short-form expert videos into attributed, searchable knowledge records."
   - CTA: Search the database
   - Secondary CTA: Support the roadmap

2. What it does
   - Converts public short-form expert content into searchable records.
   - Preserves source attribution.
   - Helps marketers and researchers find useful insights faster.

3. Why it matters
   - Feeds are not knowledge bases.
   - Useful advice disappears quickly.
   - Search should work across creators, topics, and platforms.

4. Current status
   - Public MVP is live.
   - Local transcription pipeline is being improved.
   - AI-assisted search is planned.

5. Support block
   - "Help fund transcription, storage, and smarter search."

---

## 2. Search page

Purpose: main product experience.

Features:

- Search input.
- Filters:
  - platform;
  - creator;
  - topic;
  - date;
  - transcript source;
  - reviewed/unreviewed.
- Results cards.
- Source links.
- Transcript preview.
- Quality flags.

---

## 3. Record page

Purpose: one source record.

Recommended fields:

- Title/generated descriptor.
- Creator.
- Platform.
- Original source URL.
- Date.
- Topics.
- Transcript/source status.
- Excerpt or transcript section.
- Related records.
- Correction/removal link.

Important: do not present the record as an original article. Make attribution visible.

---

## 4. Topic pages

Purpose: SEO/GEO-friendly pages with actual added value.

Example URLs:

- `/topics/tiktok-seo`
- `/topics/instagram-reels-hooks`
- `/topics/local-seo`
- `/topics/smm-strategy`

Sections:

1. Topic overview.
2. Top related records.
3. What creators are saying.
4. Repeated patterns.
5. Contradictions/uncertainties.
6. Source-linked records.
7. Search within topic.

This is better than publishing thousands of raw transcript pages.

---

## 5. Creator pages

Purpose: attribution and discovery.

Sections:

- Creator handle/name.
- Platform links.
- Topics commonly discussed.
- Indexed records.
- Original source links.
- Correction/removal link.
- Optional creator note if claimed/approved.

---

## 6. Roadmap page

Purpose: explain why funding is needed.

Sections:

1. Current status.
2. Phase 1 - public MVP stabilization.
3. Phase 2 - reliable transcription pipeline.
4. Phase 3 - smart search.
5. Phase 4 - platform expansion.
6. Phase 5 - creator-friendly tools.
7. Phase 6 - research/intelligence product.
8. Funding priorities.

---

## 7. Support page

Purpose: collect donations/support.

Sections:

1. Why support matters.
2. What funding pays for.
3. Current priorities.
4. Roadmap summary.
5. Ways to help.
6. Donation/sponsor buttons.

---

## 8. About page

Purpose: concise project explanation.

Sections:

- What Base2026 is.
- Who it is for.
- What problem it solves.
- What it is not.
- Current status.
- Link to full project story.

---

## 9. Project Story page

Purpose: founder narrative.

Use `02_PROJECT_STORY.md`.

---

## 10. Source & Content Policy page

Purpose: show good faith and reduce creator/platform concerns.

Use `04_SOURCE_AND_CONTENT_POLICY.md`.

---

## 11. Privacy Policy page

Purpose: basic legal/privacy compliance.

Use `03_PRIVACY_POLICY.md`.

---

## 12. Creator Correction / Removal page

Purpose: give creators a direct control channel.

Recommended text:

# Creator Correction / Removal

Base2026 is built around attribution and source transparency.

If you are a creator and believe a record is inaccurate, misattributed, outdated, or should not be included, you can request correction or removal.

Send correction or removal requests to [offflinerpsy@gmail.com](mailto:offflinerpsy@gmail.com).

Please include:

- your creator handle;
- the Base2026 record URL;
- the original source URL if available;
- what should be corrected or removed;
- a contact email;
- verification information if needed.

Reasonable requests will be reviewed in good faith. If a record is removed, the source may be added to a suppression list to avoid re-import.

Base2026 is independent and is not affiliated with TikTok, Instagram, Meta, ByteDance, or any creator unless explicitly stated.

---

# Implementation notes for IDE/agent

## Page generation

Create static Markdown-driven pages or CMS pages for:

- `/roadmap`
- `/project-story`
- `/privacy-policy`
- `/source-content-policy`
- `/support`
- `/creator-correction-removal`

## UI requirements

- Keep pages readable.
- Use clear headings.
- Add support CTA on Roadmap and Project Story.
- Add correction/removal link in footer and record pages.
- Add source disclaimer in footer.

## Footer disclaimer

Suggested footer text:

> Base2026 is an independent research and discovery project. Records are based on public short-form content and are provided with attribution for search and research purposes. Creators may request correction or removal at [offflinerpsy@gmail.com](mailto:offflinerpsy@gmail.com).
