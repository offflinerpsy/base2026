# Creator Admin Flow

Last updated: 2026-06-07

## Goal

Allow the project owner to add new TikTok or Instagram creators without editing pipeline internals.

The admin flow must work locally first. A web UI can be added later.

## Creator registry

Use a local registry file:

```text
config/creators.json
```

Example:

```json
[
  {
    "platform": "tiktok",
    "handle": "tjrobertson52",
    "url": "https://www.tiktok.com/@tjrobertson52",
    "enabled": true,
    "max_new_per_run": 20,
    "source_policy": "public_recent_posts",
    "notes": "SEO/GEO/AEO creator"
  },
  {
    "platform": "instagram",
    "handle": "example",
    "url": "https://www.instagram.com/example/",
    "enabled": true,
    "max_new_per_run": 10,
    "source_policy": "public_recent_posts",
    "notes": "Needs cookie-backed test"
  }
]
```

Do not commit private cookies, session files, or downloaded media.

## CLI target

Future local worker should expose:

```text
python scripts/base2026-worker.py creators:list
python scripts/base2026-worker.py probe <url> --dry-run
python scripts/base2026-worker.py fetch <url> --dry-run
python scripts/base2026-worker.py extract-audio <media-file> --dry-run
python scripts/base2026-worker.py transcribe <audio-file> --dry-run
python scripts/base2026-worker.py clean <transcript-file> --dry-run
python scripts/base2026-worker.py export-jsonl --dry-run
```

Creator add/disable commands are planned after the PoC skeleton proves the tool shape.

## Hermes operator path

Hermes may be used as a local operator only.

Example instruction:

```text
Use Base2026 project files. Add this creator to the local creator registry:
https://www.tiktok.com/@example

Do not deploy.
Do not use paid LLM.
Run dry-run discovery only.
Report post count, new candidate IDs, and failure reasons.
```

Hermes must follow:

- repo docs;
- local worker scripts;
- no production dependency;
- no paid LLM by default;
- no raw media in git.

## Web admin path later

Future UI can add:

- `POST /admin/creators`
- `GET /admin/creators`
- `POST /admin/creators/:id/check`
- `POST /admin/creators/:id/ingest`

But first implementation should stay local CLI. It is safer and easier to audit.

## Admin safety rules

Adding a creator should not automatically publish anything.

Required stages:

```text
add creator -> dry-run discovery -> ingest local -> QA -> JSONL spool -> publish/upload
```

Every creator has:

- platform;
- handle;
- URL;
- enabled flag;
- max new posts per run;
- source policy;
- status;
- last checked timestamp;
- last successful ingest run.

## GitHub/open-source note

Public GitHub can include:

- creator registry schema;
- example config;
- local worker CLI;
- ingest API docs;
- request for community extractor ideas.

Public GitHub must not include:

- real cookies;
- private sessions;
- downloaded video/audio;
- raw unreviewed captions;
- private creator notes;
- generated exports unless explicitly sampled.
