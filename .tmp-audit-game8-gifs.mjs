import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = "C:/Users/user/Desktop/game 8 gifs";
const files = (await fs.readdir(root))
  .filter((file) => /\.gif$/i.test(file))
  .sort((a, b) => a.localeCompare(b));

for (const file of files) {
  const fullPath = path.join(root, file);
  const [metadata, stat] = await Promise.all([
    sharp(fullPath, { animated: true }).metadata(),
    fs.stat(fullPath),
  ]);
  console.log(`${file}: ${metadata.width}x${metadata.pageHeight ?? metadata.height}, ${metadata.pages ?? 1} frames, ${(stat.size / 1024 / 1024).toFixed(1)} MiB`);
}
