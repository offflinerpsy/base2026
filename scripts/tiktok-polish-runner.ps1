param(
  [int]$Limit = 50,
  [int]$BatchSize = 10,
  [switch]$Force,
  [switch]$DryRun,
  [switch]$SkipOpenClaw,
  [int]$OpenClawTimeoutSeconds = 1800,
  [int]$MaxParallel = 2
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Planning = Join-Path $Root ".planning"
$Results = Join-Path $Planning "agent-results"
$Lock = Join-Path $Planning "tiktok-polish.lock"
$State = Join-Path $Planning "tiktok-polish-state.json"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Log = Join-Path $Results "tiktok-polish-$Stamp.log"
$BatchSet = "polish-$Stamp"

$Python = (Get-Command python3 -ErrorAction SilentlyContinue)
if (-not $Python) { $Python = (Get-Command python -ErrorAction SilentlyContinue) }
if (-not $Python) { throw "Python runtime not found. Install python3 or add python to PATH." }
$PythonExe = $Python.Source

New-Item -ItemType Directory -Force -Path $Planning, $Results | Out-Null

function Write-State {
  param([string]$Status, [string]$Message = "", [bool]$Ok = $false)
  [pscustomobject]@{
    status = $Status
    message = $Message
    ok = $Ok
    updated_at = (Get-Date).ToString("s")
    log = $Log
    batch_set = $BatchSet
  } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $State -Encoding UTF8
}

if (Test-Path $Lock) {
  Write-State -Status "locked" -Message "Existing polish lock found: $Lock"
  throw "Existing polish lock found: $Lock"
}

try {
  Set-Content -LiteralPath $Lock -Value $PID -Encoding ASCII
  Write-State -Status "running" -Message "Transcript polish started."

  & (Join-Path $Root "scripts\tiktok-create-polish-batches.ps1") -BatchSize $BatchSize -Limit $Limit -BatchSet $BatchSet -Force:$Force 2>&1 | Tee-Object -FilePath $Log
  if (-not $?) { throw "Batch creation failed." }

  $BatchDir = Join-Path $Root "12_knowledge-base\sources\tiktok\transcript-polish-batches\$BatchSet"
  $BatchFiles = @(Get-ChildItem -LiteralPath $BatchDir -File -Filter "batch-*.md" -ErrorAction SilentlyContinue | Select-Object -First $Limit)
  $BatchCount = $BatchFiles.Count

  if ($DryRun) {
    Write-State -Status "completed" -Message "Dry run created $BatchCount polish batch file(s)." -Ok $true
    exit 0
  }

  if ($BatchCount -gt 0 -and -not $SkipOpenClaw) {
    & (Join-Path $Root "scripts\run-openclaw-transcript-polish-batches.ps1") -BatchSet $BatchSet -Start 1 -End $BatchCount -TimeoutSeconds $OpenClawTimeoutSeconds -MaxParallel $MaxParallel 2>&1 | Tee-Object -FilePath $Log -Append
    if (-not $?) { throw "OpenClaw polish runner failed." }
  }

  & $PythonExe ".\scripts\tiktok-polish-status.py" --json 2>&1 | Tee-Object -FilePath $Log -Append
  & $PythonExe ".\scripts\build-kb-sqlite.py" 2>&1 | Tee-Object -FilePath $Log -Append
  & $PythonExe ".\scripts\kb-audit.py" 2>&1 | Tee-Object -FilePath $Log -Append

  Write-State -Status "completed" -Message "Transcript polish completed." -Ok $true
}
finally {
  Remove-Item -LiteralPath $Lock -Force -ErrorAction SilentlyContinue
}
