# Active Phase

Last updated: 2026-06-12

## Current active phase

Launch monitoring plus check-only TikTok intake pipeline hardening.

## Why this is active

The public intelligence layer is deployed, GitHub publication is complete, WordPress lead-flow is live, and the current source-with-passages/no-card backfill queue is closed. The immediate priority is to monitor launch/indexing/analytics and continue the local-first TikTok/source pipeline through reviewed gates before any new public promotion.

## Current exact task

Run launch monitoring and the next reviewed TikTok/source pipeline slice. The ay55 full-creator refresh/deploy found 0 new videos and passed export/live QA. The reviewed-candidate persistence gap is closed for both public approved candidates and private `needs_human` review-queue candidates. Non-public `insight_card_candidate` rows replay locally but are excluded from public export. Source-review blockers are auditable with `scripts/tiktok-source-review-audit.py`; continue with transcript-QA cleanup, candidate rewrite/review, GSC/GA4 baseline capture, and future TikTok refreshes through the reviewed gate before public deployment.

## Important note

Generated public pages should not be committed by default; prefer reproducible generation from scripts. Public deploys are allowed only after export policy, publication boundary, and live QA pass.
