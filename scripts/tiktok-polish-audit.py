from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TIKTOK = ROOT / "12_knowledge-base" / "sources" / "tiktok"
CLEAN_DIR = TIKTOK / "transcripts" / "clean"
POLISHED_DIR = TIKTOK / "transcripts" / "polished"
QA_DIR = TIKTOK / "transcripts" / "polished-qa"
UNCERTAIN_NOTE_RE = re.compile(
    r"\b(unclear|clipped|asr|likely wrong|kept raw|kept unclear|needs audio|audio verification|mid-sentence)\b",
    re.IGNORECASE,
)


STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has", "have",
    "i", "if", "in", "is", "it", "its", "of", "on", "or", "that", "the", "this", "to",
    "was", "we", "with", "you", "your"
}


def words(text: str) -> list[str]:
    return re.findall(r"[A-Za-z0-9']+", text.lower())


def count_map(items: list[str]) -> dict[str, int]:
    out: dict[str, int] = {}
    for item in items:
        out[item] = out.get(item, 0) + 1
    return out


def notes_text(qa: dict) -> str:
    notes = qa.get("notes", "")
    if isinstance(notes, list):
        return " ".join(str(note) for note in notes)
    return str(notes)


def analyze(video_id: str) -> dict:
    raw_path = CLEAN_DIR / f"{video_id}.txt"
    polished_path = POLISHED_DIR / f"{video_id}.txt"
    qa_path = QA_DIR / f"{video_id}.json"
    raw = raw_path.read_text(encoding="utf-8", errors="replace") if raw_path.exists() else ""
    polished = polished_path.read_text(encoding="utf-8", errors="replace") if polished_path.exists() else ""
    raw_words = words(raw)
    polished_words = words(polished)
    raw_counts = count_map(raw_words)
    added = []
    for word in polished_words:
        if raw_counts.get(word, 0) > 0:
            raw_counts[word] -= 1
        elif word not in STOPWORDS:
            added.append(word)
    length_ratio = (len(polished) / len(raw)) if raw else 0
    word_ratio = (len(polished_words) / len(raw_words)) if raw_words else 0
    qa = {}
    if qa_path.exists():
        try:
            qa = json.loads(qa_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            qa = {"status": "invalid_json"}
    return {
        "video_id": video_id,
        "raw_chars": len(raw),
        "polished_chars": len(polished),
        "length_ratio": round(length_ratio, 3),
        "raw_words": len(raw_words),
        "polished_words": len(polished_words),
        "word_ratio": round(word_ratio, 3),
        "added_non_stopword_count": len(added),
        "added_non_stopword_sample": added[:25],
        "qa_status": qa.get("status", "missing_qa"),
        "qa_notes": qa.get("notes", ""),
        "risk": (
            "high"
            if length_ratio > 1.25 or word_ratio > 1.2 or len(added) > max(12, len(raw_words) * 0.08)
            else "review"
            if (
                qa.get("status") == "needs_review"
                or UNCERTAIN_NOTE_RE.search(notes_text(qa))
                or len(added) > max(6, len(raw_words) * 0.04)
            )
            else "low"
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    video_ids = [p.stem for p in sorted(POLISHED_DIR.glob("*.txt"))][: args.limit]
    rows = [analyze(video_id) for video_id in video_ids]
    summary = {
        "audited": len(rows),
        "high_risk": sum(1 for r in rows if r["risk"] == "high"),
        "review": sum(1 for r in rows if r["risk"] == "review"),
        "low": sum(1 for r in rows if r["risk"] == "low"),
        "rows": rows,
    }
    summary["go_for_bulk"] = summary["audited"] > 0 and summary["high_risk"] == 0
    summary["bulk_rule"] = "Proceed only if high_risk=0; review items are allowed but must stay traceable in QA."
    if args.json:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    else:
        for key in ["audited", "high_risk", "review", "low"]:
            print(f"{key}={summary[key]}")
        for row in rows:
            print(f"{row['video_id']}\t{row['risk']}\tlen={row['length_ratio']}\twords={row['word_ratio']}\tadded={row['added_non_stopword_count']}\tqa={row['qa_status']}")
    return 1 if summary["high_risk"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
