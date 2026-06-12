# Active Phase

Last updated: 2026-06-12

## Current active phase

Launch monitoring plus check-only TikTok intake pipeline hardening.

## Why this is active

The public intelligence layer is deployed, GitHub publication is complete, WordPress lead-flow is live, and the current source-with-passages/no-card backfill queue is closed. The immediate priority is to monitor launch/indexing/analytics and continue the local-first TikTok/source pipeline through reviewed gates before any new public promotion.

## Current exact task

Run launch monitoring and the next reviewed TikTok/source pipeline slice. The ay63 refresh added 1 new `@joshuamaraney` source, transcribed it from caption metadata, corrected a source-backed NVIDIA founder entity artifact, exported it publicly, deployed `base2026-intake-entity-normalizer-ay63-20260612`, and reindexed Meilisearch. A 2026-06-12 post-refresh scan checked the latest 160 public posts per configured creator through the full local rebuild/export path and a deeper `PlaylistEnd=1000` inventory check; both found 0 new videos, 0 queued transcripts, 0 `needs_asr`, 0 queued ASR jobs, and 0 missing polish files. One private `needs_human` card candidate remains for source/audio verification, and one TikTok IP-blocked source-review row remains. Non-public `insight_card_candidate` rows replay locally but are excluded from public export. Transcript QA cleanup is now 637 remaining review flags: 583 audio-verification rows, 45 entity/spelling rows, and 9 human text-review rows.

## Important note

Generated public pages should not be committed by default; prefer reproducible generation from scripts. Public deploys are allowed only after export policy, publication boundary, and live QA pass.
