# Hermes Local Operator Guide

Last updated: 2026-06-07

## Role

Hermes is a private local operator for Base2026. It is not a production dependency and not required for GitHub users.

Hermes may orchestrate local scripts, but the scripts must remain usable without Hermes.

## Required reading before work

Hermes must read:

- `AGENTS.md`
- `docs/project-memory/PROJECT_STATE.md`
- `docs/project-memory/ACTIVE_PHASE.md`
- `docs/project-memory/NEXT_ACTION.md`
- `docs/project-memory/DECISIONS.md`
- `docs/research/TRANSCRIPTION_PIPELINE_OPTIONS.md`
- `docs/research/LOCAL_WORKER_AUTOMATION_ARCHITECTURE.md`
- `docs/research/LOCAL_LLM_CLEANUP_LAYER.md`
- `docs/research/CREATOR_ADMIN_FLOW.md`

## Default model policy

Daily pipeline:

- no paid LLM;
- no Codex tokens;
- no GPT-5.5;
- no cloud LLM by default.

Owner-approved launch-quality exception:

- small insight-card extraction/review batches may use GPT-5.4 high/Codex through generated packets;
- outputs must be strict JSON saved under `.planning/`;
- local scripts must apply the JSON, verify evidence again, and import only private/pending candidates;
- this is not a scheduled browser worker and not required for GitHub users.

Transcription:

- `faster-whisper` primary;
- `whisper.cpp` fallback.

Cleanup:

- deterministic cleanup first;
- optional local LLM through configured local endpoint;
- primary local model target: `Gemma 4 12B`;
- fallback: Gemma 4 E4B, Gemma 3 12B, or another local model selected by config.

## Local LLM config

Hermes should look for:

```text
BASE2026_LOCAL_LLM_BASE_URL
BASE2026_LOCAL_LLM_MODEL
BASE2026_LOCAL_LLM_PROVIDER
```

Example:

```text
BASE2026_LOCAL_LLM_BASE_URL=http://127.0.0.1:11434
BASE2026_LOCAL_LLM_MODEL=gemma4:12b
BASE2026_LOCAL_LLM_PROVIDER=ollama
```

If no local LLM is available, Hermes must continue with ASR-only deterministic cleanup.

## Adding a creator

If the user says:

```text
Add this TikTok creator: https://www.tiktok.com/@example
```

Hermes should:

1. Update the local creator registry when available.
2. Run dry-run discovery only.
3. Report:
   - platform;
   - handle;
   - URL;
   - discovered post count;
   - new candidate IDs;
   - failures.
4. Ask for or wait for approval before ingest/publish.

Hermes must not:

- deploy automatically;
- publish raw transcripts;
- use paid LLM;
- commit private/generated files;
- upload cookies/session data;
- treat post captions as speech transcripts.

## Transcript cleanup rule

Hermes must preserve speaker words.

Allowed:

- punctuation;
- casing;
- paragraph breaks;
- obvious duplicate caption fragments.

Forbidden:

- summaries;
- invented claims;
- rewritten arguments;
- silent translation;
- SEO-style copywriting.

If cleanup guard fails, mark `needs_review`.

## Open-source wording

When preparing public docs, use direct language. Avoid AI slop:

- no generic hype;
- no filler introductions;
- no fake certainty;
- no "magic" claims;
- no vague business jargon.

For public GitHub, be honest:

```text
Base2026 currently uses a local-worker ingestion design.
TikTok/Instagram extraction is intentionally modular because platform access changes often.
Community contributions for extractors, ASR benchmarks, and ingestion adapters are welcome.
```
