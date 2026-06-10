from __future__ import annotations

import argparse
import html
import re
import math
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
    parser.add_argument("--chunk-size", type=int, default=400)
    args = parser.parse_args()

    web_root = args.web_root.resolve()
    out = args.out or (web_root / "sitemap.xml")
    chunk_size = max(1, args.chunk_size)
    urls = [
        url_for(web_root, path, args.base_url)
        for path in sorted(web_root.rglob("*.html"))
        if not path.name.startswith("roadmap-dataviz-test") and is_indexable(path)
    ]
    today = date.today().isoformat()
    out.parent.mkdir(parents=True, exist_ok=True)
    sitemap_dir = out.parent / "sitemaps"
    sitemap_dir.mkdir(parents=True, exist_ok=True)

    for old_chunk in sitemap_dir.glob("base2026-*.xml"):
        old_chunk.unlink()

    chunk_paths = []
    for index in range(math.ceil(len(urls) / chunk_size)):
        chunk_urls = urls[index * chunk_size : (index + 1) * chunk_size]
        chunk_path = sitemap_dir / f"base2026-{index + 1:03d}.xml"
        chunk_body = "\n".join(
            f"  <url><loc>{html.escape(url)}</loc><lastmod>{today}</lastmod></url>" for url in chunk_urls
        )
        with chunk_path.open("w", encoding="utf-8", newline="\n") as handle:
            handle.write(
                '<?xml version="1.0" encoding="UTF-8"?>\n'
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                f"{chunk_body}\n"
                "</urlset>\n"
            )
        chunk_paths.append(chunk_path)

    sitemap_base = args.base_url.rstrip("/")
    index_body = "\n".join(
        "  <sitemap>"
        f"<loc>{html.escape(sitemap_base + '/sitemaps/' + chunk_path.name)}</loc>"
        f"<lastmod>{today}</lastmod>"
        "</sitemap>"
        for chunk_path in chunk_paths
    )
    with out.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            f"{index_body}\n"
            "</sitemapindex>\n"
        )
    print(f"sitemap_urls={len(urls)} sitemap_files={len(chunk_paths)} out={out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
