from __future__ import annotations

import argparse
import csv
import json
import time
from http.client import IncompleteRead
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
KB = ROOT / "12_knowledge-base"
TIKTOK = KB / "sources" / "tiktok"
VIDEOS_CSV = TIKTOK / "videos.csv"
METADATA_DIR = TIKTOK / "metadata"
OEMBED_DIR = METADATA_DIR / "oembed"
TITLES_CSV = METADATA_DIR / "titles.csv"

FIELDNAMES = [
    "video_id",
    "creator_id",
    "url",
    "status",
    "title_source",
    "source_title_raw",
    "source_title_full",
    "source_payload_path",
    "enriched_at",
    "error",
]


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in FIELDNAMES})
    tmp.replace(path)


def is_truncated(value: str | None) -> bool:
    text = (value or "").strip()
    return text.endswith("...") or text.endswith("…")


def rel_kb(path: Path) -> str:
    return str(path.relative_to(KB)).replace("\\", "/")


def fetch_oembed(video_url: str, timeout: float) -> dict:
    endpoint = f"https://www.tiktok.com/oembed?url={quote(video_url, safe='')}"
    req = Request(
        endpoint,
        headers={
            "User-Agent": "Base2026KnowledgeBot/1.0 (+local research archive)",
            "Accept": "application/json",
        },
    )
    with urlopen(req, timeout=timeout) as res:
        try:
            body = res.read()
        except IncompleteRead as exc:
            body = exc.partial
        return json.loads(body.decode("utf-8", errors="replace"))


def title_from_payload(payload: dict) -> str:
    return str(payload.get("title") or "").replace("\n", " ").strip()


def main() -> int:
    parser = argparse.ArgumentParser(description="Free TikTok metadata enrichment via official oEmbed.")
    parser.add_argument("--limit", type=int, default=0, help="Max videos to attempt. 0 means no limit.")
    parser.add_argument("--all", action="store_true", help="Include out-of-scope old videos.")
    parser.add_argument("--force", action="store_true", help="Refresh existing ok rows.")
    parser.add_argument("--only-truncated", action="store_true", help="Only enrich rows whose inventory title ends with ellipsis.")
    parser.add_argument("--sleep", type=float, default=0.25, help="Delay between requests.")
    parser.add_argument("--timeout", type=float, default=15.0, help="HTTP timeout seconds.")
    args = parser.parse_args()

    videos = read_csv(VIDEOS_CSV)
    existing = {row.get("video_id", ""): row for row in read_csv(TITLES_CSV) if row.get("video_id")}
    attempted = ok = skipped = failed = 0

    for video in videos:
        video_id = video.get("video_id", "").strip()
        if not video_id:
            continue
        if not args.all and (video.get("transcript_status") or "") == "out_of_scope_old":
            continue
        if args.only_truncated and not is_truncated(video.get("title_or_description")):
            continue
        if not args.force and existing.get(video_id, {}).get("status") == "ok":
            skipped += 1
            continue
        if args.limit and attempted >= args.limit:
            break

        attempted += 1
        now = datetime.now().isoformat(timespec="seconds")
        payload_path = OEMBED_DIR / f"{video_id}.json"
        row = {
            "video_id": video_id,
            "creator_id": video.get("creator_id", ""),
            "url": video.get("url", ""),
            "status": "error",
            "title_source": "tiktok_oembed",
            "source_title_raw": video.get("title_or_description", ""),
            "source_title_full": "",
            "source_payload_path": "",
            "enriched_at": now,
            "error": "",
        }
        try:
            payload = fetch_oembed(video.get("url", ""), args.timeout)
            title = title_from_payload(payload)
            payload_path.parent.mkdir(parents=True, exist_ok=True)
            payload_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
            row.update(
                {
                    "status": "ok" if title else "empty_title",
                    "source_title_full": title,
                    "source_payload_path": rel_kb(payload_path),
                    "error": "" if title else "oEmbed returned no title",
                }
            )
            ok += 1 if title else 0
            failed += 0 if title else 1
        except HTTPError as exc:
            row["status"] = f"http_{exc.code}"
            row["error"] = str(exc.reason or exc)
            failed += 1
        except (URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
            row["status"] = "error"
            row["error"] = str(exc)[:500]
            failed += 1

        existing[video_id] = row
        if attempted % 25 == 0:
            write_csv(TITLES_CSV, sorted(existing.values(), key=lambda r: (r.get("creator_id", ""), r.get("video_id", ""))))
        if args.sleep:
            time.sleep(args.sleep)

    rows = sorted(existing.values(), key=lambda r: (r.get("creator_id", ""), r.get("video_id", "")))
    write_csv(TITLES_CSV, rows)
    print(f"attempted={attempted} ok={ok} failed={failed} skipped={skipped} rows={len(rows)} output={TITLES_CSV}")
    return 0 if failed == 0 or ok > 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
