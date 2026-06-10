# Base2026 Model Routing

Last updated: 2026-06-10

## Rule

Use the cheapest deterministic route that can complete the job safely. Do not spend LLM tokens on work that scripts can do.

## No-LLM Tasks

Use deterministic scripts for:

- inventory and dedupe;
- metadata and caption extraction orchestration;
- DB queries;
- queue building;
- transcript leak checks;
- public/private policy audit;
- source, passage, card, topic counts;
- evidence substring matching;
- JSONL validation;
- sitemap/page generation;
- package creation;
- deploy scripts;
- smoke tests;
- memory skeleton updates.

## Local ASR

Use local ASR only when captions are missing, truncated, incomplete, or unreliable.

Preferred route:

- `faster-whisper` if installed and supported by existing scripts;
- `small.en` for smoke tests;
- `medium.en` for normal English TikTok ASR on CPU/low VRAM;
- `large-v3-turbo` only if local GPU/VRAM and quality justify it.

Before ASR:

- check `scripts/base2026-worker.py`;
- check `faster_whisper` import;
- check `ffmpeg`;
- run a tiny smoke test only;
- do not run full ASR batches without owner approval.

## Local LLM

Use local LLM only for:

- faithful transcript cleanup when deterministic cleanup is insufficient;
- first-pass claim extraction into strict JSON;
- failure classification for candidate sources.

Candidate routing:

- cleanup: Gemma-class 12B if configured and available;
- structured extraction draft mode: `qwen3:8b` when a cheap local first pass is useful;
- structured extraction reviewer candidate: `gemma4:12b` for semantic/precision review of Qwen candidates, not as the primary extractor yet;
- small 4B models only for triage, not final public cards.

Detect endpoints before use:

- Ollama;
- vLLM OpenAI-compatible endpoint;
- LM Studio / local OpenAI-compatible endpoint.

Do not download models automatically.

## 2026-06-10 MacBook Local Benchmark

Runtime:

- `gemma4:12b` is installed in Ollama.
- Homebrew formula `ollama` 0.30.7 was removed because its bottle lacked `llama-server` and could not run inference.
- `ollama-app` cask 0.30.7 is installed.
- Current working runtime command is `/Users/alexyarosh/.local/ollama-app-resources/ollama serve`, started in detached `screen` session `base2026-ollama`; this uses a user-space copy of the cask resources without `com.apple.quarantine`.

Backfill sample over the same current first 3 queue rows in `.planning/backfill-insight-cards-20260610.jsonl`:

| Model | Candidates | Verified | Avg seconds/source | Notes |
| --- | ---: | ---: | ---: | --- |
| `gemma4:12b` | 1 | 1 | 49.870 | Valid JSON, no errors, high precision but too low yield for primary extraction. |
| `qwen3:8b` | 5 | 5 | 33.972 | Higher verified yield; keep as primary extractor pending semantic-review gate. |

Routing result:

- Do not promote `gemma4:12b` to primary claim extractor based on this sample.
- Use `qwen3:8b` only as an optional local draft/candidate generator.
- Test `gemma4:12b` as a semantic reviewer/precision pass before broad private import.
- For small high-value batches, use ChatGPT Pro/GPT-5.4 or Codex manually through generated packets as the primary semantic/copy quality lane before private import.

## ChatGPT Pro / Codex Quality Lane

Use ChatGPT Pro/GPT-5.4 or Codex for:

- direct claim extraction from public passages when volume is small and quality matters most;
- semantic entailment review of local-model candidates;
- concise card copy rewrites;
- rejection of generic or unsupported local-model output;
- small representative batches where quality matters more than throughput.

Do not use browser ChatGPT as:

- a scheduled production worker;
- a limit-bypass architecture;
- a replacement for deterministic evidence verification;
- a place to paste raw private transcripts, DB files, logs, media, cookies, tokens, or credentials.

Supported route A, GPT-first:

1. ASR/caption pipeline creates public search passages;
2. `scripts/base2026-build-chatgpt-review-packet.py --mode extract` creates a bounded source-only packet;
3. ChatGPT Pro/GPT-5.4 or Codex returns strict JSON `new_candidate` decisions with exact evidence excerpts;
4. `scripts/base2026-apply-chatgpt-review.py` converts decisions back to private candidates;
5. deterministic evidence verification runs;
6. only verified candidates may be imported as private/pending.

Supported route B, local draft plus GPT review:

1. local model generates private candidates;
2. deterministic verifier checks evidence excerpt presence;
3. `scripts/base2026-build-chatgpt-review-packet.py` creates a bounded packet from public passages and private/pending candidates;
4. owner/Codex runs manual ChatGPT Pro/Codex review and saves strict JSON;
5. `scripts/base2026-apply-chatgpt-review.py` converts approved/rewrite/new_candidate decisions back to private candidates;
6. deterministic evidence verification runs again;
7. only verified reviewed candidates may be imported as private/pending.

## GPT-5.4 Mini

Use only for:

- small code-review summaries;
- status digests;
- explaining report output;
- non-critical markdown cleanup.

Do not use for production extraction without owner approval.

## GPT-5.4

Use only for:

- failed small batches;
- QA escalation;
- difficult transcript cleanup;
- difficult claim extraction examples;
- reviewing 20-30 representative samples.

## GPT-5.5 High

Use only for:

- architecture decisions;
- complex script design/refactor;
- safety-critical code review;
- resolving conflicting project memory;
- model-routing/control-flow design;
- final reviewer pass.

Forbidden GPT-5.5 uses:

- batch transcript cleanup;
- bulk claim extraction;
- generating insight cards over the 170-source backlog;
- UI polish;
- repetitive schema conversion;
- routine markdown reports.

## Batch Extraction Rule

If a task would require many LLM calls, stop and build a local/deterministic pipeline. Batch outputs must remain private/pending until evidence verification and manual promotion gates pass.

## Paid API Escalation Rule

Paid API use is disabled by default. Any paid path must require an explicit `--allow-paid-api` flag and owner approval.
