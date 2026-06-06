# Deployment Runbook

Current public path:

- URL: `https://<domain>/knowledge/`
- server current symlink: `/var/www/base2026-knowledge/current`
- server releases: `/var/www/base2026-knowledge/releases/`
- latest known release: `base2026-public-drawer-20260606b`

## Local package

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\package-public-release.ps1 -ReleaseName <release-name>
```

## Server deploy shape

1. Upload release zip to `/tmp/<release-name>.zip`.
2. Unzip to `/var/www/base2026-knowledge/releases/<release-name>`.
3. Preserve public Meilisearch search key in release `web/index.html`.
4. Verify `web/static/documents.jsonl` exists.
5. Switch `/var/www/base2026-knowledge/current` symlink.
6. Run `nginx -t`.
7. Reload nginx.
8. Verify `/knowledge/` and `/knowledge/static/documents.jsonl`.

## Rollback

Switch `current` symlink back to previous release, run `nginx -t`, reload nginx, verify `/knowledge/`.

## Forbidden

- do not overwrite WordPress root
- do not print or commit Meilisearch keys
- do not deploy private local source folders
