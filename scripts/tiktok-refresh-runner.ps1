param(
  [int]$PlaylistEnd = 1000,
  [int]$TranscriptLimit = 100,
  [int]$AsrLimit = 20,
  [int]$BatchSize = 25,
  [int]$OpenClawTimeoutSeconds = 1200,
  [switch]$SkipOpenClaw,
  [switch]$IgnoreTimeWindow,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Planning = Join-Path $Root ".planning"
$Results = Join-Path $Planning "agent-results"
$Lock = Join-Path $Planning "tiktok-refresh.lock"
$State = Join-Path $Planning "tiktok-refresh-state.json"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Log = Join-Path $Results "tiktok-refresh-$Stamp.log"
$BatchSet = "refresh-$Stamp"

New-Item -ItemType Directory -Force -Path $Planning, $Results | Out-Null

function Write-State {
  param([string]$Status, [string]$Stage, [string]$Message = "", [bool]$Ok = $false)
  [pscustomobject]@{
    status = $Status
    stage = $Stage
    message = $Message
    ok = $Ok
    started_at = $script:StartedAt
    updated_at = (Get-Date).ToString("s")
    log = $Log
    batch_set = $BatchSet
  } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $State -Encoding UTF8
}

function Run-Step {
  param([string]$Stage, [scriptblock]$Command)
  Write-State -Status "running" -Stage $Stage
  "[$((Get-Date).ToString('s'))] $Stage" | Tee-Object -FilePath $Log -Append | Out-Null
  & $Command 2>&1 | Tee-Object -FilePath $Log -Append
  if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    throw "Stage failed: $Stage"
  }
}

$script:StartedAt = (Get-Date).ToString("s")

if ((Test-Path $Lock)) {
  Write-State -Status "locked" -Stage "lock" -Message "Existing refresh lock found: $Lock"
  throw "Existing refresh lock found: $Lock"
}

try {
  Set-Content -LiteralPath $Lock -Value $PID -Encoding ASCII
  if ($DryRun) {
    Write-State -Status "completed" -Stage "dry-run" -Message "Dry run completed. Lock/state path verified." -Ok $true
    exit 0
  }

  $hour = (Get-Date).Hour
  if (-not $IgnoreTimeWindow -and ($hour -lt 3 -or $hour -ge 9)) {
    Write-State -Status "skipped" -Stage "time-window" -Message "Outside 03:00-09:00 Europe/Minsk window." -Ok $true
    exit 0
  }

  $CutoffDate = (Get-Date).AddDays(-365).ToString("yyyy-MM-dd")
  Run-Step "inventory" { & (Join-Path $Root "scripts\tiktok-backfill-inventory.ps1") -PlaylistEnd $PlaylistEnd -CutoffDate $CutoffDate }
  Run-Step "captions" { & (Join-Path $Root "scripts\tiktok-process-transcripts.ps1") -Limit $TranscriptLimit }
  Run-Step "asr" { & (Join-Path $Root "scripts\tiktok-process-transcripts.ps1") -Limit $AsrLimit -AsrFallback }
  Run-Step "batching" { & (Join-Path $Root "scripts\tiktok-create-claim-batches.ps1") -BatchSize $BatchSize -BatchSet $BatchSet }

  $BatchDir = Join-Path $Root "12_knowledge-base\sources\tiktok\claim-batches\$BatchSet"
  $BatchCount = @(Get-ChildItem -LiteralPath $BatchDir -File -Filter "batch-*.md" -ErrorAction SilentlyContinue).Count
  if ($BatchCount -gt 0 -and -not $SkipOpenClaw) {
    Run-Step "openclaw" {
      & (Join-Path $Root "scripts\run-openclaw-claim-batches.ps1") -Start 1 -End $BatchCount -TimeoutSeconds $OpenClawTimeoutSeconds -BatchSet $BatchSet -OutputStamp $Stamp -ClaimIdPrefix "tiktok-r$Stamp-b"
    }
  }

  Run-Step "rebuild" { python (Join-Path $Root "scripts\build-kb-sqlite.py") }
  Run-Step "analysis" { python (Join-Path $Root "scripts\generate-analysis-layer.py") }
  Run-Step "audit" { python (Join-Path $Root "scripts\kb-audit.py") }
  Run-Step "status" { python (Join-Path $Root "scripts\kb-status.py") }

  Write-State -Status "completed" -Stage "done" -Message "Refresh completed." -Ok $true
}
catch {
  Write-State -Status "failed" -Stage "error" -Message $_.Exception.Message
  throw
}
finally {
  Remove-Item -LiteralPath $Lock -Force -ErrorAction SilentlyContinue
}
