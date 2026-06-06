from __future__ import annotations

import argparse
import json
import sqlite3
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
KB = ROOT / "12_knowledge-base"
DB = KB / "indexes" / "kb.sqlite"
OUT = ROOT / "public-data" / "tiktok"


def read_kb_text(rel_path: str | None) -> str:
    if not rel_path:
        return ""
    path = (KB / rel_path).resolve()
    try:
        path.relative_to(KB.resolve())
    except ValueError:
        return ""
    if not path.exists() or not path.is_file():
        return ""
    return path.read_text(encoding="utf-8", errors="replace").strip()


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Export public TikTok-only Base2026 dataset.")
    parser.add_argument("--include-full-transcripts", action="store_true", default=True)
    parser.add_argument("--out", type=Path, default=OUT)
    args = parser.parse_args()

    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    try:
        documents: list[dict] = []
        chunks: list[dict] = []
        creators: dict[str, dict] = {}

        item_rows = con.execute(
            """
            SELECT
              i.item_id,
              i.platform_item_id AS video_id,
              i.source_type,
              i.canonical_url,
              i.title,
              i.author,
              i.published_at,
              i.captured_at,
              i.metadata_json,
              cr.handle,
              cr.url AS creator_url,
              cr.niche,
              cr.language,
              te.title_source,
              te.status AS title_status
            FROM generic_items i
            LEFT JOIN creators cr ON cr.creator_id = i.author
            LEFT JOIN item_title_enrichment te ON te.item_id = i.item_id
            WHERE i.source_type = 'tiktok_video'
              AND i.status != 'out_of_scope_old'
            ORDER BY COALESCE(i.published_at, '') DESC, i.item_id
            """
        ).fetchall()

        for item in item_rows:
            item_id = item["item_id"]
            video_id = item["video_id"]
            doc_row = con.execute(
                """
                SELECT document_id, document_type, clean_path, language
                FROM generic_documents
                WHERE item_id = ?
                ORDER BY CASE document_type WHEN 'transcript_polished' THEN 0 ELSE 1 END
                LIMIT 1
                """,
                (item_id,),
            ).fetchone()
            transcript = read_kb_text(doc_row["clean_path"] if doc_row else "")
            claim_rows = [
                dict(row)
                for row in con.execute(
                    """
                    SELECT c.claim_id, c.topic, c.claim_text, c.suggested_action, c.review_status
                    FROM claim_evidence e
                    JOIN claims c ON c.claim_id = e.claim_id
                    WHERE e.video_id = ?
                    ORDER BY c.claim_id
                    """,
                    (video_id,),
                )
            ]
            creator_id = item["author"] or ""
            creators[creator_id] = {
                "creator_id": creator_id,
                "handle": item["handle"],
                "url": item["creator_url"],
                "niche": item["niche"],
                "language": item["language"],
            }
            base = {
                "item_id": item_id,
                "video_id": video_id,
                "platform": "tiktok",
                "source_type": item["source_type"],
                "source_url": item["canonical_url"],
                "title": item["title"],
                "title_source": item["title_source"],
                "title_status": item["title_status"],
                "creator_id": creator_id,
                "handle": item["handle"] or creator_id,
                "creator_url": item["creator_url"],
                "published_at": item["published_at"],
                "published_date": (item["published_at"] or "")[:10],
                "year": (item["published_at"] or "")[:4],
                "captured_at": item["captured_at"],
                "claims": claim_rows,
            }
            documents.append(
                {
                    **base,
                    "transcript_type": doc_row["document_type"] if doc_row else "",
                    "language": doc_row["language"] if doc_row else "en",
                    "transcript": transcript if args.include_full_transcripts else "",
                    "excerpt": transcript[:900],
                }
            )
            for chunk in con.execute(
                """
                SELECT chunk_id, chunk_index, text
                FROM chunks
                WHERE item_id = ?
                ORDER BY chunk_index
                """,
                (item_id,),
            ):
                chunks.append(
                    {
                        **base,
                        "id": chunk["chunk_id"],
                        "chunk_id": chunk["chunk_id"],
                        "chunk_index": chunk["chunk_index"],
                        "body": chunk["text"],
                    }
                )

        out = args.out
        out.mkdir(parents=True, exist_ok=True)
        write_jsonl(out / "documents.jsonl", documents)
        write_jsonl(out / "chunks.jsonl", chunks)
        write_jsonl(out / "creators.jsonl", sorted(creators.values(), key=lambda x: x.get("handle") or ""))
        manifest = {
            "created_at": datetime.now().isoformat(timespec="seconds"),
            "dataset": "base2026-public-tiktok",
            "scope": "public TikTok-only export",
            "documents": len(documents),
            "chunks": len(chunks),
            "creators": len(creators),
            "source_db": str(DB),
            "files": ["documents.jsonl", "chunks.jsonl", "creators.jsonl"],
        }
        (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
        print(f"documents={len(documents)} chunks={len(chunks)} creators={len(creators)} out={out}")
        return 0
    finally:
        con.close()


if __name__ == "__main__":
    raise SystemExit(main())
