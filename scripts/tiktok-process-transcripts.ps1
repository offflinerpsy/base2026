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
$RawOutputTemplate = ($RawDir -replace '\\', '/') + "/%(uploader_id)s/%(id)s.%(ext)s"
$AudioOutputTemplate = ($AudioDir -replace '\\', '/') + "/%(id)s.%(ext)s"
$WorkerPython = Join-Path $Root ".venv\bin\python"
if (-not (Test-Path -LiteralPath $WorkerPython)) {
  $PythonCommand = Get-Command python3 -ErrorAction SilentlyContinue
  if (-not $PythonCommand) { $PythonCommand = Get-Command python -ErrorAction SilentlyContinue }
  if (-not $PythonCommand) { throw "python3 or python is required for the local ASR worker." }
  $WorkerPython = $PythonCommand.Source
}
$WorkerScript = Join-Path $Root "scripts\base2026-worker.py"

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

  & yt-dlp --quiet --no-warnings --skip-download --write-subs --write-auto-subs --sub-langs "en.*,eng.*" --sub-format vtt --output $RawOutputTemplate $url 2>$null
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
    & yt-dlp --quiet --no-warnings -f "h264_540p_362138-0/h264_540p_362138-1/h264_480p_698822-0/h264_480p_698822-1/download/best[ext=mp4]/best" -x --audio-format mp3 --audio-quality 5 --output $AudioOutputTemplate $url 2>$null
    $media = Get-ChildItem $AudioDir -File -ErrorAction SilentlyContinue |
      Where-Object { $_.BaseName -eq $id -and $_.Extension.ToLowerInvariant() -in @(".mp3", ".mp4", ".m4a", ".webm", ".wav") } |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 1
    if ($media) {
      $workerJson = & $WorkerPython $WorkerScript transcribe $media.FullName --model small.en --language en --device cpu --compute-type int8 --vad-filter 2>$null
      $worker = $null
      try { $worker = $workerJson | ConvertFrom-Json } catch { $worker = $null }
      if ($worker -and $worker.ok -and $worker.output -and (Test-Path -LiteralPath $worker.output)) {
        $asrText = (Get-Content -LiteralPath $worker.output -Raw -Encoding UTF8).Trim()
        if ($asrText) {
          $txt = Join-Path $AsrDir "$id.txt"
          Set-Content -LiteralPath $txt -Value $asrText -Encoding UTF8
          Copy-Item $txt (Join-Path $CleanDir "$id.txt") -Force
          $metadataTarget = Join-Path $AsrDir "$id.asr.json"
          if ($worker.metadata_output -and (Test-Path -LiteralPath $worker.metadata_output)) {
            Copy-Item $worker.metadata_output $metadataTarget -Force
          }
          if ($worker.segments_output -and (Test-Path -LiteralPath $worker.segments_output)) {
            Copy-Item $worker.segments_output (Join-Path $AsrDir "$id.segments.json") -Force
          }
          $wordCount = [int]($worker.word_count)
          if ($wordCount -lt 12) {
            $row.transcript_status = "needs_source_review"
            $row.caption_source = "asr"
            $row.evidence_path = "transcripts\asr\$id.txt"
            $row.notes = (($row.notes, "ASR produced too little usable text; source review required") | Where-Object { $_ }) -join "; "
            $failed++
            continue
          }
          $row.transcript_status = "transcribed"
          $row.caption_source = "asr"
          $row.evidence_path = "transcripts\asr\$id.txt"
          $row.notes = (($row.notes, "Caption download failed; faster-whisper ASR completed") | Where-Object { $_ }) -join "; "
          $asrDone++
          $done++
          continue
        }
      }
      if ($worker -and $worker.output -and (Test-Path -LiteralPath $worker.output)) {
        Copy-Item $worker.output (Join-Path $AsrDir "$id.empty-asr.txt") -Force
      }
      $row.transcript_status = "needs_source_review"
      $row.caption_source = "asr"
      $row.evidence_path = ""
      $row.notes = (($row.notes, "ASR fallback produced no usable transcript; source review required") | Where-Object { $_ }) -join "; "
      $failed++
      continue
    } else {
      $row.transcript_status = "needs_source_review"
      $row.caption_source = ""
      $row.evidence_path = ""
      $row.notes = (($row.notes, "Caption download failed; audio fallback unavailable; source review required") | Where-Object { $_ }) -join "; "
      $failed++
      continue
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
