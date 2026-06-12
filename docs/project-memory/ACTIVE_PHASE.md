# Active Phase

Last updated: 2026-06-12

## Current active phase

Launch monitoring plus check-only TikTok intake pipeline hardening.

## Why this is active

The public intelligence layer is deployed, GitHub publication is complete, WordPress lead-flow is live, and the current source-with-passages/no-card backfill queue is closed. The immediate priority is to monitor launch/indexing/analytics and continue the local-first TikTok/source pipeline through reviewed gates before any new public promotion.

## Current exact task

Run launch monitoring and the next reviewed TikTok/source pipeline slice. The ay66 full four-creator `PlaylistEnd=1000` refresh found 0 added rows and left 0 queued transcripts, 0 `needs_asr`, 0 queued ASR jobs, and 0 missing polish files. ay67-ay69 used source-only GPT/Codex review packets for queued no-card sources and promoted 32 exact-evidence public cards. ay70 used two more GPT/Codex batches, promoted 20 exact-evidence public cards, and rejected 1 over-limit candidate instead of overloading a source page. ay71 then ran the local TikTok refresh, found 1 new `@build_in_public` source, caption-polished it via Codex/GPT review, promoted 2 exact-evidence public cards for that new source, rebuilt/exported/deployed, and reindexed Meilisearch. ay72 synced the public roadmap statuses to that actual pipeline state and deployed `base2026-roadmap-status-sync-ay72-20260612`. ay73 fixed the live source-modal document payload cache mismatch by versioning `documents.jsonl` with the release cache-bust. ay76 fixed the root mobile-regression cause by normalizing generated source/topic/static-page CSS/JS cache-busts after all generators run, tightened the mobile source modal, fixed the Base2026 mobile submenu width, and deployed `base2026-cachebust-mobilefix-ay76-20260612`. WordPress child theme `1.5.41` adds visible mobile form focus/validation for the roadmap CTA. Current live release is `base2026-cachebust-mobilefix-ay76-20260612`. The live export has 1216 source records, 1709 passages, 1607 insight cards, 1165 public insight cards, 1505 topics, and 1096 public topics. The remaining transcript QA bucket is 619 audio/source-verification rows, and one TikTok source-review row remains blocked by TikTok/IP access.

## Important note

Generated public pages should not be committed by default; prefer reproducible generation from scripts. Public deploys are allowed only after export policy, publication boundary, and live QA pass.
