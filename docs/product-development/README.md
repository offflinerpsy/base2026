# Base2026 Product Development

Development checkpoint: 2026-10-03 (UTC).
Audience: potential investors, contributors and product partners.

## Product thesis

Base2026 starts with a free, open-source evidence library: selected practitioner
videos become attributed, searchable passages connected to their original
sources. The next product hypothesis is an SEO content and automation service
that helps a small SEO practice or website operator turn a concrete question
into a useful, source-backed content plan, draft and reviewable export.

The commercial layer should reuse the evidence and editorial infrastructure.
It should preserve existing public URLs, source rights, search interfaces and
free tools while adding a bounded service workflow. Revenue, repeat use,
willingness to pay and delivery economics still need external evidence.
Published content, corpus size and internal quality checks are separate from
commercial traction.

## How to read progress

- **Proposed:** a product or architecture hypothesis, with a reason to test it.
- **Designed:** a documented decision or candidate awaiting acceptance.
- **Implemented:** code or a workflow artifact exists; deployment is separate.
- **Verified:** a named check passed against a specific version and date.
- **Deployed:** an exact release has a deployment receipt and live readback.
- **Accepted:** the relevant owner/review gate approved the defined outcome.

A state applies only to the work and scope named beside it. An architecture
document, an offline contract probe or an internal pilot does not establish
customer readiness, a production release or paid demand.

## Existing foundation

The repository's latest main commit inspected for this checkpoint is
[`e948111f`](https://github.com/offflinerpsy/base2026/commit/e948111f747d0347c3c880c67efd4c5cecf06dd4),
dated 2026-09-06. Its
[product-experience receipt](../project-memory/HANDOFF_2026-09-06_PRODUCT_EXPERIENCE.md)
records the deployed public site, investor explanation, navigation and authored
factory scenario. This October checkpoint does not refresh live cloud state.

| Work | What and why | Evidence state |
| --- | --- | --- |
| Evidence Search and public API/MCP | Find attributed practitioner material without an LLM call for every visitor query | Implemented; deployment and checks recorded in the dated repository release history |
| Source Diversity Check and Source-backed Brief | Inspect evidence coverage and turn research into a usable brief | Implemented; existing release receipts retained |
| Page Source Check | Inspect supplied HTML within a bounded input contract | Implemented; arbitrary-URL auditing is a separate proposed scope |
| WordPress Evidence Sidebar | Bring source-linked research into Gutenberg through a free manual-install beta | Implemented and released beta; directory acceptance and independent user installation remain separate outcomes |
| Editorial articles and maintained guides | Turn reviewed evidence into original explanations and decision tools | Implemented publisher with dated publication/replay receipts; new editorial batches require their own acceptance |
| Cloudflare evidence pipeline | Keep acquisition and processing private; project only eligible attributed excerpt cards into public search | Existing architecture and dated deployments documented in the [canonical manual](../BASE2026_CLOUDFLARE_PIPELINE_CANONICAL_OPERATING_MANUAL.md); account/runtime parity must be rechecked before a change |

The public checkout omits protected control-plane implementation and generated
release data. It is a public software/documentation surface, not a complete
backup or a fresh deployment baseline.

## Current development: SEO content service

Tracking: the existing private architecture work item.

**What:** design an additive service around the existing Base2026 product,
including product scope, reuse, tenant boundaries, content rights, jobs,
billing design, economics, migration and rollback.

**Why:** test whether the evidence library can support a repeatable professional
workflow with useful outcomes and sustainable delivery effort.

**How:** compare three product steps before choosing the first build:

1. Concierge delivery with assisted exports and manual commercial operations.
2. A lean automated slice: website inputs → plan → brief → draft → human review
   → export, initially bounded to one tenant.
3. A fuller SaaS workflow, adding customer workbench, CMS adapters, integrated
   billing and stronger operational recovery after the lean slice earns it.

The lean slice is a review requirement and candidate product scope. It has not
been reported here as implemented or deployed. Internal use on owner-controlled
sites should measure editorial quality, time saved, provenance and recovery.
That dogfood evidence is distinct from external paid demand.

**Progress:** an initial architecture package and independent review exist.
The 2026-10-03 review requested three material revisions: comparable lean
automation, deeper Cloudflare capability fit, and a concrete Azure role with
GCP evaluated by relevant jobs. A subsequent revision is reported prepared but
its exact export and independent acceptance remain pending at this checkpoint.
The architecture work remains **In Review**. No new customer SaaS deployment or commercial
traction is established by this documentation.

The initial review checked reuse, tenant/security/rights design, migration and
rollback reasoning, a dependency backlog and economics arithmetic. Its offline
SQLite/fake-CMS contract probes do not substitute for D1, live payment, CMS,
restore or load-testing acceptance. Planning estimates and pricing remain
hypotheses until their inputs are measured.

## Cloud strategy: useful roles before additional infrastructure

Cloudflare and Azure are mandatory architecture considerations. GCP is evaluated
where a distinct SEO job justifies it. This requirement does not mandate using
every vendor service or moving existing assets to consume promotional credits.

| Cloud / capability group | Candidate SEO job | Integration approach and phase | Current state / next gate |
| --- | --- | --- | --- |
| Cloudflare Workers and Static Assets | Application/API and existing public delivery | Reuse the public edge surface; add service routes only after the accepted boundary is clear | Existing foundation documented; new service integration proposed |
| Cloudflare D1 and R2 | Job metadata, approved versions and protected artifacts | Server-derived tenant scope, explicit public/private stores, private artifact access | Existing foundation; new tenant semantics and load limits need targeted acceptance |
| Cloudflare Workflows, Queues and Containers | Long jobs, bounded retries and work that needs a container | Reuse an outbox/reconciler where sufficient; introduce orchestration only for a proved job | Capability fit under review; idempotency and uncertain remote effects must remain explicit |
| Cloudflare AI Search and Browser Run | Retrieval/ingestion and bounded website intake | Benchmark managed retrieval and URL intake against existing FTS/API; keep rights and tenant filtering | Evaluation requested; no adoption or live benchmark claimed |
| Cloudflare Workers AI and AI Gateway | Supported inference and model routing/observability | Select by quality, latency, limits and complete cost accounting | Existing transcription foundation; content-service role under review |
| Azure compute, Container Apps and storage/data services | Bounded authoring, review, data or QA jobs that benefit from Azure | Select a concrete component/job and phase; avoid wholesale replatforming | Architecture consideration required; actual account, region, access and deployment gates remain |
| Microsoft Foundry | Author/review/embedding/media model candidates | Compare exact deployment/model/region quality, quotas and full-price cost | Evaluation required; no production model access, credit coverage or benchmark claim |
| Google Search Console | Search-performance measurement | Preserve the existing Google Search measurement input; it is separate from Google Cloud infrastructure | Existing integration input; fresh results need their own dated readback |
| GCP Cloud Run, data services and Vertex AI | Justified compute/data/model jobs | Adopt an additional backend only for a distinct supported outcome | Capability selection and account access remain under evaluation |

Each accepted cloud decision must record: capability → SEO job → integration →
phase → cost/limits → adopt/defer/reject, with dated primary sources and a
specific acceptance gate. Full-price costs, egress, storage, inference,
observability and editorial labor belong in the baseline. Credits can be a
separate scenario only after actual eligibility, coverage and expiry are
verified. This public record excludes account identifiers, balances and
credentials.

## Current development: complete editorial cycle

Tracking: the existing private editorial-cycle work item.

**What:** complete ten distinct substantial English topic packages through the
existing content workflow and single canonical outbox.

**Why:** prove that demand discovery and original analysis can repeatedly produce
useful editorial outcomes without weakening evidence or duplicating releases.

**How:** discovery → shortlist → evidence → draft → editing → visuals →
independent QA → canonical release/outbox → receipt. Each package needs dated
demand evidence, a baseline, original analysis and native channel adaptations.
Unmeasured demand stays unknown; the target does not justify weaker topics.

**Progress:** work is **In Progress**. The current ten-topic batch is not accepted
or released as complete. Initial packages and visual review are in progress;
the latest reviewed visual candidate still needs a mobile-readability repair.
Finished topic count, ready-to-release count and published-with-receipt count
must be tracked separately. This checkpoint does not relabel earlier approved
items as ten new topics.

The existing runtime-registration blocker and publication guards remain
independent of editorial production. Uncertain prior delivery must be reconciled
before retry, paused lanes remain paused, and a second publisher or queue is
outside this work.

## Evidence needed for the next product step

1. Accept the exact architecture revision and the three-option comparison.
2. Choose the lean scope and a concrete Cloudflare/Azure job map; record any
   GCP deferrals with reasons.
3. Implement and verify one bounded end-to-end dogfood run, measuring time and
   quality against a stated baseline.
4. Verify tenant/data rights, retries and uncertain remote effects for that
   exact scope, then demonstrate backup/restore and rollback.
5. Finish the current editorial packages with exact-version QA and release
   receipts or named unresolved delivery gates.
6. Measure independent use, repeat use, willingness to pay and delivery costs
   before describing a commercial offering as established.

These are acceptance gates, not promised launch dates.

## English documentation and GitHub/Linear traceability

GitHub stores sanitized product rationale, architecture decisions, implementation
history and reviewable documentation. Linear tracks scope, dependencies,
acceptance and current delivery state. New product-facing titles, descriptions
and updates use English. Historical comments retain their original wording.

Every meaningful change should state **what changed, why, how it works, its
evidence state, remaining gates and next step**, linking the relevant issue,
commit/PR and public-safe receipt. Preserve existing IDs and history.

On 2026-10-03, the connected Linear workspace returned 19 Base2026 GitHub PR
records. None in that inspected list had linked Linear issues; the inspected current
architecture and editorial-cycle issues had no GitHub issue/PR attachment. For the latest merged GitHub PR,
#66, Linear's exact lookup returned **Diff not found** at this checkpoint; the
lookup does not establish whether a record exists or why it was not returned.
This verifies historical PR visibility, not complete issue or document
synchronization. No corresponding architecture issue was returned by the
scoped GitHub issue search.

[Linear's GitHub documentation](https://linear.app/docs/github) describes PR
linking/status automation and separately configured one-way or two-way issue
sync. Connecting an integration does not itself prove that project documents,
repository files or all historical issues are mirrored. Use explicit related
issue references and check readback in both systems. Documentation-only PRs
must not close unfinished product work. Before linking a public PR to a private
Linear issue, verify the linkback behavior: Linear can post the issue title and
description back to GitHub, including images/attachments. Until that boundary
is confirmed safe, keep the public PR unlinked and reference its public
document permalink inside private Linear. No integration configuration change
is part of this checkpoint.

Private research, operational paths/logs, customer information, credentials and
financial account details remain outside public GitHub. The
[publication boundary](../project-memory/PUBLICATION_BOUNDARY.md) and
[Git publication audit](../GIT_PUBLICATION_AUDIT.md) remain mandatory.

## Reference map

- [Public product roadmap](../../ROADMAP.md)
- [Public investor overview](https://base2026.dev/investors)
- [Product state and dated release history](../project-memory/PROJECT_STATE.md)
- [Cloudflare architecture and operating manual](../BASE2026_CLOUDFLARE_PIPELINE_CANONICAL_OPERATING_MANUAL.md)
- [Editorial publishing contract](../BASE2026_EDITORIAL_PUBLISHING.md)
- [Evidence-to-SEO operating manual](../BASE2026_EVIDENCE_TO_SEO_OPERATING_MANUAL.md)
- [Linear GitHub integration behavior](https://linear.app/docs/github)
