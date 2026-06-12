from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PLANNING = ROOT / ".planning"
RUNS = PLANNING / "runs"


def run_id() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S-%f")


def latest_file(pattern: str) -> Path | None:
    files = sorted(PLANNING.glob(pattern), key=lambda path: path.stat().st_mtime, reverse=True)
    return files[0] if files else None


def start_run(command: str, args: argparse.Namespace) -> Path:
    path = RUNS / run_id()
    path.mkdir(parents=True, exist_ok=True)
    clean_args = {
        key: value
        for key, value in vars(args).items()
        if key != "func" and isinstance(value, (str, int, float, bool, type(None)))
    }
    payload = {
        "command": command,
        "started_at": datetime.now().isoformat(timespec="seconds"),
        "args": clean_args,
    }
    (path / "run.json").write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
    return path


def finish_run(path: Path, status: str, summary: dict) -> None:
    run_path = path / "run.json"
    payload = json.loads(run_path.read_text(encoding="utf-8"))
    payload.update(
        {
            "finished_at": datetime.now().isoformat(timespec="seconds"),
            "status": status,
            "summary": summary,
        }
    )
    run_path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
    report = ["# Base2026 Controller Run", "", f"- status: {status}"]
    for key, value in summary.items():
        report.append(f"- {key}: {value}")
    (path / "report.md").write_text("\n".join(report) + "\n", encoding="utf-8")


def run_child(path: Path, command: list[str]) -> tuple[int, str, str]:
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, check=False)
    (path / "stdout.log").write_text(result.stdout, encoding="utf-8")
    (path / "stderr.log").write_text(result.stderr, encoding="utf-8")
    return result.returncode, result.stdout, result.stderr


def parse_last_json(stdout: str) -> dict:
    decoder = json.JSONDecoder()
    parsed: dict = {}
    for index, char in enumerate(stdout):
        if char != "{":
            continue
        try:
            value, _end = decoder.raw_decode(stdout[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            parsed = value
    return parsed


def cmd_status(args: argparse.Namespace) -> int:
    path = start_run("status", args)
    code, stdout, stderr = run_child(path, [sys.executable, "scripts/base2026-daily-digest.py", "--print-json"])
    summary = parse_last_json(stdout)
    finish_run(path, "passed" if code == 0 else "failed", summary or {"stderr": stderr.strip()[:500]})
    print(stdout.strip())
    return code


def cmd_build_backfill_queue(args: argparse.Namespace) -> int:
    path = start_run("build-backfill-queue", args)
    command = [sys.executable, "scripts/base2026-build-backfill-queue.py"]
    if args.write:
        command.append("--write")
    else:
        command.append("--dry-run")
    code, stdout, stderr = run_child(path, command)
    summary = parse_last_json(stdout)
    finish_run(path, "passed" if code == 0 else "failed", summary or {"stderr": stderr.strip()[:500]})
    print(stdout.strip())
    return code


def cmd_run_claim_extract_sample(args: argparse.Namespace) -> int:
    path = start_run("run-claim-extract-sample", args)
    queue = Path(args.queue) if args.queue else latest_file("backfill-insight-cards-*.jsonl")
    if not queue:
        finish_run(path, "failed", {"error": "No backfill queue found."})
        print(json.dumps({"error": "No backfill queue found."}, indent=2))
        return 2
    command = [
        sys.executable,
        "scripts/base2026-claim-extract-local.py",
        "--queue",
        str(queue),
        "--limit",
        str(args.limit),
    ]
    if args.model:
        command += ["--model", args.model]
    if args.execute:
        command.append("--execute")
    else:
        command.append("--dry-run")
    code, stdout, stderr = run_child(path, command)
    summary = parse_last_json(stdout)
    finish_run(path, "passed" if code == 0 else "failed", summary or {"stderr": stderr.strip()[:500]})
    print(stdout.strip())
    return code


def cmd_verify_evidence(args: argparse.Namespace) -> int:
    path = start_run("verify-evidence", args)
    input_path = Path(args.input) if args.input else latest_file("claim-candidates-*.jsonl")
    if not input_path:
        finish_run(path, "failed", {"error": "No claim candidates file found."})
        print(json.dumps({"error": "No claim candidates file found."}, indent=2))
        return 2
    command = [sys.executable, "scripts/base2026-evidence-verify.py", "--input", str(input_path), "--dry-run"]
    if args.output:
        command += ["--output", args.output]
    code, stdout, stderr = run_child(path, command)
    summary = parse_last_json(stdout)
    finish_run(path, "passed" if code == 0 else "failed", summary or {"stderr": stderr.strip()[:500]})
    print(stdout.strip())
    return code


def cmd_import_claim_candidates(args: argparse.Namespace) -> int:
    path = start_run("import-claim-candidates", args)
    input_path = Path(args.input) if args.input else latest_file("claim-candidates-*.verified.jsonl")
    if not input_path:
        finish_run(path, "failed", {"error": "No verified claim candidates file found."})
        print(json.dumps({"error": "No verified claim candidates file found."}, indent=2))
        return 2
    command = [
        sys.executable,
        "scripts/base2026-import-claim-candidates.py",
        "--input",
        str(input_path),
        "--status",
        args.status,
        "--review-status",
        args.review_status,
    ]
    if args.apply:
        command.append("--apply")
    if args.archive:
        command += ["--archive", args.archive]
    if args.default_archive:
        command.append("--default-archive")
    code, stdout, stderr = run_child(path, command)
    summary = parse_last_json(stdout)
    finish_run(path, "passed" if code == 0 else "failed", summary or {"stderr": stderr.strip()[:500]})
    print(stdout.strip())
    return code


def cmd_prepare_needs_human_review(args: argparse.Namespace) -> int:
    path = start_run("prepare-needs-human-review", args)
    review_report = Path(args.review_report) if args.review_report else latest_file("needs-human-candidate-review-*.json")
    if not review_report:
        finish_run(path, "failed", {"error": "No needs_human candidate review report found."})
        print(json.dumps({"error": "No needs_human candidate review report found."}, indent=2))
        return 2
    command = [
        sys.executable,
        "scripts/base2026-prepare-needs-human-review.py",
        "--review-report",
        str(review_report),
    ]
    if args.out_dir:
        command += ["--out-dir", args.out_dir]
    code, stdout, stderr = run_child(path, command)
    summary = parse_last_json(stdout)
    finish_run(path, "passed" if code == 0 else "failed", summary or {"stderr": stderr.strip()[:500]})
    print(stdout.strip())
    return code


def cmd_build_chatgpt_review_packet(args: argparse.Namespace) -> int:
    path = start_run("build-chatgpt-review-packet", args)
    queue = Path(args.queue) if args.queue else latest_file("backfill-insight-cards-*.jsonl")
    candidates = Path(args.candidates) if args.candidates else None
    if not candidates and args.mode != "extract":
        candidates = latest_file("claim-candidates-*.verified.jsonl")
    if not queue:
        finish_run(path, "failed", {"error": "No backfill queue found."})
        print(json.dumps({"error": "No backfill queue found."}, indent=2))
        return 2
    if args.mode == "review" and not candidates:
        finish_run(path, "failed", {"error": "No verified claim candidates file found."})
        print(json.dumps({"error": "No verified claim candidates file found."}, indent=2))
        return 2
    command = [
        sys.executable,
        "scripts/base2026-build-chatgpt-review-packet.py",
        "--queue",
        str(queue),
        "--mode",
        args.mode,
        "--limit",
        str(args.limit),
    ]
    if candidates:
        command += ["--candidates", str(candidates)]
    if args.out_md:
        command += ["--out-md", args.out_md]
    if args.out_json:
        command += ["--out-json", args.out_json]
    code, stdout, stderr = run_child(path, command)
    summary = parse_last_json(stdout)
    finish_run(path, "passed" if code == 0 else "failed", summary or {"stderr": stderr.strip()[:500]})
    print(stdout.strip())
    return code


def cmd_apply_chatgpt_review(args: argparse.Namespace) -> int:
    path = start_run("apply-chatgpt-review", args)
    packet = Path(args.packet) if args.packet else latest_file("chatgpt-review-packet-*.json")
    if not packet:
        finish_run(path, "failed", {"error": "No ChatGPT review packet JSON found."})
        print(json.dumps({"error": "No ChatGPT review packet JSON found."}, indent=2))
        return 2
    command = [
        sys.executable,
        "scripts/base2026-apply-chatgpt-review.py",
        "--packet",
        str(packet),
        "--review",
        args.review,
        "--max-new-candidates-per-source",
        str(args.max_new_candidates_per_source),
        "--min-quality-score",
        str(args.min_quality_score),
        "--max-claim-chars",
        str(args.max_claim_chars),
        "--max-action-chars",
        str(args.max_action_chars),
        "--max-evidence-chars",
        str(args.max_evidence_chars),
    ]
    if args.out:
        command += ["--out", args.out]
    code, stdout, stderr = run_child(path, command)
    summary = parse_last_json(stdout)
    finish_run(path, "passed" if code == 0 else "failed", summary or {"stderr": stderr.strip()[:500]})
    print(stdout.strip())
    return code


def cmd_review_insight_candidates(args: argparse.Namespace) -> int:
    path = start_run("review-insight-candidates", args)
    command = [
        sys.executable,
        "scripts/base2026-review-insight-candidates.py",
        "--status",
        args.status,
        "--max-promotion-candidates-per-source",
        str(args.max_promotion_candidates_per_source),
    ]
    if args.out_json:
        command += ["--out-json", args.out_json]
    if args.out_md:
        command += ["--out-md", args.out_md]
    code, stdout, stderr = run_child(path, command)
    summary = parse_last_json(stdout)
    finish_run(path, "passed" if code == 0 else "failed", summary or {"stderr": stderr.strip()[:500]})
    print(stdout.strip())
    return code


def cmd_promote_insight_candidates(args: argparse.Namespace) -> int:
    path = start_run("promote-insight-candidates", args)
    report = Path(args.review_report) if args.review_report else latest_file("pending-insight-candidate-review-*.json")
    if not report:
        finish_run(path, "failed", {"error": "No pending insight candidate review report found."})
        print(json.dumps({"error": "No pending insight candidate review report found."}, indent=2))
        return 2
    command = [
        sys.executable,
        "scripts/base2026-promote-insight-candidates.py",
        "--review-report",
        str(report),
        "--recommendation",
        args.recommendation,
        "--from-status",
        args.from_status,
        "--to-status",
        args.to_status,
    ]
    if args.claim_ids:
        command += ["--claim-ids", args.claim_ids]
    if args.apply:
        command.append("--apply")
    code, stdout, stderr = run_child(path, command)
    summary = parse_last_json(stdout)
    finish_run(path, "passed" if code == 0 else "failed", summary or {"stderr": stderr.strip()[:500]})
    print(stdout.strip())
    return code


def cmd_public_boundary_audit(args: argparse.Namespace) -> int:
    path = start_run("public-boundary-audit", args)
    code, stdout, stderr = run_child(path, [sys.executable, "scripts/check-public-export-policy.py", "public-data/tiktok"])
    finish_run(path, "passed" if code == 0 else "failed", {"stdout": stdout.strip()[:800], "stderr": stderr.strip()[:800]})
    print(stdout.strip())
    return code


def cmd_tiktok_polish_audit(args: argparse.Namespace) -> int:
    path = start_run("tiktok-polish-audit", args)
    command = [
        sys.executable,
        "scripts/tiktok-polish-audit.py",
        "--limit",
        str(args.limit),
    ]
    if args.risk:
        command += ["--risk", args.risk]
    if args.qa_status:
        command += ["--qa-status", args.qa_status]
    if args.out_json:
        command += ["--out-json", args.out_json]
    if args.out_md:
        command += ["--out-md", args.out_md]
    command.append("--json")
    code, stdout, stderr = run_child(path, command)
    summary = parse_last_json(stdout)
    finish_run(path, "passed" if code == 0 else "failed", summary or {"stderr": stderr.strip()[:500]})
    print(stdout.strip())
    return code


def cmd_tiktok_source_review_audit(args: argparse.Namespace) -> int:
    path = start_run("tiktok-source-review-audit", args)
    command = [sys.executable, "scripts/tiktok-source-review-audit.py"]
    if args.probe_network:
        command.append("--probe-network")
    if args.out:
        command += ["--out", args.out]
    if args.apply:
        command.append("--apply")
    code, stdout, stderr = run_child(path, command)
    summary = parse_last_json(stdout)
    finish_run(path, "passed" if code == 0 else "failed", summary or {"stderr": stderr.strip()[:500]})
    print(stdout.strip())
    return code


def cmd_tiktok_qa_review_apply(args: argparse.Namespace) -> int:
    path = start_run("tiktok-qa-review-apply", args)
    command = [
        sys.executable,
        "scripts/tiktok-qa-review-apply.py",
        "--manifest",
        args.manifest,
    ]
    if args.reviewed_by:
        command += ["--reviewed-by", args.reviewed_by]
    if args.out:
        command += ["--out", args.out]
    if args.apply:
        command.append("--apply")
    code, stdout, stderr = run_child(path, command)
    summary = parse_last_json(stdout)
    finish_run(path, "passed" if code == 0 else "failed", summary or {"stderr": stderr.strip()[:500]})
    print(stdout.strip())
    return code


def cmd_tiktok_metadata_extract(args: argparse.Namespace) -> int:
    path = start_run("tiktok-metadata-extract", args)
    command = [sys.executable, "scripts/tiktok-ytdlp-metadata-extract.py"]
    if args.queue:
        command += ["--queue", args.queue]
    if args.out:
        command += ["--out", args.out]
    command += ["--limit", str(args.limit)]
    code, stdout, stderr = run_child(path, command)
    summary = parse_last_json(stdout)
    finish_run(path, "passed" if code == 0 else "failed", summary or {"stderr": stderr.strip()[:500]})
    print(stdout.strip())
    return code


def cmd_import_tiktok_staging(args: argparse.Namespace) -> int:
    path = start_run("import-tiktok-staging", args)
    command = [sys.executable, "scripts/import-tiktok-staging-to-kb.py"]
    if args.input:
        command += ["--input", args.input]
    if args.limit:
        command += ["--limit", str(args.limit)]
    if args.source_id:
        command += ["--source-id", args.source_id]
    if args.report:
        command += ["--report", args.report]
    if not args.apply:
        command.append("--dry-run")
    code, stdout, stderr = run_child(path, command)
    summary = parse_last_json(stdout)
    finish_run(path, "passed" if code == 0 else "failed", summary or {"stderr": stderr.strip()[:500]})
    print(stdout.strip())
    return code


def cmd_daily_digest(args: argparse.Namespace) -> int:
    path = start_run("daily-digest", args)
    code, stdout, stderr = run_child(path, [sys.executable, "scripts/base2026-daily-digest.py"])
    summary = parse_last_json(stdout)
    finish_run(path, "passed" if code == 0 else "failed", summary or {"stderr": stderr.strip()[:500]})
    print(stdout.strip())
    return code


def cmd_tiktok_qa_triage(args: argparse.Namespace) -> int:
    path = start_run("tiktok-qa-triage", args)
    command = [
        sys.executable,
        "scripts/tiktok-qa-triage.py",
        "--limit",
        str(args.limit),
    ]
    if args.out_json:
        command += ["--out-json", args.out_json]
    if args.out_md:
        command += ["--out-md", args.out_md]
    code, stdout, stderr = run_child(path, command)
    summary = parse_last_json(stdout)
    finish_run(path, "passed" if code == 0 else "failed", summary or {"stderr": stderr.strip()[:500]})
    print(stdout.strip())
    return code


def cmd_list_runs(args: argparse.Namespace) -> int:
    rows = []
    for run_path in sorted(RUNS.glob("*"), reverse=True)[: args.limit]:
        run_json = run_path / "run.json"
        if run_json.exists():
            payload = json.loads(run_json.read_text(encoding="utf-8"))
            rows.append({"run": run_path.name, "command": payload.get("command"), "status": payload.get("status")})
    print(json.dumps(rows, indent=2, sort_keys=True))
    return 0


def cmd_doctor(args: argparse.Namespace) -> int:
    path = start_run("doctor", args)
    checks = {
        "public_data_exists": (ROOT / "public-data" / "tiktok" / "source_records.jsonl").exists(),
        "policy_check_script_exists": (ROOT / "scripts" / "check-public-export-policy.py").exists(),
        "queue_builder_exists": (ROOT / "scripts" / "base2026-build-backfill-queue.py").exists(),
        "evidence_verifier_exists": (ROOT / "scripts" / "base2026-evidence-verify.py").exists(),
        "claim_extract_local_exists": (ROOT / "scripts" / "base2026-claim-extract-local.py").exists(),
        "claim_candidate_import_exists": (ROOT / "scripts" / "base2026-import-claim-candidates.py").exists(),
        "needs_human_review_preparer_exists": (ROOT / "scripts" / "base2026-prepare-needs-human-review.py").exists(),
        "chatgpt_review_packet_builder_exists": (ROOT / "scripts" / "base2026-build-chatgpt-review-packet.py").exists(),
        "chatgpt_review_applier_exists": (ROOT / "scripts" / "base2026-apply-chatgpt-review.py").exists(),
        "insight_candidate_reviewer_exists": (ROOT / "scripts" / "base2026-review-insight-candidates.py").exists(),
        "insight_candidate_promoter_exists": (ROOT / "scripts" / "base2026-promote-insight-candidates.py").exists(),
        "tiktok_metadata_extractor_exists": (ROOT / "scripts" / "tiktok-ytdlp-metadata-extract.py").exists(),
        "tiktok_caption_browser_extractor_exists": (ROOT / "scripts" / "tiktok-caption-browser-extract.mjs").exists(),
        "tiktok_staging_importer_exists": (ROOT / "scripts" / "import-tiktok-staging-to-kb.py").exists(),
        "tiktok_polish_audit_exists": (ROOT / "scripts" / "tiktok-polish-audit.py").exists(),
        "tiktok_qa_triage_exists": (ROOT / "scripts" / "tiktok-qa-triage.py").exists(),
        "tiktok_qa_review_applier_exists": (ROOT / "scripts" / "tiktok-qa-review-apply.py").exists(),
        "tiktok_source_review_audit_exists": (ROOT / "scripts" / "tiktok-source-review-audit.py").exists(),
        "worker_exists": (ROOT / "scripts" / "base2026-worker.py").exists(),
        "local_worker_requirements_exists": (ROOT / "requirements-local-worker.txt").exists(),
    }
    finish_run(path, "passed" if all(checks.values()) else "failed", checks)
    print(json.dumps(checks, indent=2, sort_keys=True))
    return 0 if all(checks.values()) else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Base2026 local pipeline controller.")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("status").set_defaults(func=cmd_status)
    sub.add_parser("data-quality-report").set_defaults(func=cmd_status)
    sub.add_parser("next-action-report").set_defaults(func=cmd_status)
    sub.add_parser("inventory-check").set_defaults(func=cmd_status)

    build = sub.add_parser("build-backfill-queue")
    build.add_argument("--write", action="store_true")
    build.set_defaults(func=cmd_build_backfill_queue)

    extract = sub.add_parser("run-claim-extract-sample")
    extract.add_argument("--queue", default="")
    extract.add_argument("--limit", type=int, default=10)
    extract.add_argument("--execute", action="store_true")
    extract.add_argument("--model", default="")
    extract.set_defaults(func=cmd_run_claim_extract_sample)

    verify = sub.add_parser("verify-evidence")
    verify.add_argument("--input", default="")
    verify.add_argument("--output", default="")
    verify.set_defaults(func=cmd_verify_evidence)

    import_claims = sub.add_parser("import-claim-candidates")
    import_claims.add_argument("--input", default="")
    import_claims.add_argument("--status", default="verified")
    import_claims.add_argument("--review-status", default="pending")
    import_claims.add_argument("--archive", default="")
    import_claims.add_argument("--default-archive", action="store_true")
    import_claims.add_argument("--apply", action="store_true")
    import_claims.set_defaults(func=cmd_import_claim_candidates)

    needs_human = sub.add_parser("prepare-needs-human-review")
    needs_human.add_argument("--review-report", default="")
    needs_human.add_argument("--out-dir", default="")
    needs_human.set_defaults(func=cmd_prepare_needs_human_review)

    review_packet = sub.add_parser("build-chatgpt-review-packet")
    review_packet.add_argument("--queue", default="")
    review_packet.add_argument("--candidates", default="")
    review_packet.add_argument("--mode", choices=["auto", "review", "extract"], default="auto")
    review_packet.add_argument("--limit", type=int, default=10)
    review_packet.add_argument("--out-md", default="")
    review_packet.add_argument("--out-json", default="")
    review_packet.set_defaults(func=cmd_build_chatgpt_review_packet)

    apply_review = sub.add_parser("apply-chatgpt-review")
    apply_review.add_argument("--packet", default="")
    apply_review.add_argument("--review", required=True)
    apply_review.add_argument("--out", default="")
    apply_review.add_argument("--max-new-candidates-per-source", type=int, default=3)
    apply_review.add_argument("--min-quality-score", type=int, default=4)
    apply_review.add_argument("--max-claim-chars", type=int, default=220)
    apply_review.add_argument("--max-action-chars", type=int, default=280)
    apply_review.add_argument("--max-evidence-chars", type=int, default=900)
    apply_review.set_defaults(func=cmd_apply_chatgpt_review)

    review_insights = sub.add_parser("review-insight-candidates")
    review_insights.add_argument("--status", default="pending")
    review_insights.add_argument("--out-json", default="")
    review_insights.add_argument("--out-md", default="")
    review_insights.add_argument("--max-promotion-candidates-per-source", type=int, default=2)
    review_insights.set_defaults(func=cmd_review_insight_candidates)

    promote_insights = sub.add_parser("promote-insight-candidates")
    promote_insights.add_argument("--review-report", default="")
    promote_insights.add_argument("--recommendation", default="promotion_candidate")
    promote_insights.add_argument("--claim-ids", default="")
    promote_insights.add_argument("--from-status", default="pending")
    promote_insights.add_argument("--to-status", default="approved")
    promote_insights.add_argument("--apply", action="store_true")
    promote_insights.set_defaults(func=cmd_promote_insight_candidates)

    sub.add_parser("public-boundary-audit").set_defaults(func=cmd_public_boundary_audit)

    polish_audit = sub.add_parser("tiktok-polish-audit")
    polish_audit.add_argument("--limit", type=int, default=20)
    polish_audit.add_argument("--risk", default="")
    polish_audit.add_argument("--qa-status", default="")
    polish_audit.add_argument("--out-json", default="")
    polish_audit.add_argument("--out-md", default="")
    polish_audit.set_defaults(func=cmd_tiktok_polish_audit)

    qa_triage = sub.add_parser("tiktok-qa-triage")
    qa_triage.add_argument("--limit", type=int, default=50)
    qa_triage.add_argument("--out-json", default="")
    qa_triage.add_argument("--out-md", default="")
    qa_triage.set_defaults(func=cmd_tiktok_qa_triage)

    source_review = sub.add_parser("tiktok-source-review-audit")
    source_review.add_argument("--probe-network", action="store_true")
    source_review.add_argument("--out", default="")
    source_review.add_argument("--apply", action="store_true")
    source_review.set_defaults(func=cmd_tiktok_source_review_audit)

    qa_apply = sub.add_parser("tiktok-qa-review-apply")
    qa_apply.add_argument("--manifest", required=True)
    qa_apply.add_argument("--reviewed-by", default="")
    qa_apply.add_argument("--out", default="")
    qa_apply.add_argument("--apply", action="store_true")
    qa_apply.set_defaults(func=cmd_tiktok_qa_review_apply)

    tiktok_metadata = sub.add_parser("tiktok-metadata-extract")
    tiktok_metadata.add_argument("--queue", default="")
    tiktok_metadata.add_argument("--out", default="")
    tiktok_metadata.add_argument("--limit", type=int, default=0)
    tiktok_metadata.set_defaults(func=cmd_tiktok_metadata_extract)

    tiktok_import = sub.add_parser("import-tiktok-staging")
    tiktok_import.add_argument("--input", default="")
    tiktok_import.add_argument("--limit", type=int, default=0)
    tiktok_import.add_argument("--source-id", default="")
    tiktok_import.add_argument("--report", default="")
    tiktok_import.add_argument("--apply", action="store_true")
    tiktok_import.set_defaults(func=cmd_import_tiktok_staging)

    sub.add_parser("daily-digest").set_defaults(func=cmd_daily_digest)
    sub.add_parser("doctor").set_defaults(func=cmd_doctor)

    runs = sub.add_parser("list-runs")
    runs.add_argument("--limit", type=int, default=10)
    runs.set_defaults(func=cmd_list_runs)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
