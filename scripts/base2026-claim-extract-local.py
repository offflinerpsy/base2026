from __future__ import annotations

import argparse
import hashlib
import json
import os
import time
import urllib.error
import urllib.request
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "public-data" / "tiktok"
PLANNING = ROOT / ".planning"
PROMPT_VERSION = "base2026-claim-extract-v1"


def read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(path)
    rows: list[dict] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def request_json(url: str, payload: dict | None = None, timeout: float = 2.0) -> dict | None:
    try:
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except (OSError, urllib.error.URLError, json.JSONDecodeError):
        return None


def detect_endpoint() -> dict:
    ollama_host = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
    ollama_tags = request_json(f"{ollama_host}/api/tags", timeout=0.8)
    if ollama_tags and isinstance(ollama_tags.get("models"), list):
        models = [row.get("name") for row in ollama_tags["models"] if row.get("name")]
        return {"available": True, "type": "ollama", "base_url": ollama_host, "models": models}

    for base_url in [
        os.environ.get("LOCAL_OPENAI_BASE_URL", "").rstrip("/"),
        os.environ.get("OPENAI_BASE_URL", "").rstrip("/"),
        "http://127.0.0.1:1234/v1",
        "http://127.0.0.1:8000/v1",
    ]:
        if not base_url or "127.0.0.1" not in base_url and "localhost" not in base_url:
            continue
        models = request_json(f"{base_url}/models", timeout=0.8)
        if models and isinstance(models.get("data"), list):
            names = [row.get("id") for row in models["data"] if row.get("id")]
            return {"available": True, "type": "openai_compatible", "base_url": base_url, "models": names}

    return {"available": False, "type": "", "base_url": "", "models": []}


def load_passages(data_root: Path) -> dict[str, list[dict]]:
    passages_by_source: dict[str, list[dict]] = defaultdict(list)
    for passage in read_jsonl(data_root / "passages.jsonl"):
        passages_by_source[passage.get("source_id") or ""].append(passage)
    return passages_by_source


def prompt_for_source(queue_row: dict, passages: list[dict]) -> str:
    passage_lines = []
    for passage in passages[:8]:
        passage_lines.append(f"[{passage.get('id') or passage.get('chunk_id')}] {passage.get('body') or ''}")
    return (
        "Return strict JSON only. No prose. No markdown. No unsupported claims.\n"
        "Given public passages from one TikTok source, extract 0-5 claims useful for SEO, GEO, AEO, AI visibility, search, content strategy, local business visibility, creator/source attribution, or knowledge-base structure.\n"
        "A valid claim must be directly supported by the evidence text and include an exact evidence excerpt copied from the input.\n"
        "If no useful claim exists, return an empty claims list.\n"
        "JSON shape: {\"source_id\":\"...\",\"claims\":[{\"topic_label\":\"...\",\"claim_text\":\"...\",\"suggested_action\":\"...\",\"evidence_excerpt\":\"...\",\"confidence\":0.0}]}\n\n"
        f"source_id: {queue_row.get('source_id')}\n"
        f"creator_handle: {queue_row.get('creator_handle')}\n"
        "passages:\n"
        + "\n".join(passage_lines)
    )


def call_ollama(endpoint: dict, model: str, prompt: str) -> str:
    payload = {"model": model, "prompt": prompt, "stream": False, "format": "json"}
    response = request_json(f"{endpoint['base_url']}/api/generate", payload=payload, timeout=120)
    if not response:
        raise RuntimeError("Ollama did not return JSON.")
    return response.get("response") or ""


def call_openai_compatible(endpoint: dict, model: str, prompt: str) -> str:
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0,
        "response_format": {"type": "json_object"},
    }
    response = request_json(f"{endpoint['base_url']}/chat/completions", payload=payload, timeout=120)
    if not response:
        raise RuntimeError("Local OpenAI-compatible endpoint did not return JSON.")
    return response["choices"][0]["message"]["content"]


def parse_model_output(raw: str, expected_source_id: str) -> tuple[list[dict], bool]:
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return [], False
    if not isinstance(parsed, dict) or parsed.get("source_id") != expected_source_id:
        return [], False
    claims = parsed.get("claims")
    if not isinstance(claims, list):
        return [], False
    valid: list[dict] = []
    for claim in claims[:5]:
        if not isinstance(claim, dict):
            continue
        if not claim.get("claim_text") or not claim.get("evidence_excerpt"):
            continue
        valid.append(claim)
    return valid, True


def main() -> int:
    parser = argparse.ArgumentParser(description="Run local-only private claim extraction over a backfill queue.")
    parser.add_argument("--queue", type=Path, required=True)
    parser.add_argument("--data-root", type=Path, default=DATA_ROOT)
    parser.add_argument("--limit", type=int, required=True)
    parser.add_argument("--out", type=Path, default=None)
    parser.add_argument("--report", type=Path, default=None)
    parser.add_argument("--dry-run", action="store_true", default=True)
    parser.add_argument("--execute", action="store_true", help="Actually call the detected local model endpoint.")
    parser.add_argument("--model", default=os.environ.get("LOCAL_LLM_MODEL", ""))
    parser.add_argument("--allow-paid-api", action="store_true", help="Reserved; paid APIs are not implemented.")
    args = parser.parse_args()

    if args.allow_paid_api:
        raise SystemExit("Paid API path is intentionally not implemented for this runner.")
    if args.limit <= 0:
        raise SystemExit("--limit must be positive.")

    queue = read_jsonl(args.queue)[: args.limit]
    passages_by_source = load_passages(args.data_root)
    endpoint = detect_endpoint()
    model = args.model or (endpoint["models"][0] if endpoint["models"] else "")
    stamp = datetime.now().strftime("%Y%m%d")
    out = args.out or (PLANNING / f"claim-candidates-{stamp}.jsonl")
    report_path = args.report or (PLANNING / f"claim-candidates-{stamp}.report.md")

    candidates: list[dict] = []
    json_valid = 0
    schema_valid = 0
    started = time.time()
    errors: list[str] = []

    if args.execute and not endpoint["available"]:
        errors.append("local model unavailable")
    elif args.execute and not model:
        errors.append("local model unavailable: no model detected")
    elif args.execute:
        for row in queue:
            source_id = row.get("source_id") or ""
            prompt = prompt_for_source(row, passages_by_source.get(source_id, []))
            try:
                raw = (
                    call_ollama(endpoint, model, prompt)
                    if endpoint["type"] == "ollama"
                    else call_openai_compatible(endpoint, model, prompt)
                )
                claims, ok = parse_model_output(raw, source_id)
                json_valid += int(ok)
                schema_valid += int(bool(claims) or ok)
                for index, claim in enumerate(claims, 1):
                    payload = {
                        "source_id": source_id,
                        "item_id": row.get("item_id") or "",
                        "creator_handle": row.get("creator_handle") or "",
                        "topic_id": "",
                        "topic_label": claim.get("topic_label") or "",
                        "claim_text": claim.get("claim_text") or "",
                        "suggested_action": claim.get("suggested_action") or "",
                        "evidence_excerpt": claim.get("evidence_excerpt") or "",
                        "evidence_source": "passage",
                        "source_passage_id": "",
                        "model_name": model,
                        "model_endpoint_type": endpoint["type"],
                        "prompt_version": PROMPT_VERSION,
                        "input_hash": row.get("input_hash") or "",
                        "output_hash": sha256_text(json.dumps(claim, ensure_ascii=False, sort_keys=True)),
                        "status": "candidate",
                        "public": False,
                        "needs_review": True,
                        "created_at": datetime.now().isoformat(timespec="seconds"),
                    }
                    payload["topic_id"] = "-".join(payload["topic_label"].lower().split())[:120]
                    candidates.append(payload)
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{source_id}: {exc}")

    write_jsonl(out, candidates)
    elapsed = max(time.time() - started, 0.001)
    report = [
        "# Base2026 Claim Extraction Report",
        "",
        f"- queue: `{args.queue}`",
        f"- output: `{out}`",
        f"- sources selected: {len(queue)}",
        f"- execute: {bool(args.execute)}",
        f"- dry_run: {not args.execute}",
        f"- endpoint detected: {endpoint['available']}",
        f"- endpoint type: {endpoint['type'] or 'unavailable'}",
        f"- model: {model or 'unavailable'}",
        f"- candidates written: {len(candidates)}",
        f"- JSON validity count: {json_valid}",
        f"- schema validity count: {schema_valid}",
        f"- average latency seconds/source: {elapsed / max(len(queue), 1):.3f}",
        "- paid API cost: 0",
        f"- errors: {len(errors)}",
    ]
    if errors:
        report += ["", "## Errors", *[f"- {error}" for error in errors[:20]]]
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(report) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "queue": str(args.queue),
                "output": str(out),
                "report": str(report_path),
                "sources_selected": len(queue),
                "endpoint_detected": endpoint["available"],
                "endpoint_type": endpoint["type"] or "unavailable",
                "model": model or "unavailable",
                "execute": bool(args.execute),
                "candidates": len(candidates),
                "json_validity_count": json_valid,
                "schema_validity_count": schema_valid,
                "errors": len(errors),
                "paid_api_cost": 0,
            },
            ensure_ascii=False,
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
