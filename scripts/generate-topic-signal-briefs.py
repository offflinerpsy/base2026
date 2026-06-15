#!/usr/bin/env python3
"""Generate deterministic public topic signal briefs from Base2026 JSONL."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


GENERATOR_VERSION = "signal-briefs-v1"


def read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True))
            handle.write("\n")


def compact(value: object, limit: int = 180) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    if len(text) <= limit:
        return text
    clipped = text[: max(0, limit - 1)].rsplit(" ", 1)[0].strip()
    return f"{clipped}…" if clipped else text[:limit]


def slug_label(topic_id: str) -> str:
    return compact(topic_id.replace("-", " ").replace("_", " ").title(), 80)


def source_key(row: dict) -> str:
    return row.get("source_id") or row.get("item_id") or ""


def source_item_id(row: dict) -> str:
    return row.get("item_id") or row.get("source_id") or ""


def source_date(row: dict) -> str:
    return row.get("published_date") or row.get("published_at") or row.get("captured_at") or ""


def month_key(value: str) -> str:
    match = re.match(r"^(\d{4}-\d{2})", str(value or ""))
    return match.group(1) if match else ""


def freshness_score(latest_date: str) -> int:
    if not latest_date:
        return 0
    try:
        latest = datetime.fromisoformat(latest_date[:10]).replace(tzinfo=timezone.utc)
    except ValueError:
        return 0
    days = max(0, (datetime.now(timezone.utc) - latest).days)
    if days <= 14:
        return 100
    if days <= 30:
        return 90
    if days <= 90:
        return 70
    if days <= 180:
        return 45
    return 25


def status_for(topic: dict) -> str:
    source_count = int(topic.get("source_count") or topic.get("public_source_count") or 0)
    creator_count = int(topic.get("creator_count") or 0)
    public_insight_count = int(topic.get("public_insight_count") or 0)
    if source_count >= 5 and creator_count >= 2 and public_insight_count >= 3:
        return "strong"
    if source_count >= 3 and creator_count >= 2:
        return "medium"
    return "weak"


TACTIC_PATTERNS = [
    (
        re.compile(r"\binternal link|contextual link|link(s|ing)?\b|footer\b", re.I),
        "Use internal links to route authority and context toward priority pages.",
    ),
    (
        re.compile(r"\btitle|h1|meta|slug|url|keyword|opening sentence\b", re.I),
        "Put target query language in the core on-page fields readers and crawlers inspect.",
    ),
    (
        re.compile(r"\bschema|structured data|entity|knowledge graph\b", re.I),
        "Make entities and page meaning explicit with structured, visible context.",
    ),
    (
        re.compile(r"\breview|citation|profile|google business|gbp\b", re.I),
        "Strengthen off-site trust signals through reviews, citations, and business profiles.",
    ),
    (
        re.compile(r"\banswer|faq|question|direct response|service page\b", re.I),
        "Rewrite key pages so they answer buyer questions directly.",
    ),
    (
        re.compile(r"\bautomation|tool|workflow|ai workflow|process\b", re.I),
        "Use tools and workflows to make repeatable visibility work easier to execute.",
    ),
]


KNOWN_TOOLS = [
    "Google Search Console",
    "Google Business Profile",
    "Rank Math",
    "Moz",
    "Ahrefs",
    "Semrush",
    "ChatGPT",
    "Claude",
    "Gemini",
    "Perplexity",
    "Bing",
    "YouTube",
    "Instagram",
    "TikTok",
]


def topic_source_ids(topic_id: str, insights: list[dict], sources: list[dict], passages: list[dict]) -> set[str]:
    ids = {
        source_key(row)
        for row in insights
        if row.get("public") and (row.get("topic_id") or "") == topic_id and source_key(row)
    }
    ids.update(
        source_key(row)
        for row in sources
        if topic_id in (row.get("topics") or []) and source_key(row)
    )
    ids.update(
        source_key(row)
        for row in passages
        if topic_id in (row.get("topics") or []) and source_key(row)
    )
    return ids


def representative_text(row: dict) -> str:
    return compact(
        row.get("suggested_action")
        or row.get("claim_text")
        or row.get("source_summary_short")
        or row.get("title")
        or row.get("excerpt"),
        150,
    )


def build_creator_angles(topic_id: str, sources_for_topic: list[dict], insights_for_topic: list[dict], creators_by_handle: dict[str, dict]) -> list[dict]:
    by_creator: dict[str, list[dict]] = defaultdict(list)
    for insight in insights_for_topic:
        handle = insight.get("creator_handle") or insight.get("handle") or ""
        if handle:
            by_creator[handle].append(insight)
    for source in sources_for_topic:
        handle = source.get("creator_handle") or source.get("handle") or ""
        if handle:
            by_creator.setdefault(handle, [])

    rows = []
    source_by_id = {source_key(row): row for row in sources_for_topic}
    for handle, insight_rows in sorted(by_creator.items(), key=lambda item: (-len(item[1]), item[0])):
        source_ids = []
        for insight in insight_rows:
            sid = source_key(insight)
            if sid and sid not in source_ids:
                source_ids.append(sid)
        if not source_ids:
            source_ids = [
                source_key(row)
                for row in sources_for_topic
                if (row.get("creator_handle") or row.get("handle")) == handle and source_key(row)
            ][:3]
        latest = ""
        dates = [source_date(source_by_id.get(sid, {})) for sid in source_ids]
        dates = [date for date in dates if date]
        if dates:
            latest = max(dates)
        display_name = creators_by_handle.get(handle, {}).get("display_name") or handle
        rows.append(
            {
                "creator_handle": handle,
                "creator_display_name": display_name,
                "source_count": sum(1 for row in sources_for_topic if (row.get("creator_handle") or row.get("handle")) == handle),
                "public_insight_count": len(insight_rows),
                "main_angle": representative_text(insight_rows[0] if insight_rows else next((row for row in sources_for_topic if (row.get("creator_handle") or row.get("handle")) == handle), {})),
                "representative_source_ids": source_ids[:3],
                "latest_source_date": latest,
            }
        )
    return rows[:6]


def build_repeated_tactics(insights_for_topic: list[dict]) -> list[dict]:
    buckets: dict[str, dict] = {}
    for row in insights_for_topic:
        text = " ".join([str(row.get("claim_text") or ""), str(row.get("suggested_action") or ""), str(row.get("evidence_excerpt") or "")])
        for pattern, label in TACTIC_PATTERNS:
            if pattern.search(text):
                bucket = buckets.setdefault(label, {"label": label, "source_ids": set(), "creator_handles": set()})
                if source_key(row):
                    bucket["source_ids"].add(source_key(row))
                if row.get("creator_handle"):
                    bucket["creator_handles"].add(row.get("creator_handle"))
    rows = []
    for bucket in buckets.values():
        if len(bucket["source_ids"]) < 2:
            continue
        rows.append(
            {
                "label": bucket["label"],
                "supporting_creator_count": len(bucket["creator_handles"]),
                "supporting_source_count": len(bucket["source_ids"]),
                "source_ids": sorted(bucket["source_ids"])[:8],
            }
        )
    return sorted(rows, key=lambda row: (-row["supporting_creator_count"], -row["supporting_source_count"], row["label"]))[:3]


def build_source_actions(insights_for_topic: list[dict], sources_by_id: dict[str, dict]) -> list[dict]:
    rows = []
    seen = set()
    for insight in insights_for_topic:
        action = compact(insight.get("suggested_action") or "", 150)
        if not action:
            continue
        sid = source_key(insight)
        source_ref = source_item_id(sources_by_id.get(sid, {})) or sid
        creator = insight.get("creator_handle") or ""
        key = re.sub(r"[^a-z0-9]+", " ", action.lower()).strip()[:90]
        if not sid or key in seen:
            continue
        seen.add(key)
        rows.append({"action": action, "source_ids": [source_ref], "creator_handles": [creator] if creator else []})
    return rows[:3]


def build_tools(insights_for_topic: list[dict], sources_for_topic: list[dict]) -> list[str]:
    haystack = "\n".join(
        str(row.get(key) or "")
        for row in [*insights_for_topic, *sources_for_topic]
        for key in ("claim_text", "suggested_action", "evidence_excerpt", "title", "excerpt", "source_summary_short")
    )
    return [tool for tool in KNOWN_TOOLS if re.search(rf"\b{re.escape(tool)}\b", haystack, re.I)]


def build_monthly_activity(sources_for_topic: list[dict], insights_for_topic: list[dict]) -> list[dict]:
    sources_by_month: dict[str, set[str]] = defaultdict(set)
    creators_by_month: dict[str, set[str]] = defaultdict(set)
    insights_by_month: Counter[str] = Counter()
    for source in sources_for_topic:
        month = month_key(source_date(source))
        if not month:
            continue
        sources_by_month[month].add(source_key(source))
        handle = source.get("creator_handle") or source.get("handle")
        if handle:
            creators_by_month[month].add(handle)
    for insight in insights_for_topic:
        month = month_key(insight.get("published_at") or insight.get("published_date") or "")
        if month:
            insights_by_month[month] += 1
    months = sorted(set(sources_by_month) | set(creators_by_month) | set(insights_by_month))
    return [
        {
            "month": month,
            "source_count": len(sources_by_month.get(month, set())),
            "creator_count": len(creators_by_month.get(month, set())),
            "public_insight_count": insights_by_month.get(month, 0),
        }
        for month in months
    ]


def build_top_sources(sources_for_topic: list[dict], insights_for_topic: list[dict]) -> list[dict]:
    insight_counts = Counter(source_key(row) for row in insights_for_topic if source_key(row))
    rows = sorted(
        sources_for_topic,
        key=lambda row: (insight_counts.get(source_key(row), 0), source_date(row) or "", source_key(row)),
        reverse=True,
    )
    out = []
    for row in rows[:5]:
        out.append(
            {
                "source_id": source_key(row),
                "item_id": source_item_id(row),
                "creator_handle": row.get("creator_handle") or row.get("handle") or "",
                "published_date": source_date(row),
                "title": compact(row.get("source_summary_short") or row.get("title") or row.get("excerpt"), 140),
                "public_insight_count": insight_counts.get(source_key(row), 0),
            }
        )
    return out


def generate(data: Path, max_topics: int) -> list[dict]:
    sources = read_jsonl(data / "source_records.jsonl")
    passages = read_jsonl(data / "passages.jsonl")
    insights = read_jsonl(data / "insight_cards.jsonl")
    topics = read_jsonl(data / "topics.jsonl")
    creators = read_jsonl(data / "creators.jsonl")

    creators_by_handle = {
        row.get("handle") or row.get("creator_handle") or row.get("creator_id"): row
        for row in creators
    }
    sources_by_id = {source_key(row): row for row in sources if source_key(row)}
    insights_by_topic: dict[str, list[dict]] = defaultdict(list)
    for insight in insights:
        topic_id = insight.get("topic_id") or ""
        if topic_id and insight.get("public"):
            insights_by_topic[topic_id].append(insight)

    rows = []
    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    public_topics = [topic for topic in topics if topic.get("public")]
    public_topics.sort(
        key=lambda row: (
            -int(row.get("public_insight_count") or 0),
            -int(row.get("source_count") or 0),
            row.get("topic") or "",
        )
    )
    for topic in public_topics:
        topic_id = topic.get("topic_id") or ""
        if not topic_id:
            continue
        status = status_for(topic)
        if status != "strong":
            continue
        topic_insights = insights_by_topic.get(topic_id, [])
        ids = topic_source_ids(topic_id, topic_insights, sources, passages)
        sources_for_topic = [sources_by_id[sid] for sid in ids if sid in sources_by_id]
        if not sources_for_topic or not topic_insights:
            continue
        dates = [source_date(row) for row in sources_for_topic if source_date(row)]
        first_date = min(dates) if dates else ""
        latest_date = max(dates) if dates else topic.get("latest_published_at") or ""
        creator_handles = {
            row.get("creator_handle") or row.get("handle")
            for row in sources_for_topic
            if row.get("creator_handle") or row.get("handle")
        }
        topic_label = topic.get("topic") or slug_label(topic_id)
        creator_angles = build_creator_angles(topic_id, sources_for_topic, topic_insights, creators_by_handle)
        rows.append(
            {
                "topic_id": topic_id,
                "topic_label": topic_label,
                "status": status,
                "robots": "index,follow",
                "source_count": len(ids),
                "creator_count": len(creator_handles),
                "public_insight_count": len(topic_insights),
                "passage_count": int(topic.get("passage_count") or 0),
                "latest_source_date": latest_date,
                "first_source_date": first_date,
                "freshness_score": freshness_score(latest_date),
                "creator_angles": creator_angles,
                "repeated_tactics": build_repeated_tactics(topic_insights),
                "source_backed_actions": build_source_actions(topic_insights, sources_by_id),
                "different_angles": [
                    {
                        "label": f"Different creator emphases around {topic_label}",
                        "creator_handles": sorted(creator_handles),
                        "source_ids": sorted(ids)[:8],
                    }
                ] if len(creator_handles) >= 2 else [],
                "tools_mentioned": build_tools(topic_insights, sources_for_topic),
                "monthly_activity": build_monthly_activity(sources_for_topic, topic_insights),
                "top_sources": build_top_sources(sources_for_topic, topic_insights),
                "related_topics": [],
                "generated_at": generated_at,
                "generator_version": GENERATOR_VERSION,
            }
        )
        if len(rows) >= max_topics:
            break
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate deterministic Base2026 topic signal briefs.")
    parser.add_argument("--data", type=Path, default=Path("public-data/tiktok"))
    parser.add_argument("--out", type=Path, default=Path("public-data/tiktok/topic_signal_briefs.jsonl"))
    parser.add_argument("--max-topics", type=int, default=50)
    args = parser.parse_args()

    rows = generate(args.data, args.max_topics)
    write_jsonl(args.out, rows)
    print(json.dumps({"topic_signal_briefs": len(rows), "out": str(args.out)}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
