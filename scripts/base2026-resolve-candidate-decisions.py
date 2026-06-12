from __future__ import annotations

import argparse
import json
import shutil
import sqlite3
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
KB = ROOT / "12_knowledge-base"
DB = KB / "indexes" / "kb.sqlite"
DEFAULT_ARCHIVE = KB / "sources" / "tiktok" / "insight-candidates" / "reviewed-candidates.jsonl"


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def read_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def read_archive(path: Path) -> dict[str, dict]:
    rows: dict[str, dict] = {}
    if not path.exists():
        return rows
    for row in read_jsonl(path):
        claim_id = row.get("claim_id") or ""
        if claim_id:
            rows[claim_id] = row
    return rows


def write_archive(path: Path, rows: dict[str, dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        for claim_id in sorted(rows):
            handle.write(json.dumps(rows[claim_id], ensure_ascii=False, sort_keys=True) + "\n")


def decision_status(decision: str, rewrite_status: str, reject_status: str) -> str | None:
    if decision in {"approve", "rewrite", "new_candidate"}:
        return rewrite_status
    if decision == "reject":
        return reject_status
    if decision == "needs_human":
        return None
    return None


def mapped_decisions(candidates_path: Path, review_path: Path, args: argparse.Namespace) -> list[dict]:
    candidate_map: dict[str, dict] = {}
    for row in read_jsonl(candidates_path):
        candidate_id = row.get("candidate_id") or ""
        if candidate_id:
            candidate_map[candidate_id] = row

    rows: list[dict] = []
    review = read_json(review_path)
    for decision in review.get("decisions") or []:
        candidate_id = decision.get("candidate_id") or ""
        candidate = candidate_map.get(candidate_id)
        if not candidate:
            continue
        claim_id = candidate.get("review_claim_id") or ""
        status = decision_status(decision.get("decision") or "", args.rewrite_status, args.reject_status)
        rows.append(
            {
                "candidate_id": candidate_id,
                "claim_id": claim_id,
                "decision": decision.get("decision") or "",
                "reason": decision.get("reason") or "",
                "status": status,
            }
        )
    return rows


def apply_resolutions(args: argparse.Namespace) -> dict:
    rows = mapped_decisions(args.candidates, args.review, args)
    resolved = [row for row in rows if row.get("claim_id") and row.get("status")]
    stats = {
        "archive": str(args.archive),
        "backup": "",
        "candidates": str(args.candidates),
        "decisions": len(rows),
        "dry_run": not args.apply,
        "review": str(args.review),
        "resolved": len(resolved),
        "status_counts": dict(Counter(row["status"] for row in resolved)),
        "unresolved_kept": sum(1 for row in rows if row.get("decision") == "needs_human"),
        "updated_archive": 0,
        "updated_db": 0,
    }
    if not args.apply:
        return stats

    backup = args.db.with_suffix(f".sqlite.bak-resolve-candidates-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    shutil.copy2(args.db, backup)
    stats["backup"] = str(backup)

    con = sqlite3.connect(args.db)
    try:
        for row in resolved:
            before = con.total_changes
            con.execute(
                """
                UPDATE claims
                SET review_status = ?, updated_at = ?
                WHERE claim_id = ?
                  AND claim_type = 'insight_card_candidate'
                  AND review_status = ?
                """,
                (row["status"], now_iso(), row["claim_id"], args.from_status),
            )
            stats["updated_db"] += con.total_changes - before
        con.commit()
    finally:
        con.close()

    archive_rows = read_archive(args.archive)
    for row in resolved:
        claim_id = row["claim_id"]
        archived = archive_rows.get(claim_id)
        if not archived:
            continue
        archived["review_status"] = row["status"]
        archived["resolved_at"] = now_iso()
        archived["resolution_decision"] = row["decision"]
        archived["resolution_reason"] = row["reason"]
        stats["updated_archive"] += 1
    write_archive(args.archive, archive_rows)
    return stats


def main() -> int:
    parser = argparse.ArgumentParser(description="Resolve old needs_human candidates after a manual review decision file.")
    parser.add_argument("--candidates", type=Path, required=True, help="Private candidates JSONL produced by prepare-needs-human-review.")
    parser.add_argument("--review", type=Path, required=True, help="Manual review decision JSON.")
    parser.add_argument("--db", type=Path, default=DB)
    parser.add_argument("--archive", type=Path, default=DEFAULT_ARCHIVE)
    parser.add_argument("--from-status", default="needs_human")
    parser.add_argument("--rewrite-status", default="reject_candidate")
    parser.add_argument("--reject-status", default="rejected")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    stats = apply_resolutions(args)
    print(json.dumps(stats, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
