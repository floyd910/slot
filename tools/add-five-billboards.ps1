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

function Add-Billboard {
  param(
    [System.Drawing.Graphics]$G,
    [float]$X,
    [float]$Y,
    [float]$W,
    [float]$H,
    [float]$PoleH,
    [float]$PoleW = 4.0
  )

  $poleX = $X + ($W / 2.0)
  $poleTop = [Math]::Max(0, $Y - ($H * 0.12))
  $poleBottom = $Y + $H + $PoleH

  $polePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(42, 47, 45), $PoleW)
  $sidePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(28, 32, 31), [Math]::Max(2.0, $PoleW * 0.65))
  $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(48, 50, 48), [Math]::Max(2.0, $PoleW * 0.55))
  $fillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(248, 248, 246))
  $shadeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(237, 238, 236))

  $G.DrawLine($polePen, $poleX, $poleTop, $poleX, $poleBottom)
  $G.DrawLine($sidePen, $poleX + ($PoleW * 0.8), $Y + ($H * 0.1), $poleX + ($PoleW * 0.8), $poleBottom)

  $rect = New-Object System.Drawing.RectangleF($X, $Y, $W, $H)
  $G.FillRectangle($fillBrush, $rect)
  $G.FillRectangle($shadeBrush, $X, $Y, $W, [Math]::Max(1.0, $H * 0.08))
  $G.DrawRectangle($borderPen, $X, $Y, $W, $H)

  $polePen.Dispose()
  $sidePen.Dispose()
  $borderPen.Dispose()
  $fillBrush.Dispose()
  $shadeBrush.Dispose()
}

$edits = @(
  @{
    File = "707723308_1702441330899521_8496958170903481736_n.jpg"
    Boards = @()
  },
  @{
    File = "705661427_1341023574611319_7093244544360361907_n.jpg"
    Boards = @(
      @{ X = 898; Y = 711; W = 18; H = 34; PoleH = 78; PoleW = 2.0 },
      @{ X = 971; Y = 706; W = 13; H = 25; PoleH = 65; PoleW = 1.6 }
    )
  },
  @{
    File = "706316861_1748227466554067_324000721731286177_n.jpg"
    Boards = @(
      @{ X = 734; Y = 721; W = 23; H = 43; PoleH = 77; PoleW = 2.4 },
      @{ X = 808; Y = 733; W = 17; H = 32; PoleH = 65; PoleW = 1.9 }
    )
  },
  @{
    File = "708260421_1725347021796759_6248814098445910411_n.jpg"
    Boards = @(
      @{ X = 673; Y = 716; W = 28; H = 52; PoleH = 86; PoleW = 2.7 },
      @{ X = 748; Y = 737; W = 21; H = 39; PoleH = 72; PoleW = 2.1 },
      @{ X = 818; Y = 753; W = 15; H = 29; PoleH = 58; PoleW = 1.7 }
    )
  },
  @{
    File = "708692714_2015339649191335_4269375656168143863_n.jpg"
    Boards = @(
      @{ X = 744; Y = 721; W = 23; H = 43; PoleH = 78; PoleW = 2.3 },
      @{ X = 820; Y = 742; W = 16; H = 31; PoleH = 63; PoleW = 1.8 }
    )
  },
  @{
    File = "709078403_1723360858798101_3942352170385005625_n.jpg"
    Boards = @(
      @{ X = 732; Y = 728; W = 22; H = 41; PoleH = 76; PoleW = 2.2 },
      @{ X = 806; Y = 748; W = 16; H = 30; PoleH = 62; PoleW = 1.8 }
    )
  }
)

$jpegCodec = Get-JpegCodec
$encoderParams = New-JpegEncoderParams -Quality 96

foreach ($edit in $edits) {
  $src = Join-Path $sourceDir $edit.File
  $dst = Join-Path $outDir $edit.File
  $desktopDst = Join-Path $desktopOutDir $edit.File

  $image = [System.Drawing.Image]::FromFile($src)
  try {
    $bitmap = New-Object System.Drawing.Bitmap($image.Width, $image.Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    try {
      $g = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

        $g.DrawImage($image, 0, 0, $image.Width, $image.Height)
        foreach ($board in $edit.Boards) {
          Add-Billboard -G $g -X $board.X -Y $board.Y -W $board.W -H $board.H -PoleH $board.PoleH -PoleW $board.PoleW
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
    $image.Dispose()
  }
}

Write-Output $outDir
