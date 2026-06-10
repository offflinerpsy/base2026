# Phases

## Phase 0 — Repo hygiene and publication boundary

Purpose: make the repo safe to inspect and commit. Allowed: `.gitignore`, audits, memory docs. Forbidden: pushing, publishing private folders. Done: public/private boundary is explicit and verified.

## Phase 1 — Public TikTok dataset model

Purpose: define the public export shape. Allowed: reviewed metadata, public URLs, public-safe transcript payloads. Forbidden: committing raw dumps, logs, credentials, unreviewed private sources. Done: export is reproducible and documented.

## Phase 2 — Transcript polish pipeline

Purpose: convert raw captions into faithful English transcript text. Allowed: cleanup punctuation, paragraphs, speaker-faithful formatting. Forbidden: inventing claims, translating to Russian, adding meaning not present in source. Done: pipeline has QA rules and rerun instructions.

## Phase 3 — Meilisearch index and search API

Purpose: provide fast search/facets over public data. Allowed: public index updates, search-only key usage. Forbidden: exposing master key or private indexes. Done: search works locally and on VPS.

## Phase 4 — Public web UI

Purpose: make the database usable by humans. Allowed: search, filters, transcripts, source links, responsive UI. Forbidden: UI changes without desktop/mobile QA. Done: user can find, filter, read, and open source posts.

## Phase 5 — Deploy and VPS runbook

Purpose: make deploy repeatable and reversible. Allowed: package release, upload, symlink switch, nginx reload. Forbidden: overwriting WordPress root or leaking keys. Done: deploy and rollback commands are documented.

## Phase 6 — Hermes automation

Purpose: refresh creators and ingest new videos. Allowed: dry-run checks, dedupe, local update, reviewed deploy. Forbidden: uncontrolled always-on scraping or silent public publishing. Done: scheduled refresh has logs, stop command, and QA gate.

## Phase 7 — Open-source packaging

Purpose: prepare GitHub publication. Allowed: license, contributing docs, sample data, public scripts. Forbidden: committing private data or generated local artifacts. Done: first public-safe commit and repository metadata are ready.

## Phase 8 — Security and compliance audit

Purpose: catch leaks and operational risks before public push. Allowed: staged diff review, secret scan, docs review. Forbidden: pushing before audit. Done: reviewer signs off with no private data in staged files.
