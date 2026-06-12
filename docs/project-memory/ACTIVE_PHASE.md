# Active Phase

Last updated: 2026-06-11

## Current active phase

Launch monitoring plus check-only TikTok intake pipeline hardening.

## Why this is active

The public intelligence layer is deployed, GitHub publication is complete, WordPress lead-flow is live, and the current source-with-passages/no-card backfill queue is closed. The immediate priority is to monitor launch/indexing/analytics and continue the local-first TikTok/source pipeline in check-only mode before any new public promotion.

## Current exact task

Run the launch monitor and next safe intake slice: retry GSC manual indexing only after quota reset, collect the first GSC/GA4 baseline, keep TikTok intake check-only by default, and harden the reviewed-candidate persistence gap so approved insight-card candidates survive clean SQLite rebuilds before future card backfills are called durable.

## Important note

Generated public pages should not be committed by default; prefer reproducible generation from scripts. Public deploys are allowed only after export policy, publication boundary, and live QA pass.
