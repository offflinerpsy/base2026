# Mobile Visual QA Runbook

Last updated: 2026-06-10

## Purpose

Keep the mixed WordPress + Base2026 public site responsive, readable, and reviewable before and after UI deploys.

The live public surface has two parts:

- WordPress root site at `https://aggressorbulkit.online/`
- Base2026 static/search app under `https://aggressorbulkit.online/knowledge/`

## Source files

- WordPress theme source: `/Users/alexyarosh/Projects/base2026-migration/geo/wp-theme/alex-yarosh/`
- Base2026 public UI source: `web/static/`
- QA runner: `scripts/mobile-visual-qa.mjs`
- Evidence output: `output/evidence/mobile-visual-qa-*`

`output/` is intentionally ignored and must not be committed unless the owner explicitly requests a curated evidence artifact.

## Required command

Run the live mobile QA matrix with:

```bash
node scripts/mobile-visual-qa.mjs --base-url https://aggressorbulkit.online --viewports full
```

Fast mobile-only pass:

```bash
node scripts/mobile-visual-qa.mjs --base-url https://aggressorbulkit.online --viewports mobile
```

Route-scoped pass:

```bash
node scripts/mobile-visual-qa.mjs --base-url https://aggressorbulkit.online --viewports mobile --only wordpress
node scripts/mobile-visual-qa.mjs --base-url https://aggressorbulkit.online --viewports mobile --only base2026
```

Prerequisite: Playwright must be importable by Node. On the MacBook runner it is available globally at `/opt/homebrew/lib/node_modules/playwright`. If needed, either install it globally with `npm install -g playwright` or set `PLAYWRIGHT_MODULE_PATH` to the absolute package directory.

## Matrix

Default routes:

- `/`
- `/services/`
- `/pricing/`
- `/ai-visibility-audit/`
- `/about/`
- `/contact/`
- `/knowledge/`
- `/knowledge/?q=AI%20Overviews`
- `/knowledge/roadmap.html`
- `/knowledge/support.html`
- `/knowledge/sources/tiktok-video-7647909694559767840.html`

Default viewport set:

- `320x568`
- `360x740`
- `390x844`
- `414x896`
- `768x1024`
- `1440x1000`

## Checks

The runner fails on:

- HTTP status missing or `>=400`
- missing or duplicate visible H1
- horizontal page overflow
- clipped control or heading text
- relevant browser console errors
- page runtime errors
- missing Base2026 search hits where expected
- missing form controls where expected
- Base2026 source dialog failure or dialog horizontal overflow

The runner warns on small tap targets. Warnings must be reviewed manually because some checkbox/input patterns have a larger label as the effective target.

## Deployment gate

For public UI work, use this gate:

1. Run `git status --short --branch` in `base2026` and `geo`.
2. Identify whether the change belongs to WordPress theme source, Base2026 static source, or both.
3. Run the QA runner before changes when the defect is unclear.
4. Make the smallest targeted source edit.
5. Deploy only the changed public surface.
6. Clear caches when WordPress CSS changes.
7. Re-run the QA runner against the live URL.
8. Update `NEXT_ACTION.md` and `PROMPT_LOG.md`.

## Boundary

Do not commit or publish:

- private research folders
- raw captions or transcripts
- local databases
- screenshots or reports under `output/`
- release zips
- credentials or keys

Use `docs/project-memory/PUBLICATION_BOUNDARY.md` and `docs/GIT_PUBLICATION_AUDIT.md` before staging.
