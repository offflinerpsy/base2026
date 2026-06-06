# OpenClaw TikTok KB Intake

Use OpenClaw skill:

`tiktok-kb-intake`

Skill location:

`<openclaw-skills-dir>\tiktok-kb-intake\SKILL.md`

## Trigger

Use when the user sends TikTok creator handles or video URLs and asks to add them to the SEO/GEO/AEO base.

## Canonical Target

`12_knowledge-base\sources\tiktok\`

Do not use:

`11_dreamwood_offer\`

## Workflow

```text
TikTok URL/creator -> video list -> captions/transcript -> clean transcript -> extracted claims -> review queue -> later promotion
```

## Rules

- Full discoverable creator inventory by default; use at least `--playlist-end 1000`.
- Latest 5 videos only when user explicitly asks for pilot/sample/test.
- Captions first via `yt-dlp`.
- Mark caption failures as `needs_asr`, then run audio + `whisper` ASR fallback in batches.
- Claims stay `pending` until human review.
- Markdown evidence is canonical.
- SQLite/FTS/vector indexes are derived and rebuildable.

## Batch Scripts

Inventory:

`scripts\tiktok-backfill-inventory.ps1`

Transcript processing:

`scripts\tiktok-process-transcripts.ps1`

## Current Pilot

Creators:

- `@webhivedigital`
- `@tjrobertson52`
- `@build_in_public`

Pilot status:

- 15 videos collected.
- 13 caption transcripts.
- 2 ASR transcripts.
- 25 draft claims.
