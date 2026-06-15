# Active Phase

Last updated: 2026-06-15

## Current active phase

Public product architecture correction plus launch monitoring and check-only TikTok intake pipeline hardening.

## Why this is active

The public intelligence layer is deployed, GitHub publication is complete, WordPress lead-flow is live, and the current source-with-passages/no-card backfill queue is closed. The immediate priority is to correct the public product contract so the UI behaves like the intended searchable video-source database, while continuing launch/indexing/analytics monitoring and local-first TikTok/source pipeline work through reviewed gates.

## Current exact task

Correct the Base2026 product passport, source-detail value layer, and pipeline readiness gates after the operator clarified the original database idea. The current live public release is `base2026-content-pipeline-fix-20260615`.

The live release is safe but not the final product contract: it still renders selected source records as excerpt-first evidence pages. Base2026 should instead expose reviewed polished public source text/transcript as the source-record reading surface when policy allows, with raw captions/ASR/media kept private and Base2026-authored summaries, topics, insight cards, attribution, methodology, and correction/removal paths layered around it.

ay79 completed the legacy public-card migration contract: old `auto_evidence_match` public cards were moved to explicit reviewed/approved state, the export kept the public-card floor, and the release deployed with 1216 source records, 1709 passages, and 1034 public insight cards. ay80 then ran the next TikTok slice, found 2 queued 2026-06-12 caption-backed sources, polished both through the GPT/Codex text lane, rebuilt SQLite, exported 1218 source records and 1713 passages, packaged/deployed, and reindexed Meilisearch. ay81 closed the rebuild root cause by adding a clean-rebuild replay hook for ignored reviewed legacy insight archives, creating the local reviewed legacy archive, rebuilding SQLite from scratch, proving `claim_evidence` has 0 duplicate claim IDs, repackaging, deploying, and reindexing Meilisearch.

ay82 was a data-preserving source-dialog UI hotfix on top of ay81: caption metadata presented as a snippet, info tooltips stayed inside the dialog/viewport, and GitHub Actions/Dependabot were disabled in favor of local validation scripts. ay83 introduced an in-page source-detail workspace but its three-column desktop shape was rejected. ay84 restored the accepted two-column `filters | workspace` contract. ay87 removed caption/platform metadata snippets everywhere, processed the current 2026-06-13 TikTok queue, published `tiktok-video-7650935514643614998`, held `tiktok-video-7650940529575775501` as `needs_source_review`, and reindexed Meilisearch with 1714 passages. ay88 simplified source-detail navigation and removed bottom provenance/caption/empty sections. ay89 is the current live UI hotfix: public source detail is insight-first, source evidence is rendered once as a short `Evidence Excerpt`, duplicate transcript-like matched/related blocks are deduped, and static source pages plus runtime `/knowledge/?source=` use the same source-workspace contract.

Current live export: 1219 source records, 1715 passages, 1614 insight cards, 1043 public insight cards, 1510 topics, 995 public topics, and 4 creators. Current live release is `base2026-content-pipeline-fix-20260615`: it keeps reviewed `public_source_text`, `source_summary_short`, and `source_summary_long`, keeps legacy `transcript` empty, collapses reviewed evidence inside Source Intelligence cards by default, adds runtime source share actions, and blocks newest source-only records with no topics/public insights during release packaging. Meilisearch was reindexed in this deploy with 1715 passages because topic fields changed. Clean rebuild now replays 967 ignored reviewed legacy insight rows plus 92 reviewed/private candidate rows. Current transcript status remains 1219 transcribed public-source records with source-review debt gated. Remaining QA debt is the historical audio/source-verification transcript rows plus source-access review debt that must stay gated.

## Important note

Generated public pages should not be committed by default; prefer reproducible generation from scripts. Public deploys are allowed only after export policy, publication boundary, and live QA pass.
