# MacBook Codex Bootstrap Prompt

Use this prompt in Codex on the MacBook after opening:

`/Users/alexyarosh/Projects/base2026-migration/DW/base2026`

```text
You are working on Base2026 from the migrated MacBook workspace.

Start by reading:
- AGENTS.md
- docs/project-memory/PROJECT_STATE.md
- docs/project-memory/ACTIVE_PHASE.md
- docs/project-memory/NEXT_ACTION.md
- docs/project-memory/DECISIONS.md
- docs/project-memory/DATA_SOURCES.md
- docs/project-memory/STATUS_BOARD.csv
- docs/project-memory/PHASES.md
- docs/project-memory/PUBLICATION_BOUNDARY.md
- docs/project-memory/DEPLOYMENT_RUNBOOK.md
- docs/project-memory/HERMES_RUNBOOK.md
- docs/project-memory/VISUAL_SYSTEM_CONTRACT.md

Task:
Validate and activate the migrated Base2026 MacBook environment.

Do not commit, push, deploy, or run TikTok intake yet.
Do not publish private data, raw captions, local databases, generated archives, logs, media, credentials, cookies, or tokens.

Check:
1. Confirm current directory, git branch, and git status.
2. Confirm these project files exist:
   - scripts/base2026-controller.py
   - docs/GIT_PUBLICATION_AUDIT.md
   - docs/project-memory/PUBLICATION_BOUNDARY.md
3. Confirm local skills are visible or available:
   - gsd-* workflow skills
   - codex-context-rot-control
   - memory-management
   - doc
   - browse
   - playwright / playwright-skill / playwright-interactive
   - frontend-design / responsive-design / design-system-patterns
   - redesign-skill / taste-skill / gpt-tasteskill / soft-skill
   - seo / seo-audit / ai-seo / geo-seo-command-center
   - geo-content-optimizer / entity-optimizer
   - schema / schema-markup-generator
   - programmatic-seo / keyword-research / keyword-clustering
   - content-strategy / content-quality-auditor / domain-authority-auditor
   - cloudflare-deploy / cloudflare-godaddy-ops
   - sentry
4. Check runtime dependencies:
   - brew
   - git
   - python3
   - node
   - npm
   - ffmpeg
   - yt-dlp
   - ollama
   - meilisearch
5. Run:
   python3 scripts/base2026-controller.py status

Report only:
1. What works.
2. What is missing.
3. Exact install commands needed for macOS.
4. Whether the project is ready for GitHub/publication audit.
5. The next safe action.
```

Recommended Codex plugins to enable on the MacBook through Settings:

- Browser
- GitHub
- Build Web Apps
- Product Design
- Build Web Data Visualization
- Codex Security
- Cloudflare
