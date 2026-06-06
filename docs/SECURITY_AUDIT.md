# Security Audit

Date: 2026-06-01

## Status

Pre-open-source audit. Current project is local prototype, not production-ready.

## Critical Findings

### Public Refresh Endpoint

`/api/refresh` can start local scripts.

Risk: remote command/job triggering if published publicly.

Fix:

- disable in public builds
- require admin auth for private builds
- move refresh into worker queue

### Meilisearch Development Mode

Local POC runs without production auth.

Risk: public write/admin access if exposed.

Fix:

- set `MEILI_MASTER_KEY`
- expose only search key to browser
- keep admin key server-side
- block direct public access to `:7700`

### No Git Ignore Before Audit

Repo had no `.gitignore`.

Risk: raw data, DBs, audio, screenshots, generated search data can be pushed.

Fix done:

- added `.gitignore`
- blocks SQLite DB, `meili_data`, raw sources, audio, screenshots, env files

### Code and Data Mixed

Risk: open-source release may publish local/private research data.

Fix:

- split source code from private data
- create `sample-data/`
- export public dataset intentionally

## High Findings

### Prototype HTTP Server

`http.server` is fine for local POC.

Risk in production:

- no security headers
- no auth
- no rate limiting
- no structured logging
- no request size limits

Fix:

- production app behind real ASGI/WSGI server or static frontend + API
- add reverse proxy security headers

### Browser CDN Dependencies

Current Meili POC loads scripts from CDN.

Risk:

- supply chain / availability
- no pinning/SRI

Fix:

- bundle dependencies in build step
- pin versions
- optional SRI for static CDN

### Public Data Policy Missing

Risk:

- accidental publication of full transcripts/audio/raw artifacts
- unclear contributor policy

Fix:

- define public/private fields
- generate only public-safe pages
- add takedown/contact policy

## Secret Scan

Quick pattern scan found no obvious active API keys in code, but many false positives in content because words like `secret`, `token`, `API`, and `GPT` appear in research/transcripts.

Before GitHub:

```powershell
gitleaks detect --source . --no-git
```

or:

```powershell
detect-secrets scan > .secrets.baseline
```

## Production Guardrails

Required before public deploy:

- `.env.example`
- no real `.env`
- Meilisearch master key
- public search-only key
- admin routes disabled or authenticated
- no subprocess execution from public HTTP
- CORS restricted
- rate limiting
- backups
- health checks
- content takedown/contact page

## References

- OWASP: secrets should not be stored in source code: https://owasp.org/www-project-devsecops-guideline/latest/01a-Secrets-Management
- Meilisearch Docker master key docs: https://www.meilisearch.com/docs/guides/docker
