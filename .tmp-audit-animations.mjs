import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = "D:/dekstop/casting/game-room-slot/public/assets/img/animations";

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.name === "win.webp" || entry.name.endsWith("-win.webp")) files.push(absolute);
  }
  return files;
}

const files = await walk(root);
const rows = [];
for (const file of files.sort()) {
  const [metadata, stat] = await Promise.all([sharp(file, { animated: true }).metadata(), fs.stat(file)]);
  const relative = path.relative(root, file).replaceAll("\\", "/");
  const firstPart = relative.split("/")[0];
  const game = /^game\d+$/.test(firstPart) ? firstPart : "game3";
  const symbolMatch = relative.match(/(?:symbol[-_/]?)(\d+)/i);
  rows.push({
    game,
    symbol: symbolMatch?.[1] ?? "?",
    file: relative,
    width: metadata.width,
    height: metadata.pageHeight ?? metadata.height,
    frames: metadata.pages ?? 1,
    bytes: stat.size,
  });
}

for (const game of [...new Set(rows.map((row) => row.game))].sort()) {
  const gameRows = rows.filter((row) => row.game === game);
  console.log(`\n${game} (${gameRows.length} animations)`);
  for (const row of gameRows) {
    console.log(`  symbol ${row.symbol}: ${row.width}x${row.height}, ${row.frames} frames, ${(row.bytes / 1024).toFixed(0)} KiB — ${row.file}`);
  }
}
