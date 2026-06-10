param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("Apache-2.0", "MIT")]
  [string]$License,
  [string]$ProjectName = "Base2026",
  [string]$CopyrightHolder = "Alex Yarosh",
  [int]$Year = 2026
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

$LicenseUrls = @{
  "Apache-2.0" = "https://raw.githubusercontent.com/spdx/license-list-data/main/text/Apache-2.0.txt"
  "MIT" = "https://raw.githubusercontent.com/spdx/license-list-data/main/text/MIT.txt"
}

$LicenseText = (Invoke-WebRequest -Uri $LicenseUrls[$License] -UseBasicParsing -TimeoutSec 30).Content
if (-not $LicenseText -or $LicenseText.Trim().Length -lt 100) {
  throw "Downloaded license text looks invalid."
}

if ($License -eq "MIT") {
  $LicenseText = $LicenseText -replace '<year>', [string]$Year
  $LicenseText = $LicenseText -replace '<copyright holders>', $CopyrightHolder
}

if ($License -eq "Apache-2.0") {
  $Notice = @"

Project: $ProjectName
Copyright $Year $CopyrightHolder

This license covers repository code and documentation. It does not grant rights to third-party creator videos, platform captions, or source content referenced by the public demo.
"@
  $LicenseText = $LicenseText.TrimEnd() + $Notice
}

$LicenseText | Set-Content -Path ".\LICENSE" -Encoding UTF8

$Readme = Get-Content -Path ".\README.md" -Raw
$Readme = $Readme -replace 'License: pending maintainer decision\.', "License: $License."
if ($Readme -notmatch '## License') {
  $Readme = $Readme.TrimEnd() + @"

## License

Repository code and documentation are licensed under $License. Third-party creator videos, platform captions, and original source content are not relicensed by this repository.
"@
}
$Readme | Set-Content -Path ".\README.md" -Encoding UTF8

Write-Output "license=$License"
Write-Output "wrote=LICENSE"
Write-Output "updated=README.md"
