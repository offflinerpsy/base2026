# Base2026 Web Wiki

Local web interface and API over `12_knowledge-base/indexes/kb.sqlite`.

Architecture:

`web/ARCHITECTURE.md`

## Run

```powershell
python .\web\server.py
```

Open:

`http://127.0.0.1:8765`

## API

- `GET /api/health`
- `GET /api/meta`
- `GET /api/status`
- `GET /api/search?q=AI+Overview&source_type=tiktok_video&limit=12&offset=0`
- `GET /api/authors`
- `GET /api/topics`
- `GET /api/item?id=tiktok-video-7636393546076949782`
- `GET /api/claims?q=Reddit&limit=20`
- `GET /api/videos?creator_id=tiktok-webhivedigital&limit=20`
- `POST /api/refresh`
- `GET /api/refresh`

## Refresh

Manual UI refresh calls:

```text
POST /api/refresh
```

Cron-ready runner:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\tiktok-refresh-runner.ps1
```

Safe runner test:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\tiktok-refresh-runner.ps1 -DryRun -IgnoreTimeWindow
```

Register Windows scheduled task:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\register-tiktok-refresh-task.ps1
```

## Notes

- Search is SQLite FTS5, not token-heavy AI search.
- Summaries are extractive snippets for now. LLM summaries should be generated later as cached fields, not per-result live calls.
- TikTok avatar URLs are not present in the current DB yet. UI has avatar slots and fallback initials.
- Refresh endpoint is local-only and runs existing TikTok inventory/transcript rebuild scripts.
- Faithful transcript polishing is handled by OpenClaw/subscription batch scripts, not OpenAI API.
