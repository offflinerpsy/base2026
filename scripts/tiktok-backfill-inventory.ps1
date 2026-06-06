param(
  [int]$PlaylistEnd = 1000,
  [string]$CutoffDate = "2025-05-24"
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$TikTokRoot = Join-Path $Root "12_knowledge-base\sources\tiktok"
$VideosCsv = Join-Path $TikTokRoot "videos.csv"

$creators = @(
  @{ Id = "tiktok-webhivedigital"; Url = "https://www.tiktok.com/@webhivedigital" },
  @{ Id = "tiktok-tjrobertson52"; Url = "https://www.tiktok.com/@tjrobertson52" },
  @{ Id = "tiktok-build-in-public"; Url = "https://www.tiktok.com/@build_in_public" }
)

$rows = New-Object System.Collections.Generic.List[object]
if (Test-Path $VideosCsv) {
  Import-Csv $VideosCsv | ForEach-Object { $rows.Add($_) }
}

$existing = @{}
foreach ($row in $rows) {
  if ($row.video_id) { $existing[$row.video_id] = $row }
}

$summary = New-Object System.Collections.Generic.List[object]
$today = Get-Date -Format "yyyy-MM-dd"
$cutoff = [datetime]::ParseExact($CutoffDate, "yyyy-MM-dd", $null)

foreach ($creator in $creators) {
  $lines = & yt-dlp --no-warnings --flat-playlist --playlist-end $PlaylistEnd --print "%(id)s`t%(upload_date)s`t%(webpage_url)s`t%(title)s" $creator.Url 2>$null
  $seen = 0
  $added = 0
  $updated = 0
  $old = 0

  foreach ($line in $lines) {
    if (-not $line) { continue }
    $parts = $line -split "`t", 4
    if ($parts.Count -lt 3) { continue }

    $id = $parts[0].Trim()
    $uploadDateRaw = $parts[1].Trim()
    $url = $parts[2].Trim()
    $title = if ($parts.Count -ge 4) { $parts[3].Trim() } else { "" }
    $publishedAt = ""
    $isOld = $false

    if ($uploadDateRaw -match '^\d{8}$') {
      $publishedDate = [datetime]::ParseExact($uploadDateRaw, "yyyyMMdd", $null)
      $publishedAt = $publishedDate.ToString("yyyy-MM-dd")
      $isOld = $publishedDate -lt $cutoff
    }

    if (-not $id) {
      $seen++
      continue
    }

    if ($existing.ContainsKey($id)) {
      $row = $existing[$id]
      if (-not $row.published_at -and $publishedAt) { $row.published_at = $publishedAt; $updated++ }
      if (-not $row.title_or_description -and $title) { $row.title_or_description = $title; $updated++ }
      if ($isOld -and $row.transcript_status -in @("queued", "pending", "")) {
        $row.transcript_status = "out_of_scope_old"
        $row.review_status = "out_of_scope_old"
        $row.notes = (($row.notes, "Excluded from active processing: older than $CutoffDate") | Where-Object { $_ }) -join "; "
        $old++
      }
      $seen++
      continue
    }

    $status = if ($isOld) { "out_of_scope_old" } else { "queued" }
    $reviewStatus = if ($isOld) { "out_of_scope_old" } else { "new" }
    $notes = if ($isOld) { "Backfill inventory via yt-dlp flat playlist; Excluded from active processing: older than $CutoffDate" } else { "Backfill inventory via yt-dlp flat playlist" }

    $rows.Add([pscustomobject]@{
      video_id = $id
      creator_id = $creator.Id
      platform = "tiktok"
      url = $url
      published_at = $publishedAt
      collected_at = $today
      title_or_description = $title
      hashtags = ""
      duration_seconds = ""
      metrics_json = ""
      transcript_status = $status
      caption_source = ""
      evidence_path = ""
      review_status = $reviewStatus
      notes = $notes
    })
    $existing[$id] = $true
    $seen++
    $added++
    if ($isOld) { $old++ }
  }

  $summary.Add([pscustomobject]@{
    creator = $creator.Id
    discovered = $lines.Count
    added = $added
    updated = $updated
    out_of_scope_old = $old
    total_in_csv = ($rows | Where-Object { $_.creator_id -eq $creator.Id }).Count
  })
}

$rows | Export-Csv $VideosCsv -NoTypeInformation -Encoding UTF8
$summary | Format-Table -AutoSize
