# GPT Pro / Codex Quality Runbook

Last updated: 2026-06-10

## Purpose

Use ChatGPT Pro/GPT-5.5 Medium or Codex as a manual high-quality claim extraction and review lane for small Base2026 insight-card batches.

This is not the production ingestion worker and not a browser-automation dependency. The durable pipeline remains local-first and scriptable.

## Allowed Role

ChatGPT Pro/GPT-5.5 Medium or Codex may be used to:

- extract new source-backed insight-card candidates directly from public passages;
- reject candidate claims that only match evidence text mechanically but do not preserve the source meaning;
- rewrite awkward local-model claims into concise, useful card copy;
- approve clean candidates;
- add at most one clearly supported missed claim per reviewed source.

## Forbidden Role

Do not use ChatGPT/browser review or Codex review to:

- scrape or automate the ChatGPT UI as a scheduled worker;
- bypass paid API controls as a production architecture;
- paste raw private captions, full private transcripts, local SQLite files, logs, cookies, tokens, credentials, media, audio, or video;
- publish reviewed output directly;
- skip deterministic evidence verification.

## Build Source-Only Extraction Packet

Use this when quality matters more than local-model throughput and no Qwen draft is needed:

```bash
.venv/bin/python scripts/base2026-controller.py build-chatgpt-review-packet \
  --queue .planning/backfill-insight-cards-20260610.jsonl \
  --mode extract \
  --limit 3 \
  --out-md .planning/chatgpt-extract-packet-20260610.md \
  --out-json .planning/chatgpt-extract-packet-20260610.json
```

The response should use `decision = new_candidate` with candidate ids like:

```text
new:<source_id>:1
new:<source_id>:2
new:<source_id>:3
```

## Build Review Packet

Use this when Qwen or another local model already produced candidates that need semantic/copy review:

```bash
.venv/bin/python scripts/base2026-controller.py build-chatgpt-review-packet \
  --queue .planning/backfill-insight-cards-20260610.jsonl \
  --candidates .planning/claim-candidates-20260610-current-qwen3-8b.verified.jsonl \
  --limit 3 \
  --out-md .planning/chatgpt-review-packet-20260610-current-qwen3-8b.md \
  --out-json .planning/chatgpt-review-packet-20260610-current-qwen3-8b.json
```

The packet contains:

- public search passages from `public-data/tiktok/passages.jsonl`;
- private/pending local-model candidates from `.planning`;
- a strict JSON response schema;
- explicit public/private boundary instructions.

## Manual Browser Step

Open ChatGPT Pro manually, or use Codex in the current project context, and process the Markdown packet.

Required reviewer behavior:

- use only supplied passages and candidates;
- return strict JSON only;
- reject semantic mismatches even when an evidence excerpt exists verbatim;
- keep rewritten claims short, faithful, and useful;
- do not add outside facts.

Save the returned JSON under `.planning/`, for example:

```text
.planning/chatgpt-review-response-20260610-current-qwen3-8b.json
```

## Apply Review Locally

Convert the manual response back into private claim candidates:

```bash
.venv/bin/python scripts/base2026-controller.py apply-chatgpt-review \
  --packet .planning/chatgpt-review-packet-20260610-current-qwen3-8b.json \
  --review .planning/chatgpt-review-response-20260610-current-qwen3-8b.json \
  --out .planning/claim-candidates-20260610-chatgpt-reviewed.jsonl
```

Then run deterministic evidence verification:

```bash
.venv/bin/python scripts/base2026-controller.py verify-evidence \
  --input .planning/claim-candidates-20260610-chatgpt-reviewed.jsonl \
  --output .planning/claim-candidates-20260610-chatgpt-reviewed.verified.jsonl
```

Only after that, dry-run import:

```bash
.venv/bin/python scripts/base2026-controller.py import-claim-candidates \
  --input .planning/claim-candidates-20260610-chatgpt-reviewed.verified.jsonl
```

Apply import only after reviewing the dry-run stats:

```bash
.venv/bin/python scripts/base2026-controller.py import-claim-candidates \
  --input .planning/claim-candidates-20260610-chatgpt-reviewed.verified.jsonl \
  --apply
```

## Promotion Gate

Reviewed imports remain private/pending:

- `public = false`
- `needs_review = true`
- `claims.review_status = pending`
- `claim_type = insight_card_candidate`

Public promotion is a separate future command/report and must not happen in this review step.
