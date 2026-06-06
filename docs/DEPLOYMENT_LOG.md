# Deployment Log

## 2026-06-02 — First Public TikTok Deploy

Release:

```text
base2026-public-20260602-163921
```

Server:

```text
<server-host>
```

Public URL:

```text
https://<domain>/knowledge/
```

Server paths:

```text
/var/www/base2026-knowledge/releases/base2026-public-20260602-163921
/var/www/base2026-knowledge/current -> /var/www/base2026-knowledge/releases/base2026-public-20260602-163921
/var/www/base2026-knowledge/shared/meili_data
```

Dataset:

```text
documents=912
chunks=1324
creators=3
private/local files=0
```

Meilisearch:

```text
service=base2026-meilisearch
listen=127.0.0.1:7700
index=base2026_public_tiktok
```

Nginx:

```text
/                  -> existing WordPress
/knowledge/        -> Base2026 static public app
/knowledge-search/ -> search proxy; admin-like paths blocked
```

Backups:

```text
/root/alex-yarosh-nginx-pre-base2026-20260602-155311.conf
/root/alex-yarosh-nginx-pre-base2026-20260602-155121.conf
```

Verification:

```text
WordPress root: 200
/knowledge/: 200
/knowledge-search/keys: 403
nginx -t: pass
nginx: active
base2026-meilisearch: active
Meilisearch public port: localhost only
Playwright desktop/mobile: pass
```

Screenshots:

```text
base2026-vps-knowledge-desktop.png
base2026-vps-knowledge-mobile.png
```

Notes:

- Docker was not installed on the VPS, so Meilisearch was installed as a standalone Linux binary and run via systemd.
- The public app uses a search-only key embedded in the static HTML.
- The Meilisearch master key stays on the server in `/var/www/base2026-knowledge/shared/`.
