# UI Visual Backlog

Last updated: 2026-06-06

## Problem

The public knowledge UI works technically, but the visual system is weak: inconsistent spacing, default-looking controls, cramped result cards, unclear filter behavior, and transcript text that can feel clipped or blob-like.

## Design target

Plain, useful, readable search interface. Closer to a clean research/search console than a decorative landing page.

## Required fixes

0. Information model
   - Separate platform/source filters from content categories.
   - Platform filter must support at least TikTok and Instagram in the UI model, even if current data is TikTok-only.
   - Content categories/topics should describe what a post is about: SEO, GEO, AEO, AI Overviews, Local SEO, Schema, Bing, Google, Reviews, Content Strategy, etc.
   - Do not call platforms "categories"; use "Platform" for TikTok/Instagram and "Topic" or "Category" for content meaning.

1. Controls
   - Make search input, buttons, checkboxes, chips, and filter panels visually consistent.
   - Use clear focus, hover, active, disabled, and selected states.

2. Results
   - Rename vague labels where needed.
   - Improve result card hierarchy: creator, date, source, title/caption, highlighted excerpt, actions.
   - Support multiple selected keyword chips and highlight all active query terms.

3. Transcripts
   - Avoid hard clipping without an obvious expand action.
   - Show readable paragraph rhythm.
   - Keep full source/transcript access discoverable.

4. Layout
   - Normalize spacing and widths across header, search, filters, and results.
   - Verify desktop and mobile.
   - No nested cards, no decorative bloat, no hero fluff.

5. GitHub readiness
   - UI source must be public-safe.
   - Generated exports, private source files, screenshots, raw captions, audio/video, logs, and local DB files stay out of git.
   - Before GitHub publication, finish visual pass, choose license, and run security/publication audit.

## Reviewer gate

UI work is not done until screenshots pass:

- desktop search state,
- desktop source/transcript state,
- mobile search state,
- mobile source/transcript state.

Reviewer must check text overflow, control alignment, filter clarity, and whether a normal user can understand the next action without being told.
