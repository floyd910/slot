Add-Type -AssemblyName System.Drawing

$srcDir = 'C:\Users\user\Desktop\2'
$outDir = Join-Path (Get-Location) 'output\billboard-edits'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Add-Billboard {
    param(
        [System.Drawing.Graphics]$G,
        [float]$X,
        [float]$Y,
        [float]$W,
        [float]$H,
        [float]$PoleH,
        [float]$PoleW = 3.0
    )

    $pole = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(210, 24, 25, 25), $PoleW)
    $pole.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pole.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $edge = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(225, 38, 39, 38), [Math]::Max(1.4, $PoleW * 0.75))
    $fill = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(248, 250, 250, 248))
    $shadow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(45, 0, 0, 0))

    $cx = $X + ($W / 2)
    $bottom = $Y + $H + $PoleH
    $G.DrawLine($pole, $cx, $Y + $H - 2, $cx, $bottom)
    $G.FillRectangle($shadow, $X + 2, $Y + 2, $W, $H)
    $G.FillRectangle($fill, $X, $Y, $W, $H)
    $G.DrawRectangle($edge, $X, $Y, $W, $H)

    $pole.Dispose()
    $edge.Dispose()
    $fill.Dispose()
    $shadow.Dispose()
}

$edits = @{
    '705661427_1341023574611319_7093244544360361907_n.jpg' = @(
        @{ x = 842; y = 735; w = 17; h = 33; pole = 64; pw = 2.0 },
        @{ x = 893; y = 714; w = 13; h = 27; pole = 52; pw = 1.7 }
    )
    '708260421_1725347021796759_6248814098445910411_n.jpg' = @(
        @{ x = 570; y = 795; w = 27; h = 55; pole = 92; pw = 2.4 },
        @{ x = 646; y = 771; w = 20; h = 43; pole = 78; pw = 2.0 },
        @{ x = 707; y = 751; w = 15; h = 32; pole = 62; pw = 1.7 }
    )
    '706316861_1748227466554067_324000721731286177_n.jpg' = @(
        @{ x = 675; y = 758; w = 25; h = 51; pole = 85; pw = 2.2 },
        @{ x = 754; y = 731; w = 18; h = 38; pole = 66; pw = 1.8 }
    )
    '708692714_2015339649191335_4269375656168143863_n.jpg' = @(
        @{ x = 760; y = 766; w = 20; h = 41; pole = 70; pw = 1.9 },
        @{ x = 823; y = 744; w = 14; h = 30; pole = 56; pw = 1.6 }
    )
    '707723308_1702441330899521_8496958170903481736_n.jpg' = @(
        @{ x = 232; y = 781; w = 14; h = 31; pole = 48; pw = 1.6 }
    )
    '709078403_1723360858798101_3942352170385005625_n.jpg' = @(
        @{ x = 728; y = 797; w = 18; h = 38; pole = 63; pw = 1.8 },
        @{ x = 791; y = 770; w = 13; h = 29; pole = 51; pw = 1.5 }
    )
}

foreach ($file in $edits.Keys) {
    $inputPath = Join-Path $srcDir $file
    $base = [System.IO.Path]::GetFileNameWithoutExtension($file)
    $outputPath = Join-Path $outDir "$base-five-billboards.jpg"

    $img = [System.Drawing.Image]::FromFile($inputPath)
    $bitmap = [System.Drawing.Bitmap]::new($img.Width, $img.Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.DrawImage($img, 0, 0, $img.Width, $img.Height)

    foreach ($spec in $edits[$file]) {
        Add-Billboard -G $graphics -X $spec.x -Y $spec.y -W $spec.w -H $spec.h -PoleH $spec.pole -PoleW $spec.pw
    }

    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $params = [System.Drawing.Imaging.EncoderParameters]::new(1)
    $params.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, 95L)
    $bitmap.Save($outputPath, $encoder, $params)

    $params.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
    $img.Dispose()

    Write-Output $outputPath
}
