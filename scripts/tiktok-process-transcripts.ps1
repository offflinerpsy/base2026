param(
  [string]$CreatorId = "",
  [int]$Limit = 50,
  [switch]$AsrFallback
)

$ErrorActionPreference = "Continue"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$TikTokRoot = Join-Path $Root "12_knowledge-base\sources\tiktok"
$VideosCsv = Join-Path $TikTokRoot "videos.csv"
$RawDir = Join-Path $TikTokRoot "transcripts\raw"
$CleanDir = Join-Path $TikTokRoot "transcripts\clean"
$AudioDir = Join-Path $TikTokRoot "transcripts\audio-fallback"
$AsrDir = Join-Path $TikTokRoot "transcripts\asr"

New-Item -ItemType Directory -Force -Path $RawDir, $CleanDir, $AudioDir, $AsrDir | Out-Null

$rows = @(Import-Csv $VideosCsv)
$targetStatuses = if ($AsrFallback) { @("queued", "pending", "", "needs_asr") } else { @("queued", "pending", "") }
$targets = $rows | Where-Object {
  $_.transcript_status -in $targetStatuses -and
  ($CreatorId -eq "" -or $_.creator_id -eq $CreatorId)
} | Select-Object -First $Limit

$done = 0
$caption = 0
$needsAsr = 0
$asrDone = 0
$failed = 0

foreach ($row in $targets) {
  $id = $row.video_id
  $url = $row.url
  if (-not $id -or -not $url) { continue }

  & yt-dlp --quiet --no-warnings --skip-download --write-subs --write-auto-subs --sub-langs "en.*,eng.*" --sub-format vtt --output "$RawDir\%(uploader_id)s\%(id)s.%(ext)s" $url 2>$null
  $vtt = Get-ChildItem $RawDir -Recurse -File -Filter "$id*.vtt" -ErrorAction SilentlyContinue | Select-Object -First 1

  if ($vtt) {
    $lines = Get-Content -LiteralPath $vtt.FullName | Where-Object {
      $_ -and $_ -notmatch '^WEBVTT' -and $_ -notmatch '^Kind:' -and $_ -notmatch '^Language:' -and
      $_ -notmatch '^\d+$' -and $_ -notmatch '-->' -and $_ -notmatch '^NOTE'
    }
    $text = (($lines -join ' ') -replace '<[^>]+>', '' -replace '\s+', ' ').Trim()
    Set-Content -LiteralPath (Join-Path $CleanDir "$id.txt") -Value $text -Encoding UTF8
    $row.transcript_status = "transcribed"
    $row.caption_source = "caption"
    $row.evidence_path = $vtt.FullName.Replace($TikTokRoot + "\", "")
    $row.notes = (($row.notes, "Captions downloaded via yt-dlp") | Where-Object { $_ }) -join "; "
    $caption++
    $done++
    continue
  }

  if ($AsrFallback) {
    & yt-dlp --quiet --no-warnings -x --audio-format mp3 --audio-quality 5 --output "$AudioDir\%(id)s.%(ext)s" $url 2>$null
    $mp3 = Join-Path $AudioDir "$id.mp3"
    if (Test-Path $mp3) {
      & whisper $mp3 --model base --language English --output_format txt --output_dir $AsrDir 2>$null 1>$null
      $txt = Join-Path $AsrDir "$id.txt"
      if (Test-Path $txt) {
        Copy-Item $txt (Join-Path $CleanDir "$id.txt") -Force
        $row.transcript_status = "transcribed"
        $row.caption_source = "asr"
        $row.evidence_path = "transcripts\asr\$id.txt"
        $row.notes = (($row.notes, "Caption download failed; audio fallback ASR completed") | Where-Object { $_ }) -join "; "
        $asrDone++
        $done++
        continue
      }
    }
  }

  $row.transcript_status = "needs_asr"
  $row.caption_source = ""
  $row.notes = (($row.notes, "Caption download failed; ASR queued") | Where-Object { $_ }) -join "; "
  $needsAsr++
}

$rows | Export-Csv $VideosCsv -NoTypeInformation -Encoding UTF8

[pscustomobject]@{
  selected = $targets.Count
  transcribed = $done
  captions = $caption
  asr = $asrDone
  needs_asr = $needsAsr
  failed = $failed
} | Format-List
