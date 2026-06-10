# Base2026 Pipeline Controller Runbook

Last updated: 2026-06-09

## Controller

Primary command:

```powershell
python scripts/base2026-controller.py <command>
```

Commands:

- `status`
- `inventory-check`
- `build-backfill-queue`
- `run-claim-extract-sample`
- `verify-evidence`
- `import-claim-candidates`
- `data-quality-report`
- `public-boundary-audit`
- `daily-digest`
- `next-action-report`
- `doctor`
- `list-runs`

Use `.venv/bin/python` on the MacBook when running local-worker or model/ASR commands so `faster-whisper`, `ctranslate2`, and related dependencies are available.

## Defaults

- dry-run by default for any data-changing path;
- no deploy unless `--deploy-approved` exists on a future command;
- no public promotion unless `--promote-approved` exists on a future command;
- every controller run writes a run folder under `.planning/runs/YYYYMMDD-HHMMSS/`.

## Run Logs

Each run folder should contain:

- `run.json`
- `stdout.log`
- `stderr.log`
- `report.md`

Run folders include microseconds in their names so parallel-safe controller calls do not collide.

## Schedule Plan

Current:

- keep Windows Task Scheduler for check-only inventory.

Near-term:

- use controller command for reviewed local runs.

Future options:

1. Windows Task Scheduler + controller script: use now.
2. APScheduler: only if Python-native scheduling becomes necessary.
3. Prefect: later if retries/state/UI are needed.

Do not install Airflow, Dagster, Prefect, or APScheduler in the current task.

## Failure Recovery

1. Read latest `.planning/runs/*/run.json`.
2. Read matching `stderr.log`.
3. Check lock files before rerun.
4. Re-run only the failed dry-run step.
5. Do not deploy after a failed pipeline stage.

## Escalate To Owner When

- local model endpoint is missing and extraction needs LLM;
- evidence verifier rejects too many candidates;
- raw/private data would enter public files;
- public promotion is requested;
- deployment is requested;
- GitHub remote/staging is needed.

## Deployment Allowed Only When

- owner explicitly asks;
- public export policy passes;
- evidence checks pass;
- no private data is in the release package;
- smoke tests pass.
