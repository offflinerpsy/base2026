# Data Sources

Last updated: 2026-06-12

| Source | Status | Public? | Notes |
| --- | --- | --- | --- |
| TikTok: `@webhivedigital` | indexed | yes, reviewed export only | Public creator source. |
| TikTok: `@tjrobertson52` | indexed | yes, reviewed export only | Public creator source. |
| TikTok: `@build_in_public` | indexed | yes, reviewed export only | Public creator source. |
| TikTok: `@joshuamaraney` | indexed | yes, reviewed export only | ay51 refresh/ASR pass closed the queued caption and ASR backlog for this creator. Current active rows for this creator: 259 transcribed. |
| Private Base2026 SEO/GEO/AEO files | local only | no | Do not publish raw project folders. |
| `public-data/tiktok` | generated local export | no git | Latest local export after ay58 pipeline refresh: 1214 source records, 1707 passages, 1552 insight cards, 1460 topics, 4 creators, 1111 public insight cards. Public release payload is excerpt-only by default and not committed. Deployed as `base2026-pipeline-refresh-ay58-20260612`. |
| Meilisearch index `base2026_public_tiktok` | deployed runtime | public search only | Search key only; master key private. Reindexed during `base2026-pipeline-refresh-ay58-20260612` deploy with 1707 passages. |
| TikTok transcript queue `config/tiktok-intake-queue.local.json` | staged/check-only active | no git | Mac pipeline refresh is operational after runner fixes. Current local inventory: 3013 total rows, 1214 active rows, 0 queued transcripts, 0 `needs_asr`, 1213 transcribed rows, 0 queued ASR jobs, and 0 missing polish files. ay58 checked the latest 80 posts for each of the 4 configured creators and found 0 new rows. Public-safe `config/creators.example.json` mirrors the 4 public creator sources. |
| TikTok source-review backlog | needs review | no git | 1 `@tjrobertson52` video remains marked `needs_source_review` because TikTok blocks current IP access to the post. The two previous no-audio fallback rows were retried with h264-first ASR fallback, transcribed, polished, and included in the excerpt-only public export. Source pages without usable public evidence stay `noindex,follow` and are excluded from source listings/sitemaps when no public evidence exists. |
| Private insight-card backfill queue | active local queue | no git | ay52 generated 21 local candidates for the 5 new source records, evidence-verified all 21, promoted 6 public candidates, and retained 15 private `needs_human` candidates. ay57 reviewed those 15: 8 were rewritten, exact-evidence verified, imported as approved, archived in ignored `12_knowledge-base/sources/tiktok/insight-candidates/reviewed-candidates.jsonl`, and deployed publicly; 5 were rejected; 2 remain private for source/audio verification. ay58 added a resolver for reviewer decisions so the 13 superseded/rejected old candidate rows no longer reappear as false `needs_human` rows after rebuild. The archive now replays 29 reviewed/private candidate rows during clean rebuilds, while `export-public-tiktok.py` excludes non-public candidates from public JSONL. |

Rule: update this file whenever a source is added, removed, reclassified, or moved from local-only to public-safe export.
