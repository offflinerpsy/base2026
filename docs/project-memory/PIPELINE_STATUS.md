# Base2026 Pipeline Status

Last updated: 2026-06-10

## Product Status

Base2026 is live as a public attributed TikTok source/search product under `/knowledge/`.

Latest deployed release:

- `base2026-stage-ay25-20260610`

Runtime:

- static public app;
- Meilisearch index `base2026_public_tiktok`;
- nginx search proxy;
- WordPress main site on same domain.

## Automation Reality

Current scheduled task:

- `Base2026 Hermes TikTok Check`

Current behavior:

- check/inventory only via `scripts/hermes-tiktok-refresh.ps1 -CheckOnly -PlaylistEnd 50`;
- no automatic import;
- no automatic ASR;
- no automatic polish;
- no automatic claim extraction;
- no automatic package/deploy.

## Worker Status

| Worker | Status | Notes |
| --- | --- | --- |
| inventory/dedupe | partial | Scheduled check-only task exists. Creator inventory is now config-driven through `-CreatorsConfig`; no hardcoded creator list remains in `scripts/tiktok-backfill-inventory.ps1`. |
| metadata/caption | partial | Python metadata and staging-import scripts have controller entrypoints. yt-dlp/browser/import now share URL normalization at import. Browser active-caption extraction still needs live smoke before broad intake. |
| ASR fallback | partial | One local `faster-whisper` smoke passed. Worker now retries without VAD if VAD returns empty text. Broad ASR still blocked behind import/resume gates. |
| transcript cleanup | partial | Deterministic cleanup exists; no accepted local LLM cleanup gate yet. |
| claim extraction | working/manual | Current backlog backfill is complete. GPT/Codex source-only batches plus deterministic evidence verification/review/promotion produced local/live export with 1690 insight cards and 1226 public insight cards. Backfill queue is 0; 45 reviewed-no-card sources are tracked locally. `qwen3:8b` remains optional local draft/prefilter mode, not a trusted final writer. ChatGPT Pro/GPT-5.4 or Codex is the preferred quality lane for small-batch source-backed claim extraction/review. |
| evidence matching | partial | Standalone verifier writes verified JSONL; import bridge now loads verified candidates into SQLite as pending. Review packet/apply scripts now force ChatGPT-reviewed output back through deterministic evidence verification before import. Promotion review report now checks pending candidates before any public promotion. |
| public export | working | `export-public-tiktok.py` and policy check exist. |
| deploy | working/manual | Repeatable deploy works from MacBook through SSH alias `geo`; latest Base2026 release `base2026-stage-ay25-20260610` is live. |

## Automated Now

- scheduled check-only inventory;
- public export generation when package script is run manually;
- Meilisearch reindex during deploy script when manually invoked.

## Manual Now

- deciding whether to run ASR;
- local model setup;
- new-source claim extraction after intake;
- public card promotion for new-source batches;
- deploy approval for new releases;
- GitHub publication staging.

## Controller Status

Controller added:

- `scripts/base2026-controller.py`

Current safe commands:

- `status`
- `doctor`
- `build-backfill-queue`
- `run-claim-extract-sample`
- `verify-evidence`
- `import-claim-candidates`
- `tiktok-metadata-extract`
- `import-tiktok-staging`
- `public-boundary-audit`
- `daily-digest`
- `list-runs`

TikTok import safety:

- `import-tiktok-staging` defaults to dry-run.
- SQLite writes require explicit `--apply`.
- `tiktok-metadata-extract` is available but should not be run as broad intake until `PIPE-01.2` and staging schema checks are complete.

Inventory config status:

- `scripts/tiktok-backfill-inventory.ps1` accepts `-CreatorsConfig`.
- Default config resolution order:
  - `config/tiktok-intake-queue.local.json`
  - `config/tiktok-intake-queue.20260608.json`
  - `config/creators.example.json`
- `-ResolveCreatorsOnly` verifies config parsing without network access, CSV writes, or TikTok intake.
- `scripts/hermes-tiktok-refresh.ps1` passes `-CreatorsConfig` through to inventory when provided.

Staging schema status:

- `scripts/import-tiktok-staging-to-kb.py` normalizes `canonical_url`, `webpage_url`, and `source_url` before import.
- The importer also normalizes creator handle, creator URL, source ID, transcript text, and quality flags.
- `scripts/tiktok-ytdlp-metadata-extract.py` now emits `canonical_url`.
- `scripts/tiktok-caption-browser-extract.mjs` now emits `webpage_url` and `extractor`.
- Dry-run import over current staging selected 26 rows and skipped 42, with no SQLite writes.

Import dry-run/resume status:

- `scripts/import-tiktok-staging-to-kb.py` reports total rows, selected/skipped rows, existing/new rows, and skip reasons.
- Importer accepts `--limit`, `--source-id`, and `--report`.
- Controller `import-tiktok-staging` forwards `--limit`, `--source-id`, and `--report`.
- Current staging dry-run report: 68 rows, 26 selected, 42 skipped, 26 existing, 0 new.
- Current skipped reasons: `not_caption_ready=37`, `blocked_quality_flag=5`.
- Current file should not be applied again because all importable rows already exist in SQLite.

ASR smoke status:

- Sample: one existing local private audio file under `12_knowledge-base/sources/tiktok/transcripts/audio-fallback/`.
- Command path: `.venv/bin/python scripts/base2026-worker.py transcribe ... --model tiny.en --device cpu --compute-type int8 --vad-filter`.
- Initial VAD behavior: empty transcript.
- Worker fix: retry same file without VAD when VAD output is empty.
- Verified retry result: 6.15s audio, 1 segment, 10 words, `retry_without_vad=true`.
- Deterministic cleanup guard passed with 10 raw words and 10 clean words.

Run log path:

- `.planning/runs/YYYYMMDD-HHMMSS-microseconds/`

Daily digest path:

- `.planning/digests/base2026-digest-YYYYMMDD.md`

## Model Runtime Checkpoint

2026-06-10 MacBook result:

- `gemma4:12b` installed in Ollama.
- Homebrew formula `ollama` 0.30.7 was removed because it lacked `llama-server` and failed inference.
- `ollama-app` cask 0.30.7 is installed.
- Current working server command is `/Users/alexyarosh/.local/ollama-app-resources/ollama serve`, currently started in detached `screen` session `base2026-ollama`.
- Direct Gemma 4 JSON smoke test passed.
- Same current 3-source queue benchmark:
  - `gemma4:12b`: 1 candidate, 1 verified, 49.870 seconds/source;
  - `qwen3:8b`: 5 candidates, 5 verified, 33.972 seconds/source.
- Decision: keep `qwen3:8b` as optional local draft/prefilter mode; use ChatGPT Pro/GPT-5.4 or Codex packets as the preferred quality lane for small-batch source-backed claim extraction/review.

## Manual GPT Review Checkpoint

2026-06-10:

- `scripts/base2026-build-chatgpt-review-packet.py` builds bounded Markdown/JSON packets from public passages, with or without private pending candidates.
- `scripts/base2026-apply-chatgpt-review.py` converts strict manual ChatGPT review JSON back into private candidate JSONL.
- Controller commands added:
  - `build-chatgpt-review-packet`
  - `apply-chatgpt-review`
- `build-chatgpt-review-packet --mode extract` supports GPT-first source-only extraction.
- ChatGPT/Codex review is allowed only as a manual quality lane for small batches. It must not become scheduled browser automation and must not skip evidence verification.
- First Codex source-only packet imported 8 private/pending cards after 8/8 exact evidence verification.
- Controlled 10-source Codex source-only packet imported 20 private/pending cards after 20/20 exact evidence verification.
- Apply guardrails now enforce minimum quality score, maximum 3 new candidates per source, and claim/action/evidence length limits.
- Full-card deploy later promoted reviewed safe backfill cards. Live export now has 1226 public insight cards.

## Promotion Review Checkpoint

2026-06-10:

- `scripts/base2026-review-insight-candidates.py` added.
- Controller command added: `review-insight-candidates`.
- Generated `.planning/pending-insight-candidate-review-20260610.json`.
- Generated `.planning/pending-insight-candidate-review-20260610.md`.
- Review result over 38 pending candidates:
  - 32 `promotion_candidate`;
  - 6 `needs_human`;
  - 0 `reject_candidate`;
  - 38 exact evidence matches;
  - 0 hard failures.
- This report is read-only and does not publish or mutate SQLite.

## Current Command Center Queue

Source of truth:

- `docs/project-memory/ACTIVE_QUEUE.md`

Active workstream:

- `PIPE-01`: convert check-only/new-source process into repeatable local intake/transcription/card pipeline. Current next subtask: `PIPE-01.6`, source-backed card extraction for newly imported sources.
- `GIT-01`: classify dirty repo state before staging or commits.
- `PUB-01`: open-source publication staging, blocked behind repo hygiene and final boundary review.

## Unsafe To Automate Yet

- full TikTok refresh to production;
- public insight-card promotion;
- full ASR batches;
- paid LLM extraction;
- scheduled browser automation through ChatGPT;
- adding new creators;
- deployment from scheduled task.
