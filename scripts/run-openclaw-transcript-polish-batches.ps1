param(
  [string]$BatchSet,
  [int]$Start = 1,
  [int]$End = 1,
  [int]$TimeoutSeconds = 1800,
  [int]$MaxParallel = 2
)

$ErrorActionPreference = "Stop"

if (-not $BatchSet) { throw "BatchSet is required." }

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$ResultsDir = Join-Path $Root ".planning\agent-results"
New-Item -ItemType Directory -Force -Path $ResultsDir | Out-Null

$procs = @()

for ($i = $Start; $i -le $End; $i++) {
  while (@($procs | Where-Object { -not $_.HasExited }).Count -ge $MaxParallel) {
    Start-Sleep -Seconds 10
  }

  $batch = "batch-{0:D3}" -f $i
  $batchPath = "12_knowledge-base\sources\tiktok\transcript-polish-batches\$BatchSet\$batch.md"
  $logPath = Join-Path $ResultsDir "openclaw-transcript-polish-$BatchSet-$batch.txt"

  $message = @"
Project: <repo-root>

Task: faithful transcript polish for this batch:
$batchPath

Primary principle: verbatim-first. The polished text must stay a cleaned transcript of what the speaker said, not your interpretation of it.

Hard rules:
- Keep original English. Do not translate.
- Do not summarize.
- Do not add facts, examples, explanations, transitions, headings, timestamps, or speaker labels.
- Do not replace words with synonyms. Do not paraphrase. Do not compress meaning.
- Do not fill missing words, clipped endings, or unclear phrases from context.
- Do not improve the argument. Do not make the speaker sound smarter or more polished than they were.
- Preserve speaker wording and order as much as possible.
- Keep informal spoken phrasing when it carries meaning.
- Fix punctuation, capitalization, caption spacing, and paragraph breaks only.
- You may split run-on speech into sentences, but do not create new claims.
- You may remove duplicated caption artifacts only when they are clearly duplicated text.
- You may normalize obvious casing only: seo -> SEO, ai -> AI, chatgpt -> ChatGPT.
- Do not guess brand/entity names from unclear captions.
- If unsure, keep the raw word.
- If a word or phrase looks wrong but cannot be proven from the caption, keep it and note it in QA.
- Output should read like a cleaned transcript, not an article, not a summary, not a rewrite.
- For each video, write output_txt and output_qa exactly as listed in the batch.
- QA JSON must include: video_id, creator_id, url, status, notes, created_at.
- status must be pass or needs_review.
- status must be pass only if no new meaning was added and no uncertain wording remains.
- Use needs_review when raw captions contain unclear words, likely ASR errors, clipped sentences, or terms that need audio verification.
- Final answer: files written count and any needs_review video IDs.
"@

  $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes(@"
cd "$Root"
openclaw agent --agent main --session-id "base2026-transcript-polish-$BatchSet-$batch" --local --thinking medium --timeout $TimeoutSeconds --message @'
$message
'@ 2>&1 | Tee-Object -FilePath "$logPath"
"@))

  $procs += Start-Process -FilePath powershell.exe -WindowStyle Hidden -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", $encoded) -PassThru
}

$deadline = (Get-Date).AddSeconds($TimeoutSeconds + 120)
while ($procs | Where-Object { -not $_.HasExited }) {
  if ((Get-Date) -gt $deadline) {
    foreach ($p in ($procs | Where-Object { -not $_.HasExited })) {
      Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    }
    break
  }
  Start-Sleep -Seconds 10
}

for ($i = $Start; $i -le $End; $i++) {
  $batch = "batch-{0:D3}" -f $i
  [pscustomobject]@{
    batch = $batch
    log = Join-Path $ResultsDir "openclaw-transcript-polish-$BatchSet-$batch.txt"
  }
}
