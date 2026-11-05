import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = "C:/Users/user/Desktop/FRUITS";
const directories = (await fs.readdir(root, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name));

for (const directory of directories) {
  const folder = path.join(root, directory.name);
  const files = (await fs.readdir(folder))
    .filter((file) => /\.(?:png|webp)$/i.test(file))
    .sort();
  const dimensions = new Map();
  for (const file of files) {
    const metadata = await sharp(path.join(folder, file)).metadata();
    const key = `${metadata.width}x${metadata.height}`;
    dimensions.set(key, (dimensions.get(key) ?? 0) + 1);
  }
  console.log(`${directory.name}: ${files.length} frames — ${[...dimensions].map(([size, count]) => `${size} (${count})`).join(", ")}`);
}
