# Next Action

## Current Focus: GitHub Publication Cleanup

Status: final GitHub cleanup branch is rebased onto `origin/main`; local tree is clean before final gates.

Branch: `codex/base2026-public-api-github-polish`

Purpose:

- keep GitHub focused on source, docs, public contracts, and reproducible tooling;
- remove generated source/topic/creator/compare pages and generated sitemap/analytics artifacts from the Git index;
- keep generated release files on disk for local generation, QA, packaging, and deploy;
- make API/AI access obvious in README, GitHub Pages, issue templates, and `/knowledge/api-index.json`.

Current verified facts:

- Latest known live release: `base2026-social-metadata-h1-ay39-20260618`.
- Public export counts: 1,388 source records, 1,906 passages, 1,623 insight cards, 1,052 public insight cards, 1,516 topics, 1,001 public topics.
- `include_full_transcripts=false`.
- No deploy, reindex, GSC submission, IndexNow submission, or TikTok intake belongs to this GitHub-only cleanup pass.

Final gates to run before publishing the rebased branch:

1. `git diff --check`
2. `python3 scripts/audit-publication-boundary.py`
3. `python3 scripts/validate-github-metadata.py`
4. `python3 scripts/check-public-export-policy.py public-data/tiktok`
5. `pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/preflight-github-launch.ps1 -SkipExportPolicy -SkipLiveCheck`

Next safe action:

Rerun the gates above, then force-with-lease push `codex/base2026-public-api-github-polish` to GitHub and open/merge the normal PR only if the branch is clean against `origin/main`.

## Do Not Do In This Pass

- Do not deploy Base2026 or WordPress.
- Do not reindex Meilisearch.
- Do not run TikTok intake automation.
- Do not submit URLs to GSC or IndexNow.
- Do not add generated `web/static/sources`, `web/static/topics`, `web/static/compare`, `web/static/creators`, `web/static/sitemaps`, sitemap XML, analytics JSON, or JSONL release artifacts back to Git.

## Resume Rule

On the next resume, read only:

1. `AGENTS.md`
2. `docs/project-memory/CURRENT_HANDOFF.md`
3. `docs/project-memory/LAUNCH_COMMAND_CENTER.md`
4. this file

Then run a bounded `git status`. Do not reread the full project-memory bundle unless a concrete gate fails.
