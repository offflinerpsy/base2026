from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TIKTOK = ROOT / "12_knowledge-base" / "sources" / "tiktok"
VIDEOS_CSV = TIKTOK / "videos.csv"
CLEAN_DIR = TIKTOK / "transcripts" / "clean"
POLISHED_DIR = TIKTOK / "transcripts" / "polished"
QA_DIR = TIKTOK / "transcripts" / "polished-qa"


TERM_REPLACEMENTS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\ba\s*i\b", re.IGNORECASE), "AI"),
    (re.compile(r"\ba\s*e\s*o\b", re.IGNORECASE), "AEO"),
    (re.compile(r"\bg\s*e\s*o\b", re.IGNORECASE), "GEO"),
    (re.compile(r"\bs\s*e\s*o\b", re.IGNORECASE), "SEO"),
    (re.compile(r"\bl\s*l\s*m(?:s)?\b", re.IGNORECASE), lambda m: "LLMs" if m.group(0).lower().endswith("s") else "LLM"),
    (re.compile(r"\bchat\s*g\s*p\s*t\b", re.IGNORECASE), "ChatGPT"),
    (re.compile(r"\bgoogle\s+ads\b", re.IGNORECASE), "Google Ads"),
    (re.compile(r"\bgoogle\s+search\s+console\b", re.IGNORECASE), "Google Search Console"),
    (re.compile(r"\bgoogle\s+business\s+profile\b", re.IGNORECASE), "Google Business Profile"),
    (re.compile(r"\bperplexity\b", re.IGNORECASE), "Perplexity"),
    (re.compile(r"\bgemini\b", re.IGNORECASE), "Gemini"),
    (re.compile(r"\bclaude\b", re.IGNORECASE), "Claude"),
    (re.compile(r"\bgrok\b", re.IGNORECASE), "Grok"),
    (re.compile(r"\breddit\b", re.IGNORECASE), "Reddit"),
    (re.compile(r"\btiktok\b", re.IGNORECASE), "TikTok"),
    (re.compile(r"\byoutube\b", re.IGNORECASE), "YouTube"),
    (re.compile(r"\bshopify\b", re.IGNORECASE), "Shopify"),
]


UNCERTAIN_RE = re.compile(
    r"\b(inaudible|unclear|unknown|clawbo|skema|wow wow|gonna|wanna|gotta)\b",
    re.IGNORECASE,
)


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_rows() -> list[dict[str, str]]:
    if not VIDEOS_CSV.exists():
        return []
    with VIDEOS_CSV.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def normalize_whitespace(text: str) -> str:
    text = text.replace("\ufeff", "")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def apply_terms(text: str) -> tuple[str, Counter[str]]:
    counts: Counter[str] = Counter()
    out = text
    for pattern, replacement in TERM_REPLACEMENTS:
        def repl(match: re.Match[str]) -> str:
            counts[pattern.pattern] += 1
            return replacement(match) if callable(replacement) else replacement

        out = pattern.sub(repl, out)
    return out, counts


def sentence_split(text: str) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    pieces = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'])", text)
    return [piece.strip() for piece in pieces if piece.strip()]


def paragraphize(text: str, max_sentences: int = 4, max_chars: int = 620) -> str:
    sentences = sentence_split(text)
    if not sentences:
        return text
    paragraphs: list[str] = []
    current: list[str] = []
    current_len = 0
    for sentence in sentences:
        if current and (len(current) >= max_sentences or current_len + len(sentence) > max_chars):
            paragraphs.append(" ".join(current).strip())
            current = []
            current_len = 0
        current.append(sentence)
        current_len += len(sentence) + 1
    if current:
        paragraphs.append(" ".join(current).strip())
    return "\n\n".join(paragraphs)


def words(text: str) -> list[str]:
    return re.findall(r"[A-Za-z0-9']+", text.lower())


def preservation_score(raw: str, polished: str) -> float:
    raw_words = words(raw)
    polished_words = words(polished)
    if not raw_words:
        return 1.0 if not polished_words else 0.0
    counts: Counter[str] = Counter(raw_words)
    kept = 0
    for word in polished_words:
        if counts[word] > 0:
            counts[word] -= 1
            kept += 1
    return kept / max(len(raw_words), len(polished_words), 1)


def polish_text(raw: str) -> tuple[str, dict]:
    normalized = normalize_whitespace(raw)
    term_fixed, replacements = apply_terms(normalized)
    paragraphized = paragraphize(term_fixed)
    polished = normalize_whitespace(paragraphized)
    return polished, {
        "replacement_count": sum(replacements.values()),
        "replacement_patterns": dict(replacements),
        "raw_word_count": len(words(raw)),
        "polished_word_count": len(words(polished)),
        "paragraph_count": len([p for p in polished.split("\n\n") if p.strip()]),
        "preservation_score": round(preservation_score(raw, polished), 4),
    }


def qa_status(raw: str, polished: str, metrics: dict) -> tuple[str, list[str]]:
    notes: list[str] = [
        "Local faithful polish: whitespace, obvious acronym/entity casing, and paragraph breaks only.",
        "No summarization, no claims, no translation, no invented facts.",
    ]
    status = "pass"
    if metrics["raw_word_count"] < 12:
        status = "needs_review"
        notes.append("Transcript has too few words for reliable public use.")
    if metrics["preservation_score"] < 0.86:
        status = "needs_review"
        notes.append("Preservation score is below the local polish threshold.")
    if UNCERTAIN_RE.search(raw):
        status = "needs_review"
        notes.append("Raw transcript contains wording that may need audio/source review.")
    if polished and polished[-1] not in ".!?":
        status = "needs_review"
        notes.append("Transcript appears to end without terminal punctuation.")
    return status, notes


def process(args: argparse.Namespace) -> dict:
    rows = [
        row for row in read_rows()
        if row.get("transcript_status") == "transcribed"
        and (CLEAN_DIR / f"{row.get('video_id')}.txt").exists()
    ]
    rows.sort(key=lambda row: (row.get("published_at") or "", row.get("video_id") or ""), reverse=True)
    selected: list[dict[str, str]] = []
    for row in rows:
        video_id = row.get("video_id") or ""
        polished_path = POLISHED_DIR / f"{video_id}.txt"
        if args.missing_only and polished_path.exists():
            continue
        selected.append(row)
    if args.limit > 0:
        selected = selected[: args.limit]

    stats = {
        "selected": len(selected),
        "written": 0,
        "pass": 0,
        "needs_review": 0,
        "failed": 0,
        "dry_run": not args.apply,
        "missing_only": args.missing_only,
        "samples": [],
    }
    if args.apply:
        POLISHED_DIR.mkdir(parents=True, exist_ok=True)
        QA_DIR.mkdir(parents=True, exist_ok=True)

    for row in selected:
        video_id = row.get("video_id") or ""
        raw_path = CLEAN_DIR / f"{video_id}.txt"
        polished_path = POLISHED_DIR / f"{video_id}.txt"
        qa_path = QA_DIR / f"{video_id}.json"
        raw = raw_path.read_text(encoding="utf-8", errors="replace")
        polished, metrics = polish_text(raw)
        status, notes = qa_status(raw, polished, metrics)
        payload = {
            "video_id": video_id,
            "creator_id": row.get("creator_id") or "",
            "url": row.get("url") or "",
            "status": status,
            "notes": notes,
            "raw_path": str(raw_path.relative_to(ROOT)),
            "polished_path": str(polished_path.relative_to(ROOT)),
            "created_at": now_iso(),
            "model_tier": "local-deterministic",
            "meaning_added": False,
            **metrics,
        }
        if args.apply:
            with polished_path.open("w", encoding="utf-8", newline="\n") as handle:
                handle.write(polished + "\n")
            with qa_path.open("w", encoding="utf-8", newline="\n") as handle:
                handle.write(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n")
            stats["written"] += 1
        stats[status] += 1
        if len(stats["samples"]) < args.sample:
            stats["samples"].append(
                {
                    "video_id": video_id,
                    "status": status,
                    "raw_words": metrics["raw_word_count"],
                    "polished_words": metrics["polished_word_count"],
                    "paragraphs": metrics["paragraph_count"],
                    "preservation_score": metrics["preservation_score"],
                }
            )
    return stats


def main() -> int:
    parser = argparse.ArgumentParser(description="Conservatively polish TikTok transcripts without LLM rewrites.")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--sample", type=int, default=8)
    parser.add_argument("--missing-only", action="store_true", default=True)
    parser.add_argument("--all", dest="missing_only", action="store_false")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    print(json.dumps(process(args), ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
