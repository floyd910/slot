Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$src = $args[0]
$dst = $args[1]
$image = [System.Drawing.Image]::FromFile($src)
try {
  $bitmap = New-Object System.Drawing.Bitmap($image.Width, $image.Height)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $g.DrawImage($image, 0, 0, $image.Width, $image.Height)
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 255, 0, 0), 1)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 255, 0, 0))
    $font = New-Object System.Drawing.Font("Arial", 16)
    for ($x = 0; $x -le $image.Width; $x += 100) {
      $g.DrawLine($pen, $x, 0, $x, $image.Height)
      $g.DrawString("$x", $font, $brush, $x + 2, 5)
    }
    for ($y = 0; $y -le $image.Height; $y += 100) {
      $g.DrawLine($pen, 0, $y, $image.Width, $y)
      $g.DrawString("$y", $font, $brush, 5, $y + 2)
    }
    $bitmap.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $g.Dispose()
    $bitmap.Dispose()
  }
} finally {
  $image.Dispose()
}
