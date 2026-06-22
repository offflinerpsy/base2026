# Next Action

## Current Focus: ay54 Live, GitHub Open-Source Readiness Docs Updated

Status: MacBook pipeline refresh is live on branch `codex/base2026-launch-next`. GitHub/open-source readiness docs were cleaned up on 2026-06-22 without committing/pushing.

Latest docs-readiness note:

- `README.md` now reflects live ay54 metrics: 1,476 source records, 2,016 passages, 1,631 insight cards, 1,060 public insight cards, 1,522 topics, 1,008 public topics, and 10 creators.
- Added public-safe root docs: `GOVERNANCE.md`, `ROADMAP.md`, `CHANGELOG.md`.
- Added `.github/FUNDING.yml` with safe commented placeholders until public sponsor accounts are configured.
- Updated `scripts/audit-publication-boundary.py` and `docs/project-memory/PUBLICATION_BOUNDARY.md` so the new docs are public-safe candidates.
- Verification passed: `git diff --check`, `python3 scripts/audit-publication-boundary.py` (`needs_review=0`, `forbidden=0`, `secret_findings=0`), `python3 scripts/validate-github-metadata.py`, and YAML parse for `.github/FUNDING.yml`.

## Previous Focus: ay54 Live, Source Intelligence Contract Fixed, Queue Continuing Under Canonical Gate

Latest local transcript QA note:

- Retried the 14 audio-backed source-review rows through `scripts/tiktok-process-transcripts.ps1 -AsrFallback -IncludeSourceReview -SourceReviewReason audio_available_retry_asr -Limit 14`.
- Result: 1 ASR transcript became usable and was polished/QA-passed; 13 rows remain private because ASR produced too little or no usable speech.
- Published only the QA-pass `@gobigsystems` row through canonical release `base2026-asr-gobig-pipeline-ay45-20260619`.
- Added one strict exact-evidence `@gobigsystems` Source Intelligence card for `Google Business Profile Categories` after newest-source readiness caught the ay45 source-only gap, then deployed `base2026-gobig-readiness-card-ay46-20260619`.
- Mechanically cleaned and approved 21 local-caption source-review rows across ay47-ay53, cleared only those explicit QA-pass rows back to `transcribed` with `scripts/tiktok-clear-reviewed-source-rows.py`, and deployed `base2026-source-review-local-caption-ay53-20260619`.
- Fixed the ay54 source-detail contract bug for `tiktok-video-7652384458804432136`: Source Intelligence now exists for that public source, and "Questions this source answers" renders only from reviewed Source Intelligence instead of copying Source Text.
- ay51 shipped three more QA-pass rows (`@heytonyagency`, `@ray_fu`, and `@harrysandersseo`); one adjacent `@ray_fu` row stayed private because unresolved product/model names made the caption unsafe to publish without external source verification.
- ay52 shipped six more QA-pass local-caption rows; adjacent rows with unresolved entity/product/model wording or visual/source dependence stayed private.
- Current source-review audit has 36 private gated rows: 21 local-caption rows requiring source/audio review, 13 audio-backed rows that produced too little/no usable ASR, and 2 rows with no usable local caption/audio yet.
- The ASR retry script now reports `asr_too_little`, `asr_no_usable`, `asr_no_audio`, and `asr_worker_parse_failed`, and dedupes repeated review notes.

- Processed `hermes-polish-20260618-asr-review` batches 001-003 in the GPT-5.5 quality lane.
- Created 21 polished transcript files and 21 QA JSON files under `12_knowledge-base/sources/tiktok/transcripts/`.
- QA totals: 10 `pass`, 11 `needs_review`, 0 `failed`.
- The source-review queue is now repeatable with `python3 scripts/tiktok-source-review-queue.py --limit 25`; use it before touching any held row so the next action is based on actual private evidence availability, not chat memory.
- Next transcript action: source-verify the 24 local-caption rows, keep the 13 ASR-too-little rows private until better source/audio evidence exists, and keep the 2 no-source rows private until usable source/audio exists. Do not allow any of those rows into a public release gate before review passes.

Current verified facts:

- Current live release: `base2026-source-intelligence-contract-ay54-20260619`.
- The release used the canonical gate `scripts/base2026-release-gate.ps1` instead of an ad hoc chat sequence.
- The AI Recommends Solutions creator pass was processed from ignored private discovery output: `@heytonyagency`, `@iamdandavies`, `@harrysandersseo`, `@ray_fu`, and `@gobigsystems`.
- Discovery found 200 source records across 10 configured creators; the importer added 100 new candidate rows into private local `videos.csv`.
- GPT polish produced 77 polished transcripts: 30 QA-pass rows shipped publicly first, 24 more were mechanically cleaned, approved through the source-review apply gate, cleared with the explicit source-review CSV transition script, and shipped in ay47-ay53; one ASR-recovered source shipped in ay45; one newest-source readiness card shipped in ay46. The remaining rows stayed gated for source/audio review.
- The newest-source readiness gate initially blocked the latest `@iamdandavies` source because it had public text but no public topic/insight layer.
- A strict exact-evidence reviewed insight was added for `@iamdandavies` / `tiktok-video-7652708771701067030` under the topic `WordPress static homepage setup`.
- `AfterPolish` completed successfully after `scripts/hermes-tiktok-refresh.ps1` was fixed so `-AfterPolish` skips inventory/caption intake and cannot expand the private queue.
- Current live public export counts: 1,476 source records, 2,016 passages, 1,631 insight cards, 1,060 public insight cards, 1,522 topics, 1,008 public topics, 10 creators.
- `include_full_transcripts=false`.
- Meilisearch was reindexed with 2,016 public passages.
- ay43 briefly proved why the readiness gate must inspect more than the newest single source: `--latest 3` caught two fresh `@gobigsystems` source-only pages. ay44 fixed them with two exact-evidence reviewed Source Intelligence cards and deployed through `-LatestReadiness 3`.
- Live SEO crawl gate passed 500 crawled pages with 0 P0 bad links and 0 crawled error pages.
- Full mobile visual QA passed: 78 checks, 0 failures.
- Phase 1 from the free social intake recommendation is implemented: `scripts/base2026-worker.py doctor` reports required tools, optional adapters, and capability states without failing on missing optional tools.
- Phase 2 is implemented: `scripts/social-discover.py` reads current creator config shapes, uses TikTok `yt-dlp --flat-playlist` first, records Instagram missing-adapter state instead of faking results, and writes normalized private JSONL only.
- Phase 3 bridge is implemented: `scripts/import-social-discovery-to-tiktok-csv.py` imports TikTok-only discovery rows into private local `videos.csv` with dry-run default, dedupe by `video_id`, safe missing-metadata updates, old-row cutoff, and ignored `.planning/backups/` backup on apply.
- `scripts/hermes-tiktok-refresh.ps1 -CheckOnly` is verified read-only: it runs `social-discover.py` plus importer dry-run and must preserve the exact `videos.csv` hash before/after.

Final ay54 live verification is complete:

- live server current symlink points to `base2026-source-intelligence-contract-ay54-20260619`.
- `git diff --check` passed.
- `python3 scripts/audit-publication-boundary.py` passed with `forbidden=0`, `needs_review=0`, `secret_findings=0`.
- `python3 scripts/validate-github-metadata.py` passed.
- `python3 scripts/check-public-export-policy.py public-data/tiktok` passed with `include_full_transcripts=false`.
- `python3 scripts/validate-public-release-contract.py --export-dir public-data/tiktok --baseline-export-dir public-data/tiktok --enforce-count-floor` passed.
- `python3 scripts/check-public-content-readiness.py --data-root public-data/tiktok --latest 3 --fail` passed.
- ay51 newest-source readiness passed with 0 blocked newest records.
- Full mobile visual QA passed: 78 checks, 0 failures.
- Direct live smoke for `https://aggressorbulkit.online/knowledge/sources/tiktok-video-7652384458804432136.html` confirmed Source Intelligence is present, the old empty state is absent, and the previous raw-source Q&A fallback is absent.

Next safe action:

1. If the user gives new creators, add them to ignored local creator/intake config, run `scripts/social-discover.py`, dry-run `scripts/import-social-discovery-to-tiktok-csv.py`, apply only clean TikTok candidates, then process the resulting queue through `scripts/base2026-release-gate.ps1 -LatestReadiness 3`.
2. If the user asks why videos are held, run `python3 scripts/tiktok-source-review-queue.py --limit 25` and process only rows with verified local evidence. Do not bulk-pass the 36 held rows.
3. If the user explicitly asks for Git, stage only public-safe source/docs files that passed `audit-publication-boundary.py`; do not stage generated/private artifacts.
4. If the user asks for product/SEO work first, pick one scoped task from `UI-01` or `SEO-01` in `docs/project-memory/LAUNCH_COMMAND_CENTER.md`; handle Git only when a new safe change actually needs staging after gates.

## Do Not Do

- Do not commit/push new changes unless final verification is complete and the user explicitly approves or the active goal already requires the Git step.
- Do not publish raw captions, raw ASR, audio/video, local DB files, `.planning/`, `output/`, `public-data/`, logs, cookies, tokens, credentials, or generated release archives.
- Do not bypass transcript/source review flags.
- Do not automate GSC request-indexing clicks in the user's live browser.

## Resume Rule

On the next resume, read only:

1. `AGENTS.md`
2. `docs/project-memory/CURRENT_HANDOFF.md`
3. `docs/project-memory/LAUNCH_COMMAND_CENTER.md`
4. `docs/project-memory/PIPELINE_ERROR_LEDGER.md`
5. this file

Then run a bounded `git status`. Do not reread the full project-memory bundle unless a concrete gate fails.
