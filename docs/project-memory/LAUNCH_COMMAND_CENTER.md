# Launch Command Center

Last updated: 2026-06-15

Purpose: coordinate Base2026 launch work across main Codex and subagents without losing tasks in chat. This file is the operating board for the current launch push: GSC/indexing, Evidence Q&A, QA/deploy, GitHub/open-source presentation, and public/private safety.

## Context Budget Plan

Use this file as the active command board. Do not use the chat transcript as the task system.

Resume/read order for this launch push:

1. `AGENTS.md`
2. `docs/project-memory/CURRENT_HANDOFF.md`
3. this file
4. bounded `git status`
5. only the runbook/source files required by the current row in `Launch Todo`

Avoid:

- broad rereads of all project-memory files;
- full `git status --untracked-files=all` dumps unless staging/release packaging requires it;
- wholesale reads of generated `web/static/**`;
- repeating subagent audits after their findings have been accepted here.

Every work chunk must end with this board still answering four questions: what is active, who owns it, what blocks it, and what exact check closes it.

## Operating Model

Main Codex is the command center. Subagents are bounded workers, not owners of truth.

Rules:

1. Every subagent gets one task, clear file scope, forbidden actions, and a required return format.
2. Explorers are read-only and answer a narrow question.
3. Workers may edit only their assigned files and must list changed paths.
4. Main Codex reviews every result before accepting it.
5. No subagent may commit, push, deploy, run intake, or touch private/raw source folders unless explicitly assigned and gated.
6. Generated `web/static/**` churn is not read wholesale; inspect representative generated pages only.
7. If an agent is silent, wait once with a real timeout; if still silent, continue locally and close/reassign later.

This follows the current Codex/Claude subagent best-practice pattern: use subagents for bounded parallel exploration, test/triage, and isolated patches; keep the main agent focused on integration and final verification.

## Active Subagents

| Agent | Role | Scope | Status | Expected Output |
| --- | --- | --- | --- | --- |
| Planck | Local SEO/Q&A verifier | generated source/topic pages, sitemap, canonical/robots/H1 checks | completed / accepted | PASS: local Q&A and sitemap checks passed |
| Singer | GitHub/open-source verifier | README, issue templates, metadata, GitHub remote state | completed / accepted | Initial FAIL accepted; stale Dependabot/GitHub Actions PR was later closed |
| Linnaeus | Live deploy/GSC-risk verifier | live pages, sitemap, route behavior, deployment readiness | completed / accepted | PASS after live Q&A deploy and smoke checks |
| Pascal | GitHub remote verifier | remote PRs, Actions-free state, branch hygiene | completed / accepted | PR #1 closed, open PRs now 0, current stale branch upstream unset; verify remote workflow/dependabot absence before fresh cleanup |
| Tesla | Live SEO/GSC preflight verifier | robots, sitemap, canonical, noindex, clean indexing candidates | completed / accepted | PASS: live sitemap/robots/canonical checks clean; safe indexing candidates recorded |
| Nash | GSC/indexing sidecar | GSC evidence and individual indexing path | completed / accepted | PASS: sitemap and `/pricing/` request proven; individual URL requests remain UI/manual blocker |
| Maxwell | Live launch smoke sidecar | live server, sitemap chunks, search proxy, GitHub Page/Project | completed / accepted | PASS: live smoke passed; one arbitrary unknown route soft-200 caveat noted |
| Kierkegaard | GitHub/open-source hygiene sidecar | remote state, Pages, PRs, Actions/Dependabot, dirty tree shape | completed / accepted | PASS: PRs 0, Pages built, boundary/metadata/preflight pass; source workflows/dependabot absent |
| Dalton | GSC non-UI path verifier | local scripts/credentials plus official Google API path check | completed / accepted | FAIL: no safe API/non-UI indexing-request path for ordinary pages |
| Feynman | GitHub remote re-verifier | repo, Pages, PRs, Project, source workflows/dependabot | completed / accepted | PASS: GitHub state still matches launch record |
| Arendt | Dirty-tree publication-risk verifier | bounded dirty-tree and publication audit | timed out / replaced by main local audit | Main audit passed: forbidden/needs_review/secrets empty |

## Launch Todo

| ID | Task | Owner | Status | Gate |
| --- | --- | --- | --- | --- |
| CMD-01 | Create durable command-center plan and active handoff | Main Codex | completed | `CURRENT_HANDOFF.md`, this command center, `NEXT_ACTION.md`, and `PROMPT_LOG.md` updated; `git diff --check` passed for tracked memory changes |
| SEO-01 | Finish Evidence Q&A and GSC technical fixes | Main Codex + Planck | completed | Local and package generated source/topic pages show Q&A, canonical/robots are sane, no FAQ schema, boundary audit passes |
| QA-01 | Build controlled deploy/QA checklist | Main Codex + Linnaeus | completed | Package QA, live smoke, search smoke, gzip/cache check, and mobile visual QA passed |
| GH-01 | Verify GitHub/open-source presentation | Main Codex + Singer + Pascal | completed | PR #4 merged to `main`, GitHub Pages live, public Project #3 created/linked, remote remains Actions-free |
| GSC-01 | Inspect GSC state and request indexing only for clean pages | Main Codex + Tesla | in progress / quota stop | GSC sitemap refresh completed; 3 clean candidate URLs confirmed submitted; GSC daily request-indexing quota is exhausted; remaining clean candidates require manual GSC submission after quota reset; no mass-submit of thin/noindex/ghost URLs |
| DEPLOY-01 | Deploy only after local QA passes | Main Codex | completed | `base2026-gsc-evidence-qa-20260615` packaged, uploaded, nginx ok, live smoke ok; reindex skipped because data/index did not change |
| FINAL-01 | Final launch audit | Main Codex + Maxwell + Kierkegaard | completed / GSC caveat | Boundary audit, metadata validation, live server smoke, sitemap, GitHub Pages/Project, and GitHub state recorded; GSC individual URL requests remain external/manual blocker |

## Subagent Findings

### Planck - Local SEO / Evidence Q&A

Status: accepted as read-only audit.

- Local generated output has Q&A on 1219/1219 source detail pages and 995/995 topic pages.
- Canonical, H1, robots, sitemap membership, noindex exclusions, and absence of FAQPage schema passed in local/package checks.
- Remaining risk: source-page indexability may still be too permissive for short/thin sources. GSC submissions must be selective.

### Singer - GitHub / Open Source

Status: accepted as read-only audit; blocker is remote state.

- Local metadata and publication-boundary checks pass.
- The remote repo had an open Dependabot PR that touched `.github/workflows/`; this conflicted with the Actions-free/free-GitHub operating model.
- PR #1 was closed on 2026-06-15 and open PR count is now 0.
- Current branch upstream was gone; it has been unset locally. GitHub cleanup should still be replayed onto a fresh branch from `origin/main`.
- GitHub cleanup was replayed in fresh worktree `/Users/alexyarosh/Projects/base2026-migration/DW/base2026-github-cleanup-20260615` on branch `codex/base2026-github-open-source-cleanup`.
- PR #4 was opened, marked ready, merged to `main`, and the remote branch was deleted.
- Merge commit on `origin/main`: `33745568c Tighten GitHub publication boundary`.
- `origin/main` has no `.github/workflows/` and no `.github/dependabot.yml` / `.github/dependabot.yaml`.
- GitHub Pages is enabled from `main` `/docs`, status `built`, public URL `https://offflinerpsy.github.io/base2026/`.
- Public GitHub Project created: `Base2026 Launch / Open Source`, `https://github.com/users/offflinerpsy/projects/3`, public, linked to `offflinerpsy/base2026`, with four launch items.

### Tesla - Live SEO / GSC Preflight

Status: accepted as read-only audit.

- Live `robots.txt` allows crawl and advertises both WordPress and Base2026 sitemaps.
- `/knowledge/sitemap.xml` is a sitemap index with 4 chunks and 1308 unique URLs.
- Sampled topic/source/compare pages return 200, self-canonical, and `index,follow` where intended.
- Topic/source pages visibly include Evidence Q&A sections.
- Noindex singleton topics/compare pages are absent from the sitemap and use `noindex,follow`.
- Safe GSC indexing candidates include:
  - `https://aggressorbulkit.online/knowledge/topics/ai-citations.html`
  - `https://aggressorbulkit.online/knowledge/topics/ai-citation-tracking.html`
  - `https://aggressorbulkit.online/knowledge/topics/ai-content-quality.html`
  - `https://aggressorbulkit.online/knowledge/topics/ai-retrieval-behavior.html`
  - `https://aggressorbulkit.online/knowledge/topics/backlink-quality.html`
  - `https://aggressorbulkit.online/knowledge/topics/content-freshness.html`
  - `https://aggressorbulkit.online/knowledge/topics/core-update-analysis.html`
  - `https://aggressorbulkit.online/knowledge/topics/local-seo.html`

### GSC Browser Session - 2026-06-15

Status: sitemap refresh completed; 3 clean candidate URLs submitted; remaining URL requests are manual-only after the GSC daily quota resets.

- GSC Page indexing for `sc-domain:aggressorbulkit.online` showed:
  - indexed: 29;
  - not indexed: 814;
  - discovered currently not indexed: 787;
  - crawled currently not indexed: 1;
  - excluded by `noindex`: 21;
  - page with redirect: 3;
  - not found: 1;
  - alternate canonical: 1.
- Submitted sitemaps are `https://aggressorbulkit.online/knowledge/sitemap.xml` and `https://aggressorbulkit.online/wp-sitemap.xml`.
- `https://aggressorbulkit.online/knowledge/sitemap.xml` was submitted/refreshed in GSC on 2026-06-15. GSC reported `Sitemap submitted successfully`, last read Jun 15, 2026, status Success, discovered pages 800.
- `/pricing/` URL Inspection showed `URL is available to Google`, `Page can be indexed`, and `Indexing requested`.
- Clean Base2026 candidate URL submissions confirmed:
  - `https://aggressorbulkit.online/knowledge/topics/ai-citations.html` - `Indexing requested`;
  - `https://aggressorbulkit.online/knowledge/topics/ai-citation-tracking.html` - user manually submitted; GSC readback showed `Indexing requested`;
  - `https://aggressorbulkit.online/knowledge/topics/ai-content-quality.html` - GSC showed `URL was added to a priority crawl queue`.
- Remaining clean candidates not yet confirmed submitted:
  - `https://aggressorbulkit.online/knowledge/topics/ai-retrieval-behavior.html`;
  - `https://aggressorbulkit.online/knowledge/topics/backlink-quality.html`;
  - `https://aggressorbulkit.online/knowledge/topics/content-freshness.html`;
  - `https://aggressorbulkit.online/knowledge/topics/core-update-analysis.html`;
  - `https://aggressorbulkit.online/knowledge/topics/local-seo.html`.
- On 2026-06-16, GSC returned: `Sorry--we couldn't process this request because you've exceeded your daily quota. Please try submitting this again tomorrow.` Stop manual submissions for today and continue after the GSC quota reset.
- Browser automation is now considered unsafe for GSC input/clicking, even when DOM access is available, because it repeatedly targeted the wrong browser/UI region in the user's live session. Do not use coordinate clicks, synthetic input, or automated `REQUEST INDEXING` clicks in GSC again in this workflow.
- Earlier automated individual URL Inspection attempts were blocked or unreliable. Verified blockers/risks:
  - direct raw URL Inspection links return Google 404 because GSC uses hashed internal inspection IDs;
  - `System Events` UI scripting previously failed with `Access for assistive devices is disabled. (-1719)`;
  - Chrome/Apple Events later allowed DOM read/write, but the live UI behavior was still not safe enough for production control.
- Going forward, Codex may only read GSC status from the already-open current page if the user asks. URL entry and `REQUEST INDEXING` submission must be done manually by the user unless a separate, isolated automation profile is built and tested outside the user's live browser.

### Nash - GSC / Indexing Follow-up

Status: accepted as read-only audit.

- Confirmed from repo memory/local evidence that the sitemap refresh is complete and successful.
- Confirmed `/pricing/` was inspected and indexing was requested.
- Confirmed `GSC-01` is not complete for the Base2026 clean candidate URLs.
- No safe API path for ordinary source/topic URL indexing is proven. The Google Indexing API is not treated as valid for these pages in this workflow.
- Exact blocker: individual URL Inspection requests need manual submission in logged-in GSC or macOS UI automation/screen permissions for browser automation.

### Dalton - GSC Non-UI Path Verification

Status: accepted as read-only audit.

- No safe non-UI path is available now to complete individual GSC indexing requests for ordinary topic/source pages.
- Local repo search found no GSC API credential config or indexing submission script; sitemap generation is XML-only.
- Official Google path check: Indexing API is for JobPosting / livestream BroadcastEvent use cases, URL Inspection API inspects status but does not request indexing, and ordinary recrawl requests go through the URL Inspection UI.
- `GSC-01` therefore remains blocked on manual logged-in GSC URL Inspection submission or macOS UI automation permission.

### Maxwell - Final Live Launch Smoke

Status: accepted as read-only audit.

- Live `robots.txt` returns 200 and advertises WordPress plus Base2026 sitemaps.
- `/knowledge/sitemap.xml` is a 4-chunk sitemap index; chunks contain 400 + 400 + 400 + 108 URLs.
- `/knowledge/`, `/knowledge/api.html`, `topics/ai-citations.html`, and `sources/tiktok-video-7651218412475059464.html` return 200 with self-canonical indexable pages where intended.
- Topic/source sample pages include visible Q&A.
- `/knowledge-search/multi-search` is reachable and returned hits using the live `base2026_public_tiktok` index.
- GitHub Pages returns 200 and the Pages API reports `built` from `main` `/docs`.
- Public GitHub Project #3 returns HTTP 200.
- Caveat: arbitrary unknown `/knowledge/no-such-generated-route-qa-sidecar.html` still falls back to `/knowledge/` with 200. Generated entity misses already return 404; arbitrary unknown route soft-200 tightening can be a later nginx hardening task.

### Kierkegaard - GitHub / Open-source Hygiene Follow-up

Status: accepted as read-only audit.

- Remote `origin/main` is `33745568c Tighten GitHub publication boundary`.
- Open PRs: 0.
- PR #4 and PR #2 are merged; PR #1 Dependabot was closed, not merged.
- Source workflow files are absent. `.github/workflows` is only an empty local directory.
- Source Dependabot config is absent locally and on remote.
- GitHub dynamic/system workflows still appear for Pages/dependency graph/Dependabot surfaces. This is a repo-settings nuance, not checked-in workflow code.
- GitHub Pages is public, HTTPS enforced, built from `main` `/docs`, and serving HTTP 200.
- Publication checks passed: metadata ok, publication boundary forbidden 0 / needs_review 0 / secrets 0, preflight ok.
- Dirty worktree is large but public-boundary scan found no forbidden/private path matches. The bulk is generated `web/static` output.

### Feynman - GitHub Remote Recheck

Status: accepted as read-only audit.

- Remote repo remains public; open PR count is 0.
- GitHub Pages remains built from `main` `/docs`, HTTPS enforced, and returns HTTP 200.
- Project #3 is publicly reachable over HTTP 200; GraphQL detail query is limited by token scope, but public reachability is proven.
- `origin/main` has no checked-in `.github/workflows/` or `.github/dependabot.yml|yaml`.
- GitHub Actions concern is not a checked-in-code blocker: visible Actions entries are dynamic/system workflows, not repository workflow files.

### Main Local Publication / Live Recheck

Status: accepted after Arendt timed out once.

- `python3 scripts/audit-publication-boundary.py --json` passed with 3231 changed files, forbidden `[]`, needs_review `[]`, secret_findings `[]`.
- `python3 scripts/validate-github-metadata.py` passed.
- `python3 scripts/base2026-controller.py status` now reports next action as the GSC individual clean-URL blocker and current live release as `base2026-footer-api-pricing-context-r2-20260615`.
- Live `/knowledge/sitemap.xml` returns 200, has 4 chunks, and the chunks contain 1308 URLs.
- Live source/topic samples are indexable, self-canonical, and include visible Evidence Q&A.
- Live generated pages still expose the older `base2026-gsc-evidence-qa-20260615` marker, while the API/llms assets from the later footer/API pass are live. Treat `PROJECT_STATE.md`/controller as the latest deployment checkpoint and do not use the page marker alone as release truth.

### Linnaeus - Deploy / Live QA

Status: accepted as read-only audit.

- `base2026-gsc-evidence-qa-20260615` is live.
- Live representative source/topic/noindex pages passed canonical/robots/H1/Q&A/no-FAQ checks.
- Missing generated entity routes return 404.
- `/knowledge-search/multi-search` returns hits.
- Static CSS serves gzip and immutable cache headers.
- Mobile visual QA passed with 44 checks and 0 failures.

## Current Critical Path

1. Finish the GSC row honestly: sitemap refresh is done and 3 clean URLs are confirmed submitted. The remaining clean candidates need manual GSC submission by the user after the daily quota reset. A fresh non-UI/API check confirmed there is no valid ordinary-page indexing request path outside GSC UI, and live-browser automation is no longer allowed for GSC input/clicks.
2. Keep launch state steady: live server, GitHub Pages/Project, metadata, publication boundary, and sitemap/search smoke are verified.

## Current Execution Rule

Main Codex must not continue by "discovering everything again." It should pick the first incomplete row above, run the bounded verification or patch needed to close it, update this board, and move to the next row.

Current first incomplete row: `GSC-01`, specifically the remaining individual clean-URL indexing-request step. GitHub cleanup and final live audit are no longer blockers. GSC daily quota is exhausted, so the next non-looping action is to wait for quota reset, manually submit the remaining clean candidates, and then record the result. Do not use browser automation to type or click in GSC.

## Hard Stops

- Do not commit generated release artifacts, raw captions, raw ASR, media, logs, private DB files, `.planning/`, `public-data/`, `output/`, or secrets.
- Do not reintroduce FAQ schema just to chase rich results.
- Do not submit noindex/singleton/thin/alternate-canonical/ghost URLs to GSC.
- Do not mark a worker task done until main Codex verifies it.
