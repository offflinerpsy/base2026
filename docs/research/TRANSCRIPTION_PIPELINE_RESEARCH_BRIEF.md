# Transcription Pipeline Research Brief

Last updated: 2026-06-07

## Goal

Find a production-viable way to turn TikTok and Instagram videos into faithful readable English transcripts without relying on Hermes.

Hermes is allowed only as a local prototype helper. It must not be treated as a production/GitHub dependency.

## Questions to answer

1. Can we reliably extract captions from TikTok and Instagram for public posts?
2. If captions are missing, what free/self-hosted ASR path is realistic?
3. Can the full pipeline run on a VPS, or should ingestion run locally and publish reviewed exports to VPS?
4. Which tools are reliable enough in practice, not just theoretically available?
5. What are the common failure modes: rate limits, login/session needs, blocked downloads, missing audio, bad captions, broken metadata, legal/platform risks?

## Candidates to research

- `yt-dlp` caption and media extraction for TikTok/Instagram.
- `gallery-dl`, `instaloader`, or similar Instagram extraction tools.
- `ffmpeg` audio extraction.
- `Whisper`, `faster-whisper`, `whisper.cpp`, and other self-hosted ASR options.
- Caption cleanup/punctuation tools that can run locally or through low-cost/free model paths.
- Existing open-source projects that already produce social-video transcripts.

## Required sources

Use current sources only where possible:

- official tool docs,
- GitHub issues/discussions,
- Reddit practical reports,
- maintainer comments,
- recent community posts.

Do not rely only on marketing pages.

## Output

Create `docs/research/TRANSCRIPTION_PIPELINE_OPTIONS.md`.

Include:

- shortlist table,
- TikTok path,
- Instagram path,
- VPS feasibility,
- local-worker feasibility,
- failure modes,
- operational cost,
- legal/platform risk notes,
- recommended MVP pipeline,
- recommended production pipeline,
- what to test next.

## Acceptance criteria

The recommendation must be specific enough that Codex can implement a proof-of-concept without guessing tool choices.
