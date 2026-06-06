# Next Action

Last updated: 2026-06-06

## Current next action

Fix Hermes WebUI/scheduled-worker reliability and finish automation around the GPT-5.4 polish handoff.

Active phase: Phase 6 — Hermes automation.

## Exact steps

1. Diagnose why the `Hermes WebUI` scheduled task returns `2147942402`.
2. Keep using `Hermes-Tools\codex.exe exec -m gpt-5.4` as the safe worker path until WebUI is stable.
3. Add a durable worker script for GPT-5.4 polish batches so future refreshes do not need manual command construction.
4. Decide what to do with the two old `needs_asr` videos.
5. Return to Phase 7 license/GitHub packaging after Hermes worker reliability is stable.

## Do not do yet

- Do not add new TikTok creators.
- Do not use GPT-5.5 unless audio/source verification is impossible and the item is worth escalation.
- Do not reindex Meilisearch unless QA passes and data changed.
- Do not push to GitHub until license and remote target are approved.
