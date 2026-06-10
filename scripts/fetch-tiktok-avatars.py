from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path
from urllib.parse import urlparse

import requests


ROOT = Path(__file__).resolve().parents[1]
CREATORS = ROOT / "public-data" / "tiktok" / "creators.jsonl"
PROFILE_CONFIG = ROOT / "config" / "creator-profiles.json"
ASSET_DIR = ROOT / "web" / "static" / "assets" / "creators"


def slug(value: str) -> str:
    return "-".join(re.findall(r"[a-z0-9]+", value.lower())) or "creator"


def read_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    if not path.exists():
        return rows
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def extract_avatar_url(profile_html: str) -> str:
    patterns = [
        r'"avatarMedium"\s*:\s*"([^"]+)"',
        r'"avatarLarger"\s*:\s*"([^"]+)"',
        r'"avatarThumb"\s*:\s*"([^"]+)"',
        r'<meta property="og:image" content="([^"]+)"',
    ]
    for pattern in patterns:
        match = re.search(pattern, profile_html)
        if match:
            return html.unescape(match.group(1).replace("\\u002F", "/").replace("\\/", "/"))
    return ""


def extension_from_url(url: str) -> str:
    suffix = Path(urlparse(url).path).suffix.lower()
    return suffix if suffix in {".jpg", ".jpeg", ".png", ".webp"} else ".jpg"


def fetch_text(url: str, timeout: int) -> str:
    response = requests.get(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        },
        timeout=timeout,
    )
    response.raise_for_status()
    return response.text


def fetch_bytes(url: str, timeout: int) -> bytes:
    response = requests.get(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
            )
        },
        timeout=timeout,
    )
    response.raise_for_status()
    return response.content


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch public TikTok creator avatars into stable local assets.")
    parser.add_argument("--creators", type=Path, default=CREATORS)
    parser.add_argument("--profiles", type=Path, default=PROFILE_CONFIG)
    parser.add_argument("--asset-dir", type=Path, default=ASSET_DIR)
    parser.add_argument("--public-prefix", default="/knowledge/static/assets/creators")
    parser.add_argument("--timeout", type=int, default=20)
    args = parser.parse_args()

    creators = read_jsonl(args.creators)
    profiles = read_json(args.profiles)
    args.asset_dir.mkdir(parents=True, exist_ok=True)

    updated = 0
    for creator in creators:
        handle = (creator.get("handle") or "").lstrip("@")
        profile_url = creator.get("url") or (f"https://www.tiktok.com/@{handle}" if handle else "")
        if not handle or not profile_url:
            continue

        profile_html = fetch_text(profile_url, args.timeout)
        avatar_url = extract_avatar_url(profile_html)
        if not avatar_url:
            print(f"avatar=missing handle=@{handle}")
            continue

        ext = extension_from_url(avatar_url)
        asset_name = f"{slug(handle)}{ext}"
        asset_path = args.asset_dir / asset_name
        asset_path.write_bytes(fetch_bytes(avatar_url, args.timeout))

        key_candidates = [creator.get("creator_id") or "", f"@{handle}", handle]
        payload = {
            "display_name": creator.get("display_name") or "",
            "avatar_url": f"{args.public_prefix.rstrip('/')}/{asset_name}",
        }
        for key in key_candidates:
            if key:
                profiles[key] = {**profiles.get(key, {}), **payload}
        updated += 1
        print(f"avatar=ok handle=@{handle} asset={asset_name}")

    args.profiles.parent.mkdir(parents=True, exist_ok=True)
    args.profiles.write_text(json.dumps(profiles, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"updated={updated}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
