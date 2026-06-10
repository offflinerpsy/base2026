from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "config"
DEFAULT_CREATORS = CONFIG / "creators.local.json"
EXAMPLE_CREATORS = CONFIG / "creators.example.json"
SPOOL = ROOT / ".planning" / "local-worker-poc"


@dataclass
class CommandResult:
    ok: bool
    command: list[str]
    stdout: str = ""
    stderr: str = ""
    returncode: int = 0


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")


def tool_path(name: str) -> str | None:
    return shutil.which(name)


def module_available(name: str) -> bool:
    try:
        __import__(name)
        return True
    except Exception:
        return False


def run_command(command: list[str], dry_run: bool = False) -> CommandResult:
    if dry_run:
        return CommandResult(ok=True, command=command)
    proc = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return CommandResult(
        ok=proc.returncode == 0,
        command=command,
        stdout=proc.stdout.strip(),
        stderr=proc.stderr.strip(),
        returncode=proc.returncode,
    )


def print_json(data: Any) -> None:
    print(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True))


def creators_file(path_arg: str | None) -> Path:
    if path_arg:
        return Path(path_arg).resolve()
    if DEFAULT_CREATORS.exists():
        return DEFAULT_CREATORS
    return EXAMPLE_CREATORS


def cmd_doctor(_: argparse.Namespace) -> int:
    required_tools = ["yt-dlp", "ffmpeg"]
    python_tools = ["python3", "python"]
    optional_tools = ["whisper.cpp", "instaloader", "gallery-dl", "ollama"]
    local_llm = {
        "BASE2026_LOCAL_LLM_BASE_URL": os.environ.get("BASE2026_LOCAL_LLM_BASE_URL", ""),
        "BASE2026_LOCAL_LLM_MODEL": os.environ.get("BASE2026_LOCAL_LLM_MODEL", ""),
        "BASE2026_LOCAL_LLM_PROVIDER": os.environ.get("BASE2026_LOCAL_LLM_PROVIDER", ""),
        "OLLAMA_HOST": os.environ.get("OLLAMA_HOST", ""),
    }
    print_json(
        {
            "ok": all(tool_path(name) for name in required_tools),
            "python_executable": sys.executable,
            "required_tools": {name: tool_path(name) for name in required_tools},
            "python_tools": {name: tool_path(name) for name in python_tools},
            "optional_tools": {name: tool_path(name) for name in optional_tools},
            "python_modules": {
                "faster_whisper": module_available("faster_whisper"),
                "ctranslate2": module_available("ctranslate2"),
                "requests": module_available("requests"),
            },
            "local_llm_env": local_llm,
            "spool": str(SPOOL),
            "creators_default": str(DEFAULT_CREATORS),
            "creators_example": str(EXAMPLE_CREATORS),
        }
    )
    return 0 if all(tool_path(name) for name in required_tools) else 1


def cmd_creators_list(args: argparse.Namespace) -> int:
    path = creators_file(args.config)
    rows = load_json(path)
    print_json({"path": str(path), "creators": rows})
    return 0


def cmd_probe(args: argparse.Namespace) -> int:
    command = [
        "yt-dlp",
        "--skip-download",
        "--write-subs",
        "--write-auto-subs",
        "--list-subs",
        "--dump-json",
        args.url,
    ]
    result = run_command(command, dry_run=args.dry_run)
    print_json(result.__dict__)
    return 0 if result.ok else 1


def cmd_fetch(args: argparse.Namespace) -> int:
    out_dir = SPOOL / "media"
    out_dir.mkdir(parents=True, exist_ok=True)
    command = [
        "yt-dlp",
        "--no-warnings",
        "-o",
        str(out_dir / "%(extractor)s-%(id)s.%(ext)s"),
        args.url,
    ]
    if args.cookies:
        command[1:1] = ["--cookies", args.cookies]
    result = run_command(command, dry_run=args.dry_run)
    print_json(result.__dict__)
    return 0 if result.ok else 1


def cmd_extract_audio(args: argparse.Namespace) -> int:
    media = Path(args.media_file).resolve()
    out_dir = SPOOL / "audio"
    out_dir.mkdir(parents=True, exist_ok=True)
    output = out_dir / f"{media.stem}.wav"
    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(media),
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-c:a",
        "pcm_s16le",
        str(output),
    ]
    result = run_command(command, dry_run=args.dry_run)
    print_json({**result.__dict__, "output": str(output)})
    return 0 if result.ok else 1


def cmd_transcribe(args: argparse.Namespace) -> int:
    audio = Path(args.audio_file).resolve()
    out_dir = SPOOL / "transcripts"
    out_dir.mkdir(parents=True, exist_ok=True)
    output = out_dir / f"{audio.stem}.raw.txt"
    segments_output = out_dir / f"{audio.stem}.segments.json"
    metadata_output = out_dir / f"{audio.stem}.asr.json"
    if args.dry_run:
        print_json(
            {
                "ok": True,
                "dry_run": True,
                "audio": str(audio),
                "output": str(output),
                "segments_output": str(segments_output),
                "metadata_output": str(metadata_output),
                "asr_engine": "faster-whisper",
                "asr_model": args.model,
                "device": args.device,
                "compute_type": args.compute_type,
            }
        )
        return 0

    try:
        from faster_whisper import WhisperModel
    except Exception as exc:
        print_json({"ok": False, "error": f"faster-whisper import failed: {exc}"})
        return 1

    started = time.perf_counter()
    model = WhisperModel(args.model, device=args.device, compute_type=args.compute_type)

    def transcribe_once(vad_filter: bool) -> tuple[list[dict[str, Any]], Any, str]:
        segments_iter, info = model.transcribe(
            str(audio),
            language=None if args.language == "auto" else args.language,
            beam_size=args.beam_size,
            vad_filter=vad_filter,
        )
        segments = [
            {
                "id": index,
                "start": segment.start,
                "end": segment.end,
                "text": segment.text.strip(),
            }
            for index, segment in enumerate(segments_iter)
        ]
        text = " ".join(segment["text"] for segment in segments).strip()
        return segments, info, text

    segments, info, text = transcribe_once(args.vad_filter)
    retry_without_vad = False
    if args.vad_filter and not text:
        segments, info, text = transcribe_once(False)
        retry_without_vad = True

    elapsed = round(time.perf_counter() - started, 3)
    output.write_text(text, encoding="utf-8")
    write_json(segments_output, segments)
    metadata = {
        "ok": True,
        "audio": str(audio),
        "output": str(output),
        "segments_output": str(segments_output),
        "asr_engine": "faster-whisper",
        "asr_model": args.model,
        "device": args.device,
        "compute_type": args.compute_type,
        "vad_filter": args.vad_filter,
        "retry_without_vad": retry_without_vad,
        "language": info.language,
        "language_probability": info.language_probability,
        "duration": info.duration,
        "duration_after_vad": getattr(info, "duration_after_vad", None),
        "transcribe_seconds": elapsed,
        "segment_count": len(segments),
        "word_count": len(normalize_words(text)),
    }
    write_json(metadata_output, metadata)
    print_json({**metadata, "metadata_output": str(metadata_output)})
    return 0


def normalize_words(text: str) -> list[str]:
    import re

    return re.findall(r"[A-Za-z0-9]+", text.lower())


def cmd_clean(args: argparse.Namespace) -> int:
    source = Path(args.transcript_file).resolve()
    raw = source.read_text(encoding="utf-8", errors="replace")
    clean = "\n\n".join(part.strip() for part in raw.replace("\r\n", "\n").split("\n\n") if part.strip())
    if not clean:
        clean = " ".join(raw.split())
    raw_tokens = normalize_words(raw)
    clean_tokens = normalize_words(clean)
    guard_passed = raw_tokens == clean_tokens
    out_dir = SPOOL / "transcripts"
    out_dir.mkdir(parents=True, exist_ok=True)
    output = out_dir / f"{source.stem}.clean.txt"
    if not args.dry_run:
        output.write_text(clean, encoding="utf-8")
    print_json(
        {
            "ok": True,
            "source": str(source),
            "output": str(output),
            "cleanup_method": "deterministic_spacing",
            "guard_passed": guard_passed,
            "raw_word_count": len(raw_tokens),
            "clean_word_count": len(clean_tokens),
        }
    )
    return 0 if guard_passed else 2


def cmd_export_jsonl(args: argparse.Namespace) -> int:
    out_dir = SPOOL / "exports"
    out_dir.mkdir(parents=True, exist_ok=True)
    output = out_dir / f"base2026-worker-{datetime.now().strftime('%Y%m%d-%H%M%S')}.jsonl"
    rows: list[dict[str, Any]] = []
    if not args.dry_run:
        output.write_text("", encoding="utf-8")
    print_json({"ok": True, "output": str(output), "rows": len(rows), "note": "Skeleton export; wire processed records after PoC fetch/transcribe flow."})
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Base2026 local worker PoC CLI.")
    sub = parser.add_subparsers(dest="command", required=True)

    doctor = sub.add_parser("doctor", help="Check local tool availability.")
    doctor.set_defaults(func=cmd_doctor)

    creators = sub.add_parser("creators:list", help="List configured creators.")
    creators.add_argument("--config", default=None)
    creators.set_defaults(func=cmd_creators_list)

    probe = sub.add_parser("probe", help="Probe captions/metadata for a URL with yt-dlp.")
    probe.add_argument("url")
    probe.add_argument("--dry-run", action="store_true")
    probe.set_defaults(func=cmd_probe)

    fetch = sub.add_parser("fetch", help="Fetch media for a URL with yt-dlp.")
    fetch.add_argument("url")
    fetch.add_argument("--cookies", default="")
    fetch.add_argument("--dry-run", action="store_true")
    fetch.set_defaults(func=cmd_fetch)

    extract_audio = sub.add_parser("extract-audio", help="Extract 16 kHz mono WAV with ffmpeg.")
    extract_audio.add_argument("media_file")
    extract_audio.add_argument("--dry-run", action="store_true")
    extract_audio.set_defaults(func=cmd_extract_audio)

    transcribe = sub.add_parser("transcribe", help="Transcribe audio with faster-whisper.")
    transcribe.add_argument("audio_file")
    transcribe.add_argument("--model", default="small.en")
    transcribe.add_argument("--language", default="en")
    transcribe.add_argument("--device", default="cpu")
    transcribe.add_argument("--compute-type", default="int8")
    transcribe.add_argument("--beam-size", type=int, default=5)
    transcribe.add_argument("--vad-filter", action="store_true")
    transcribe.add_argument("--dry-run", action="store_true")
    transcribe.set_defaults(func=cmd_transcribe)

    clean = sub.add_parser("clean", help="Deterministic cleanup with token guard.")
    clean.add_argument("transcript_file")
    clean.add_argument("--dry-run", action="store_true")
    clean.set_defaults(func=cmd_clean)

    export_jsonl = sub.add_parser("export-jsonl", help="Create JSONL export placeholder.")
    export_jsonl.add_argument("--dry-run", action="store_true")
    export_jsonl.set_defaults(func=cmd_export_jsonl)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
