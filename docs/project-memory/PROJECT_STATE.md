# Project State

Last updated: 2026-06-06

Base2026 is being split into a public open-source TikTok transcript search product and private local research assets.

Current public product:

- public TikTok knowledge search UI under `/knowledge/`
- Meilisearch-backed public index: `base2026_public_tiktok`
- public release deployed on VPS at `/var/www/base2026-knowledge/current`
- latest deployed release: `base2026-public-hermes-20260606-1705`
- public dataset shape: TikTok documents, searchable passages, creator/source/date metadata, transcript drawer payload

Current local repo state:

- branch: `codex/knowledge-ui-shell`
- first public-safe commit exists
- Hermes reliability pass completed: WebUI scheduled task repaired, GPT-5.4 worker script added, false ASR backlog closed
- active phase: Public web UI visual-system pass
- current UI/data-model decision: separate `Platform` filters (TikTok now, Instagram planned) from content `Topic/Category` filters
- GitHub publication is not ready until UI pass, license choice, and final publication/security audit are complete
- public/private git boundary documented
- generated/private folders ignored in `.gitignore`

Primary risk:

- weak public UI visual system before broader publication, plus accidental publication of private research folders, raw source data, generated dumps, logs, credentials, or unreviewed data.
