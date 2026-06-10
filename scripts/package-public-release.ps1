param(
  [string]$ReleaseName = "",
  [string]$MeiliUrl = "/knowledge-search",
  [string]$MeiliIndex = "base2026_public_tiktok",
  [string]$MeiliKey = "",
  [switch]$IncludeFullTranscripts,
  [switch]$ExcerptOnly
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root
$CacheBust = "20260610-modalmeta2"

if (-not $ReleaseName) {
  $ReleaseName = "base2026-public-" + (Get-Date -Format "yyyyMMdd-HHmmss")
}

$ExportArgs = @("./scripts/export-public-tiktok.py", "--auto-promote-insights")
if ($IncludeFullTranscripts -and -not $ExcerptOnly) {
  $ExportArgs += "--include-full-transcripts"
}
python3 @ExportArgs | Write-Output
python3 ./scripts/check-public-export-policy.py ./public-data/tiktok | Write-Output
python3 ./scripts/generate-info-pages.py --source ./docs/public-pages --out ./web/static | Write-Output

$ReleaseRoot = Join-Path $Root "output\releases\$ReleaseName"
$WebRoot = Join-Path $ReleaseRoot "web"
$StaticRoot = Join-Path $WebRoot "static"
$ScriptsRoot = Join-Path $ReleaseRoot "scripts"
$DataRoot = Join-Path $ReleaseRoot "public-data\tiktok"

New-Item -ItemType Directory -Force -Path $StaticRoot, $ScriptsRoot, $DataRoot | Out-Null

$Html = Get-Content -Path ".\web\static\meili.html" -Raw
$Html = $Html -replace 'href="(?:\./|/)static/styles\.css\?v=[^"]+"', "href=`"./static/styles.css?v=$CacheBust`""
$Html = $Html -replace 'src="(?:\./|/)static/meili\.js\?v=[^"]+"', "src=`"./static/meili.js?v=$CacheBust`""
$Html = $Html -replace 'src="(?:\./|/)static/cookie-consent\.js\?v=[^"]+"', "src=`"./static/cookie-consent.js?v=$CacheBust`""
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
$ConfigPattern = '(?s)\s*<script>\s*window\.BASE2026_MEILI_URL\s*=.*?</script>'
$Html = [regex]::Replace($Html, $ConfigPattern, "`n$Config", 1)
$Html | Set-Content -Path (Join-Path $WebRoot "index.html") -Encoding UTF8

Copy-Item "./web/static/styles.css" (Join-Path $StaticRoot "styles.css") -Force
Copy-Item "./web/static/meili.js" (Join-Path $StaticRoot "meili.js") -Force
Copy-Item "./web/static/cookie-consent.js" (Join-Path $StaticRoot "cookie-consent.js") -Force
Copy-Item "./web/static/share-actions.js" (Join-Path $StaticRoot "share-actions.js") -Force
if (Test-Path "./web/static/roadmap.js") {
  Copy-Item "./web/static/roadmap.js" (Join-Path $StaticRoot "roadmap.js") -Force
}
if (Test-Path "./web/static/assets") {
  Copy-Item "./web/static/assets" (Join-Path $StaticRoot "assets") -Recurse -Force
}
foreach ($TestPageAsset in @("roadmap-dataviz-test.html", "roadmap-dataviz-test.css", "roadmap-dataviz-test.js")) {
  if (Test-Path "./web/static/$TestPageAsset") {
    Copy-Item "./web/static/$TestPageAsset" (Join-Path $WebRoot $TestPageAsset) -Force
  }
}
$DocPages = @(
  "methodology.html",
  "opt-out.html",
  "roadmap.html",
  "story.html",
  "privacy.html",
  "source-policy.html",
  "support.html",
  "site-structure.html"
)
foreach ($DocPage in $DocPages) {
  $DocHtml = Get-Content -Path "./web/static/$DocPage" -Raw
  $DocHtml = $DocHtml -replace 'href="(?:\./|/)static/styles\.css\?v=[^"]+"', "href=`"./static/styles.css?v=$CacheBust`""
  $DocHtml = $DocHtml -replace 'src="(?:\./|/)static/cookie-consent\.js\?v=[^"]+"', "src=`"./static/cookie-consent.js?v=$CacheBust`""
  $DocHtml | Set-Content -Path (Join-Path $WebRoot $DocPage) -Encoding UTF8
}
Copy-Item "./public-data/tiktok/documents.jsonl" (Join-Path $StaticRoot "documents.jsonl") -Force
Copy-Item "./scripts/meili-index-public.py" (Join-Path $ScriptsRoot "meili-index-public.py") -Force
Copy-Item "./public-data/tiktok/*" $DataRoot -Recurse -Force
python3 ./scripts/generate-public-pages.py --data ./public-data/tiktok --out $WebRoot | Write-Output
python3 ./scripts/generate-base2026-sitemap.py --web-root $WebRoot | Write-Output

$Manifest = Get-Content "./public-data/tiktok/manifest.json" -Raw
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

$ZipPath = Join-Path $Root "output\releases\$ReleaseName.zip"
$ZipScript = @'
import sys
import zipfile
from pathlib import Path

release_root = Path(sys.argv[1])
zip_path = Path(sys.argv[2])
if zip_path.exists():
    zip_path.unlink()

with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    for path in release_root.rglob("*"):
        if path.is_file():
            archive.write(path, path.relative_to(release_root).as_posix())
'@
$ZipScript | python3 - $ReleaseRoot $ZipPath

Write-Output "release=$ReleaseName"
Write-Output "path=$ReleaseRoot"
Write-Output "zip=$ZipPath"
