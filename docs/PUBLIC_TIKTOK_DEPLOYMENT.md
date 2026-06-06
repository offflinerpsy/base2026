# Public TikTok Deployment Plan

Date: 2026-06-01

## Decision

Public:

- TikTok knowledge base
- creators
- source links
- dates
- polished transcripts
- claims
- Meilisearch public index

Private:

- local SEO/GEO/AEO research folders
- private SQLite source database
- raw captions/audio/job logs
- OpenClaw/Codex local workflow

## VPS Shape

Existing WordPress VPS:

- host: `<server-host>`
- ssh: `root`
- key: `<local-ssh-key-path>`
- WordPress root: `/var/www/alex-yarosh`
- Nginx site: `alex-yarosh`

Do not replace WordPress.

Target public path:

```text
https://<domain>/knowledge/
```

Recommended server directories:

```text
/var/www/base2026-knowledge/
  releases/
  current -> releases/<timestamp>
  shared/
    public-data/
    meili_data/
    .env
```

## Runtime

```text
Nginx
  /                  -> existing WordPress
  /knowledge/        -> Base2026 public web app
  /knowledge-search/ -> proxy to Meilisearch search endpoint only

Base2026 public app
  static/read-only UI
  no ingestion endpoint
  no /api/refresh

Meilisearch
  localhost only
  master key enabled
  public search key exposed to browser
```

## Local Export Commands

Run locally before deploy:

```powershell
python .\scripts\export-public-tiktok.py
python .\scripts\meili-index-public.py --index base2026_public_tiktok
```

Export output:

```text
public-data/tiktok/manifest.json
public-data/tiktok/creators.jsonl
public-data/tiktok/documents.jsonl
public-data/tiktok/chunks.jsonl
```

## Nginx Subdirectory Pattern

Inside the existing WordPress `server {}` block, add a dedicated location:

```nginx
location ^~ /knowledge/ {
    alias /var/www/base2026-knowledge/current/web/;
    index index.html;
    try_files $uri $uri/ /knowledge/index.html;
}
```

If the app needs an API later:

```nginx
location ^~ /knowledge-api/ {
    proxy_pass http://127.0.0.1:8766/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

For Meilisearch, do not expose admin API publicly. Prefer a backend search proxy. If direct browser access is used temporarily, expose only a search key and lock Meili to localhost/private network.

## Deployment Safety

Before touching server:

```powershell
ssh -i <local-ssh-key-path> root@<server-host> "systemctl is-active nginx; nginx -t; find /etc/nginx/sites-enabled -maxdepth 1 -type l -printf '%f -> %l\n'"
```

Backup Nginx config:

```bash
cp /etc/nginx/sites-available/alex-yarosh /root/alex-yarosh-nginx-pre-base2026-$(date +%Y%m%d-%H%M%S).conf
```

After config edit:

```bash
nginx -t
systemctl reload nginx
```

Verify:

- WordPress root still works.
- `/knowledge/` works.
- Meilisearch is not publicly writable.

## Next Build Tasks

1. Make public web app base path aware: `/knowledge/`.
2. Add `BASE2026_PUBLIC_MODE=true` to disable `/api/refresh`.
3. Add search proxy or public-key Meili config.
4. Generate static creator/topic/source pages.
5. Package release folder for upload to VPS.
