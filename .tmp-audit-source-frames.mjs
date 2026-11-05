import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const roots = [
  "D:/dekstop/casting/game-room-slot/public/assets/img/animations",
  "D:/dekstop/casting/game-room-slot/public/img/view2-symbols",
];

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (/\.(?:png|webp)$/i.test(entry.name)) files.push(absolute);
  }
  return files;
}

for (const root of roots) {
  const files = await walk(root);
  const candidates = files.filter((file) => !/(?:^|[\\/])win\.webp$/i.test(file) && !/-win\.webp$/i.test(file));
  const groups = new Map();
  for (const file of candidates) {
    const relative = path.relative(root, file).replaceAll("\\", "/");
    const parts = relative.split("/");
    const group = parts.slice(0, Math.min(parts.length - 1, 2)).join("/") || "root";
    if (!groups.has(group)) groups.set(group, file);
  }
  console.log(`\n${root}`);
  for (const [group, file] of [...groups].sort()) {
    const metadata = await sharp(file).metadata();
    console.log(`  ${group}: ${metadata.width}x${metadata.height} — ${path.basename(file)}`);
  }
}
