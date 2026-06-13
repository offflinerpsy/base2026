# Data Sources

Last updated: 2026-06-13

| Source | Status | Public? | Notes |
| --- | --- | --- | --- |
| TikTok: `@webhivedigital` | indexed | yes, reviewed export only | Public creator source. |
| TikTok: `@tjrobertson52` | indexed | yes, reviewed export only | Public creator source. |
| TikTok: `@build_in_public` | indexed | yes, reviewed export only | Public creator source. ay71 refresh added 1 new caption-backed source and 2 exact-evidence public insight cards. |
| TikTok: `@joshuamaraney` | indexed | yes, reviewed export only | ay63 refresh added 1 new caption-transcribed source and closed its polish/export path. Current active rows for this creator: 260 transcribed. |
| Private Base2026 SEO/GEO/AEO files | local only | no | Do not publish raw project folders. |
| `public-data/tiktok` | generated local export | no git | Latest live deploy: `base2026-modal-caption-tooltip-ay82-20260613` as a data-preserving UI hotfix over the ay81 export. Current export has 1218 source records, 1713 passages, 1607 insight cards, 1034 public insight cards, 1504 topics, 987 public topics, and 4 creators. Public release payload is excerpt-only by default and not committed. `review-legacy-insights` now reports `total_legacy_auto_public_cards=0`; clean rebuild replays 967 ignored reviewed legacy insight rows plus 85 reviewed/private candidate rows and keeps `claim_evidence` duplicate claim IDs at 0. |
| Meilisearch index `base2026_public_tiktok` | deployed runtime | public search only | Search key only; master key private. Last reindexed during `base2026-clean-replay-pipeline-ay81-20260613` deploy with 1713 passages. |
| TikTok transcript queue `config/tiktok-intake-queue.local.json` | staged/check-only active | no git | Mac pipeline refresh is operational after runner fixes. Current local inventory after ay80/ay81: 3017 total rows, 1218 active rows, 0 queued transcripts, 0 `needs_asr`, 1217 transcribed/polished rows, 0 queued ASR jobs, and 0 missing polish files. ay80 processed 2 queued 2026-06-12 caption-backed sources through the GPT/Codex text lane and exported them through reviewed gates. Current triage: 619 review flags, all audio/source-verification. Public-safe `config/creators.example.json` mirrors the 4 public creator sources. |
| TikTok source-review backlog | needs review | no git | 1 `@tjrobertson52` video remains marked `needs_source_review` because TikTok blocks current IP access to the post. The two previous no-audio fallback rows were retried with h264-first ASR fallback, transcribed, polished, and included in the excerpt-only public export. Source pages without usable public evidence stay `noindex,follow` and are excluded from source listings/sitemaps when no public evidence exists. |
| Private insight-card backfill queue | active local queue | no git | ay52 generated 21 local candidates for the 5 new source records, evidence-verified all 21, promoted 6 public candidates, and retained 15 private `needs_human` candidates. ay57/ay58/ay59 resolved/replayed the first reviewed-candidate archive. ay67-ay71 promoted 54 exact-evidence public cards after GPT/Codex review gates. ay79-ay81 closed the legacy public-card contract: public legacy cards are now explicit reviewed/approved rows, `auto_evidence_match` public output is 0, and ignored local replay archives preserve reviewed legacy/candidate state across clean SQLite rebuilds. Visual-dependent cards remain gated until a thumbnail/frame evidence lane exists. |

Rule: update this file whenever a source is added, removed, reclassified, or moved from local-only to public-safe export.
