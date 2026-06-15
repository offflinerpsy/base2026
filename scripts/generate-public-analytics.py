from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as file:
        for line in file:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def clean_handle(value: object) -> str:
    handle = str(value or "").strip()
    if not handle:
        return ""
    return handle if handle.startswith("@") else f"@{handle.lstrip('@')}"


def compact_text(value: object, limit: int = 140) -> str:
    text = " ".join(str(value or "").split())
    if len(text) <= limit:
        return text
    return text[: limit - 3].rstrip() + "..."


def topic_label(topic_id: str, labels: dict[str, str]) -> str:
    return labels.get(topic_id) or topic_id.replace("-", " ").title()


def build_summary(data: Path) -> dict[str, Any]:
    manifest = read_json(data / "manifest.json")
    sources = read_jsonl(data / "source_records.jsonl")
    passages = read_jsonl(data / "passages.jsonl")
    topics = read_jsonl(data / "topics.jsonl")
    creators = read_jsonl(data / "creators.jsonl")
    insights = read_jsonl(data / "insight_cards.jsonl")
    signal_briefs = read_jsonl(data / "topic_signal_briefs.jsonl")

    topic_rows = {
        str(row.get("topic_id") or row.get("id") or "").removeprefix("topic:"): row
        for row in topics
        if row.get("topic_id") or row.get("id")
    }
    labels = {
        topic_id: str(row.get("topic") or row.get("label") or topic_id)
        for topic_id, row in topic_rows.items()
    }
    creator_rows = {
        clean_handle(row.get("handle") or row.get("creator_handle") or row.get("creator_id")): row
        for row in creators
    }
    strong_topics = {
        str(row.get("topic_id") or "")
        for row in signal_briefs
        if row.get("topic_id")
    }

    source_ids_by_topic: dict[str, set[str]] = defaultdict(set)
    creator_handles_by_topic: dict[str, set[str]] = defaultdict(set)
    passage_count_by_topic: Counter[str] = Counter()
    insight_count_by_topic: Counter[str] = Counter()
    source_count_by_creator: Counter[str] = Counter()
    insight_count_by_creator: Counter[str] = Counter()
    topic_ids_by_creator: dict[str, set[str]] = defaultdict(set)
    latest_by_creator: dict[str, str] = {}
    monthly_sources: Counter[str] = Counter()
    yearly_sources: Counter[str] = Counter()

    for row in sources:
        source_id = str(row.get("item_id") or row.get("source_id") or "")
        handle = clean_handle(row.get("creator_handle") or row.get("handle"))
        published = str(row.get("published_date") or row.get("published_at") or "")
        if published[:7]:
            monthly_sources[published[:7]] += 1
        if published[:4]:
            yearly_sources[published[:4]] += 1
        if handle:
            source_count_by_creator[handle] += 1
            if published and published > latest_by_creator.get(handle, ""):
                latest_by_creator[handle] = published
        for topic_id in row.get("topics") or []:
            if not topic_id:
                continue
            topic_id = str(topic_id)
            if source_id:
                source_ids_by_topic[topic_id].add(source_id)
            if handle:
                creator_handles_by_topic[topic_id].add(handle)
                topic_ids_by_creator[handle].add(topic_id)

    for row in passages:
        source_id = str(row.get("item_id") or row.get("source_id") or "")
        handle = clean_handle(row.get("creator_handle") or row.get("handle"))
        for topic_id in row.get("topics") or []:
            if not topic_id:
                continue
            topic_id = str(topic_id)
            passage_count_by_topic[topic_id] += 1
            if source_id:
                source_ids_by_topic[topic_id].add(source_id)
            if handle:
                creator_handles_by_topic[topic_id].add(handle)

    for row in insights:
        if not row.get("public"):
            continue
        topic_id = str(row.get("topic_id") or "")
        handle = clean_handle(row.get("creator_handle") or row.get("handle"))
        if topic_id:
            insight_count_by_topic[topic_id] += 1
            if handle:
                creator_handles_by_topic[topic_id].add(handle)
                topic_ids_by_creator[handle].add(topic_id)
        if handle:
            insight_count_by_creator[handle] += 1

    topic_summary: list[dict[str, Any]] = []
    for topic_id in sorted(set(topic_rows) | set(source_ids_by_topic) | set(insight_count_by_topic)):
        if not topic_id:
            continue
        row = topic_rows.get(topic_id, {})
        source_count = int(row.get("public_source_count") or row.get("source_count") or len(source_ids_by_topic[topic_id]) or 0)
        creator_count = int(row.get("creator_count") or len(creator_handles_by_topic[topic_id]) or 0)
        insight_count = int(row.get("public_insight_count") or insight_count_by_topic[topic_id] or 0)
        passage_count = int(row.get("passage_count") or passage_count_by_topic[topic_id] or 0)
        signal_score = source_count * 2 + creator_count * 4 + insight_count * 3 + passage_count
        if topic_id in strong_topics:
            signal_score += 20
        topic_summary.append(
            {
                "topic_id": topic_id,
                "topic": topic_label(topic_id, labels),
                "label": topic_label(topic_id, labels),
                "source_count": source_count,
                "creator_count": creator_count,
                "passage_count": passage_count,
                "public_insight_count": insight_count,
                "signal_score": signal_score,
                "has_signal_brief": topic_id in strong_topics,
            }
        )
    topic_summary.sort(key=lambda row: (-int(row["signal_score"]), str(row["topic"]).lower()))

    creator_summary: list[dict[str, Any]] = []
    for handle, source_count in source_count_by_creator.items():
        row = creator_rows.get(handle, {})
        creator_summary.append(
            {
                "handle": handle,
                "avatar_url": row.get("avatar_url") or "",
                "creator_url": row.get("url") or row.get("creator_url") or "",
                "source_count": int(source_count),
                "public_insight_count": int(insight_count_by_creator[handle]),
                "topic_count": len(topic_ids_by_creator[handle]),
                "latest_published_at": latest_by_creator.get(handle, ""),
            }
        )
    creator_summary.sort(key=lambda row: (-int(row["source_count"]), str(row["handle"]).lower()))

    latest_sources = sorted(
        [
            {
                "item_id": row.get("item_id") or "",
                "title": compact_text(row.get("title") or row.get("source_summary_short") or row.get("excerpt"), 120),
                "creator_handle": clean_handle(row.get("creator_handle") or row.get("handle")),
                "published_date": row.get("published_date") or row.get("published_at") or "",
                "topics": row.get("topics") or [],
                "topic_labels": row.get("topic_labels") or [],
            }
            for row in sources
        ],
        key=lambda row: (str(row["published_date"]), str(row["item_id"])),
        reverse=True,
    )[:24]

    totals = {
        "source_records": len(sources) or manifest.get("documents"),
        "documents": len(sources) or manifest.get("documents"),
        "passages": len(passages) or manifest.get("chunks"),
        "creators": len(creators) or manifest.get("creators"),
        "topics": len(topics) or manifest.get("topics"),
        "public_topics": sum(1 for row in topics if row.get("public")) or None,
        "public_insight_cards": sum(1 for row in insights if row.get("public")) or manifest.get("public_insight_cards"),
        "strong_topic_signals": len(strong_topics),
        "signal_briefs": len(strong_topics),
    }
    totals = {key: value for key, value in totals.items() if value is not None}

    return {
        "schema": "base2026.analytics_summary.v1",
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "totals": totals,
        "topics": topic_summary[:120],
        "creators": creator_summary,
        "strong_topic_signals": [row for row in topic_summary if row["has_signal_brief"]][:50],
        "monthly_sources": [
            {"month": month, "source_count": count}
            for month, count in sorted(monthly_sources.items(), reverse=True)
        ],
        "latest_sources": latest_sources,
        "lookups": {
            "topics": {row["topic_id"]: row for row in topic_summary[:500]},
            "creators": {row["handle"]: row for row in creator_summary},
        },
        "top_topics": topic_summary[:120],
        "top_creators": creator_summary,
        "sources_by_year": [
            {"year": year, "source_count": count}
            for year, count in sorted(yearly_sources.items(), reverse=True)
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate compact public Base2026 analytics from public JSONL artifacts.")
    parser.add_argument("--data", type=Path, default=Path("public-data/tiktok"))
    parser.add_argument("--out", "--out-json", dest="out", type=Path, required=True)
    args = parser.parse_args()

    payload = build_summary(args.data)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"analytics_summary": str(args.out), "topics": len(payload["topics"]), "creators": len(payload["creators"])}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
