from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "public-data" / "tiktok"
PLANNING = ROOT / ".planning"


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def load_sources(data_root: Path) -> dict[str, dict[str, Any]]:
    sources = {}
    for row in read_jsonl(data_root / "source_records.jsonl"):
        source_id = row.get("source_id") or ""
        if source_id:
            sources[source_id] = row
    return sources


def candidate_id(row: dict[str, Any]) -> str:
    claim_id = str(row.get("claim_id") or "")
    if claim_id.startswith("claim-backfill-"):
        return claim_id.removeprefix("claim-backfill-")[:16]
    return claim_id[:16]


def build_rows(report: dict[str, Any], sources: dict[str, dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    queue_by_source: dict[str, dict[str, Any]] = {}
    candidates: list[dict[str, Any]] = []

    for row in report.get("candidates") or []:
        source_id = row.get("source_id") or ""
        if not source_id:
            continue
        source = sources.get(source_id, {})
        queue_by_source.setdefault(
            source_id,
            {
                "source_id": source_id,
                "source_url": row.get("source_url") or source.get("source_url") or "",
                "creator_handle": row.get("creator_handle") or source.get("creator_handle") or source.get("handle") or "",
                "item_id": source.get("item_id") or f"tiktok-video-{row.get('video_id')}",
                "published_date": source.get("published_date") or source.get("published_at") or "",
                "review_status": row.get("review_status") or "",
            },
        )
        candidates.append(
            {
                "source_id": source_id,
                "candidate_id": candidate_id(row),
                "output_hash": candidate_id(row),
                "status": row.get("review_status") or "needs_human",
                "model_name": "base2026-needs-human-review-queue",
                "topic_label": row.get("topic") or "",
                "claim_text": row.get("claim_text") or "",
                "suggested_action": row.get("suggested_action") or "",
                "evidence_excerpt": row.get("evidence_excerpt") or "",
                "evidence_match_method": row.get("evidence_match_method") or "",
                "evidence_score": row.get("evidence_score"),
                "soft_warnings": row.get("soft_warnings") or [],
                "existing_public_candidate_count": row.get("existing_public_candidate_count", 0),
                "recommended_status": row.get("recommended_status") or "",
                "review_claim_id": row.get("claim_id") or "",
            }
        )

    queue = list(queue_by_source.values())
    queue.sort(key=lambda item: item["source_id"])
    candidates.sort(key=lambda item: (item["source_id"], item["candidate_id"]))
    return queue, candidates


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert a needs_human candidate review report into private review-packet JSONL inputs.")
    parser.add_argument("--review-report", type=Path, required=True)
    parser.add_argument("--data-root", type=Path, default=DATA_ROOT)
    parser.add_argument("--out-dir", type=Path, default=None)
    args = parser.parse_args()

    report = read_json(args.review_report)
    sources = load_sources(args.data_root)
    queue, candidates = build_rows(report, sources)

    out_dir = args.out_dir or (PLANNING / f"needs-human-review-{utc_stamp()}")
    queue_path = out_dir / "queue.jsonl"
    candidates_path = out_dir / "candidates.jsonl"
    summary_path = out_dir / "summary.json"
    write_jsonl(queue_path, queue)
    write_jsonl(candidates_path, candidates)
    summary = {
        "ok": True,
        "review_report": str(args.review_report),
        "out_dir": str(out_dir),
        "queue": str(queue_path),
        "candidates": str(candidates_path),
        "sources": len(queue),
        "candidates_count": len(candidates),
        "warnings": report.get("warning_counts") or {},
        "recommendations": report.get("recommendation_counts") or {},
    }
    write_json(summary_path, summary)
    print(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
