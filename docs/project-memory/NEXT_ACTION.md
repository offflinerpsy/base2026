# Next Action

## Current Focus: ay42 Live, Canonical Pipeline Ready For Next Creators

Status: MacBook pipeline refresh is live on branch `codex/base2026-launch-next`.

Latest local transcript QA note:

- Processed `hermes-polish-20260618-audio-retry/batch-001.md` in the GPT-5.5 quality lane.
- Created 1 polished transcript file and 1 QA JSON file under `12_knowledge-base/sources/tiktok/transcripts/`.
- QA totals for this batch: 0 `pass`, 1 `needs_review`, 0 `failed`.
- The only row, `tiktok-video-7540750877359983879`, preserves the repeated raw `Lizard!` caption text and remains `needs_review` because it appears to be a caption/audio artifact requiring source/audio verification.

- Processed `hermes-polish-20260618-asr-review` batches 001-003 in the GPT-5.5 quality lane.
- Created 21 polished transcript files and 21 QA JSON files under `12_knowledge-base/sources/tiktok/transcripts/`.
- QA totals: 10 `pass`, 11 `needs_review`, 0 `failed`.
- Current source-review audit has 64 private gated rows: 48 have local captions that require source/audio review, 14 have audio fallback that can be retried through ASR, and 2 have no usable local caption/audio yet.
- Next transcript action: source-verify the 48 local-caption rows, retry ASR on the 14 audio-backed rows, and keep the 2 no-source rows private until usable source/audio exists. Do not allow any of those rows into a public release gate before review passes.

Current verified facts:

- Current live release: `base2026-ai-recommends-creators-ay42-20260618`.
- The release used the canonical gate `scripts/base2026-release-gate.ps1` instead of an ad hoc chat sequence.
- The AI Recommends Solutions creator pass was processed from ignored private discovery output: `@heytonyagency`, `@iamdandavies`, `@harrysandersseo`, `@ray_fu`, and `@gobigsystems`.
- Discovery found 200 source records across 10 configured creators; the importer added 100 new candidate rows into private local `videos.csv`.
- GPT polish produced 77 polished transcripts: 30 QA-pass rows shipped publicly, 47 QA-needs-review rows stayed gated, and the later `hermes-polish-20260618-asr-review` pass closed the remaining `needs_asr` rows into polished text plus review gates.
- The newest-source readiness gate initially blocked the latest `@iamdandavies` source because it had public text but no public topic/insight layer.
- A strict exact-evidence reviewed insight was added for `@iamdandavies` / `tiktok-video-7652708771701067030` under the topic `WordPress static homepage setup`.
- `AfterPolish` completed successfully after `scripts/hermes-tiktok-refresh.ps1` was fixed so `-AfterPolish` skips inventory/caption intake and cannot expand the private queue.
- Current live public export counts: 1,425 source records, 1,953 passages, 1,626 insight cards, 1,055 public insight cards, 1,518 topics, 1,003 public topics, 10 creators.
- `include_full_transcripts=false`.
- Meilisearch was reindexed with 1,953 public passages.
- Live SEO crawl gate passed 500 crawled pages with 0 P0 bad links and 0 crawled error pages.
- Full mobile visual QA passed: 78 checks, 0 failures.
- Phase 1 from the free social intake recommendation is implemented: `scripts/base2026-worker.py doctor` reports required tools, optional adapters, and capability states without failing on missing optional tools.
- Phase 2 is implemented: `scripts/social-discover.py` reads current creator config shapes, uses TikTok `yt-dlp --flat-playlist` first, records Instagram missing-adapter state instead of faking results, and writes normalized private JSONL only.
- Phase 3 bridge is implemented: `scripts/import-social-discovery-to-tiktok-csv.py` imports TikTok-only discovery rows into private local `videos.csv` with dry-run default, dedupe by `video_id`, safe missing-metadata updates, old-row cutoff, and ignored `.planning/backups/` backup on apply.
- `scripts/hermes-tiktok-refresh.ps1 -CheckOnly` is verified read-only: it runs `social-discover.py` plus importer dry-run and must preserve the exact `videos.csv` hash before/after.

Final ay42 memory/controller verification is complete:

- `python3 scripts/base2026-controller.py status` reports `current_live_release=base2026-ai-recommends-creators-ay42-20260618`.
- `git diff --check` passed.
- `python3 scripts/audit-publication-boundary.py` passed with `forbidden=0`, `needs_review=0`, `secret_findings=0`.
- `python3 scripts/validate-github-metadata.py` passed.
- `python3 scripts/check-public-export-policy.py public-data/tiktok` passed with `include_full_transcripts=false`.
- `python3 scripts/validate-public-release-contract.py --export-dir public-data/tiktok --baseline-export-dir public-data/tiktok --enforce-count-floor` passed.
- `python3 scripts/check-public-content-readiness.py --data-root public-data/tiktok --latest 1 --fail` passed.

Next safe action:

1. If the user gives new creators, add them to ignored local creator/intake config, run `scripts/social-discover.py`, dry-run `scripts/import-social-discovery-to-tiktok-csv.py`, apply only clean TikTok candidates, then process the resulting queue through `scripts/base2026-release-gate.ps1`.
2. If the user explicitly asks for Git, stage only public-safe source/docs files that passed `audit-publication-boundary.py`; do not stage generated/private artifacts.
3. If the user asks for product/SEO work first, pick one scoped task from `UI-01`, `SEO-01`, or `GIT-01` in `docs/project-memory/LAUNCH_COMMAND_CENTER.md`.

## Do Not Do

- Do not commit/push until final verification is complete and the user explicitly approves the Git step.
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
