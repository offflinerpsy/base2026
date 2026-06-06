# Project State

Last updated: 2026-06-06

Base2026 is being split into a public open-source TikTok transcript search product and private local research assets.

Current public product:

- public TikTok knowledge search UI under `/knowledge/`
- Meilisearch-backed public index: `base2026_public_tiktok`
- public release deployed on VPS at `/var/www/base2026-knowledge/current`
- latest deployed release: `base2026-public-drawer-20260606b`
- public dataset shape: TikTok documents, searchable passages, creator/source/date metadata, transcript drawer payload

Current local repo state:

- branch: `codex/knowledge-ui-shell`
- first commit not created yet
- public/private git boundary documented
- generated/private folders ignored in `.gitignore`

Primary risk:

- accidental publication of private research folders, raw source data, generated dumps, logs, credentials, or unreviewed data.

