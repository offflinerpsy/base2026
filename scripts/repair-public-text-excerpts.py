#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise SystemExit(f"missing jsonl: {path}")
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def compact_text(value: str, limit: int = 1600) -> str:
    text = re.sub(r"\s+", " ", value or "").strip()
    if not text or limit <= 0 or len(text) <= limit:
        return text

    window = text[:limit].rstrip()
    sentence_cut = max(window.rfind(". "), window.rfind("? "), window.rfind("! "))
    if sentence_cut >= int(limit * 0.62):
        window = window[: sentence_cut + 1].rstrip()
    else:
        word_cut = window.rfind(" ")
        if word_cut >= int(limit * 0.72):
            window = window[:word_cut].rstrip()

    return window.rstrip(" ,;:-") + "..."


def public_excerpt_for_source(source_id: str, passages_by_source: dict[str, list[dict[str, Any]]]) -> str:
    passages = sorted(
        passages_by_source.get(source_id, []),
        key=lambda row: (row.get("chunk_index") is None, row.get("chunk_index") or 0, row.get("id") or ""),
    )
    for passage in passages:
        text = compact_text(str(passage.get("body") or ""))
        if text:
            return compact_text(text)
    return ""


def repair_rows(rows: list[dict[str, Any]], passages_by_source: dict[str, list[dict[str, Any]]]) -> int:
    changed = 0
    for row in rows:
        if row.get("full_transcript_public") or row.get("transcript"):
            continue
        source_id = str(row.get("source_id") or "")
        replacement = public_excerpt_for_source(source_id, passages_by_source)
        if replacement and row.get("excerpt") != replacement:
            row["excerpt"] = replacement
            changed += 1
    return changed


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Repair public excerpt fields from reviewed public passages without changing release membership."
    )
    parser.add_argument("--data", type=Path, default=Path("public-data/tiktok"))
    args = parser.parse_args()

    data = args.data.resolve()
    passages = read_jsonl(data / "passages.jsonl")
    passages_by_source: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in passages:
        source_id = row.get("source_id") or ""
        if source_id:
            passages_by_source[str(source_id)].append(row)

    summary: dict[str, Any] = {"data": str(data), "files": {}}
    for name in ("documents.jsonl", "source_records.jsonl"):
        path = data / name
        rows = read_jsonl(path)
        changed = repair_rows(rows, passages_by_source)
        write_jsonl(path, rows)
        summary["files"][name] = {"rows": len(rows), "excerpt_repairs": changed}

    print(json.dumps(summary, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
