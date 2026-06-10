param(
  [string]$TaskName = "Base2026 Hermes TikTok Check",
  [string[]]$At = @("03:30", "15:30"),
  [int]$PlaylistEnd = 50
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Runner = Join-Path $Root "scripts\hermes-tiktok-refresh.ps1"
$Argument = "-NoProfile -ExecutionPolicy Bypass -File `"$Runner`" -CheckOnly -PlaylistEnd $PlaylistEnd"

$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $Argument
$Triggers = @($At | ForEach-Object { New-ScheduledTaskTrigger -Daily -At $_ })
$Settings = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 45) `
  -MultipleInstances IgnoreNew `
  -StartWhenAvailable

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $Action `
  -Trigger $Triggers `
  -Settings $Settings `
  -Description "Check Base2026 TikTok creators for new videos. Check-only: no LLM, no deploy." `
  -Force
