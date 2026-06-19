# Current Handoff

Last updated: 2026-06-19

Purpose: this is the compact resume file for Base2026. Read this after `AGENTS.md`, then read only the referenced files needed for the next edit. Do not rehydrate the full project memory unless this file conflicts with repo state.

## Anti-Loop Resume Protocol

Required resume order:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/project-memory/LAUNCH_COMMAND_CENTER.md`.
4. Read `docs/project-memory/PIPELINE_ERROR_LEDGER.md` only for intake/deploy/release work.
5. Run `git status --short --branch --untracked-files=no` or a similarly bounded status check.
6. Read only the task-specific source/runbook files named in the handoff or command center.

Do not reread the full project-memory bundle unless one of these is true:

- this file conflicts with current repo state;
- the task explicitly touches deployment, publication boundary, data sources, or visual system contracts;
- the next action is unclear after reading this file and the command center;
- the user asks for a full audit/restart.

Generated `web/static/**`, `public-data/**`, `output/**`, `.planning/**`, local DBs, media, logs, and private review archives are not context material by default.

## Active Goal

Keep Base2026 launch work stable and reproducible: public UI fixes, SEO/GSC work, TikTok/source refresh, deploy, Meilisearch reindex, and GitHub preparation must run through bounded checklists and repo memory instead of ad hoc chat memory.

## Current Branch And Release State

- Branch: `codex/base2026-launch-next`; pushed to GitHub and fast-forwarded into GitHub `main` on 2026-06-19.
- Current live release: `base2026-source-review-local-caption-ay51-20260619`.
- Current live export: 1,467 source records, 2,001 passages, 1,630 insight cards, 1,059 public insight cards, 1,521 topics, 1,007 public topics, 10 creators.
- Current policy: `include_full_transcripts=false`.
- Current Meilisearch index: `base2026_public_tiktok`, 2,001 public passages.
- Latest live QA: SEO crawl gate passed 500 crawled pages with 0 P0 bad links and 0 crawled error pages; full mobile visual QA rerun passed with 78 checks and 0 failures.

## What Was Just Done

- Processed the AI Recommends Solutions creator pass for `@heytonyagency`, `@iamdandavies`, `@harrysandersseo`, `@ray_fu`, and `@gobigsystems`.
- Ran `scripts/social-discover.py` into ignored private JSONL: 200 discovered source records across 10 configured TikTok creators, 0 failures.
- Ran importer dry-run/apply into private local `videos.csv`: 100 new candidate rows added and safe missing metadata updated with an ignored backup.
- Ran Hermes refresh with `hermes-polish-20260618-ai-recommends`: 100 selected captions, 77 transcribed/polished, 23 `needs_asr`, 0 failed.
- Ran GPT polish and QA: 30 passed, 47 `needs_review`, 0 failed.
- Gated 47 QA-needs-review rows as `needs_source_review`; they were not allowed into public release.
- Added one strict exact-evidence reviewed public insight for `@iamdandavies` / `tiktok-video-7652708771701067030` after newest-source readiness correctly blocked a source-only row.
- Fixed `scripts/hermes-tiktok-refresh.ps1 -AfterPolish` so it skips inventory/caption intake and cannot expand `videos.csv` during release packaging.
- Ran `base2026-ai-recommends-readiness-fix-ay44-20260619` through package, deploy, Meilisearch reindex, live SEO crawl, and mobile QA.
- Before ay44, ay43 briefly packaged/deployed but an extended `--latest 3` readiness check caught two fresh `@gobigsystems` source-only pages. ay44 fixed the root cause by adding two strict exact-evidence reviewed Source Intelligence cards, then reran the full release gate with `-LatestReadiness 3`.
- Retried the audio-backed source-review queue and deployed `base2026-asr-gobig-pipeline-ay45-20260619`: one QA-pass `@gobigsystems` ASR-recovered source shipped publicly, 13 weak/no-speech ASR rows stayed private, Meilisearch reindexed 1,980 public passages, live SEO crawl passed, and the mobile visual QA rerun passed 78/0.
- Deployed `base2026-gobig-readiness-card-ay46-20260619` after newest-source readiness found one ay45 source-only `@gobigsystems` row; ay46 adds one strict exact-evidence Source Intelligence card for `Google Business Profile Categories` and keeps the remaining source-review backlog gated.
- Mechanically cleaned fifteen local-caption source-review rows across ay47-ay51, approved them through `scripts/tiktok-qa-review-apply.py`, cleared only those explicit QA-pass rows back to `transcribed` with `scripts/tiktok-clear-reviewed-source-rows.py`, and deployed `base2026-source-review-local-caption-ay51-20260619` through the canonical release gate. The private gated queue is now 45 rows: 30 local-caption review rows, 13 audio-backed too-little/no-speech rows, and 2 rows with no usable local caption/audio. One adjacent `@ray_fu` row remains private because unresolved product/model names need source verification before publication.

## Verification So Far

- `git diff --check` passed.
- `python3 scripts/audit-publication-boundary.py` passed with forbidden 0, needs_review 0, secret_findings 0.
- `python3 scripts/validate-github-metadata.py` passed.
- `python3 scripts/check-public-export-policy.py public-data/tiktok` passed.
- `python3 scripts/validate-public-release-contract.py --export-dir public-data/tiktok --baseline-export-dir public-data/tiktok --enforce-count-floor` passed.
- `pwsh ./scripts/base2026-release-gate.ps1 -Help` exits without running intake/deploy.
- `pwsh ./scripts/hermes-tiktok-refresh.ps1 -Help` exits without running inventory/intake.
- Phase 1/2 verification passed: `scripts/base2026-worker.py doctor` reports required/optional capabilities, TikTok discovery smoke wrote 15 private JSONL rows across 5 creators via `tiktok_yt_dlp_flat_playlist`, Instagram missing-adapter state is explicit, `.planning/` outputs are ignored, and `12_knowledge-base/sources/tiktok/videos.csv` hash stayed unchanged.
- Phase 3 verification passed: importer dry-run found 15 TikTok candidates; apply added 1 new queued recent source (`7652732487843581206`) and safely filled missing metadata for 14 existing rows; a post-apply dry run showed 0 new rows and 0 updates; backup is under ignored `.planning/backups/`.
- `scripts/hermes-tiktok-refresh.ps1 -CheckOnly` is now truly read-only. It runs social discovery plus importer dry-run, then prints current queue state. A hash check around `-CheckOnly -PlaylistEnd 3` proved `videos.csv` did not change.
- ay45 release gate passed package and deploy lanes: `-LatestReadiness 3`, publication boundary, GitHub metadata, public export policy, public release contract, VPS deploy, Meilisearch reindex, live SEO crawl, and mobile visual QA rerun.
- ay51 source-review release is live: symlink points to `base2026-source-review-local-caption-ay51-20260619`; public export policy, release contract, newest-source readiness, live SEO crawl gate, and mobile visual QA pass.
- ay44 live smoke verified `/knowledge/`, live manifest counts, and the two `@gobigsystems` source pages `tiktok-video-7652081880103275789` and `tiktok-video-7652520714678832398` with `Source Intelligence`.
- Final repo gates after the memory update passed: `git diff --check`, publication-boundary audit, GitHub metadata validation, public export policy, public release contract, and newest-source readiness.

## Open Loops

- Git commit/push for the Base2026 release-gate/social-intake work is done; GitHub `main` now contains the checked release-gate/social-intake branch after a non-force fast-forward push.
- `docs/research/FREE_SOCIAL_VIDEO_INTAKE_RECOMMENDATIONS_2026_06_18.md` is committed as a public-safe research artifact and is now the source for PIPE-02 Phase 1/2.
- The AI Recommends Solutions creator pass is closed in the live ay51 release. The Hermes batch processed 77 videos: 30 passed immediately, 15 local-caption rows were mechanically cleaned and approved through `tiktok-qa-review-apply.py` plus `tiktok-clear-reviewed-source-rows.py`, 1 ASR-recovered row passed later, and ay46 added 1 exact-evidence readiness card. Current private inventory has 0 `needs_asr` rows and 45 `needs_source_review` rows: 30 local-caption review rows, 13 audio-backed rows with too little/no usable ASR, and 2 rows without usable local caption/audio. Those require source/audio verification before public export.
- GSC individual URL submissions are manual-only for now because browser automation previously clicked the wrong UI areas and GSC quota was exhausted.
- Historical source/audio verification debt remains gated; do not bulk-pass held rows.
- Future data-changing releases must use `scripts/base2026-release-gate.ps1`.

## Exact Next Safe Action

1. If the user gives new creators, add them to the ignored local creator/intake config, run social discovery, dry-run the importer, apply only clean TikTok candidates, then process them through `scripts/base2026-release-gate.ps1 -LatestReadiness 3`.
2. If the user gives more creators, use the committed release-gate workflow and do not bypass source-review/readiness gates.
3. Do not stage ignored generated release artifacts, `public-data`, `.planning`, `output`, local DBs, logs, raw captions, ASR, media, tokens, or private review archives.
