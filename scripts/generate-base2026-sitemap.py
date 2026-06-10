from __future__ import annotations

import argparse
import html
import re
from datetime import date
from pathlib import Path


def is_indexable(path: Path) -> bool:
    text = path.read_text(encoding="utf-8", errors="ignore")
    robots = re.search(r'<meta\s+name="robots"\s+content="([^"]+)"', text, re.IGNORECASE)
    return not (robots and "noindex" in robots.group(1).lower())


def url_for(web_root: Path, path: Path, base_url: str) -> str:
    rel = path.relative_to(web_root).as_posix()
    if rel == "index.html":
        rel = ""
    elif rel.endswith("/index.html"):
        rel = rel[: -len("index.html")]
    return f"{base_url.rstrip('/')}/{rel}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate Base2026 sitemap from indexable public HTML files.")
    parser.add_argument("--web-root", type=Path, required=True)
    parser.add_argument("--base-url", default="https://aggressorbulkit.online/knowledge")
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()

    web_root = args.web_root.resolve()
    out = args.out or (web_root / "sitemap.xml")
    urls = [
        url_for(web_root, path, args.base_url)
        for path in sorted(web_root.rglob("*.html"))
        if not path.name.startswith("roadmap-dataviz-test") and is_indexable(path)
    ]
    today = date.today().isoformat()
    body = "\n".join(
        f"  <url><loc>{html.escape(url)}</loc><lastmod>{today}</lastmod></url>" for url in urls
    )
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            f"{body}\n"
            "</urlset>\n"
        )
    print(f"sitemap_urls={len(urls)} out={out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
