from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


REQUIRED_FILES = [
    ".github/dependabot.yml",
    ".github/pull_request_template.md",
    ".github/ISSUE_TEMPLATE/config.yml",
    ".github/ISSUE_TEMPLATE/bug_report.yml",
    ".github/ISSUE_TEMPLATE/feature_request.yml",
    ".github/ISSUE_TEMPLATE/source_correction.yml",
    ".github/workflows/ci.yml",
    ".github/workflows/scorecard.yml",
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    "SECURITY.md",
]


def fail(message: str) -> None:
    raise SystemExit(message)


def read(path: str) -> str:
    target = ROOT / path
    if not target.exists():
        fail(f"missing required GitHub metadata file: {path}")
    return target.read_text(encoding="utf-8", errors="replace")


def main() -> int:
    for path in REQUIRED_FILES:
        read(path)

    pr_template = read(".github/pull_request_template.md")
    if "git add ." in pr_template:
        fail("pull request template must not encourage git add .")
    if "docs/PUBLICATION_STAGING_PLAN.md" not in pr_template:
        fail("pull request template must reference publication staging plan")

    dependabot = read(".github/dependabot.yml")
    for needle in ['version: 2', 'package-ecosystem: "github-actions"', 'directory: "/"', 'interval: "weekly"']:
        if needle not in dependabot:
            fail(f"dependabot.yml missing expected setting: {needle}")

    scorecard = read(".github/workflows/scorecard.yml")
    for needle in [
        "ossf/scorecard-action@",
        "security-events: write",
        "id-token: write",
        "contents: read",
        "github/codeql-action/upload-sarif@",
        "persist-credentials: false",
    ]:
        if needle not in scorecard:
            fail(f"scorecard workflow missing expected setting: {needle}")

    for issue_form in [
        ".github/ISSUE_TEMPLATE/bug_report.yml",
        ".github/ISSUE_TEMPLATE/feature_request.yml",
        ".github/ISSUE_TEMPLATE/source_correction.yml",
    ]:
        text = read(issue_form)
        for needle in ["name:", "description:", "title:", "body:"]:
            if needle not in text:
                fail(f"{issue_form} missing issue-form key: {needle}")

    print("github-metadata=ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
