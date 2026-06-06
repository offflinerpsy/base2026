# Handoff Template

Use this at the end of every meaningful Base2026 task.

## Before starting

- read `AGENTS.md`
- read `PROJECT_STATE.md`
- read `ACTIVE_PHASE.md`
- read `NEXT_ACTION.md`
- read `DECISIONS.md`
- read `DATA_SOURCES.md`
- read `STATUS_BOARD.csv`
- read `PHASES.md`
- read `PUBLICATION_BOUNDARY.md`
- check `git status --short --branch`
- confirm exact active phase
- confirm what not to do

## After finishing

- update `NEXT_ACTION.md`
- update `PROMPT_LOG.md`
- update `STATUS_BOARD.csv` if phase state changed
- update `DATA_SOURCES.md` if source status changed
- update `DECISIONS.md` only if a real durable decision was made
- list files created/changed
- list commands/verifications run
- suggest git commit message
- do not commit without approval

## Required reviewer pass

- Does output match the task?
- Are public/private boundaries preserved?
- Are docs internally linked and consistent?
- Is next action concrete?
- Are generated artifacts and secrets unstaged?
