# Current Handoff

Last updated: 2026-06-15

Purpose: this is the compact resume file for the current Base2026 work. Read this first after `AGENTS.md`, then read only the referenced files needed for the next edit. Do not rehydrate the whole project memory unless this file conflicts with repo state.

## Anti-Loop Resume Protocol

This file is the first active context file. The point is to stop the repeated pattern of rereading every long project-memory file after compaction.

Required resume order:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `docs/project-memory/LAUNCH_COMMAND_CENTER.md`.
4. Run `git status --short --branch --untracked-files=no` or a similarly bounded status check.
5. Read only the task-specific source/runbook files named in this handoff or command center.

Do not reread the full project-memory bundle unless one of these is true:

- this file conflicts with current repo state;
- the task explicitly touches deployment, publication boundary, data sources, or visual system contracts;
- the next action is unclear after reading this file and the command center;
- the user asks for a full audit/restart.

Generated `web/static/**` output is never context material by default. Inspect representative pages or targeted diffs only.

## Active Goal

Finish the Google Search Console / indexing repair path now that the Evidence Q&A generated-page release is live, then finish GitHub/open-source cleanup from a clean branch.

Command-center plan for the broader launch push now lives at `docs/project-memory/LAUNCH_COMMAND_CENTER.md`.

## Current User Instruction

- Keep a durable plan so Codex does not reread the same long memory files after every compaction.
- Continue GSC/indexing plus Evidence Q&A work.
- Do not commit/push from the stale current branch. Do not redeploy unless a new verified fix requires it.
- Avoid context churn: use this file plus `LAUNCH_COMMAND_CENTER.md` as the plan. Do not reread the full memory bundle unless the command center says the next task requires it.

## Current Branch And Dirty State

- Branch: `codex/base2026-public-api-github-polish`.
- Local upstream for this stale branch has been unset because the previous upstream was gone.
- Important source changes currently in play:
  - `scripts/generate-public-pages.py`
  - `scripts/generate-base2026-sitemap.py`
  - `scripts/server-patch-nginx-base2026.py`
  - `web/static/styles.css`
- There are many dirty/generated `web/static/compare/`, `web/static/sources/`, and `web/static/topics/` files from previous generation/deploy work. Do not read or revert the full generated tree unless the task is explicitly about generated output.

## What Is Done In This Pass

- Added visible Evidence Q&A sections to generated source pages and topic pages.
- The Q&A is deterministic and uses only public-safe inputs: reviewed public source text, public insight cards, source attribution, topic metadata, and topic signal briefs.
- Did not add FAQPage schema. This is intentional: visible Q&A is useful for readers and LLM retrieval, while FAQ schema should only be added later if it is visibly correct, validated, and not being used as a rich-result hack.
- Preserved the GSC/indexing technical fixes already present in dirty source files:
  - sitemap generator excludes non-self-canonical pages;
  - compare index canonical can point to `/knowledge/compare/`;
  - nginx patch can make missing generated entity routes return 404 instead of fallback 200.
- Packaged and deployed `base2026-gsc-evidence-qa-20260615`.
- Nginx strict generated-route behavior was applied and verified as already present.
- Meilisearch reindex was intentionally skipped for this release because public data/index fields did not change; the latest data/reindex checkpoint remains `base2026-content-pipeline-fix-20260615`.
- GSC Page indexing was inspected on 2026-06-15. The main live issue is not a page error; it is a large `Discovered - currently not indexed` queue.
- The Base2026 sitemap was refreshed/submitted in GSC on 2026-06-15 and GSC reported success.
- Stale GitHub PR #1 for Dependabot/GitHub Actions was closed on 2026-06-15; open PR count is now 0.
- GitHub cleanup PR #4 was merged to `main` on 2026-06-15. Merge commit: `33745568c Tighten GitHub publication boundary`.
- GitHub Pages is live from `main` `/docs` at `https://offflinerpsy.github.io/base2026/`.
- Public GitHub Project #3 is live at `https://github.com/users/offflinerpsy/projects/3` and linked to `offflinerpsy/base2026`.
- Final launch sidecar audits completed after PR #4:
  - GSC/indexing sidecar confirmed sitemap and `/pricing/` indexing evidence and the remaining individual-URL blocker.
  - Live launch smoke sidecar confirmed robots, sitemap chunks, sample source/topic/API pages, Q&A, search proxy, GitHub Pages, and public GitHub Project.
  - GitHub hygiene sidecar confirmed open PRs 0, Pages built, source workflows/dependabot absent, metadata/preflight/publication boundary checks passing, and no forbidden dirty-path matches.
- Follow-up sidecars on 2026-06-15 confirmed:
  - no safe non-UI/API path exists for ordinary GSC indexing requests;
  - GitHub remote state still matches the launch record;
  - main local publication audit is clean after the dirty generated tree.

## Verification So Far

- `python3 -m py_compile scripts/generate-public-pages.py scripts/generate-base2026-sitemap.py scripts/server-patch-nginx-base2026.py` passed.
- `git diff --check -- scripts/generate-public-pages.py scripts/generate-base2026-sitemap.py scripts/server-patch-nginx-base2026.py web/static/styles.css` passed.
- Local test export to `output/tmp-evidence-qa-test` generated 1219 source pages, 995 topic pages, 995 compare pages, 4 creator pages, and 1298 sitemap URLs.
- Targeted grep confirmed `Questions this source answers` and `Questions this topic answers` are present in local generated output.
- `python3 scripts/audit-publication-boundary.py` passed: forbidden 0, needs_review 0, secret_findings 0.
- `python3 scripts/audit-publication-boundary.py --json` later passed with 3231 changed files and empty forbidden/needs_review/secret findings.
- `python3 scripts/validate-github-metadata.py` passed.
- Release package QA passed for 1219 source detail pages, 995 topic pages, 995 compare pages, 4 sitemap chunks, 1308 sitemap URLs, self-canonical/indexability checks, and no FAQPage schema.
- Live smoke passed for representative source/topic/noindex pages, missing generated entity routes returned 404, `/knowledge-search/multi-search` returned hits, static CSS served gzip/immutable cache headers, and mobile visual QA passed with 44 checks / 0 failures.
- GSC Page indexing showed indexed 29, not indexed 814, discovered currently not indexed 787, crawled currently not indexed 1, excluded by noindex 21, redirects 3, 404 1, alternate canonical 1.
- GSC sitemap table now shows `https://aggressorbulkit.online/knowledge/sitemap.xml` submitted Jun 15, 2026, last read Jun 15, 2026, status Success, discovered pages 800.
- `/pricing/` URL Inspection showed `URL is available to Google`, `Page can be indexed`, and `Indexing requested`.
- GitHub remote checks after PR #4: open PRs 0, Pages API status `built`, Pages URL returns HTTP 200, repo is public, homepage is `https://aggressorbulkit.online/knowledge/`, post-merge metadata/preflight checks pass.
- Final sidecar live smoke confirmed `/knowledge/sitemap.xml` has 4 chunks with 1308 URLs, `/knowledge-search/multi-search` returns hits on the live `base2026_public_tiktok` index, GitHub Pages serves HTTP 200, and Project #3 is publicly reachable.
- Publication boundary audit after the dirty generated tree reports forbidden 0, needs_review 0, secret_findings 0.

## Open Loops

- Keep `docs/project-memory/LAUNCH_COMMAND_CENTER.md` updated.
- Individual GSC URL Inspection requests are manual-only going forward. Confirmed clean submissions: `ai-citations.html`, `ai-citation-tracking.html`, and `ai-content-quality.html`. Remaining clean candidates after quota reset: `ai-retrieval-behavior.html`, `backlink-quality.html`, `content-freshness.html`, `core-update-analysis.html`, and `local-seo.html`. On 2026-06-16, GSC returned the daily quota exceeded message, so stop submissions until the next reset. Do not use browser automation to type or click in GSC again: coordinate clicks and later DOM-based control both proved unsafe in the user's live Chrome session. Codex may only read status from an already-open GSC page if the user asks.
- If requesting indexing, use only clean, useful, self-canonical pages with real public evidence. Do not mass-submit noindex, singleton, ghost, thin, or alternate-canonical URLs.
- GitHub/open-source cleanup is complete on remote main. The temporary cleanup worktree can be removed later if desired.
- Later nginx hardening caveat: generated entity misses return 404, but an arbitrary unknown `/knowledge/no-such-generated-route-qa-sidecar.html` still falls back to `/knowledge/` with 200. This is not blocking the current launch sample set, but it is a valid future soft-200 hardening item.
- Keep generated static trees out of git unless the publication strategy explicitly changes.

## Exact Next Safe Action

1. Do not restart discovery. Continue from `LAUNCH_COMMAND_CENTER.md`.
2. Finish `GSC-01`: the remaining clean candidates must be submitted manually in GSC by the user after the daily quota resets, then recorded. Do not repeat raw inspect-link attempts; they are proven invalid for GSC. Do not type or click in GSC with browser automation.
3. Do not rerun the full launch audit unless code/deploy changes. The final live/GitHub/publication audit is already recorded in `LAUNCH_COMMAND_CENTER.md`.
4. Do not mark launch complete until the remaining GSC individual URL request status is honestly resolved or accepted as a manual-only blocker.

## Current Working Plan

1. Keep `LAUNCH_COMMAND_CENTER.md` as the live task board, not chat memory.
2. Before editing any code, write the immediate task and expected changed files into the command center or this handoff.
3. After each implementation pass, update only:
   - what changed;
   - what was verified;
   - what is still open;
   - the exact next safe action.
4. Keep subagent results summarized in `LAUNCH_COMMAND_CENTER.md`; main Codex must verify them before accepting.
5. If context compacts, resume from this file and continue the exact next safe action instead of restarting discovery.
