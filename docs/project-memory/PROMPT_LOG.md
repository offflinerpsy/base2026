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

## 2026-06-06 — Hermes reliability and UI backlog

User asked to fix Hermes WebUI reliability, add lean worker path, close pipeline tails, keep the guide updated, and record the weak visual UI as the next serious workstream.

Outcome:

- repaired `Hermes WebUI` scheduled task by switching action to absolute `C:\Program Files\PowerShell\7\pwsh.exe` and setting working directory
- added `scripts/register-hermes-webui-task.ps1` for reproducible WebUI task repair/start
- added `scripts/run-hermes-polish-worker.ps1` for durable GPT-5.4 batch polish handoff with ignored `.planning/` logs
- fixed ASR fallback media detection to accept mp3/mp4/m4a/webm/wav
- marked two no-audio fallback videos as `needs_source_review` instead of endless `needs_asr`
- verified `needs_asr=0`, `queued_asr_jobs=0`, and `kb-audit.py` PASS after rebuild
- moved active phase to Public web UI visual-system pass and created `UI_VISUAL_BACKLOG.md`
