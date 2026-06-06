from __future__ import annotations

import argparse
import json
import sys
import textwrap
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TIKTOK = ROOT / "12_knowledge-base" / "sources" / "tiktok"
CLEAN_DIR = TIKTOK / "transcripts" / "clean"
POLISHED_DIR = TIKTOK / "transcripts" / "polished"
QA_DIR = TIKTOK / "transcripts" / "polished-qa"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace").strip() if path.exists() else ""


def preview(label: str, text: str, width: int, max_chars: int) -> str:
    text = " ".join(text.split())
    if len(text) > max_chars:
        text = text[: max_chars - 3].rstrip() + "..."
    return f"{label}\n" + textwrap.fill(text, width=width)


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser()
    parser.add_argument("video_ids", nargs="*")
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--width", type=int, default=110)
    parser.add_argument("--max-chars", type=int, default=900)
    args = parser.parse_args()

    video_ids = args.video_ids
    if not video_ids:
        video_ids = [p.stem for p in sorted(POLISHED_DIR.glob("*.txt"))[: args.limit]]

    for video_id in video_ids:
        raw = read(CLEAN_DIR / f"{video_id}.txt")
        polished = read(POLISHED_DIR / f"{video_id}.txt")
        qa_text = read(QA_DIR / f"{video_id}.json")
        qa = {}
        if qa_text:
            try:
                qa = json.loads(qa_text)
            except json.JSONDecodeError:
                qa = {"status": "invalid_json"}
        print("=" * args.width)
        print(f"video_id={video_id} status={qa.get('status', 'missing_qa')} notes={qa.get('notes', '')}")
        print(preview("RAW:", raw, args.width, args.max_chars))
        print(preview("POLISHED:", polished, args.width, args.max_chars))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
