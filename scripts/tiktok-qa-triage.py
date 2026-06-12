from __future__ import annotations

import argparse
from collections import Counter
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
TIKTOK = ROOT / "12_knowledge-base" / "sources" / "tiktok"
QA_DIR = TIKTOK / "transcripts" / "polished-qa"
POLISHED_DIR = TIKTOK / "transcripts" / "polished"
PLANNING = ROOT / ".planning"


AUDIO_RE = re.compile(
    r"\b(audio verification|audio-verified|needs audio|need audio|audio/source review|audio/source verification|source/audio verification|audio/caption verification|verify exact spoken|exact spoken|asr|unclear|clipped|likely wrong|likely asr|possible asr|raw captions contain)\b",
    re.I,
)
ENTITY_RE = re.compile(r"\b(entity|brand|person|name|spelling|subreddit|domain)\b", re.I)
BOILERPLATE_ENTITY_RE = re.compile(r"\bobvious acronym/entity casing\b", re.I)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def notes_text(notes: Any) -> str:
    if isinstance(notes, list):
        return " ".join(str(item) for item in notes)
    return str(notes or "")


def classify(qa: dict[str, Any]) -> str:
    text = BOILERPLATE_ENTITY_RE.sub("", notes_text(qa.get("notes")))
    if AUDIO_RE.search(text):
        return "audio_verification_required"
    if ENTITY_RE.search(text):
        return "entity_spelling_review"
    if text.strip():
        return "human_text_review"
    return "status_only_review"


def triage(limit: int) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    for path in sorted(QA_DIR.glob("*.json")):
        try:
            qa = load_json(path)
        except json.JSONDecodeError:
            rows.append({"video_id": path.stem, "status": "invalid_json", "category": "invalid_json"})
            continue
        status = qa.get("status") or "missing_status"
        if status != "needs_review":
            continue
        polished_path = POLISHED_DIR / f"{path.stem}.txt"
        category = classify(qa)
        rows.append(
            {
                "video_id": path.stem,
                "status": status,
                "category": category,
                "notes": qa.get("notes") or [],
                "polished_exists": polished_path.exists(),
            }
        )
    category_counts = Counter(row["category"] for row in rows)
    emitted = rows if limit == 0 else rows[:limit]
    return {
        "ok": True,
        "created_at": utc_now(),
        "total_needs_review": len(rows),
        "category_counts": dict(sorted(category_counts.items())),
        "emitted": len(emitted),
        "rows": emitted,
        "rule": "Do not bulk-pass audio_verification_required rows; keep them private/reviewed until audio or source evidence resolves the uncertainty.",
    }


def markdown(summary: dict[str, Any]) -> str:
    lines = [
        "# TikTok Transcript QA Triage",
        "",
        f"- created_at: `{summary['created_at']}`",
        f"- total_needs_review: {summary['total_needs_review']}",
        f"- emitted: {summary['emitted']}",
        f"- rule: {summary['rule']}",
        "",
        "## Category Counts",
        "",
    ]
    for key, value in summary["category_counts"].items():
        lines.append(f"- {key}: {value}")
    lines += ["", "## Sample Rows", ""]
    for row in summary["rows"]:
        lines += [
            f"### {row['video_id']}",
            "",
            f"- category: `{row['category']}`",
            f"- polished_exists: `{str(row['polished_exists']).lower()}`",
            f"- notes: {notes_text(row.get('notes')) or 'none'}",
            "",
        ]
    if not summary["rows"]:
        lines.append("None.")
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Triage TikTok polished transcript QA review debt without changing private transcript files.")
    parser.add_argument("--limit", type=int, default=50, help="Rows to emit. Use 0 for all.")
    parser.add_argument("--out-json", type=Path, default=None)
    parser.add_argument("--out-md", type=Path, default=None)
    args = parser.parse_args()

    summary = triage(args.limit)
    if args.out_json:
        args.out_json.parent.mkdir(parents=True, exist_ok=True)
        args.out_json.write_text(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    if args.out_md:
        args.out_md.parent.mkdir(parents=True, exist_ok=True)
        args.out_md.write_text(markdown(summary), encoding="utf-8")
    print(json.dumps({k: v for k, v in summary.items() if k != "rows"}, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
