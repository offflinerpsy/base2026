from __future__ import annotations

import argparse
import csv
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TIKTOK = ROOT / "12_knowledge-base" / "sources" / "tiktok"
VIDEOS_CSV = TIKTOK / "videos.csv"
AUDIO_DIR = TIKTOK / "transcripts" / "audio-fallback"
RAW_DIR = TIKTOK / "transcripts" / "raw"


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def write_rows(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def run(command: list[str], timeout: int = 30) -> tuple[int, str]:
    try:
        result = subprocess.run(
            command,
            cwd=ROOT,
            text=True,
            capture_output=True,
            timeout=timeout,
            check=False,
        )
    except FileNotFoundError:
        return 127, f"missing command: {command[0]}"
    except subprocess.TimeoutExpired as exc:
        return 124, (exc.stdout or "") + (exc.stderr or "")
    return result.returncode, (result.stdout or "") + (result.stderr or "")


def fallback_files(video_id: str) -> list[Path]:
    if not AUDIO_DIR.exists():
        return []
    return sorted(
        path
        for path in AUDIO_DIR.iterdir()
        if path.is_file() and path.stem == video_id
    )


def raw_caption_files(video_id: str) -> list[Path]:
    if not RAW_DIR.exists():
        return []
    return sorted(path for path in RAW_DIR.rglob(f"{video_id}*.vtt") if path.is_file())


def probe_media(path: Path) -> dict:
    code, output = run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "stream=index,codec_type,codec_name",
            "-of",
            "json",
            str(path),
        ],
        timeout=20,
    )
    if code != 0:
        return {"path": str(path), "ok": False, "error": output.strip()[:500]}
    try:
        payload = json.loads(output)
    except json.JSONDecodeError:
        return {"path": str(path), "ok": False, "error": "invalid ffprobe json"}
    streams = payload.get("streams") or []
    audio = [stream for stream in streams if stream.get("codec_type") == "audio"]
    video = [stream for stream in streams if stream.get("codec_type") == "video"]
    return {
        "path": str(path),
        "ok": True,
        "audio_streams": len(audio),
        "video_streams": len(video),
        "streams": streams,
    }


def probe_subtitles(url: str) -> dict:
    code, output = run(["yt-dlp", "--no-warnings", "--skip-download", "--list-subs", url], timeout=45)
    lower = output.lower()
    if "ip address is blocked" in lower:
        return {"ok": False, "reason": "tiktok_ip_block", "detail": "TikTok blocked this IP for the post."}
    if "has no subtitles" in lower:
        return {"ok": True, "reason": "no_subtitles", "detail": "yt-dlp reports no subtitles."}
    if code != 0:
        return {"ok": False, "reason": "yt_dlp_error", "detail": output.strip()[:500]}
    return {"ok": True, "reason": "subtitles_may_exist", "detail": output.strip()[:1000]}


def classify(row: dict[str, str], probe_network: bool) -> dict:
    video_id = row.get("video_id", "")
    media = [probe_media(path) for path in fallback_files(video_id)]
    captions = raw_caption_files(video_id)
    has_audio = any(item.get("audio_streams", 0) > 0 for item in media if item.get("ok"))
    subtitle_probe = probe_subtitles(row.get("url", "")) if probe_network and row.get("url") else None

    if captions:
        reason = "local_caption_exists"
    elif has_audio:
        reason = "audio_available_retry_asr"
    elif media:
        reason = "fallback_media_has_no_audio"
    elif subtitle_probe and subtitle_probe.get("reason") == "tiktok_ip_block":
        reason = "source_blocked_by_tiktok_ip"
    elif subtitle_probe and subtitle_probe.get("reason") == "no_subtitles":
        reason = "no_subtitles_no_local_media"
    else:
        reason = "no_local_caption_or_audio"

    return {
        "video_id": video_id,
        "creator_id": row.get("creator_id", ""),
        "url": row.get("url", ""),
        "published_at": row.get("published_at", ""),
        "review_status": row.get("review_status", ""),
        "reason": reason,
        "local_caption_files": [str(path) for path in captions],
        "fallback_media": media,
        "subtitle_probe": subtitle_probe,
        "current_notes": row.get("notes", ""),
    }


def append_note(existing: str, note: str) -> str:
    parts = [part.strip() for part in (existing or "").split(";") if part.strip()]
    if note not in parts:
        parts.append(note)
    return "; ".join(parts)


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit TikTok rows parked in needs_source_review.")
    parser.add_argument("--probe-network", action="store_true", help="Use yt-dlp to check current subtitle/source access.")
    parser.add_argument("--apply", action="store_true", help="Normalize review_status and append source-review reason notes in the private videos.csv.")
    parser.add_argument("--out", type=Path, default=None, help="Optional JSON report path.")
    args = parser.parse_args()

    rows = read_rows(VIDEOS_CSV)
    targets = [row for row in rows if row.get("transcript_status") == "needs_source_review"]
    audited = [classify(row, args.probe_network) for row in targets]

    if args.apply:
        reason_by_id = {item["video_id"]: item["reason"] for item in audited}
        for row in rows:
            video_id = row.get("video_id", "")
            if video_id not in reason_by_id:
                continue
            row["review_status"] = "needs_source_review"
            row["notes"] = append_note(row.get("notes", ""), f"Source review audit: {reason_by_id[video_id]}")
        fieldnames = list(rows[0].keys()) if rows else []
        write_rows(VIDEOS_CSV, rows, fieldnames)

    summary = {
        "ok": True,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "probe_network": args.probe_network,
        "applied": args.apply,
        "needs_source_review": len(audited),
        "reason_counts": {},
        "rows": audited,
    }
    for item in audited:
        reason = item["reason"]
        summary["reason_counts"][reason] = summary["reason_counts"].get(reason, 0) + 1

    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
