# GitHub Launch Checklist

Date: 2026-06-08

## Current State

Ready for maintainer decisions, not ready to push blindly.

Passed:

- public app deployed at `/knowledge/`;
- release `base2026-public-header-footer-ay9` verified;
- public export is excerpt-only;
- live `documents.jsonl` has no full transcript leak and no raw `claims` field;
- live source pages use stable source-record headings instead of platform-caption headings;
- public roadmap, project story, privacy, source/content policy, support, and site-structure pages are deployed under `/knowledge/`;
- public pages have Alex Yarosh-style dark footer, Base2026 navigation, Roadmap CTA, correction/removal email, and normalized punctuation;
- Apache-2.0 license exists;
- live desktop/mobile smoke tests render results without horizontal overflow;
- repeatable deploy script exists;
- preflight and safe staging helper scripts exist;
- preflight verifies live search and live public documents contract (`claimLeaks=0`, `transcriptLeaks=0`);
- GitHub issue forms, PR template, Dependabot config, and OpenSSF Scorecard workflow exist;
- publication audit script passes for current changed files.

Still needed:

- GitHub repository / remote decision;
- final staged diff review.

## Launch Sequence

1. Confirm license remains Apache-2.0.
2. Confirm `LICENSE`.
3. Confirm `README.md` license status.

Helper after choosing the license:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\apply-license.ps1 -License Apache-2.0
```

or:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\apply-license.ps1 -License MIT
```

4. Confirm GitHub remote:

```powershell
git remote add origin <github-repo-url>
git remote -v
```

5. Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\preflight-github-launch.ps1
```

For audit-only work before choosing a license:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\preflight-github-launch.ps1 -SkipLicenseCheck -SkipRemoteCheck
```

6. Stage only files allowed by:

```text
docs/PUBLICATION_STAGING_PLAN.md
```

Dry-run staging helper:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stage-public-files.ps1
```

Audit-only dry run before license/remote decisions:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stage-public-files.ps1 -SkipLicenseCheck -SkipRemoteCheck
```

Actual staging helper:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stage-public-files.ps1 -Apply
```

7. Run staged diff review:

```powershell
git diff --cached --stat
git diff --cached --name-only
```

8. Commit with a message similar to:

```text
Prepare Base2026 public knowledge app
```

9. Push branch.
10. Open GitHub page and verify README, license, security policy, and CI.

## Remote Setup

`git remote -v` is currently empty.

After creating the GitHub repository, add the remote explicitly before launch preflight:

```powershell
git remote add origin <github-repo-url>
git remote -v
```

Then push the current branch:

```powershell
git push -u origin codex/knowledge-ui-shell
```

## Hard Stop Rules

Do not stage:

- `public-data/`
- `output/`
- `meili_data/`
- private research folders;
- root screenshots;
- root audio files;
- local SQLite databases;
- captions/media/logs;
- cookies/tokens/secrets;
- intake queues;
- release target configs.

Do not use `git add .`.
