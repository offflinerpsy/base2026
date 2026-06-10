from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "public-data" / "tiktok" / "chunks.jsonl"


def request(base_url: str, method: str, path: str, payload: object | None = None, master_key: str = "") -> dict:
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {"Content-Type": "application/json"}
    if master_key:
        headers["Authorization"] = f"Bearer {master_key}"
    req = Request(f"{base_url.rstrip('/')}{path}", data=body, method=method, headers=headers)
    with urlopen(req, timeout=60) as res:
        raw = res.read().decode("utf-8", errors="replace")
        return json.loads(raw) if raw else {}


def wait_for_meili(base_url: str, master_key: str) -> None:
    for _ in range(60):
        try:
            request(base_url, "GET", "/health", master_key=master_key)
            return
        except (HTTPError, URLError, TimeoutError):
            time.sleep(1)
    raise RuntimeError(f"Meilisearch is not reachable at {base_url}")


def load_jsonl(path: Path) -> list[dict]:
    rows = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description="Index public TikTok export into Meilisearch.")
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--url", default="http://127.0.0.1:7700")
    parser.add_argument("--index", default="base2026_public_tiktok")
    parser.add_argument("--master-key", default="")
    args = parser.parse_args()
    master_key = args.master_key.strip()

    wait_for_meili(args.url, master_key)
    docs = load_jsonl(args.data)
    try:
        request(args.url, "DELETE", f"/indexes/{args.index}", master_key=master_key)
    except HTTPError as exc:
        if exc.code != 404:
            raise
    request(args.url, "POST", "/indexes", {"uid": args.index, "primaryKey": "id"}, master_key)
    request(
        args.url,
        "PATCH",
        f"/indexes/{args.index}/settings",
        {
            "displayedAttributes": ["*"],
            "searchableAttributes": ["body", "title", "topic_labels", "handle", "creator_id", "platform"],
            "filterableAttributes": ["platform", "source_type", "creator_id", "handle", "year", "published_date", "topics"],
            "sortableAttributes": ["published_date", "year"],
            "rankingRules": ["words", "typo", "proximity", "attribute", "sort", "exactness"],
            "pagination": {"maxTotalHits": 10000},
        },
        master_key,
    )
    task = request(args.url, "POST", f"/indexes/{args.index}/documents", docs, master_key)
    print(f"indexed={len(docs)} index={args.index} task={task.get('taskUid')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
