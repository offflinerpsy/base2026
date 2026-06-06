param(
  [int]$BatchSize = 10,
  [int]$Limit = 0,
  [string]$BatchSet = "",
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$TikTokRoot = Join-Path $Root "12_knowledge-base\sources\tiktok"
$VideosCsv = Join-Path $TikTokRoot "videos.csv"
$CleanDir = Join-Path $TikTokRoot "transcripts\clean"
$PolishedDir = Join-Path $TikTokRoot "transcripts\polished"
$BatchRoot = Join-Path $TikTokRoot "transcript-polish-batches"

if (-not $BatchSet) { $BatchSet = "polish-" + (Get-Date -Format "yyyyMMdd-HHmmss") }
$BatchDir = Join-Path $BatchRoot $BatchSet
New-Item -ItemType Directory -Force -Path $BatchDir, $PolishedDir | Out-Null

$rows = Import-Csv $VideosCsv | Where-Object {
  $_.transcript_status -eq "transcribed" -and
  (Test-Path (Join-Path $CleanDir "$($_.video_id).txt")) -and
  ($Force -or -not (Test-Path (Join-Path $PolishedDir "$($_.video_id).txt")))
} | Sort-Object @{ Expression = "published_at"; Descending = $true }, @{ Expression = "video_id"; Descending = $true }

if ($Limit -gt 0) {
  $rows = @($rows | Select-Object -First $Limit)
}

$batchNo = 1
for ($i = 0; $i -lt $rows.Count; $i += $BatchSize) {
  $batch = @($rows[$i..([Math]::Min($i + $BatchSize - 1, $rows.Count - 1))])
  $batchName = "batch-{0:D3}.md" -f $batchNo
  $batchPath = Join-Path $BatchDir $batchName

  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add("# TikTok Faithful Transcript Polish Batch $batchName")
  $lines.Add("")
  $lines.Add("Goal: produce a faithful readable English transcript from raw TikTok captions.")
  $lines.Add("Primary principle: verbatim-first. The polished text must stay a cleaned transcript of what the speaker said, not your interpretation of it.")
  $lines.Add("")
  $lines.Add("Hard rules:")
  $lines.Add("- Keep original English. Do not translate.")
  $lines.Add("- Do not summarize.")
  $lines.Add("- Do not add facts, examples, explanations, transitions, headings, speaker labels, or timestamps.")
  $lines.Add("- Do not replace words with synonyms. Do not paraphrase. Do not compress meaning.")
  $lines.Add("- Do not fill missing words, clipped endings, or unclear phrases from context.")
  $lines.Add("- Do not improve the argument. Do not make the speaker sound smarter or more polished than they were.")
  $lines.Add("- Preserve the speaker's actual wording and order as much as possible.")
  $lines.Add("- Keep informal spoken phrasing when it carries meaning.")
  $lines.Add("- Fix punctuation, capitalization, obvious caption spacing, and paragraph breaks only.")
  $lines.Add("- Add paragraph breaks by natural spoken idea/beat. Usually 1-4 sentences per paragraph.")
  $lines.Add("- Do not create article-style sections, headings, bullets, or summaries.")
  $lines.Add("- Paragraphing must not reorder, compress, or editorialize the transcript.")
  $lines.Add("- You may split run-on speech into sentences, but do not create new claims.")
  $lines.Add("- You may remove duplicated caption artifacts only when they are clearly duplicated text.")
  $lines.Add("- You may normalize obvious casing only: seo -> SEO, ai -> AI, chatgpt -> ChatGPT. Do not guess brand/entity names from unclear audio.")
  $lines.Add("- If unsure, keep the raw word.")
  $lines.Add("- If a word or phrase looks wrong but cannot be proven from the caption, keep it and note it in QA.")
  $lines.Add("- Output should read like a cleaned transcript, not an article, not a summary, not a rewrite.")
  $lines.Add("- Write one polished .txt file per video to transcripts/polished/<video_id>.txt.")
  $lines.Add("- Write one QA .json file per video to transcripts/polished-qa/<video_id>.json.")
  $lines.Add("- QA JSON status must be pass only if no new meaning was added and no uncertain wording remains.")
  $lines.Add("- Use status needs_review when raw captions contain unclear words, likely ASR errors, clipped sentences, or terms that need audio verification.")
  $lines.Add("- QA JSON shape: { ""video_id"": ""..."", ""status"": ""pass|needs_review|failed"", ""notes"": [""...""], ""raw_word_count"": 0, ""polished_word_count"": 0, ""paragraph_count"": 0, ""model_tier"": ""low_or_medium"", ""meaning_added"": false }")
  $lines.Add("")

  foreach ($row in $batch) {
    $textPath = Join-Path $CleanDir "$($row.video_id).txt"
    $text = (Get-Content -Raw -LiteralPath $textPath).Trim()
    $lines.Add("## Video $($row.video_id)")
    $lines.Add("")
    $lines.Add("- creator_id: $($row.creator_id)")
    $lines.Add("- url: $($row.url)")
    $lines.Add("- published_at: $($row.published_at)")
    $lines.Add("- output_txt: 12_knowledge-base/sources/tiktok/transcripts/polished/$($row.video_id).txt")
    $lines.Add("- output_qa: 12_knowledge-base/sources/tiktok/transcripts/polished-qa/$($row.video_id).json")
    $lines.Add("")
    $lines.Add('```text')
    $lines.Add($text)
    $lines.Add('```')
    $lines.Add("")
  }

  Set-Content -LiteralPath $batchPath -Value $lines -Encoding UTF8
  $batchNo++
}

[pscustomobject]@{
  pending_polish = $rows.Count
  batch_size = $BatchSize
  batches_created = $batchNo - 1
  batch_set = $BatchSet
  output_dir = $BatchDir
} | Format-List
