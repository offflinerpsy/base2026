# KB Ingest Router

OpenClaw skill:

`kb-ingest-router`

Skill path:

`<openclaw-skills-dir>\kb-ingest-router\SKILL.md`

Use when the user sends:

- TikTok links/handles;
- Reddit threads/subreddits/topics;
- web articles/docs;
- YouTube links;
- pasted/manual research notes.

Normalize input into:

```text
source_type: tiktok | reddit | web | youtube | manual
input: url | handle | subreddit/topic | query | text
scope: last_year | latest_N | date_range | all
mode: inventory | ingest | extract_claims | review_pack
```

Default scope:

`last_year`

Canonical target:

`12_knowledge-base\`

Never use:

`11_dreamwood_offer\`

After ingest:

```powershell
python .\scripts\build-kb-sqlite.py
python .\scripts\kb-audit.py
```
