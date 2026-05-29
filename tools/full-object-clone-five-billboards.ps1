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

function Test-DarkPixel {
  param([System.Drawing.Color]$C)
  $max = [Math]::Max($C.R, [Math]::Max($C.G, $C.B))
  $min = [Math]::Min($C.R, [Math]::Min($C.G, $C.B))
  $neutral = (($max - $min) -lt 38)
  $notGreen = -not ($C.G -gt ($C.R + 12) -and $C.G -gt ($C.B + 10))
  return ($C.R -lt 115 -and $C.G -lt 120 -and $C.B -lt 120 -and $neutral -and $notGreen)
}

function New-FullObjectClone {
  param(
    [System.Drawing.Bitmap]$Source,
    [hashtable]$Spec
  )

  $clone = New-Object System.Drawing.Bitmap($Spec.CropW, $Spec.CropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $dark = New-Object 'bool[,]' $Spec.CropW, $Spec.CropH
  $keep = New-Object 'bool[,]' $Spec.CropW, $Spec.CropH
  $queue = New-Object System.Collections.Generic.Queue[object]

  for ($y = 0; $y -lt $Spec.CropH; $y += 1) {
    for ($x = 0; $x -lt $Spec.CropW; $x += 1) {
      $c = $Source.GetPixel($Spec.CropX + $x, $Spec.CropY + $y)
      $dark[$x, $y] = Test-DarkPixel -C $c
    }
  }

  $seedRects = @(
    @{ X = $Spec.PoleSeedX; Y = 0; W = $Spec.PoleSeedW; H = $Spec.CropH },
    @{ X = [Math]::Max(0, $Spec.BoardX - 6); Y = [Math]::Max(0, $Spec.BoardY - 6); W = [Math]::Min($Spec.CropW - [Math]::Max(0, $Spec.BoardX - 6), $Spec.BoardW + 12); H = [Math]::Min($Spec.CropH - [Math]::Max(0, $Spec.BoardY - 6), $Spec.BoardH + 12) }
  )

  foreach ($r in $seedRects) {
    for ($yy = $r.Y; $yy -lt ($r.Y + $r.H); $yy += 1) {
      for ($xx = $r.X; $xx -lt ($r.X + $r.W); $xx += 1) {
        if ($xx -lt 0 -or $yy -lt 0 -or $xx -ge $Spec.CropW -or $yy -ge $Spec.CropH) { continue }
        if ($dark[$xx, $yy] -and -not $keep[$xx, $yy]) {
          $keep[$xx, $yy] = $true
          $queue.Enqueue(@($xx, $yy))
        }
      }
    }
  }

  while ($queue.Count -gt 0) {
    $p = $queue.Dequeue()
    $px = [int]$p[0]
    $py = [int]$p[1]
    foreach ($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1),@(1,1),@(1,-1),@(-1,1),@(-1,-1))) {
      $nx = $px + $d[0]
      $ny = $py + $d[1]
      if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $Spec.CropW -or $ny -ge $Spec.CropH) { continue }
      if ($dark[$nx, $ny] -and -not $keep[$nx, $ny]) {
        $keep[$nx, $ny] = $true
        $queue.Enqueue(@($nx, $ny))
      }
    }
  }

  for ($y = 0; $y -lt $Spec.CropH; $y += 1) {
    for ($x = 0; $x -lt $Spec.CropW; $x += 1) {
      $insideBoard = (
        $x -ge $Spec.BoardX -and
        $y -ge $Spec.BoardY -and
        $x -lt ($Spec.BoardX + $Spec.BoardW) -and
        $y -lt ($Spec.BoardY + $Spec.BoardH)
      )
      $nearBoardFrame = (
        $x -ge ($Spec.BoardX - 3) -and
        $y -ge ($Spec.BoardY - 3) -and
        $x -lt ($Spec.BoardX + $Spec.BoardW + 3) -and
        $y -lt ($Spec.BoardY + $Spec.BoardH + 3) -and
        ($x -lt $Spec.BoardX -or $x -ge ($Spec.BoardX + $Spec.BoardW) -or $y -lt $Spec.BoardY -or $y -ge ($Spec.BoardY + $Spec.BoardH))
      )
      $c = $Source.GetPixel($Spec.CropX + $x, $Spec.CropY + $y)
      if ($insideBoard -or ($nearBoardFrame -and (Test-DarkPixel -C $c)) -or $keep[$x, $y]) {
        $clone.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
      } else {
        $clone.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $c.R, $c.G, $c.B))
      }
    }
  }

  return $clone
}

function Paste-FullClone {
  param(
    [System.Drawing.Graphics]$G,
    [System.Drawing.Bitmap]$Clone,
    [hashtable]$Spec,
    [hashtable]$Add
  )

  $scale = $Add.BoardW / $Spec.BoardW
  $destX = $Add.BoardX - ($Spec.BoardX * $scale)
  $destY = $Add.BaseY - (($Spec.CropH - $Spec.BoardY) * $scale)
  $destW = $Spec.CropW * $scale
  $destH = $Spec.CropH * $scale
  $dest = New-Object System.Drawing.RectangleF($destX, $destY, $destW, $destH)
  $G.DrawImage($Clone, $dest)
}

$edits = @(
  @{
    File = "707723308_1702441330899521_8496958170903481736_n.jpg"
    Spec = $null
    Adds = @()
  },
  @{
    File = "705661427_1341023574611319_7093244544360361907_n.jpg"
    Spec = @{ CropX = 650; CropY = 620; CropW = 95; CropH = 240; BoardX = 35; BoardY = 70; BoardW = 26; BoardH = 39; PoleSeedX = 18; PoleSeedW = 20 }
    Adds = @(
      @{ BoardX = 420; BoardW = 50; BaseY = 858 },
      @{ BoardX = 555; BoardW = 38; BaseY = 826 }
    )
  },
  @{
    File = "706316861_1748227466554067_324000721731286177_n.jpg"
    Spec = @{ CropX = 485; CropY = 650; CropW = 95; CropH = 230; BoardX = 27; BoardY = 37; BoardW = 37; BoardH = 55; PoleSeedX = 12; PoleSeedW = 18 }
    Adds = @(
      @{ BoardX = 440; BoardW = 48; BaseY = 850 },
      @{ BoardX = 705; BoardW = 22; BaseY = 820 }
    )
  },
  @{
    File = "708260421_1725347021796759_6248814098445910411_n.jpg"
    Spec = @{ CropX = 395; CropY = 670; CropW = 85; CropH = 230; BoardX = 26; BoardY = 56; BoardW = 30; BoardH = 58; PoleSeedX = 14; PoleSeedW = 16 }
    Adds = @(
      @{ BoardX = 500; BoardW = 26; BaseY = 845 },
      @{ BoardX = 560; BoardW = 20; BaseY = 825 },
      @{ BoardX = 630; BoardW = 16; BaseY = 810 }
    )
  },
  @{
    File = "708692714_2015339649191335_4269375656168143863_n.jpg"
    Spec = @{ CropX = 590; CropY = 720; CropW = 95; CropH = 220; BoardX = 29; BoardY = 41; BoardW = 23; BoardH = 46; PoleSeedX = 17; PoleSeedW = 18 }
    Adds = @(
      @{ BoardX = 500; BoardW = 34; BaseY = 845 },
      @{ BoardX = 560; BoardW = 27; BaseY = 830 }
    )
  },
  @{
    File = "709078403_1723360858798101_3942352170385005625_n.jpg"
    Spec = @{ CropX = 570; CropY = 720; CropW = 85; CropH = 220; BoardX = 24; BoardY = 32; BoardW = 21; BoardH = 42; PoleSeedX = 15; PoleSeedW = 16 }
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
          $clone = New-FullObjectClone -Source $sourceImage -Spec $edit.Spec
          try {
            foreach ($add in $edit.Adds) {
              Paste-FullClone -G $g -Clone $clone -Spec $edit.Spec -Add $add
            }
          } finally {
            $clone.Dispose()
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
