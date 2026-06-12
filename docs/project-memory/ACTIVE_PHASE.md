# Active Phase

Last updated: 2026-06-12

## Current active phase

Launch monitoring plus check-only TikTok intake pipeline hardening.

## Why this is active

The public intelligence layer is deployed, GitHub publication is complete, WordPress lead-flow is live, and the current source-with-passages/no-card backfill queue is closed. The immediate priority is to monitor launch/indexing/analytics and continue the local-first TikTok/source pipeline through reviewed gates before any new public promotion.

## Current exact task

Run launch monitoring and the next reviewed TikTok/source pipeline slice. The ay66 full four-creator `PlaylistEnd=1000` refresh found 0 added rows and left 0 queued transcripts, 0 `needs_asr`, 0 queued ASR jobs, and 0 missing polish files. ay67 used a source-only GPT/Codex review packet for 10 queued no-card sources and promoted 4 reviewer-approved candidates. ay68 then used two more source-only GPT/Codex batches for 16 queued no-card sources, created 13 exact-evidence candidate cards, skipped 3 weak or fragile sources, promoted all 13 after the reviewer gate, rebuilt SQLite from the durable private replay archive, exported the excerpt-only public layer, deployed `base2026-chatgpt-card-batch02-03-ay68-20260612`, and reindexed Meilisearch. Current live release is `base2026-chatgpt-card-batch02-03-ay68-20260612`. The live export has 1215 source records, 1708 passages, 1570 insight cards, 1129 public insight cards, 1473 topics, and 1066 public topics. The remaining transcript QA bucket is 619 audio/source-verification rows, and one TikTok source-review row remains blocked by TikTok/IP access.

## Important note

Generated public pages should not be committed by default; prefer reproducible generation from scripts. Public deploys are allowed only after export policy, publication boundary, and live QA pass.
