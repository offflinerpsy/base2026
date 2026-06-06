param(
  [int]$Start = 3,
  [int]$End = 6,
  [int]$TimeoutSeconds = 1200,
  [string]$BatchSet = "",
  [string]$OutputStamp = "",
  [string]$ClaimIdPrefix = ""
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$ResultsDir = Join-Path $Root ".planning\agent-results"
$ClaimsDir = Join-Path $Root "12_knowledge-base\sources\tiktok\extracted-claims"
New-Item -ItemType Directory -Force -Path $ResultsDir, $ClaimsDir | Out-Null

if (-not $OutputStamp) { $OutputStamp = Get-Date -Format "yyyy-MM-dd" }
if (-not $ClaimIdPrefix) { $ClaimIdPrefix = "tiktok-b" }

$procs = @()

for ($i = $Start; $i -le $End; $i++) {
  $batch = "batch-{0:D3}" -f $i
  $batchPath = if ($BatchSet) { "12_knowledge-base\sources\tiktok\claim-batches\$BatchSet\$batch.md" } else { "12_knowledge-base\sources\tiktok\claim-batches\$batch.md" }
  $safeStamp = $OutputStamp -replace '[^0-9A-Za-z_-]', '-'
  $outPath = "12_knowledge-base\sources\tiktok\extracted-claims\$batch-claims-$safeStamp.md"
  $logPath = Join-Path $ResultsDir "openclaw-$batch-claims-$safeStamp.txt"
  $claimPrefix = if ($ClaimIdPrefix.EndsWith("-")) { "$ClaimIdPrefix$("{0:D3}" -f $i)" } else { "$ClaimIdPrefix$("{0:D3}" -f $i)" }

  $message = @"
Use skill `tiktok-kb-intake`.
Project: <repo-root>

Task: extract SEO/GEO/AEO/AI visibility claims from this batch file:
$batchPath

Write output to:
$outPath

Rules:
- Do not touch 11_dreamwood_offer.
- Extract only useful claims, methods, warnings, experiments, or contradictions.
- Do not summarize every video if it has no useful claim.
- Every claim must include video_id, creator_id, topic, extracted claim, suggested action, evidence path, review=pending.
- Claim IDs must use this pattern: $claimPrefix-claim-001, $claimPrefix-claim-002, etc.
- Risky/manipulative tactics must be marked as risk/avoid, not recommendations.
- Do not promote anything into methodology.
- Final answer: claims count and file path.
"@

  $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes(@"
cd "$Root"
openclaw agent --agent main --session-id "base2026-claim-$batch-$safeStamp" --local --thinking medium --timeout $TimeoutSeconds --message @'
$message
'@ 2>&1 | Tee-Object -FilePath "$logPath"
"@))

  $procs += Start-Process -FilePath powershell.exe -WindowStyle Hidden -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", $encoded) -PassThru
}

$deadline = (Get-Date).AddSeconds($TimeoutSeconds + 120)
while ($procs | Where-Object { -not $_.HasExited }) {
  if ((Get-Date) -gt $deadline) {
    foreach ($p in ($procs | Where-Object { -not $_.HasExited })) {
      Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    }
    break
  }
  Start-Sleep -Seconds 10
}

for ($i = $Start; $i -le $End; $i++) {
  $batch = "batch-{0:D3}" -f $i
  $safeStamp = $OutputStamp -replace '[^0-9A-Za-z_-]', '-'
  $out = Join-Path $ClaimsDir "$batch-claims-$safeStamp.md"
  [pscustomobject]@{
    batch = $batch
    output_exists = Test-Path $out
    output = $out
  }
}
