# Transcription Pipeline Options

Last updated: 2026-06-07

## Executive recommendation

There is no clean, free, stable, fully self-hosted production pipeline for arbitrary TikTok and Instagram creators.

The stable part is:

```text
media/audio -> ffmpeg -> ASR -> transcript JSONL -> VPS ingest/search
```

The unstable part is:

```text
discovering/downloading social videos and extracting native captions
```

Recommended Base2026 architecture:

- VPS stays clean: DB/search/UI/ingest API/backups.
- Local worker handles fragile/heavy work: creator polling, cookies, downloads, ffmpeg, ASR, transcript cleanup, JSONL upload.
- Hermes remains local prototype only, not a production or GitHub dependency.

## MVP pipeline

```text
Selected creator allowlist
  -> local discovery worker
  -> caption/subtitle probe first
  -> media download only if captions missing
  -> ffmpeg 16 kHz mono audio
  -> faster-whisper default ASR
  -> punctuation/casing/paragraph cleanup only
  -> token-diff guard
  -> reviewed JSONL upload
  -> VPS ingest API
  -> Meilisearch/public UI
```

## Longer-term production pipeline

Use official APIs where authorized or eligible, but keep local fallback:

- TikTok Research API if eligible.
- TikTok Display API only for authorized/self-connected creators.
- Instagram Graph/Instagram Login only for owned or authorized Business/Creator accounts.
- Local worker for selected public creator monitoring.
- Optional Supadata or similar external transcript API as benchmark/fallback, not sole dependency.
- Human review for high-value sources.

## Shortlist

| Option | Role | TikTok | Instagram | Captions | Audio fallback | VPS fit | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `yt-dlp` | media/caption extraction | medium, brittle | medium-low, brittle | sometimes | yes | not ideal | primary local extractor, not source of truth |
| `instaloader` | Instagram discovery/media | no | medium | post captions, not speech transcript | media only | not ideal | useful IG candidate, rate-limit/account risk |
| `gallery-dl` | alternate downloader | limited | medium-low | metadata/post captions | media only | not ideal | secondary fallback |
| `ffmpeg` | audio extraction | yes | yes | no | core | yes | mandatory |
| `faster-whisper` | ASR | after audio | after audio | no | yes | maybe weak on small VPS | default local ASR |
| `whisper.cpp` | lightweight ASR | after audio | after audio | no | yes | best weak CPU fallback | fallback/edge option |
| TikTok Research API | official TikTok data | strong if eligible | no | `voice_to_text` possible | no | yes | excellent but gated |
| Instagram Graph API | official IG data | no | authorized accounts only | post captions, not speech transcript | varies | yes | only for authorized accounts |
| Hosted ASR/API | ASR or transcript fallback | after media or vendor-dependent | after media or vendor-dependent | varies | yes | yes | benchmark/fallback, vendor risk |

## TikTok path

Preferred order:

1. Try official/authorized APIs when possible.
2. Use local `yt-dlp` for selected public URLs/creators.
3. Try metadata/subtitle capture:

```powershell
yt-dlp --skip-download --write-subs --write-auto-subs --list-subs <url>
yt-dlp --dump-json --skip-download <url>
```

4. If captions are missing, download media/audio locally.
5. Extract audio:

```powershell
ffmpeg -y -i input.mp4 -vn -ac 1 -ar 16000 -c:a pcm_s16le audio.wav
```

6. Transcribe with `faster-whisper` or `whisper.cpp`.
7. Store raw transcript, clean transcript, caption source, model, language, and failure flags.

Known TikTok risks:

- subtitles visible in the app may not be extractor-visible;
- `yt-dlp` TikTok support can regress;
- cookies/session/region may matter;
- noisy/music-heavy videos reduce ASR quality.

## Instagram path

Blunt reality: Instagram is harder.

Important distinction:

- Instagram post caption = text written under the Reel.
- speech transcript/auto-caption = spoken words.

Most tools can help with post captions and media metadata, not reliable speech transcripts.

Preferred order:

1. For owned/authorized creators, use official Meta/Instagram APIs where possible.
2. For selected public creators, run local worker with conservative rate limits.
3. Try `yt-dlp` with cookies for individual Reels.
4. Try `instaloader`/`gallery-dl` as alternate metadata/media paths.
5. Default to audio fallback for faithful spoken transcripts.
6. Keep cookies/session files local, never on VPS.

Known Instagram risks:

- unauthenticated scraping is unreliable;
- cookies expire;
- accounts can be flagged;
- datacenter IPs are risky;
- auto-captions are not reliably exposed.

## VPS vs local worker

Run on VPS:

- public UI;
- ingest API;
- database or JSONL document store;
- Meilisearch;
- backups;
- review/admin layer if needed.

Run locally:

- creator polling;
- cookies/session-backed downloads;
- `yt-dlp`, `instaloader`, `gallery-dl`;
- media/audio download;
- `ffmpeg`;
- ASR;
- transcript cleanup;
- JSONL upload.

Reason: small VPS should not run fragile scraping or heavy ASR. It should serve the product and accept clean reviewed data.

## Canonical JSONL schema

```json
{
  "id": "platform:post_id",
  "platform": "tiktok|instagram",
  "creator_handle": "",
  "creator_id": "",
  "source_url": "",
  "post_id": "",
  "posted_at": "",
  "discovered_at": "",
  "duration_sec": 0,
  "post_caption": "",
  "raw_transcript": "",
  "clean_transcript": "",
  "caption_source": "platform_voice_to_text|yt_dlp_subtitle|asr_local|asr_external|manual",
  "language": "en",
  "is_translation": false,
  "asr_model": "",
  "cleanup_method": "",
  "quality_flags": [],
  "failure_reason": "",
  "media_sha256": "",
  "ingested_at": ""
}
```

## Cleanup rules

Allowed:

- punctuation;
- casing;
- paragraph breaks;
- obvious spacing/timestamp cleanup.

Rejected:

- summaries;
- invented context;
- new claims;
- removed claims;
- rewritten names/numbers;
- silent translation labeled as transcript.

Guard:

- compare normalized word sequence before/after cleanup;
- reject if meaningful tokens are added/removed;
- keep raw transcript forever.

## Proof-of-concept tests

Test set:

- 10 TikToks with visible captions;
- 10 TikToks without visible captions;
- 10 Instagram Reels with visible app captions;
- 10 Instagram Reels without visible captions.

For each URL, record:

- metadata success;
- caption/subtitle success;
- media download success;
- audio extraction success;
- ASR engine/model;
- transcription time;
- raw transcript quality;
- cleanup guard pass/fail;
- manual quality score;
- failure reason.

Benchmark:

- `yt-dlp` caption probe;
- `yt-dlp` media download;
- `instaloader`/`gallery-dl` Instagram fallback;
- `faster-whisper small.en`;
- `faster-whisper medium.en`;
- `whisper.cpp`;
- one external service, if a free tier exists.

## Implementation checklist

1. Add platform-aware source model: TikTok/Instagram.
2. Add local worker CLI:
   - `creators:list`
   - `discover`
   - `probe`
   - `fetch`
   - `extract-audio`
   - `transcribe`
   - `clean`
   - `export-jsonl`
   - `upload`
3. Add connector modules:
   - TikTok via `yt-dlp`;
   - Instagram via `yt-dlp`;
   - Instagram via `instaloader`;
   - fallback via `gallery-dl`;
   - optional external transcript provider.
4. Add ASR engine abstraction:
   - default `faster-whisper`;
   - fallback `whisper.cpp`.
5. Add transcript provenance fields.
6. Add cleanup guard.
7. Add signed VPS ingest API.
8. Add Meilisearch fields:
   - filterable: `platform`, `creator_handle`, `posted_at`, `caption_source`, `language`, `quality_flags`;
   - searchable: `clean_transcript`, `raw_transcript`, `post_caption`, `creator_handle`, `source_url`.
9. Run 40-video PoC.
10. Decide whether local worker + VPS upload is enough for MVP.

## Source pointers from research

- `yt-dlp`: https://github.com/yt-dlp/yt-dlp
- `faster-whisper`: https://github.com/SYSTRAN/faster-whisper
- `whisper.cpp`: https://github.com/ggml-org/whisper.cpp
- `instaloader`: https://github.com/instaloader/instaloader
- `gallery-dl`: https://github.com/mikf/gallery-dl
- OpenAI Whisper: https://github.com/openai/whisper
- TikTok developers docs: https://developers.tiktok.com
- Meta Instagram platform docs: https://developers.facebook.com/docs/instagram-platform
- Supadata benchmark candidate: https://supadata.ai

## Final decision for Base2026

Do not seek a perfect universal downloader. Build a resilient ingestion system:

```text
local worker: source probes + downloads + ASR + JSONL
VPS: ingest API + DB + search + UI
```

Every transcript must carry provenance. Every extractor can fail. The public knowledge base should depend on clean structured exports, not on live scraping.
