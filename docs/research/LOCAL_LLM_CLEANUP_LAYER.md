# Local LLM Cleanup Layer

Last updated: 2026-06-07

## Decision

Transcription is not an LLM task.

Base2026 transcript stack:

```text
ASR: faster-whisper / whisper.cpp
Cleanup: local LLM or deterministic punctuation layer
Guard: token-diff verifier
Publish: only guarded clean transcript
```

## Model choice

Primary local cleanup model:

```text
Gemma 4 12B
```

Reason:

- open model;
- Apache 2.0 according to Google announcement;
- designed for local laptop/workstation use;
- strong enough for paragraphing, punctuation repair, topic extraction, and quality flags.

Fallbacks:

```text
Gemma 4 E4B      -> faster, weaker cleanup
Gemma 3 12B      -> fallback if Gemma 4 runtime support is not ready
Gemma 3 27B      -> quality fallback if local GPU/RAM can handle it
```

Do not hardcode a model name in the pipeline. Use config:

```text
BASE2026_LOCAL_LLM_BASE_URL=http://127.0.0.1:11434
BASE2026_LOCAL_LLM_MODEL=gemma4:12b
BASE2026_LOCAL_LLM_PROVIDER=ollama
```

The provider can be:

- Ollama;
- LM Studio local server;
- llama.cpp server;
- vLLM.

The worker should call an OpenAI-compatible endpoint when available.

## What the local LLM may do

Allowed:

- punctuation;
- casing;
- paragraph breaks;
- title suggestion;
- topic/category extraction;
- quality flags;
- "needs review" explanation.

Forbidden:

- replacing transcript with a summary;
- changing claims;
- inventing names, dates, numbers, products, tools, or examples;
- translating silently;
- making the speaker sound smarter;
- turning rough speech into marketing copy.

## Required guard

The cleanup output is accepted only if a verifier passes:

```text
raw ASR tokens ~= clean transcript tokens
numbers unchanged
URLs unchanged
proper nouns not rewritten
no new claim-bearing sentences
```

If guard fails:

- keep raw ASR transcript;
- mark `needs_review`;
- do not publish cleaned transcript.

## Stop-slop policy

Use `stop-slop` style review for public project writing, README text, UI copy, and generated descriptions.

Do not apply it aggressively to transcripts. A transcript should preserve how the creator spoke. Removing "AI tells" is useful for our documentation, not for rewriting a speaker's words.

Public text should avoid:

- generic AI phrasing;
- filler introductions;
- fake certainty;
- corporate abstractions;
- dramatic "not X, but Y" patterns;
- over-polished summaries.

## Cleanup prompt shape

System:

```text
You clean ASR transcripts for a searchable knowledge base.
Preserve the speaker's words and meaning.
You may add punctuation, casing, and paragraph breaks.
You may remove obvious duplicated caption fragments.
Do not summarize, rewrite, invent, translate, or improve claims.
Return JSON only.
```

User payload:

```json
{
  "platform": "tiktok",
  "creator": "@example",
  "source_url": "https://...",
  "raw_transcript": "...",
  "requested_output": {
    "clean_transcript": "string",
    "topics": ["SEO"],
    "quality_flags": [],
    "needs_review": false,
    "notes": []
  }
}
```

## Daily operating rule

Default daily ingestion must work with no local LLM:

```text
ASR -> deterministic paragraphs -> JSONL
```

Local LLM is Phase B, not Phase A.

Paid LLM is manual emergency fallback only.

## Sources

- Google Gemma 4 announcement: https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/
- Google Gemma 4 12B announcement: https://blog.google/innovation-and-ai/technology/developers-tools/introducing-gemma-4-12b/
- Stop Slop: https://github.com/hardikpandya/stop-slop
