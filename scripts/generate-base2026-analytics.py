from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


def read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def clean_handle(value: object) -> str:
    handle = str(value or "").strip()
    if not handle:
        return ""
    return handle if handle.startswith("@") else f"@{handle.lstrip('@')}"


def topic_label(topic_id: str, labels: dict[str, str]) -> str:
    return labels.get(topic_id) or topic_id.replace("-", " ").title()


def build_analytics(data: Path) -> dict:
    sources = read_jsonl(data / "source_records.jsonl")
    passages = read_jsonl(data / "passages.jsonl")
    insights = read_jsonl(data / "insight_cards.jsonl")
    topics = read_jsonl(data / "topics.jsonl")
    creators = read_jsonl(data / "creators.jsonl")
    signal_briefs = read_jsonl(data / "topic_signal_briefs.jsonl")

    topic_rows = {row.get("topic_id") or row.get("id") or "": row for row in topics}
    topic_labels = {
        topic_id: row.get("topic") or row.get("topic_id") or topic_id
        for topic_id, row in topic_rows.items()
        if topic_id
    }
    signal_topics = {row.get("topic_id") for row in signal_briefs if row.get("topic_id")}

    creator_rows = {
        clean_handle(row.get("handle") or row.get("creator_handle") or row.get("creator_id")): row
        for row in creators
    }

    source_ids_by_topic: dict[str, set[str]] = defaultdict(set)
    creator_handles_by_topic: dict[str, set[str]] = defaultdict(set)
    passages_by_topic: Counter[str] = Counter()
    insights_by_topic: Counter[str] = Counter()
    sources_by_creator: Counter[str] = Counter()
    insights_by_creator: Counter[str] = Counter()
    topics_by_creator: dict[str, set[str]] = defaultdict(set)
    latest_by_creator: dict[str, str] = {}
    sources_by_year: Counter[str] = Counter()

    for source in sources:
        source_id = source.get("item_id") or source.get("source_id") or ""
        handle = clean_handle(source.get("creator_handle") or source.get("handle"))
        if handle:
            sources_by_creator[handle] += 1
            date = str(source.get("published_date") or source.get("published_at") or "")
            if date and date > latest_by_creator.get(handle, ""):
                latest_by_creator[handle] = date
        year = str(source.get("year") or "")[:4]
        if year:
            sources_by_year[year] += 1
        for topic_id in source.get("topics") or []:
            if not topic_id:
                continue
            source_ids_by_topic[topic_id].add(source_id)
            if handle:
                creator_handles_by_topic[topic_id].add(handle)
                topics_by_creator[handle].add(topic_id)

    for passage in passages:
        source_id = passage.get("item_id") or passage.get("source_id") or ""
        handle = clean_handle(passage.get("creator_handle") or passage.get("handle"))
        for topic_id in passage.get("topics") or []:
            if not topic_id:
                continue
            passages_by_topic[topic_id] += 1
            if source_id:
                source_ids_by_topic[topic_id].add(source_id)
            if handle:
                creator_handles_by_topic[topic_id].add(handle)

    for insight in insights:
        if not insight.get("public"):
            continue
        topic_id = insight.get("topic_id") or ""
        handle = clean_handle(insight.get("creator_handle"))
        if topic_id:
            insights_by_topic[topic_id] += 1
            if handle:
                creator_handles_by_topic[topic_id].add(handle)
        if handle:
            insights_by_creator[handle] += 1

    top_topics = []
    for topic_id in set(topic_rows) | set(source_ids_by_topic) | set(insights_by_topic):
        if not topic_id:
            continue
        row = topic_rows.get(topic_id, {})
        source_count = int(row.get("public_source_count") or row.get("source_count") or len(source_ids_by_topic[topic_id]) or 0)
        creator_count = int(row.get("creator_count") or len(creator_handles_by_topic[topic_id]) or 0)
        public_insight_count = int(row.get("public_insight_count") or insights_by_topic[topic_id] or 0)
        passage_count = int(row.get("passage_count") or passages_by_topic[topic_id] or 0)
        signal_score = source_count * 2 + creator_count * 4 + public_insight_count * 3 + passage_count
        top_topics.append(
            {
                "topic_id": topic_id,
                "label": topic_label(topic_id, topic_labels),
                "source_count": source_count,
                "creator_count": creator_count,
                "public_insight_count": public_insight_count,
                "passage_count": passage_count,
                "signal_score": signal_score,
                "has_signal_brief": topic_id in signal_topics,
            }
        )
    top_topics.sort(key=lambda row: (-row["signal_score"], row["label"].lower()))

    top_creators = []
    for handle, source_count in sources_by_creator.items():
        row = creator_rows.get(handle, {})
        top_creators.append(
            {
                "handle": handle,
                "avatar_url": row.get("avatar_url") or "",
                "creator_url": row.get("url") or row.get("creator_url") or "",
                "source_count": source_count,
                "public_insight_count": insights_by_creator[handle],
                "topic_count": len(topics_by_creator[handle]),
                "latest_published_at": latest_by_creator.get(handle, ""),
            }
        )
    top_creators.sort(key=lambda row: (-row["source_count"], row["handle"].lower()))

    latest_sources = sorted(
        [
            {
                "item_id": row.get("item_id") or "",
                "title": row.get("title") or row.get("source_summary_short") or row.get("excerpt") or "",
                "creator_handle": clean_handle(row.get("creator_handle") or row.get("handle")),
                "published_date": row.get("published_date") or row.get("published_at") or "",
                "topics": row.get("topics") or [],
                "topic_labels": row.get("topic_labels") or [],
            }
            for row in sources
        ],
        key=lambda row: (row["published_date"], row["item_id"]),
        reverse=True,
    )[:24]

    return {
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "totals": {
            "source_records": len(sources),
            "passages": len(passages),
            "creators": len(creators),
            "topics": len(topics),
            "public_topics": sum(1 for row in topics if row.get("public")),
            "public_insight_cards": sum(1 for row in insights if row.get("public")),
            "signal_briefs": len(signal_briefs),
        },
        "top_topics": top_topics[:80],
        "top_creators": top_creators,
        "sources_by_year": [{"year": year, "source_count": count} for year, count in sorted(sources_by_year.items(), reverse=True)],
        "latest_sources": latest_sources,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate public Base2026 analytics from public JSONL only.")
    parser.add_argument("--data", type=Path, default=Path("public-data/tiktok"))
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    payload = build_analytics(args.data)
    write_json(args.out, payload)
    print(json.dumps({"analytics": str(args.out), "topics": len(payload["top_topics"]), "creators": len(payload["top_creators"])}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
