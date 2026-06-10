# Hermes Runbook

Hermes should become the maintainer automation agent for TikTok refresh.

## Intended cycle

1. Check configured creator accounts.
2. Detect new videos by source URL or video id.
3. Pull available captions.
4. Produce raw local intake record.
5. Run faithful English transcript polish.
6. Split transcript into readable paragraphs.
7. Build GPT/Codex source-only claim extraction packets when insight cards are missing.
8. Apply strict JSON review output back into private candidates.
9. Run deterministic evidence verification.
10. Import only reviewed/evidence-verified candidates as private/pending.
11. Update local public export only after review gates.
12. Reindex Meilisearch only if data changed.
13. Package and deploy only after QA gate.
14. Update `DATA_SOURCES.md`, `STATUS_BOARD.csv`, and `PROMPT_LOG.md`.

## Model routing

- Task A inventory/dedupe/status: no LLM or GPT-5.3.
- Task B captions/ASR routing: no LLM or GPT-5.3.
- Task C faithful transcript polish: GPT-5.4 low/medium.
- Task D escalation QA: GPT-5.5 only for damaged captions, uncertain ASR, low preservation score, or QA `needs_review`.
- Task E insight-card extraction/review for launch-quality small batches: GPT-5.4 high/Codex through generated packets, strict JSON, deterministic evidence verification after.
- Task F rebuild/export/package: no LLM or GPT-5.3 for status text only.

## Rules

- Do not invent transcript content.
- Do not translate to Russian.
- Do not publish raw unreviewed captions.
- Do not publish generated insight-card candidates directly.
- Do not use browser ChatGPT as a scheduled hidden worker.
- Do not run uncontrolled infinite loops.
- Keep logs local and out of git.

## First safe milestone

Build dry-run mode:

- check creators
- report potential new videos
- do not write database
- do not deploy

## Current safe execution policy

Run local refresh without deploy first. If new caption transcripts are produced, create a small polish batch and hand only that batch to Hermes using GPT-5.4. Do not use GPT-5.5 unless QA fails.

Use `scripts/run-hermes-polish-worker.ps1 -BatchSet <batch-set>` for the GPT-5.4 handoff. The script writes the worker prompt and result under ignored `.planning/` paths and uses `codex exec --ignore-user-config --ignore-rules` to avoid loading the full project context.

Use `scripts/register-hermes-webui-task.ps1 -Start` to repair/start the local `Hermes WebUI` scheduled task. The task must execute PowerShell by absolute path and use the local Hermes WebUI launcher directory as working directory. Override defaults with `HERMES_PWSH_PATH`, `HERMES_WEBUI_LAUNCHER`, or `HERMES_WEBUI_WORKDIR` when needed.

## AfterPolish rule

`scripts/hermes-tiktok-refresh.ps1 -AfterPolish -BatchSet <batch-set>` must validate only the current batch via `scripts/tiktok-polish-status.py --batch-dir <batch-dir>`.

Do not block a fresh successful batch because older historical transcripts still have `needs_review`.

## ASR/source review rule

If captions fail and the downloaded fallback media has no audio stream, mark the video `needs_source_review`, not `needs_asr`. Do not retry Whisper forever when there is no audio track.
