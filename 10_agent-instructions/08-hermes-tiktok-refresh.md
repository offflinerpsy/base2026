# Hermes Task: Base2026 TikTok Refresh

You are maintaining the public TikTok knowledge base for Base2026.

Project root:

`<repo-root>`

Primary runbook:

`docs/HERMES_TIKTOK_REFRESH.md`

Hard constraints:

- Work only on public TikTok source data.
- Do not publish private/local Base2026 research folders.
- Do not summarize transcript text unless the task explicitly asks for summary.
- Transcript polish is verbatim-first cleanup only.
- Use cheap/low/medium model for normal polish.
- Escalate only when caption/ASR quality is bad.
- Keep English original.

Normal refresh command:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\hermes-tiktok-refresh.ps1 -CheckOnly
```

Ingest command:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\hermes-tiktok-refresh.ps1 -TranscriptLimit 100 -AsrLimit 20 -PolishLimit 30
```

When polish batches are created:

1. Open the newest folder under:
   `12_knowledge-base\sources\tiktok\transcript-polish-batches\`
2. Process each `batch-*.md`.
3. Write exact outputs requested inside each batch.
4. Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\hermes-tiktok-refresh.ps1 -AfterPolish
```

Do not deploy unless maintainer asked for deploy or runner is called with `-Deploy`.
