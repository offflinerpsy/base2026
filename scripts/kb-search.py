from pathlib import Path
import argparse
import sqlite3
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "12_knowledge-base" / "indexes" / "kb.sqlite"

parser = argparse.ArgumentParser()
parser.add_argument("query")
parser.add_argument("--type", choices=["claims", "transcripts", "chunks"], default="claims")
parser.add_argument("--source-type", help="Filter chunk search by generic_items.source_type, e.g. local_file or tiktok_video")
parser.add_argument("--limit", type=int, default=20)
args = parser.parse_args()

con = sqlite3.connect(DB)
if args.type == "claims":
    rows = con.execute(
        """
        SELECT c.claim_id, c.topic, substr(c.claim_text, 1, 180) AS claim
        FROM claims_fts f
        JOIN claims c ON c.claim_id = f.claim_id
        WHERE claims_fts MATCH ?
        LIMIT ?
        """,
        (args.query, args.limit),
    )
    for claim_id, topic, claim in rows:
        print(f"{claim_id}\t{topic}\t{claim}")
elif args.type == "transcripts":
    rows = con.execute(
        """
        SELECT v.video_id, v.creator_id, substr(v.title_or_description, 1, 120) AS title
        FROM transcripts_fts f
        JOIN videos v ON v.video_id = f.video_id
        WHERE transcripts_fts MATCH ?
        LIMIT ?
        """,
        (args.query, args.limit),
    )
    for video_id, creator_id, title in rows:
        print(f"{video_id}\t{creator_id}\t{title}")
else:
    source_filter = "AND i.source_type = ?" if args.source_type else ""
    params = [args.query]
    if args.source_type:
        params.append(args.source_type)
    params.append(args.limit)
    rows = con.execute(
        f"""
        SELECT i.item_id, i.source_type, substr(c.text, 1, 180) AS chunk
        FROM chunks_fts f
        JOIN chunks c ON c.chunk_id = f.chunk_id
        JOIN generic_items i ON i.item_id = f.item_id
        WHERE chunks_fts MATCH ?
        {source_filter}
        LIMIT ?
        """,
        params,
    )
    for item_id, source_type, chunk in rows:
        print(f"{item_id}\t{source_type}\t{chunk}")
con.close()
