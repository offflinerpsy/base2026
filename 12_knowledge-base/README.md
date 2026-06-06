# Unified SEO / GEO / AEO Knowledge Base

This folder is the unified intake and evidence layer for multi-source research.

Canonical truth stays in human-readable Markdown source cards. SQLite/FTS/vector indexes are derived from these files and can be rebuilt.

## Source Flow

```text
source -> raw capture -> transcript/document -> source card -> extracted claim -> reviewed method -> SOP / factor map / strategy
```

## Source Channels

- `sources/tiktok/`
- `sources/youtube/`
- `sources/reddit/`
- `sources/docs/`
- `sources/experiments/`

## Rule

No transcript, caption, comment, or AI summary becomes methodology directly. It must pass through a source card and review state first.
