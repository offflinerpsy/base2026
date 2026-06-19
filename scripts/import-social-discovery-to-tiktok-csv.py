#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import os
import shutil
import tempfile
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / ".planning" / "social-discovered.jsonl"
DEFAULT_VIDEOS_CSV = ROOT / "12_knowledge-base" / "sources" / "tiktok" / "videos.csv"
DEFAULT_CUTOFF_DATE = "2025-05-24"
DEFAULT_REPORT = ROOT / ".planning" / "social-discovery-import-report.json"

FIELDNAMES = [
    "video_id",
    "creator_id",
    "platform",
    "url",
    "published_at",
    "collected_at",
    "title_or_description",
    "hashtags",
    "duration_seconds",
    "metrics_json",
    "transcript_status",
    "caption_source",
    "evidence_path",
    "review_status",
    "notes",
]


@dataclass
class ImportCandidate:
    video_id: str
    creator_id: str
    url: str
    published_at: str
    collected_at: str
    title_or_description: str
    duration_seconds: str
    discovery_adapter: str
    is_old: bool


def resolve_path(raw: str | Path) -> Path:
    path = Path(raw)
    return path if path.is_absolute() else (ROOT / path).resolve()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Dry-run or import private social discovery JSONL into the existing TikTok videos.csv queue."
    )
    parser.add_argument("--input", default=str(DEFAULT_INPUT), help="Private discovery JSONL path.")
    parser.add_argument("--videos-csv", default=str(DEFAULT_VIDEOS_CSV), help="Existing TikTok videos.csv path.")
    parser.add_argument("--cutoff-date", default=DEFAULT_CUTOFF_DATE, help="YYYY-MM-DD old-source cutoff.")
    parser.add_argument("--collected-at", default=date.today().isoformat(), help="YYYY-MM-DD collection date for new rows.")
    parser.add_argument("--creator", default="", help="Optional creator_id or creator handle filter.")
    parser.add_argument("--limit", type=int, default=0, help="Optional max number of new rows to add.")
    parser.add_argument("--apply", action="store_true", help="Write videos.csv. Without this, only reports a dry run.")
    parser.add_argument(
        "--report",
        default=str(DEFAULT_REPORT),
        help="JSON report path. Defaults to ignored .planning/social-discovery-import-report.json.",
    )
    return parser.parse_args()


def parse_date(raw: str) -> date | None:
    raw = (raw or "").strip()
    if not raw:
        return None
    for fmt in ("%Y-%m-%d", "%Y%m%d"):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    return None


def as_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open(encoding="utf-8") as handle:
        for line_no, line in enumerate(handle, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                value = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"{path}:{line_no}: invalid JSONL: {exc}") from exc
            if not isinstance(value, dict):
                raise ValueError(f"{path}:{line_no}: expected JSON object")
            rows.append(value)
    return rows


def read_videos_csv(path: Path) -> tuple[list[dict[str, str]], list[str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError(f"{path} has no CSV header")
        rows = [{field: as_text(row.get(field, "")) for field in reader.fieldnames} for row in reader]
    return rows, list(reader.fieldnames)


def creator_matches(row: dict[str, Any], requested: str) -> bool:
    if not requested:
        return True
    requested = requested.strip().lstrip("@").lower()
    candidates = [
        as_text(row.get("creator_id")).lower(),
        as_text(row.get("creator_handle")).lstrip("@").lower(),
        f"tiktok-{as_text(row.get('creator_handle')).lstrip('@').lower()}",
    ]
    return requested in candidates


def candidate_from_row(row: dict[str, Any], cutoff: date, collected_at: str) -> ImportCandidate | None:
    if as_text(row.get("record_type")) != "source":
        return None
    if as_text(row.get("platform")).lower() != "tiktok":
        return None

    video_id = as_text(row.get("post_id") or row.get("video_id"))
    creator_id = as_text(row.get("creator_id"))
    url = as_text(row.get("source_url") or row.get("url"))
    if not video_id or not creator_id or not url:
        return None

    published_at = as_text(row.get("published_at"))
    published_date = parse_date(published_at)
    is_old = bool(published_date and published_date < cutoff)
    duration = as_text(row.get("duration_seconds"))
    if duration.endswith(".0"):
        duration = duration[:-2]
    return ImportCandidate(
        video_id=video_id,
        creator_id=creator_id,
        url=url,
        published_at=published_at,
        collected_at=collected_at,
        title_or_description=as_text(row.get("title_or_description") or row.get("post_caption")),
        duration_seconds=duration,
        discovery_adapter=as_text(row.get("discovery_adapter")),
        is_old=is_old,
    )


def csv_row(candidate: ImportCandidate, cutoff_date: str) -> dict[str, str]:
    status = "out_of_scope_old" if candidate.is_old else "queued"
    review_status = "out_of_scope_old" if candidate.is_old else "new"
    note = f"Social discovery import via {candidate.discovery_adapter or 'unknown_adapter'}"
    if candidate.is_old:
        note = f"{note}; Excluded from active processing: older than {cutoff_date}"
    return {
        "video_id": candidate.video_id,
        "creator_id": candidate.creator_id,
        "platform": "tiktok",
        "url": candidate.url,
        "published_at": candidate.published_at,
        "collected_at": candidate.collected_at,
        "title_or_description": candidate.title_or_description,
        "hashtags": "",
        "duration_seconds": candidate.duration_seconds,
        "metrics_json": "",
        "transcript_status": status,
        "caption_source": "",
        "evidence_path": "",
        "review_status": review_status,
        "notes": note,
    }


def update_existing(row: dict[str, str], candidate: ImportCandidate, cutoff_date: str) -> bool:
    changed = False
    for source, target in [
        (candidate.url, "url"),
        (candidate.published_at, "published_at"),
        (candidate.title_or_description, "title_or_description"),
        (candidate.duration_seconds, "duration_seconds"),
    ]:
        if source and not row.get(target):
            row[target] = source
            changed = True

    if candidate.is_old and row.get("transcript_status") in {"", "pending", "queued"}:
        row["transcript_status"] = "out_of_scope_old"
        row["review_status"] = "out_of_scope_old"
        old_note = row.get("notes", "")
        marker = f"Excluded from active processing: older than {cutoff_date}"
        row["notes"] = "; ".join([part for part in [old_note, marker] if part and marker not in old_note])
        changed = True
    return changed


def write_videos_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            for row in rows:
                writer.writerow({field: row.get(field, "") for field in fieldnames})
        os.replace(tmp_name, path)
    finally:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)


def main() -> int:
    args = parse_args()
    input_path = resolve_path(args.input)
    videos_csv = resolve_path(args.videos_csv)
    report_path = resolve_path(args.report)
    cutoff = parse_date(args.cutoff_date)
    collected_at = parse_date(args.collected_at)
    if cutoff is None:
        raise ValueError(f"Invalid --cutoff-date: {args.cutoff_date}")
    if collected_at is None:
        raise ValueError(f"Invalid --collected-at: {args.collected_at}")
    if not input_path.exists():
        raise FileNotFoundError(f"Discovery JSONL not found: {input_path}")
    if not videos_csv.exists():
        raise FileNotFoundError(f"TikTok videos.csv not found: {videos_csv}")

    discovery_rows = read_jsonl(input_path)
    videos_rows, fieldnames = read_videos_csv(videos_csv)
    if fieldnames != FIELDNAMES:
        raise ValueError(f"Unexpected videos.csv header. Expected {FIELDNAMES}; got {fieldnames}")

    existing_by_id: dict[str, dict[str, str]] = {}
    duplicate_video_ids: set[str] = set()
    for row in videos_rows:
        video_id = row.get("video_id", "")
        if not video_id:
            continue
        if video_id in existing_by_id:
            duplicate_video_ids.add(video_id)
            continue
        existing_by_id[video_id] = row

    summary: dict[str, Any] = {
        "apply": bool(args.apply),
        "input": str(input_path.relative_to(ROOT) if input_path.is_relative_to(ROOT) else input_path),
        "videos_csv": str(videos_csv.relative_to(ROOT) if videos_csv.is_relative_to(ROOT) else videos_csv),
        "cutoff_date": args.cutoff_date,
        "collected_at": args.collected_at,
        "input_rows": len(discovery_rows),
        "candidate_rows": 0,
        "skipped_failure_rows": 0,
        "skipped_non_tiktok_rows": 0,
        "skipped_incomplete_rows": 0,
        "skipped_creator_filter_rows": 0,
        "duplicate_existing_rows": 0,
        "duplicate_input_rows": 0,
        "existing_duplicate_video_ids": sorted(duplicate_video_ids),
        "added_rows": 0,
        "added_recent_queued_rows": 0,
        "added_out_of_scope_old_rows": 0,
        "updated_existing_rows": 0,
        "limited_rows": 0,
        "new_video_ids": [],
        "updated_video_ids": [],
    }

    seen_input_ids: set[str] = set()
    appended_rows: list[dict[str, str]] = []

    for raw in discovery_rows:
        record_type = as_text(raw.get("record_type"))
        platform = as_text(raw.get("platform")).lower()
        if record_type == "discovery_failure":
            summary["skipped_failure_rows"] += 1
            continue
        if platform != "tiktok":
            summary["skipped_non_tiktok_rows"] += 1
            continue
        if not creator_matches(raw, args.creator):
            summary["skipped_creator_filter_rows"] += 1
            continue
        candidate = candidate_from_row(raw, cutoff, args.collected_at)
        if candidate is None:
            summary["skipped_incomplete_rows"] += 1
            continue
        summary["candidate_rows"] += 1
        if candidate.video_id in seen_input_ids:
            summary["duplicate_input_rows"] += 1
            continue
        seen_input_ids.add(candidate.video_id)

        existing = existing_by_id.get(candidate.video_id)
        if existing:
            summary["duplicate_existing_rows"] += 1
            if update_existing(existing, candidate, args.cutoff_date):
                summary["updated_existing_rows"] += 1
                summary["updated_video_ids"].append(candidate.video_id)
            continue

        if args.limit and summary["added_rows"] >= args.limit:
            summary["limited_rows"] += 1
            continue

        new_row = csv_row(candidate, args.cutoff_date)
        appended_rows.append(new_row)
        existing_by_id[candidate.video_id] = new_row
        summary["added_rows"] += 1
        summary["new_video_ids"].append(candidate.video_id)
        if candidate.is_old:
            summary["added_out_of_scope_old_rows"] += 1
        else:
            summary["added_recent_queued_rows"] += 1

    final_rows = videos_rows + appended_rows
    if args.apply and (summary["added_rows"] or summary["updated_existing_rows"]):
        backup_dir = ROOT / ".planning" / "backups"
        backup_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        backup_path = backup_dir / f"videos-before-social-import-{timestamp}.csv"
        shutil.copy2(videos_csv, backup_path)
        write_videos_csv(videos_csv, final_rows, fieldnames)
        summary["backup"] = str(backup_path.relative_to(ROOT))
    else:
        summary["backup"] = ""

    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")

    print(json.dumps(summary, indent=2, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
