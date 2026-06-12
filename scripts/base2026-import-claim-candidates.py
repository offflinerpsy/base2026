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
DEFAULT_ARCHIVE = KB / "sources" / "tiktok" / "insight-candidates" / "reviewed-candidates.jsonl"


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


def read_archive(path: Path) -> dict[str, dict]:
    archived: dict[str, dict] = {}
    if not path.exists():
        return archived
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue
            row = json.loads(line)
            claim_id = row.get("claim_id") or ""
            if claim_id:
                archived[claim_id] = row
    return archived


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


def archive_row(row: dict, source: dict, claim_id: str, review_status: str) -> dict:
    source_id = row.get("source_id") or source.get("source_id") or ""
    video_id = video_id_for(row, {source_id: source})
    return {
        "archive_version": 1,
        "archived_at": now_iso(),
        "claim_id": claim_id,
        "claim_text": row.get("claim_text") or "",
        "claim_type": "insight_card_candidate",
        "confidence": row.get("evidence_score"),
        "creator_handle": row.get("creator_handle") or source.get("creator_handle") or source.get("handle") or "",
        "evidence_excerpt": row.get("evidence_excerpt") or "",
        "evidence_path": row.get("evidence_path") or f"public-data/tiktok/passages.jsonl#source_id={source_id}",
        "evidence_score": row.get("evidence_score"),
        "item_id": row.get("item_id") or source.get("item_id") or f"tiktok-video-{video_id}",
        "review_status": review_status,
        "source_id": source_id,
        "source_url": row.get("source_url") or source.get("source_url") or "",
        "suggested_action": row.get("suggested_action") or "",
        "topic": row.get("topic_label") or row.get("topic") or "Uncategorized",
        "video_id": str(video_id),
    }


def archive_imported(path: Path, rows: list[dict], sources: dict[str, dict], review_status: str) -> int:
    if not rows:
        return 0
    archived = read_archive(path)
    written = 0
    for row in rows:
        source_id = row.get("source_id") or ""
        source = sources.get(source_id) or {}
        claim_id = row.get("claim_id") or stable_claim_id(row)
        record = archive_row(row, source, claim_id, review_status)
        if not record["claim_text"] or not record["video_id"]:
            continue
        archived[claim_id] = record
        written += 1
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        for claim_id in sorted(archived):
            handle.write(json.dumps(archived[claim_id], ensure_ascii=False, sort_keys=True) + "\n")
    return written


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
        "archive": str(args.archive) if args.archive else "",
        "archived": 0,
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
    if args.archive:
        stats["archived"] = archive_imported(args.archive, selected, sources, args.review_status)
    return stats


def main() -> int:
    parser = argparse.ArgumentParser(description="Import verified private claim candidates into the local Base2026 SQLite KB.")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--data-root", type=Path, default=DATA_ROOT)
    parser.add_argument("--db", type=Path, default=DB)
    parser.add_argument("--status", default="verified", help="Comma-separated candidate statuses eligible for import.")
    parser.add_argument("--review-status", default="pending", help="SQLite claims.review_status to assign.")
    parser.add_argument("--archive", type=Path, default=None, help="Optional private reviewed-candidates replay archive.")
    parser.add_argument("--default-archive", action="store_true", help="Archive imported rows to the standard private replay archive.")
    parser.add_argument("--apply", action="store_true", help="Write to SQLite. Default is dry-run.")
    args = parser.parse_args()
    if args.default_archive and not args.archive:
        args.archive = DEFAULT_ARCHIVE
    stats = import_candidates(args)
    print(json.dumps(stats, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
