# License Decision Notes

Date: 2026-06-08

## Current Status

Apache License 2.0 has been selected and applied.

`LICENSE` exists and `README.md` records `License: Apache-2.0`.

## Practical Recommendation

Recommended default: Apache License 2.0.

Why:

- permissive and friendly for adoption;
- includes an explicit patent grant;
- common for infrastructure, data tooling, AI tooling, and developer platforms;
- fits a project that may later receive outside contributions.

Alternative: MIT License.

Why choose MIT:

- very short;
- familiar to most developers;
- simple for small tools and prototypes.

Tradeoff:

- MIT is simpler, but Apache 2.0 gives stronger patent-language protection.

## Data and Content Note

The code license should cover repository code and documentation.

Do not imply that the license grants rights to third-party creator videos, platform captions, or source content. Public demo data is a generated deploy artifact and remains governed by the project's public content policy, attribution, methodology, and correction/opt-out process.

## Completed Maintainer Decision

Selected:

- `Apache-2.0`

Completed:

1. Ran `scripts/apply-license.ps1 -License Apache-2.0`.
2. Confirmed `LICENSE` exists and `README.md` license line changed.
3. Reran publication boundary audit and preflight with only remote check skipped.
4. Stage only public-safe files from `docs/PUBLICATION_STAGING_PLAN.md` after final review.

Example:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\apply-license.ps1 -License Apache-2.0
```
