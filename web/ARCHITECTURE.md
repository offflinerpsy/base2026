# Base2026 Wiki Architecture

## Goal

Make `12_knowledge-base/indexes/kb.sqlite` usable as a visual wiki and read-only API source for SEO/GEO/AEO work.

## Stack

- Python standard library HTTP server.
- SQLite FTS5.
- Plain HTML/CSS/JS.
- No npm, no external backend dependency.

Reason: local-first, easy for Codex/OpenClaw to operate, no install step, API remains replaceable later.

## Data Flow

```text
kb.sqlite
  -> web/server.py read-only API
  -> web/static/app.js
  -> browser UI
```

Refresh flow:

```text
UI POST /api/refresh
  -> scripts/tiktok-refresh-runner.ps1
  -> inventory/captions/asr/batches/openclaw/rebuild/audit
  -> .planning/tiktok-refresh-state.json
  -> UI GET /api/refresh
```

## API

- `GET /api/health`: integrity, DB path, DB mtime, counts.
- `GET /api/meta`: source types, creators, topics, claim statuses.
- `GET /api/status`: compact counts.
- `GET /api/search`: FTS chunk search. Params: `q`, `source_type`, `author`, `limit`, `offset`.
- `GET /api/authors`: TikTok creators with video/transcript/claim counts.
- `GET /api/topics`: rubric chips with search counts.
- `GET /api/item`: generic item detail with chunks and linked claims.
- `GET /api/claims`: claim list/search. Params: `q`, `topic`, `status`, `limit`, `offset`.
- `GET /api/videos`: TikTok video list. Params: `creator_id`, `status`, `limit`, `offset`.
- `GET /api/refresh`: refresh state.
- `POST /api/refresh`: start refresh runner.

## UI

Sections:

- Header + manual refresh button.
- Health metric cards.
- Global search.
- Source filter.
- Author filter.
- Rubric chips.
- Author sidebar.
- Search result cards.
- Detail dialog with full chunks and linked claims.

## Search Strategy

Current search is FTS5 keyword search over `chunks_fts`.

For TikTok, `transcripts/clean` remains immutable source text. If a faithful second-pass file exists in `transcripts/polished`, SQLite indexes that polished text for chunks/search. If no polished file exists, SQLite falls back to the raw clean caption.

No live LLM summary is generated in result lists. This avoids token waste and latency. Future summaries should be cached with:

```text
entity_id + source_hash + prompt_version + model
```

## Known Limitations

- TikTok avatar URLs are not in current DB. UI has avatar slots and initials fallback.
- Polished transcript generation is delegated to OpenClaw/subscription agents, not OpenAI API.
- Auth is not implemented. Server binds to `127.0.0.1` only.
- `POST /api/refresh` can launch long TikTok/OpenClaw work.
- Vector search is not implemented; FTS5 is the current source layer.

## Run

```powershell
python .\web\server.py
```

Open:

```text
http://127.0.0.1:8765
```

## Verify

```powershell
python .\scripts\kb-audit.py
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8765/api/health
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8765/api/search?q=AI%20Overview&source_type=tiktok_video&limit=2"
```
