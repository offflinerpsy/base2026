from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "12_knowledge-base" / "indexes" / "kb.sqlite"

con = sqlite3.connect(DB)
checks = {
    "integrity": con.execute("PRAGMA integrity_check").fetchone()[0],
    "foreign_key_errors": len(con.execute("PRAGMA foreign_key_check").fetchall()),
    "claims": con.execute("SELECT COUNT(*) FROM claims").fetchone()[0],
    "claims_fts": con.execute("SELECT COUNT(*) FROM claims_fts").fetchone()[0],
    "insight_card_candidates": con.execute("SELECT COUNT(*) FROM claims WHERE claim_type='insight_card_candidate'").fetchone()[0],
    "transcripts": con.execute("SELECT COUNT(*) FROM transcripts").fetchone()[0],
    "polished_transcripts": con.execute("SELECT COUNT(*) FROM generic_documents WHERE document_type='transcript_polished'").fetchone()[0],
    "transcripts_fts": con.execute("SELECT COUNT(*) FROM transcripts_fts").fetchone()[0],
    "source_cards": con.execute("SELECT COUNT(*) FROM source_cards").fetchone()[0],
    "source_registry": con.execute("SELECT COUNT(*) FROM source_registry").fetchone()[0],
    "generic_items": con.execute("SELECT COUNT(*) FROM generic_items").fetchone()[0],
    "generic_documents": con.execute("SELECT COUNT(*) FROM generic_documents").fetchone()[0],
    "local_files": con.execute("SELECT COUNT(*) FROM generic_items WHERE source_type='local_file'").fetchone()[0],
    "chunks": con.execute("SELECT COUNT(*) FROM chunks").fetchone()[0],
    "chunks_fts": con.execute("SELECT COUNT(*) FROM chunks_fts").fetchone()[0],
    "queued_asr_jobs": con.execute("SELECT COUNT(*) FROM jobs WHERE task_type='asr_transcript' AND status='queued'").fetchone()[0],
    "claim_cards_files": len(list((ROOT / "12_knowledge-base" / "canonical" / "claims").glob("*.md"))),
    "methods": con.execute("SELECT COUNT(*) FROM methods").fetchone()[0],
    "strategy_blocks": con.execute("SELECT COUNT(*) FROM strategy_blocks").fetchone()[0],
}
con.close()

ok = (
    checks["integrity"] == "ok"
    and checks["foreign_key_errors"] == 0
    and checks["claims"] == checks["claims_fts"]
    and checks["claim_cards_files"] <= checks["claims"]
    and checks["claims"] - checks["claim_cards_files"] == checks["insight_card_candidates"]
    and checks["transcripts"] == checks["transcripts_fts"] == checks["source_cards"]
    and checks["source_registry"] >= 1
    and checks["generic_items"] >= checks["transcripts"]
    and checks["generic_documents"] >= checks["transcripts"]
    and checks["local_files"] > 0
    and checks["chunks"] == checks["chunks_fts"]
)

for key, value in checks.items():
    print(f"{key}={value}")
print(f"audit={'PASS' if ok else 'FAIL'}")
