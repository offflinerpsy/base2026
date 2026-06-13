# Active Phase

Last updated: 2026-06-13

## Current active phase

Launch monitoring plus check-only TikTok intake pipeline hardening.

## Why this is active

The public intelligence layer is deployed, GitHub publication is complete, WordPress lead-flow is live, and the current source-with-passages/no-card backfill queue is closed. The immediate priority is to monitor launch/indexing/analytics and continue the local-first TikTok/source pipeline through reviewed gates before any new public promotion.

## Current exact task

Run launch monitoring and the next reviewed TikTok/source pipeline slice. The current live release is `base2026-clean-replay-pipeline-ay81-20260613`.

ay79 completed the legacy public-card migration contract: old `auto_evidence_match` public cards were moved to explicit reviewed/approved state, the export kept the public-card floor, and the release deployed with 1216 source records, 1709 passages, and 1034 public insight cards. ay80 then ran the next TikTok slice, found 2 queued 2026-06-12 caption-backed sources, polished both through the GPT/Codex text lane, rebuilt SQLite, exported 1218 source records and 1713 passages, packaged/deployed, and reindexed Meilisearch. ay81 closed the rebuild root cause by adding a clean-rebuild replay hook for ignored reviewed legacy insight archives, creating the local reviewed legacy archive, rebuilding SQLite from scratch, proving `claim_evidence` has 0 duplicate claim IDs, repackaging, deploying, and reindexing Meilisearch.

Current live export: 1218 source records, 1713 passages, 1607 insight cards, 1034 public insight cards, 1504 topics, 987 public topics, 4 creators, and excerpt-only source/dialog payloads. `review-legacy-insights` reports `total_legacy_auto_public_cards=0`. Current transcript status: 1217 polished transcripts, 0 queued transcripts, 0 queued ASR jobs, and 0 missing polish files. Remaining QA debt is the historical 619 audio/source-verification transcript rows plus source-access review debt that must stay gated.

## Important note

Generated public pages should not be committed by default; prefer reproducible generation from scripts. Public deploys are allowed only after export policy, publication boundary, and live QA pass.
