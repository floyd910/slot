Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$file = $args[0]
$image = [System.Drawing.Bitmap]::FromFile($file)
try {
  $w = $image.Width
  $h = $image.Height
  $visited = New-Object 'bool[,]' $w, $h
  $components = New-Object System.Collections.Generic.List[object]

  for ($y = 0; $y -lt $h; $y += 1) {
    for ($x = 0; $x -lt $w; $x += 1) {
      if ($visited[$x, $y]) { continue }
      $c = $image.GetPixel($x, $y)
      $isWhite = ($c.R -gt 225 -and $c.G -gt 225 -and $c.B -gt 220 -and ([Math]::Abs($c.R - $c.G) -lt 18) -and ([Math]::Abs($c.R - $c.B) -lt 22))
      if (-not $isWhite) {
        $visited[$x, $y] = $true
        continue
      }

      $queue = New-Object System.Collections.Generic.Queue[object]
      $queue.Enqueue(@($x, $y))
      $visited[$x, $y] = $true
      $minX = $x; $maxX = $x; $minY = $y; $maxY = $y; $count = 0

      while ($queue.Count -gt 0) {
        $p = $queue.Dequeue()
        $px = [int]$p[0]
        $py = [int]$p[1]
        $count += 1
        if ($px -lt $minX) { $minX = $px }
        if ($px -gt $maxX) { $maxX = $px }
        if ($py -lt $minY) { $minY = $py }
        if ($py -gt $maxY) { $maxY = $py }

        foreach ($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))) {
          $nx = $px + $d[0]
          $ny = $py + $d[1]
          if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $w -or $ny -ge $h -or $visited[$nx, $ny]) { continue }
          $nc = $image.GetPixel($nx, $ny)
          $nw = ($nc.R -gt 225 -and $nc.G -gt 225 -and $nc.B -gt 220 -and ([Math]::Abs($nc.R - $nc.G) -lt 18) -and ([Math]::Abs($nc.R - $nc.B) -lt 22))
          $visited[$nx, $ny] = $true
          if ($nw) { $queue.Enqueue(@($nx, $ny)) }
        }
      }

      $cw = $maxX - $minX + 1
      $ch = $maxY - $minY + 1
      if ($count -gt 120 -and $cw -gt 8 -and $ch -gt 10 -and $ch -lt 300 -and $cw -lt 200) {
        $components.Add([pscustomobject]@{
          x = $minX
          y = $minY
          w = $cw
          h = $ch
          count = $count
        })
      }
    }
  }

  $components | Sort-Object y,x | Format-Table -AutoSize
} finally {
  $image.Dispose()
}
