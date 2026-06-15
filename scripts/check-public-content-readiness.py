from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "public-data" / "tiktok"


def read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(path)
    rows: list[dict] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def source_has_public_text(row: dict) -> bool:
    return bool((row.get("public_source_text") or row.get("excerpt") or "").strip())


def source_has_topics(row: dict) -> bool:
    return bool(row.get("topics") or row.get("topic_labels"))


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Audit Base2026 public export for source-only records that have text but no public intelligence layer."
    )
    parser.add_argument("--data-root", type=Path, default=DATA_ROOT)
    parser.add_argument("--latest", type=int, default=0, help="Check only the newest N source records by published_at.")
    parser.add_argument("--fail", action="store_true", help="Exit non-zero when blocking source-only records are found.")
    args = parser.parse_args()

    sources = read_jsonl(args.data_root / "source_records.jsonl")
    insights = read_jsonl(args.data_root / "insight_cards.jsonl")
    public_insight_count = Counter(
        row.get("source_id")
        for row in insights
        if row.get("source_id") and row.get("public")
    )

    candidates = sorted(sources, key=lambda row: row.get("published_at") or "", reverse=True)
    if args.latest:
        candidates = candidates[: args.latest]

    blocked = []
    for source in candidates:
        source_id = source.get("source_id") or ""
        if not source_id or not source_has_public_text(source):
            continue
        if public_insight_count[source_id] or source_has_topics(source):
            continue
        blocked.append(
            {
                "source_id": source_id,
                "item_id": source.get("item_id") or "",
                "creator_handle": source.get("creator_handle") or source.get("handle") or "",
                "published_at": source.get("published_at") or "",
                "reason": "public_text_without_topics_or_public_insights",
            }
        )

    report = {
        "data_root": str(args.data_root),
        "sources_checked": len(candidates),
        "blocked_source_only_records": len(blocked),
        "blocked": blocked[:20],
        "policy": "Newest published sources should not ship as plain source text without at least one reviewed/public insight or topic assignment.",
    }
    print(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True))
    return 1 if args.fail and blocked else 0


if __name__ == "__main__":
    raise SystemExit(main())
