param(
  [Parameter(Mandatory = $true)]
  [string]$ReleaseName,
  [string]$SshHost = "geo",
  [string]$RemoteBase = "/var/www/base2026-knowledge",
  [string]$MeiliIndex = "base2026_public_tiktok",
  [string]$MeiliUrl = "http://127.0.0.1:7700",
  [string]$MeiliMasterKeyFile = "/var/www/base2026-knowledge/shared/.meili_master_key",
  [switch]$SkipPackage,
  [switch]$SkipReindex
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

function Assert-NativeSuccess {
  param([string]$Label)
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed with exit code $LASTEXITCODE."
  }
}

if ($ReleaseName -notmatch '^[A-Za-z0-9._-]+$') {
  throw "ReleaseName may contain only letters, numbers, dot, underscore, and dash."
}

if ($RemoteBase -notmatch '^/[-A-Za-z0-9._/]+$') {
  throw "RemoteBase must be an absolute POSIX path."
}

$SshOptions = @("-o", "StrictHostKeyChecking=accept-new")

if (-not $SkipPackage) {
  python3 ./scripts/validate-public-release-contract.py | Write-Output
  Assert-NativeSuccess "public-release-contract"
  $packageArgs = @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", "./scripts/package-public-release.ps1",
    "-ReleaseName", $ReleaseName,
    "-MeiliUrl", "/knowledge-search",
    "-MeiliIndex", $MeiliIndex
  )
  pwsh @packageArgs | Write-Output
  Assert-NativeSuccess "package-public-release"
}

$ZipPath = Join-Path $Root "output\releases\$ReleaseName.zip"
if (-not (Test-Path $ZipPath)) {
  throw "Release zip not found: $ZipPath"
}

$RemoteZip = "/tmp/$ReleaseName.zip"
scp @SshOptions $ZipPath "${SshHost}:$RemoteZip" | Write-Output
Assert-NativeSuccess "scp release upload"

$RemoteDeploy = @"
set -euo pipefail
release="$ReleaseName"
base="$RemoteBase"
zip_path="$RemoteZip"
test -d /var/www/alex-yarosh
mkdir -p "`$base/releases"
rm -rf "`$base/releases/`$release"
mkdir -p "`$base/releases/`$release"
unzip -q "`$zip_path" -d "`$base/releases/`$release"
test -f "`$base/releases/`$release/web/index.html"
test -f "`$base/releases/`$release/web/static/documents.jsonl"
test -f "`$base/releases/`$release/web/static/manifest.json"
test -f "`$base/releases/`$release/web/static/topic_signal_briefs.jsonl"
test -f "`$base/releases/`$release/web/static/base2026_analytics.json"
test -f "`$base/releases/`$release/web/static/analytics_summary.json"
test -f "`$base/releases/`$release/web/llms.txt"
test -f "`$base/releases/`$release/web/data-dictionary.json"
test -f "`$base/releases/`$release/web/api-index.json"
test -f "`$base/releases/`$release/web/topics/index.html"
test -f "`$base/releases/`$release/web/compare/index.html"
test -f "`$base/releases/`$release/web/analytics.html"
test -f "`$base/releases/`$release/web/api.html"
test -f "`$base/releases/`$release/web/roadmap.html"
test -f "`$base/releases/`$release/web/privacy.html"
test -f "`$base/releases/`$release/web/source-policy.html"
test -f "`$base/releases/`$release/web/support.html"
if test -f "`$base/releases/`$release/web/root-llms.txt"; then
  cp "`$base/releases/`$release/web/root-llms.txt" /var/www/alex-yarosh/llms.txt
fi
ln -sfnT "`$base/releases/`$release" "`$base/current"
nginx -t
systemctl reload nginx
readlink -f "`$base/current"
"@

$RemoteDeploy | ssh @SshOptions $SshHost "bash -s" | Write-Output
Assert-NativeSuccess "remote deploy"

if (-not $SkipReindex) {
  $RemoteReindex = @"
set -euo pipefail
base="$RemoteBase"
cd "`$base/current"
master_key="`$(python3 -c 'from pathlib import Path; import sys; sys.stdout.write(Path(sys.argv[1]).read_text().strip())' "$MeiliMasterKeyFile")"
python3 scripts/meili-index-public.py \
  --data public-data/tiktok/chunks.jsonl \
  --url "$MeiliUrl" \
  --index "$MeiliIndex" \
  --master-key "`$master_key"
"@
  $RemoteReindex | ssh @SshOptions $SshHost "bash -s" | Write-Output
  Assert-NativeSuccess "remote Meilisearch reindex"
}

$RemoteVerify = @"
set -euo pipefail
base="$RemoteBase"
test -d /var/www/alex-yarosh
test -L "`$base/current"
test -f "`$base/current/web/index.html"
test -f "`$base/current/web/static/documents.jsonl"
test -f "`$base/current/web/static/manifest.json"
test -f "`$base/current/web/static/topic_signal_briefs.jsonl"
test -f "`$base/current/web/static/base2026_analytics.json"
test -f "`$base/current/web/static/analytics_summary.json"
test -f "`$base/current/web/llms.txt"
test -f "`$base/current/web/data-dictionary.json"
test -f "`$base/current/web/api-index.json"
test -f "`$base/current/web/analytics.html"
test -f "`$base/current/web/api.html"
test -f "`$base/current/web/roadmap.html"
test -f "`$base/current/web/privacy.html"
test -f "`$base/current/web/source-policy.html"
test -f "`$base/current/web/support.html"
test -f /var/www/alex-yarosh/llms.txt
nginx -t >/dev/null
systemctl is-active nginx
readlink -f "`$base/current"
"@

$RemoteVerify | ssh @SshOptions $SshHost "bash -s" | Write-Output
Assert-NativeSuccess "remote verify"
Write-Output "deployed=$ReleaseName"
