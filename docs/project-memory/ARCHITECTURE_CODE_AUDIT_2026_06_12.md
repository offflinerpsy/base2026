# Base2026 Architecture And Code Audit - 2026-06-12

## Scope

This audit covers the checked-in Base2026 repository state from the active phase:

- Active phase: launch monitoring plus check-only TikTok intake pipeline hardening.
- Special focus: BS2026/Base2026 public knowledge pipeline, TikTok source custody, public export, release packaging, Meilisearch runtime, and agent token-cost control.
- Guardrails followed: no commit, no push, no deploy, no intake automation, no staging, and no publication of private/generated artifacts.

Existing dirty files and any parallel memory updates were treated as user/previous-session work and were not reverted. This audit pass intentionally changed only:

- `docs/project-memory/ARCHITECTURE_CODE_AUDIT_2026_06_12.md`
- `docs/project-memory/NEXT_ACTION.md`
- `docs/project-memory/PROMPT_LOG.md`

Four independent expert roles reviewed the project in parallel:

- Full-stack reviewer: public UI, Meilisearch, package/runtime coupling.
- Systems architect: release topology, orchestration, public/private boundaries.
- QA/test architect: gates, fixtures, preflight, negative tests.
- Cynical opposing reviewer: assumptions, false confidence, semantic risk.

External references checked:

- Meilisearch security guidance: API keys, tenant tokens, and result sanitization: <https://www.meilisearch.com/docs/capabilities/security/overview>
- GitHub Actions secure-use guidance: least privilege permissions and secret handling: <https://docs.github.com/en/actions/reference/security/secure-use>
- OWASP DevSecOps secrets management: detect secrets in commits, repos, and pipelines: <https://owasp.org/www-project-devsecops-guideline/latest/01a-Secrets-Management>
- MDN Subresource Integrity guidance for CDN assets: <https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity>

## Verification Run

Local verification during this audit:

- `python3 -m py_compile scripts/*.py web/server.py` passed.
- `node --check web/static/meili.js` passed.
- `node --check web/static/share-actions.js` passed.
- `node --check scripts/mobile-visual-qa.mjs` passed.
- `python3 scripts/audit-publication-boundary.py` passed with `forbidden=0`, `needs_review=0`, and `secret_findings=0`.
- `python3 scripts/check-public-export-policy.py public-data/tiktok` passed with `include_full_transcripts=false`, `source_records=1216`, `passages=1709`, `insight_cards=1607`, and `public_insight_cards=1165`.
- `python3 scripts/validate-github-metadata.py` passed.
- `python3 scripts/base2026-controller.py doctor` passed and wrote only ignored `.planning/runs/...` trace files.
- `python3 scripts/kb-audit.py` printed `audit=PASS`.
- `git diff --check` passed.

No public/private leak was found in the current working tree by the existing boundary audit. The findings below are architectural and durability risks, not evidence of a current leak.

## Council Debate

The full-stack reviewer argued that the user-facing product is already valuable: static pages, source modals, creator profiles, topic pages, and Meilisearch form a coherent public knowledge console. Their concern was coupling: hardcoded cache versions, CDN dependencies, formatted Meili HTML, and generated pages make small UI fixes touch too much surface.

The architect agreed that the macro shape is right: private intake and LLM work stay local, public runtime is static plus search, and third-party transcript exposure is excerpt-first. Their objection was that policy is duplicated across scripts, runbooks, `.gitignore`, audit allowlists, stage allowlists, and human memory.

The QA reviewer pushed for hard negative tests. Current gates are useful, but CI is mostly syntax checks; the strongest checks run locally and often depend on ignored data. The audit system can say "green" while important release contracts are untested in CI fixtures.

The cynical reviewer challenged the most dangerous assumption: "policy passed" does not mean "the claim is semantically true." Exact/fuzzy evidence matching proves that text exists; it does not prove that the public insight fairly follows from the source. For Base2026, where the product value is correct synthesis from text, that distinction matters more than ordinary app correctness.

Consensus:

Base2026 should not be rebuilt. Its core architecture is good. The next leverage point is to make public release and insight promotion contract-driven: public claims are promoted artifacts, not generated content. Automation should handle custody, hashes, manifests, deterministic export, and deploy ordering. Human/GPT review should handle meaning.

## Current System Map

```text
Private/local layer
  ignored TikTok creator queues and source vaults
  -> inventory/caption/ASR/polish scripts
  -> local SQLite KB rebuild
  -> source-only GPT/Codex review packets
  -> evidence verification and reviewer promotion gates
  -> private candidate archives and reviewed claim rows

Public export layer
  SQLite TikTok records
  -> scripts/export-public-tiktok.py
  -> public-data/tiktok/*.jsonl
  -> scripts/check-public-export-policy.py
  -> generated static pages and sitemap
  -> scripts/package-public-release.ps1

Public runtime
  /knowledge/ static app
  -> /knowledge-search/multi-search nginx proxy
  -> Meilisearch index base2026_public_tiktok
  -> source modal loads versioned static/documents.jsonl
```

## What Is Strong

- The public/private boundary is clearly documented and broadly enforced by `.gitignore`, `PUBLICATION_BOUNDARY.md`, `audit-publication-boundary.py`, and `stage-public-files.ps1`.
- Public TikTok export is excerpt-only by default, and current policy checks confirm no full transcript field is shipped.
- The GPT/Codex review lane is source-only: review packets are built from public passages, and candidate promotion is separated from extraction.
- Static generated pages give the project an inspectable public surface without requiring a dynamic app server.
- Deploy automation validates release names, expected files, nginx reload, and static endpoint health.
- Recent ay73/ay76 fixes correctly moved asset/document cache-busting into the release package path, which is the right place for immutable public artifacts.

## Findings

### P1 - Release and promotion rules are not a single executable contract

Evidence:

- `scripts/package-public-release.ps1:18` exports with `--auto-promote-insights`.
- `scripts/deploy-public-vps.ps1:44-46` forwards `-IncludeFullTranscripts` into the public packager.
- `scripts/export-public-tiktok.py:371-377` can auto-public non-candidate claims by evidence score.
- `docs/project-memory/PUBLICATION_BOUNDARY.md`, `.gitignore`, `scripts/audit-publication-boundary.py`, and `scripts/stage-public-files.ps1` duplicate overlapping policy.

Risk:

The current behavior is disciplined but not impossible to misuse. A tired future agent can create a "public" package with behavior that should belong only to a private review package. For Base2026, the release lane must be stricter than the people running it.

Recommendation:

Add `contracts/base2026.public-release-contract.json` and make export/package/deploy/stage/audit read it. At minimum it should assert:

- `include_full_transcripts=false`
- `allow_auto_promote_legacy_claims=false`
- `allowed_source_types=["tiktok_video"]`
- `required_gates=["export_policy","publication_boundary","github_metadata","kb_audit","meili_task_complete"]`
- `public_claim_rule="explicitly_promoted_reviewed_artifacts_only"`

### P1 - Deploy and Meilisearch reindex are not atomic

Evidence:

- `scripts/deploy-public-vps.ps1:78-80` switches `current` and reloads nginx before Meilisearch reindex.
- `scripts/meili-index-public.py:57-76` deletes/recreates the live index and posts documents, then only prints the task UID.

Risk:

The static release can be live while search is stale, empty, or only partially indexed. This is a product reliability risk and a trust risk because the public search console is the main product surface.

Recommendation:

Use a two-phase search deploy:

- create a release-specific shadow index;
- upload settings/documents;
- wait for every Meilisearch task to succeed;
- smoke query/count the shadow index;
- switch alias or index pointer;
- only then switch the public symlink, or verify both as one release manifest.

### P1 - "Policy passed" does not prove semantic claim quality

Evidence:

- `scripts/check-public-export-policy.py` checks structural leak and evidence fields, not entailment.
- `scripts/export-public-tiktok.py:369-377` relies on lexical evidence excerpts and review status/thresholds.
- Project state still records 619 audio/source-verification transcript QA rows and one blocked TikTok source-review row.

Risk:

The most valuable part of Base2026 is not that it renders pages. It is that public cards are accurate, source-backed insight artifacts. A lexical match can still support a misleading synthesis.

Recommendation:

Keep the current exact-evidence gate, but add a semantic review manifest before promotion:

- explicit claim IDs;
- source item IDs;
- reviewer or review-lane ID;
- source excerpt hash;
- DB/export hash;
- rejection reasons for borderline rows;
- max promoted claims per source.

No automated package/deploy path should create new public insight cards as a side effect.

### P2 - The controller command name `public-boundary-audit` is misleading

Evidence:

- `scripts/base2026-controller.py:356-359` runs `scripts/check-public-export-policy.py public-data/tiktok`, not `scripts/audit-publication-boundary.py`.

Risk:

Agents can report that the "public boundary audit" passed when only the public JSONL export policy ran. These are different gates.

Recommendation:

Rename the command to `public-export-policy`, or make it run both the export policy and the publication boundary audit with separate JSON fields.

### P2 - CI does not exercise the real policy gates

Evidence:

- `.github/workflows/ci.yml:27-44` syntax-checks four Python scripts and one JS file.
- The export policy job skips when ignored `public-data/tiktok` is absent.
- `scripts/kb-audit.py:31-47` prints PASS/FAIL but does not exit non-zero on failure.

Risk:

The repo can look green while core release invariants are untested. This increases future token cost because agents must re-read and reason about the whole pipeline instead of trusting fast fixtures.

Recommendation:

Add tiny committed fixtures:

- valid public export;
- leaky public export;
- failing SQLite fixture;
- staged forbidden-file fixture for boundary audit;
- package fixture that asserts cache-bust consistency and no transcript payload.

Then make CI run those fixtures by default, and make `kb-audit.py` return non-zero on failure.

### P2 - Generated/static boundary is unresolved

Evidence:

- `git ls-files web/static | wc -l` reports 3314 tracked files.
- `find web/static -type f -name '*.html' | wc -l` reports 3298 HTML files.
- Active memory says generated public pages should not be committed by default, while `audit-publication-boundary.py:48-54` allows all `web/static/` and `stage-public-files.ps1` stages it.

Risk:

Generated pages dominate review surface and token cost. Either the generated output is a committed artifact with regeneration checks, or it is release-only output. The current mixed posture makes future reviews expensive and imprecise.

Recommendation:

Choose one policy:

- committed artifact: CI regenerates pages from fixtures/live export and fails on diff;
- release-only artifact: page trees move out of the public-safe stage allowlist and only generator/source files are reviewed.

### P2 - Search result rendering should sanitize formatted Meilisearch HTML

Evidence:

- `web/static/meili.js:361-390` renders `_formatted`/`_highlightResult` values and link hrefs into template HTML.
- Meilisearch documentation says indexed fields are returned as-is and applications should sanitize/escape field values before rendering HTML.

Risk:

Current data is controlled public TikTok export, so the immediate risk is limited. As sources grow, formatted highlight HTML and URL fields become a public XSS/supply-chain boundary.

Recommendation:

Allow only known highlight tags, escape everything else, and validate `href` protocols (`https:`, `http:` where needed, and internal relative paths). Prefer DOM construction over template string assembly for links/buttons.

### P2 - Public frontend depends on CDN assets without SRI or vendoring

Evidence:

- `web/static/meili.html` loads external InstantSearch/instant-meilisearch assets from CDN.
- MDN documents SRI as a browser check that ensures CDN resources are delivered without unexpected modification.

Risk:

Availability and supply-chain risk. A CDN change can break the core public app or inject behavior outside the repository review path.

Recommendation:

Vendor the exact frontend dependencies or pin CDN URLs with `integrity` and `crossorigin="anonymous"`.

### P2 - Check-only automation still mutates inventory output

Evidence:

- `scripts/hermes-tiktok-refresh.ps1:110-124` runs inventory before `-CheckOnly` exits.
- `scripts/tiktok-backfill-inventory.ps1` writes `videos.csv`.

Risk:

"Check-only" sounds read-only to future agents, but it can still update private local inventory files. That is acceptable if documented, but unsafe if treated as a no-write command.

Recommendation:

Rename the mode to `-InventoryOnly`, or add a true `-NoWriteCheck` that reads configuration and reports pending state without writing source files.

### P3 - Source document lookup is efficient enough now but will not scale cleanly

Evidence:

- `web/static/meili.js:393-431` streams `documents.jsonl` on cache misses and caches records as it encounters them.

Risk:

At 1216 source records this is fine. At much larger scale, late misses cause repeated streaming and unnecessary browser bandwidth.

Recommendation:

Generate a small `documents-index.json` keyed by `item_id`, or shard source records by item ID prefix/creator and make the modal fetch a deterministic small file.

### P3 - Configuration dialects are drifting

Evidence:

- TikTok scripts reference `config/tiktok-intake-queue*.json`.
- Worker scripts reference `config/creators.local.json` and `config/creators.example.json`.
- Some defaults still include dated 20260608 paths.

Risk:

Agents can run a stale two-creator queue or the wrong shape of config while believing they are using the current four-creator pipeline.

Recommendation:

Create one public example schema and one ignored local override schema. Mark dated queues as legacy, and make scripts fail loudly when an old queue shape is selected implicitly.

## The Improvement Idea

The high-leverage improvement is not a rewrite. It is a contract layer:

```text
contracts/
  base2026.public-release-contract.json
  base2026.pipeline-stage-contract.json
  base2026.publication-boundary-contract.json
  base2026.insight-promotion-contract.json
```

Then wire the existing scripts to validate these contracts:

```text
agent preflight
  -> read project memory
  -> validate boundary contract
  -> validate stage mutability contract
  -> run fixture gates
  -> report safe next command only

promotion lane
  -> source-only packet
  -> semantic review
  -> exact evidence check
  -> promotion manifest
  -> explicit apply

release lane
  -> public export from reviewed artifacts only
  -> policy fixture + live policy check
  -> package manifest with hashes/counts/cache version
  -> shadow Meili index and task wait
  -> deploy switch
```

This keeps Base2026 stable because future agents do not need to infer policy from 20 files. They can read one contract, one state file, and the script they are changing.

## Suggested Backlog

1. Add `contracts/base2026.public-release-contract.json`; make public package/deploy reject full transcripts and auto-promotion by default.
2. Split private review packaging from public release packaging.
3. Change Meilisearch deploy to shadow-index plus task-wait semantics.
4. Rename or expand controller `public-boundary-audit`.
5. Add fixture-based CI gates for export policy, boundary audit, package cache-busts, and `kb-audit`.
6. Decide generated page policy: committed artifact with regeneration diff, or release-only artifact.
7. Sanitize Meili formatted HTML and validate runtime URLs.
8. Vendor/pin frontend search dependencies with SRI.
9. Add `agent-preflight.py --json --no-write` as the one low-token entrypoint for future agents.
10. Consolidate creator/intake config schemas and fail on legacy dated defaults.

## Reviewer Pass

- Task output matches the request: architecture audit, code review, QA review, and a four-role debate were completed.
- Public/private leakage risk: no private source payloads were added to this report; existing boundary audit passed.
- Docs point to correct files: report is under `docs/project-memory/` and references checked-in scripts/docs only.
- Next action is concrete: implement the public release/promotion contract first, then harden deploy and CI around it.
