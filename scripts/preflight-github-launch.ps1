param(
  [switch]$SkipLicenseCheck,
  [switch]$SkipRemoteCheck,
  [switch]$SkipExportPolicy,
  [switch]$SkipLiveCheck
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

function Resolve-RequiredCommand {
  param([string[]]$Names)
  foreach ($Name in $Names) {
    $Command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($Command) {
      return $Command.Source
    }
  }
  throw "Missing required command: $($Names -join ' or ')"
}

$Python = Resolve-RequiredCommand @("python", "python3")
$Node = Resolve-RequiredCommand @("node")

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Command
  )
  Write-Output "== $Name"
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE."
  }
}

Invoke-Step "publication boundary audit" {
  & $Python (Join-Path $Root "scripts/audit-publication-boundary.py")
}

if (-not $SkipLicenseCheck) {
  Write-Output "== license"
  if (-not (Test-Path -LiteralPath ".\LICENSE")) {
    throw "LICENSE is missing. Choose a license and add LICENSE before GitHub launch. Use -SkipLicenseCheck only for interim audit runs."
  }
  $LicenseText = Get-Content -Path ".\LICENSE" -Raw
  if ($LicenseText.Trim().Length -lt 100) {
    throw "LICENSE exists but looks too small to be valid."
  }
  Write-Output "license-ok"
}

if (-not $SkipRemoteCheck) {
  Write-Output "== git remote"
  $remoteNames = @(git remote)
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to read git remotes."
  }
  if ($remoteNames -notcontains "origin") {
    throw "Git remote 'origin' is missing. Add the GitHub repository remote before launch, or use -SkipRemoteCheck only for interim audit runs."
  }
  $remoteUrl = git remote get-url origin
  if ($LASTEXITCODE -ne 0 -or -not $remoteUrl) {
    throw "Unable to read Git remote 'origin' URL."
  }
  if ($remoteUrl -notmatch 'github\.com[:/]') {
    throw "Git remote 'origin' does not look like a GitHub remote: $remoteUrl"
  }
  Write-Output "remote-ok origin=$remoteUrl"
}

Invoke-Step "python syntax" {
  & $Python -m py_compile `
    (Join-Path $Root "scripts/export-public-tiktok.py") `
    (Join-Path $Root "scripts/check-public-export-policy.py") `
    (Join-Path $Root "scripts/generate-public-pages.py") `
    (Join-Path $Root "scripts/meili-index-public.py") `
    (Join-Path $Root "scripts/audit-publication-boundary.py") `
    (Join-Path $Root "scripts/base2026-worker.py") `
    (Join-Path $Root "scripts/base2026-import-claim-candidates.py") `
    (Join-Path $Root "scripts/validate-github-metadata.py")
}

Invoke-Step "javascript syntax" {
  & $Node --check (Join-Path $Root "web/static/meili.js")
}

Invoke-Step "github metadata" {
  & $Python (Join-Path $Root "scripts/validate-github-metadata.py")
}

$errors = $null
[System.Management.Automation.PSParser]::Tokenize((Get-Content (Join-Path $Root "scripts/apply-license.ps1") -Raw), [ref]$errors) | Out-Null
if ($errors) {
  $errors | Format-List
  throw "apply-license.ps1 parse failed."
}

$errors = $null
[System.Management.Automation.PSParser]::Tokenize((Get-Content (Join-Path $Root "scripts/package-public-release.ps1") -Raw), [ref]$errors) | Out-Null
if ($errors) {
  $errors | Format-List
  throw "package-public-release.ps1 parse failed."
}

$errors = $null
[System.Management.Automation.PSParser]::Tokenize((Get-Content (Join-Path $Root "scripts/deploy-public-vps.ps1") -Raw), [ref]$errors) | Out-Null
if ($errors) {
  $errors | Format-List
  throw "deploy-public-vps.ps1 parse failed."
}

$errors = $null
[System.Management.Automation.PSParser]::Tokenize((Get-Content (Join-Path $Root "scripts/preflight-github-launch.ps1") -Raw), [ref]$errors) | Out-Null
if ($errors) {
  $errors | Format-List
  throw "preflight-github-launch.ps1 parse failed."
}

$errors = $null
[System.Management.Automation.PSParser]::Tokenize((Get-Content (Join-Path $Root "scripts/stage-public-files.ps1") -Raw), [ref]$errors) | Out-Null
if ($errors) {
  $errors | Format-List
  throw "stage-public-files.ps1 parse failed."
}
Write-Output "== powershell parse"
Write-Output "powershell-parse-ok"

if (-not $SkipExportPolicy) {
  Invoke-Step "public export policy" {
    & $Python (Join-Path $Root "scripts/check-public-export-policy.py") (Join-Path $Root "public-data/tiktok")
  }
}

if (-not $SkipLiveCheck) {
  Write-Output "== live search proxy"
  $body = '{"queries":[{"indexUid":"base2026_public_tiktok","q":"AI Overviews","limit":1,"facets":["topics"]}]}'
  $response = Invoke-WebRequest -Uri 'https://aggressorbulkit.online/knowledge-search/multi-search' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing -TimeoutSec 30
  $json = $response.Content | ConvertFrom-Json
  $hits = [int]$json.results[0].estimatedTotalHits
  if ($response.StatusCode -ne 200 -or $hits -lt 1) {
    throw "live search proxy check failed."
  }
  Write-Output "live-search-ok hits=$hits"

  Write-Output "== live public documents contract"
  $documents = Invoke-WebRequest -Uri 'https://aggressorbulkit.online/knowledge/static/documents.jsonl' -UseBasicParsing -TimeoutSec 30
  $documentText = if ($documents.Content -is [byte[]]) {
    [System.Text.Encoding]::UTF8.GetString($documents.Content)
  } else {
    [string]$documents.Content
  }
  $rows = @(($documentText -split '\r?\n') | Where-Object { $_.Trim().Length -gt 0 }).Count
  $claimLeaks = ([regex]::Matches($documentText, '"claims"\s*:')).Count
  $transcriptLeaks = ([regex]::Matches($documentText, '"transcript"\s*:\s*"(?!")')).Count
  if ($rows -lt 1 -or $claimLeaks -gt 0 -or $transcriptLeaks -gt 0) {
    throw "live documents contract failed: rows=$rows claimLeaks=$claimLeaks transcriptLeaks=$transcriptLeaks"
  }
  Write-Output "live-documents-ok rows=$rows claimLeaks=$claimLeaks transcriptLeaks=$transcriptLeaks"
}

Write-Output "preflight=ok"
