# Launch Command Center

Last updated: 2026-06-19

Purpose: coordinate Base2026 launch work across main Codex and subagents without losing tasks in chat. This file is the operating board for public UI, SEO/GSC, TikTok/source refresh, deploy/reindex, GitHub/open-source presentation, and public/private safety.

## Operating Model

Main Codex is the command center. Subagents are bounded workers, not owners of truth.

Rules:

1. Every worker gets one task, clear file scope, forbidden actions, and required output.
2. Explorers are read-only and answer a narrow question.
3. Workers may edit only their assigned files and must list changed paths.
4. Main Codex reviews every result before accepting it.
5. No worker may commit, push, deploy, run intake, or touch private/raw source folders unless explicitly assigned and gated.
6. Generated `web/static/**`, `public-data/**`, `output/**`, `.planning/**`, logs, local DBs, media, raw captions, ASR, and private review archives are never read wholesale or staged by default.
7. If an agent is silent, wait once with a real timeout; if still silent, continue locally and close/reassign later.

## Canonical Release Route

For every TikTok/source data-changing release, use:

```powershell
pwsh ./scripts/base2026-release-gate.ps1 `
  -ReleaseName <release-name> `
  -BatchSet <hermes-polish-batch-set> `
  -RunAfterPolish `
  -LatestReadiness 3 `
  -Deploy
```

This route owns:

- `git diff --check`;
- current-batch polish status;
- optional `AfterPolish`;
- newest-source readiness;
- publication boundary;
- GitHub metadata validation;
- public export policy;
- public release contract;
- packaging;
- deploy/reindex;
- live SEO crawl and mobile visual QA.

Do not run direct deploy for data-changing releases unless the release gate has already passed or the task is an explicit reviewed hotfix.

## Active State

| Area | Status | Current Fact | Next Gate |
| --- | --- | --- | --- |
| Public release | live | `base2026-source-review-local-caption-ay52-20260619` | newest-source readiness clean; next data change must use the release gate |
| Public export | live | 1,473 sources; 2,011 passages; 1,630 insights; 1,059 public insights; 1,521 topics; 1,007 public topics; 10 creators | export policy and release contract before every package |
| Meilisearch | live | `base2026_public_tiktok`, 2,011 passages | reindex only when data changes |
| TikTok pipeline | operational | AI Recommends Solutions pass processed in `hermes-polish-20260618-ai-recommends`; 77 polished rows reviewed; source-review cleanup is live through ay52; 39 source-review rows remain private/gated; `needs_asr=0` | run `python3 scripts/tiktok-source-review-queue.py --limit 25`; use release gate; never bypass newest-source readiness or transcript QA |
| GitHub | main pushed | `codex/base2026-launch-next` was pushed and fast-forwarded into GitHub `main` on 2026-06-19 | future changes still need boundary audit before staging |
| GSC | manual-only | sitemap submitted earlier; individual request-indexing quota hit before | no automated GSC clicks |
| SEO/Ahrefs | active | live crawl gate 0 P0 bad links / 0 crawled error pages | next crawl after substantial UI/SEO deploy |

## Active Subagents

| Agent | Role | Status | Notes |
| --- | --- | --- | --- |
| Kant | available | idle | Use for architecture/code review only when scoped. |
| Carver | available | idle | Use for frontend/UI patches only when scoped. |
| Linnaeus | available | idle | Use for crawl/SEO verification only when scoped. |
| Ramanujan | available | prior result accepted | Found the 4 queued 2026-06-17 TikToks. |
| Pasteur | available | prior result accepted | Mined Base2026 for SEO/growth strategy inputs. |

## Launch Todo

| ID | Task | Owner | Status | Gate |
| --- | --- | --- | --- | --- |
| PIPE-01 | Create durable release gate and error ledger | Main Codex | completed | `base2026-release-gate.ps1 -Help`, `hermes-tiktok-refresh.ps1 -Help`, boundary audit, export policy, release contract pass |
| PIPE-02 | Implement free social intake recommendations Phase 1-2 | Main Codex | completed | doctor reports required/optional capabilities; `scripts/social-discover.py` wrote 15 private TikTok discovery rows across 5 creators; Instagram missing-adapter state recorded; `videos.csv` hash unchanged |
| PIPE-03 | Bridge social discovery into private TikTok queue | Main Codex | completed/live-proof | dry-run-first importer added; bridge queue was processed through ay41, ay42, ay44, ay45, and ay46 release gates after private backups/dedupe; no direct public export/deploy from importer |
| DATA-01 | Process fresh TikTok batch | Main Codex | completed/live | AI Recommends Solutions ay52 batch includes explicit local-caption source-review cleanup; readiness blockers resolved with reviewed exact-evidence insights; ay52 deployed |
| QA-01 | Verify live ay52 release | Main Codex | completed | newest-source readiness/export/contract clean; Meili has 2,011 passages; full mobile visual QA rerun passed 78/0 |
| MEM-01 | Update project memory after release | Main Codex | completed | handoff, next action, data sources, status board, prompt log, deployment log, project state, deployment runbook, and active queue point at ay52 |
| GIT-01 | Prepare safe Git step | Main Codex | completed/main pushed | branch passed final gates and was fast-forwarded into GitHub `main` |
| SEO-01 | Continue GSC/Ahrefs growth work | Main Codex + SEO worker | pending next pass | do not automate GSC clicks; use clean candidate pages and crawl gates |
| UI-01 | Continue mobile/product UI polish | Main Codex + frontend worker | pending next pass | every patch needs Playwright/mobile visual QA and no regression against known UI contracts |
| QA-02 | Resolve private source-review queue | Main Codex + review worker | active | use `scripts/tiktok-source-review-queue.py`; 24 local-caption rows need source/QA review, 13 audio-backed rows need better source/audio after too-little ASR, 2 rows stay private until source/audio exists |

## Known Failure Modes To Avoid

See `docs/project-memory/PIPELINE_ERROR_LEDGER.md` for the durable list. Current hard rules:

- Help flags must not run real work.
- A newest public source with readable text but no public topic/insight must block release.
- Transcript/source uncertainty must be resolved before public export.
- Deploy/reindex/live QA must not be run as separate memory-only steps.
- No raw/private data goes to GitHub.

## Exact Next Safe Action

If the user asks for Git:

1. Run `git status --short --branch`.
2. Run the publication/export/release gates again if any source files changed after the last gate.
3. Stage only safe tracked/untracked source/docs files if new edits exist.
4. Commit/push any new memory-only updates after gates.
5. For future Git work, repeat this same boundary-audit-first route.

If the user asks for the next product/SEO task:

1. Pick one scoped task from `UI-01` or `SEO-01`.
2. Assign at most one bounded worker unless parallelism is clearly safe.
3. Main Codex must verify the result before reporting done.

If the user gives new creators:

1. Add creator handles to ignored local creator/intake config.
2. Run social discovery into ignored `.planning/`.
3. Dry-run the importer and inspect counts.
4. Apply only clean TikTok candidates with backup.
5. Run the canonical release gate through deploy/reindex/live QA.

If the user asks why video review is not finished:

1. Run `python3 scripts/tiktok-source-review-queue.py --limit 25`.
2. Report the queue counts, not chat memory.
3. Review only rows with usable evidence: local-caption rows first, audio-backed rows only after ASR retry, and no-source rows stay private.
4. Do not bulk-clear `needs_source_review`; each public row needs reviewed transcript/source text, `tiktok-clear-reviewed-source-rows.py` if the CSV status must change, and public readiness gates.
