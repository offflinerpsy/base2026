from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
TIKTOK = ROOT / "12_knowledge-base" / "sources" / "tiktok"
QA_DIR = TIKTOK / "transcripts" / "polished-qa"
ALLOWED_DECISIONS = {"pass", "keep_needs_review"}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def normalize_notes(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    text = str(value).strip()
    return [text] if text else []


def read_manifest(path: Path) -> dict[str, Any]:
    payload = load_json(path)
    decisions = payload.get("decisions")
    if not isinstance(decisions, list):
        raise ValueError("Manifest must contain a decisions array.")
    return payload


def decision_reason(item: dict[str, Any]) -> str:
    reason = str(item.get("reason", "")).strip()
    if not reason:
        raise ValueError(f"Decision for {item.get('video_id', '<missing>')} must include a reason.")
    return reason


def apply_decision(qa: dict[str, Any], item: dict[str, Any], reviewer: str, reviewed_at: str) -> dict[str, Any]:
    decision = str(item.get("decision", "")).strip()
    reason = decision_reason(item)
    if decision not in ALLOWED_DECISIONS:
        raise ValueError(f"Unsupported decision for {item.get('video_id', '<missing>')}: {decision}")

    updated = dict(qa)
    current_notes = normalize_notes(updated.get("notes"))
    review_notes = normalize_notes(item.get("notes"))
    audit_entry = {
        "reviewed_at": reviewed_at,
        "reviewed_by": reviewer,
        "decision": decision,
        "reason": reason,
        "notes": review_notes,
    }
    trail = updated.get("review_history")
    if not isinstance(trail, list):
        trail = []
    trail.append(audit_entry)

    updated["status"] = "pass" if decision == "pass" else "needs_review"
    updated["reviewed_by"] = reviewer
    updated["reviewed_at"] = reviewed_at
    updated["review_decision"] = decision
    updated["review_reason"] = reason
    updated["review_history"] = trail
    updated["notes"] = current_notes + [note for note in review_notes if note not in current_notes]
    return updated


def main() -> int:
    parser = argparse.ArgumentParser(description="Apply explicit transcript QA reviewer decisions from a private manifest.")
    parser.add_argument("--manifest", type=Path, required=True, help="Private JSON manifest with decisions[].")
    parser.add_argument("--reviewed-by", default="", help="Reviewer id/name. Defaults to manifest.reviewed_by.")
    parser.add_argument("--apply", action="store_true", help="Write QA JSON changes. Default is dry-run.")
    parser.add_argument("--out", type=Path, default=None, help="Optional public-safe summary JSON path.")
    args = parser.parse_args()

    manifest = read_manifest(args.manifest)
    reviewer = args.reviewed_by or str(manifest.get("reviewed_by", "")).strip()
    if not reviewer:
        raise SystemExit("--reviewed-by or manifest.reviewed_by is required.")
    reviewed_at = str(manifest.get("reviewed_at") or utc_now())

    summary: dict[str, Any] = {
        "ok": True,
        "manifest": str(args.manifest),
        "applied": args.apply,
        "reviewed_by": reviewer,
        "reviewed_at": reviewed_at,
        "counts": {"pass": 0, "keep_needs_review": 0, "missing_qa": 0, "errors": 0},
        "rows": [],
    }

    seen: set[str] = set()
    for item in manifest["decisions"]:
        if not isinstance(item, dict):
            summary["counts"]["errors"] += 1
            summary["rows"].append({"ok": False, "error": "decision item is not an object"})
            continue
        video_id = str(item.get("video_id", "")).strip()
        if not video_id:
            summary["counts"]["errors"] += 1
            summary["rows"].append({"ok": False, "error": "missing video_id"})
            continue
        if video_id in seen:
            summary["counts"]["errors"] += 1
            summary["rows"].append({"ok": False, "video_id": video_id, "error": "duplicate video_id"})
            continue
        seen.add(video_id)

        qa_path = QA_DIR / f"{video_id}.json"
        decision = str(item.get("decision", "")).strip()
        row = {"video_id": video_id, "decision": decision, "qa_path": str(qa_path.relative_to(ROOT))}
        if not qa_path.exists():
            summary["counts"]["missing_qa"] += 1
            row.update({"ok": False, "error": "missing_qa"})
            summary["rows"].append(row)
            continue
        try:
            qa = load_json(qa_path)
            updated = apply_decision(qa, item, reviewer, reviewed_at)
        except Exception as exc:
            summary["counts"]["errors"] += 1
            row.update({"ok": False, "error": str(exc)})
            summary["rows"].append(row)
            continue

        if decision in summary["counts"]:
            summary["counts"][decision] += 1
        row.update({"ok": True, "previous_status": qa.get("status"), "next_status": updated.get("status")})
        summary["rows"].append(row)
        if args.apply:
            write_json(qa_path, updated)

    if summary["counts"]["errors"] or summary["counts"]["missing_qa"]:
        summary["ok"] = False

    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        write_json(args.out, summary)

    print(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True))
    return 0 if summary["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
