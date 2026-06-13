from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "public-data" / "tiktok"
PLANNING = ROOT / ".planning"
DIGESTS = PLANNING / "digests"
PROJECT_STATE = ROOT / "docs" / "project-memory" / "PROJECT_STATE.md"
NEXT_ACTION = ROOT / "docs" / "project-memory" / "NEXT_ACTION.md"
DO_NOT_DO = ROOT / "docs" / "project-memory" / "DO_NOT_DO.md"


def read_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    if not path.exists():
        return rows
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def latest_release() -> str:
    if not PROJECT_STATE.exists():
        return "unknown"
    for line in PROJECT_STATE.read_text(encoding="utf-8").splitlines():
        if "latest deployed release:" in line:
            return line.split(":", 1)[1].strip().strip("`")
    return "unknown"


def first_next_action() -> str:
    if not NEXT_ACTION.exists():
        return "unknown"
    lines = NEXT_ACTION.read_text(encoding="utf-8").splitlines()
    in_exact_next = False
    for line in lines:
        if line.strip() == "## Exact next steps":
            in_exact_next = True
            continue
        if in_exact_next and line.startswith("## "):
            break
        if not in_exact_next:
            continue
        if line.startswith("1. "):
            return line[3:].strip()
    return "unknown"


def counts() -> dict:
    sources = read_jsonl(DATA_ROOT / "source_records.jsonl")
    passages = read_jsonl(DATA_ROOT / "passages.jsonl")
    insights = read_jsonl(DATA_ROOT / "insight_cards.jsonl")
    topics = read_jsonl(DATA_ROOT / "topics.jsonl")
    creators = read_jsonl(DATA_ROOT / "creators.jsonl")
    by_source = Counter(row.get("source_id") for row in insights if row.get("source_id"))
    public_by_source = Counter(row.get("source_id") for row in insights if row.get("source_id") and row.get("public"))
    pass_by_source = Counter(row.get("source_id") for row in passages if row.get("source_id"))
    source_ids = [row.get("source_id") for row in sources]
    return {
        "source_records": len(sources),
        "passages": len(passages),
        "insight_cards": len(insights),
        "public_insight_cards": sum(1 for row in insights if row.get("public")),
        "legacy_auto_public_cards": sum(
            1 for row in insights if row.get("public") and row.get("promotion_method") == "auto_evidence_match"
        ),
        "topics": len(topics),
        "public_topics": sum(1 for row in topics if row.get("public")),
        "creators": len(creators),
        "queued_sources_estimate": sum(1 for sid in source_ids if pass_by_source[sid] > 0 and by_source[sid] == 0),
        "sources_without_public_insight_cards": sum(1 for sid in source_ids if public_by_source[sid] == 0),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a Base2026 daily command-center digest.")
    parser.add_argument("--print-json", action="store_true")
    args = parser.parse_args()

    data = counts()
    release = latest_release()
    next_action = first_next_action()
    queue = sorted(PLANNING.glob("backfill-insight-cards-*.jsonl"), reverse=True)
    failed_runs = []
    for run_json in sorted((PLANNING / "runs").glob("*/run.json"), reverse=True)[:20]:
        payload = json.loads(run_json.read_text(encoding="utf-8"))
        if payload.get("status") == "failed":
            failed_runs.append(run_json.parent.name)

    digest = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "current_live_release": release,
        "counts": data,
        "latest_queue": str(queue[0]) if queue else "",
        "failed_or_stalled_runs": failed_runs[:5],
        "next_action": next_action,
        "deployment_blocked": data["legacy_auto_public_cards"] > 0,
    }
    DIGESTS.mkdir(parents=True, exist_ok=True)
    path = DIGESTS / f"base2026-digest-{datetime.now().strftime('%Y%m%d')}.md"
    lines = [
        "# Base2026 Daily Digest",
        "",
        f"- date: {digest['date']}",
        f"- current live release: `{release}`",
        f"- source records: {data['source_records']}",
        f"- passages: {data['passages']}",
        f"- insight cards: {data['insight_cards']}",
        f"- public insight cards: {data['public_insight_cards']}",
        f"- legacy auto public cards: {data['legacy_auto_public_cards']}",
        f"- queued sources estimate: {data['queued_sources_estimate']}",
        f"- latest queue: `{digest['latest_queue'] or 'none'}`",
        f"- failed/stalled runs: {', '.join(failed_runs[:5]) if failed_runs else 'none'}",
        f"- next action: {next_action}",
        f"- deployment blocked: {'yes' if digest['deployment_blocked'] else 'no'}",
        "",
        "## Do Not Do",
        "",
    ]
    if DO_NOT_DO.exists():
        lines.extend(DO_NOT_DO.read_text(encoding="utf-8").splitlines()[4:14])
    lines += [
        "",
        "## Next Commands",
        "",
        "```powershell",
        "python scripts/base2026-controller.py build-backfill-queue --write",
        "python scripts/base2026-controller.py run-claim-extract-sample --limit 10",
        "python scripts/base2026-controller.py verify-evidence",
        "```",
    ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    digest["digest_path"] = str(path)
    print(json.dumps(digest, ensure_ascii=False, indent=2, sort_keys=True) if args.print_json else f"digest={path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
