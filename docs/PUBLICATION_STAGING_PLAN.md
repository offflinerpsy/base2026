# Publication Staging Plan

Date: 2026-06-08

## Do Not Use `git add .`

Stage only reviewed public-safe files.

## Public-Safe Candidates

Root:

- `.env.example`
- `.gitignore`
- `AGENTS.md`
- `README.md`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `LICENSE`
- `.github/workflows/ci.yml`
- `.github/workflows/scorecard.yml`
- `.github/dependabot.yml`
- `.github/pull_request_template.md`
- `.github/ISSUE_TEMPLATE/`

Docs:

- `docs/GIT_PUBLICATION_AUDIT.md`
- `docs/project-memory/`
- `docs/public-pages/`
- `docs/research/`
- `docs/schemas/`
- public-safe `web/*.md`

Scripts:

- `scripts/export-public-tiktok.py`
- `scripts/check-public-export-policy.py`
- `scripts/generate-info-pages.py`
- `scripts/generate-public-pages.py`
- `scripts/meili-index-public.py`
- `scripts/package-public-release.ps1`
- `scripts/deploy-public-vps.ps1`
- `scripts/server-patch-nginx-base2026.py`
- `scripts/apply-license.ps1`
- `scripts/preflight-github-launch.ps1`
- `scripts/stage-public-files.ps1`
- public-safe local worker/intake scripts after final review

Web:

- `web/static/`
- `web/server.py`
- public-safe `web/*.md`

Config:

- `config/creators.example.json`

## Do Not Stage

- `public-data/`
- `output/`
- `meili_data/`
- `12_knowledge-base/indexes/`
- `12_knowledge-base/sources/`
- `12_knowledge-base/canonical/`
- `12_knowledge-base/reports/`
- private research folders listed in `docs/GIT_PUBLICATION_AUDIT.md`
- root screenshots and snapshot files
- root audio files
- `manifest.json`
- `docs/*_roadmap_pack.zip`
- `config/tiktok-intake-queue*.json`
- `config/release-target*.json`
- `.env`, secrets, cookies, tokens, SSH keys, logs

## Still Needs Maintainer Decision

- License.
- GitHub remote / repository name.
- Whether the public repo includes any sample JSONL fixture data, or stays code-only.
