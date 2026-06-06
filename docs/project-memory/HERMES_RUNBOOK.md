# Hermes Runbook

Hermes should become the maintainer automation agent for TikTok refresh.

## Intended cycle

1. Check configured creator accounts.
2. Detect new videos by source URL or video id.
3. Pull available captions.
4. Produce raw local intake record.
5. Run faithful English transcript polish.
6. Split transcript into readable paragraphs.
7. Update local public export.
8. Reindex Meilisearch only if data changed.
9. Package and deploy only after QA gate.
10. Update `DATA_SOURCES.md`, `STATUS_BOARD.csv`, and `PROMPT_LOG.md`.

## Rules

- Do not invent transcript content.
- Do not translate to Russian.
- Do not publish raw unreviewed captions.
- Do not run uncontrolled infinite loops.
- Keep logs local and out of git.

## First safe milestone

Build dry-run mode:

- check creators
- report potential new videos
- do not write database
- do not deploy

