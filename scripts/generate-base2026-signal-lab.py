from __future__ import annotations

import argparse
import json
import math
import re
from collections import Counter, defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

SCHEMA = "base2026.signal_lab.v1"
PRESET_QUERIES = [
    ("ai-overviews", "AI Overviews", ["AI Overviews", "AI search", "AI visibility"]),
    ("schema", "Schema", ["schema", "structured data", "entity"]),
    ("entity-seo", "Entity SEO", ["entity", "knowledge graph", "brand"]),
    ("local-seo", "Local SEO", ["local SEO", "Google Business Profile", "GBP"]),
    ("chatgpt-seo", "ChatGPT SEO", ["ChatGPT", "AI recommendations", "citations"]),
    ("ai-agents", "AI agents", ["AI agents", "automation", "workflow"]),
    ("claude-code-codex", "Claude Code / Codex", ["Claude Code", "Codex", "coding agent"]),
    ("web-development-ai", "Web development with AI", ["web development", "AI workflow", "automation"]),
]
STOPWORDS = {
    "about", "above", "after", "again", "against", "also", "because", "been", "being", "between",
    "could", "does", "doing", "from", "have", "having", "into", "more", "most", "need", "only",
    "other", "same", "should", "source", "that", "their", "them", "then", "there", "these", "they",
    "this", "those", "through", "when", "where", "which", "while", "with", "would", "your", "the",
    "and", "for", "you", "are", "can", "how", "what", "why", "all", "not", "but", "our", "its",
}


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def clean_handle(value: object) -> str:
    handle = re.sub(r"\s+", "", str(value or "").strip()).lstrip("@")
    return f"@{handle}" if handle else ""


def clean_id(value: object) -> str:
    return str(value or "").strip().removeprefix("topic:")


def slug(value: str, fallback: str = "topic") -> str:
    out = "-".join(re.findall(r"[a-z0-9]+", (value or "").lower()))
    return out[:120] or fallback


def compact(value: object, limit: int = 160) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    if not limit or len(text) <= limit:
        return text
    return text[: max(0, limit - 3)].rsplit(" ", 1)[0].rstrip(" ,;:.") + "..."


def parse_date(value: object) -> date | None:
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")[:10]).date()
    except ValueError:
        return None


def month_key(value: object) -> str:
    text = str(value or "")
    return text[:7] if re.match(r"^\d{4}-\d{2}", text) else ""


def format_date(value: date | None) -> str:
    return value.isoformat() if value else ""


def source_id(row: dict[str, Any]) -> str:
    return str(row.get("item_id") or row.get("source_id") or row.get("id") or "")


def topic_label(topic_id: str, topics: dict[str, dict[str, Any]]) -> str:
    row = topics.get(topic_id, {})
    return str(row.get("topic") or row.get("label") or topic_id.replace("-", " ").title())


def topic_url(topic_id: str) -> str:
    return f"/knowledge/?topic={urlencode({'': topic_id})[1:]}"


def creator_url(handle: str) -> str:
    return f"/knowledge/?creator={urlencode({'': handle.lstrip('@')})[1:]}"


def source_url(value: str) -> str:
    return f"/knowledge/?source={urlencode({'': value})[1:]}"


def workspace_url(handle: str = "", topic_id: str = "", query: str = "") -> str:
    params: dict[str, str] = {}
    if query:
        params["q"] = query
    if handle:
        params["creator"] = handle.lstrip("@")
    if topic_id:
        params["topic"] = topic_id
    return "/knowledge/" + ("?" + urlencode(params) if params else "")


def score_log(count: int, max_count: int) -> float:
    if max_count <= 0:
        return 0.0
    return math.log1p(max(0, count)) / math.log1p(max_count)


def freshness(latest: date | None, today: date) -> float:
    if not latest:
        return 0.0
    return round(max(0.0, 1.0 - max(0, (today - latest).days) / 365.0), 4)


def tokens(*values: object) -> set[str]:
    joined = " ".join(str(v or "") for v in values).lower()
    out: set[str] = set()
    for token in re.findall(r"[a-z0-9]+", joined):
        if token in STOPWORDS or (len(token) < 3 and token != "ai"):
            continue
        for suffix in ("ing", "ed", "es", "s"):
            if len(token) > len(suffix) + 4 and token.endswith(suffix):
                token = token[: -len(suffix)]
                break
        if token and token not in STOPWORDS:
            out.add(token)
    return out


def build_signal_lab(data: Path) -> dict[str, Any]:
    manifest = read_json(data / "manifest.json")
    sources = read_jsonl(data / "source_records.jsonl") or read_jsonl(data / "documents.jsonl")
    documents = read_jsonl(data / "documents.jsonl")
    passages = read_jsonl(data / "passages.jsonl")
    insights = [row for row in read_jsonl(data / "insight_cards.jsonl") if row.get("public")]
    topic_rows = read_jsonl(data / "topics.jsonl")
    creator_rows = read_jsonl(data / "creators.jsonl")
    briefs = read_jsonl(data / "topic_signal_briefs.jsonl")
    analytics_summary = read_json(data / "analytics_summary.json")

    topics = {clean_id(row.get("topic_id") or row.get("id")): row for row in topic_rows if clean_id(row.get("topic_id") or row.get("id"))}
    creators = {clean_handle(row.get("handle") or row.get("creator_handle") or row.get("creator_id")): row for row in creator_rows if clean_handle(row.get("handle") or row.get("creator_handle") or row.get("creator_id"))}
    brief_by_topic = {clean_id(row.get("topic_id")): row for row in briefs if clean_id(row.get("topic_id"))}

    source_by_id: dict[str, dict[str, Any]] = {}
    for row in sources + documents:
        sid = source_id(row)
        if sid and sid not in source_by_id:
            source_by_id[sid] = row

    source_topics: dict[str, set[str]] = defaultdict(set)
    source_creators: dict[str, str] = {}
    source_dates: dict[str, date | None] = {}
    source_months: dict[str, str] = {}
    source_titles: dict[str, str] = {}
    for sid, row in source_by_id.items():
        handle = clean_handle(row.get("creator_handle") or row.get("handle"))
        source_creators[sid] = handle
        published = row.get("published_date") or row.get("published_at") or row.get("date")
        source_dates[sid] = parse_date(published)
        source_months[sid] = month_key(published)
        source_titles[sid] = compact(row.get("title") or row.get("source_summary_short") or row.get("excerpt") or row.get("public_source_text"), 110)
        for tid in row.get("topics") or []:
            if clean_id(tid):
                source_topics[sid].add(clean_id(tid))

    passage_count_by_source: Counter[str] = Counter()
    passage_count_by_topic: Counter[str] = Counter()
    topic_sources: dict[str, set[str]] = defaultdict(set)
    topic_creators: dict[str, set[str]] = defaultdict(set)
    creator_sources: dict[str, set[str]] = defaultdict(set)
    creator_topics: dict[str, set[str]] = defaultdict(set)
    creator_topic_sources: dict[tuple[str, str], set[str]] = defaultdict(set)
    creator_topic_passages: Counter[tuple[str, str]] = Counter()
    topic_month_sources: dict[tuple[str, str], set[str]] = defaultdict(set)

    for sid, row_topics in source_topics.items():
        handle = source_creators.get(sid, "")
        if handle:
            creator_sources[handle].add(sid)
        month = source_months.get(sid, "")
        for tid in row_topics:
            topic_sources[tid].add(sid)
            if handle:
                topic_creators[tid].add(handle)
                creator_topics[handle].add(tid)
                creator_topic_sources[(handle, tid)].add(sid)
            if month:
                topic_month_sources[(tid, month)].add(sid)

    for row in passages:
        sid = source_id(row)
        handle = clean_handle(row.get("creator_handle") or row.get("handle")) or source_creators.get(sid, "")
        row_topics = [clean_id(t) for t in (row.get("topics") or []) if clean_id(t)] or list(source_topics.get(sid, set()))
        if sid:
            passage_count_by_source[sid] += 1
        for tid in row_topics:
            passage_count_by_topic[tid] += 1
            if sid:
                topic_sources[tid].add(sid)
            if handle:
                topic_creators[tid].add(handle)
                creator_topics[handle].add(tid)
                creator_topic_passages[(handle, tid)] += 1

    topic_insights: dict[str, list[dict[str, Any]]] = defaultdict(list)
    creator_insights: dict[str, list[dict[str, Any]]] = defaultdict(list)
    creator_topic_insights: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for row in insights:
        tid = clean_id(row.get("topic_id") or slug(row.get("topic") or ""))
        handle = clean_handle(row.get("creator_handle") or row.get("handle"))
        sid = source_id(row)
        if tid:
            topic_insights[tid].append(row)
            if sid:
                topic_sources[tid].add(sid)
            if handle:
                topic_creators[tid].add(handle)
        if handle:
            creator_insights[handle].append(row)
        if handle and tid:
            creator_topic_insights[(handle, tid)].append(row)
            creator_topics[handle].add(tid)

    all_topic_ids = sorted(set(topics) | set(topic_sources) | set(topic_insights))
    max_sources = max([len(topic_sources[t]) for t in all_topic_ids] or [1])
    max_insights = max([len(topic_insights[t]) for t in all_topic_ids] or [1])
    max_passages = max([passage_count_by_topic[t] for t in all_topic_ids] or [1])
    today = datetime.now(timezone.utc).date()

    topic_stats: dict[str, dict[str, Any]] = {}
    for tid in all_topic_ids:
        sids = topic_sources[tid]
        latest = max([d for sid in sids if (d := source_dates.get(sid))], default=None)
        source_count = int(topics.get(tid, {}).get("public_source_count") or topics.get(tid, {}).get("source_count") or len(sids))
        creator_count = int(topics.get(tid, {}).get("creator_count") or len(topic_creators[tid]))
        public_insight_count = int(topics.get(tid, {}).get("public_insight_count") or len(topic_insights[tid]))
        passage_count = int(topics.get(tid, {}).get("passage_count") or passage_count_by_topic[tid])
        diversity = min(1.0, creator_count / max(1, min(len(creators) or creator_count or 1, 8)))
        evidence = round(
            0.35 * score_log(source_count, max_sources)
            + 0.25 * score_log(public_insight_count, max_insights)
            + 0.20 * score_log(passage_count, max_passages)
            + 0.20 * diversity,
            4,
        )
        fresh = freshness(latest, today)
        recent = 0
        previous = 0
        for sid in sids:
            d = source_dates.get(sid)
            if not d:
                continue
            age = (today - d).days
            if 0 <= age <= 90:
                recent += 1
            elif 90 < age <= 180:
                previous += 1
        momentum = round(max(0.0, min(1.0, math.log2(((recent + 1) / (previous + 1)) + 1) / 2)), 4)
        signal = round(0.30 * evidence + 0.25 * fresh + 0.20 * momentum + 0.15 * diversity + 0.10 * (1.0 if tid in brief_by_topic else 0.0), 4)
        trend = "rising" if recent > previous else ("stale" if latest and (today - latest).days > 180 else "steady")
        topic_stats[tid] = {
            "topic_id": tid,
            "topic_label": topic_label(tid, topics),
            "source_count": source_count,
            "passage_count": passage_count,
            "public_insight_count": public_insight_count,
            "creator_count": creator_count,
            "latest_source_date": latest.isoformat() if latest else "",
            "freshness_score": fresh,
            "evidence_score": evidence,
            "momentum_score": momentum,
            "creator_diversity_score": round(diversity, 4),
            "signal_score": signal,
            "trend": trend,
            "has_signal_brief": tid in brief_by_topic,
            "workspace_url": workspace_url(topic_id=tid),
        }

    top_topics = sorted(topic_stats.values(), key=lambda r: (-r["signal_score"], -r["source_count"], r["topic_label"].lower()))[:80]
    top_topic_ids = {row["topic_id"] for row in top_topics[:24]}

    matrix: list[dict[str, Any]] = []
    for (handle, tid), sids in creator_topic_sources.items():
        if tid not in top_topic_ids:
            continue
        source_count = len(sids)
        latest = max([d for sid in sids if (d := source_dates.get(sid))], default=None)
        base = topic_stats.get(tid, {})
        public_insight_count = len(creator_topic_insights[(handle, tid)])
        evidence = round(
            0.45 * score_log(source_count, max_sources)
            + 0.25 * score_log(public_insight_count, max_insights)
            + 0.15 * score_log(creator_topic_passages[(handle, tid)], max_passages)
            + 0.15 * float(base.get("creator_diversity_score", 0)),
            4,
        )
        fresh = freshness(latest, today)
        signal = round(0.55 * evidence + 0.35 * fresh + 0.10 * float(base.get("momentum_score", 0)), 4)
        first = min([d for sid in sids if (d := source_dates.get(sid))], default=None)
        matrix.append({
            "creator_handle": handle,
            "topic_id": tid,
            "topic_label": topic_label(tid, topics),
            "source_count": source_count,
            "passage_count": int(creator_topic_passages[(handle, tid)]),
            "public_insight_count": public_insight_count,
            "latest_source_date": latest.isoformat() if latest else "",
            "first_source_date": first.isoformat() if first else "",
            "freshness_score": fresh,
            "evidence_score": evidence,
            "signal_score": signal,
            "workspace_url": workspace_url(handle, tid),
        })
    matrix.sort(key=lambda r: (-r["signal_score"], r["creator_handle"], r["topic_label"]))

    topic_momentum: list[dict[str, Any]] = []
    for tid in [row["topic_id"] for row in top_topics[:30]]:
        months = sorted({month for (topic_id, month) in topic_month_sources if topic_id == tid})
        monthly = []
        for month in months[-18:]:
            sids = topic_month_sources[(tid, month)]
            monthly.append({
                "month": month,
                "source_count": len(sids),
                "passage_count": sum(passage_count_by_source[sid] for sid in sids),
                "public_insight_count": sum(1 for row in topic_insights[tid] if source_id(row) in sids),
                "creator_count": len({source_creators.get(sid, "") for sid in sids if source_creators.get(sid, "")}),
                "workspace_url": workspace_url(topic_id=tid),
            })
        item = dict(topic_stats[tid])
        item["monthly"] = monthly
        topic_momentum.append(item)

    creator_fingerprints: list[dict[str, Any]] = []
    for handle, sids in creator_sources.items():
        row = creators.get(handle, {})
        topic_rows_for_creator = []
        for tid in creator_topics[handle]:
            sc = len(creator_topic_sources[(handle, tid)])
            if sc or creator_topic_insights[(handle, tid)]:
                topic_rows_for_creator.append({
                    "topic_id": tid,
                    "topic_label": topic_label(tid, topics),
                    "score": round((sc + len(creator_topic_insights[(handle, tid)]) * 1.5) / max(1, len(sids)), 4),
                    "source_count": sc,
                    "workspace_url": workspace_url(handle, tid),
                })
        topic_rows_for_creator.sort(key=lambda r: (-r["score"], -r["source_count"], r["topic_label"].lower()))
        latest = max([d for sid in sids if (d := source_dates.get(sid))], default=None)
        fresh_count = sum(1 for tid in creator_topics[handle] if topic_stats.get(tid, {}).get("freshness_score", 0) >= 0.75)
        creator_fingerprints.append({
            "creator_handle": handle,
            "display_name": row.get("display_name") or row.get("name") or handle,
            "avatar_url": row.get("avatar_url") or "",
            "source_count": len(sids),
            "public_insight_count": len(creator_insights[handle]),
            "top_topics": topic_rows_for_creator[:8],
            "unique_topic_count": len(creator_topics[handle]),
            "fresh_topic_count": fresh_count,
            "latest_source_date": latest.isoformat() if latest else "",
            "workspace_url": workspace_url(handle),
        })
    creator_fingerprints.sort(key=lambda r: (-r["source_count"], r["creator_handle"]))

    signal_chains: list[dict[str, Any]] = []
    for trow in top_topics[:12]:
        tid = trow["topic_id"]
        nodes: list[dict[str, Any]] = [{"id": f"topic:{tid}", "type": "topic", "label": trow["topic_label"], "url": workspace_url(topic_id=tid), "value": trow["signal_score"]}]
        edges: list[dict[str, Any]] = []
        top_creator_handles = sorted(topic_creators[tid], key=lambda h: -len(creator_topic_sources[(h, tid)]))[:8]
        for handle in top_creator_handles:
            nodes.append({"id": f"creator:{handle}", "type": "creator", "label": handle, "url": workspace_url(handle, tid), "value": len(creator_topic_sources[(handle, tid)])})
            edges.append({"source": f"topic:{tid}", "target": f"creator:{handle}"})
        top_sids = sorted(topic_sources[tid], key=lambda sid: (source_dates.get(sid) or date.min, len(source_topics.get(sid, set()))), reverse=True)[:24]
        for sid in top_sids:
            handle = source_creators.get(sid, "")
            nodes.append({"id": f"source:{sid}", "type": "source", "label": compact(source_titles.get(sid) or sid, 60), "url": source_url(sid), "value": passage_count_by_source[sid] or 1})
            if handle in top_creator_handles:
                edges.append({"source": f"creator:{handle}", "target": f"source:{sid}"})
        for idx, row in enumerate(topic_insights[tid][:8]):
            iid = str(row.get("id") or row.get("claim_id") or f"{tid}-{idx}")
            sid = source_id(row)
            nodes.append({"id": f"insight:{iid}", "type": "insight", "label": compact(row.get("suggested_action") or row.get("claim_text") or "Public insight", 70), "url": source_url(sid) if sid else workspace_url(topic_id=tid), "value": 1})
            if sid:
                edges.append({"source": f"source:{sid}", "target": f"insight:{iid}"})
        nodes = nodes[:40]
        node_ids = {n["id"] for n in nodes}
        edges = [e for e in edges if e["source"] in node_ids and e["target"] in node_ids][:70]
        signal_chains.append({
            "chain_id": f"{tid}__source-backed-chain",
            "topic_id": tid,
            "label": f"{trow['topic_label']} → public evidence chain",
            "creator_count": len(topic_creators[tid]),
            "source_count": len(topic_sources[tid]),
            "public_insight_count": len(topic_insights[tid]),
            "nodes": nodes,
            "edges": edges,
            "top_sources": [{"source_id": sid, "title": source_titles.get(sid) or sid, "creator_handle": source_creators.get(sid, ""), "url": source_url(sid)} for sid in top_sids[:8]],
        })

    coverage_gaps: list[dict[str, Any]] = []
    for tid, stat in topic_stats.items():
        if stat["source_count"] >= 8 and stat["public_insight_count"] <= 1:
            gap_type = "source_rich_insight_poor"
            action = "Needs Source Intelligence review before stronger topic page treatment."
        elif stat["source_count"] >= 3 and stat["freshness_score"] >= 0.9 and stat["public_insight_count"] == 0:
            gap_type = "fresh_under_reviewed"
            action = "Fresh source coverage exists, but reviewed public insight cards are still thin."
        elif stat["source_count"] >= 8 and stat["freshness_score"] <= 0.35:
            gap_type = "stale_but_important"
            action = "High historical coverage but low freshness; consider refreshing public sources."
        elif stat["source_count"] < 5 or stat["creator_count"] < 2 or stat["public_insight_count"] < 3:
            gap_type = "weak_topic_keep_light"
            action = "Keep as lightweight search coverage until evidence diversity improves."
        else:
            continue
        coverage_gaps.append({
            "gap_type": gap_type,
            "topic_id": tid,
            "topic_label": stat["topic_label"],
            "source_count": stat["source_count"],
            "public_insight_count": stat["public_insight_count"],
            "creator_count": stat["creator_count"],
            "suggested_action": action,
            "workspace_url": workspace_url(topic_id=tid),
        })
    coverage_gaps.sort(key=lambda r: (-r["source_count"], r["public_insight_count"], r["topic_label"].lower()))

    def build_query_preset(query_id: str, label: str, terms: list[str]) -> dict[str, Any]:
        term_tokens = tokens(label, *terms)
        matching_topics = [stat for tid, stat in topic_stats.items() if term_tokens & tokens(tid, stat["topic_label"])]
        matching_topics.sort(key=lambda r: (-r["signal_score"], -r["source_count"]))
        topic_ids = {r["topic_id"] for r in matching_topics[:8]}
        matching_insights = [row for tid in topic_ids for row in topic_insights[tid]]
        matching_sources = sorted({sid for tid in topic_ids for sid in topic_sources[tid]}, key=lambda sid: source_dates.get(sid) or date.min, reverse=True)
        matching_creators = sorted({source_creators.get(sid, "") for sid in matching_sources if source_creators.get(sid, "")})
        creator_angles = []
        for handle in matching_creators[:6]:
            creator_topic_labels = [topic_label(tid, topics) for tid in topic_ids if creator_topic_sources[(handle, tid)]]
            if creator_topic_labels:
                creator_angles.append({"creator_handle": handle, "angle": f"Connects this query with {', '.join(creator_topic_labels[:3])}.", "workspace_url": workspace_url(handle, query=label)})
        actions = []
        seen_actions: set[str] = set()
        for row in matching_insights:
            action = compact(row.get("suggested_action") or row.get("claim_text"), 160)
            if action and action.lower() not in seen_actions:
                seen_actions.add(action.lower())
                actions.append({"text": action, "source_id": source_id(row), "topic_id": clean_id(row.get("topic_id")), "url": source_url(source_id(row)) if source_id(row) else workspace_url(query=label)})
        return {
            "query_id": query_id,
            "query_label": label,
            "query_terms": terms,
            "creator_count": len(matching_creators),
            "source_count": len(matching_sources),
            "public_insight_count": len(matching_insights),
            "topics": matching_topics[:8],
            "creator_angles": creator_angles,
            "source_backed_actions": actions[:8],
            "top_sources": [{"source_id": sid, "title": source_titles.get(sid) or sid, "creator_handle": source_creators.get(sid, ""), "url": source_url(sid)} for sid in matching_sources[:8]],
            "workspace_url": workspace_url(query=label),
        }

    payload = {
        "schema": SCHEMA,
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "source": {
            "manifest_created_at": manifest.get("created_at") or manifest.get("generated_at") or "",
            "source_records": len(sources),
            "documents": len(documents),
            "passages": len(passages),
            "public_insight_cards": len(insights),
            "topics": len(topic_rows),
            "creators": len(creator_rows),
        },
        "categories": [],
        "creators": creator_fingerprints,
        "topics": top_topics,
        "creator_topic_matrix": matrix,
        "topic_momentum": topic_momentum,
        "creator_fingerprints": creator_fingerprints,
        "signal_chains": signal_chains,
        "coverage_gaps": coverage_gaps[:80],
        "query_presets": [build_query_preset(qid, label, terms) for qid, label, terms in PRESET_QUERIES],
        "lookups": {
            "creators_by_handle": {row["creator_handle"]: row for row in creator_fingerprints},
            "topics_by_id": {tid: stat for tid, stat in topic_stats.items()},
            "sources_by_id": {
                sid: {
                    "source_id": sid,
                    "title": source_titles.get(sid) or sid,
                    "creator_handle": source_creators.get(sid, ""),
                    "published_date": format_date(source_dates.get(sid)),
                    "url": source_url(sid),
                }
                for sid in list(source_by_id)[:2000]
            },
        },
        "fallback_summary_schema": analytics_summary.get("schema", ""),
    }
    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate Base2026 Signal Lab analytics from public JSONL only.")
    parser.add_argument("--data", type=Path, default=Path("public-data/tiktok"))
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    payload = build_signal_lab(args.data)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"signal_lab": str(args.out), "topics": len(payload["topics"]), "matrix": len(payload["creator_topic_matrix"]), "creators": len(payload["creators"])}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
