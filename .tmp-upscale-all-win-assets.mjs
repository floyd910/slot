import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceRoot = "D:/dekstop/casting/iframe-slot/public/assets/img/animations";
const destinationRoot = "D:/dekstop/casting/game-room-slot/public/assets/img/animations";
const targetWidth = 384;
const targetHeight = 250;
sharp.concurrency(2);

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

const allFiles = await walk(sourceRoot);
const packagedAnimations = allFiles.filter((file) =>
  /(?:^|[\\/])win\.webp$/i.test(file) || /-win\.webp$/i.test(file),
);
const game8Frames = allFiles.filter((file) =>
  /[\\/]game8[\\/].*frame_\d+_delay-[\d.]+s\.webp$/i.test(file),
);
const targets = [...packagedAnimations, ...game8Frames];

let completed = 0;
let originalBytes = 0;
let optimizedBytes = 0;

async function optimize(file) {
  const destination = path.join(destinationRoot, path.relative(sourceRoot, file));
  const animated = /(?:^|[\\/])win\.webp$/i.test(file) || /-win\.webp$/i.test(file);
  const source = await fs.readFile(file);
  const input = sharp(source, { animated });
  const metadata = await input.metadata();
  const original = await fs.stat(file);
  if (metadata.width === targetWidth && (metadata.pageHeight ?? metadata.height) === targetHeight) {
    originalBytes += original.size;
    optimizedBytes += original.size;
    completed += 1;
    return;
  }
  const output = await input
    .resize(targetWidth, targetHeight, { kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 0.7, m1: 0.5, m2: 1.5 })
    .webp({ quality: 84, alphaQuality: 100, effort: 4, smartSubsample: true })
    .toBuffer();
  const resultMetadata = await sharp(output, { animated: (metadata.pages ?? 1) > 1 }).metadata();
  if (
    resultMetadata.width !== targetWidth ||
    (resultMetadata.pageHeight ?? resultMetadata.height) !== targetHeight ||
    (resultMetadata.pages ?? 1) !== (metadata.pages ?? 1)
  ) {
    throw new Error(`Invalid optimized animation: ${file}`);
  }
  await fs.writeFile(destination, output);
  originalBytes += original.size;
  optimizedBytes += output.length;
  completed += 1;
  if (completed % 100 === 0 || completed === targets.length) {
    console.log(`${completed}/${targets.length}`);
  }
}

const queue = [...targets];
await Promise.all(Array.from({ length: 3 }, async () => {
  while (queue.length) await optimize(queue.shift());
}));

console.log(JSON.stringify({
  files: targets.length,
  originalMiB: +(originalBytes / 1024 / 1024).toFixed(1),
  optimizedMiB: +(optimizedBytes / 1024 / 1024).toFixed(1),
}));
