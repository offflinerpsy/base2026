# Active Phase

Last updated: 2026-06-12

## Current active phase

Launch monitoring plus check-only TikTok intake pipeline hardening.

## Why this is active

The public intelligence layer is deployed, GitHub publication is complete, WordPress lead-flow is live, and the current source-with-passages/no-card backfill queue is closed. The immediate priority is to monitor launch/indexing/analytics and continue the local-first TikTok/source pipeline through reviewed gates before any new public promotion.

## Current exact task

Run launch monitoring and the next reviewed TikTok/source pipeline slice. The ay66 full four-creator `PlaylistEnd=1000` refresh found 0 added rows and left 0 queued transcripts, 0 `needs_asr`, 0 queued ASR jobs, and 0 missing polish files. ay67 then used a source-only GPT/Codex review packet for 10 queued no-card sources, evidence-verified 9 candidate cards, promoted only the 4 reviewer-approved candidates, rebuilt SQLite from the durable private replay archive, exported the excerpt-only public layer, deployed `base2026-chatgpt-card-batch01-ay67-20260612`, and reindexed Meilisearch. Current live release is `base2026-chatgpt-card-batch01-ay67-20260612`. The live export has 1215 source records, 1708 passages, 1557 insight cards, 1117 public insight cards, 1464 topics, and 1058 public topics. Five exact-evidence candidates stayed private because they tripped the source promotion-limit reviewer gate; the remaining transcript QA bucket is 619 audio/source-verification rows, and one TikTok source-review row remains blocked by TikTok/IP access.

## Important note

Generated public pages should not be committed by default; prefer reproducible generation from scripts. Public deploys are allowed only after export policy, publication boundary, and live QA pass.
