from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
KB = ROOT / "12_knowledge-base"
DB = KB / "indexes" / "kb.sqlite"
DEFAULT_IN = ROOT / ".planning" / "tiktok-ytdlp-20260608.jsonl"
TRANSCRIPT_ROOT = KB / "sources" / "tiktok" / "transcripts" / "auto-caption-20260608"


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def compact_space(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def title_from_record(row: dict) -> str:
    return compact_space(row.get("title") or row.get("caption_text") or "")[:280]


def split_passages(text: str, max_chars: int = 850) -> list[str]:
    text = compact_space(text)
    if not text:
        return []
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks: list[str] = []
    current = ""
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        if current and len(current) + 1 + len(sentence) > max_chars:
            chunks.append(current)
            current = sentence
        else:
            current = f"{current} {sentence}".strip()
    if current:
        chunks.append(current)
    return chunks or [text]


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def safe_filename(handle: str, video_id: str) -> str:
    clean_handle = re.sub(r"[^a-zA-Z0-9_-]+", "-", handle.strip("@")) or "creator"
    return f"{clean_handle}-{video_id}.txt"


def source_id_from_url(url: str) -> str:
    match = re.search(r"/video/(\d+)", url or "")
    return match.group(1) if match else ""


def normalize_flags(value: object) -> list[str]:
    if isinstance(value, list):
        return [str(flag) for flag in value if str(flag).strip()]
    if isinstance(value, str):
        return [flag.strip() for flag in value.split(",") if flag.strip()]
    return []


def normalize_row(row: dict) -> dict:
    source_url = compact_space(row.get("canonical_url") or row.get("webpage_url") or row.get("source_url") or "")
    creator_handle = compact_space(row.get("creator_handle") or row.get("handle") or "").lstrip("@")
    if not creator_handle:
        creator_url = compact_space(row.get("creator_url") or row.get("profile_url") or "")
        match = re.search(r"tiktok\.com/@([^/?#]+)", creator_url)
        if match:
            creator_handle = match.group(1)
    source_id = compact_space(str(row.get("source_id") or source_id_from_url(source_url)))
    caption_text = compact_space(row.get("caption_text") or "")
    transcript_text = compact_space(row.get("transcript_text") or caption_text)
    normalized = {
        **row,
        "platform": compact_space(row.get("platform") or "tiktok"),
        "creator_handle": creator_handle,
        "creator_url": compact_space(row.get("creator_url") or row.get("profile_url") or (f"https://www.tiktok.com/@{creator_handle}" if creator_handle else "")),
        "source_url": source_url,
        "canonical_url": source_url,
        "webpage_url": compact_space(row.get("webpage_url") or source_url),
        "source_id": source_id,
        "title": title_from_record(row),
        "caption_text": caption_text,
        "transcript_text": transcript_text,
        "transcript_source": compact_space(row.get("transcript_source") or ("platform_caption" if transcript_text else "")),
        "quality_flags": normalize_flags(row.get("quality_flags")),
    }
    return normalized


def load_rows(path: Path) -> list[dict]:
    return [normalize_row(json.loads(line)) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def importable(row: dict) -> bool:
    return skip_reason(row) == ""


def skip_reason(row: dict) -> str:
    flags = set(row.get("quality_flags") or [])
    if row.get("extraction_status") != "ok":
        return "extraction_not_ok"
    if "caption_ready" not in flags:
        return "not_caption_ready"
    if "needs_asr" in flags or "out_of_scope_candidate" in flags or "caption_too_short" in flags:
        return "blocked_quality_flag"
    if row.get("platform") != "tiktok":
        return "unsupported_platform"
    if not row.get("creator_handle") or not row.get("source_id") or not row.get("source_url"):
        return "missing_required_identity"
    if not compact_space(row.get("transcript_text") or row.get("caption_text") or ""):
        return "missing_text"
    return ""


def item_id_for(row: dict) -> str:
    return f"tiktok-video-{row['source_id']}"


def existing_item_ids(rows: Iterable[dict]) -> set[str]:
    if not DB.exists():
        return set()
    ids = [item_id_for(row) for row in rows]
    if not ids:
        return set()
    found: set[str] = set()
    con = sqlite3.connect(DB)
    try:
        for index in range(0, len(ids), 500):
            batch = ids[index : index + 500]
            placeholders = ",".join("?" for _ in batch)
            query = f"SELECT item_id FROM generic_items WHERE item_id IN ({placeholders})"
            found.update(row[0] for row in con.execute(query, batch).fetchall())
    finally:
        con.close()
    return found


def insert_rows(rows: Iterable[dict], dry_run: bool = False) -> dict:
    rows = list(rows)
    selected = [row for row in rows if importable(row)]
    skip_reasons: dict[str, int] = {}
    for row in rows:
        reason = skip_reason(row)
        if reason:
            skip_reasons[reason] = skip_reasons.get(reason, 0) + 1
    existing_ids = existing_item_ids(selected)
    stats = {
        "rows": len(rows),
        "selected": len(selected),
        "skipped": len(rows) - len(selected),
        "existing": len(existing_ids),
        "new": len(selected) - len(existing_ids),
        "inserted": 0,
        "duplicates": 0,
        "chunks": 0,
        "skip_reasons": skip_reasons,
    }
    if dry_run:
        return stats

    backup_path = DB.with_suffix(f".sqlite.bak-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    shutil.copy2(DB, backup_path)

    TRANSCRIPT_ROOT.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB)
    try:
        for row in selected:
            video_id = str(row["source_id"])
            handle = str(row["creator_handle"]).lstrip("@")
            creator_id = f"tiktok-{handle}"
            creator_handle = f"@{handle}"
            creator_url = row.get("creator_url") or f"https://www.tiktok.com/@{handle}"
            item_id = item_id_for(row)
            document_id = f"tiktok-doc-{video_id}-caption-polished"
            transcript_id = f"tiktok-transcript-{video_id}-caption-polished"
            transcript_text = compact_space(row.get("transcript_text") or row.get("caption_text") or "")
            title = title_from_record(row)
            captured_at = row.get("extracted_at") or now_iso()
            upload_date = row.get("upload_date") or ""
            published_at = ""
            if re.fullmatch(r"\d{8}", upload_date):
                published_at = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"
            source_url = row.get("source_url")
            transcript_path = TRANSCRIPT_ROOT / safe_filename(handle, video_id)
            transcript_path.write_text(transcript_text + "\n", encoding="utf-8")
            clean_rel = transcript_path.relative_to(KB).as_posix()
            meta = {
                "caption_source": row.get("caption_source"),
                "transcript_source": row.get("transcript_source"),
                "duration_seconds": row.get("duration_seconds"),
                "quality_flags": row.get("quality_flags"),
                "extractor": row.get("extractor"),
                "canonical_url": row.get("canonical_url"),
            }

            exists = con.execute("SELECT 1 FROM generic_items WHERE item_id = ?", (item_id,)).fetchone()
            if exists:
                stats["duplicates"] += 1
                continue

            con.execute(
                """
                INSERT OR IGNORE INTO creators
                (creator_id, platform, handle, url, niche, language, priority, status, added_at, last_inventory_at, notes)
                VALUES (?, 'tiktok', ?, ?, 'seo-geo-aeo', 'en', 'normal', 'active', ?, ?, ?)
                """,
                (creator_id, creator_handle, creator_url, captured_at, captured_at, "Imported from 2026-06-08 caption-first TikTok queue."),
            )
            con.execute(
                """
                INSERT INTO generic_items
                (item_id, source_id, source_type, platform_item_id, canonical_url, title, author, published_at, captured_at, status, metadata_json)
                VALUES (?, ?, 'tiktok_video', ?, ?, ?, ?, ?, ?, 'active', ?)
                """,
                (item_id, f"tiktok:{handle}:{video_id}", video_id, source_url, title, creator_id, published_at, captured_at, json.dumps(meta, ensure_ascii=False, sort_keys=True)),
            )
            con.execute(
                """
                INSERT INTO generic_documents
                (document_id, item_id, document_type, clean_path, language, sha256, created_at)
                VALUES (?, ?, 'transcript_polished', ?, 'en', ?, ?)
                """,
                (document_id, item_id, clean_rel, sha256_text(transcript_text), captured_at),
            )
            con.execute(
                """
                INSERT OR REPLACE INTO transcripts
                (transcript_id, video_id, source_type, raw_path, clean_path, language, confidence, created_at)
                VALUES (?, ?, 'platform_caption', '', ?, 'en', 0.75, ?)
                """,
                (transcript_id, video_id, clean_rel, captured_at),
            )
            con.execute(
                """
                INSERT OR REPLACE INTO videos
                (video_id, creator_id, platform, url, published_at, collected_at, title_or_description, hashtags, duration_seconds, metrics_json, transcript_status, caption_source, evidence_path, review_status, notes)
                VALUES (?, ?, 'tiktok', ?, ?, ?, ?, '', ?, '{}', 'caption_ready', ?, ?, 'needs_review', ?)
                """,
                (video_id, creator_id, source_url, published_at, captured_at, title, row.get("duration_seconds"), row.get("caption_source"), clean_rel, "Caption-first import; ASR not required by initial quality gate."),
            )
            for index, passage in enumerate(split_passages(transcript_text), start=1):
                chunk_id = f"{item_id}-chunk-{index:03d}"
                con.execute(
                    """
                    INSERT INTO chunks
                    (chunk_id, document_id, item_id, chunk_index, text, start_offset, end_offset, timestamp_start, timestamp_end)
                    VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, NULL)
                    """,
                    (chunk_id, document_id, item_id, index, passage),
                )
                stats["chunks"] += 1
            stats["inserted"] += 1
        con.commit()
    finally:
        con.close()
    stats["backup"] = str(backup_path)
    return stats


def main() -> int:
    parser = argparse.ArgumentParser(description="Import caption-ready TikTok staging records into Base2026 SQLite KB.")
    parser.add_argument("--input", type=Path, default=DEFAULT_IN)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--source-id", default="")
    parser.add_argument("--report", type=Path, default=None)
    args = parser.parse_args()
    rows = load_rows(args.input)
    if args.source_id:
        rows = [row for row in rows if row.get("source_id") == args.source_id]
    if args.limit > 0:
        rows = rows[: args.limit]
    stats = insert_rows(rows, dry_run=args.dry_run)
    payload = {"ok": True, "input": str(args.input), "dry_run": args.dry_run, "stats": stats}
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        payload["report"] = str(args.report)
    print(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
