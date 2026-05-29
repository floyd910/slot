Add-Type -AssemblyName System.Drawing

$sourceDir = "C:\Users\user\Desktop\bilboards"
$outDir = Join-Path (Get-Location) "output\empty-billboards-on-posts"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Add-Panel($graphics, $coords, $brackets, $seed) {
  $points = New-Object System.Drawing.Point[] ([int]($coords.Count / 2))
  for ($i = 0; $i -lt $coords.Count; $i += 2) {
    $points[$i / 2] = New-Object System.Drawing.Point -ArgumentList @([int]$coords[$i], [int]$coords[$i + 1])
  }
  $shadow = New-Object System.Drawing.Point[] $points.Length
  for ($i = 0; $i -lt $points.Length; $i++) {
    $shadow[$i] = New-Object System.Drawing.Point -ArgumentList @([int]($points[$i].X + 5), [int]($points[$i].Y + 7))
  }

  $graphics.FillPolygon((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(45, 0, 0, 0))), $shadow)
  $graphics.FillPolygon((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(244, 224, 226, 218))), $points)

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddPolygon($points)
  $state = $graphics.Save()
  $graphics.SetClip($path)

  $random = New-Object System.Random($seed)
  for ($i = 0; $i -lt 42; $i++) {
    $x = $random.Next(0, 1080)
    $y = $random.Next(0, 1440)
    $alpha = $random.Next(7, 20)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($alpha, 65, 70, 62))
    $graphics.FillEllipse($brush, $x, $y, $random.Next(1, 4), $random.Next(1, 3))
    $brush.Dispose()
  }

  for ($i = 0; $i -lt 9; $i++) {
    $y = $random.Next(0, 1440)
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(12, 255, 255, 255), 1)
    $graphics.DrawLine($pen, 0, $y, 1080, $y + $random.Next(-5, 6))
    $pen.Dispose()
  }

  $graphics.Restore($state)
  $path.Dispose()

  $framePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 74, 82, 76), 5)
  $graphics.DrawPolygon($framePen, $points)
  $framePen.Dispose()

  $innerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 255, 255, 250), 1)
  $graphics.DrawPolygon($innerPen, $points)
  $innerPen.Dispose()

  $bracketPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(230, 54, 58, 56), 4)
  $flatBrackets = @()
  foreach ($line in $brackets) {
    foreach ($value in $line) {
      $flatBrackets += [int]$value
    }
  }
  for ($i = 0; $i -le $flatBrackets.Count - 4; $i += 4) {
    $graphics.DrawLine(
      $bracketPen,
      [int]$flatBrackets[$i],
      [int]$flatBrackets[$i + 1],
      [int]$flatBrackets[$i + 2],
      [int]$flatBrackets[$i + 3]
    )
  }
  $bracketPen.Dispose()
}

$panels = @{
  "706504176_26808307095506562_4472777780110022416_n.jpg" = @(
    @{ c = @(286, 285, 536, 307, 529, 447, 283, 424); b = @(@(265, 345, 286, 348), @(266, 405, 284, 402)) },
    @{ c = @(430, 620, 506, 626, 505, 671, 430, 665); b = @(@(420, 642, 430, 643)) },
    @{ c = @(468, 684, 532, 689, 531, 727, 468, 722); b = @(@(459, 704, 468, 704)) }
  )
  "707693187_994125493358887_2871938819896562113_n.jpg" = @(
    @{ c = @(365, 458, 598, 480, 591, 617, 363, 593); b = @(@(344, 512, 365, 514), @(345, 575, 363, 572)) },
    @{ c = @(620, 655, 692, 661, 692, 703, 620, 697); b = @(@(611, 676, 620, 676)) },
    @{ c = @(683, 705, 743, 709, 743, 744, 683, 740); b = @(@(676, 724, 683, 724)) }
  )
  "708450249_986531300945425_6897355294655702935_n.jpg" = @(
    @{ c = @(313, 462, 552, 482, 546, 624, 312, 600); b = @(@(292, 518, 313, 520), @(293, 582, 312, 579)) },
    @{ c = @(594, 650, 668, 656, 668, 699, 594, 693); b = @(@(586, 671, 594, 672)) },
    @{ c = @(678, 708, 736, 712, 736, 747, 678, 743); b = @(@(671, 727, 678, 727)) }
  )
  "707884817_2829578230727652_1896678299580463995_n.jpg" = @(
    @{ c = @(214, 135, 500, 160, 493, 318, 211, 288); b = @(@(194, 200, 214, 202), @(195, 265, 211, 263)) },
    @{ c = @(423, 608, 500, 615, 499, 660, 423, 654); b = @(@(414, 631, 423, 631)) },
    @{ c = @(466, 675, 532, 681, 531, 719, 466, 714); b = @(@(458, 695, 466, 695)) }
  )
  "706002663_2078476222742361_628078916964255505_n.jpg" = @(
    @{ c = @(374, 486, 605, 506, 599, 642, 374, 619); b = @(@(352, 540, 374, 543), @(353, 604, 374, 601)) },
    @{ c = @(621, 665, 692, 671, 692, 713, 621, 707); b = @(@(613, 686, 621, 687)) },
    @{ c = @(681, 718, 739, 722, 739, 757, 681, 753); b = @(@(674, 737, 681, 737)) }
  )
  "707795690_2208997896526658_859600014679690499_n.jpg" = @(
    @{ c = @(222, 286, 482, 310, 475, 455, 219, 428); b = @(@(199, 344, 222, 347), @(200, 410, 219, 407)) },
    @{ c = @(645, 630, 720, 637, 720, 682, 645, 676); b = @(@(636, 653, 645, 653)) },
    @{ c = @(747, 690, 806, 694, 806, 730, 747, 726); b = @(@(740, 709, 747, 709)) }
  )
}

foreach ($file in $panels.Keys) {
  $source = Join-Path $sourceDir $file
  $bitmap = [System.Drawing.Bitmap]::FromFile($source)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

  $seed = 100
  foreach ($panel in $panels[$file]) {
    Add-Panel $graphics $panel.c $panel.b ($seed++)
  }

  $out = Join-Path $outDir $file
  $bitmap.Save($out, [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $graphics.Dispose()
  $bitmap.Dispose()
  Write-Output $out
}
