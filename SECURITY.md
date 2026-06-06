# Security Policy

Base2026 is currently pre-release and not ready for untrusted public ingestion.

## Reporting

Report security issues privately to the project maintainer before public disclosure.

## Current Scope

Supported:

- local research console
- local Meilisearch proof of concept
- private ingestion workflow

Not production-supported yet:

- public `/api/refresh`
- public ingestion endpoints
- unauthenticated Meilisearch admin API
- hosted transcription/AI jobs

## Required Production Controls

- no secrets in source code
- Meilisearch master key enabled
- browser uses search-only key
- admin endpoints authenticated
- public server is read-only by default
- raw data and generated indexes excluded from GitHub
- secret scanning before every public release
