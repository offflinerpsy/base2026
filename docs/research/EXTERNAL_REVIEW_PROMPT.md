# External Review Prompt

Last updated: 2026-06-07

Use this prompt when asking another ChatGPT/research chat to review Base2026.

```text
Act as a product architect, SEO/GEO strategist, copyright-risk reviewer, and full-stack engineer.

Project context:

Base2026 is an open-source local-first research tool for turning public short-form expert videos into attributed, searchable, auditable knowledge records.

Current implementation:

- Local Windows machine is the ingestion worker.
- VPS is only the stable serving layer.
- Social extraction is modular and experimental.
- TikTok is implemented first; Instagram is planned.
- Captions are preferred when available.
- If captions are missing, local audio ASR is used.
- ASR path uses faster-whisper locally.
- Local cleanup may use a local LLM, but paid LLMs are disabled by default.
- Codex is the command center for architecture/debugging/review, not the daily worker.
- Hermes is a private local helper only, not a production dependency.
- Search UI uses Meilisearch.
- Public code/docs are intended for GitHub.
- Private full transcripts, raw captions, media files, cookies, logs, and generated exports must not be committed.

Current architecture direction:

private/local layer:
- full raw captions
- full ASR transcripts
- clean transcripts
- QA notes

public layer:
- creator pages
- source records
- short attributed excerpts
- topic pages
- insight cards
- comparison of source-backed viewpoints
- original source links
- methodology page
- opt-out/correction page

Problem:

The project must avoid becoming a public transcript dump or SEO farm built from other creators' words. It needs to preserve attribution, provenance, creator trust, search usefulness, and low-token operation.

Please review:

1. Is this positioning strong enough for open source and public demo?
2. What should be public vs private?
3. How should attribution, opt-out, and source provenance work?
4. How can we implement topic/insight/stance comparison without live LLM calls on every search?
5. What should be indexed in Meilisearch?
6. What pages should be indexable by Google, and what should be noindex/private?
7. What are the highest product, SEO, legal/platform, and creator-trust risks?
8. What should the MVP launch include and exclude?
9. What changes would make this more useful for marketers and researchers?
10. What should be written in the GitHub README to avoid overclaiming?

Constraints:

- No paid LLM required for daily ingestion.
- No full third-party transcript dumps in GitHub.
- No cookies/secrets in repo or VPS.
- No claim should be shown publicly unless linked to a source record.
- Prefer cached offline analysis over live AI answers.
- Keep recommendations practical and implementation-oriented.

Output:

1. short verdict
2. biggest risks
3. recommended public/private boundary
4. recommended data schema additions
5. recommended UI/page model
6. recommended SEO/indexing policy
7. 14-day MVP validation plan
8. exact next engineering tasks
```
