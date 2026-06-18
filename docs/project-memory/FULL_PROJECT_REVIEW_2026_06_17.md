# Full Project Review - 2026-06-17

## Scope

Review requested after the Source Intelligence gap on these live workspace URLs:

- `https://aggressorbulkit.online/knowledge/?topic=on-page-seo&q=On-Page+SEO&source=tiktok-video-7621472877765823766`
- `https://aggressorbulkit.online/knowledge/?topic=on-page-seo&q=On-Page+SEO&source=tiktok-video-7631848100860103958`

Scope covered:

- Base2026 public source-detail runtime and generated source pages;
- public export data contract;
- publication-boundary gates;
- package/deploy risk review;
- WordPress/Base2026 launch architecture risk review.

No commit, push, deploy, reindex, or intake automation was performed in this pass.

## Source Intelligence finding

Root cause:

- both reported `@webhivedigital` sources have public source text and pending local insight rows;
- neither source has reviewed/public Source Intelligence cards in the current public export;
- the runtime and static source page renderer hid the whole `Source Intelligence` section when the reviewed-card list was empty.

This was not a creator-wide failure. `@webhivedigital` has reviewed public Source Intelligence cards on other records.

The six linked cards for these two sources are pending/private legacy rows. They should not be flipped public as a quick fix because the on-page SEO claims depend partly on page/video visual context and need the existing evidence-gated review lane.

## Local fix

Changed files:

- `web/static/meili.js`
- `scripts/generate-public-pages.py`
- `scripts/mobile-visual-qa.mjs`
- project-memory docs

Behavior after the fix:

- every selected source record renders a `Source Intelligence` section;
- sources with reviewed/public cards render cards;
- sources with no reviewed/public cards render an honest empty state explaining that unreviewed candidates are withheld from the public UI.

## Verification

Passed:

- `node --check web/static/meili.js`
- `node --check scripts/mobile-visual-qa.mjs`
- `python3 -m py_compile scripts/generate-public-pages.py`
- temporary static generation to `/tmp/base2026-source-intel-review`
- generated-page contract checks for:
  - `tiktok-video-7621472877765823766` empty state;
  - `tiktok-video-7631848100860103958` empty state;
  - `tiktok-video-7651937569034341640` reviewed-card control;
- intercepted-live Playwright runtime check with live HTML/JSONL and local `meili.js` on mobile and desktop:
  - both reported URLs show `Source Text` + `Source Intelligence` empty state;
  - reviewed-card control source still shows a card;
  - no horizontal overflow;
  - no console errors;
  - no `Source record unavailable`;
- `python3 scripts/check-public-export-policy.py public-data/tiktok`
- `python3 scripts/check-public-content-readiness.py --data-root public-data/tiktok --latest 1 --fail`
- `python3 scripts/validate-public-release-contract.py --export-dir public-data/tiktok`
- `python3 scripts/validate-github-metadata.py`
- `python3 scripts/kb-audit.py`
- `python3 scripts/audit-publication-boundary.py`
- `git diff --check`

Known non-blocking result:

- `python3 scripts/check-public-content-readiness.py --data-root public-data/tiktok --fail` fails for the full historical export because 540 source-only records still lack topics/public insights. Current package scripts only enforce `--latest 1`, which passes. The historical backlog remains product/content debt, not a blocker for this UI empty-state hotfix.

## Audit findings

P1 issues to fix before treating the project as stable release infrastructure:

1. Deploy order is not atomic enough: a static release can become live before Meilisearch is reindexed and verified.
2. Packaging mutates tracked `web/static/**`, which makes review noisy and increases the chance of committing generated churn.
3. Source-detail rendering logic is duplicated between runtime JS and Python generation; the new regression test helps, but a shared contract/golden fixture is still needed.
4. WordPress forms need a stronger server-side contract: nonce, validation, delivery logging, and failure visibility.
5. Publication audit still treats very large generated static churn too broadly as public-safe; GitHub staging should use a narrow allowlist and avoid committing generated release output by default.

P2 issues:

- static HTML can expose a Meilisearch key if a release is packaged with `-MeiliKey`;
- cache-bust constants are still manual;
- fallback stats and generated snapshots can become stale;
- the separate `geo` WordPress repo contains operational material and must be scrubbed before any public publication.

## Next safe action

Package and deploy this as a data-preserving Base2026 UI hotfix only if the operator asks for deployment. Do not promote the six pending `@webhivedigital` cards without visual/evidence review.

