# Base2026 Agent Workflow

Last updated: 2026-06-17

This file is the project-level operating model for Codex, workers, and reviewers.
Chat memory is not the source of truth. Repo files and project-memory are.

## Purpose

Base2026 and the main WordPress site are now operated as two connected products:

- `base2026`: public source-intelligence product under `/knowledge/`;
- `geo`: Alex Yarosh main WordPress business site.

The command-center workflow exists so user corrections, SEO tasks, UI fixes,
pipeline work, and growth work do not disappear between long Codex sessions.

## Command Center

The main Codex thread is the command center and integrator.

Responsibilities:

- read the current project-memory before meaningful work;
- capture new tasks in `ACTIVE_QUEUE.md`;
- delegate bounded work to workers when parallelism helps;
- assign each worker a clear owner scope and allowed files;
- review worker output before accepting, deploying, committing, or pushing;
- run boundary checks before any publication/staging;
- update `NEXT_ACTION.md`, `PROMPT_LOG.md`, and task-specific docs.

Command center never treats worker output as done by default.
Done means reviewed, integrated, verified, and recorded.

## Worker Roles

### SEO Crawl Gate

Purpose: local Ahrefs-like crawl and technical SEO validation when Ahrefs quota is unavailable.

Typical scope:

- crawl live WordPress and `/knowledge/` routes;
- detect 4xx/5xx, redirect chains, wrong root-level Base2026 links, canonical/noindex mistakes;
- summarize sitemap coverage, title/meta/H1 coverage, and critical internal-link issues;
- write ignored evidence under `output/seo-crawl-gate/`;
- update tracked report docs only when useful.

Workers in this role must not deploy, commit, push, submit GSC indexing, or run intake.

### Base2026 Intelligence

Purpose: use the public Base2026 dataset as a marketing and product-intelligence source.

Allowed data:

- `public-data/tiktok`;
- generated public HTML/JSONL artifacts;
- public-safe docs.

Forbidden data:

- raw captions/full transcripts outside public export;
- local SQLite files as publishable artifacts;
- media/audio/video;
- private research vaults.

Outputs:

- content pillars;
- buyer-stage map;
- WordPress/Base2026 content and internal-link plan;
- AI-search/LLM citability plan;
- public-safe programmatic SEO opportunities;
- P0/P1/P2 execution list.

### Frontend/UI Worker

Purpose: WordPress/Base2026 visual and interaction fixes.

Rules:

- use existing design tokens and visual contract;
- check desktop and mobile with Playwright or browser screenshots;
- keep source/detail/header/footer contracts unified across WordPress and Base2026;
- do not patch only one rendering path when generator and runtime both exist.

### Backend/Pipeline Worker

Purpose: TikTok/source intake, export, Meilisearch, and release tooling.

Rules:

- dry-run before apply;
- keep raw source data private;
- never promote public cards without evidence-gated review;
- keep public export deterministic and reproducible.

### Reviewer/Auditor

Purpose: adversarial review before acceptance.

Checks:

- user request match;
- public/private leakage risk;
- generated route/link/canonical consistency;
- responsive and interaction regressions;
- next action is concrete.

## Delegation Rules

Spawn workers only for bounded tasks that materially advance the project.
Every worker prompt must include:

- current repo path;
- exact task;
- allowed write scope;
- forbidden actions;
- expected output files;
- required verification;
- final reporting format.

Workers are not alone in the codebase. They must not revert unrelated changes
and must adapt to existing dirty work.

Parallel work is allowed when write scopes are disjoint. Do not run multiple
workers against the same unresolved file set without an explicit integration plan.

## Current Active Workers

- `Russell` (`019ed784-fad5-7863-a700-25ff28b62989`): live SEO crawl gate and Ahrefs-quota replacement.
- `Faraday` (`019ed786-1c7b-71d1-a730-ec53c3772a7c`): Base2026 public-dataset intelligence and growth plan.

## Memory Contract

The durable task system is:

- `ACTIVE_QUEUE.md`: live work queue and ownership;
- `NEXT_ACTION.md`: immediate next safe action;
- `PROMPT_LOG.md`: short operator log;
- task-specific docs: research, audit, crawl, growth, or deploy reports.

If a user gives a correction in chat, capture it in the queue before it is
delegated or marked done.

## Publication Boundary

No worker may publish or commit private research, raw source vaults, credentials,
logs, generated release archives, local database files, media/audio/video files,
cookies, tokens, or unreviewed raw captions.

Before staging or public release, run the project boundary gates named in
`PUBLICATION_BOUNDARY.md` and `GIT_PUBLICATION_AUDIT.md`.

