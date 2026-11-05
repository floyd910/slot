import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = "C:/Users/user/Desktop/game 6";
const files = (await fs.readdir(root)).filter((file) => /\.gif$/i.test(file)).sort();
const tileWidth = 240;
const tileHeight = 220;
const composites = [];
for (const [index, file] of files.entries()) {
  const source = path.join(root, file);
  const metadata = await sharp(source, { animated: true }).metadata();
  console.log(`${file}: ${metadata.width}x${metadata.pageHeight ?? metadata.height}, ${metadata.pages ?? 1} frames, ${metadata.delay?.[0] ?? "?"}ms`);
  const frame = await sharp(source, { page: 0 }).resize(220, 180, { fit: "contain" }).png().toBuffer();
  const x = (index % 4) * tileWidth + 10;
  const y = Math.floor(index / 4) * tileHeight;
  composites.push({ input: frame, left: x, top: y });
  composites.push({
    input: Buffer.from(`<svg width="220" height="35"><rect width="220" height="35" fill="#111"/><text x="110" y="23" text-anchor="middle" fill="white" font-size="15" font-family="Arial">${file.replace(".gif", "")}</text></svg>`),
    left: x,
    top: y + 180,
  });
}
await sharp({ create: { width: tileWidth * 4, height: tileHeight * 2, channels: 3, background: "#222" } })
  .composite(composites)
  .png()
  .toFile("D:/dekstop/casting/iframe-slot/.tmp-game6-gif-sheet.png");
