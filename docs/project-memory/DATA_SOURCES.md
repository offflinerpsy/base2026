# Data Sources

Last updated: 2026-06-11

| Source | Status | Public? | Notes |
| --- | --- | --- | --- |
| TikTok: `@webhivedigital` | indexed | yes, reviewed export only | Public creator source. |
| TikTok: `@tjrobertson52` | indexed | yes, reviewed export only | Public creator source. |
| TikTok: `@build_in_public` | indexed | yes, reviewed export only | Public creator source. |
| TikTok: `@joshuamaraney` | indexed | yes, reviewed export only | ay51 refresh/ASR pass closed the queued caption and ASR backlog for this creator. Current active rows for this creator: 259 transcribed. |
| Private Base2026 SEO/GEO/AEO files | local only | no | Do not publish raw project folders. |
| `public-data/tiktok` | generated local export | no git | Latest local export after ay51 pipeline deploy: 1209 source records, 1696 passages, 1538 insight cards, 1442 topics, 4 creators, 1097 public insight cards. Public release payload is excerpt-only by default and not committed. Deployed as `base2026-asr-pipeline-ay51-20260611`. |
| Meilisearch index `base2026_public_tiktok` | deployed runtime | public search only | Search key only; master key private. Reindexed during `base2026-asr-pipeline-ay51-20260611` deploy with 1696 passages. |
| TikTok transcript queue `config/tiktok-intake-queue.20260608.json` | staged/check-only active | no git unless reviewed | Mac pipeline refresh is operational after runner fixes. Current local inventory: 3008 total rows, 1209 active rows, 0 queued transcripts, 0 `needs_asr`, 1206 transcribed rows, 0 queued ASR jobs. |
| TikTok source-review backlog | needs review | no git | 3 older `@tjrobertson52` videos remain marked `needs_source_review`; source pages without usable public evidence stay `noindex,follow` and are excluded from source listings/sitemaps when no public evidence exists. |
| Private insight-card backfill queue | complete local queue | no git | `.planning/backfill-insight-cards-20260611.jsonl` was processed for the final queued source; 2 evidence-verified candidates were promoted to `approved`, public cards are now 1228, queued sources are 0, and 45 sources remain recorded in ignored `.planning/reviewed-no-card-sources.jsonl` as reviewed with no promotion-safe public card. |

Rule: update this file whenever a source is added, removed, reclassified, or moved from local-only to public-safe export.
