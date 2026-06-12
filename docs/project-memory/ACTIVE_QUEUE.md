# Base2026 / Geo Command Center Queue

Last updated: 2026-06-11

This file is the working queue. Chat is not the source of truth for tasks.

## Operating Rule

Every user correction or project task must move through this path:

1. capture the task here;
2. assign an owner: `Codex` or a named worker;
3. define the next concrete action;
4. verify with live/browser checks when visual or deployed behavior is involved;
5. update this file and the relevant project memory when done.

No task is considered done because a worker reports done. Codex must review, integrate, deploy when requested, and verify.

## Active Workstreams

| ID | Workstream | Owner | Status | Next Action | Done Criteria |
| --- | --- | --- | --- | --- | --- |
| GEO-01 | Homepage Base2026 CTA acid-green highlight | Codex after worker review | done/live | None | Live homepage loads CSS `1.5.15`; Base2026 CTA is `#b7ff00`; text is white; audit CTA remains white; desktop/mobile overflow false. |
| GEO-02 | About hero portrait scale and quote treatment | Codex after worker review | done/live | None | Live `/about/` loads CSS `1.5.15`; desktop portrait is about full card height; copy has pullquote styling; mobile stacks cleanly; desktop/mobile overflow false. |
| UI-QA-01 | Mixed WordPress/Base2026 mobile visual QA automation | Codex | done/live | Use `node scripts/mobile-visual-qa.mjs --base-url https://aggressorbulkit.online --viewports full` before public UI deploys. | Runner and runbook exist; Base2026 `base2026-mobile-visual-qa-ay25-20260610` and WordPress CSS `1.5.16` are live; final matrix has 66 checks, 0 failures, 0 warnings. |
| PIPE-01 | New TikTok intake/transcription/card automation | Codex | in_progress | Work transcript QA batches, the remaining IP-blocked source-review row, and candidate rewrite/review queue; keep future imports behind review/promotion/export gates. | A repeatable local pipeline exists for check -> caption/ASR -> polish -> claim extraction -> evidence verify -> review -> import -> export/package/deploy gate, with private candidates durable locally and excluded from public export. |
| GIT-01 | Repo/git hygiene for `base2026` and `geo` | worker: Franklin + Codex | in_progress | Classify dirty trees into coherent buckets and produce a commit/staging sequence without staging anything yet. | Dirty state is split into public-safe source changes, generated/private artifacts, site patch commits, and owner-decision leftovers. |
| PUB-01 | GitHub/open-source publication staging | worker: Darwin + Codex | blocked_by_GIT-01 | Follow the publication gates below after repo hygiene: boundary, generated-page decision, license/docs/CI, remote decision, dry-run stage, final staged diff review. | No push/publish until public/private boundary is green and user approves remote/public artifact list. |

## Current Deployed State

- Base2026 release live: `base2026-pipeline-refresh-ay56-20260612`.
- Base2026 public export live: 1214 source records, 1707 passages, 1544 insight cards, 1103 public insight cards.
- WordPress child-theme CSS live: `1.5.16`.
- VPS SSH works through `~/.ssh/geo_contabo_ed25519` and aliases `geo` / `geo-contabo`.

## Immediate Execution Order

1. Keep `PIPE-01` running through reviewed slices only.
2. Work the remaining IP-blocked source-review row and transcript QA debt separately from public deploy.
3. Keep `scripts/tiktok-source-review-audit.py` as the repeatable reason gate before retrying parked rows.
4. Keep `scripts/tiktok-polish-audit.py` as the repeatable transcript-QA batch gate; use controller reports under ignored `.planning/`.
4. Re-run publication boundary audit before every future push/deploy.

## PUB-01 Gates

Publication is not a free-form task. It must pass these gates in order:

1. Confirm full-card deploy checkpoint is accepted.
2. Run boundary audit: `python3 scripts/audit-publication-boundary.py`.
3. Decide whether generated pages under `web/static/creators/`, `sources/`, `topics/`, and `compare/` are committed or kept generated-only.
4. Reconfirm Apache-2.0 and metadata:
   - `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/apply-license.ps1 -License Apache-2.0`
   - `python3 scripts/validate-github-metadata.py`
5. Run preflight before remote:
   - `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/preflight-github-launch.ps1 -SkipRemoteCheck`
6. Confirm GitHub repo owner/name/visibility and add remote.
7. Dry-run staging only:
   - `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/stage-public-files.ps1 -SkipRemoteCheck`
8. Actual staging only after approval:
   - `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/stage-public-files.ps1 -Apply`
9. Final staged diff review:
   - `git diff --cached --stat`
   - `git diff --cached --name-only`
   - `git diff --cached`
10. Commit/push only when explicitly requested.

## PIPE-01 Tasks

Pipeline work starts with controller ownership. Do not jump straight to intake runs.

1. Normalize controller entrypoints for TikTok intake.
   - Status: done on 2026-06-10.
   - Touch: `scripts/base2026-controller.py`, wrappers around TikTok metadata/caption/import scripts as needed.
   - Implemented controller commands: `tiktok-metadata-extract` and `import-tiktok-staging`.
   - Safety: `import-tiktok-staging` defaults to dry-run unless `--apply` is explicitly passed.
   - Verify: `.venv/bin/python -m py_compile scripts/base2026-controller.py`; `.venv/bin/python scripts/base2026-controller.py doctor`; `.venv/bin/python scripts/base2026-controller.py list-runs --limit 5`; `--help` for both new commands.
2. Replace hardcoded creator inventory with config-driven queue.
   - Status: done on 2026-06-10.
   - Touch: `scripts/tiktok-backfill-inventory.ps1`, `scripts/hermes-tiktok-refresh.ps1`.
   - Implemented `-CreatorsConfig` and default config resolution order:
     - `config/tiktok-intake-queue.local.json`
     - `config/tiktok-intake-queue.20260608.json`
     - `config/creators.example.json`
   - Implemented `-ResolveCreatorsOnly` to verify config parsing without network access, CSV writes, or TikTok intake.
   - Boundary: real intake queue remains ignored/private; public-safe example stays `config/creators.example.json`.
   - Verify: PowerShell AST parse for inventory and Hermes scripts; `-ResolveCreatorsOnly` against `config/creators.example.json`; default config count check without dumping private queue rows; targeted `git diff --check`.
3. Unify caption extraction output into one staging schema.
   - Status: done on 2026-06-10.
   - Touch: `scripts/tiktok-ytdlp-metadata-extract.py`, `scripts/tiktok-caption-browser-extract.mjs`, `scripts/import-tiktok-staging-to-kb.py`, `docs/schemas/` if needed.
   - Implemented URL alias normalization: `canonical_url` -> `webpage_url` -> `source_url`.
   - Implemented import normalization for handle, creator URL, source ID, transcript text, and quality flags.
   - Aligned extractors so yt-dlp and browser outputs both expose canonical/webpage URL fields.
   - Verify: Python compile; Node syntax check; controller `doctor`; controller `import-tiktok-staging` dry-run over current staging file; targeted `git diff --check`.
4. ASR smoke-test and promote `faster-whisper` path over legacy `whisper` CLI.
   - Status: done on 2026-06-10.
   - Touch: `scripts/base2026-worker.py`.
   - Smoke sample: one existing local audio file under private `12_knowledge-base/sources/tiktok/transcripts/audio-fallback/`.
   - Result: `tiny.en`, CPU/int8, 6.15s audio, 1 segment, 10 words, cleanup guard passed.
   - Fix added: if `--vad-filter` returns empty text, worker retries the same file without VAD and records `retry_without_vad`.
   - Do not run broad ASR until import/resume gates are finished.
5. Make new-source import resumable and dry-run first.
   - Status: done on 2026-06-10.
   - Touch: `scripts/import-tiktok-staging-to-kb.py`, `scripts/base2026-controller.py`.
   - Implemented dry-run stats with total rows, selected/skipped, existing/new, and skip reasons.
   - Implemented `--limit`, `--source-id`, and `--report`.
   - Controller now forwards `--limit`, `--source-id`, and `--report`.
   - Current staging dry-run: 68 rows, 26 selected, 42 skipped, 26 existing, 0 new, skip reasons `not_caption_ready=37`, `blocked_quality_flag=5`.
   - Result: do not apply current staging again because all selected rows already exist in SQLite.
6. Wire source-backed card extraction after new-source import.
   - Status: next.
   - Use current GPT/Codex small-batch lane plus deterministic evidence verification.
7. Lock public promotion/export/package gates.
   - Promotion must require explicit reviewed report/IDs, never status-only automation.
8. Convert scheduled Hermes from check-only to staged local automation.
   - Scheduled mode must stop before deploy, paid LLM, public promotion, or unreviewed transcript publication.

## GIT-01 Buckets

Current branches:

- Base2026: `codex/github-publication-staging`
- geo: `codex/services-case-footer-polish`

Recommended sequence:

1. Commit `geo` first when commit is explicitly allowed.
   - Candidate files:
     - `wp-theme/alex-yarosh/style.css`
     - `wp-theme/alex-yarosh/functions.php`
     - `project-brain/WORKFLOW_STATUS.md`
   - Suggested commit: `site: polish roadmap CTA and about hero`
2. Keep Base2026 generated/private artifacts out of git.
   - Never commit: `.planning/`, `.venv/`, private research folders, `12_knowledge-base/`, `output/`, `public-data/`, `meili_data/`, logs/media/audio/release archives.
3. Base2026 public-safe source/docs/scripts are a separate staging pass.
4. Owner decision remains required for generated static page trees:
   - `web/static/compare/`
   - `web/static/sources/`
   - `web/static/topics/`
   - `web/static/creators/`
   - Default: keep generated-only and reproducible through scripts/package.
5. Before any Base2026 staging, run audit/preflight:
   - `python3 scripts/audit-publication-boundary.py`
   - `python3 scripts/validate-github-metadata.py`
   - `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/preflight-github-launch.ps1 -SkipRemoteCheck -SkipExportPolicy -SkipLiveCheck`

## Blockers / Constraints

- Do not stage, commit, push, or publish until explicitly requested.
- Do not run TikTok intake against production or scheduled deploy until the pipeline gate is implemented.
- Do not commit generated archives, local DB files, raw transcripts/captions, media, logs, cookies, keys, or private research.
- Visual `geo` changes require live desktop and mobile verification before being marked done.
