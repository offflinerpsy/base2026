from __future__ import annotations

import argparse
import json
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


FORBIDDEN_PREFIXES = {
    ".planning/",
    ".playwright-mcp/",
    "00_sources/",
    "01_core-methodology/",
    "02_factor-maps/",
    "03_sops/",
    "04_checklists/",
    "05_templates/",
    "06_prompt-bank/",
    "07_client-workspaces/",
    "08_experiments/",
    "09_sales-packaging/",
    "11_dreamwood_offer/",
    "12_knowledge-base/indexes/",
    "12_knowledge-base/sources/",
    "12_knowledge-base/canonical/",
    "12_knowledge-base/reports/",
    "99_original_research/",
    "meili_data/",
    "output/",
    "public-data/",
}

FORBIDDEN_EXACT = {"manifest.json"}

FORBIDDEN_PATTERNS = [
    re.compile(r"^\.env(?:\.|$)"),
    re.compile(r"^audio_.*\.ogg$"),
    re.compile(r"^base2026-.*\.(?:png|md)$"),
    re.compile(r"^config/(?:tiktok-intake-queue|release-target).*\.json$"),
    re.compile(r".*\.(?:log|zip)$"),
]

PUBLIC_SAFE_PREFIXES = {
    ".github/ISSUE_TEMPLATE/",
    ".github/workflows/",
    "10_agent-instructions/",
    "docs/",
    "web/static/",
}

PUBLIC_SAFE_EXACT = {
    ".env.example",
    ".gitignore",
    "AGENTS.md",
    "README.md",
    "requirements-local-worker.txt",
    "SECURITY.md",
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    "LICENSE",
    "LICENSE.md",
    ".github/dependabot.yml",
    ".github/pull_request_template.md",
    "config/creator-profiles.json",
    "config/creators.example.json",
    "scripts/apply-license.ps1",
    "scripts/base2026-apply-chatgpt-review.py",
    "scripts/base2026-build-chatgpt-review-packet.py",
    "scripts/audit-publication-boundary.py",
    "scripts/base2026-build-backfill-queue.py",
    "scripts/base2026-claim-extract-local.py",
    "scripts/base2026-controller.py",
    "scripts/base2026-daily-digest.py",
    "scripts/base2026-evidence-verify.py",
    "scripts/base2026-import-claim-candidates.py",
    "scripts/base2026-promote-insight-candidates.py",
    "scripts/base2026-review-insight-candidates.py",
    "scripts/check-public-export-policy.py",
    "scripts/deploy-public-vps.ps1",
    "scripts/export-public-tiktok.py",
    "scripts/fetch-tiktok-avatars.py",
    "scripts/generate-base2026-sitemap.py",
    "scripts/generate-public-pages.py",
    "scripts/generate-info-pages.py",
    "scripts/hermes-tiktok-refresh.ps1",
    "scripts/meili-index-public.py",
    "scripts/mobile-visual-qa.mjs",
    "scripts/package-public-release.ps1",
    "scripts/preflight-github-launch.ps1",
    "scripts/register-hermes-tiktok-check-task.ps1",
    "scripts/server-patch-nginx-base2026.py",
    "scripts/stage-public-files.ps1",
    "scripts/tiktok-backfill-inventory.ps1",
    "scripts/base2026-worker.py",
    "scripts/build-kb-sqlite.py",
    "scripts/import-tiktok-staging-to-kb.py",
    "scripts/kb-audit.py",
    "scripts/tiktok-polish-runner.ps1",
    "scripts/tiktok-polish-audit.py",
    "scripts/tiktok-qa-review-apply.py",
    "scripts/tiktok-caption-browser-extract.mjs",
    "scripts/tiktok-faithful-polish-local.py",
    "scripts/tiktok-process-transcripts.ps1",
    "scripts/tiktok-source-review-audit.py",
    "scripts/tiktok-ytdlp-metadata-extract.py",
    "scripts/validate-github-metadata.py",
    "web/ARCHITECTURE.md",
    "web/KNOWLEDGE_UI_GUIDE.md",
    "web/README.md",
    "web/UI_AUDIT.md",
    "web/server.py",
}

SECRET_PATTERNS = [
    ("private_key", re.compile(r"-----BEGIN (?:OPENSSH|RSA|EC|DSA)? ?PRIVATE KEY-----")),
    ("openai_key", re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b")),
    ("bearer_token", re.compile(r"Bearer\s+[A-Za-z0-9._~+/=-]{20,}")),
    ("tavily_key", re.compile(r"\btvly-[A-Za-z0-9_-]{20,}\b")),
    ("v0_key", re.compile(r"\bv1:[A-Za-z0-9_-]{10,}:[A-Za-z0-9_-]{20,}\b")),
]


@dataclass
class Finding:
    path: str
    reason: str


def run_git(args: list[str]) -> list[str]:
    raw = subprocess.check_output(
        ["git", *args],
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stderr=subprocess.DEVNULL,
    )
    return [line.strip() for line in raw.splitlines() if line.strip()]


def normalize(path: str) -> str:
    normalized = path.replace("\\", "/")
    if normalized.startswith("./"):
        normalized = normalized[2:]
    return normalized


def changed_files() -> list[str]:
    modified = run_git(["diff", "--name-only"])
    untracked = run_git(["ls-files", "--others", "--exclude-standard"])
    return sorted({normalize(path) for path in [*modified, *untracked]})


def is_forbidden(path: str) -> str | None:
    if path == ".env.example":
        return None
    if path in FORBIDDEN_EXACT:
        return "forbidden exact path"
    if any(path.startswith(prefix) for prefix in FORBIDDEN_PREFIXES):
        return "forbidden private/generated directory"
    for pattern in FORBIDDEN_PATTERNS:
        if pattern.match(path):
            return "forbidden private/generated pattern"
    return None


def is_public_safe_candidate(path: str) -> bool:
    if path in PUBLIC_SAFE_EXACT:
        return True
    return any(path.startswith(prefix) for prefix in PUBLIC_SAFE_PREFIXES)


def scan_file(path: str) -> list[Finding]:
    full_path = ROOT / path
    findings: list[Finding] = []
    if not full_path.exists() or not full_path.is_file():
        return findings
    try:
        text = full_path.read_text(encoding="utf-8", errors="replace")
    except OSError as exc:
        findings.append(Finding(path, f"unable to read file: {exc}"))
        return findings
    for label, pattern in SECRET_PATTERNS:
        if pattern.search(text):
            findings.append(Finding(path, f"possible secret pattern: {label}"))
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit Base2026 changed files before public GitHub staging.")
    parser.add_argument("--json", action="store_true", help="Print JSON instead of human-readable text.")
    args = parser.parse_args()

    files = changed_files()
    forbidden: list[Finding] = []
    needs_review: list[str] = []
    public_safe: list[str] = []
    secret_findings: list[Finding] = []

    for path in files:
        reason = is_forbidden(path)
        if reason:
            forbidden.append(Finding(path, reason))
            continue
        if is_public_safe_candidate(path):
            public_safe.append(path)
            secret_findings.extend(scan_file(path))
        else:
            needs_review.append(path)

    report = {
        "changed_files": len(files),
        "public_safe_candidates": len(public_safe),
        "public_safe_files": public_safe,
        "needs_review": needs_review,
        "forbidden": [finding.__dict__ for finding in forbidden],
        "secret_findings": [finding.__dict__ for finding in secret_findings],
        "ok_to_stage_public_safe_candidates": not forbidden and not secret_findings and not needs_review,
    }

    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        print(f"changed_files={report['changed_files']}")
        print(f"public_safe_candidates={report['public_safe_candidates']}")
        print(f"needs_review={len(needs_review)}")
        print(f"forbidden={len(forbidden)}")
        print(f"secret_findings={len(secret_findings)}")
        print(f"ok_to_stage_public_safe_candidates={str(report['ok_to_stage_public_safe_candidates']).lower()}")
        if needs_review:
            print("needs_review_paths=" + ",".join(needs_review[:12]))
        if forbidden:
            print("forbidden_paths=" + ",".join(item.path for item in forbidden[:12]))
        if secret_findings:
            print("secret_paths=" + ",".join(item.path for item in secret_findings[:12]))

    return 0 if report["ok_to_stage_public_safe_candidates"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
