# OpenClaw Task: TikTok Transcript Polish Layer

Use when the user asks to improve raw TikTok captions/transcripts without translation.

## Goal

Create faithful, readable English transcripts from raw TikTok caption text.

This is not translation. This is not summarization. This is not rewriting.
Primary principle: verbatim-first. The output must stay a cleaned transcript of
what the speaker said, not an interpretation of what they meant.

## Inputs

Raw clean captions:

`12_knowledge-base/sources/tiktok/transcripts/clean/*.txt`

## Outputs

Polished transcripts:

`12_knowledge-base/sources/tiktok/transcripts/polished/<video_id>.txt`

QA metadata:

`12_knowledge-base/sources/tiktok/transcripts/polished-qa/<video_id>.json`

## Command

Dry run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\tiktok-polish-runner.ps1 -Limit 10 -DryRun
```

Process batch:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\tiktok-polish-runner.ps1 -Limit 50
```

Create batches only:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\tiktok-create-polish-batches.ps1 -BatchSize 10
```

## Rules

- Keep original English.
- Do not translate to Russian or any other language.
- Do not summarize.
- Do not add facts.
- Do not replace words with synonyms.
- Do not paraphrase.
- Do not fill missing words, clipped endings, or unclear phrases from context.
- Do not add timestamps or speaker labels.
- Fix punctuation, capitalization, caption spacing, and paragraph breaks only.
- Preserve wording as much as possible.
- Preserve spoken style when it carries meaning.
- Normalize obvious casing only: `seo` -> `SEO`, `ai` -> `AI`,
  `chatgpt` -> `ChatGPT`.
- Do not guess brand/entity names from unclear captions.
- If unsure, keep the raw word.
- If a phrase looks wrong but cannot be proven from the caption, keep it and
  mark the QA file as `needs_review`.

## Validation

Each file gets QA metadata with:

- raw hash
- polished hash
- raw/polished word count
- preservation score
- status: `pass` or `needs_review`
- notes: every uncertain raw word, clipped phrase, or likely ASR error

`pass` means no new meaning was added and no uncertain wording remains.
`needs_review` means the transcript is faithful but needs audio verification.

After any successful run:

```powershell
python .\scripts\build-kb-sqlite.py
python .\scripts\kb-audit.py
```
