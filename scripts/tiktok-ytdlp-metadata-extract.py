from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from yt_dlp import YoutubeDL


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_QUEUE = ROOT / "config" / "tiktok-intake-queue.20260608.json"
DEFAULT_OUT = ROOT / ".planning" / "tiktok-ytdlp-metadata.jsonl"


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def source_id_from_url(url: str) -> str:
    match = re.search(r"/video/(\d+)", url or "")
    return match.group(1) if match else ""


def compact_space(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def words(value: str) -> list[str]:
    return re.findall(r"[A-Za-z0-9][A-Za-z0-9'-]*", value or "")


SCOPE_PATTERN = re.compile(
    r"\b("
    r"seo|geo|aeo|aio|ai\s+seo|ai\s+search|ai\s+overview|ai\s+overviews|"
    r"search|google|bing|ranking|rank|keyword|keywords|backlink|backlinks|"
    r"schema|serp|search\s+console|organic|traffic|website|content|"
    r"llm|chatgpt|claude|perplexity|gemini|marketing|ads|google\s+ads"
    r")\b",
    re.IGNORECASE,
)

NEGATIVE_SCOPE_PATTERN = re.compile(
    r"\b(giveaway|winner|shirt|soccer|football|world\s+cup|competition|congratulations)\b",
    re.IGNORECASE,
)


def classify(title: str, description: str, duration: float | int | None) -> list[str]:
    flags: list[str] = []
    text = compact_space(description)
    scope_text = f"{title} {description}"
    prose = re.sub(r"#[\w-]+", "", text).strip()
    word_count = len(words(prose))
    seconds = float(duration or 0)

    if NEGATIVE_SCOPE_PATTERN.search(scope_text):
        flags.append("out_of_scope_candidate")
    elif not SCOPE_PATTERN.search(scope_text):
        flags.append("out_of_scope_candidate")

    if not text:
        flags.append("missing_caption")
        flags.append("needs_asr")
        return flags

    if word_count < 12:
        flags.append("caption_too_short")

    if seconds >= 20:
        words_per_second = word_count / max(seconds, 1.0)
        if words_per_second < 1.15:
            flags.append("caption_probably_not_full_transcript")
            flags.append("needs_asr")

    if "needs_asr" not in flags and word_count >= 12:
        flags.append("caption_ready")

    return flags


def queue_jobs(queue_path: Path) -> list[dict[str, str]]:
    queue = json.loads(queue_path.read_text(encoding="utf-8"))
    jobs: list[dict[str, str]] = []
    for creator in queue.get("creators", []):
        for url in creator.get("first_video_urls", []):
            jobs.append(
                {
                    "platform": creator.get("platform", "tiktok"),
                    "creator_handle": creator["handle"],
                    "creator_url": creator["profile_url"],
                    "source_url": url,
                    "source_id": source_id_from_url(url),
                }
            )
    return jobs


def extract_one(ydl: YoutubeDL, job: dict[str, str]) -> dict[str, Any]:
    base: dict[str, Any] = {
        **job,
        "extracted_at": now_iso(),
        "extractor": "yt_dlp",
        "extraction_status": "pending",
    }
    try:
        info = ydl.extract_info(job["source_url"], download=False)
        description = compact_space(info.get("description") or "")
        title = compact_space(info.get("title") or "")
        duration = info.get("duration")
        return {
            **base,
            "extraction_status": "ok",
            "title": title,
            "caption_text": description,
            "caption_source": "yt_dlp_description",
            "transcript_text": description,
            "transcript_source": "platform_caption",
            "duration_seconds": duration,
            "upload_date": info.get("upload_date") or "",
            "timestamp": info.get("timestamp"),
            "uploader": info.get("uploader") or "",
            "uploader_id": info.get("uploader_id") or "",
            "webpage_url": info.get("webpage_url") or job["source_url"],
            "canonical_url": info.get("webpage_url") or job["source_url"],
            "thumbnail": info.get("thumbnail") or "",
            "format_count": len(info.get("formats") or []),
            "quality_flags": classify(title, description, duration),
        }
    except Exception as error:  # noqa: BLE001 - capture extractor failures into JSONL
        return {
            **base,
            "extraction_status": "failed",
            "error": str(error)[:800],
            "quality_flags": ["needs_retry"],
        }


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract TikTok metadata/captions from a Base2026 queue using yt-dlp.")
    parser.add_argument("--queue", type=Path, default=DEFAULT_QUEUE)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    jobs = queue_jobs(args.queue)
    if args.limit > 0:
        jobs = jobs[: args.limit]

    args.out.parent.mkdir(parents=True, exist_ok=True)
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "retries": 2,
        "fragment_retries": 2,
    }

    counts: dict[str, int] = {}
    with YoutubeDL(ydl_opts) as ydl, args.out.open("w", encoding="utf-8", newline="\n") as fh:
        for job in jobs:
            record = extract_one(ydl, job)
            fh.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
            counts[record["extraction_status"]] = counts.get(record["extraction_status"], 0) + 1
            for flag in record.get("quality_flags", []):
                counts[f"flag:{flag}"] = counts.get(f"flag:{flag}", 0) + 1

    print(json.dumps({"ok": True, "queue": str(args.queue), "out": str(args.out), "jobs": len(jobs), "counts": counts}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
