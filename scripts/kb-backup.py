from pathlib import Path
from datetime import datetime
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "12_knowledge-base" / "indexes" / "kb.sqlite"
BACKUPS = ROOT / "12_knowledge-base" / "indexes" / "backups"
BACKUPS.mkdir(parents=True, exist_ok=True)

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
target = BACKUPS / f"kb-{stamp}.sqlite"

src = sqlite3.connect(DB)
dst = sqlite3.connect(target)
with dst:
    src.backup(dst)
src.close()
dst.close()

check = sqlite3.connect(target)
integrity = check.execute("PRAGMA integrity_check").fetchone()[0]
claims = check.execute("SELECT COUNT(*) FROM claims").fetchone()[0]
transcripts = check.execute("SELECT COUNT(*) FROM transcripts").fetchone()[0]
check.close()

print(f"backup={target}")
print(f"integrity={integrity}")
print(f"claims={claims}")
print(f"transcripts={transcripts}")
