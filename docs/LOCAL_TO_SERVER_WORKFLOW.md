# Local To Server Workflow

Date: 2026-06-01

## Goal

Keep improving Base2026 locally, then deploy the public TikTok knowledge base to the VPS quickly and safely when the maintainer says: deploy.

## Working Model

```text
Local machine
  private SQLite source of truth
  TikTok ingestion / transcript polish / claims
  public TikTok export
  local QA
  release package

VPS
  existing WordPress at /
  Base2026 public app at /knowledge/
  Meilisearch public index
  no public ingestion
```

## Daily Local Workflow

1. Update/ingest TikTok data locally.
2. Rebuild SQLite.
3. Run audit.
4. Export public TikTok data.
5. Reindex local Meilisearch public index.
6. QA `/meili` locally.

Commands:

```powershell
python .\scripts\build-kb-sqlite.py
python .\scripts\kb-audit.py
python .\scripts\export-public-tiktok.py
python .\scripts\meili-index-public.py --index base2026_public_tiktok
python .\web\server.py
```

Local URLs:

```text
http://127.0.0.1:8765/
http://127.0.0.1:8765/meili
http://127.0.0.1:7700
```

## Hermes TikTok Refresh

Hermes refresh is documented in `docs/HERMES_TIKTOK_REFRESH.md`.

Safe scheduled check:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\register-hermes-tiktok-check-task.ps1
```

Registered task:

```text
Base2026 Hermes TikTok Check
03:30 and 15:30 Europe/Minsk
check-only, no LLM, no deploy
```

Manual ingest:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\hermes-tiktok-refresh.ps1 -TranscriptLimit 100 -AsrLimit 20 -PolishLimit 30
```

After Hermes finishes generated polish batches:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\hermes-tiktok-refresh.ps1 -AfterPolish -Package
```

## Deploy Command Flow

When user says “deploy to server”:

1. Check git/worktree status.
2. Re-run local export and audits.
3. Build release folder.
4. Upload release to VPS.
5. Update `/var/www/base2026-knowledge/current` symlink.
6. Upload public data.
7. Reindex Meilisearch on server.
8. Test Nginx.
9. Reload Nginx only if config changed.
10. Verify WordPress root and `/knowledge/`.

## VPS Layout

```text
/var/www/base2026-knowledge/
  releases/
    20260601-221800/
      web/
      scripts/
      public-data/
  current -> releases/20260601-221800
  shared/
    meili_data/
    .env
```

Existing WordPress remains:

```text
/var/www/alex-yarosh
```

## Nginx Rule

Do not replace the WordPress site. Add a subpath location:

```nginx
location ^~ /knowledge/ {
    alias /var/www/base2026-knowledge/current/web/;
    index index.html;
    try_files $uri $uri/ /knowledge/index.html;
}
```

If we keep the Python API app later, proxy it separately:

```nginx
location ^~ /knowledge-api/ {
    proxy_pass http://127.0.0.1:8766/;
}
```

## Fast Release Package

Release should include:

- `web/`
- `scripts/meili-index-public.py`
- `public-data/tiktok/`
- `.env.example`
- docs needed for server

Release should not include:

- private SQLite DB
- raw TikTok sources
- local SEO/GEO files
- audio
- screenshots
- local Meili data

## Safety Checks

Before server work:

```powershell
ssh -i <local-ssh-key-path> root@<server-host> "systemctl is-active nginx; nginx -t"
```

After deploy:

```powershell
ssh -i <local-ssh-key-path> root@<server-host> "systemctl is-active nginx; nginx -t; test -d /var/www/alex-yarosh; test -L /var/www/base2026-knowledge/current"
```

## Rollback

Keep previous release folder. Rollback is symlink swap:

```bash
ln -sfn /var/www/base2026-knowledge/releases/<previous> /var/www/base2026-knowledge/current
systemctl reload nginx
```

## Next Implementation Tasks

1. Add `scripts/package-public-release.ps1`.
2. Add `scripts/deploy-public-vps.ps1`.
3. Add production Meilisearch compose/systemd config.
4. Make `/knowledge/` base path stable.
5. Add public mode to disable refresh/intake endpoints.
