# Data Sources

Last updated: 2026-06-11

| Source | Status | Public? | Notes |
| --- | --- | --- | --- |
| TikTok: `@webhivedigital` | indexed | yes, reviewed export only | Public creator source. |
| TikTok: `@tjrobertson52` | indexed | yes, reviewed export only | Public creator source. |
| TikTok: `@build_in_public` | indexed | yes, reviewed export only | Public creator source. |
| TikTok: `@joshuamaraney` | indexed | yes, reviewed export only | ay51 refresh/ASR pass closed the queued caption and ASR backlog for this creator. Current active rows for this creator: 259 transcribed. |
| Private Base2026 SEO/GEO/AEO files | local only | no | Do not publish raw project folders. |
| `public-data/tiktok` | generated local export | no git | Latest local export after ay53 pipeline deploy: 1214 source records, 1703 passages, 1544 insight cards, 1446 topics, 4 creators, 1103 public insight cards. Public release payload is excerpt-only by default and not committed. Deployed as `base2026-pipeline-refresh-ay53-20260611`. |
| Meilisearch index `base2026_public_tiktok` | deployed runtime | public search only | Search key only; master key private. Reindexed during `base2026-pipeline-refresh-ay53-20260611` deploy with 1703 passages. |
| TikTok transcript queue `config/tiktok-intake-queue.20260608.json` | staged/check-only active | no git unless reviewed | Mac pipeline refresh is operational after runner fixes. Current local inventory: 3013 total rows, 1214 active rows, 0 queued transcripts, 0 `needs_asr`, 1211 transcribed rows, 0 queued ASR jobs. ay53 used the ignored `.planning/tiktok-intake-all-creators-20260611.json` runtime config and found 0 new rows. |
| TikTok source-review backlog | needs review | no git | 3 older `@tjrobertson52` videos remain marked `needs_source_review`; source pages without usable public evidence stay `noindex,follow` and are excluded from source listings/sitemaps when no public evidence exists. |
| Private insight-card backfill queue | active local queue | no git | ay52 generated 21 local candidates for the 5 new source records, evidence-verified all 21, promoted 6 public candidates, and retained 15 private `needs_human` candidates. Durability gap closed in ay53: approved candidates are archived in ignored `12_knowledge-base/sources/tiktok/insight-candidates/reviewed-candidates.jsonl` and replayed by `build-kb-sqlite.py` during clean rebuilds. |

Rule: update this file whenever a source is added, removed, reclassified, or moved from local-only to public-safe export.
