from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from datetime import datetime
from difflib import SequenceMatcher
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "public-data" / "tiktok"
PLANNING = ROOT / ".planning"


def read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(path)
    rows: list[dict] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", (text or "").lower())).strip()


def fuzzy_score(needle: str, haystacks: list[str]) -> float:
    norm_needle = normalize(needle)
    if not norm_needle:
        return 0.0
    best = 0.0
    needle_words = norm_needle.split()
    size = max(len(needle_words), 8)
    for text in haystacks:
        words = normalize(text).split()
        if not words:
            continue
        for start in range(0, max(len(words) - size + 1, 1), max(size // 3, 1)):
            window = " ".join(words[start : start + size + 8])
            best = max(best, SequenceMatcher(None, norm_needle, window).ratio())
    return best


def verify_claim(row: dict, passages_by_source: dict[str, list[dict]]) -> dict:
    source_id = row.get("source_id") or ""
    evidence = row.get("evidence_excerpt") or ""
    texts = [p.get("body") or "" for p in passages_by_source.get(source_id, [])]
    joined = "\n".join(texts)
    norm_evidence = normalize(evidence)
    norm_joined = normalize(joined)

    if evidence and evidence in joined:
        method, score, status = "exact", 1.0, "verified"
    elif norm_evidence and norm_evidence in norm_joined:
        method, score, status = "normalized_exact", 0.95, "verified"
    else:
        score = fuzzy_score(evidence, texts)
        if score >= 0.85:
            method, status = "fuzzy_high", "verified"
        elif score >= 0.65:
            method, status = "fuzzy_weak", "needs_review"
        else:
            method, status = "rejected", "rejected"
    return {**row, "evidence_score": round(score, 4), "evidence_match_method": method, "status": status}


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify Base2026 candidate claim evidence without LLM.")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--data-root", type=Path, default=DATA_ROOT)
    parser.add_argument("--output", type=Path, default=None)
    parser.add_argument("--dry-run", action="store_true", default=True)
    args = parser.parse_args()

    candidates = read_jsonl(args.input)
    passages = read_jsonl(args.data_root / "passages.jsonl")
    passages_by_source: dict[str, list[dict]] = defaultdict(list)
    for passage in passages:
        passages_by_source[passage.get("source_id") or ""].append(passage)

    verified = [verify_claim(row, passages_by_source) for row in candidates]
    counts = Counter(row["status"] for row in verified)
    methods = Counter(row["evidence_match_method"] for row in verified)
    report = {
        "input": str(args.input),
        "output": str(args.output) if args.output else "",
        "candidates": len(candidates),
        "exact_matches": methods["exact"],
        "normalized_matches": methods["normalized_exact"],
        "fuzzy_matches": methods["fuzzy_high"] + methods["fuzzy_weak"],
        "rejected": counts["rejected"],
        "needs_review": counts["needs_review"],
        "verified": counts["verified"],
        "dry_run": True,
    }

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open("w", encoding="utf-8", newline="\n") as handle:
            for row in verified:
                handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")

    report_path = PLANNING / f"evidence-verify-{datetime.now().strftime('%Y%m%d')}.report.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    report["report"] = str(report_path)
    print(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
