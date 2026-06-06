param(
  [int]$PlaylistEnd = 1000,
  [string]$CutoffDate = "",
  [int]$TranscriptLimit = 100,
  [int]$AsrLimit = 20,
  [int]$PolishLimit = 30,
  [int]$BatchSize = 8,
  [switch]$CheckOnly,
  [switch]$AfterPolish,
  [switch]$SkipAsr,
  [switch]$DryRun,
  [switch]$Package,
  [switch]$Deploy
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

$Planning = Join-Path $Root ".planning"
$Results = Join-Path $Planning "agent-results"
$Lock = Join-Path $Planning "hermes-tiktok-refresh.lock"
$State = Join-Path $Planning "hermes-tiktok-refresh-state.json"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Log = Join-Path $Results "hermes-tiktok-refresh-$Stamp.log"
$BatchSet = "hermes-polish-$Stamp"

New-Item -ItemType Directory -Force -Path $Planning, $Results | Out-Null

if (-not $CutoffDate) {
  $CutoffDate = (Get-Date).AddDays(-365).ToString("yyyy-MM-dd")
}

function Write-State {
  param(
    [string]$Status,
    [string]$Stage,
    [string]$Message = "",
    [bool]$Ok = $false
  )
  [pscustomobject]@{
    status = $Status
    stage = $Stage
    message = $Message
    ok = $Ok
    updated_at = (Get-Date).ToString("s")
    log = $Log
    batch_set = $BatchSet
    cutoff_date = $CutoffDate
  } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $State -Encoding UTF8
}

function Run-Step {
  param([string]$Stage, [scriptblock]$Command)
  Write-State -Status "running" -Stage $Stage
  "[$((Get-Date).ToString('s'))] $Stage" | Tee-Object -FilePath $Log -Append | Out-Null
  & $Command 2>&1 | Tee-Object -FilePath $Log -Append
  if (-not $?) { throw "Stage failed: $Stage" }
}

function Get-PendingSummary {
  $TikTokRoot = Join-Path $Root "12_knowledge-base\sources\tiktok"
  $VideosCsv = Join-Path $TikTokRoot "videos.csv"
  $CleanDir = Join-Path $TikTokRoot "transcripts\clean"
  $PolishedDir = Join-Path $TikTokRoot "transcripts\polished"
  $rows = @(Import-Csv $VideosCsv)
  $active = @($rows | Where-Object { $_.transcript_status -ne "out_of_scope_old" })
  $queued = @($active | Where-Object { $_.transcript_status -in @("queued", "pending", "") })
  $needsAsr = @($active | Where-Object { $_.transcript_status -eq "needs_asr" })
  $transcribed = @($active | Where-Object { $_.transcript_status -eq "transcribed" })
  $needsPolish = @($transcribed | Where-Object {
    (Test-Path (Join-Path $CleanDir "$($_.video_id).txt")) -and
    -not (Test-Path (Join-Path $PolishedDir "$($_.video_id).txt"))
  })
  [pscustomobject]@{
    total = $rows.Count
    active = $active.Count
    queued_transcript = $queued.Count
    needs_asr = $needsAsr.Count
    transcribed = $transcribed.Count
    needs_polish = $needsPolish.Count
  }
}

if (Test-Path $Lock) {
  Write-State -Status "locked" -Stage "lock" -Message "Existing refresh lock found: $Lock"
  throw "Existing refresh lock found: $Lock"
}

try {
  Set-Content -LiteralPath $Lock -Value $PID -Encoding ASCII
  Write-State -Status "running" -Stage "start" -Message "Hermes TikTok refresh started."

  Run-Step "inventory" {
    & (Join-Path $Root "scripts\tiktok-backfill-inventory.ps1") -PlaylistEnd $PlaylistEnd -CutoffDate $CutoffDate
  }

  $summary = Get-PendingSummary
  $summary | Format-List | Tee-Object -FilePath $Log -Append

  if ($CheckOnly -or $DryRun) {
    Write-State -Status "completed" -Stage "check" -Message "Check-only completed." -Ok $true
    exit 0
  }

  if (-not $AfterPolish) {
    Run-Step "captions" {
      & (Join-Path $Root "scripts\tiktok-process-transcripts.ps1") -Limit $TranscriptLimit
    }

    if (-not $SkipAsr) {
      Run-Step "asr" {
        & (Join-Path $Root "scripts\tiktok-process-transcripts.ps1") -Limit $AsrLimit -AsrFallback
      }
    }

    Run-Step "polish-batches" {
      & (Join-Path $Root "scripts\tiktok-create-polish-batches.ps1") -BatchSize $BatchSize -Limit $PolishLimit -BatchSet $BatchSet
    }

    $BatchDir = Join-Path $Root "12_knowledge-base\sources\tiktok\transcript-polish-batches\$BatchSet"
    $BatchCount = @(Get-ChildItem -LiteralPath $BatchDir -File -Filter "batch-*.md" -ErrorAction SilentlyContinue).Count
    if ($BatchCount -gt 0) {
      Write-State -Status "waiting_for_hermes" -Stage "polish" -Message "Hermes must process $BatchCount polish batch file(s): $BatchDir" -Ok $true
      "Hermes polish batch dir: $BatchDir" | Tee-Object -FilePath $Log -Append
      "After Hermes writes polished outputs, run this script with -AfterPolish." | Tee-Object -FilePath $Log -Append
      exit 0
    }
  }

  Run-Step "polish-status" {
    python (Join-Path $Root "scripts\tiktok-polish-status.py") --json
  }
  Run-Step "rebuild-sqlite" {
    python (Join-Path $Root "scripts\build-kb-sqlite.py")
  }
  Run-Step "audit" {
    python (Join-Path $Root "scripts\kb-audit.py")
  }
  Run-Step "export-public-tiktok" {
    python (Join-Path $Root "scripts\export-public-tiktok.py")
  }

  if ($Package -or $Deploy) {
    Run-Step "package-public-release" {
      powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\package-public-release.ps1") -ReleaseName "base2026-public-hermes-$Stamp"
    }
  }

  if ($Deploy) {
    throw "Deploy gate not automated in this runner yet. Use existing VPS deploy flow after reviewing audit/package."
  }

  Write-State -Status "completed" -Stage "done" -Message "Hermes TikTok refresh completed locally." -Ok $true
}
finally {
  Remove-Item -LiteralPath $Lock -ErrorAction SilentlyContinue
}

