from pathlib import Path


CONFIG = Path("/etc/nginx/sites-available/alex-yarosh")
MARKER = "# Base2026 knowledge start"
REDIRECT_MARKER = "# Base2026 canonical redirects start"
STRICT_ENTITY_MARKER = "# Base2026 generated entity routes start"
REDIRECT_BLOCK = r'''
    # Base2026 canonical redirects start
    location ^~ /topics/ {
        return 301 /knowledge$request_uri;
    }

    location ^~ /sources/ {
        return 301 /knowledge$request_uri;
    }

    location ^~ /creators/ {
        return 301 /knowledge$request_uri;
    }

    location ^~ /compare/ {
        return 301 /knowledge$request_uri;
    }
    # Base2026 canonical redirects end

'''
STRICT_ENTITY_BLOCK = r'''
    # Base2026 generated entity routes start
    location ^~ /knowledge/topics/ {
        alias /var/www/base2026-knowledge/current/web/topics/;
        index index.html;
        try_files $uri $uri/ =404;
    }

    location ^~ /knowledge/sources/ {
        alias /var/www/base2026-knowledge/current/web/sources/;
        index index.html;
        try_files $uri $uri/ =404;
    }

    location ^~ /knowledge/creators/ {
        alias /var/www/base2026-knowledge/current/web/creators/;
        index index.html;
        try_files $uri $uri/ =404;
    }

    location ^~ /knowledge/compare/ {
        alias /var/www/base2026-knowledge/current/web/compare/;
        index index.html;
        try_files $uri $uri/ =404;
    }
    # Base2026 generated entity routes end

'''

BLOCK = r'''

    # Base2026 knowledge start
    # Base2026 canonical redirects start
    location ^~ /topics/ {
        return 301 /knowledge$request_uri;
    }

    location ^~ /sources/ {
        return 301 /knowledge$request_uri;
    }

    location ^~ /creators/ {
        return 301 /knowledge$request_uri;
    }

    location ^~ /compare/ {
        return 301 /knowledge$request_uri;
    }
    # Base2026 canonical redirects end

    # Base2026 static asset optimization
    location ^~ /knowledge/static/ {
        alias /var/www/base2026-knowledge/current/web/static/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/css application/javascript application/json image/svg+xml;
        try_files $uri =404;
    }

    # Base2026 generated entity routes start
    location ^~ /knowledge/topics/ {
        alias /var/www/base2026-knowledge/current/web/topics/;
        index index.html;
        try_files $uri $uri/ =404;
    }

    location ^~ /knowledge/sources/ {
        alias /var/www/base2026-knowledge/current/web/sources/;
        index index.html;
        try_files $uri $uri/ =404;
    }

    location ^~ /knowledge/creators/ {
        alias /var/www/base2026-knowledge/current/web/creators/;
        index index.html;
        try_files $uri $uri/ =404;
    }

    location ^~ /knowledge/compare/ {
        alias /var/www/base2026-knowledge/current/web/compare/;
        index index.html;
        try_files $uri $uri/ =404;
    }
    # Base2026 generated entity routes end

    location ^~ /knowledge/ {
        alias /var/www/base2026-knowledge/current/web/;
        index index.html;
        try_files $uri $uri/ /knowledge/index.html;
    }

    location = /knowledge-search/multi-search {
        proxy_pass http://127.0.0.1:7700/multi-search;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ^~ /knowledge-search/ {
        return 403;
    }
    # Base2026 knowledge end
'''


def ensure_redirects(text: str) -> tuple[str, bool]:
    changed = False
    marker_index = text.find(MARKER)
    if marker_index == -1:
        return text, False
    if REDIRECT_MARKER not in text:
        insert_index = text.find("\n", marker_index)
        if insert_index == -1:
            insert_index = marker_index + len(MARKER)
        else:
            insert_index += 1
        text = text[:insert_index] + REDIRECT_BLOCK + text[insert_index:]
        changed = True
    if STRICT_ENTITY_MARKER not in text:
        static_marker = "    # Base2026 static asset optimization"
        insert_index = text.find(static_marker)
        if insert_index == -1:
            insert_index = text.find("\n", marker_index)
            insert_index = marker_index + len(MARKER) if insert_index == -1 else insert_index + 1
        text = text[:insert_index] + STRICT_ENTITY_BLOCK + text[insert_index:]
        changed = True
    return text, changed


def main() -> int:
    text = CONFIG.read_text(encoding="utf-8")
    if MARKER in text:
        text, changed = ensure_redirects(text)
        if changed:
            CONFIG.write_text(text, encoding="utf-8")
            print("redirects-patched")
        else:
            print("already-present")
        return 0
    idx = text.rfind("}")
    if idx == -1:
        raise SystemExit("cannot find final closing brace")
    CONFIG.write_text(text[:idx] + BLOCK + text[idx:], encoding="utf-8")
    print("patched")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
