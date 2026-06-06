from pathlib import Path


CONFIG = Path("/etc/nginx/sites-available/alex-yarosh")
MARKER = "# Base2026 knowledge start"

BLOCK = r'''

    # Base2026 knowledge start
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


def main() -> int:
    text = CONFIG.read_text(encoding="utf-8")
    if MARKER in text:
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
