from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
KB = ROOT / "12_knowledge-base"
DB = KB / "indexes" / "kb.sqlite"
DATA_ROOT = ROOT / "public-data" / "tiktok"


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def stable_claim_id(row: dict) -> str:
    payload = "\n".join(
        [
            row.get("source_id") or "",
            row.get("topic_label") or "",
            row.get("claim_text") or "",
            row.get("evidence_excerpt") or "",
            row.get("prompt_version") or "",
        ]
    )
    return "claim-backfill-" + hashlib.sha256(payload.encode("utf-8")).hexdigest()[:20]


def source_map(data_root: Path) -> dict[str, dict]:
    mapping: dict[str, dict] = {}
    for row in read_jsonl(data_root / "source_records.jsonl"):
        source_id = row.get("source_id") or ""
        if source_id:
            mapping[source_id] = row
    return mapping


def video_id_for(row: dict, sources: dict[str, dict]) -> str:
    source = sources.get(row.get("source_id") or "", {})
    for key in ("video_id", "post_id"):
        value = source.get(key) or row.get(key)
        if value:
            return str(value)
    item_id = row.get("item_id") or source.get("item_id") or ""
    if item_id.startswith("tiktok-video-"):
        return item_id.removeprefix("tiktok-video-")
    source_id = row.get("source_id") or ""
    return source_id.rsplit(":", 1)[-1] if ":" in source_id else ""


def import_candidates(args: argparse.Namespace) -> dict:
    rows = read_jsonl(args.input)
    sources = source_map(args.data_root)
    eligible_statuses = {status.strip() for status in args.status.split(",") if status.strip()}
    selected = [
        row
        for row in rows
        if (row.get("status") or "") in eligible_statuses
        and row.get("claim_text")
        and row.get("evidence_excerpt")
        and row.get("source_id") in sources
    ]
    stats = {
        "input": str(args.input),
        "dry_run": not args.apply,
        "rows": len(rows),
        "selected": len(selected),
        "inserted_claims": 0,
        "inserted_evidence": 0,
        "duplicates": 0,
        "skipped_missing_video": 0,
        "review_status": args.review_status,
        "backup": "",
    }
    if not args.apply:
        return stats

    backup = args.db.with_suffix(f".sqlite.bak-claim-import-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    shutil.copy2(args.db, backup)
    stats["backup"] = str(backup)
    con = sqlite3.connect(args.db)
    try:
        for row in selected:
            video_id = video_id_for(row, sources)
            if not video_id:
                stats["skipped_missing_video"] += 1
                continue
            exists = con.execute("SELECT 1 FROM generic_items WHERE platform_item_id = ?", (video_id,)).fetchone()
            if not exists:
                stats["skipped_missing_video"] += 1
                continue
            claim_id = row.get("claim_id") or stable_claim_id(row)
            before = con.total_changes
            con.execute(
                """
                INSERT OR IGNORE INTO claims
                (claim_id, claim_text, topic, claim_type, suggested_action, confidence, review_status, created_at, updated_at)
                VALUES (?, ?, ?, 'insight_card_candidate', ?, ?, ?, ?, ?)
                """,
                (
                    claim_id,
                    row.get("claim_text") or "",
                    row.get("topic_label") or row.get("topic") or "Uncategorized",
                    row.get("suggested_action") or "",
                    float(row.get("evidence_score") or 0.0),
                    args.review_status,
                    now_iso(),
                    now_iso(),
                ),
            )
            if con.total_changes == before:
                stats["duplicates"] += 1
            else:
                stats["inserted_claims"] += 1
            con.execute(
                """
                INSERT OR REPLACE INTO claim_evidence
                (claim_id, video_id, evidence_path, quote_or_span)
                VALUES (?, ?, ?, ?)
                """,
                (
                    claim_id,
                    video_id,
                    f"public-data/tiktok/passages.jsonl#source_id={row.get('source_id')}",
                    row.get("evidence_excerpt") or "",
                ),
            )
            stats["inserted_evidence"] += 1
        con.commit()
    finally:
        con.close()
    return stats


def main() -> int:
    parser = argparse.ArgumentParser(description="Import verified private claim candidates into the local Base2026 SQLite KB.")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--data-root", type=Path, default=DATA_ROOT)
    parser.add_argument("--db", type=Path, default=DB)
    parser.add_argument("--status", default="verified", help="Comma-separated candidate statuses eligible for import.")
    parser.add_argument("--review-status", default="pending", help="SQLite claims.review_status to assign.")
    parser.add_argument("--apply", action="store_true", help="Write to SQLite. Default is dry-run.")
    args = parser.parse_args()
    stats = import_candidates(args)
    print(json.dumps(stats, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
