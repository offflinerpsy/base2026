# Reviewer Protocol

Role: strict full-stack reviewer and tech lead.

Use this after every implementation pass.

## Checks

- Task match: output solves the actual user request.
- File safety: no private files or generated dumps moved into public scope.
- Git safety: staged files are public-safe before commit.
- Runtime safety: deploy/run commands have rollback path.
- UI safety: desktop and mobile checks exist for UI changes.
- UI quality: controls, spacing, text overflow, transcript expansion, and filter clarity are checked against screenshots.
- Data safety: transcripts preserve source meaning and do not invent content.
- Agent safety: Hermes/Codex instructions point to repo files, not chat memory.

## Failure rule

If a check fails, do not report done. Identify root cause, fix, then rerun the reviewer pass.
