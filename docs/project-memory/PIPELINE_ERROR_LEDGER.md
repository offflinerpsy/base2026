# Base2026 Pipeline Error Ledger

Last updated: 2026-06-18

Purpose: keep repeated launch/intake mistakes out of chat memory and inside the repository operating contract.

## Canonical Release Pipeline

Use `scripts/base2026-release-gate.ps1` as the release command center.

For a TikTok data-changing release:

```powershell
pwsh ./scripts/base2026-release-gate.ps1 `
  -ReleaseName <release-name> `
  -BatchSet <hermes-polish-batch-set> `
  -RunAfterPolish `
  -Deploy
```

For a package-only dry launch:

```powershell
pwsh ./scripts/base2026-release-gate.ps1 `
  -ReleaseName <release-name> `
  -BatchSet <hermes-polish-batch-set> `
  -RunAfterPolish `
  -PackageOnly
```

The gate order is:

1. `git diff --check`
2. current-batch transcript polish status
3. `hermes-tiktok-refresh.ps1 -AfterPolish`
4. newest-source content readiness
5. publication boundary audit
6. GitHub metadata validation
7. public export policy
8. public release contract
9. package public release
10. optional VPS deploy, Meilisearch reindex, live SEO crawl, and mobile visual QA

## Errors We Already Hit

### Help flags accidentally ran real work

Observed: running a script with an assumed help flag still executed inventory/crawl work.

Fix:

- `scripts/hermes-tiktok-refresh.ps1 -Help` now exits before inventory/intake.
- Use `scripts/base2026-release-gate.ps1 -Help` for the canonical pipeline.

Rule: do not guess help flags on scripts that do not explicitly support them.

### Fresh public source shipped without intelligence layer

Observed: a 2026-06-17 `@webhivedigital` source had public text but no public topic or public insight card. Packaging correctly stopped at `check-public-content-readiness.py --latest 1 --fail`.

Fix:

- Create a strict source-backed candidate.
- Run `base2026-import-claim-candidates.py`.
- Run `base2026-review-insight-candidates.py`.
- Promote only exact-match `promotion_candidate` rows with `base2026-promote-insight-candidates.py`.
- Rebuild/export through AfterPolish before packaging.

Rule: never bypass this gate. A newest public source should not launch as plain transcript/source text without at least one reviewed public intelligence layer.

ay41 proof: the same gate blocked `tiktok-video-7652732487843581206` after the social bridge added it to the queue. The fix was not to bypass the gate; the fix was to add one exact-evidence reviewed insight for `Search Console / high-intent queries`, rerun `AfterPolish`, and then deploy through `base2026-release-gate.ps1`.

### Transcript polish uncertainty leaked too late

Observed: caption-polish batches can look good while a few rows still need source-audio review.

Fix:

- `tiktok-polish-status.py --batch-dir <batch>` must pass before `AfterPolish`.
- Use ASR/source-audio checks for uncertain entities, plugin names, and repeated/damaged text.
- Keep audio, ASR, and private QA under ignored local paths only.

Rule: current-batch polish is a hard gate. Historical debt must stay gated but must not block a fresh clean batch.

ay41 proof: QA JSON for the 3-source social-bridge batch had to pass without uncertainty language before `AfterPolish`. If a QA note says a transcript is uncertain, the row is not ready for public release even if the text looks readable.

### Deploy and data refresh were treated as separate mental flows

Observed: data refresh, public export, package, deploy, reindex, and live QA were easy to run out of order.

Fix:

- `base2026-release-gate.ps1` owns the end-to-end sequence.
- `hermes-tiktok-refresh.ps1` owns local intake/rebuild/export only.
- `deploy-public-vps.ps1` owns upload, symlink switch, nginx reload, and reindex.

Rule: do not run deploy directly for data-changing TikTok releases unless the release gate has already passed or the command is an explicit hotfix from a reviewed export.

### Social discovery got confused with TikTok intake

Observed: a platform-neutral discovery plan could easily become a direct write into the TikTok CSV, or accidentally invite Instagram rows into the TikTok-only intake lane.

Fix:

- `scripts/social-discover.py` writes only private JSONL under ignored `.planning/`.
- `scripts/import-social-discovery-to-tiktok-csv.py` is the only bridge from `.planning/social-discovered.jsonl` to `12_knowledge-base/sources/tiktok/videos.csv`.
- The bridge is dry-run by default and requires `--apply` to mutate the private local CSV.
- Every apply creates an ignored backup under `.planning/backups/`.

Rule: run discovery, then dry-run import, inspect counts, then apply. Never import non-TikTok rows into `videos.csv`, and never trigger public export/deploy from the importer.

### Check-only mode wrote to the private CSV

Observed: `scripts/hermes-tiktok-refresh.ps1 -CheckOnly` used to run `tiktok-backfill-inventory.ps1` before checking the flag. Because inventory writes `videos.csv`, a supposedly read-only check could add queued rows.

Fix:

- `scripts/hermes-tiktok-refresh.ps1 -CheckOnly` now runs `social-discover.py` to an ignored check-only JSONL path.
- It then runs `import-social-discovery-to-tiktok-csv.py` without `--apply`.
- It prints the current pending summary and exits before legacy inventory/caption/ASR/polish stages.

Rule: `-CheckOnly` and `-DryRun` must preserve the exact `videos.csv` hash before/after. Data-changing inventory/import must be explicit.

## Current Policy

- Raw captions, raw ASR, audio/video, logs, local DBs, `.planning/`, `output/`, `public-data/`, and private reviewed-candidate archives are never GitHub source.
- Approved/reviewed public insight cards are durable through ignored replay archives and clean SQLite rebuild.
- New public text needs at least one source-backed topic or public insight before release.
- GitHub commit/push happens only after deploy/live QA and explicit user approval.
