param(
  [string]$ReleaseName = "",
  [string]$MeiliUrl = "/knowledge-search",
  [string]$MeiliIndex = "base2026_public_tiktok",
  [string]$MeiliKey = ""
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

if (-not $ReleaseName) {
  $ReleaseName = "base2026-public-" + (Get-Date -Format "yyyyMMdd-HHmmss")
}

python .\scripts\export-public-tiktok.py | Write-Output

$ReleaseRoot = Join-Path $Root "output\releases\$ReleaseName"
$WebRoot = Join-Path $ReleaseRoot "web"
$StaticRoot = Join-Path $WebRoot "static"
$ScriptsRoot = Join-Path $ReleaseRoot "scripts"
$DataRoot = Join-Path $ReleaseRoot "public-data\tiktok"

New-Item -ItemType Directory -Force -Path $StaticRoot, $ScriptsRoot, $DataRoot | Out-Null

$Html = Get-Content -Path ".\web\static\meili.html" -Raw
$Html = $Html.Replace('href="/static/styles.css?v=20260606-drawer2"', 'href="./static/styles.css?v=20260606-drawer2"')
$Html = $Html.Replace('src="/static/meili.js?v=20260606-drawer2"', 'src="./static/meili.js?v=20260606-drawer2"')
$Html = $Html.Replace('href="/"', 'href="/"')
$ConfigLines = @(
  '    <script>',
  "      window.BASE2026_MEILI_URL = `"$MeiliUrl`";",
  "      window.BASE2026_MEILI_INDEX = `"$MeiliIndex`";"
)

if ($MeiliKey -ne "") {
  $ConfigLines += "      window.BASE2026_MEILI_KEY = `"$MeiliKey`";"
}

$ConfigLines += '    </script>'
$Config = $ConfigLines -join "`n"
$Html = $Html.Replace('    <script src="./static/meili.js?v=20260606-drawer2"></script>', "$Config`n    <script src=`"./static/meili.js?v=20260606-drawer2`"></script>")
$Html | Set-Content -Path (Join-Path $WebRoot "index.html") -Encoding UTF8

Copy-Item ".\web\static\styles.css" (Join-Path $StaticRoot "styles.css") -Force
Copy-Item ".\web\static\meili.js" (Join-Path $StaticRoot "meili.js") -Force
Copy-Item ".\public-data\tiktok\documents.jsonl" (Join-Path $StaticRoot "documents.jsonl") -Force
Copy-Item ".\scripts\meili-index-public.py" (Join-Path $ScriptsRoot "meili-index-public.py") -Force
Copy-Item ".\public-data\tiktok\*" $DataRoot -Recurse -Force

$Manifest = Get-Content ".\public-data\tiktok\manifest.json" -Raw
$ReleaseInfo = @"
Base2026 Public TikTok Release
Release: $ReleaseName
Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Meili URL: $MeiliUrl
Meili index: $MeiliIndex

Dataset manifest:
$Manifest

Server target:
/var/www/base2026-knowledge/releases/$ReleaseName

Public path:
/knowledge/
"@
$ReleaseInfo | Set-Content -Path (Join-Path $ReleaseRoot "RELEASE.txt") -Encoding UTF8

Compress-Archive -Path (Join-Path $ReleaseRoot "*") -DestinationPath (Join-Path $Root "output\releases\$ReleaseName.zip") -Force

Write-Output "release=$ReleaseName"
Write-Output "path=$ReleaseRoot"
Write-Output "zip=$(Join-Path $Root "output\releases\$ReleaseName.zip")"
