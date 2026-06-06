param(
  [string]$ContainerName = "base2026-meilisearch",
  [int]$Port = 7700
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Data = Join-Path $Root "meili_data"
New-Item -ItemType Directory -Force -Path $Data | Out-Null

$existing = docker ps -a --filter "name=^/$ContainerName$" --format "{{.Names}}"
if ($existing -eq $ContainerName) {
  docker start $ContainerName | Out-Null
} else {
  docker run -d `
    --name $ContainerName `
    -p "${Port}:7700" `
    -v "${Data}:/meili_data" `
    getmeili/meilisearch:v1.13 `
    meilisearch --env development | Out-Null
}

Write-Output "meilisearch=http://127.0.0.1:$Port container=$ContainerName data=$Data"
