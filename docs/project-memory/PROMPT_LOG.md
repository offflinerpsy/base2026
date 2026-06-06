# Prompt Log

## 2026-06-06 — Project control system

User asked to adapt a separate project-control pattern for Base2026, create a durable todo/control system, and use a strict reviewer role.

Outcome:

- created `AGENTS.md`
- created `docs/project-memory/`
- created status board, phases, handoff template, public/private boundary, deploy runbook, Hermes runbook, and reviewer protocol
- set next action to first public-safe git commit preparation

## 2026-06-06 — First public-safe commit prep

User confirmed moving by the new project-control scheme and approved doing the next step.

Outcome:

- staged only public-safe files
- strengthened `.gitignore`
- sanitized deployment docs and agent prompts to remove local absolute paths and concrete server host
- rewrote `README.md` for the public TikTok/video knowledge product
- reviewer pass found no forbidden staged private paths

## 2026-06-06 — Hermes model-routed refresh

User asked to split Hermes work by model tier and avoid GPT-5.5 token waste.

Outcome:

- documented Hermes model routing: GPT-5.3/no LLM for mechanics, GPT-5.4 for normal faithful polish, GPT-5.5 only for escalation
- ran local Hermes refresh without deploy
- pulled captions for two queued videos; ASR was not needed
- created polish batch `hermes-polish-20260606-164846`
- ran Hermes worker with model `gpt-5.4`
- wrote polished outputs and QA for two newest videos
- corrected two QA items using source verification instead of GPT-5.5
- patched `tiktok-polish-status.py` and `hermes-tiktok-refresh.ps1` so `-AfterPolish` checks only the current batch instead of failing on historical `needs_review` items
- ran `-AfterPolish` for `hermes-polish-20260606-164846`
- rebuilt SQLite, audit passed, exported 942 documents and 1371 chunks
- reindexed local Meilisearch and deployed/reindexed VPS release `base2026-public-hermes-20260606-1705`
- verified remote search finds both new TikTok videos
