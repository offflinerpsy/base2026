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


def current_rows(db: Path, ids: list[str]) -> list[dict]:
    if not ids:
        return []
    con = sqlite3.connect(db)
    con.row_factory = sqlite3.Row
    try:
        placeholders = ",".join("?" for _ in ids)
        rows = con.execute(
            f"""
            SELECT claim_id, claim_text, topic, claim_type, review_status
            FROM claims
            WHERE claim_id IN ({placeholders})
            ORDER BY claim_id
            """,
            ids,
        ).fetchall()
    finally:
        con.close()
    return [dict(row) for row in rows]


def promote(args: argparse.Namespace) -> dict:
    report = load_report(args.review_report)
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
        "selected_claim_ids": [row["claim_id"] for row in eligible],
    }
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
    return stats


def main() -> int:
    parser = argparse.ArgumentParser(description="Explicitly promote reviewed Base2026 insight-card candidates.")
    parser.add_argument("--review-report", type=Path, required=True)
    parser.add_argument("--db", type=Path, default=DB)
    parser.add_argument("--recommendation", default="promotion_candidate")
    parser.add_argument("--claim-ids", default="", help="Optional comma-separated allowlist. Defaults to report recommendation.")
    parser.add_argument("--from-status", default="pending")
    parser.add_argument("--to-status", default="approved")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    stats = promote(args)
    print(json.dumps(stats, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
