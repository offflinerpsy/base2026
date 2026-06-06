from __future__ import annotations

import sqlite3
from collections import defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KB = ROOT / "12_knowledge-base"
DB = KB / "indexes" / "kb.sqlite"
CANON = KB / "canonical"

CATEGORIES = {
    "ai-search-visibility": ["ai overview", "ai search", "chatgpt", "claude", "gemini", "llm", "citation", "cited"],
    "reddit-forums": ["reddit", "forum", "community", "thread"],
    "local-seo": ["local", "google maps", "gbp", "business profile", "reviews", "directions"],
    "technical-seo": ["technical", "schema", "structured data", "index", "gsc", "core web vitals", "sitemap", "robots"],
    "content-strategy": ["content", "article", "blog", "faq", "topic", "intent", "keyword", "page"],
    "entity-reputation": ["brand", "review", "reputation", "legit", "testimonial", "award", "entity"],
    "social-video": ["youtube", "tiktok", "instagram", "shorts", "video", "social"],
    "internal-linking": ["internal link", "orphan", "collection", "product page", "landing page"],
    "analytics-measurement": ["analytics", "tracking", "traffic", "rank tracking", "visibility tracking", "prompt"],
    "ai-operations": ["workflow", "agent", "automation", "memory", "context", "process"],
}


def rows(con: sqlite3.Connection):
    return con.execute(
        """
        SELECT c.claim_id, c.topic, c.claim_text, c.suggested_action, c.claim_type,
               e.video_id, v.creator_id, v.url, v.published_at, e.evidence_path
        FROM claims c
        LEFT JOIN claim_evidence e ON e.claim_id = c.claim_id
        LEFT JOIN videos v ON v.video_id = e.video_id
        ORDER BY v.published_at DESC, c.claim_id
        """
    ).fetchall()


def category_for(topic: str, claim: str, action: str) -> str:
    hay = f"{topic} {claim} {action}".lower()
    for cat, terms in CATEGORIES.items():
        if any(term in hay for term in terms):
            return cat
    return "other"


def is_risk(topic: str, claim: str, action: str, claim_type: str) -> bool:
    hay = f"{topic} {claim} {action} {claim_type}".lower()
    return any(term in hay for term in ["risk", "avoid", "spam", "manipulat", "black-hat", "fake", "astroturf", "penalty"])


def write(path: Path, lines: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> None:
    con = sqlite3.connect(DB)
    claims = rows(con)
    con.close()

    by_cat: dict[str, list[tuple]] = defaultdict(list)
    risks: list[tuple] = []
    for row in claims:
        claim_id, topic, claim_text, action, claim_type, *_ = row
        cat = category_for(topic or "", claim_text or "", action or "")
        by_cat[cat].append(row)
        if is_risk(topic or "", claim_text or "", action or "", claim_type or ""):
            risks.append(row)

    generated = datetime.now().date().isoformat()

    topic_lines = [
        "---",
        "type: topic_map",
        f"generated_at: {generated}",
        "status: draft",
        "---",
        "",
        "# TikTok Topic Map",
        "",
        f"Claims analyzed: {len(claims)}",
        "",
    ]
    for cat, items in sorted(by_cat.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        topic_lines += [f"## {cat}", "", f"Claims: {len(items)}", ""]
        for row in items[:8]:
            claim_id, topic, claim_text, action, claim_type, video_id, creator_id, url, published_at, evidence = row
            topic_lines.append(f"- `{claim_id}` ({creator_id}, {published_at}): {claim_text[:240]}")
        topic_lines.append("")
    write(CANON / "topic-maps" / "tiktok-topic-map.md", topic_lines)

    risk_lines = [
        "---",
        "type: risk_register",
        f"generated_at: {generated}",
        "status: draft",
        "---",
        "",
        "# TikTok Risk Register",
        "",
        f"Risk/avoid claims: {len(risks)}",
        "",
    ]
    for row in risks:
        claim_id, topic, claim_text, action, claim_type, video_id, creator_id, url, published_at, evidence = row
        risk_lines += [
            f"## {claim_id}",
            "",
            f"- Topic: {topic}",
            f"- Creator: {creator_id}",
            f"- Video: {url}",
            f"- Evidence: `{evidence}`",
            "",
            f"Claim: {claim_text}",
            "",
            f"Action: {action}",
            "",
        ]
    write(CANON / "risks" / "tiktok-risk-register.md", risk_lines)

    method_lines = [
        "---",
        "type: method_candidates",
        f"generated_at: {generated}",
        "status: draft",
        "---",
        "",
        "# TikTok Method Candidates",
        "",
        "These are not approved methods yet. They are grouped candidates for human review.",
        "",
    ]
    for cat, items in sorted(by_cat.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        usable = [r for r in items if not is_risk(r[1] or "", r[2] or "", r[3] or "", r[4] or "")]
        if not usable:
            continue
        method_lines += [f"## {cat}", "", f"Candidate evidence claims: {len(usable)}", ""]
        for row in usable[:12]:
            claim_id, topic, claim_text, action, claim_type, video_id, creator_id, url, published_at, evidence = row
            method_lines.append(f"- `{claim_id}`: {action[:260]}")
        method_lines.append("")
    write(CANON / "methods" / "tiktok-method-candidates.md", method_lines)

    strategy_lines = [
        "---",
        "type: strategy_blocks",
        f"generated_at: {generated}",
        "status: draft",
        "---",
        "",
        "# TikTok Strategy Blocks",
        "",
        "Draft blocks for client strategy generation. Each block must be reviewed before client use.",
        "",
    ]
    strategy_order = [
        "ai-search-visibility",
        "local-seo",
        "content-strategy",
        "entity-reputation",
        "reddit-forums",
        "social-video",
        "technical-seo",
        "analytics-measurement",
    ]
    for cat in strategy_order:
        items = by_cat.get(cat, [])
        if not items:
            continue
        strategy_lines += [
            f"## {cat}",
            "",
            "Use when client context matches this theme. Pull exact evidence IDs before final delivery.",
            "",
            "Evidence IDs:",
            "",
        ]
        for row in items[:10]:
            strategy_lines.append(f"- `{row[0]}`")
        strategy_lines.append("")
    write(CANON / "strategy-blocks" / "tiktok-strategy-blocks.md", strategy_lines)

    print(f"claims={len(claims)}")
    print(f"topics={len(by_cat)}")
    print(f"risks={len(risks)}")
    print("wrote=topic-map,risk-register,method-candidates,strategy-blocks")


if __name__ == "__main__":
    main()
