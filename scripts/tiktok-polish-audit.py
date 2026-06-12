from __future__ import annotations

import argparse
from collections import Counter
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


def filter_rows(rows: list[dict], risk: str, qa_status: str) -> list[dict]:
    filtered = rows
    if risk:
        allowed = {item.strip() for item in risk.split(",") if item.strip()}
        filtered = [row for row in filtered if row["risk"] in allowed]
    if qa_status:
        allowed = {item.strip() for item in qa_status.split(",") if item.strip()}
        filtered = [row for row in filtered if row["qa_status"] in allowed]
    return filtered


def markdown_for_report(summary: dict) -> str:
    lines = [
        "# TikTok Transcript Polish QA Audit",
        "",
        f"- audited: {summary['audited']}",
        f"- high_risk: {summary['high_risk']}",
        f"- review: {summary['review']}",
        f"- low: {summary['low']}",
        f"- go_for_bulk: `{str(summary['go_for_bulk']).lower()}`",
        f"- bulk_rule: {summary['bulk_rule']}",
        "",
        "## QA Status Counts",
        "",
    ]
    for key, value in summary["qa_status_counts"].items():
        lines.append(f"- {key}: {value}")
    lines += ["", "## Risk Counts", ""]
    for key in ["high", "review", "low"]:
        lines.append(f"- {key}: {summary['risk_counts'].get(key, 0)}")
    lines += ["", "## Review Rows", ""]
    if not summary["rows"]:
        lines.append("None.")
    for row in summary["rows"]:
        added = ", ".join(row["added_non_stopword_sample"])
        notes = notes_text({"notes": row.get("qa_notes", "")})
        lines += [
            f"### {row['video_id']}",
            "",
            f"- risk: `{row['risk']}`",
            f"- qa_status: `{row['qa_status']}`",
            f"- length_ratio: {row['length_ratio']}",
            f"- word_ratio: {row['word_ratio']}",
            f"- added_non_stopword_count: {row['added_non_stopword_count']}",
            f"- added_non_stopword_sample: {added if added else 'none'}",
            f"- qa_notes: {notes if notes else 'none'}",
            "",
        ]
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=20, help="Maximum rows to emit after filters. Use 0 for all.")
    parser.add_argument("--risk", default="", help="Comma-separated risk filter, e.g. review,high.")
    parser.add_argument("--qa-status", default="", help="Comma-separated QA status filter, e.g. needs_review.")
    parser.add_argument("--out-json", type=Path, default=None)
    parser.add_argument("--out-md", type=Path, default=None)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    all_video_ids = [p.stem for p in sorted(POLISHED_DIR.glob("*.txt"))]
    all_rows = [analyze(video_id) for video_id in all_video_ids]
    filtered_rows = filter_rows(all_rows, args.risk, args.qa_status)
    rows = filtered_rows if args.limit == 0 else filtered_rows[: args.limit]
    risk_counts = Counter(row["risk"] for row in all_rows)
    qa_status_counts = Counter(row["qa_status"] for row in all_rows)
    summary = {
        "audited": len(all_rows),
        "emitted": len(rows),
        "filtered_total": len(filtered_rows),
        "filters": {"risk": args.risk, "qa_status": args.qa_status},
        "high_risk": risk_counts.get("high", 0),
        "review": risk_counts.get("review", 0),
        "low": risk_counts.get("low", 0),
        "risk_counts": dict(sorted(risk_counts.items())),
        "qa_status_counts": dict(sorted(qa_status_counts.items())),
        "rows": rows,
    }
    summary["go_for_bulk"] = summary["audited"] > 0 and summary["high_risk"] == 0
    summary["bulk_rule"] = "Proceed only if high_risk=0; review items are allowed but must stay traceable in QA."
    if args.out_json:
        args.out_json.parent.mkdir(parents=True, exist_ok=True)
        args.out_json.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.out_md:
        args.out_md.parent.mkdir(parents=True, exist_ok=True)
        args.out_md.write_text(markdown_for_report(summary), encoding="utf-8")
    if args.json:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    else:
        for key in ["audited", "emitted", "filtered_total", "high_risk", "review", "low"]:
            print(f"{key}={summary[key]}")
        print("qa_status_counts=" + json.dumps(summary["qa_status_counts"], sort_keys=True))
        for row in rows:
            print(f"{row['video_id']}\t{row['risk']}\tlen={row['length_ratio']}\twords={row['word_ratio']}\tadded={row['added_non_stopword_count']}\tqa={row['qa_status']}")
    return 1 if summary["high_risk"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
