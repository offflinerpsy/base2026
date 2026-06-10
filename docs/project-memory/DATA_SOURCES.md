# Data Sources

Last updated: 2026-06-10

| Source | Status | Public? | Notes |
| --- | --- | --- | --- |
| TikTok: `@webhivedigital` | indexed | yes, reviewed export only | Public creator source. |
| TikTok: `@tjrobertson52` | indexed | yes, reviewed export only | Public creator source. |
| TikTok: `@build_in_public` | indexed | yes, reviewed export only | Public creator source. |
| TikTok: `@joshuamaraney` | partially indexed | yes, reviewed export only | 14 caption-ready records imported on 2026-06-08; 14 staged records need ASR; 5 staged records marked out-of-scope candidate. |
| Private Base2026 SEO/GEO/AEO files | local only | no | Do not publish raw project folders. |
| `public-data/tiktok` | generated local export | no git | Latest local export after GPT/Codex source-only backfill and promotion review: 957 source records, 1392 passages, 1690 insight cards, 1584 topics, 4 creators, 1226 public insight cards. Public release payload is excerpt-only by default. Packaged as `base2026-full-cards-ay24-20260610`, not committed. |
| Meilisearch index `base2026_public_tiktok` | deployed runtime | public search only | Search key only; master key private. Reindexed for `base2026-ui-hotfix-ay29c-20260610` with 1392 passages, searchable `topic_labels`, and filterable `topics`. |
| TikTok transcript queue `config/tiktok-intake-queue.20260608.json` | staged/check-only active | no git unless reviewed | Mac launchd check-only automation is loaded as `com.base2026.hermes-tiktok-check` and runs at 03:30 and 15:30 local time. Latest smoke inventory found 2419 total TikTok rows, 999 active rows, 57 queued transcripts, 0 `needs_asr`, 940 transcribed, and 0 `needs_polish`. |
| TikTok source-review backlog | needs review | no git | 2 older `@tjrobertson52` videos have fallback MP4 files with no audio stream; marked `needs_source_review`. |
| Private insight-card backfill queue | complete local queue | no git | `.planning/backfill-insight-cards-20260610.jsonl` now has 0 queued sources. GPT/Codex reviewed all remaining sources with passages and no insight cards; 1226 cards are public, and 45 sources are recorded in ignored `.planning/reviewed-no-card-sources.jsonl` as reviewed with no promotion-safe public card. |

Rule: update this file whenever a source is added, removed, reclassified, or moved from local-only to public-safe export.
