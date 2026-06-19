from __future__ import annotations

import argparse
import csv
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
TIKTOK = ROOT / "12_knowledge-base" / "sources" / "tiktok"
VIDEOS_CSV = TIKTOK / "videos.csv"
TRANSCRIPTS = TIKTOK / "transcripts"
POLISHED_QA_DIR = TRANSCRIPTS / "polished-qa"
POLISHED_DIR = TRANSCRIPTS / "polished"
CLEAN_DIR = TRANSCRIPTS / "clean"
BACKUP_DIR = ROOT / ".planning" / "backups"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def read_rows(path: Path) -> tuple[list[dict[str, str]], list[str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader), list(reader.fieldnames or [])


def write_rows(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def load_qa(video_id: str) -> dict[str, Any]:
    path = POLISHED_QA_DIR / f"{video_id}.json"
    if not path.exists():
        return {"ok": False, "error": "missing_qa", "path": str(path)}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return {"ok": False, "error": f"invalid_qa_json: {exc}", "path": str(path)}
    return {"ok": True, "payload": payload, "path": str(path)}


def append_note(existing: str, note: str) -> str:
    parts = [part.strip() for part in (existing or "").split(";") if part.strip()]
    if note not in parts:
        parts.append(note)
    return "; ".join(parts)


def inspect_row(row: dict[str, str]) -> dict[str, Any]:
    video_id = (row.get("video_id") or "").strip()
    result: dict[str, Any] = {
        "video_id": video_id,
        "creator_id": row.get("creator_id", ""),
        "previous_transcript_status": row.get("transcript_status", ""),
        "previous_review_status": row.get("review_status", ""),
    }
    if not video_id:
        return {**result, "ok": False, "error": "missing_video_id"}
    if row.get("transcript_status") != "needs_source_review":
        return {**result, "ok": False, "error": "not_needs_source_review"}
    qa = load_qa(video_id)
    if not qa["ok"]:
        return {**result, "ok": False, "error": qa["error"], "qa_path": qa["path"]}
    payload = qa["payload"]
    if payload.get("status") != "pass":
        return {**result, "ok": False, "error": "qa_not_pass", "qa_status": payload.get("status"), "qa_path": qa["path"]}
    if not (CLEAN_DIR / f"{video_id}.txt").exists():
        return {**result, "ok": False, "error": "missing_clean_transcript"}
    if not (POLISHED_DIR / f"{video_id}.txt").exists():
        return {**result, "ok": False, "error": "missing_polished_transcript"}
    return {
        **result,
        "ok": True,
        "qa_path": qa["path"],
        "reviewed_by": payload.get("reviewed_by", ""),
        "reviewed_at": payload.get("reviewed_at", ""),
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Move explicitly reviewed TikTok source-review rows back to transcribed status."
    )
    parser.add_argument("--video-id", action="append", default=[], help="Video id to clear. Repeat for multiple ids.")
    parser.add_argument("--manifest", type=Path, default=None, help="Optional QA review manifest with decisions[].")
    parser.add_argument("--apply", action="store_true", help="Write videos.csv. Default is dry-run.")
    parser.add_argument("--out", type=Path, default=None, help="Optional summary JSON path.")
    args = parser.parse_args()

    requested = set(args.video_id)
    if args.manifest:
        manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
        for item in manifest.get("decisions", []):
            if isinstance(item, dict):
                requested.add(str(item.get("video_id", "")).strip())
    requested.discard("")
    if not requested:
        raise SystemExit("At least one --video-id or --manifest decision is required.")

    rows, fieldnames = read_rows(VIDEOS_CSV)
    by_id = {row.get("video_id", ""): row for row in rows}
    summary: dict[str, Any] = {
        "ok": True,
        "created_at": utc_now(),
        "applied": args.apply,
        "requested": sorted(requested),
        "counts": {"cleared": 0, "blocked": 0, "missing": 0},
        "rows": [],
    }

    note = f"Source-review cleared after explicit QA pass at {summary['created_at']}"
    for video_id in sorted(requested):
        row = by_id.get(video_id)
        if row is None:
            summary["counts"]["missing"] += 1
            summary["rows"].append({"video_id": video_id, "ok": False, "error": "missing_csv_row"})
            continue
        inspected = inspect_row(row)
        summary["rows"].append(inspected)
        if not inspected["ok"]:
            summary["counts"]["blocked"] += 1
            continue
        summary["counts"]["cleared"] += 1
        if args.apply:
            row["transcript_status"] = "transcribed"
            row["review_status"] = "source_review_pass"
            row["notes"] = append_note(row.get("notes", ""), note)

    if summary["counts"]["blocked"] or summary["counts"]["missing"]:
        summary["ok"] = False

    if args.apply and summary["counts"]["cleared"]:
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        backup = BACKUP_DIR / f"videos-before-source-review-clear-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.csv"
        shutil.copy2(VIDEOS_CSV, backup)
        write_rows(VIDEOS_CSV, rows, fieldnames)
        summary["backup"] = str(backup.relative_to(ROOT))

    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True))
    return 0 if summary["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
