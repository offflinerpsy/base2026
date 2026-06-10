# Active Phase

Last updated: 2026-06-10

## Current active phase

Pipeline hardening and private insight-card backfill after MacBook migration.

## Why this is active

The public intelligence layer is deployed and the MacBook publication staging workflow now passes dry-run checks. The owner clarified that the immediate priority is not GitHub publication but finishing the local-first TikTok/source pipeline: ASR readiness, local model extraction, evidence verification, private pending claim import, and safe promotion gates.

## Current exact task

Turn the planned pipeline into a repeatable local system. Current slice: backfill sources with passages but no insight cards using either GPT/Codex source-only extraction packets or local models as optional candidate generators, verify evidence deterministically, use manual GPT/Codex review for small-batch semantic/copy quality checks, import only reviewed and evidence-verified candidates as private/pending claims, and keep public promotion disabled until reviewed.

## Important note

Do not deploy or push unless explicitly requested. Generated public pages should not be committed by default; prefer reproducible generation from scripts.
