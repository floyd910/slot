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

function New-MaskedClone {
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
      $isWhitePanel = ($c.R -gt 205 -and $c.G -gt 205 -and $c.B -gt 200 -and ($max - $min) -lt 42)
      $isDarkPole = ($c.R -lt 78 -and $c.G -lt 84 -and $c.B -lt 82)
      $isFrame = ($c.R -lt 118 -and $c.G -lt 122 -and $c.B -lt 118 -and ($max - $min) -lt 38)

      if ($isWhitePanel -or $isDarkPole -or $isFrame) {
        $clone.SetPixel($xx, $yy, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
      } else {
        $clone.SetPixel($xx, $yy, [System.Drawing.Color]::FromArgb(0, $c.R, $c.G, $c.B))
      }
    }
  }
  return $clone
}

function Paste-CloneAtBoard {
  param(
    [System.Drawing.Graphics]$G,
    [System.Drawing.Bitmap]$Clone,
    [double]$SrcBoardOffsetX,
    [double]$SrcBoardOffsetY,
    [double]$SrcBoardW,
    [double]$BoardX,
    [double]$BoardY,
    [double]$BoardW
  )

  $scale = $BoardW / $SrcBoardW
  $targetX = $BoardX - ($SrcBoardOffsetX * $scale)
  $targetY = $BoardY - ($SrcBoardOffsetY * $scale)
  $targetW = $Clone.Width * $scale
  $targetH = $Clone.Height * $scale
  $dest = New-Object System.Drawing.RectangleF($targetX, $targetY, $targetW, $targetH)
  $G.DrawImage($Clone, $dest)
}

$edits = @(
  @{
    File = "707723308_1702441330899521_8496958170903481736_n.jpg"
    Source = $null
    Adds = @()
  },
  @{
    File = "705661427_1341023574611319_7093244544360361907_n.jpg"
    Source = @{ X = 245; Y = 500; W = 110; H = 360; BoardOffsetX = 12; BoardOffsetY = 9; BoardW = 79 }
    Adds = @(
      @{ BoardX = 425; BoardY = 618; BoardW = 55 },
      @{ BoardX = 560; BoardY = 662; BoardW = 39 }
    )
  },
  @{
    File = "706316861_1748227466554067_324000721731286177_n.jpg"
    Source = @{ X = 340; Y = 570; W = 100; H = 320; BoardOffsetX = 12; BoardOffsetY = 13; BoardW = 65 }
    Adds = @(
      @{ BoardX = 445; BoardY = 643; BoardW = 48 },
      @{ BoardX = 704; BoardY = 758; BoardW = 20 }
    )
  },
  @{
    File = "708260421_1725347021796759_6248814098445910411_n.jpg"
    Source = @{ X = 260; Y = 450; W = 130; H = 460; BoardOffsetX = 24; BoardOffsetY = 11; BoardW = 85 }
    Adds = @(
      @{ BoardX = 500; BoardY = 736; BoardW = 25 },
      @{ BoardX = 570; BoardY = 747; BoardW = 20 },
      @{ BoardX = 630; BoardY = 757; BoardW = 16 }
    )
  },
  @{
    File = "708692714_2015339649191335_4269375656168143863_n.jpg"
    Source = @{ X = 340; Y = 630; W = 90; H = 280; BoardOffsetX = 9; BoardOffsetY = 12; BoardW = 56 }
    Adds = @(
      @{ BoardX = 515; BoardY = 718; BoardW = 34 },
      @{ BoardX = 758; BoardY = 806; BoardW = 12 }
    )
  },
  @{
    File = "709078403_1723360858798101_3942352170385005625_n.jpg"
    Source = @{ X = 318; Y = 615; W = 90; H = 280; BoardOffsetX = 8; BoardOffsetY = 10; BoardW = 56 }
    Adds = @(
      @{ BoardX = 500; BoardY = 718; BoardW = 33 },
      @{ BoardX = 734; BoardY = 812; BoardW = 10 }
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

        if ($null -ne $edit.Source -and $edit.Adds.Count -gt 0) {
          $clone = New-MaskedClone -Source $sourceImage -X $edit.Source.X -Y $edit.Source.Y -W $edit.Source.W -H $edit.Source.H
          try {
            foreach ($add in $edit.Adds) {
              Paste-CloneAtBoard `
                -G $g `
                -Clone $clone `
                -SrcBoardOffsetX $edit.Source.BoardOffsetX `
                -SrcBoardOffsetY $edit.Source.BoardOffsetY `
                -SrcBoardW $edit.Source.BoardW `
                -BoardX $add.BoardX `
                -BoardY $add.BoardY `
                -BoardW $add.BoardW
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
