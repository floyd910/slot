param(
  [string[]]$Sources = @(),

  [string]$SourceRoot = "",

  [Parameter(Mandatory = $true)]
  [string]$OutputRoot,

  [int]$AlphaThreshold = 8,
  [int]$MinimumArea = 1000,
  [int]$Padding = 0
)

Add-Type -AssemblyName System.Drawing

$extractorSource = @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class SpriteExtractor
{
    public static int Extract(string sourcePath, string outputDir, int alphaThreshold, int minimumArea, int padding)
    {
        Directory.CreateDirectory(outputDir);
        using (var source = new Bitmap(sourcePath))
        using (var bitmap = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb))
        using (var graphics = Graphics.FromImage(bitmap))
        {
            graphics.DrawImage(source, 0, 0, source.Width, source.Height);

            int width = bitmap.Width;
            int height = bitmap.Height;
            var rect = new Rectangle(0, 0, width, height);
            var data = bitmap.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            int stride = data.Stride;
            int byteCount = Math.Abs(stride) * height;
            byte[] pixels = new byte[byteCount];
            Marshal.Copy(data.Scan0, pixels, 0, byteCount);
            bitmap.UnlockBits(data);

            bool[] visited = new bool[width * height];
            int[] queue = new int[width * height];
            var boxes = new List<Rectangle>();

            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    int start = y * width + x;
                    if (visited[start] || AlphaAt(pixels, stride, x, y) <= alphaThreshold) continue;

                    int head = 0;
                    int tail = 0;
                    int minX = x;
                    int maxX = x;
                    int minY = y;
                    int maxY = y;
                    int area = 0;
                    visited[start] = true;
                    queue[tail++] = start;

                    while (head < tail)
                    {
                        int current = queue[head++];
                        int cx = current % width;
                        int cy = current / width;
                        area++;
                        if (cx < minX) minX = cx;
                        if (cx > maxX) maxX = cx;
                        if (cy < minY) minY = cy;
                        if (cy > maxY) maxY = cy;

                        TryAdd(cx - 1, cy, width, height, pixels, stride, alphaThreshold, visited, queue, ref tail);
                        TryAdd(cx + 1, cy, width, height, pixels, stride, alphaThreshold, visited, queue, ref tail);
                        TryAdd(cx, cy - 1, width, height, pixels, stride, alphaThreshold, visited, queue, ref tail);
                        TryAdd(cx, cy + 1, width, height, pixels, stride, alphaThreshold, visited, queue, ref tail);
                    }

                    if (area >= minimumArea)
                    {
                        minX = Math.Max(0, minX - padding);
                        minY = Math.Max(0, minY - padding);
                        maxX = Math.Min(width - 1, maxX + padding);
                        maxY = Math.Min(height - 1, maxY + padding);
                        boxes.Add(new Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1));
                    }
                }
            }

            boxes.Sort((a, b) => a.Top == b.Top ? a.Left.CompareTo(b.Left) : a.Top.CompareTo(b.Top));
            for (int i = 0; i < boxes.Count; i++)
            {
                Rectangle box = boxes[i];
                using (var crop = new Bitmap(box.Width, box.Height, PixelFormat.Format32bppArgb))
                using (var cropGraphics = Graphics.FromImage(crop))
                {
                    cropGraphics.DrawImage(bitmap, new Rectangle(0, 0, box.Width, box.Height), box, GraphicsUnit.Pixel);
                    crop.Save(Path.Combine(outputDir, String.Format("sprite_{0:D3}_{1}x{2}_at_{3}_{4}.png", i + 1, box.Width, box.Height, box.Left, box.Top)), ImageFormat.Png);
                }
            }

            return boxes.Count;
        }
    }

    private static byte AlphaAt(byte[] pixels, int stride, int x, int y)
    {
        return pixels[y * stride + x * 4 + 3];
    }

    private static void TryAdd(int x, int y, int width, int height, byte[] pixels, int stride, int alphaThreshold, bool[] visited, int[] queue, ref int tail)
    {
        if (x < 0 || y < 0 || x >= width || y >= height) return;
        int index = y * width + x;
        if (visited[index] || AlphaAt(pixels, stride, x, y) <= alphaThreshold) return;
        visited[index] = true;
        queue[tail++] = index;
    }
}
"@

Add-Type -TypeDefinition $extractorSource -ReferencedAssemblies System.Drawing

if ($SourceRoot) {
  $Sources = Get-ChildItem -LiteralPath $SourceRoot -Recurse -File -Filter *.png |
    Where-Object { $_.FullName -notmatch '\\fonts\\' } |
    Select-Object -ExpandProperty FullName
}

if (-not $Sources -or $Sources.Count -eq 0) {
  throw "No PNG sources were provided."
}

foreach ($source in $Sources) {
  if (-not (Test-Path -LiteralPath $source)) {
    Write-Warning "Missing source: $source"
    continue
  }

  $directoryName = Split-Path -Leaf (Split-Path -Parent $source)
  $fileName = [System.IO.Path]::GetFileNameWithoutExtension($source)
  $safeDirectory = ($directoryName -replace '[^\p{L}\p{Nd}_-]+', '_').Trim('_')
  $safeFile = ($fileName -replace '[^\p{L}\p{Nd}_-]+', '_').Trim('_')
  $outputDir = Join-Path $OutputRoot "$safeDirectory-$safeFile"
  $count = [SpriteExtractor]::Extract($source, $outputDir, $AlphaThreshold, $MinimumArea, $Padding)
  Write-Output "$count`t$source`t$outputDir"
}
