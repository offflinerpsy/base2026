from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "public-data" / "tiktok"
PLANNING = ROOT / ".planning"
REVIEWED_NO_CARD = PLANNING / "reviewed-no-card-sources.jsonl"


def read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(path)
    rows: list[dict] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def read_optional_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return read_jsonl(path)


def stable_hash(parts: list[str]) -> str:
    payload = "\n".join(part or "" for part in parts)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def build_queue(data_root: Path, reviewed_no_card_path: Path | None = REVIEWED_NO_CARD) -> tuple[list[dict], dict]:
    sources = read_jsonl(data_root / "source_records.jsonl")
    passages = read_jsonl(data_root / "passages.jsonl")
    insights = read_jsonl(data_root / "insight_cards.jsonl")
    reviewed_no_card_rows = read_optional_jsonl(reviewed_no_card_path) if reviewed_no_card_path else []
    reviewed_no_card = {
        row.get("source_id")
        for row in reviewed_no_card_rows
        if row.get("source_id")
    }

    passages_by_source: dict[str, list[dict]] = defaultdict(list)
    for passage in passages:
        source_id = passage.get("source_id") or ""
        if source_id:
            passages_by_source[source_id].append(passage)

    insight_count = Counter(row.get("source_id") for row in insights if row.get("source_id"))
    public_insight_count = Counter(
        row.get("source_id") for row in insights if row.get("source_id") and row.get("public")
    )

    queue: list[dict] = []
    for source in sources:
        source_id = source.get("source_id") or ""
        source_passages = passages_by_source.get(source_id, [])
        if (
            not source_id
            or not source_passages
            or insight_count[source_id] != 0
            or source_id in reviewed_no_card
        ):
            continue

        passage_texts = [row.get("body") or "" for row in source_passages]
        queue.append(
            {
                "source_id": source_id,
                "item_id": source.get("item_id") or "",
                "creator_handle": source.get("creator_handle") or source.get("handle") or "",
                "source_url": source.get("source_url") or "",
                "passage_count": len(source_passages),
                "insight_card_count": int(insight_count[source_id]),
                "public_insight_card_count": int(public_insight_count[source_id]),
                "topic_ids": source.get("topics") or [],
                "topic_labels": source.get("topic_labels") or [],
                "transcript_available": bool(source.get("excerpt") or passage_texts),
                "recommended_status": "queued_for_private_claim_extraction",
                "input_hash": stable_hash([source_id, source.get("item_id") or "", *passage_texts]),
            }
        )

    summary = {
        "source_records": len(sources),
        "passages": len(passages),
        "insight_cards": len(insights),
        "public_insight_cards": sum(1 for row in insights if row.get("public")),
        "queued_sources": len(queue),
        "reviewed_no_card_sources": len(reviewed_no_card),
        "criteria": "passage_count > 0 and insight_card_count = 0 and not reviewed_no_card",
    }
    return queue, summary


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build private Base2026 insight-card backfill queue.")
    parser.add_argument("--data-root", type=Path, default=DATA_ROOT)
    parser.add_argument("--reviewed-no-card", type=Path, default=REVIEWED_NO_CARD)
    parser.add_argument("--out", type=Path, default=None)
    parser.add_argument("--dry-run", action="store_true", default=True)
    parser.add_argument("--write", action="store_true", help="Write the queue under .planning/.")
    args = parser.parse_args()

    queue, summary = build_queue(args.data_root, args.reviewed_no_card)
    stamp = datetime.now().strftime("%Y%m%d")
    out = args.out or (PLANNING / f"backfill-insight-cards-{stamp}.jsonl")
    summary["output"] = str(out)
    summary["dry_run"] = not args.write

    if args.write:
        write_jsonl(out, queue)

    print(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
