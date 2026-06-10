# Base2026 Video Source Intelligence

Base2026 is a local-first, public-facing knowledge system for short-form creator videos.

The current public demo focuses on TikTok creators talking about SEO, GEO, AEO, AI search visibility, schema, keyword research, Google, Bing, and related topics.

Live demo path: `https://aggressorbulkit.online/knowledge/`

## What It Does

- converts public creator videos into searchable English evidence passages;
- keeps raw captions, ASR output, media, and full transcripts local/private by default;
- exports public-safe source records, passages, insight cards, topics, and creator metadata;
- indexes searchable passages with Meilisearch;
- serves a static read-only web UI under `/knowledge/`;
- generates creator, source, topic, and comparison pages from public JSONL.

## Current Public Shape

Public pages:

- `/knowledge/`
- `/knowledge/creators/{handle}.html`
- `/knowledge/sources/{item_id}.html`
- `/knowledge/topics/{topic_id}.html`
- `/knowledge/compare/{topic_id}.html`
- `/knowledge/roadmap.html`
- `/knowledge/story.html`
- `/knowledge/methodology.html`
- `/knowledge/privacy.html`
- `/knowledge/source-policy.html`
- `/knowledge/support.html`
- `/knowledge/site-structure.html`
- `/knowledge/opt-out.html`

Public data files generated locally:

- `source_records.jsonl`
- `passages.jsonl`
- `insight_cards.jsonl`
- `topics.jsonl`
- `creators.jsonl`
- `manifest.json`

Compatibility files:

- `documents.jsonl`
- `chunks.jsonl`

Generated public data and release archives are deploy artifacts, not GitHub source.

## Public Boundary

Do not commit or publish:

- private research folders;
- local SQLite databases;
- raw captions;
- ASR audio/video;
- cookies, tokens, API keys, SSH keys;
- generated release zips;
- generated `public-data/`;
- local Meilisearch data;
- logs.

The public app is excerpt-first. Full third-party transcripts are private/local by default. Public source pages and the source dialog show attribution, original links, short evidence context, methodology, and correction/opt-out paths.

## Architecture

```text
creator registry
  -> local intake / captions / ASR
  -> transcript cleanup and QA
  -> passage chunking
  -> topic and insight extraction
  -> public JSONL export
  -> static page generation
  -> Meilisearch passage index
  -> read-only public UI under /knowledge/
```

No live LLM call is required during public search.

## Local Commands

Export public TikTok data:

```powershell
python .\scripts\export-public-tiktok.py --auto-promote-insights
python .\scripts\check-public-export-policy.py .\public-data\tiktok
```

Index passages into Meilisearch:

```powershell
python .\scripts\meili-index-public.py --index base2026_public_tiktok
```

Package a public release:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\package-public-release.ps1 -ReleaseName <release-name>
```

Public packages are excerpt-only by default. Use `-IncludeFullTranscripts` only for private or gated review exports.

Deploy to the VPS:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-public-vps.ps1 -ReleaseName <release-name>
```

Audit before staging for GitHub:

```powershell
python .\scripts\audit-publication-boundary.py
```

## Project Control

Agents and maintainers should start from repo files, not chat memory.

Read first:

- `AGENTS.md`
- `docs/project-memory/ACTIVE_PHASE.md`
- `docs/project-memory/NEXT_ACTION.md`
- `docs/project-memory/STATUS_BOARD.csv`
- `docs/project-memory/PUBLICATION_BOUNDARY.md`
- `docs/GIT_PUBLICATION_AUDIT.md`

## Current Status

Latest deployed release: `base2026-public-info-pages-ay8`.

Latest public data contract check: 957 source records, 1392 searchable passages, no raw `claims` field in public source records, and no full transcripts in public `documents.jsonl`.

Latest public page pass: roadmap, project story, privacy, source/content policy, support, and recommended site-structure pages are generated from `docs/public-pages/` and deployed under `/knowledge/`.

Current checkpoint: open-source readiness and publication audit.

License: Apache-2.0.
## License

Repository code and documentation are licensed under Apache-2.0. Third-party creator videos, platform captions, and original source content are not relicensed by this repository.
