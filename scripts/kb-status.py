from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "12_knowledge-base" / "indexes" / "kb.sqlite"

queries = [
    ("creators", "SELECT COUNT(*) FROM creators"),
    ("videos", "SELECT COUNT(*) FROM videos"),
    ("videos_in_scope", "SELECT COUNT(*) FROM videos WHERE transcript_status != 'out_of_scope_old'"),
    ("videos_old", "SELECT COUNT(*) FROM videos WHERE transcript_status = 'out_of_scope_old'"),
    ("transcripts", "SELECT COUNT(*) FROM transcripts"),
    ("polished_transcripts", "SELECT COUNT(*) FROM generic_documents WHERE document_type='transcript_polished'"),
    ("source_cards", "SELECT COUNT(*) FROM source_cards"),
    ("source_registry", "SELECT COUNT(*) FROM source_registry"),
    ("generic_items", "SELECT COUNT(*) FROM generic_items"),
    ("generic_documents", "SELECT COUNT(*) FROM generic_documents"),
    ("local_files", "SELECT COUNT(*) FROM generic_items WHERE source_type='local_file'"),
    ("chunks", "SELECT COUNT(*) FROM chunks"),
    ("chunks_fts", "SELECT COUNT(*) FROM chunks_fts"),
    ("queued_asr_jobs", "SELECT COUNT(*) FROM jobs WHERE task_type='asr_transcript' AND status='queued'"),
    ("claims", "SELECT COUNT(*) FROM claims"),
    ("pending_claims", "SELECT COUNT(*) FROM claims WHERE review_status = 'pending'"),
    ("methods", "SELECT COUNT(*) FROM methods"),
    ("strategy_blocks", "SELECT COUNT(*) FROM strategy_blocks"),
]

con = sqlite3.connect(DB)
for label, sql in queries:
    print(f"{label}={con.execute(sql).fetchone()[0]}")
con.close()
