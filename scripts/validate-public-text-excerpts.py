#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if not path.exists():
        raise SystemExit(f"missing jsonl: {path}")
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def compact(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate that public source excerpts are not silently cut mid-text."
    )
    parser.add_argument("--data", type=Path, default=Path("public-data/tiktok"))
    parser.add_argument("--max-findings", type=int, default=20)
    args = parser.parse_args()

    data = args.data.resolve()
    documents = read_jsonl(data / "documents.jsonl")
    passages = read_jsonl(data / "passages.jsonl")

    passages_by_source: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in passages:
        source_id = row.get("source_id") or ""
        if source_id:
            passages_by_source[source_id].append(row)

    findings: list[dict[str, str]] = []
    checked = 0
    for doc in documents:
        source_id = doc.get("source_id") or ""
        if not source_id or not passages_by_source.get(source_id):
            continue
        passage = compact(passages_by_source[source_id][0].get("body") or "")
        excerpt = compact(doc.get("excerpt") or "")
        if not excerpt or not passage:
            continue
        checked += 1

        silently_cut = (
            passage.startswith(excerpt)
            and len(passage) > len(excerpt) + 12
            and not excerpt.endswith("...")
        )
        if silently_cut:
            findings.append(
                {
                    "source_id": source_id,
                    "item_id": doc.get("item_id") or "",
                    "excerpt_tail": excerpt[-80:],
                    "passage_next": passage[len(excerpt) : len(excerpt) + 80],
                }
            )
            if len(findings) >= args.max_findings:
                break

    if findings:
        print(
            json.dumps(
                {
                    "ok": False,
                    "checked": checked,
                    "silent_truncation_findings": findings,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 1

    print(json.dumps({"ok": True, "checked": checked}, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
