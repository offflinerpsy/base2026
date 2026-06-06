# AI Usage Guide

This file tells any AI agent how to use the Base2026 SEO/GEO/AEO knowledge base as a source of data.

Start here:

`10_agent-instructions/06-use-knowledge-base.md`

Working database:

`12_knowledge-base/indexes/kb.sqlite`

Health check:

```powershell
python .\scripts\kb-audit.py
```

Status:

```powershell
python .\scripts\kb-status.py
```

Search all chunks:

```powershell
python .\scripts\kb-search.py "your query" --type chunks --limit 20
```

Search only local files:

```powershell
python .\scripts\kb-search.py "your query" --type chunks --source-type local_file --limit 20
```

Search only TikTok evidence:

```powershell
python .\scripts\kb-search.py "your query" --type chunks --source-type tiktok_video --limit 20
```

Search extracted claims:

```powershell
python .\scripts\kb-search.py "your query" --type claims --limit 20
```

Rule: use database search first, then answer with cited evidence IDs, source paths, claim IDs, or video IDs.
