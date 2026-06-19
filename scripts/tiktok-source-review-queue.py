from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TIKTOK = ROOT / "12_knowledge-base" / "sources" / "tiktok"
VIDEOS_CSV = TIKTOK / "videos.csv"
TRANSCRIPTS = TIKTOK / "transcripts"
RAW_DIR = TRANSCRIPTS / "raw"
AUDIO_DIR = TRANSCRIPTS / "audio-fallback"
POLISHED_QA_DIR = TRANSCRIPTS / "polished-qa"
POLISHED_DIR = TRANSCRIPTS / "polished"
CLEAN_DIR = TRANSCRIPTS / "clean"
ASR_DIR = TRANSCRIPTS / "asr"


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def find_raw_captions(video_id: str) -> list[Path]:
    if not RAW_DIR.exists():
        return []
    return sorted(path for path in RAW_DIR.rglob(f"{video_id}*.vtt") if path.is_file())


def find_audio(video_id: str) -> list[Path]:
    if not AUDIO_DIR.exists():
        return []
    return sorted(
        path
        for path in AUDIO_DIR.iterdir()
        if path.is_file()
        and path.stem == video_id
        and path.suffix.lower() in {".mp3", ".mp4", ".m4a", ".webm", ".wav"}
    )


def file_if_exists(path: Path) -> str:
    return rel(path) if path.exists() else ""


def classify(row: dict[str, str]) -> dict[str, object]:
    video_id = row.get("video_id", "").strip()
    captions = find_raw_captions(video_id)
    audio = find_audio(video_id)
    qa_path = POLISHED_QA_DIR / f"{video_id}.json"

    if captions:
        reason = "local_caption_exists"
        priority = 1
        next_step = "review_caption_and_qa_before_public_release"
    elif audio:
        reason = "audio_available_retry_asr"
        priority = 2
        next_step = "retry_asr_then_review_transcript"
    else:
        reason = "no_local_caption_or_audio"
        priority = 3
        next_step = "recover_source_or_keep_private"

    qa_status = ""
    qa_notes_count = 0
    if qa_path.exists():
        try:
            payload = json.loads(qa_path.read_text(encoding="utf-8"))
            qa_status = str(payload.get("status") or "")
            notes = payload.get("notes")
            if isinstance(notes, list):
                qa_notes_count = len(notes)
            elif notes:
                qa_notes_count = 1
        except json.JSONDecodeError:
            qa_status = "invalid_json"

    return {
        "video_id": video_id,
        "creator_id": row.get("creator_id", ""),
        "url": row.get("url", ""),
        "published_at": row.get("published_at", ""),
        "reason": reason,
        "priority": priority,
        "next_step": next_step,
        "qa_status": qa_status,
        "qa_notes_count": qa_notes_count,
        "raw_caption_count": len(captions),
        "audio_count": len(audio),
        "has_clean_transcript": (CLEAN_DIR / f"{video_id}.txt").exists(),
        "has_polished_transcript": (POLISHED_DIR / f"{video_id}.txt").exists(),
        "has_asr_text": (ASR_DIR / f"{video_id}.txt").exists(),
        "raw_caption_path": rel(captions[0]) if captions else "",
        "audio_path": rel(audio[0]) if audio else "",
        "clean_path": file_if_exists(CLEAN_DIR / f"{video_id}.txt"),
        "polished_path": file_if_exists(POLISHED_DIR / f"{video_id}.txt"),
        "qa_path": file_if_exists(qa_path),
    }


def build_report(rows: list[dict[str, str]], creator: str = "") -> dict[str, object]:
    targets = [
        row
        for row in rows
        if row.get("transcript_status") == "needs_source_review"
        or row.get("review_status") == "needs_source_review"
    ]
    if creator:
        targets = [row for row in targets if row.get("creator_id") == creator]

    queue = [classify(row) for row in targets]
    queue.sort(key=lambda item: (item["priority"], item.get("published_at") or "", item["video_id"]), reverse=False)

    reason_counts = Counter(str(item["reason"]) for item in queue)
    creator_counts = Counter(str(item["creator_id"]) for item in queue)
    qa_counts = Counter(str(item["qa_status"] or "missing") for item in queue)

    return {
        "ok": True,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": rel(VIDEOS_CSV),
        "total": len(queue),
        "reason_counts": dict(reason_counts),
        "creator_counts": dict(creator_counts),
        "qa_status_counts": dict(qa_counts),
        "rows": queue,
    }


def print_table(rows: list[dict[str, object]], limit: int) -> None:
    shown = rows[:limit] if limit else rows
    print("priority\treason\tcreator\tpublished\tvideo_id\tqa\tnext_step")
    for item in shown:
        print(
            "\t".join(
                [
                    str(item["priority"]),
                    str(item["reason"]),
                    str(item["creator_id"]),
                    str(item["published_at"]),
                    str(item["video_id"]),
                    str(item.get("qa_status") or "missing"),
                    str(item["next_step"]),
                ]
            )
        )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="List TikTok needs_source_review rows as a safe, bounded review queue."
    )
    parser.add_argument("--creator", default="", help="Optional exact creator_id filter.")
    parser.add_argument("--limit", type=int, default=25, help="Rows to print in table mode. Use 0 for all.")
    parser.add_argument("--json", action="store_true", help="Print full JSON report instead of a compact table.")
    parser.add_argument("--out", type=Path, default=None, help="Optional JSON report path.")
    args = parser.parse_args()

    report = build_report(read_rows(VIDEOS_CSV), creator=args.creator)

    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(
            json.dumps(
                {
                    "ok": report["ok"],
                    "total": report["total"],
                    "reason_counts": report["reason_counts"],
                    "creator_counts": report["creator_counts"],
                    "qa_status_counts": report["qa_status_counts"],
                },
                ensure_ascii=False,
            )
        )
        print_table(report["rows"], args.limit)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
