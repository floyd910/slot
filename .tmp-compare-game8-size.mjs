import fs from "node:fs/promises";
import path from "node:path";

async function size(directory, predicate = () => true) {
  let total = 0;
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) total += await size(absolute, predicate);
    else if (predicate(entry.name)) total += (await fs.stat(absolute)).size;
  }
  return total;
}

const old = await size("D:/dekstop/casting/iframe-slot/public/assets/img/animations/game8");
const root = "D:/dekstop/casting/game-room-slot/public/assets/video/animations/game8";
const compact = await size(root, (name) => /^\d+-win\.webm$/.test(name));
const desktop = await size(root, (name) => /^\d+-win-desktop\.webm$/.test(name));
const summary = { old, compact, desktop };
for (const [key, value] of Object.entries(summary)) {
  summary[`${key}MiB`] = +(value / 1024 / 1024).toFixed(2);
}
summary.compactSavedMiB = +((old - compact) / 1024 / 1024).toFixed(2);
summary.desktopSavedMiB = +((old - desktop) / 1024 / 1024).toFixed(2);
summary.compactReduction = +((1 - compact / old) * 100).toFixed(1);
summary.desktopReduction = +((1 - desktop / old) * 100).toFixed(1);
console.log(JSON.stringify(summary, null, 2));
