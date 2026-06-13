from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sqlite3
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
KB = ROOT / "12_knowledge-base"
DB = KB / "indexes" / "kb.sqlite"
DATA_ROOT = ROOT / "public-data" / "tiktok"
PLANNING = ROOT / ".planning"
PROMPT_VERSION = "base2026-legacy-insight-review-v1"


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def today_stamp() -> str:
    return datetime.now().strftime("%Y%m%d")


def read_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    if not path.exists():
        return rows
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", (text or "").lower())).strip()


def compact(text: str, limit: int) -> str:
    value = re.sub(r"\s+", " ", text or "").strip()
    if len(value) <= limit:
        return value
    return value[: max(limit - 18, 0)].rstrip() + " ... [truncated]"


def slugify(value: str) -> str:
    return "-".join(re.findall(r"[a-z0-9]+", (value or "").lower()))[:120] or "uncategorized"


def sha256_payload(payload: dict) -> str:
    return hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()


def load_db_claims(db: Path) -> dict[str, dict]:
    con = sqlite3.connect(db)
    con.row_factory = sqlite3.Row
    try:
        rows = con.execute(
            """
            SELECT
              c.claim_id,
              c.claim_text,
              c.topic,
              c.claim_type,
              c.suggested_action,
              c.confidence,
              c.review_status,
              c.created_at,
              c.updated_at,
              e.video_id,
              e.evidence_path,
              e.quote_or_span
            FROM claims c
            LEFT JOIN claim_evidence e ON e.claim_id = c.claim_id
            """
        ).fetchall()
    finally:
        con.close()
    return {row["claim_id"]: dict(row) for row in rows}


def load_sources(data_root: Path) -> dict[str, dict]:
    return {row.get("source_id") or "": row for row in read_jsonl(data_root / "source_records.jsonl") if row.get("source_id")}


def load_passages(data_root: Path) -> dict[str, list[dict]]:
    passages: dict[str, list[dict]] = defaultdict(list)
    for row in read_jsonl(data_root / "passages.jsonl"):
        passages[row.get("source_id") or ""].append(row)
    return passages


def auto_public_insights(data_root: Path) -> list[dict]:
    return [
        row
        for row in read_jsonl(data_root / "insight_cards.jsonl")
        if row.get("public") and row.get("promotion_method") == "auto_evidence_match"
    ]


def evidence_match(evidence: str, source_id: str, passages_by_source: dict[str, list[dict]]) -> tuple[str, float]:
    texts = [passage.get("body") or "" for passage in passages_by_source.get(source_id, [])]
    joined = "\n".join(texts)
    if evidence and evidence in joined:
        return "exact", 1.0
    if normalize(evidence) and normalize(evidence) in normalize(joined):
        return "normalized_exact", 0.95
    return "missing", 0.0


VISUAL_CONTEXT_RE = re.compile(
    r"\b("
    r"look at|look what|see here|watch this|on screen|screenshot|screen shot|"
    r"image|visual|shown|showing|demo|graph|chart|table|template|example on|"
    r"this button|this page|this website|this is what|here is what|pointing"
    r")\b",
    re.I,
)


GENERIC_ACTION_RE = re.compile(
    r"\b("
    r"leverage|utilize|unlock|game[- ]changer|boost your seo|"
    r"explore the implications|assess how|optimi[sz]e content|"
    r"take advantage of|use ai to improve"
    r")\b",
    re.I,
)

FRAGILE_TRANSCRIPT_RE = re.compile(
    r"\b("
    r"garbled transcript|transcript appears|transcript suggests|"
    r"appears to warn|appears to argue|appears to suggest|"
    r"hard to parse|unclear transcript|unclear source"
    r")\b",
    re.I,
)


def text_warnings(card: dict, source: dict, args: argparse.Namespace) -> list[str]:
    warnings: list[str] = []
    claim = card.get("claim_text") or ""
    action = card.get("suggested_action") or ""
    evidence = card.get("evidence_excerpt") or ""
    combined = "\n".join([claim, action, evidence, source.get("title") or "", source.get("excerpt") or ""])

    if len(claim.strip()) < args.min_claim_chars:
        warnings.append("claim_too_short")
    if len(claim) > args.max_claim_chars:
        warnings.append("claim_too_long")
    if len(action.strip()) < args.min_action_chars:
        warnings.append("action_too_short")
    if len(action) > args.max_action_chars:
        warnings.append("action_too_long")
    if len(evidence.strip()) < args.min_evidence_chars:
        warnings.append("evidence_too_short")
    if len(evidence) > args.max_evidence_chars:
        warnings.append("evidence_too_long")
    if normalize(claim) and normalize(claim) == normalize(action):
        warnings.append("action_duplicates_claim")
    if GENERIC_ACTION_RE.search(action):
        warnings.append("generic_action_language")
    if FRAGILE_TRANSCRIPT_RE.search(combined):
        warnings.append("fragile_transcript_language")
    if VISUAL_CONTEXT_RE.search(combined):
        warnings.append("needs_visual_context")
    if not (card.get("topic") or "").strip():
        warnings.append("missing_topic")
    return warnings


def classify(hard_failures: list[str], warnings: list[str], evidence_method: str) -> str:
    if hard_failures == ["already_reviewed"]:
        return "already_migrated"
    if hard_failures:
        return "reject_candidate"
    if "needs_visual_context" in warnings:
        return "needs_visual_context"
    if warnings or evidence_method != "exact":
        return "repair_with_gpt"
    return "approve_candidate"


def build_report(args: argparse.Namespace) -> dict:
    cards = auto_public_insights(args.data_root)
    sources = load_sources(args.data_root)
    passages_by_source = load_passages(args.data_root)
    claims = load_db_claims(args.db)
    reviewed: list[dict] = []

    for card in cards:
        claim_id = card.get("claim_id") or ""
        source_id = card.get("source_id") or ""
        source = sources.get(source_id, {})
        db_claim = claims.get(claim_id, {})
        hard: list[str] = []

        if not claim_id:
            hard.append("missing_claim_id")
        if claim_id and not db_claim:
            hard.append("missing_db_claim")
        if not source_id:
            hard.append("missing_source_id")
        if source_id and not source:
            hard.append("missing_source_record")
        if not passages_by_source.get(source_id):
            hard.append("missing_public_passage")
        if db_claim and db_claim.get("claim_type") == "insight_card_candidate":
            hard.append("unexpected_candidate_claim_type")
        if db_claim and db_claim.get("review_status") in {"approved", "reviewed", "public"}:
            hard.append("already_reviewed")

        method, score = evidence_match(card.get("evidence_excerpt") or "", source_id, passages_by_source)
        if method == "missing":
            hard.append("evidence_missing_from_public_passages")

        warnings = text_warnings(card, source, args)
        status = classify(hard, warnings, method)
        reviewed.append(
            {
                "claim_id": claim_id,
                "source_id": source_id,
                "video_id": card.get("post_id") or card.get("video_id") or "",
                "item_id": card.get("item_id") or "",
                "creator_handle": card.get("creator_handle") or source.get("creator_handle") or "",
                "source_url": card.get("source_url") or source.get("source_url") or "",
                "claim_type": card.get("claim_type") or db_claim.get("claim_type") or "",
                "topic": card.get("topic") or db_claim.get("topic") or "",
                "claim_text": card.get("claim_text") or db_claim.get("claim_text") or "",
                "suggested_action": card.get("suggested_action") or db_claim.get("suggested_action") or "",
                "evidence_excerpt": card.get("evidence_excerpt") or db_claim.get("quote_or_span") or "",
                "export_evidence_score": card.get("evidence_score"),
                "evidence_match_method": method,
                "evidence_score": score,
                "review_status": db_claim.get("review_status") or card.get("review_status") or "",
                "recommended_status": status,
                "hard_failures": hard,
                "soft_warnings": warnings,
            }
        )

    counts = Counter(row["recommended_status"] for row in reviewed)
    warning_counts = Counter(warning for row in reviewed for warning in row["soft_warnings"])
    failure_counts = Counter(failure for row in reviewed for failure in row["hard_failures"])
    evidence_counts = Counter(row["evidence_match_method"] for row in reviewed)
    return {
        "generated_at": now_iso(),
        "prompt_version": PROMPT_VERSION,
        "data_root": str(args.data_root),
        "db": str(args.db),
        "total_legacy_auto_public_cards": len(cards),
        "recommendation_counts": dict(sorted(counts.items())),
        "warning_counts": dict(sorted(warning_counts.items())),
        "failure_counts": dict(sorted(failure_counts.items())),
        "evidence_counts": dict(sorted(evidence_counts.items())),
        "review_policy": {
            "already_migrated": "DB claim is already explicitly reviewed; regenerate export to remove the legacy auto marker.",
            "approve_candidate": "Evidence is exact, source exists, and card copy passes deterministic quality checks.",
            "repair_with_gpt": "Card has support but needs GPT/Codex semantic or copy repair before public approval.",
            "needs_visual_context": "Transcript/evidence likely depends on what the TikTok shows; require thumbnail/frame review before approval.",
            "reject_candidate": "Missing source/evidence/DB row or otherwise unsafe to migrate.",
        },
        "cards": reviewed,
    }


def markdown_report(report: dict) -> str:
    lines = [
        "# Base2026 Legacy Public Insight Review",
        "",
        f"- generated_at: `{report['generated_at']}`",
        f"- total_legacy_auto_public_cards: {report['total_legacy_auto_public_cards']}",
        "",
        "## Recommendations",
        "",
    ]
    for key, count in report["recommendation_counts"].items():
        lines.append(f"- {key}: {count}")
    lines += ["", "## Evidence Match", ""]
    for key, count in report["evidence_counts"].items():
        lines.append(f"- {key}: {count}")
    if report["warning_counts"]:
        lines += ["", "## Warnings", ""]
        for key, count in report["warning_counts"].items():
            lines.append(f"- {key}: {count}")
    if report["failure_counts"]:
        lines += ["", "## Failures", ""]
        for key, count in report["failure_counts"].items():
            lines.append(f"- {key}: {count}")
    lines += [
        "",
        "## Next Use",
        "",
        "Use `approve_candidate` only for exact-evidence cards that passed the deterministic checks.",
        "Use `repair_with_gpt` packets for awkward or semantically fragile cards.",
        "Use `needs_visual_context` only after a thumbnail/frame review confirms the visible context.",
        "",
        "## Sample Cards",
        "",
    ]
    for row in report["cards"][:20]:
        lines += [
            f"### {row['claim_id']} — {row['recommended_status']}",
            "",
            f"- source: `{row['source_id']}`",
            f"- creator: `{row['creator_handle']}`",
            f"- topic: {row['topic']}",
            f"- evidence_match: {row['evidence_match_method']}",
            f"- warnings: {', '.join(row['soft_warnings']) or 'none'}",
            f"- failures: {', '.join(row['hard_failures']) or 'none'}",
            "",
            row["claim_text"],
            "",
        ]
    return "\n".join(lines).rstrip() + "\n"


def select_for_packet(report: dict, recommendation: str, limit: int) -> list[dict]:
    selected = [row for row in report.get("cards") or [] if row.get("recommended_status") == recommendation]
    selected.sort(key=lambda row: (row.get("creator_handle") or "", row.get("source_id") or "", row.get("claim_id") or ""))
    return selected[:limit]


def build_packet(report: dict, args: argparse.Namespace) -> dict:
    sources = load_sources(args.data_root)
    passages_by_source = load_passages(args.data_root)
    selected = select_for_packet(report, args.packet_recommendation, args.packet_limit)
    by_source: dict[str, list[dict]] = defaultdict(list)
    for row in selected:
        by_source[row["source_id"]].append(row)
    seed = f"{args.packet_recommendation}:{args.packet_limit}:{report['generated_at']}"
    packet_id = f"legacy-insight-{hashlib.sha256(seed.encode('utf-8')).hexdigest()[:16]}"

    packet_sources: list[dict] = []
    for source_id, rows in by_source.items():
        source = sources.get(source_id, {})
        packet_sources.append(
            {
                "source_id": source_id,
                "source_url": source.get("source_url") or rows[0].get("source_url") or "",
                "creator_handle": source.get("creator_handle") or rows[0].get("creator_handle") or "",
                "item_id": source.get("item_id") or rows[0].get("item_id") or "",
                "published_date": source.get("published_date") or source.get("published_at") or "",
                "title": compact(source.get("title") or "", args.max_title_chars),
                "public_policy": source.get("public_policy") or "",
                "full_transcript_public": bool(source.get("full_transcript_public")),
                "passages": [
                    {
                        "passage_id": passage.get("id") or passage.get("chunk_id") or "",
                        "public_policy": passage.get("public_policy") or "",
                        "body": compact(passage.get("body") or "", args.max_passage_chars),
                    }
                    for passage in passages_by_source.get(source_id, [])[: args.max_passages_per_source]
                ],
                "legacy_cards": [
                    {
                        "claim_id": row.get("claim_id") or "",
                        "claim_type": row.get("claim_type") or "",
                        "topic": row.get("topic") or "",
                        "claim_text": row.get("claim_text") or "",
                        "suggested_action": row.get("suggested_action") or "",
                        "evidence_excerpt": row.get("evidence_excerpt") or "",
                        "deterministic_recommendation": row.get("recommended_status") or "",
                        "soft_warnings": row.get("soft_warnings") or [],
                    }
                    for row in rows
                ],
            }
        )

    return {
        "review_batch_id": packet_id,
        "created_at": now_iso(),
        "prompt_version": PROMPT_VERSION,
        "mode": "legacy_public_card_repair",
        "input_recommendation": args.packet_recommendation,
        "boundary": {
            "allowed_inputs": [
                "public-data/tiktok/passages.jsonl search passages",
                "current public insight card text",
                "public source metadata",
            ],
            "forbidden_inputs": [
                "raw captions",
                "full private transcripts",
                "local SQLite files",
                "media/audio/video files",
                "cookies, tokens, credentials, logs",
                "outside facts not present in supplied passages",
            ],
        },
        "review_rules": [
            "Use only supplied public passages, source metadata, and legacy card text.",
            "TikTok transcript text can be rough; repair wording only when the supplied passage clearly supports the meaning.",
            "If the card depends on what is visible in the video, use decision=needs_visual_context.",
            "Do not invent visual details, brands, metrics, dates, or causal claims.",
            "Approve only if the existing card is faithful and useful.",
            "Rewrite awkward cards into concise public insight-card copy when support is clear.",
            "Every approve or rewrite decision must include an exact evidence_excerpt copied from a supplied passage.",
            "Return strict JSON only.",
        ],
        "response_schema": {
            "review_batch_id": packet_id,
            "decisions": [
                {
                    "source_id": "string",
                    "claim_id": "existing legacy claim_id",
                    "decision": "approve|rewrite|reject|needs_human|needs_visual_context",
                    "reason": "short source-grounded reason",
                    "topic": "final short topic label, empty for reject",
                    "claim_text": "final claim, empty for reject",
                    "suggested_action": "final action, empty for reject",
                    "evidence_excerpt": "exact excerpt copied from supplied passage, empty if not supported",
                    "quality_score": "integer 0-5",
                }
            ],
        },
        "quality_bar": [
            "quality_score 4 or 5 means ready to update SQLite as approved.",
            "quality_score below 4 is not migrated.",
            "claim_text max 220 characters; suggested_action max 280 characters.",
            "Prefer fewer strong cards over preserving weak legacy cards.",
        ],
        "sources": packet_sources,
    }


def packet_markdown(packet: dict) -> str:
    lines = [
        "# Base2026 Legacy Public Card Repair Packet",
        "",
        "Return strict JSON matching the response_schema. Use only supplied passages.",
        "",
        "## Rules",
        "",
    ]
    lines += [f"- {rule}" for rule in packet["review_rules"]]
    lines += [
        "",
        "## Response Schema",
        "",
        "```json",
        json.dumps(packet["response_schema"], ensure_ascii=False, indent=2),
        "```",
        "",
        "## Sources",
        "",
    ]
    for source in packet["sources"]:
        lines += [
            f"### {source['source_id']}",
            "",
            f"- creator: `{source['creator_handle']}`",
            f"- source_url: {source['source_url']}",
            f"- published_date: {source['published_date']}",
            f"- title: {source['title']}",
            "",
            "#### Public Passages",
            "",
        ]
        for passage in source["passages"]:
            lines += [f"- `{passage['passage_id']}`: {passage['body']}"]
        lines += ["", "#### Legacy Cards", ""]
        for card in source["legacy_cards"]:
            lines += [
                f"- claim_id: `{card['claim_id']}`",
                f"  - topic: {card['topic']}",
                f"  - deterministic_recommendation: {card['deterministic_recommendation']}",
                f"  - warnings: {', '.join(card['soft_warnings']) or 'none'}",
                f"  - claim_text: {card['claim_text']}",
                f"  - suggested_action: {card['suggested_action']}",
                f"  - evidence_excerpt: {card['evidence_excerpt']}",
            ]
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def parse_json_document(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", text.strip(), flags=re.IGNORECASE)
    try:
        value = json.loads(cleaned)
        if isinstance(value, dict):
            return value
    except json.JSONDecodeError:
        pass
    decoder = json.JSONDecoder()
    for index, char in enumerate(cleaned):
        if char != "{":
            continue
        try:
            value, _end = decoder.raw_decode(cleaned[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            return value
    raise ValueError(f"No JSON object found in {path}")


def validate_decision(decision: dict, packet_sources: dict[str, dict], args: argparse.Namespace) -> tuple[dict | None, str]:
    source_id = decision.get("source_id") or ""
    claim_id = decision.get("claim_id") or ""
    action = decision.get("decision") or ""
    source = packet_sources.get(source_id)
    if not source:
        return None, "unknown_source"
    known_ids = {card.get("claim_id") for card in source.get("legacy_cards") or []}
    if claim_id not in known_ids:
        return None, "unknown_claim"
    if action not in {"approve", "rewrite", "reject", "needs_human", "needs_visual_context"}:
        return None, "unknown_decision"
    if action in {"reject", "needs_human", "needs_visual_context"}:
        return {
            "claim_id": claim_id,
            "source_id": source_id,
            "decision": action,
            "reason": decision.get("reason") or "",
            "review_status": action,
        }, ""
    try:
        quality = int(decision.get("quality_score"))
    except (TypeError, ValueError):
        return None, "bad_quality_score"
    if quality < args.min_quality_score:
        return None, "low_quality_score"
    claim_text = decision.get("claim_text") or ""
    topic = decision.get("topic") or ""
    suggested_action = decision.get("suggested_action") or ""
    evidence_excerpt = decision.get("evidence_excerpt") or ""
    if not claim_text or not topic or not suggested_action or not evidence_excerpt:
        return None, "missing_required_text"
    if len(claim_text) > args.max_claim_chars:
        return None, "claim_too_long"
    if len(suggested_action) > args.max_action_chars:
        return None, "action_too_long"
    if len(evidence_excerpt) > args.max_evidence_chars:
        return None, "evidence_too_long"
    source_text = "\n".join(passage.get("body") or "" for passage in source.get("passages") or [])
    if evidence_excerpt not in source_text and normalize(evidence_excerpt) not in normalize(source_text):
        return None, "evidence_missing"
    return {
        "claim_id": claim_id,
        "source_id": source_id,
        "decision": action,
        "reason": decision.get("reason") or "",
        "topic": topic,
        "claim_text": claim_text,
        "suggested_action": suggested_action,
        "evidence_excerpt": evidence_excerpt,
        "quality_score": quality,
        "review_status": "approved",
    }, ""


def update_db(args: argparse.Namespace, rows: list[dict]) -> dict:
    stats = {
        "dry_run": not args.apply,
        "requested": len(rows),
        "updated": 0,
        "backup": "",
        "status_counts": dict(Counter(row["review_status"] for row in rows)),
    }
    if not rows or not args.apply:
        return stats
    backup = args.db.with_suffix(f".sqlite.bak-legacy-insights-{datetime.now().strftime('%Y%m%d-%H%M%S-%f')}")
    suffix = 1
    while backup.exists():
        backup = args.db.with_suffix(
            f".sqlite.bak-legacy-insights-{datetime.now().strftime('%Y%m%d-%H%M%S-%f')}-{suffix}"
        )
        suffix += 1
    shutil.copy2(args.db, backup)
    stats["backup"] = str(backup)
    con = sqlite3.connect(args.db)
    try:
        for row in rows:
            if row["review_status"] == "approved":
                con.execute(
                    """
                    UPDATE claims
                    SET claim_text = ?, topic = ?, suggested_action = ?, review_status = 'approved', updated_at = ?
                    WHERE claim_id = ?
                      AND claim_type != 'insight_card_candidate'
                    """,
                    (
                        row["claim_text"],
                        row["topic"],
                        row["suggested_action"],
                        now_iso(),
                        row["claim_id"],
                    ),
                )
                con.execute(
                    """
                    UPDATE claim_evidence
                    SET quote_or_span = ?
                    WHERE claim_id = ?
                    """,
                    (row["evidence_excerpt"], row["claim_id"]),
                )
            else:
                con.execute(
                    """
                    UPDATE claims
                    SET review_status = ?, updated_at = ?
                    WHERE claim_id = ?
                      AND claim_type != 'insight_card_candidate'
                    """,
                    (row["review_status"], now_iso(), row["claim_id"]),
                )
            stats["updated"] += con.total_changes - stats["updated"]
        con.commit()
    finally:
        con.close()
    return stats


def apply_review(args: argparse.Namespace) -> dict:
    packet = parse_json_document(args.packet_json)
    review = parse_json_document(args.review_json)
    expected = packet.get("review_batch_id") or ""
    actual = review.get("review_batch_id") or ""
    if expected and actual != expected:
        raise ValueError(f"review_batch_id mismatch: expected {expected}, got {actual}")
    packet_sources = {source.get("source_id") or "": source for source in packet.get("sources") or []}
    accepted: list[dict] = []
    skipped = Counter()
    for decision in review.get("decisions") or []:
        if not isinstance(decision, dict):
            skipped["not_object"] += 1
            continue
        row, reason = validate_decision(decision, packet_sources, args)
        if row is None:
            skipped[reason] += 1
            continue
        accepted.append(row)
    stats = update_db(args, accepted)
    stats.update(
        {
            "packet": str(args.packet_json),
            "review": str(args.review_json),
            "accepted": len(accepted),
            "skipped": dict(sorted(skipped.items())),
        }
    )
    return stats


def apply_report(args: argparse.Namespace) -> dict:
    report = parse_json_document(args.report_json)
    selected_ids = {item.strip() for item in args.claim_ids.split(",") if item.strip()}
    rows: list[dict] = []
    for row in report.get("cards") or []:
        if selected_ids and row.get("claim_id") not in selected_ids:
            continue
        if not selected_ids and row.get("recommended_status") != args.recommendation:
            continue
        if row.get("recommended_status") != "approve_candidate" and not selected_ids:
            continue
        rows.append(
            {
                "claim_id": row.get("claim_id") or "",
                "source_id": row.get("source_id") or "",
                "review_status": "approved",
                "topic": row.get("topic") or "",
                "claim_text": row.get("claim_text") or "",
                "suggested_action": row.get("suggested_action") or "",
                "evidence_excerpt": row.get("evidence_excerpt") or "",
            }
        )
    stats = update_db(args, rows)
    stats.update(
        {
            "report": str(args.report_json),
            "recommendation": args.recommendation,
            "selected_claim_ids": [row["claim_id"] for row in rows],
        }
    )
    return stats


def main() -> int:
    parser = argparse.ArgumentParser(description="Review and migrate legacy auto-promoted public insight cards.")
    parser.add_argument("--db", type=Path, default=DB)
    parser.add_argument("--data-root", type=Path, default=DATA_ROOT)
    parser.add_argument("--out-json", type=Path, default=PLANNING / f"legacy-insight-review-{today_stamp()}.json")
    parser.add_argument("--out-md", type=Path, default=PLANNING / f"legacy-insight-review-{today_stamp()}.md")
    parser.add_argument("--packet-json", type=Path, default=PLANNING / f"legacy-insight-repair-packet-{today_stamp()}.json")
    parser.add_argument("--packet-md", type=Path, default=PLANNING / f"legacy-insight-repair-packet-{today_stamp()}.md")
    parser.add_argument("--packet-recommendation", default="repair_with_gpt", choices=["repair_with_gpt", "needs_visual_context", "reject_candidate", "approve_candidate"])
    parser.add_argument("--packet-limit", type=int, default=25)
    parser.add_argument("--max-passages-per-source", type=int, default=3)
    parser.add_argument("--max-passage-chars", type=int, default=1600)
    parser.add_argument("--max-title-chars", type=int, default=220)
    parser.add_argument("--min-claim-chars", type=int, default=40)
    parser.add_argument("--max-claim-chars", type=int, default=220)
    parser.add_argument("--min-action-chars", type=int, default=25)
    parser.add_argument("--max-action-chars", type=int, default=280)
    parser.add_argument("--min-evidence-chars", type=int, default=80)
    parser.add_argument("--max-evidence-chars", type=int, default=900)
    parser.add_argument("--min-quality-score", type=int, default=4)
    parser.add_argument("--apply-review", action="store_true")
    parser.add_argument("--review-json", type=Path, default=None)
    parser.add_argument("--apply-report", action="store_true")
    parser.add_argument("--report-json", type=Path, default=None)
    parser.add_argument("--recommendation", default="approve_candidate")
    parser.add_argument("--claim-ids", default="")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    if args.apply_review:
        if not args.review_json:
            raise SystemExit("--apply-review requires --review-json")
        stats = apply_review(args)
        print(json.dumps(stats, ensure_ascii=False, indent=2, sort_keys=True))
        return 0

    if args.apply_report:
        if not args.report_json:
            args.report_json = args.out_json
        stats = apply_report(args)
        print(json.dumps(stats, ensure_ascii=False, indent=2, sort_keys=True))
        return 0

    report = build_report(args)
    write_json(args.out_json, report)
    args.out_md.parent.mkdir(parents=True, exist_ok=True)
    args.out_md.write_text(markdown_report(report), encoding="utf-8")
    packet = build_packet(report, args)
    write_json(args.packet_json, packet)
    args.packet_md.parent.mkdir(parents=True, exist_ok=True)
    args.packet_md.write_text(packet_markdown(packet), encoding="utf-8")

    summary = {
        "out_json": str(args.out_json),
        "out_md": str(args.out_md),
        "packet_json": str(args.packet_json),
        "packet_md": str(args.packet_md),
        "total_legacy_auto_public_cards": report["total_legacy_auto_public_cards"],
        "recommendation_counts": report["recommendation_counts"],
        "packet_sources": len(packet["sources"]),
        "packet_cards": sum(len(source.get("legacy_cards") or []) for source in packet["sources"]),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
