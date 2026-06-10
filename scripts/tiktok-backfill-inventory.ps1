param(
  [int]$PlaylistEnd = 1000,
  [string]$CutoffDate = "2025-05-24",
  [string]$CreatorsConfig = "",
  [switch]$ResolveCreatorsOnly
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$TikTokRoot = Join-Path $Root "12_knowledge-base\sources\tiktok"
$VideosCsv = Join-Path $TikTokRoot "videos.csv"

function Get-PropertyValue {
  param(
    [object]$Object,
    [string[]]$Names
  )
  foreach ($name in $Names) {
    if ($Object.PSObject.Properties.Name -contains $name) {
      return $Object.PSObject.Properties[$name].Value
    }
  }
  return ""
}

function ConvertTo-CreatorId {
  param([string]$Handle)
  $safe = ($Handle.Trim().TrimStart("@") -replace "[^A-Za-z0-9_-]+", "-").Trim("-").ToLowerInvariant()
  if (-not $safe) { throw "TikTok creator handle is required." }
  return "tiktok-$safe"
}

function Resolve-CreatorsConfig {
  param([string]$RequestedPath)

  if ($RequestedPath) {
    $path = if ([System.IO.Path]::IsPathRooted($RequestedPath)) { $RequestedPath } else { Join-Path $Root $RequestedPath }
    if (-not (Test-Path -LiteralPath $path)) { throw "Creators config not found: $path" }
    return (Resolve-Path -LiteralPath $path).Path
  }

  $candidates = @(
    (Join-Path $Root "config\tiktok-intake-queue.local.json"),
    (Join-Path $Root "config\tiktok-intake-queue.20260608.json"),
    (Join-Path $Root "config\creators.example.json")
  )
  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }
  throw "No creator config found. Create config/tiktok-intake-queue.local.json or pass -CreatorsConfig."
}

function Get-TikTokCreators {
  param([string]$ConfigPath)

  $config = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $entries = @()
  if ($config -is [array]) {
    $entries = @($config)
  }
  elseif ($config.PSObject.Properties.Name -contains "creators") {
    $entries = @($config.creators)
  }
  else {
    throw "Unsupported creators config shape: $ConfigPath"
  }

  $creators = New-Object System.Collections.Generic.List[object]
  foreach ($entry in $entries) {
    $platform = [string](Get-PropertyValue $entry @("platform"))
    if ($platform -and $platform.ToLowerInvariant() -ne "tiktok") { continue }
    if ($entry.PSObject.Properties.Name -contains "enabled" -and -not [bool]$entry.enabled) { continue }

    $handle = [string](Get-PropertyValue $entry @("handle", "creator_handle"))
    $url = [string](Get-PropertyValue $entry @("url", "profile_url", "creator_url"))
    if (-not $handle -and $url -match "tiktok\.com/@([^/?#]+)") {
      $handle = $Matches[1]
    }
    if (-not $url -and $handle) {
      $url = "https://www.tiktok.com/@$($handle.Trim().TrimStart('@'))"
    }
    if (-not $url) { throw "TikTok creator URL is required in $ConfigPath." }

    $id = [string](Get-PropertyValue $entry @("id", "creator_id"))
    if (-not $id) {
      $id = ConvertTo-CreatorId $handle
    }

    $creators.Add([pscustomobject]@{
      Id = $id
      Url = $url
    })
  }

  if ($creators.Count -eq 0) { throw "No enabled TikTok creators found in $ConfigPath." }
  return @($creators.ToArray())
}

$CreatorConfigPath = Resolve-CreatorsConfig $CreatorsConfig
$creators = Get-TikTokCreators $CreatorConfigPath
if ($ResolveCreatorsOnly) {
  [pscustomobject]@{
    config = $CreatorConfigPath
    count = $creators.Count
    creators = $creators
  } | ConvertTo-Json -Depth 5
  exit 0
}
Write-Host "Creator config: $CreatorConfigPath"

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
