Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$src = $args[0]
$dst = $args[1]
$x = [int]$args[2]
$y = [int]$args[3]
$w = [int]$args[4]
$h = [int]$args[5]

$image = [System.Drawing.Image]::FromFile($src)
try {
  $bitmap = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $dest = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $source = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $g.DrawImage($image, $dest, $source, [System.Drawing.GraphicsUnit]::Pixel)
    $bitmap.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $g.Dispose()
    $bitmap.Dispose()
  }
} finally {
  $image.Dispose()
}
