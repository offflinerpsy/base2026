from __future__ import annotations

import json
import re
import sqlite3
import subprocess
import threading
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "12_knowledge-base" / "indexes" / "kb.sqlite"
STATIC = Path(__file__).resolve().parent / "static"
REFRESH_STATE_PATH = ROOT / ".planning" / "tiktok-refresh-state.json"

REFRESH_STATE = {
    "running": False,
    "started_at": None,
    "finished_at": None,
    "ok": None,
    "log": "",
}


TOPICS = [
    {"id": "seo", "label": "SEO", "query": "SEO OR ranking OR crawl OR index"},
    {"id": "geo", "label": "GEO", "query": "GEO OR LLM OR ChatGPT OR citations"},
    {"id": "aeo", "label": "AEO", "query": "AEO OR answer OR overview"},
    {"id": "local", "label": "Local SEO", "query": "\"Google Business Profile\" OR maps OR local"},
    {"id": "reddit", "label": "Reddit", "query": "Reddit"},
    {"id": "bing", "label": "Bing", "query": "Bing OR Copilot"},
    {"id": "google", "label": "Google", "query": "Google OR \"AI Overview\""},
    {"id": "schema", "label": "Schema", "query": "schema OR structured"},
]


def connect() -> sqlite3.Connection:
    con = sqlite3.connect(f"file:{DB.as_posix()}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA query_only=ON")
    con.execute("PRAGMA busy_timeout=5000")
    return con


def json_response(handler: BaseHTTPRequestHandler, data: object, status: int = 200) -> None:
    body = json.dumps(data, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def static_content_type(path: Path) -> str:
    return {
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".html": "text/html; charset=utf-8",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".svg": "image/svg+xml",
    }.get(path.suffix.lower(), "application/octet-stream")


def fts_query(raw: str, mode: str = "any") -> str:
    tokens = [
        token
        for token in re.findall(r"[\wА-Яа-яЁё]+", raw or "", flags=re.UNICODE)
        if token.upper() not in {"AND", "OR", "NOT"}
    ]
    if not tokens:
        return ""
    parts = [f'"{token.replace(chr(34), chr(34) + chr(34))}"' for token in tokens[:8]]
    if mode == "all":
        return " AND ".join(parts)
    if len(tokens) > 1:
        phrase = " ".join(tokens[:8]).replace('"', '""')
        parts.insert(0, f'"{phrase}"')
    return " OR ".join(parts)


def row_dict(row: sqlite3.Row) -> dict:
    return {key: row[key] for key in row.keys()}


def title_is_truncated(title: str | None) -> bool:
    text = (title or "").strip()
    return text.endswith("...") or text.endswith("…")


def read_kb_text(rel_path: str | None) -> str:
    if not rel_path:
        return ""
    base = ROOT / "12_knowledge-base"
    path = (base / rel_path).resolve()
    try:
        path.relative_to(base.resolve())
    except ValueError:
        return ""
    if not path.exists() or not path.is_file():
        return ""
    return path.read_text(encoding="utf-8", errors="replace").strip()


def status_data() -> dict:
    con = connect()
    try:
        queries = {
            "creators": "SELECT COUNT(*) FROM creators",
            "videos": "SELECT COUNT(*) FROM videos",
            "videos_in_scope": "SELECT COUNT(*) FROM videos WHERE transcript_status != 'out_of_scope_old'",
            "transcripts": "SELECT COUNT(*) FROM transcripts",
            "polished_transcripts": "SELECT COUNT(*) FROM generic_documents WHERE document_type='transcript_polished'",
            "claims": "SELECT COUNT(*) FROM claims",
            "local_files": "SELECT COUNT(*) FROM generic_items WHERE source_type='local_file'",
            "chunks": "SELECT COUNT(*) FROM chunks",
            "queued_asr_jobs": "SELECT COUNT(*) FROM jobs WHERE task_type='asr_transcript' AND status='queued'",
        }
        return {key: con.execute(sql).fetchone()[0] for key, sql in queries.items()}
    finally:
        con.close()


def health_data() -> dict:
    stat = DB.stat()
    integrity = "unknown"
    con = connect()
    try:
        integrity = con.execute("PRAGMA integrity_check").fetchone()[0]
    finally:
        con.close()
    return {
        "ok": integrity == "ok",
        "integrity": integrity,
        "db_path": str(DB),
        "db_size": stat.st_size,
        "db_mtime": datetime.fromtimestamp(stat.st_mtime).isoformat(timespec="seconds"),
        "status": status_data(),
    }


def meta_data() -> dict:
    con = connect()
    try:
        source_types = [row[0] for row in con.execute("SELECT DISTINCT source_type FROM generic_items ORDER BY source_type")]
        creators = [row_dict(row) for row in con.execute("SELECT creator_id, handle, url FROM creators ORDER BY handle")]
        statuses = [row[0] for row in con.execute("SELECT DISTINCT review_status FROM claims ORDER BY review_status")]
        return {
            "source_types": source_types,
            "creators": creators,
            "claim_review_statuses": statuses,
            "topics": TOPICS,
            "refresh": refresh_state(),
        }
    finally:
        con.close()


def combined_match(query: str, mention: str = "", search_mode: str = "any") -> str:
    query_match = fts_query(query, search_mode)
    mention_match = fts_query(mention, "all")
    if query_match and mention_match:
        return f"({query_match}) AND ({mention_match})"
    return query_match or mention_match


def facet_rows(con: sqlite3.Connection, from_sql: str, where_sql: str, params: list[object], group_sql: str) -> list[dict]:
    return [row_dict(row) for row in con.execute(f"SELECT {group_sql}, COUNT(DISTINCT i.item_id) AS count {from_sql} {where_sql} GROUP BY 1 ORDER BY count DESC, 1", params)]


def search_data(
    query: str,
    source_type: str = "",
    author: str = "",
    date_from: str = "",
    date_to: str = "",
    mention: str = "",
    search_mode: str = "any",
    sort: str = "relevance",
    limit: int = 24,
    offset: int = 0,
) -> dict:
    match = combined_match(query, mention, search_mode if search_mode in {"any", "all"} else "any")
    limit = max(1, min(limit, 50))
    offset = max(0, offset)
    filters = []
    params: list[object] = []
    if match:
        filters.append("chunks_fts MATCH ?")
        params.append(match)
    if source_type:
        filters.append("i.source_type = ?")
        params.append(source_type)
    if author:
        filters.append("(i.author = ? OR cr.handle = ?)")
        params.extend([author, author])
    if date_from:
        filters.append("substr(i.published_at, 1, 10) >= ?")
        params.append(date_from)
    if date_to:
        filters.append("substr(i.published_at, 1, 10) <= ?")
        params.append(date_to)

    if match:
        from_sql = """
        FROM chunks_fts f
        JOIN chunks c ON c.chunk_id = f.chunk_id
        JOIN generic_items i ON i.item_id = f.item_id
        LEFT JOIN creators cr ON cr.creator_id = i.author
        LEFT JOIN item_title_enrichment te ON te.item_id = i.item_id
        """
    else:
        from_sql = """
        FROM chunks c
        JOIN generic_items i ON i.item_id = c.item_id
        LEFT JOIN creators cr ON cr.creator_id = i.author
        LEFT JOIN item_title_enrichment te ON te.item_id = i.item_id
        """
    where_sql = "WHERE " + " AND ".join(filters) if filters else ""
    if sort == "date_asc":
        order_sql = "ORDER BY COALESCE(i.published_at, '') ASC, i.item_id ASC, c.chunk_index ASC"
    elif sort == "date_desc" or not match:
        order_sql = "ORDER BY COALESCE(i.published_at, '') DESC, i.item_id DESC, c.chunk_index ASC"
    elif sort == "source":
        order_sql = "ORDER BY i.source_type ASC, COALESCE(i.published_at, '') DESC"
    else:
        order_sql = "ORDER BY bm25(chunks_fts)"

    con = connect()
    try:
        rows = con.execute(
            f"""
            SELECT
              i.item_id,
              i.source_type,
              i.canonical_url,
              i.title,
              i.author,
              i.published_at,
              te.title_source,
              te.status AS title_status,
              te.source_title_raw,
              te.source_title_full,
              c.chunk_id,
              substr(c.text, 1, 520) AS snippet,
              cr.handle,
              cr.url AS creator_url,
              NULL AS avatar_url
            {from_sql}
            {where_sql}
            {order_sql}
            LIMIT ? OFFSET ?
            """,
            [*params, limit, offset],
        ).fetchall()
        total = con.execute(
            f"""
            SELECT COUNT(*)
            {from_sql}
            {where_sql}
            """,
            params,
        ).fetchone()[0]
        date_bounds = row_dict(
            con.execute(
                f"""
                SELECT MIN(substr(i.published_at, 1, 10)) AS min_date,
                       MAX(substr(i.published_at, 1, 10)) AS max_date
                {from_sql}
                {where_sql}
                """,
                params,
            ).fetchone()
        )
        facets = {
            "source_types": facet_rows(con, from_sql, where_sql, params, "i.source_type AS value"),
            "authors": facet_rows(con, from_sql, where_sql, params, "COALESCE(cr.handle, i.author, 'Base2026') AS value"),
            "years": facet_rows(con, from_sql, where_sql, params, "substr(i.published_at, 1, 4) AS value"),
            "date_bounds": date_bounds,
        }
        return {
            "query": query,
            "mention": mention,
            "filters": {
                "source_type": source_type,
                "author": author,
                "date_from": date_from,
                "date_to": date_to,
                "sort": sort,
            },
            "results": [row_dict(r) for r in rows],
            "total": total,
            "facets": facets,
        }
    finally:
        con.close()


def authors_data() -> list[dict]:
    con = connect()
    try:
        return [
            row_dict(row)
            for row in con.execute(
                """
                SELECT
                  cr.creator_id,
                  cr.handle,
                  cr.url,
                  COUNT(DISTINCT v.video_id) AS videos,
                  COUNT(DISTINCT t.transcript_id) AS transcripts,
                  COUNT(DISTINCT ce.claim_id) AS claims,
                  NULL AS avatar_url
                FROM creators cr
                LEFT JOIN videos v ON v.creator_id = cr.creator_id
                LEFT JOIN transcripts t ON t.video_id = v.video_id
                LEFT JOIN claim_evidence ce ON ce.video_id = v.video_id
                GROUP BY cr.creator_id
                ORDER BY cr.handle
                """
            )
        ]
    finally:
        con.close()


def claims_data(query: str = "", topic: str = "", status: str = "", limit: int = 30, offset: int = 0) -> dict:
    limit = max(1, min(limit, 100))
    offset = max(0, offset)
    con = connect()
    try:
        where = []
        params: list[object] = []
        if query:
            match = fts_query(query)
            where.append("c.claim_id IN (SELECT claim_id FROM claims_fts WHERE claims_fts MATCH ?)")
            params.append(match)
        if topic:
            where.append("c.topic LIKE ?")
            params.append(f"%{topic}%")
        if status:
            where.append("c.review_status = ?")
            params.append(status)
        clause = "WHERE " + " AND ".join(where) if where else ""
        rows = [
            row_dict(row)
            for row in con.execute(
                f"""
                SELECT c.claim_id, c.topic, c.claim_type, c.claim_text, c.suggested_action,
                       c.review_status, e.video_id, v.creator_id, v.url, v.published_at
                FROM claims c
                LEFT JOIN claim_evidence e ON e.claim_id = c.claim_id
                LEFT JOIN videos v ON v.video_id = e.video_id
                {clause}
                ORDER BY c.claim_id
                LIMIT ? OFFSET ?
                """,
                [*params, limit, offset],
            )
        ]
        total = con.execute(f"SELECT COUNT(*) FROM claims c {clause}", params).fetchone()[0]
        return {"results": rows, "total": total}
    finally:
        con.close()


def videos_data(creator_id: str = "", status: str = "", limit: int = 30, offset: int = 0) -> dict:
    limit = max(1, min(limit, 100))
    offset = max(0, offset)
    where = []
    params: list[object] = []
    if creator_id:
        where.append("v.creator_id = ?")
        params.append(creator_id)
    if status:
        where.append("v.transcript_status = ?")
        params.append(status)
    clause = "WHERE " + " AND ".join(where) if where else ""
    con = connect()
    try:
        rows = [
            row_dict(row)
            for row in con.execute(
                f"""
                SELECT v.video_id, v.creator_id, cr.handle, v.url, v.published_at,
                       v.title_or_description, v.transcript_status, v.caption_source,
                       COUNT(DISTINCT ce.claim_id) AS claims
                FROM videos v
                LEFT JOIN creators cr ON cr.creator_id = v.creator_id
                LEFT JOIN claim_evidence ce ON ce.video_id = v.video_id
                {clause}
                GROUP BY v.video_id
                ORDER BY COALESCE(v.published_at, '') DESC, v.video_id DESC
                LIMIT ? OFFSET ?
                """,
                [*params, limit, offset],
            )
        ]
        total = con.execute(f"SELECT COUNT(*) FROM videos v {clause}", params).fetchone()[0]
        return {"results": rows, "total": total}
    finally:
        con.close()


def topics_data() -> list[dict]:
    output = []
    for topic in TOPICS:
        try:
            total = search_data(topic["query"], limit=1)["total"]
        except sqlite3.Error:
            total = 0
        output.append({**topic, "count": total})
    return output


def item_data(item_id: str) -> dict | None:
    con = connect()
    try:
        item = con.execute(
            """
            SELECT i.*, cr.handle, cr.url AS creator_url, NULL AS avatar_url,
                   te.title_source, te.status AS title_status, te.source_title_raw,
                   te.source_title_full, te.source_payload_path, te.error AS title_error
            FROM generic_items i
            LEFT JOIN creators cr ON cr.creator_id = i.author
            LEFT JOIN item_title_enrichment te ON te.item_id = i.item_id
            WHERE i.item_id = ?
            """,
            (item_id,),
        ).fetchone()
        if not item:
            return None
        item_out = row_dict(item)
        item_out["title_is_truncated"] = title_is_truncated(item_out.get("title"))
        chunks = [
            row_dict(row)
            for row in con.execute(
                "SELECT chunk_id, chunk_index, text FROM chunks WHERE item_id = ? ORDER BY chunk_index LIMIT 50",
                (item_id,),
            )
        ]
        documents = []
        for row in con.execute(
            """
            SELECT document_id, document_type, clean_path, language
            FROM generic_documents
            WHERE item_id = ?
            ORDER BY CASE document_type WHEN 'transcript_polished' THEN 0 WHEN 'transcript_clean' THEN 1 ELSE 2 END
            LIMIT 5
            """,
            (item_id,),
        ):
            doc = row_dict(row)
            doc["text"] = read_kb_text(doc.get("clean_path"))
            documents.append(doc)
        video_id = item_id.removeprefix("tiktok-video-") if item_id.startswith("tiktok-video-") else ""
        claims = []
        if video_id:
            claims = [
                row_dict(row)
                for row in con.execute(
                    """
                    SELECT c.claim_id, c.topic, c.claim_text, c.suggested_action, c.review_status
                    FROM claim_evidence e
                    JOIN claims c ON c.claim_id = e.claim_id
                    WHERE e.video_id = ?
                    ORDER BY c.claim_id
                    LIMIT 100
                    """,
                    (video_id,),
                )
            ]
        return {"item": item_out, "documents": documents, "chunks": chunks, "claims": claims}
    finally:
        con.close()


def refresh_state() -> dict:
    state = dict(REFRESH_STATE)
    if REFRESH_STATE_PATH.exists():
        try:
            state["runner"] = json.loads(REFRESH_STATE_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            state["runner"] = {"status": "invalid_state_file"}
    return state


def run_refresh() -> None:
    REFRESH_STATE.update(
        {"running": True, "started_at": datetime.now().isoformat(timespec="seconds"), "finished_at": None, "ok": None, "log": ""}
    )
    commands = [
        [
            "powershell",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(ROOT / "scripts" / "tiktok-refresh-runner.ps1"),
            "-IgnoreTimeWindow",
        ]
    ]
    logs = []
    ok = True
    for cmd in commands:
        result = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True, timeout=60 * 60)
        logs.append("$ " + " ".join(cmd))
        logs.append((result.stdout or "").strip())
        if result.stderr:
            logs.append((result.stderr or "").strip())
        if result.returncode != 0:
            ok = False
            break
    REFRESH_STATE.update(
        {
            "running": False,
            "finished_at": datetime.now().isoformat(timespec="seconds"),
            "ok": ok,
            "log": "\n".join(x for x in logs if x)[-6000:],
        }
    )


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        if parsed.path == "/":
            self.serve_file(STATIC / "index.html", "text/html; charset=utf-8")
        elif parsed.path == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
        elif parsed.path == "/api/status":
            json_response(self, status_data())
        elif parsed.path == "/api/health":
            json_response(self, health_data())
        elif parsed.path == "/api/meta":
            json_response(self, meta_data())
        elif parsed.path == "/api/search":
            json_response(
                self,
                search_data(
                    qs.get("q", [""])[0],
                    qs.get("source_type", [""])[0],
                    qs.get("author", [""])[0],
                    qs.get("date_from", [""])[0],
                    qs.get("date_to", [""])[0],
                    qs.get("mention", [""])[0],
                    qs.get("search_mode", ["any"])[0],
                    qs.get("sort", ["relevance"])[0],
                    int(qs.get("limit", ["24"])[0]),
                    int(qs.get("offset", ["0"])[0]),
                ),
            )
        elif parsed.path == "/api/claims":
            json_response(
                self,
                claims_data(
                    qs.get("q", [""])[0],
                    qs.get("topic", [""])[0],
                    qs.get("status", [""])[0],
                    int(qs.get("limit", ["30"])[0]),
                    int(qs.get("offset", ["0"])[0]),
                ),
            )
        elif parsed.path == "/api/videos":
            json_response(
                self,
                videos_data(
                    qs.get("creator_id", [""])[0],
                    qs.get("status", [""])[0],
                    int(qs.get("limit", ["30"])[0]),
                    int(qs.get("offset", ["0"])[0]),
                ),
            )
        elif parsed.path == "/api/authors":
            json_response(self, authors_data())
        elif parsed.path == "/api/topics":
            json_response(self, topics_data())
        elif parsed.path == "/api/item":
            data = item_data(qs.get("id", [""])[0])
            json_response(self, data if data else {"error": "not_found"}, 200 if data else 404)
        elif parsed.path == "/api/refresh":
            json_response(self, refresh_state())
        elif parsed.path == "/meili":
            self.serve_file(STATIC / "meili.html", "text/html; charset=utf-8")
        elif parsed.path.startswith("/static/"):
            path = STATIC / parsed.path.removeprefix("/static/")
            self.serve_file(path, static_content_type(path))
        else:
            json_response(self, {"error": "not_found"}, 404)

    def do_POST(self) -> None:
        if self.path != "/api/refresh":
            json_response(self, {"error": "not_found"}, 404)
            return
        if not REFRESH_STATE["running"]:
            threading.Thread(target=run_refresh, daemon=True).start()
        json_response(self, REFRESH_STATE)

    def serve_file(self, path: Path, content_type: str) -> None:
        if not path.exists():
            json_response(self, {"error": "not_found"}, 404)
            return
        body = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt: str, *args: object) -> None:
        return


def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", 8765), Handler)
    print("Base2026 web wiki: http://127.0.0.1:8765")
    server.serve_forever()


if __name__ == "__main__":
    main()
