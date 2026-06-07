param(
  [string]$TaskName = "Hermes WebUI",
  [string]$PwshPath = "",
  [string]$LauncherPath = "",
  [string]$WorkingDirectory = "",
  [switch]$Start
)

$ErrorActionPreference = "Stop"

if (-not $PwshPath) {
  $PwshPath = if ($env:HERMES_PWSH_PATH) { $env:HERMES_PWSH_PATH } else { "C:\Program Files\PowerShell\7\pwsh.exe" }
}
if (-not $LauncherPath) {
  $LauncherPath = if ($env:HERMES_WEBUI_LAUNCHER) { $env:HERMES_WEBUI_LAUNCHER } else { Join-Path $env:LOCALAPPDATA "hermes\webui\run-webui-8787.ps1" }
}
if (-not $WorkingDirectory) {
  $WorkingDirectory = if ($env:HERMES_WEBUI_WORKDIR) { $env:HERMES_WEBUI_WORKDIR } else { Split-Path -Parent $LauncherPath }
}

if (-not (Test-Path $PwshPath)) { throw "PowerShell not found: $PwshPath" }
if (-not (Test-Path $LauncherPath)) { throw "Hermes WebUI launcher not found: $LauncherPath" }
New-Item -ItemType Directory -Force -Path $WorkingDirectory | Out-Null

$action = New-ScheduledTaskAction `
  -Execute $PwshPath `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$LauncherPath`"" `
  -WorkingDirectory $WorkingDirectory

$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
  Set-ScheduledTask -TaskName $TaskName -Action $action | Out-Null
} else {
  Register-ScheduledTask -TaskName $TaskName -Action $action -Principal $principal | Out-Null
}

if ($Start) {
  Start-ScheduledTask -TaskName $TaskName
  Start-Sleep -Seconds 8
}

$task = Get-ScheduledTask -TaskName $TaskName
$info = Get-ScheduledTaskInfo -TaskName $TaskName
$port = Test-NetConnection 127.0.0.1 -Port 8787 -WarningAction SilentlyContinue

[pscustomobject]@{
  task = $TaskName
  state = $task.State
  last_task_result = $info.LastTaskResult
  execute = $task.Actions.Execute
  arguments = $task.Actions.Arguments
  working_directory = $task.Actions.WorkingDirectory
  webui_port_8787 = $port.TcpTestSucceeded
} | Format-List
