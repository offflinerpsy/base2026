from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "12_knowledge-base" / "indexes" / "kb.sqlite"
MEILI_URL = "http://127.0.0.1:7700"
INDEX = "base2026_chunks"


def request(method: str, path: str, payload: object | None = None) -> dict:
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = Request(
        f"{MEILI_URL}{path}",
        data=body,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    with urlopen(req, timeout=30) as res:
        raw = res.read().decode("utf-8", errors="replace")
        return json.loads(raw) if raw else {}


def wait_for_meili() -> None:
    for _ in range(60):
        try:
            request("GET", "/health")
            return
        except (HTTPError, URLError, TimeoutError):
            time.sleep(1)
    raise RuntimeError("Meilisearch is not reachable at http://127.0.0.1:7700")


def rows() -> list[dict]:
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    try:
        output = []
        for row in con.execute(
            """
            SELECT
              c.chunk_id AS id,
              c.item_id,
              c.chunk_index,
              c.text AS body,
              i.source_type,
              i.canonical_url,
              i.title,
              i.author,
              i.published_at,
              substr(i.published_at, 1, 4) AS year,
              cr.handle,
              cr.url AS creator_url,
              COALESCE(te.status, '') AS title_status,
              COALESCE(te.title_source, '') AS title_source
            FROM chunks c
            JOIN generic_items i ON i.item_id = c.item_id
            LEFT JOIN creators cr ON cr.creator_id = i.author
            LEFT JOIN item_title_enrichment te ON te.item_id = i.item_id
            ORDER BY i.published_at DESC, c.item_id, c.chunk_index
            """
        ):
            doc = dict(row)
            doc["published_date"] = (doc.get("published_at") or "")[:10]
            doc["platform"] = "tiktok" if doc.get("source_type") == "tiktok_video" else "local"
            doc["handle"] = doc.get("handle") or doc.get("author") or "Base2026"
            output.append(doc)
        return output
    finally:
        con.close()


def main() -> int:
    wait_for_meili()
    docs = rows()
    request("DELETE", f"/indexes/{INDEX}")
    request("POST", "/indexes", {"uid": INDEX, "primaryKey": "id"})
    request(
        "PATCH",
        f"/indexes/{INDEX}/settings",
        {
            "displayedAttributes": ["*"],
            "searchableAttributes": ["body", "title", "handle", "author", "source_type"],
            "filterableAttributes": ["source_type", "platform", "author", "handle", "year", "published_date"],
            "sortableAttributes": ["published_date", "year"],
            "rankingRules": ["words", "typo", "proximity", "attribute", "sort", "exactness"],
            "pagination": {"maxTotalHits": 5000},
        },
    )
    task = request("POST", f"/indexes/{INDEX}/documents", docs)
    print(f"indexed={len(docs)} index={INDEX} task={task.get('taskUid')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
