param(
  [int]$MaxDimension = 512,
  [int]$Quality = 82
)

$ErrorActionPreference = "Stop"
$workspace = Split-Path -Parent $PSScriptRoot
$sourceFiles = @(
  Join-Path $workspace "src/config/gameAssets.js"
  Join-Path $workspace "src/config/view2Assets.js"
  Join-Path $workspace "src/components/view2Symbols/index.jsx"
)
$sourceFiles += Get-ChildItem (Join-Path $workspace "src/components") -Recurse -Filter "Symbol*.jsx" | Select-Object -ExpandProperty FullName
$assetPattern = '"(/assets/img/[^"?]+\.(?:webp|png))(?:\?[^" ]*)?"'
$urls = foreach ($sourceFile in $sourceFiles) {
  $source = Get-Content -LiteralPath $sourceFile -Raw
  [regex]::Matches($source, $assetPattern) | ForEach-Object { $_.Groups[1].Value }
}
$targets = $urls |
  Where-Object { $_ -notmatch '/animations/' -and $_ -match '(?:view2-symbol|view2-cell|view1-cell-and-view2-symbol|view1-highlight-and-view2-symbol|cell-background|highlight-background)' } |
  Sort-Object -Unique |
  ForEach-Object { Join-Path (Join-Path $workspace "public") ($_ -replace '^/', '') } |
  Where-Object { Test-Path -LiteralPath $_ }

$results = foreach ($target in $targets) {
  $dimensions = (& magick identify -format "%w %h" $target).Trim().Split(' ')
  $width = [int]$dimensions[0]
  $height = [int]$dimensions[1]
  $before = (Get-Item -LiteralPath $target).Length
  if ($width -le $MaxDimension -and $height -le $MaxDimension) {
    [pscustomobject]@{ File = $target; Width = $width; Height = $height; Before = $before; After = $before; Changed = $false }
    continue
  }

  $temp = "$target.codex-optimized.webp"
  try {
    & magick $target -resize "${MaxDimension}x${MaxDimension}>" -quality $Quality -define webp:method=6 $temp
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $temp)) {
      throw "ImageMagick failed for $target"
    }
    $after = (Get-Item -LiteralPath $temp).Length
    if ($after -ge $before) {
      Remove-Item -LiteralPath $temp
      [pscustomobject]@{ File = $target; Width = $width; Height = $height; Before = $before; After = $before; Changed = $false }
      continue
    }
    Move-Item -LiteralPath $temp -Destination $target -Force
    $newDimensions = (& magick identify -format "%w %h" $target).Trim().Split(' ')
    [pscustomobject]@{ File = $target; Width = [int]$newDimensions[0]; Height = [int]$newDimensions[1]; Before = $before; After = $after; Changed = $true }
  } finally {
    if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp }
  }
}

$changed = @($results | Where-Object Changed)
[pscustomobject]@{
  FilesScanned = @($results).Count
  FilesChanged = $changed.Count
  BytesBefore = ($changed | Measure-Object Before -Sum).Sum
  BytesAfter = ($changed | Measure-Object After -Sum).Sum
  BytesSaved = (($changed | Measure-Object Before -Sum).Sum - ($changed | Measure-Object After -Sum).Sum)
}
$changed | Sort-Object File | Format-Table File, Width, Height, Before, After -AutoSize