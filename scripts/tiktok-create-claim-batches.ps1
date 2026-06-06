param(
  [int]$BatchSize = 25,
  [string]$BatchSet = ""
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$TikTokRoot = Join-Path $Root "12_knowledge-base\sources\tiktok"
$VideosCsv = Join-Path $TikTokRoot "videos.csv"
$ClaimsDir = Join-Path $TikTokRoot "extracted-claims"
$CleanDir = Join-Path $TikTokRoot "transcripts\clean"
$BatchRoot = Join-Path $TikTokRoot "claim-batches"
$BatchDir = if ($BatchSet) { Join-Path $BatchRoot $BatchSet } else { $BatchRoot }

New-Item -ItemType Directory -Force -Path $BatchDir | Out-Null

$claimed = @{}
if (Test-Path $ClaimsDir) {
  Get-ChildItem $ClaimsDir -File -Filter *.md | ForEach-Object {
    $content = Get-Content -Raw -LiteralPath $_.FullName
    [regex]::Matches($content, '\|\s*[^|]+\|\s*(\d{16,20})\s*\|') | ForEach-Object {
      $claimed[$_.Groups[1].Value] = $true
    }
  }
}

$rows = Import-Csv $VideosCsv | Where-Object {
  $_.transcript_status -eq "transcribed" -and
  -not $claimed.ContainsKey($_.video_id) -and
  (Test-Path (Join-Path $CleanDir "$($_.video_id).txt"))
} | Sort-Object @{ Expression = "published_at"; Descending = $true }, @{ Expression = "video_id"; Descending = $true }

$batchNo = 1
for ($i = 0; $i -lt $rows.Count; $i += $BatchSize) {
  $batch = @($rows[$i..([Math]::Min($i + $BatchSize - 1, $rows.Count - 1))])
  $batchName = "batch-{0:D3}.md" -f $batchNo
  $batchPath = Join-Path $BatchDir $batchName

  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add(("# TikTok Claim Extraction Batch {0:D3}" -f $batchNo))
  $lines.Add("")
  $lines.Add("Status: ready")
  $lines.Add("Rule: extract only useful SEO/GEO/AEO/AI visibility claims. Keep all claims pending.")
  $lines.Add("")

  foreach ($row in $batch) {
    $textPath = Join-Path $CleanDir "$($row.video_id).txt"
    $text = (Get-Content -Raw -LiteralPath $textPath).Trim()
    $lines.Add("## Video $($row.video_id)")
    $lines.Add("")
    $lines.Add(("- Creator: {0}" -f $row.creator_id))
    $lines.Add("- URL: $($row.url)")
    $lines.Add("- Published: $($row.published_at)")
    $lines.Add("- Transcript source: $($row.caption_source)")
    $lines.Add(("- Evidence: transcripts/clean/{0}.txt" -f $row.video_id))
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
  unclaimed_transcripts = $rows.Count
  batch_size = $BatchSize
  batches_created = $batchNo - 1
  output_dir = $BatchDir
  batch_set = $BatchSet
} | Format-List
