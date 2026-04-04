param(
  [string]$PagesRepoPath
)

$sourceFile = Join-Path $PSScriptRoot "index.html"

$candidates = @(
  $PagesRepoPath,
  (Join-Path $env:USERPROFILE "ash3-e.github.io"),
  (Join-Path $env:USERPROFILE "Downloads\\ash3-e.github.io"),
  (Join-Path $env:USERPROFILE "Documents\\ash3-e.github.io")
) | Where-Object { $_ }

$resolvedRoot = $null

foreach ($candidate in $candidates) {
  if ((Test-Path $candidate) -and (Test-Path (Join-Path $candidate ".git"))) {
    $resolvedRoot = $candidate
    break
  }
}

if (-not $resolvedRoot) {
  throw "Could not find the ash3-e.github.io repo. Pass -PagesRepoPath with the local repo path."
}

$targetDir = Join-Path $resolvedRoot "apartments"
$targetFile = Join-Path $targetDir "index.html"

New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
Copy-Item -LiteralPath $sourceFile -Destination $targetFile -Force

Write-Host "Published apartment site to:" $targetFile
Write-Host "Next: commit and push the ash3-e.github.io repo so https://ash3-e.github.io/apartments/ updates."
