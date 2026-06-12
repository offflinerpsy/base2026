from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Union


ROOT = Path(__file__).resolve().parents[1]
TIKTOK = ROOT / "12_knowledge-base" / "sources" / "tiktok"
POLISHED_DIR = TIKTOK / "transcripts" / "polished"
QA_DIR = TIKTOK / "transcripts" / "polished-qa"

Replacement = tuple[str, re.Pattern[str], Union[str, Callable[[re.Match[str]], str]]]

REPLACEMENTS: list[Replacement] = [
    ("seo_spelled_sco", re.compile(r"\bs\s+c\s+o\b", re.IGNORECASE), "SEO"),
    ("seo_spelled_s_zero", re.compile(r"\bs\s+0\b", re.IGNORECASE), "SEO"),
    ("ai_seo_spelled_ar_sco", re.compile(r"\ba\s+r\s+s\s+c\s+o\b", re.IGNORECASE), "AI SEO"),
    ("ai_models_spelled_ar_models", re.compile(r"\ba\s+r\s+models\b", re.IGNORECASE), "AI models"),
    ("ai_models_spelled_ar_models_compact", re.compile(r"\bar\s+models\b", re.IGNORECASE), "AI models"),
    ("ai_seo_spelled_ar_seo", re.compile(r"\ba\s+r\s+seo\b|\bar\s+seo\b", re.IGNORECASE), "AI SEO"),
    ("ai_friendly_spelled_ar", re.compile(r"\ba\s+r\s+friendly\b|\bar\s+friendly\b", re.IGNORECASE), "AI-friendly"),
    ("ai_era_spelled_ar", re.compile(r"\ba\s+r\s+era\b|\bar\s+era\b", re.IGNORECASE), "AI era"),
    ("chatgpt_spelled_gbt", re.compile(r"\bchat\s+g\s+b\s+t\b", re.IGNORECASE), "ChatGPT"),
    ("chatgpt_spelled_gbt_compact", re.compile(r"\bchat\s*g\s*b\s*t\b", re.IGNORECASE), "ChatGPT"),
    ("chatgpt_spelled_gbt_punctuated", re.compile(r"\bchat[,\s]+g[,\s]+b\s*t\b", re.IGNORECASE), "ChatGPT"),
    ("chatgpt_spelled_gpt", re.compile(r"\bchat\s+g\s+p\s+t\b", re.IGNORECASE), "ChatGPT"),
    ("chatgpt_spaced", re.compile(r"\bchat\s+gpt\b", re.IGNORECASE), "ChatGPT"),
    ("chatgpt_dotcom_slash", re.compile(r"\bchatgpt\.comslash", re.IGNORECASE), "ChatGPT.com/"),
    ("openai_spaced", re.compile(r"\bopen\s+ai\b", re.IGNORECASE), "OpenAI"),
    ("paypal_case", re.compile(r"\bpaypal\b", re.IGNORECASE), "PayPal"),
    ("cms_spelled_out", re.compile(r"\bc\s+m\s+s\b", re.IGNORECASE), "CMS"),
    ("emdash_spoken", re.compile(r"\bm\s+dash\b", re.IGNORECASE), "EmDash"),
    ("faq_spelled_out", re.compile(r"\bf\s+a\s+q\b", re.IGNORECASE), "FAQ"),
    ("h1_spoken", re.compile(r"\bh\s+ones\b", re.IGNORECASE), "H1s"),
    ("core_web_vitals_order", re.compile(r"\bweb\s+core\s+vitals\b", re.IGNORECASE), "Core Web Vitals"),
    ("wp_rocket_spelled", re.compile(r"\bw\s+p\s+rocket\b", re.IGNORECASE), "WP Rocket"),
    ("shure_mv7_spoken", re.compile(r"\bsure\s+m\s+v\s+seven\b", re.IGNORECASE), "Shure MV7"),
    ("shure_mv7_asr", re.compile(r"\bsr\s+m\s+v\s+7\b", re.IGNORECASE), "Shure MV7"),
    ("leadferno_spaced", re.compile(r"\blead\s+ferno\b", re.IGNORECASE), "Leadferno"),
    ("gary_illyes_asr", re.compile(r"\bharry\s+ilyas\b", re.IGNORECASE), "Gary Illyes"),
    ("qwoted_case", re.compile(r"\bqwoted\b", re.IGNORECASE), "Qwoted"),
    ("n8n_spelled_nan", re.compile(r"\bn\s+a\s+n\b", re.IGNORECASE), "n8n"),
    ("schemawriter_dot_ai", re.compile(r"\bschema\s+writer\s+dot\s+ai\b", re.IGNORECASE), "Schemawriter.ai"),
    ("perplexity_comet_browser_asr", re.compile(r"\bcomment\s+browser\b", re.IGNORECASE), "Comet browser"),
    ("claude_truncated", re.compile(r"\bclaud\b", re.IGNORECASE), "Claude"),
    ("compactkeywords_domain", re.compile(r"\bcompact\s+keywords\.com\b", re.IGNORECASE), "compactkeywords.com"),
    ("aipodcastmatcher_domain", re.compile(r"\bAI\s+podcast\s+Matcher\s+com\b", re.IGNORECASE), "AIPodcastMatcher.com"),
    ("descript_asr_descriptor", re.compile(r"\bAI\s+video\s+editor\s+descriptor\b", re.IGNORECASE), "AI video editor Descript"),
    ("claude_projects_asr", re.compile(r"\bcloud\s+projects\b", re.IGNORECASE), "Claude Projects"),
    ("sourceofsources_domain", re.compile(r"\bsource\s+of\s+sources\.com\b", re.IGNORECASE), "sourceofsources.com"),
    (
        "sourceofsources_npr_asr",
        re.compile(r"\bWashington Post,\s*Tripadvisor,\s*MPR,\s*New York Times\b", re.IGNORECASE),
        "Washington Post, Tripadvisor, NPR, New York Times",
    ),
    ("notebooklm_case", re.compile(r"\bnotebook\s+LM\b", re.IGNORECASE), "NotebookLM"),
    ("powerpoint_case", re.compile(r"\bpowerpoint\b", re.IGNORECASE), "PowerPoint"),
]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def normalize_text(text: str) -> tuple[str, Counter[str]]:
    out = text
    counts: Counter[str] = Counter()
    for name, pattern, replacement in REPLACEMENTS:
        def repl(match: re.Match[str]) -> str:
            counts[name] += 1
            return replacement(match) if callable(replacement) else replacement

        out = pattern.sub(repl, out)
    return out, counts


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def update_qa(video_id: str, replacement_counts: Counter[str], reviewed_by: str, reviewed_at: str, apply: bool) -> None:
    qa_path = QA_DIR / f"{video_id}.json"
    if not qa_path.exists():
        return
    qa = load_json(qa_path)
    notes = qa.get("notes")
    if not isinstance(notes, list):
        notes = []
    note = "Normalized obvious SEO/AI/entity ASR spelling artifacts in polished transcript."
    if note not in notes:
        notes.append(note)
    trail = qa.get("review_history")
    if not isinstance(trail, list):
        trail = []
    trail.append(
        {
            "reviewed_at": reviewed_at,
            "reviewed_by": reviewed_by,
            "decision": "normalize_polished_entities",
            "reason": "Mechanical polished-transcript normalization for obvious SEO/AI/entity ASR spellings.",
            "replacement_counts": dict(sorted(replacement_counts.items())),
        }
    )
    qa["notes"] = notes
    qa["review_history"] = trail
    qa["reviewed_at"] = reviewed_at
    qa["reviewed_by"] = reviewed_by
    if apply:
        write_json(qa_path, qa)


def main() -> int:
    parser = argparse.ArgumentParser(description="Normalize obvious SEO/AI/entity ASR spellings in polished TikTok transcripts.")
    parser.add_argument("--apply", action="store_true", help="Write changes. Default is dry-run.")
    parser.add_argument("--limit", type=int, default=0, help="Optional max changed files to process.")
    parser.add_argument("--out", type=Path, default=None, help="Optional JSON summary path.")
    parser.add_argument("--reviewed-by", default="codex-polished-entity-normalizer")
    args = parser.parse_args()

    reviewed_at = utc_now()
    rows: list[dict] = []
    total_counts: Counter[str] = Counter()
    changed = 0

    for path in sorted(POLISHED_DIR.glob("*.txt")):
        video_id = path.stem
        original = path.read_text(encoding="utf-8", errors="ignore")
        normalized, counts = normalize_text(original)
        if not counts or normalized == original:
            continue
        if args.limit and changed >= args.limit:
            break
        changed += 1
        total_counts.update(counts)
        rows.append(
            {
                "video_id": video_id,
                "path": str(path.relative_to(ROOT)),
                "replacement_counts": dict(sorted(counts.items())),
            }
        )
        if args.apply:
            path.write_text(normalized, encoding="utf-8")
        update_qa(video_id, counts, args.reviewed_by, reviewed_at, args.apply)

    summary = {
        "ok": True,
        "applied": args.apply,
        "changed_files": changed,
        "replacement_counts": dict(sorted(total_counts.items())),
        "rows": rows,
    }
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        write_json(args.out, summary)
    print(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
