# Security Policy

Base2026 is pre-release. The public demo is read-only; ingestion and transcript processing are local maintainer workflows.

## Reporting

Report security issues privately to the maintainer before public disclosure.

## Current Supported Surface

Supported:

- static public UI under `/knowledge/`;
- generated creator, source, topic, and compare pages;
- Meilisearch search proxy for public search requests;
- local export, packaging, and deploy scripts.

Not supported:

- public ingestion endpoints;
- public transcript refresh endpoints;
- unauthenticated Meilisearch admin API;
- hosted transcription jobs;
- public upload of creator data.

## Required Controls

- no secrets in source code;
- Meilisearch master key stays server-side;
- browser traffic uses a search-only proxy/key;
- public release artifacts are excerpt-only by default;
- full third-party transcripts stay private/local unless explicitly gated or reviewed;
- generated exports, local databases, logs, media, cookies, and release zips are excluded from GitHub;
- run a publication-boundary audit before staging files for GitHub.

## Pre-Publication Checks

```powershell
git status --short --branch
python -m py_compile scripts\export-public-tiktok.py scripts\check-public-export-policy.py scripts\generate-public-pages.py scripts\meili-index-public.py
node --check web\static\meili.js
python .\scripts\check-public-export-policy.py .\public-data\tiktok
python .\scripts\audit-publication-boundary.py
```
