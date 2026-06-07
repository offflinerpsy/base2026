# Decisions

## 2026-06-06 — Use file-based project memory

Decision: use `docs/project-memory/` as the operational source of truth for Base2026 planning, status, handoffs, public/private boundaries, deploy notes, and Hermes automation notes.

Reason: long Codex chats are disposable and can compact. Repo files remain inspectable by Codex, Hermes, maintainers, and future contributors.

## 2026-06-06 — Keep public TikTok product separate from private research base

Decision: publish only the public TikTok knowledge product and safe project code/docs. Keep private SEO/GEO/AEO research folders local unless explicitly reviewed and exported.

Reason: the project is moving toward open source and public deployment.

## 2026-06-06 — Use status board as operational planning board

Decision: use `STATUS_BOARD.csv` and `PHASES.md` as the planning board for Base2026 work.

Reason: CSV is easy for agents to update and easy for humans to inspect.

## 2026-06-06 — Separate ASR backlog from source-review backlog

Decision: use `needs_source_review` when captions fail and fallback media has no audio stream. Do not keep those videos in `needs_asr`.

Reason: ASR cannot succeed without an audio track. Retrying Whisper wastes time and creates false queued jobs.

## 2026-06-06 — Gate public UI through visual-system review

Decision: before broader public/GitHub exposure, run a dedicated visual-system pass for controls, spacing, filters, result cards, transcript expansion, desktop/mobile screenshots, and strict reviewer checks.

Reason: the UI works technically, but the current visual quality is not good enough to show as the public face of the product.
