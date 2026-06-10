# Publication Audit Report

Date: 2026-06-08

## Scope

Current dirty worktree on branch `codex/knowledge-ui-shell`.

Purpose: check whether the current public-facing source candidates can be prepared for GitHub without committing private/generated data.

## Automated Audit

Command:

```powershell
python .\scripts\audit-publication-boundary.py
```

Result:

```text
changed_files=91
public_safe_candidates=91
needs_review=0
forbidden=0
secret_findings=0
ok_to_stage_public_safe_candidates=true
```

## Verification Commands

Passed:

```powershell
python -m py_compile scripts\export-public-tiktok.py scripts\check-public-export-policy.py scripts\generate-public-pages.py scripts\meili-index-public.py scripts\audit-publication-boundary.py
node --check web\static\meili.js
python .\scripts\validate-github-metadata.py
python .\scripts\check-public-export-policy.py .\public-data\tiktok
```

PowerShell parser check passed for:

- `scripts/package-public-release.ps1`
- `scripts/deploy-public-vps.ps1`
- `scripts/preflight-github-launch.ps1`
- `scripts/stage-public-files.ps1`
- `scripts/apply-license.ps1`

Dry-run staging helper passed:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stage-public-files.ps1 -SkipPreflight -SkipLicenseCheck -SkipRemoteCheck
```

Result:

- `stage_path_count=44`
- all 91 public-safe changed files are covered by the staging allowlist
- no files are staged unless `-Apply` is passed

License gate:

- default `preflight-github-launch.ps1` fails until `LICENSE` exists;
- full launch preflight requires both `LICENSE` and GitHub `origin` remote;
- audit-only mode uses `-SkipLicenseCheck -SkipRemoteCheck`;
- `stage-public-files.ps1 -Apply` refuses to stage for launch without `LICENSE`.

Live search proxy check passed:

- query: `AI Overviews`
- hits: `922`
- topic fields present in returned hits

Packaged UI contract check passed:

- release package: `base2026-ui-contract-check`
- `web/static/documents.jsonl`: 957 records, `claims_field=0`, `transcripts=0`
- sample source page H1: `@tjrobertson52 source record`
- sample source page includes `Public Evidence Excerpt`, `Public Insight Cards`, and full-transcript warning
- sample source page contains no stale `Reviewed` wording

Live ay7 deployment check passed:

- deployed release: `base2026-public-source-record-ay7`
- `/knowledge/`: 200, search UI present, `/knowledge-search` configured
- `/knowledge/static/documents.jsonl`: 957 records, `claims_field=0`, `transcripts=0`
- `/knowledge-search/multi-search` query `AI Overviews`: 922 hits, topic fields present
- launch preflight now verifies live documents contract: `rows=957`, `claimLeaks=0`, `transcriptLeaks=0`
- sample source page H1: `@tjrobertson52 source record`
- Playwright desktop/mobile smoke: 20 rendered results, 20 source buttons, no horizontal overflow
- source dialog opens with policy, public evidence excerpt, and platform-caption metadata

Live ay8 info-page deployment check passed:

- deployed release: `base2026-public-info-pages-ay8`
- `/knowledge/`, `/knowledge/roadmap.html`, `/knowledge/story.html`, `/knowledge/privacy.html`, `/knowledge/source-policy.html`, `/knowledge/support.html`, `/knowledge/site-structure.html`, `/knowledge/methodology.html`, and `/knowledge/opt-out.html`: 200
- `/knowledge-search/multi-search` query `AI Overviews`: 922 hits
- Playwright smoke: 20 rendered live search results, Roadmap visible in hero, Roadmap page has 6 phase cards, mobile Support page renders, no horizontal overflow
- source Markdown for info pages lives in `docs/public-pages/`; imported source ZIPs are ignored by `docs/*_roadmap_pack.zip`

GitHub metadata check passed:

- issue templates
- pull request template
- Dependabot config
- OpenSSF Scorecard workflow
- metadata validator

## Public Boundary

Confirmed ignored / do-not-stage categories:

- `public-data/`
- `output/`
- `meili_data/`
- private research folders
- root screenshots and snapshot files
- root audio files
- generated release zips
- `config/tiktok-intake-queue*.json`
- `config/release-target*.json`

Confirmed public-safe config:

- `config/creators.example.json`

## Remaining Maintainer Decisions

Do not push to GitHub until these are resolved:

1. License.
2. GitHub remote / repository name.
3. Whether the public repo stays code-only or includes small fixture JSONL samples.

## Staging Rule

Do not run `git add .`.

Use `docs/PUBLICATION_STAGING_PLAN.md` and `scripts/audit-publication-boundary.py` immediately before staging.
