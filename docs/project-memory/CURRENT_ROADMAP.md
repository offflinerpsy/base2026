# Current Roadmap

Last updated: 2026-06-07

## Current state

Base2026 has a working public TikTok transcript search product, a deployed VPS release, a Meilisearch index, and a repaired Hermes refresh path. The project is not GitHub-ready yet because UI quality, license choice, and final public/private audit are still open.

## Immediate order

1. Stabilize repo state
   - Review current uncommitted changes.
   - Keep private/generated artifacts out of git.
   - Commit only public-safe Hermes/docs/UI source changes after audit.

2. Public UI model
   - Use `Platform` for social network: TikTok now, Instagram planned.
   - Use `Topic` or `Category` for content meaning: SEO, GEO, AEO, Schema, Local SEO, Google, Bing, Reviews, AI Overviews, Content Strategy.
   - Do not mix platform and topic naming.

3. Public UI visual pass
   - Replace weak/default controls with a small consistent design system.
   - Fix spacing, result hierarchy, chips, checkboxes, filters, transcript expansion, and multi-term highlighting.
   - Verify desktop and mobile screenshots.

4. Instagram intake planning
   - Do not bolt Instagram into TikTok scripts blindly.
   - First generalize the public data model from TikTok-only to platform-aware video/social posts.
   - Then add Instagram source adapter and only then ingestion.

5. GitHub readiness
   - Choose license.
   - Run publication/security audit.
   - Stage only public-safe source and docs.
   - Do not push generated exports, private research, raw captions, audio/video, logs, local DB, or credentials.

## Current active phase

Phase 4 — Public web UI visual system.

## Next concrete task

Audit the current UI, normalize Platform/Topic filters, then implement the visual-system pass.
