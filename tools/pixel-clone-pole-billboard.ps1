Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$sourceDir = "C:\Users\user\Desktop\2"
$outDir = Join-Path (Get-Location) "output\edited_5_billboards"
$desktopOutDir = Join-Path $sourceDir "edited_5_billboards"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
New-Item -ItemType Directory -Force -Path $desktopOutDir | Out-Null

function Get-JpegCodec {
  return [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq "image/jpeg" } |
    Select-Object -First 1
}

function New-JpegEncoderParams {
  param([long]$Quality = 96)
  $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality,
    $Quality
  )
  return $encoderParams
}

function New-PoleStripClone {
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
      $isPole = ($c.R -lt 120 -and $c.G -lt 125 -and $c.B -lt 125 -and ($max - $min) -lt 45)
      if ($isPole) {
        $clone.SetPixel($xx, $yy, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
      } else {
        $clone.SetPixel($xx, $yy, [System.Drawing.Color]::FromArgb(0, $c.R, $c.G, $c.B))
      }
    }
  }
  return $clone
}

function New-BoardClone {
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
      $isPanel = ($c.R -gt 215 -and $c.G -gt 215 -and $c.B -gt 210 -and ($max - $min) -lt 45)
      $isFrame = ($c.R -lt 125 -and $c.G -lt 125 -and $c.B -lt 125 -and ($max - $min) -lt 45)
      if ($isPanel -or $isFrame) {
        $clone.SetPixel($xx, $yy, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
      } else {
        $clone.SetPixel($xx, $yy, [System.Drawing.Color]::FromArgb(0, $c.R, $c.G, $c.B))
      }
    }
  }
  return $clone
}

function Paste-PoleBillboardClone {
  param(
    [System.Drawing.Graphics]$G,
    [System.Drawing.Bitmap]$Source,
    [hashtable]$Spec,
    [hashtable]$Add
  )

  $scale = $Add.BoardW / $Spec.BoardW

  $pole = New-PoleStripClone -Source $Source -X $Spec.PoleX -Y $Spec.PoleY -W $Spec.PoleW -H $Spec.PoleH
  try {
    $poleDestX = $Add.BoardX + (($Spec.PoleX - $Spec.BoardX) * $scale)
    $poleDestY = $Add.BaseY - ($Spec.PoleH * $scale)
    $poleDestW = $Spec.PoleW * $scale
    $poleDestH = $Spec.PoleH * $scale
    $poleDest = New-Object System.Drawing.RectangleF($poleDestX, $poleDestY, $poleDestW, $poleDestH)
    $G.DrawImage($pole, $poleDest)
  } finally {
    $pole.Dispose()
  }

  $board = New-BoardClone -Source $Source -X $Spec.BoardX -Y $Spec.BoardY -W $Spec.BoardW -H $Spec.BoardH
  try {
    $boardDestX = $Add.BoardX
    $boardDestY = ($Add.BaseY - ($Spec.PoleH * $scale)) + (($Spec.BoardY - $Spec.PoleY) * $scale)
    $boardDestH = $Spec.BoardH * $scale
    $boardDest = New-Object System.Drawing.RectangleF($boardDestX, $boardDestY, $Add.BoardW, $boardDestH)
    $G.DrawImage($board, $boardDest)
  } finally {
    $board.Dispose()
  }
}

$edits = @(
  @{
    File = "707723308_1702441330899521_8496958170903481736_n.jpg"
    Spec = $null
    Adds = @()
  },
  @{
    File = "705661427_1341023574611319_7093244544360361907_n.jpg"
    Spec = @{ BoardX = 681; BoardY = 685; BoardW = 36; BoardH = 51; PoleX = 671; PoleY = 620; PoleW = 13; PoleH = 235 }
    Adds = @(
      @{ BoardX = 420; BoardW = 50; BaseY = 858 },
      @{ BoardX = 555; BoardW = 38; BaseY = 826 }
    )
  },
  @{
    File = "706316861_1748227466554067_324000721731286177_n.jpg"
    Spec = @{ BoardX = 505; BoardY = 681; BoardW = 51; BoardH = 69; PoleX = 492; PoleY = 650; PoleW = 14; PoleH = 225 }
    Adds = @(
      @{ BoardX = 440; BoardW = 48; BaseY = 850 },
      @{ BoardX = 705; BoardW = 22; BaseY = 820 }
    )
  },
  @{
    File = "708260421_1725347021796759_6248814098445910411_n.jpg"
    Spec = @{ BoardX = 416; BoardY = 720; BoardW = 42; BoardH = 73; PoleX = 402; PoleY = 670; PoleW = 13; PoleH = 225 }
    Adds = @(
      @{ BoardX = 500; BoardW = 26; BaseY = 845 },
      @{ BoardX = 560; BoardW = 20; BaseY = 825 },
      @{ BoardX = 630; BoardW = 16; BaseY = 810 }
    )
  },
  @{
    File = "708692714_2015339649191335_4269375656168143863_n.jpg"
    Spec = @{ BoardX = 614; BoardY = 756; BoardW = 34; BoardH = 58; PoleX = 604; PoleY = 720; PoleW = 12; PoleH = 215 }
    Adds = @(
      @{ BoardX = 500; BoardW = 34; BaseY = 845 },
      @{ BoardX = 560; BoardW = 27; BaseY = 830 }
    )
  },
  @{
    File = "709078403_1723360858798101_3942352170385005625_n.jpg"
    Spec = @{ BoardX = 589; BoardY = 747; BoardW = 32; BoardH = 54; PoleX = 580; PoleY = 720; PoleW = 12; PoleH = 215 }
    Adds = @(
      @{ BoardX = 500; BoardW = 33; BaseY = 845 },
      @{ BoardX = 548; BoardW = 27; BaseY = 830 }
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

        if ($null -ne $edit.Spec -and $edit.Adds.Count -gt 0) {
          foreach ($add in $edit.Adds) {
            Paste-PoleBillboardClone -G $g -Source $sourceImage -Spec $edit.Spec -Add $add
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
