from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


REQUIRED_FILES = [
    ".github/pull_request_template.md",
    ".github/ISSUE_TEMPLATE/config.yml",
    ".github/ISSUE_TEMPLATE/bug_report.yml",
    ".github/ISSUE_TEMPLATE/feature_request.yml",
    ".github/ISSUE_TEMPLATE/source_correction.yml",
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

    workflows_dir = ROOT / ".github" / "workflows"
    workflow_files = sorted(workflows_dir.glob("*")) if workflows_dir.exists() else []
    if workflow_files:
        names = ", ".join(path.name for path in workflow_files)
        fail(f"GitHub Actions workflows are disabled for this repository; remove: {names}")

    dependabot = ROOT / ".github" / "dependabot.yml"
    if dependabot.exists():
        fail("dependabot.yml is disabled because this public repo does not use GitHub Actions.")

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
