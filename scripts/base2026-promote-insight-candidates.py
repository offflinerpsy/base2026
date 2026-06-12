from __future__ import annotations

import argparse
import json
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
KB = ROOT / "12_knowledge-base"
DB = KB / "indexes" / "kb.sqlite"
PLANNING = ROOT / ".planning"
DEFAULT_ARCHIVE = KB / "sources" / "tiktok" / "insight-candidates" / "reviewed-candidates.jsonl"


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_report(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def selected_ids(report: dict, recommendation: str, explicit_ids: set[str]) -> list[str]:
    ids: list[str] = []
    for row in report.get("candidates") or []:
        claim_id = row.get("claim_id") or ""
        if not claim_id:
            continue
        if explicit_ids:
            if claim_id in explicit_ids:
                ids.append(claim_id)
        elif row.get("recommended_status") == recommendation:
            ids.append(claim_id)
    return sorted(set(ids))


def report_rows_by_id(report: dict) -> dict[str, dict]:
    rows: dict[str, dict] = {}
    for row in report.get("candidates") or []:
        claim_id = row.get("claim_id") or ""
        if claim_id:
            rows[claim_id] = row
    return rows


def current_rows(db: Path, ids: list[str]) -> list[dict]:
    if not ids:
        return []
    con = sqlite3.connect(db)
    con.row_factory = sqlite3.Row
    try:
        placeholders = ",".join("?" for _ in ids)
        rows = con.execute(
            f"""
            SELECT
              c.claim_id,
              c.claim_text,
              c.topic,
              c.claim_type,
              c.suggested_action,
              c.confidence,
              c.review_status,
              e.video_id,
              e.evidence_path,
              e.quote_or_span AS evidence_excerpt,
              gi.item_id,
              gi.canonical_url AS source_url,
              gi.source_id
            FROM claims c
            LEFT JOIN claim_evidence e ON e.claim_id = c.claim_id
            LEFT JOIN generic_items gi ON gi.platform_item_id = e.video_id
            WHERE c.claim_id IN ({placeholders})
            ORDER BY c.claim_id
            """,
            ids,
        ).fetchall()
    finally:
        con.close()
    return [dict(row) for row in rows]


def read_archive(path: Path) -> dict[str, dict]:
    rows: dict[str, dict] = {}
    if not path.exists():
        return rows
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue
            row = json.loads(line)
            claim_id = row.get("claim_id") or ""
            if claim_id:
                rows[claim_id] = row
    return rows


def archive_record_from_rows(db_row: dict, report_row: dict, review_status: str) -> dict:
    source_id = report_row.get("source_id") or db_row.get("source_id") or ""
    if not source_id:
        source_id = f"tiktok:{report_row.get('creator_handle', '').lstrip('@')}:{db_row.get('video_id', '')}"
    return {
        "claim_id": db_row.get("claim_id") or report_row.get("claim_id") or "",
        "claim_text": db_row.get("claim_text") or report_row.get("claim_text") or "",
        "topic": db_row.get("topic") or report_row.get("topic") or report_row.get("topic_label") or "Uncategorized",
        "claim_type": "insight_card_candidate",
        "suggested_action": db_row.get("suggested_action") or report_row.get("suggested_action") or "",
        "confidence": db_row.get("confidence") if db_row.get("confidence") is not None else report_row.get("evidence_score"),
        "review_status": review_status,
        "video_id": str(db_row.get("video_id") or report_row.get("video_id") or ""),
        "item_id": db_row.get("item_id") or report_row.get("item_id") or "",
        "source_id": source_id,
        "source_url": db_row.get("source_url") or report_row.get("source_url") or "",
        "creator_handle": report_row.get("creator_handle") or "",
        "evidence_path": db_row.get("evidence_path") or f"public-data/tiktok/passages.jsonl#source_id={source_id}",
        "evidence_excerpt": db_row.get("evidence_excerpt") or report_row.get("evidence_excerpt") or "",
        "evidence_score": report_row.get("evidence_score") if report_row.get("evidence_score") is not None else db_row.get("confidence"),
        "archived_at": now_iso(),
        "archive_version": 1,
    }


def write_archive(path: Path, rows: list[dict], report_map: dict[str, dict], review_status: str) -> int:
    if not rows:
        return 0
    path.parent.mkdir(parents=True, exist_ok=True)
    archived = read_archive(path)
    written = 0
    for db_row in rows:
        claim_id = db_row.get("claim_id") or ""
        if not claim_id:
            continue
        report_row = report_map.get(claim_id, {})
        record = archive_record_from_rows(db_row, report_row, review_status)
        archived[claim_id] = record
        written += 1
    with path.open("w", encoding="utf-8") as handle:
        for claim_id in sorted(archived):
            handle.write(json.dumps(archived[claim_id], ensure_ascii=False, sort_keys=True) + "\n")
    return written


def write_report_archive(path: Path, report_rows: list[dict], review_status: str) -> int:
    rows = []
    for row in report_rows:
        claim_id = row.get("claim_id") or ""
        if not claim_id:
            continue
        rows.append(archive_record_from_rows({"claim_id": claim_id}, row, review_status))
    report_map = {row["claim_id"]: row for row in rows}
    return write_archive(path, rows, report_map, review_status)


def promote(args: argparse.Namespace) -> dict:
    report = load_report(args.review_report)
    report_map = report_rows_by_id(report)
    explicit_ids = {item.strip() for item in args.claim_ids.split(",") if item.strip()}
    ids = selected_ids(report, args.recommendation, explicit_ids)
    rows = current_rows(args.db, ids)
    found_ids = {row["claim_id"] for row in rows}
    eligible = [
        row
        for row in rows
        if row.get("claim_type") == "insight_card_candidate"
        and row.get("review_status") == args.from_status
    ]
    stats = {
        "review_report": str(args.review_report),
        "dry_run": not args.apply,
        "recommendation": args.recommendation,
        "requested": len(ids),
        "found": len(rows),
        "missing": sorted(set(ids) - found_ids),
        "eligible": len(eligible),
        "updated": 0,
        "from_status": args.from_status,
        "to_status": args.to_status,
        "backup": "",
        "archive": str(args.archive),
        "archived": 0,
        "selected_claim_ids": [row["claim_id"] for row in eligible],
    }
    if args.archive_report_only:
        selected_report_rows = [report_map[claim_id] for claim_id in ids if claim_id in report_map]
        stats["eligible"] = len(selected_report_rows)
        stats["found"] = len(selected_report_rows)
        stats["missing"] = []
        stats["selected_claim_ids"] = [row.get("claim_id") or "" for row in selected_report_rows]
        if args.apply:
            stats["archived"] = write_report_archive(args.archive, selected_report_rows, args.to_status)
        return stats
    if not args.apply:
        return stats
    if not eligible:
        return stats

    backup = args.db.with_suffix(f".sqlite.bak-promote-insights-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    shutil.copy2(args.db, backup)
    stats["backup"] = str(backup)
    con = sqlite3.connect(args.db)
    try:
        for row in eligible:
            con.execute(
                """
                UPDATE claims
                SET review_status = ?, updated_at = ?
                WHERE claim_id = ?
                  AND claim_type = 'insight_card_candidate'
                  AND review_status = ?
                """,
                (args.to_status, now_iso(), row["claim_id"], args.from_status),
            )
            stats["updated"] += con.total_changes - stats["updated"]
        con.commit()
    finally:
        con.close()
    stats["archived"] = write_archive(args.archive, eligible, report_map, args.to_status)
    return stats


def main() -> int:
    parser = argparse.ArgumentParser(description="Explicitly promote reviewed Base2026 insight-card candidates.")
    parser.add_argument("--review-report", type=Path, required=True)
    parser.add_argument("--db", type=Path, default=DB)
    parser.add_argument("--recommendation", default="promotion_candidate")
    parser.add_argument("--claim-ids", default="", help="Optional comma-separated allowlist. Defaults to report recommendation.")
    parser.add_argument("--from-status", default="pending")
    parser.add_argument("--to-status", default="approved")
    parser.add_argument("--archive", type=Path, default=DEFAULT_ARCHIVE)
    parser.add_argument("--archive-report-only", action="store_true", help="Archive selected report candidates without updating SQLite.")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    stats = promote(args)
    print(json.dumps(stats, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
