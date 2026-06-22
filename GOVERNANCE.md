# Governance

Base2026 is maintained as a public, Apache-2.0 open-source project with a strict public/private boundary.

The goal is simple: make short-form expert knowledge searchable, attributable, and useful for humans and AI systems without turning creator content into a raw transcript dump or a private-data leak.

## Maintainer

Base2026 is currently led by [Alex Yarosh](https://aggressorbulkit.online/about/).

The maintainer is responsible for:

- protecting the public/private boundary;
- reviewing which source text and insight cards can be published;
- accepting or rejecting pull requests;
- deciding release readiness;
- coordinating creator correction, removal, and attribution requests.

## How decisions are made

Base2026 is early and intentionally maintainer-led. Decisions are made in the open where possible, but the maintainer has final say on:

- whether a contribution is safe to publish;
- whether a source record has enough review to become public;
- whether a feature fits the project mission;
- whether a release can be deployed.

The project favors boring, repeatable, auditable changes over fast but risky automation.

## Public/private boundary

The most important governance rule is that public releases must not expose private or unreviewed material.

Public-safe examples:

- source code and documentation;
- public data contracts;
- reviewed public source records;
- reviewed insight cards;
- static site generation logic;
- validators, runbooks, and public-safe fixtures.

Not public-safe:

- raw captions;
- raw ASR output;
- audio or video files;
- local SQLite databases;
- cookies, tokens, API keys, SSH keys, and logs;
- private QA notes;
- generated release archives;
- unreviewed third-party transcripts.

See also:

- `docs/project-memory/PUBLICATION_BOUNDARY.md`
- `docs/GIT_PUBLICATION_AUDIT.md`
- `SECURITY.md`

## Release gates

A public release should pass the relevant local gates before deployment or GitHub publication:

```bash
python3 scripts/audit-publication-boundary.py
python3 scripts/validate-github-metadata.py
python3 scripts/check-public-export-policy.py public-data/tiktok
python3 scripts/check-public-content-readiness.py --data-root public-data/tiktok --latest 3 --fail
```

Generated public pages and release archives are deploy artifacts. They should not be committed unless there is a deliberate, reviewed reason.

## Contributions

Contributions are welcome when they improve the public-safe system layer.

Good contribution areas:

- validation and safety checks;
- static page generation;
- Meilisearch indexing and ranking;
- data contracts;
- accessibility and SEO improvements;
- public documentation;
- creator correction/removal workflow;
- adapters that respect platform terms and public/private boundaries.

Please do not submit raw creator media, scraped private data, unreviewed transcript dumps, credentials, or local database exports.

## Conflict resolution

If there is a disagreement, the default path is:

1. restate the user, creator, or maintainer risk clearly;
2. check the public boundary and security docs;
3. prefer the safer option if publication risk is unclear;
4. document the decision in an issue, pull request, or project-memory note when it affects future releases.

## Project status

Base2026 is an early but working public prototype. The public demo, API/AI entry points, source pages, topic pages, creator pages, and validation scripts exist today, but community governance may evolve if more maintainers and contributors join.
