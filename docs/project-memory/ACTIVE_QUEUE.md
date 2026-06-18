# Base2026 / Geo Command Center Queue

Last updated: 2026-06-17

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
| OPS-01 | Project command-center and subagent workflow | Codex | in_progress | Keep `AGENT_WORKFLOW.md` and this queue as the routing layer for workers, reviews, deploys, and growth tasks. | New tasks are captured here before delegation; worker scopes are disjoint; command center reviews output before deploy/commit; project memory is updated after material work. |
| SEO-02 | Live SEO crawl gate without Ahrefs quota | Russell -> Codex review | done/local-reviewed | Use `node scripts/live-seo-crawl-gate.mjs --max-pages 500` as the Ahrefs-quota fallback before GSC/IndexNow batches; move next SEO execution to OG/X-card and P1 crawl architecture. | Local crawl gate exists, covers live WordPress plus `/knowledge/`, stores evidence under ignored `output/`, exits nonzero on P0 failures, and command-center review passed with `forbidden=0`, `needs_review=0`, `secret_findings=0`. |
| GROWTH-01 | Base2026 intelligence growth plan | Faraday -> Codex review | in_progress | Wait for Faraday's public-dataset marketing plan, verify it uses only public data, then convert it into P0/P1/P2 execution tasks. | Plan includes content pillars, buyer-stage map, WordPress/Base2026 internal links, AI-search citability moves, public-safe pSEO opportunities, and 10 concrete next actions. |
| UI-02 | Search workspace source-detail/source-text redesign | Codex | done/live | None. Deployed as `base2026-content-pipeline-fix-20260615`; keep future QA aligned with `Source Text`, `Source Intelligence`, `.view-source-detail`, and `#source-detail-panel`, not the old modal/caption metadata contract. | Public export keeps `transcript` empty and adds `public_source_text`; static and runtime source detail show full source text once, source intelligence claim/action cards with collapsed evidence, share actions, no modal, no caption metadata, no source provenance, no horizontal overflow on checked desktop/mobile routes. |
| PIPE-01 | New TikTok intake/transcription/card automation | Codex | in_progress | Add shadow Meilisearch deploy verification and continue source/card review slices behind exact-evidence gates. | A repeatable local pipeline exists for check -> caption/ASR -> polish -> claim extraction -> evidence verify -> review -> import/archive -> clean rebuild replay -> export/package/deploy gate, with private candidates durable locally and excluded from public export. |
| GIT-01 | Repo/git hygiene for `base2026` and `geo` | Codex | in_progress | Complete the current GitHub source-tree cleanup commit after publication boundary, metadata, and preflight gates pass. Generated source/topic/compare/creator HTML pages are release artifacts, not GitHub source. | Public-safe source changes are committed/pushed; generated/private artifacts remain ignored and generated `web/static` page churn is untracked. |
| SEO-01 | GSC indexing repair and Evidence Q&A enrichment | Codex | in_progress | Finish targeted local QA for source/topic Q&A, sitemap self-canonical filtering, compare canonical, and strict generated-route 404 behavior; do not deploy until approved. | Source/topic pages gain useful visible public-safe Q&A; sitemap only includes self-canonical indexable pages; ghost entity URLs return 404; GSC indexing requests are limited to clean useful pages. |
| PUB-01 | GitHub/open-source publication staging | Codex | done | Keep running publication audit before every future push. | Public GitHub repo exists on `main`; public/private boundary is documented and enforced by audit/stage scripts. |

## Current Deployed State

- Base2026 UI release live: `base2026-social-metadata-h1-ay39-20260618`.
- Base2026 latest data/reindex checkpoint: `base2026-darrenshawseo-intake-ay90-r2-20260616`.
- Base2026 public export live: 1388 source records, 1906 passages, 1623 insight cards, 1052 public insight cards, 1516 topics, 1001 public topics, 5 creators.
- WordPress child-theme CSS live: at least `1.5.46`; verify the exact live `style.css?ver=` before the next WordPress UI deploy.
- VPS SSH works through `~/.ssh/geo_contabo_ed25519` and aliases `geo` / `geo-contabo`.

## Immediate Execution Order

1. Review `GROWTH-01` Base2026 intelligence plan and convert it into executable SEO/content/product tasks.
2. Start the next SEO execution block from the crawl-gate findings: shared OG/X-card metadata, source archive/internal links, query-state canonical/noindex policy, schema validation, and sitemap canonical hygiene.
3. Do not mass-submit URLs to GSC/IndexNow until the local crawl gate remains clean for P0 status/link failures and core duplicate/canonical risks are controlled.
4. Keep `PIPE-01` running through reviewed slices only; do not promote cards or transcripts without exact-evidence gates.
5. Add a shadow/reindex verification step to the deploy path before the next data-changing public release.
6. Work historical transcript QA and source-access review debt separately from public deploy unless fixes change public source text.
7. Keep `scripts/tiktok-source-review-audit.py` as the repeatable reason gate before retrying parked rows.
8. Keep `scripts/tiktok-qa-triage.py` as the first transcript-QA classifier before detailed batch review.
9. Keep `scripts/tiktok-polish-audit.py` as the repeatable transcript-QA batch gate; use controller reports under ignored `.planning/`.
10. Re-run publication boundary audit before every future push/deploy.

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
   - Status: in_progress.
   - Current reviewed lane can prepare private `needs_human` packets, apply reviewer decisions, verify exact evidence, import approved candidates, and archive them for clean rebuild replay.
   - ay57/ay58 result: 8 candidates promoted, 5 rejected, 8 old rows resolved as superseded by rewritten approved cards, 2 left private for source/audio verification.
7. Lock public promotion/export/package gates.
   - Promotion must require explicit reviewed report/IDs, never status-only automation.
8. Convert scheduled Hermes from check-only to staged local automation.
   - Scheduled mode must stop before deploy, paid LLM, public promotion, or unreviewed transcript publication.

Latest refresh note: `base2026-content-pipeline-fix-20260615` is the current live UI/data/reindex checkpoint. The 2026-06-14 `@joshuamaraney` source `tiktok-video-7651218412475059464` is operator-approved, exported, deployed, indexed, and now has reviewed public topics/insights for AI Model Governance and AI Security Risk. Queues are back to 0 queued transcripts, 0 `needs_asr`, 0 queued ASR jobs, and 0 missing polish files. The remaining 619 historical transcript QA flags plus held source-review rows remain gated.

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

- Commit/push is allowed for the current public-safe ay76 mobile/cache-bust stabilization because the user explicitly requested bringing the project to Git; still run boundary and metadata gates first.
- Do not run TikTok intake against production or scheduled deploy until the pipeline gate is implemented.
- Do not commit generated archives, local DB files, raw transcripts/captions, media, logs, cookies, keys, or private research.
- Visual `geo` changes require live desktop and mobile verification before being marked done.
