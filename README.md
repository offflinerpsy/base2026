# Base2026 Video Source Intelligence

Base2026 is a local-first, public-facing source intelligence system for short-form expert videos.

The current public demo focuses on TikTok creators talking about SEO, GEO, AEO, AI search visibility, schema, keyword research, Google, Bing, and related topics.

Live demo: <https://aggressorbulkit.online/knowledge/>

AI/API entry point: <https://aggressorbulkit.online/knowledge/api.html>

## What It Does

- converts public creator videos into searchable English source text and evidence passages;
- keeps raw captions, raw ASR output, media, private QA notes, and unreviewed transcripts local/private;
- can expose reviewed polished public source text/transcript as a source-record reading surface where policy allows;
- exports public-safe source records, passages, insight cards, topics, and creator metadata;
- indexes searchable passages with Meilisearch;
- serves a static read-only web UI under `/knowledge/`;
- generates creator, source, topic, and comparison pages from public JSONL.
- exposes agent-readable public entry points (`/knowledge/llms.txt`, `/knowledge/data-dictionary.json`, `/knowledge/api-index.json`) so AI tools can inspect the public library without scraping the visual UI.

The public site is designed for source discovery, attribution, comparison, citation, and searchable source reading. It is not a video re-hosting platform and not a raw transcript dump.

## Current Status

Latest deployed release: `base2026-footer-api-pricing-context-r2-20260615`.

Current public export:

- 1,219 source records;
- 1,715 searchable passages;
- 1,614 insight cards;
- 1,043 public insight cards;
- 1,510 topics;
- 995 public topics;
- 1,308 sitemap URLs in the live release.

Recent readiness checks:

- public export policy: current live release uses reviewed public source text where policy allows and continues to forbid raw/unreviewed transcript dumps;
- publication boundary audit: passing for current changed public-safe files;
- GitHub metadata validation: passing;
- static SEO metadata audit: passing for 3,294 HTML files with title, description, canonical URL, H1, and JSON-LD schema present.

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

Agent-readable public files:

- `/knowledge/llms.txt`
- `/knowledge/api.html`
- `/knowledge/api-index.json`
- `/knowledge/data-dictionary.json`

The public search UI also uses a server-side Meilisearch proxy at `/knowledge-search/multi-search`. The proxy is read-only and injects the public search key server-side; integrations should prefer static JSONL for bulk/offline analysis.

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

Raw captions, raw ASR, media, private QA notes, and unreviewed transcripts are private/local. Reviewed polished public source text may be shown where policy allows. Public source pages and source detail must show attribution, original links, source context, methodology, and correction/opt-out paths.

## What This Repository Is For

This repository is intended to show the public-safe system layer:

- data contracts for public source records, passages, insight cards, topics, and creator metadata;
- static page generation for search, creator, source, topic, comparison, roadmap, methodology, policy, support, and correction/removal pages;
- local worker scripts for export, validation, indexing, packaging, and deployment;
- project memory and runbooks for repeatable operation;
- open-source issue templates and contribution paths.

Private research data, raw platform material, local databases, and deploy archives are intentionally excluded.

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

```bash
python3 scripts/export-public-tiktok.py
python3 scripts/check-public-export-policy.py public-data/tiktok
```

Do not use implicit public-card promotion for GitHub or public release preparation. Public insight cards should come from reviewed source-backed rows, not from one-off export flags.

Index passages into Meilisearch:

```bash
python3 scripts/meili-index-public.py --index base2026_public_tiktok
```

Package a public release:

```bash
pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/package-public-release.ps1 -ReleaseName <release-name>
```

Current public packages are excerpt-only until the reviewed public source-text contract is implemented in code. Do not use `-IncludeFullTranscripts` for public deploys as a shortcut; the target is a reviewed public source-text field, not raw transcript export.

Deploy to the VPS:

```bash
pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/deploy-public-vps.ps1 -ReleaseName <release-name>
```

Audit before staging for GitHub:

```bash
python3 scripts/audit-publication-boundary.py
python3 scripts/validate-github-metadata.py
pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/preflight-github-launch.ps1 -SkipExportPolicy -SkipLiveCheck
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

## About the Maintainer

Base2026 is created and maintained by [Alex Yarosh](https://aggressorbulkit.online/about/), an independent AI Search Visibility consultant working across SEO, GEO, AEO, local search, entity/trust signals, and public source intelligence.

Alex is building Base2026 as an independent pilot project for studying how public expert knowledge can become searchable, attributable, and useful to both humans and AI systems.

- Website: <https://aggressorbulkit.online/>
- Live Base2026 demo: <https://aggressorbulkit.online/knowledge/>
- Contact: <offflinerpsy@gmail.com>

## Contribution Areas

Useful contributions include:

- extractor adapters for additional public short-form platforms;
- caption and ASR quality benchmarks;
- safer public export validators;
- Meilisearch ranking and faceting improvements;
- static page, schema, sitemap, and accessibility improvements;
- creator correction/removal workflow improvements;
- documentation that makes local operation easier.

Please do not submit raw third-party captions, unreviewed transcripts, media files, cookies, credentials, or private research exports.

## License

Repository code and documentation are licensed under Apache-2.0. Third-party creator videos, platform captions, and original source content are not relicensed by this repository.
