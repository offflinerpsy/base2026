# Base2026 Video Knowledge Search

Base2026 is a public knowledge-search app for video transcripts.

Current focus: TikTok creators discussing SEO, GEO, AEO, AI search visibility, schema, keyword research, Google, Bing, and related topics.

The project converts public short-form videos into searchable English transcript passages, indexes them with Meilisearch, and serves a lightweight public web UI.

## What is public

- static search UI in `web/static/`
- public export and indexing scripts in `scripts/`
- project docs in `docs/`
- agent/runbook instructions in `AGENTS.md` and `docs/project-memory/`
- public-safe TikTok knowledge guides under `12_knowledge-base/`

## What is private

Raw local research assets, generated datasets, private SEO/GEO/AEO files, logs, release archives, local Meilisearch data, credentials, and raw intake files are not part of the public source tree.

Read before contributing:

- `AGENTS.md`
- `docs/project-memory/PUBLICATION_BOUNDARY.md`
- `docs/GIT_PUBLICATION_AUDIT.md`

## Current architecture

```text
public TikTok source
  -> local intake / transcript polish
  -> public-data/tiktok export
  -> Meilisearch public index
  -> static web UI under /knowledge/
```

The deployed public app is read-only. Intake and refresh automation are maintainer workflows, not public endpoints.

## Local workflow

Build public TikTok export:

```powershell
python .\scripts\export-public-tiktok.py
```

Index public export into Meilisearch:

```powershell
python .\scripts\meili-index-public.py --index base2026_public_tiktok
```

Package a public release:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\package-public-release.ps1 -ReleaseName <release-name>
```

## Project control

Agents must start from repo files, not chat memory.

Primary control files:

- `AGENTS.md`
- `docs/project-memory/ACTIVE_PHASE.md`
- `docs/project-memory/NEXT_ACTION.md`
- `docs/project-memory/STATUS_BOARD.csv`
- `docs/project-memory/PUBLICATION_BOUNDARY.md`
- `docs/project-memory/REVIEW_PROTOCOL.md`

## Current phase

Phase 7 — Open-source packaging.

Next step: prepare and review the first public-safe commit.

