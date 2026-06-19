# Launch Command Center

Last updated: 2026-06-18

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
| Public release | live | `base2026-ai-recommends-creators-ay42-20260618` | live QA passed; next change needs scoped QA |
| Public export | live | 1,425 sources; 1,953 passages; 1,626 insights; 1,055 public insights; 10 creators | export policy and release contract before every package |
| Meilisearch | live | `base2026_public_tiktok`, 1,953 passages | reindex only when data changes |
| TikTok pipeline | operational | AI Recommends Solutions pass processed in `hermes-polish-20260618-ai-recommends`; 30 QA-pass rows shipped, 47 QA-needs-review rows gated; follow-up `hermes-polish-20260618-asr-review` closed `needs_asr` to 0 and left 64 source-review rows private | use release gate; never bypass newest-source readiness or transcript QA |
| GitHub | dirty local branch | commit/push not done for this pass | stage only after user approval and boundary audit |
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
| PIPE-03 | Bridge social discovery into private TikTok queue | Main Codex | completed/live-proof | dry-run-first importer added; bridge queue was processed through ay41 and ay42 release gates after private backups/dedupe; no direct public export/deploy from importer |
| DATA-01 | Process fresh TikTok batch | Main Codex | completed/live | 4-source ay40, 3-source ay41, and AI Recommends Solutions ay42 batches polished; readiness blockers resolved with reviewed exact-evidence insights; ay42 deployed/reindexed |
| QA-01 | Verify live ay42 release | Main Codex | completed | SEO crawl 0 P0 / 0 crawled error pages; mobile visual QA 78/0; Meili indexed 1953 passages |
| MEM-01 | Update project memory after release | Main Codex | completed | handoff, next action, data sources, status board, active phase, prompt log, deployment log, project state, deployment runbook, and active queue now point at ay42 |
| GIT-01 | Prepare safe Git step | Main Codex | approved / in progress | final gates must pass; stage only public-safe source/docs |
| SEO-01 | Continue GSC/Ahrefs growth work | Main Codex + SEO worker | pending next pass | do not automate GSC clicks; use clean candidate pages and crawl gates |
| UI-01 | Continue mobile/product UI polish | Main Codex + frontend worker | pending next pass | every patch needs Playwright/mobile visual QA and no regression against known UI contracts |

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
3. Stage only safe tracked/untracked source/docs files.
4. Commit with a message like `chore: add canonical Base2026 release gate`.
5. Push only if the user explicitly asks.

If the user asks for the next product/SEO task:

1. Pick one scoped task from `UI-01`, `SEO-01`, or `GIT-01`.
2. Assign at most one bounded worker unless parallelism is clearly safe.
3. Main Codex must verify the result before reporting done.

If the user gives new creators:

1. Add creator handles to ignored local creator/intake config.
2. Run social discovery into ignored `.planning/`.
3. Dry-run the importer and inspect counts.
4. Apply only clean TikTok candidates with backup.
5. Run the canonical release gate through deploy/reindex/live QA.
