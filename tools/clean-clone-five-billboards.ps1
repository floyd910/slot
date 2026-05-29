Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$sourceDir = "C:\Users\user\Desktop\2"
$outDir = Join-Path (Get-Location) "output\edited_5_billboards"
$desktopOutDir = Join-Path $sourceDir "edited_5_billboards"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
New-Item -ItemType Directory -Force -Path $desktopOutDir | Out-Null

function New-JpegEncoderParams {
  param([long]$Quality = 96)
  $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality,
    $Quality
  )
  return $encoderParams
}

function Get-JpegCodec {
  return [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq "image/jpeg" } |
    Select-Object -First 1
}

function Get-PoleColor {
  param(
    [System.Drawing.Bitmap]$Source,
    [int]$X,
    [int]$Y,
    [int]$W,
    [int]$H
  )

  [long]$r = 0
  [long]$g = 0
  [long]$b = 0
  [long]$count = 0
  for ($yy = $Y; $yy -lt ($Y + $H); $yy += 1) {
    for ($xx = $X; $xx -lt ($X + $W); $xx += 1) {
      $c = $Source.GetPixel($xx, $yy)
      if ($c.R -lt 90 -and $c.G -lt 95 -and $c.B -lt 95) {
        $r += $c.R
        $g += $c.G
        $b += $c.B
        $count += 1
      }
    }
  }

  if ($count -eq 0) {
    return [System.Drawing.Color]::FromArgb(42, 45, 43)
  }

  return [System.Drawing.Color]::FromArgb(
    [int]($r / $count),
    [int]($g / $count),
    [int]($b / $count)
  )
}

function New-DarkPoleClone {
  param(
    [System.Drawing.Bitmap]$Source,
    [int]$X,
    [int]$Y,
    [int]$W,
    [int]$H
  )

  $clone = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($yy = 0; $yy -lt $H; $yy += 1) {
    for ($xx = 0; $xx -lt $W; $xx += 1) {
      $c = $Source.GetPixel($X + $xx, $Y + $yy)
      $max = [Math]::Max($c.R, [Math]::Max($c.G, $c.B))
      $min = [Math]::Min($c.R, [Math]::Min($c.G, $c.B))
      $isPole = ($c.R -lt 105 -and $c.G -lt 110 -and $c.B -lt 110 -and ($max - $min) -lt 55)
      if ($isPole) {
        $clone.SetPixel($xx, $yy, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
      } else {
        $clone.SetPixel($xx, $yy, [System.Drawing.Color]::FromArgb(0, $c.R, $c.G, $c.B))
      }
    }
  }
  return $clone
}

function Paste-BoardClone {
  param(
    [System.Drawing.Graphics]$G,
    [System.Drawing.Bitmap]$Source,
    [hashtable]$Spec,
    [hashtable]$Add
  )

  $scale = $Add.BoardW / $Spec.BoardW
  $boardH = $Spec.BoardH * $scale
  $poleX = $Add.BoardX - ($Spec.PoleOffset * $scale)
  $poleTop = $Add.BoardY - (($Spec.BoardY - $Spec.PoleSampleY) * $scale)
  $poleH = $Add.BaseY - $poleTop
  $poleW = [Math]::Max(3.0, $Spec.PoleSampleW * $scale)

  $poleClone = New-DarkPoleClone `
    -Source $Source `
    -X $Spec.PoleSampleX `
    -Y $Spec.PoleSampleY `
    -W $Spec.PoleSampleW `
    -H $Spec.PoleSampleH
  try {
    $poleRect = New-Object System.Drawing.RectangleF(($poleX - ($poleW / 2.0)), $poleTop, $poleW, $poleH)
    $G.DrawImage($poleClone, $poleRect)
  } finally {
    $poleClone.Dispose()
  }

  $srcRect = New-Object System.Drawing.Rectangle($Spec.BoardX, $Spec.BoardY, $Spec.BoardW, $Spec.BoardH)
  $dstRect = New-Object System.Drawing.RectangleF($Add.BoardX, $Add.BoardY, $Add.BoardW, $boardH)
  $G.DrawImage($Source, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
}

$edits = @(
  @{
    File = "707723308_1702441330899521_8496958170903481736_n.jpg"
    Board = $null
    Adds = @()
  },
  @{
    File = "705661427_1341023574611319_7093244544360361907_n.jpg"
    Board = @{ BoardX = 257; BoardY = 509; BoardW = 79; BoardH = 131; PoleSampleX = 239; PoleSampleY = 500; PoleSampleW = 12; PoleSampleH = 360; PoleOffset = 14; PoleW = 8 }
    Adds = @(
      @{ BoardX = 405; BoardY = 618; BoardW = 55; BaseY = 846 },
      @{ BoardX = 500; BoardY = 650; BoardW = 43; BaseY = 820 }
    )
  },
  @{
    File = "706316861_1748227466554067_324000721731286177_n.jpg"
    Board = @{ BoardX = 352; BoardY = 583; BoardW = 65; BoardH = 105; PoleSampleX = 335; PoleSampleY = 580; PoleSampleW = 10; PoleSampleH = 310; PoleOffset = 15; PoleW = 7 }
    Adds = @(
      @{ BoardX = 435; BoardY = 645; BoardW = 47; BaseY = 845 },
      @{ BoardX = 570; BoardY = 715; BoardW = 31; BaseY = 822 }
    )
  },
  @{
    File = "708260421_1725347021796759_6248814098445910411_n.jpg"
    Board = @{ BoardX = 284; BoardY = 461; BoardW = 85; BoardH = 170; PoleSampleX = 260; PoleSampleY = 455; PoleSampleW = 12; PoleSampleH = 455; PoleOffset = 20; PoleW = 8 }
    Adds = @(
      @{ BoardX = 350; BoardY = 618; BoardW = 55; BaseY = 892 },
      @{ BoardX = 500; BoardY = 724; BoardW = 26; BaseY = 845 },
      @{ BoardX = 560; BoardY = 745; BoardW = 20; BaseY = 825 }
    )
  },
  @{
    File = "708692714_2015339649191335_4269375656168143863_n.jpg"
    Board = @{ BoardX = 349; BoardY = 642; BoardW = 56; BoardH = 113; PoleSampleX = 336; PoleSampleY = 640; PoleSampleW = 10; PoleSampleH = 270; PoleOffset = 12; PoleW = 6 }
    Adds = @(
      @{ BoardX = 500; BoardY = 718; BoardW = 34; BaseY = 845 },
      @{ BoardX = 560; BoardY = 742; BoardW = 27; BaseY = 830 }
    )
  },
  @{
    File = "709078403_1723360858798101_3942352170385005625_n.jpg"
    Board = @{ BoardX = 326; BoardY = 625; BoardW = 56; BoardH = 111; PoleSampleX = 314; PoleSampleY = 620; PoleSampleW = 10; PoleSampleH = 280; PoleOffset = 11; PoleW = 6 }
    Adds = @(
      @{ BoardX = 500; BoardY = 718; BoardW = 33; BaseY = 845 },
      @{ BoardX = 548; BoardY = 740; BoardW = 27; BaseY = 830 }
    )
  }
)

$jpegCodec = Get-JpegCodec
$encoderParams = New-JpegEncoderParams -Quality 96

foreach ($edit in $edits) {
  $src = Join-Path $sourceDir $edit.File
  $dst = Join-Path $outDir $edit.File
  $desktopDst = Join-Path $desktopOutDir $edit.File

  $sourceImage = [System.Drawing.Bitmap]::FromFile($src)
  try {
    $bitmap = New-Object System.Drawing.Bitmap($sourceImage.Width, $sourceImage.Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    try {
      $g = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.DrawImage($sourceImage, 0, 0, $sourceImage.Width, $sourceImage.Height)

        if ($null -ne $edit.Board -and $edit.Adds.Count -gt 0) {
          $edit.Board.PoleColor = Get-PoleColor `
            -Source $sourceImage `
            -X $edit.Board.PoleSampleX `
            -Y $edit.Board.PoleSampleY `
            -W $edit.Board.PoleSampleW `
            -H $edit.Board.PoleSampleH

          foreach ($add in $edit.Adds) {
            Paste-BoardClone -G $g -Source $sourceImage -Spec $edit.Board -Add $add
          }
        }
      } finally {
        $g.Dispose()
      }

      $bitmap.Save($dst, $jpegCodec, $encoderParams)
      $bitmap.Save($desktopDst, $jpegCodec, $encoderParams)
    } finally {
      $bitmap.Dispose()
    }
  } finally {
    $sourceImage.Dispose()
  }
}

Write-Output $desktopOutDir
