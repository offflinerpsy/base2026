#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / "config" / "creators.local.json"
FALLBACK_CONFIGS = [
    ROOT / "config" / "tiktok-intake-queue.local.json",
    ROOT / "config" / "creators.example.json",
]
DEFAULT_OUT = ROOT / ".planning" / "social-discovered.jsonl"


@dataclass
class Creator:
    id: str
    platform: str
    handle: str
    url: str
    enabled: bool
    max_new_per_run: int | None
    source_policy: str
    notes: str


@dataclass
class AdapterResult:
    creator: Creator
    adapter: str
    ok: bool
    records: list[dict[str, Any]]
    failure_reason: str = ""
    stderr: str = ""


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def command_path(name: str) -> str | None:
    return shutil.which(name)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def get_value(item: dict[str, Any], *names: str, default: Any = "") -> Any:
    for name in names:
        value = item.get(name)
        if value not in (None, ""):
            return value
    return default


def slug_handle(handle: str) -> str:
    handle = handle.strip().lstrip("@")
    return re.sub(r"[^A-Za-z0-9_-]+", "-", handle).strip("-").lower()


def infer_platform(url: str, platform: str) -> str:
    if platform:
        return platform.strip().lower()
    lowered = url.lower()
    if "instagram.com" in lowered:
        return "instagram"
    if "tiktok.com" in lowered:
        return "tiktok"
    return "generic"


def infer_handle(url: str, handle: str, platform: str) -> str:
    if handle:
        return slug_handle(handle)
    if platform == "tiktok":
        match = re.search(r"tiktok\.com/@([^/?#]+)", url)
        if match:
            return slug_handle(match.group(1))
    if platform == "instagram":
        match = re.search(r"instagram\.com/([^/?#]+)/?", url)
        if match:
            return slug_handle(match.group(1))
    return ""


def creator_id(platform: str, handle: str, item: dict[str, Any]) -> str:
    explicit = get_value(item, "id", "creator_id")
    if explicit:
        return str(explicit)
    if handle:
        return f"{platform}-{handle}"
    raise ValueError("creator id or handle is required")


def load_creators(path: Path, include_disabled: bool) -> list[Creator]:
    raw = read_json(path)
    if isinstance(raw, list):
        entries = raw
    elif isinstance(raw, dict) and isinstance(raw.get("creators"), list):
        entries = raw["creators"]
    else:
        raise ValueError(f"Unsupported creator config shape: {path}")

    creators: list[Creator] = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        enabled = bool(entry.get("enabled", True))
        if not enabled and not include_disabled:
            continue
        url = str(get_value(entry, "url", "profile_url", "creator_url")).strip()
        platform = infer_platform(url, str(entry.get("platform", "")))
        handle = infer_handle(url, str(get_value(entry, "handle", "creator_handle")), platform)
        if not url and platform == "tiktok" and handle:
            url = f"https://www.tiktok.com/@{handle}"
        if not url and platform == "instagram" and handle:
            url = f"https://www.instagram.com/{handle}/"
        if not url:
            raise ValueError(f"creator URL is required for {entry}")
        creators.append(
            Creator(
                id=creator_id(platform, handle, entry),
                platform=platform,
                handle=handle,
                url=url,
                enabled=enabled,
                max_new_per_run=int(entry["max_new_per_run"]) if str(entry.get("max_new_per_run", "")).isdigit() else None,
                source_policy=str(entry.get("source_policy", "")),
                notes=str(entry.get("notes", "")),
            )
        )
    return creators


def resolve_config(path_arg: str) -> Path:
    if path_arg:
        path = Path(path_arg)
        return path if path.is_absolute() else (ROOT / path).resolve()
    if DEFAULT_CONFIG.exists():
        return DEFAULT_CONFIG
    for candidate in FALLBACK_CONFIGS:
        if candidate.exists():
            return candidate
    raise FileNotFoundError("No creator config found")


def run_command(command: list[str], timeout_seconds: int) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout_seconds,
    )


def parse_upload_date(raw: str) -> str:
    raw = raw.strip()
    if re.fullmatch(r"\d{8}", raw):
        return f"{raw[0:4]}-{raw[4:6]}-{raw[6:8]}"
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw):
        return raw
    return ""


def source_url_for_tiktok(handle: str, post_id: str, webpage_url: str) -> str:
    if webpage_url and webpage_url != "NA":
        return webpage_url
    if handle and post_id:
        return f"https://www.tiktok.com/@{handle}/video/{post_id}"
    return webpage_url


def normalized_record(
    *,
    creator: Creator,
    post_id: str,
    source_url: str,
    published_at: str,
    title_or_description: str,
    duration_seconds: str | int | float | None,
    discovery_adapter: str,
    caption_source: str = "",
    quality_flags: list[str] | None = None,
) -> dict[str, Any]:
    duration: int | None = None
    if duration_seconds not in ("", None, "NA"):
        try:
            duration = int(float(str(duration_seconds)))
        except ValueError:
            duration = None
    return {
        "record_type": "source",
        "id": f"{creator.platform}:{post_id}",
        "platform": creator.platform,
        "creator_id": creator.id,
        "creator_handle": creator.handle,
        "creator_url": creator.url,
        "source_url": source_url,
        "post_id": post_id,
        "published_at": published_at,
        "discovered_at": now_utc(),
        "title_or_description": title_or_description if title_or_description != "NA" else "",
        "post_caption": "",
        "duration_seconds": duration,
        "discovery_adapter": discovery_adapter,
        "acquisition_adapter": "",
        "transcript_status": "queued",
        "caption_source": caption_source,
        "media_path": "",
        "raw_transcript_path": "",
        "clean_transcript_path": "",
        "asr_metadata_path": "",
        "quality_flags": quality_flags or [],
        "failure_reason": "",
        "review_status": "new",
        "source_policy": creator.source_policy,
        "private": True,
    }


def failure_record(creator: Creator, adapter: str, reason: str, stderr: str = "") -> dict[str, Any]:
    return {
        "record_type": "discovery_failure",
        "id": f"{creator.platform}:{creator.handle or creator.id}:discovery_failure",
        "platform": creator.platform,
        "creator_id": creator.id,
        "creator_handle": creator.handle,
        "creator_url": creator.url,
        "source_url": "",
        "post_id": "",
        "published_at": "",
        "discovered_at": now_utc(),
        "title_or_description": "",
        "post_caption": "",
        "duration_seconds": None,
        "discovery_adapter": adapter,
        "acquisition_adapter": "",
        "transcript_status": "needs_source_review",
        "caption_source": "",
        "media_path": "",
        "raw_transcript_path": "",
        "clean_transcript_path": "",
        "asr_metadata_path": "",
        "quality_flags": ["discovery_failed"],
        "failure_reason": reason,
        "failure_stderr_excerpt": stderr[-600:],
        "review_status": "needs_source_review",
        "source_policy": creator.source_policy,
        "private": True,
    }


def discover_tiktok_yt_dlp(creator: Creator, limit: int, timeout_seconds: int) -> AdapterResult:
    if not command_path("yt-dlp"):
        return AdapterResult(creator, "tiktok_yt_dlp_flat_playlist", False, [], "missing_required_yt_dlp")
    command = [
        "yt-dlp",
        "--no-warnings",
        "--flat-playlist",
        "--playlist-end",
        str(limit),
        "--print",
        "%(id)s\t%(upload_date)s\t%(webpage_url)s\t%(title)s\t%(duration)s",
        creator.url,
    ]
    try:
        proc = run_command(command, timeout_seconds)
    except subprocess.TimeoutExpired as exc:
        return AdapterResult(creator, "tiktok_yt_dlp_flat_playlist", False, [], "yt_dlp_timeout", str(exc))
    if proc.returncode != 0:
        return AdapterResult(creator, "tiktok_yt_dlp_flat_playlist", False, [], "yt_dlp_failed", proc.stderr)

    records: list[dict[str, Any]] = []
    for line in proc.stdout.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t", 4)
        if len(parts) < 3:
            continue
        post_id = parts[0].strip()
        if not post_id or post_id == "NA":
            continue
        upload_date = parts[1].strip() if len(parts) > 1 else ""
        webpage_url = parts[2].strip() if len(parts) > 2 else ""
        title = parts[3].strip() if len(parts) > 3 else ""
        duration = parts[4].strip() if len(parts) > 4 else ""
        records.append(
            normalized_record(
                creator=creator,
                post_id=post_id,
                source_url=source_url_for_tiktok(creator.handle, post_id, webpage_url),
                published_at=parse_upload_date(upload_date),
                title_or_description=title,
                duration_seconds=duration,
                discovery_adapter="tiktok_yt_dlp_flat_playlist",
            )
        )
    if not records:
        return AdapterResult(creator, "tiktok_yt_dlp_flat_playlist", False, [], "yt_dlp_returned_no_records", proc.stderr)
    return AdapterResult(creator, "tiktok_yt_dlp_flat_playlist", True, records)


def gallery_item_id(item: dict[str, Any]) -> str:
    for key in ("id", "video_id", "shortcode", "mediaid", "pk", "filename"):
        value = item.get(key)
        if value not in (None, ""):
            return str(value)
    url = str(item.get("url") or item.get("webpage_url") or item.get("post_url") or "")
    match = re.search(r"/(?:video|reel|p)/([^/?#]+)", url)
    return match.group(1) if match else ""


def gallery_item_url(item: dict[str, Any], creator: Creator, post_id: str) -> str:
    for key in ("webpage_url", "post_url", "url"):
        value = item.get(key)
        if isinstance(value, str) and value.startswith("http"):
            return value
    if creator.platform == "tiktok" and creator.handle and post_id:
        return f"https://www.tiktok.com/@{creator.handle}/video/{post_id}"
    if creator.platform == "instagram" and post_id:
        return f"https://www.instagram.com/reel/{post_id}/"
    return creator.url


def discover_gallery_dl(creator: Creator, limit: int, timeout_seconds: int, adapter_name: str) -> AdapterResult:
    if not command_path("gallery-dl"):
        return AdapterResult(creator, adapter_name, False, [], "missing_adapter_gallery_dl")
    command = ["gallery-dl", "--range", f"1-{limit}", "--dump-json", creator.url]
    try:
        proc = run_command(command, timeout_seconds)
    except subprocess.TimeoutExpired as exc:
        return AdapterResult(creator, adapter_name, False, [], "gallery_dl_timeout", str(exc))
    if proc.returncode != 0:
        return AdapterResult(creator, adapter_name, False, [], "gallery_dl_failed", proc.stderr)

    records: list[dict[str, Any]] = []
    for line in proc.stdout.splitlines():
        line = line.strip()
        if not line or not line.startswith("{"):
            continue
        try:
            item = json.loads(line)
        except json.JSONDecodeError:
            continue
        post_id = gallery_item_id(item)
        if not post_id:
            continue
        title = str(item.get("title") or item.get("description") or item.get("caption") or "")
        records.append(
            normalized_record(
                creator=creator,
                post_id=post_id,
                source_url=gallery_item_url(item, creator, post_id),
                published_at=parse_upload_date(str(item.get("date") or item.get("upload_date") or "")),
                title_or_description=title,
                duration_seconds=item.get("duration"),
                discovery_adapter=adapter_name,
            )
        )
    if not records:
        return AdapterResult(creator, adapter_name, False, [], "gallery_dl_returned_no_records", proc.stderr)
    return AdapterResult(creator, adapter_name, True, records)


def discover_creator(creator: Creator, limit: int, timeout_seconds: int) -> AdapterResult:
    if creator.platform == "tiktok":
        primary = discover_tiktok_yt_dlp(creator, limit, timeout_seconds)
        if primary.ok:
            return primary
        fallback = discover_gallery_dl(creator, limit, timeout_seconds, "tiktok_gallery_dl_fallback")
        if fallback.ok:
            return fallback
        records = [failure_record(creator, primary.adapter, primary.failure_reason, primary.stderr)]
        records.append(failure_record(creator, fallback.adapter, fallback.failure_reason, fallback.stderr))
        return AdapterResult(creator, "tiktok_discovery", False, records, primary.failure_reason)
    if creator.platform == "instagram":
        result = discover_gallery_dl(creator, limit, timeout_seconds, "instagram_gallery_dl")
        if result.ok:
            return result
        reason = result.failure_reason
        if reason == "missing_adapter_gallery_dl" and command_path("instaloader"):
            reason = "missing_adapter_gallery_dl_instaloader_available_for_later_fallback"
        return AdapterResult(
            creator,
            "instagram_gallery_dl",
            False,
            [failure_record(creator, "instagram_gallery_dl", reason, result.stderr)],
            reason,
        )
    return AdapterResult(
        creator,
        "unsupported_platform",
        False,
        [failure_record(creator, "unsupported_platform", f"unsupported_platform_{creator.platform}")],
        f"unsupported_platform_{creator.platform}",
    )


def summarize(results: list[AdapterResult], out_path: Path, config_path: Path) -> dict[str, Any]:
    return {
        "ok": all(result.ok for result in results),
        "config": str(config_path),
        "out": str(out_path),
        "creator_count": len(results),
        "record_count": sum(len(result.records) for result in results),
        "source_record_count": sum(1 for result in results for row in result.records if row.get("record_type") == "source"),
        "failure_record_count": sum(1 for result in results for row in result.records if row.get("record_type") == "discovery_failure"),
        "creators": [
            {
                "creator_id": result.creator.id,
                "platform": result.creator.platform,
                "handle": result.creator.handle,
                "adapter": result.adapter,
                "ok": result.ok,
                "records": len([row for row in result.records if row.get("record_type") == "source"]),
                "failures": len([row for row in result.records if row.get("record_type") == "discovery_failure"]),
                "failure_reason": result.failure_reason,
            }
            for result in results
        ],
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Discover public social video records into a private normalized JSONL spool. Does not modify videos.csv."
    )
    parser.add_argument("--config", default="", help="Creator config path. Defaults to config/creators.local.json, then TikTok queue, then example.")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Output JSONL path, normally under ignored .planning/.")
    parser.add_argument("--limit-per-creator", type=int, default=20)
    parser.add_argument("--timeout-seconds", type=int, default=90)
    parser.add_argument("--creator", default="", help="Optional creator id or handle filter for bounded smoke runs.")
    parser.add_argument("--platform", default="", help="Optional platform filter, for example tiktok or instagram.")
    parser.add_argument("--include-disabled", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    config_path = resolve_config(args.config)
    if not config_path.exists():
        print(json.dumps({"ok": False, "error": f"config not found: {config_path}"}, ensure_ascii=False), file=sys.stderr)
        return 2

    creators = load_creators(config_path, include_disabled=args.include_disabled)
    if args.platform:
        creators = [creator for creator in creators if creator.platform == args.platform.lower()]
    if args.creator:
        needle = slug_handle(args.creator)
        creators = [creator for creator in creators if creator.id == args.creator or creator.handle == needle]
    if not creators:
        print(json.dumps({"ok": False, "error": "no creators matched", "config": str(config_path)}, ensure_ascii=False), file=sys.stderr)
        return 2

    results: list[AdapterResult] = []
    all_rows: list[dict[str, Any]] = []
    for creator in creators:
        limit = creator.max_new_per_run or args.limit_per_creator
        limit = min(limit, args.limit_per_creator)
        result = discover_creator(creator, limit, args.timeout_seconds)
        results.append(result)
        all_rows.extend(result.records)

    out_path = Path(args.out)
    if not out_path.is_absolute():
        out_path = (ROOT / out_path).resolve()
    write_jsonl(out_path, all_rows)
    print(json.dumps(summarize(results, out_path, config_path), ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
