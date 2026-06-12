# Deployment Runbook

Current public path:

- Root URL: `https://aggressorbulkit.online/`
- Base2026 URL: `https://aggressorbulkit.online/knowledge/`
- WordPress root: `/var/www/alex-yarosh`
- server current symlink: `/var/www/base2026-knowledge/current`
- server releases: `/var/www/base2026-knowledge/releases/`
- latest deployed release: `base2026-intake-gpt-cards-ay71-20260612`
- SSL certificate: Let's Encrypt `aggressorbulkit.online`, domains `aggressorbulkit.online` and `www.aggressorbulkit.online`, auto-renewed by `certbot.timer`

## Domain and SSL

The nginx site `alex-yarosh` serves WordPress at the root and aliases Base2026 under `/knowledge/`.

The `/knowledge/static/` location should be declared before the broader `/knowledge/` alias and should set long-lived immutable cache headers plus gzip for CSS, JS, JSON, and SVG assets. The broader `/knowledge/` location serves HTML and fallback routing.

Canonical domain:

```text
https://aggressorbulkit.online
```

WordPress options must stay aligned:

```bash
cd /var/www/alex-yarosh
wp option get home --allow-root
wp option get siteurl --allow-root
```

Expected value for both:

```text
https://aggressorbulkit.online
```

SSL check:

```bash
certbot certificates
systemctl list-timers | grep certbot
nginx -t
```

## Local package

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\package-public-release.ps1 -ReleaseName <release-name>
```

Public packages are excerpt-only by default. Use `-IncludeFullTranscripts` only for private/gated review exports.

## One-command deploy

Use this for normal VPS deploys:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-public-vps.ps1 -ReleaseName <release-name>
```

The script packages the release, uploads the zip, unpacks to a new release folder, switches the `current` symlink, reloads nginx after `nginx -t`, reindexes Meilisearch, and verifies the deployed path.

## Server deploy shape

1. Upload release zip to `/tmp/<release-name>.zip`.
2. Unzip to `/var/www/base2026-knowledge/releases/<release-name>`.
3. Keep the browser pointed at `/knowledge-search`.
4. Ensure nginx proxies `/knowledge-search/multi-search` to Meilisearch and injects the public search-key Authorization header server-side.
5. Ensure nginx serves `/knowledge/static/` with immutable cache headers and gzip for CSS/JS/JSON/SVG assets.
6. Verify `web/static/documents.jsonl` exists.
7. Verify `web/methodology.html`, `web/opt-out.html`, `web/roadmap.html`, `web/privacy.html`, `web/source-policy.html`, and `web/support.html` exist.
8. Switch `/var/www/base2026-knowledge/current` symlink with `ln -sfnT` so the symlink target is replaced, not nested.
9. Run `nginx -t`.
10. Reload nginx.
11. Verify `/knowledge/`, `/knowledge/roadmap.html`, `/knowledge/privacy.html`, `/knowledge/source-policy.html`, `/knowledge/support.html`, `/knowledge/methodology.html`, `/knowledge/opt-out.html`, `/knowledge/static/documents.jsonl`, and `/knowledge-search/multi-search`.
12. Verify live compression/cache headers:

```bash
curl -I -H 'Accept-Encoding: gzip, br' https://aggressorbulkit.online/knowledge/static/styles.css
curl -I -H 'Accept-Encoding: gzip, br' https://aggressorbulkit.online/knowledge/static/meili.js
```

Both static asset checks should show `Content-Encoding: gzip`, `Vary: Accept-Encoding`, and a long-lived `Cache-Control`.

13. Reindex Meilisearch from the deployed release data when `passages.jsonl`, index settings, or topic fields changed.

Current server reindex command shape:

```bash
cd /var/www/base2026-knowledge/current
python3 scripts/meili-index-public.py \
  --data public-data/tiktok/chunks.jsonl \
  --url http://127.0.0.1:7700 \
  --index base2026_public_tiktok \
  --master-key "$(cat /var/www/base2026-knowledge/shared/.meili_master_key)"
```

## Rollback

Switch `current` symlink back to previous release, run `nginx -t`, reload nginx, verify `/knowledge/`.

## Forbidden

- do not overwrite WordPress root
- do not print or commit Meilisearch keys
- do not deploy private local source folders
