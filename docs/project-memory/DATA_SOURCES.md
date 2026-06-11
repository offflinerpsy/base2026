# Data Sources

Last updated: 2026-06-11

| Source | Status | Public? | Notes |
| --- | --- | --- | --- |
| TikTok: `@webhivedigital` | indexed | yes, reviewed export only | Public creator source. |
| TikTok: `@tjrobertson52` | indexed | yes, reviewed export only | Public creator source. |
| TikTok: `@build_in_public` | indexed | yes, reviewed export only | Public creator source. |
| TikTok: `@joshuamaraney` | partially indexed | yes, reviewed export only | 14 caption-ready records imported on 2026-06-08; 14 staged records need ASR; 5 staged records marked out-of-scope candidate. |
| Private Base2026 SEO/GEO/AEO files | local only | no | Do not publish raw project folders. |
| `public-data/tiktok` | generated local export | no git | Latest local export after card backfill closure: 957 source records, 1396 passages, 1692 insight cards, 1586 topics, 4 creators, 1228 public insight cards. Public release payload is excerpt-only by default and not committed. Deployed as `base2026-card-backfill-ay38-20260611`. |
| Meilisearch index `base2026_public_tiktok` | deployed runtime | public search only | Search key only; master key private. Reindexed during `base2026-card-backfill-ay38-20260611` deploy with 1396 passages. |
| TikTok transcript queue `config/tiktok-intake-queue.20260608.json` | staged/check-only active | no git unless reviewed | Mac launchd check-only automation is loaded as `com.base2026.hermes-tiktok-check` and runs at 03:30 and 15:30 local time. Controller status after the targeted hydration repair shows 46 queued-source estimate; check-only inventory still does not import, promote, package, or deploy. |
| TikTok source-review backlog | needs review | no git | 2 older `@tjrobertson52` videos have fallback MP4 files with no audio stream; marked `needs_source_review`; generated static pages are now `noindex,follow` and excluded from source listings/sitemaps when no public evidence exists. |
| Private insight-card backfill queue | complete local queue | no git | `.planning/backfill-insight-cards-20260611.jsonl` was processed for the final queued source; 2 evidence-verified candidates were promoted to `approved`, public cards are now 1228, queued sources are 0, and 45 sources remain recorded in ignored `.planning/reviewed-no-card-sources.jsonl` as reviewed with no promotion-safe public card. |

Rule: update this file whenever a source is added, removed, reclassified, or moved from local-only to public-safe export.
