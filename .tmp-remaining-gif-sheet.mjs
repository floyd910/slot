import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const tileWidth = 175;
const tileHeight = 145;
const rows = [];
for (let game = 1; game <= 5; game += 1) {
  const root = `C:/Users/user/Desktop/game ${game}`;
  const files = (await fs.readdir(root)).filter((file) => /\.gif$/i.test(file)).sort();
  rows.push({ game, root, files });
}
const composites = [];
for (const [row, { game, root, files }] of rows.entries()) {
  for (const [column, file] of files.entries()) {
    const source = path.join(root, file);
    const metadata = await sharp(source, { animated: true }).metadata();
    console.log(`Game ${game} · ${file}: ${metadata.width}x${metadata.pageHeight ?? metadata.height}, ${metadata.pages ?? 1} frames, ${metadata.delay?.[0] ?? "?"}ms`);
    const image = await sharp(source, { page: 0 }).resize(165, 110, { fit: "contain" }).png().toBuffer();
    const x = column * tileWidth + 5;
    const y = row * tileHeight;
    composites.push({ input: image, left: x, top: y });
    const label = file.replace(".gif", "").replaceAll("&", "and");
    composites.push({
      input: Buffer.from(`<svg width="165" height="30"><rect width="165" height="30" fill="#111"/><text x="82" y="20" text-anchor="middle" fill="white" font-size="12" font-family="Arial">G${game} · ${label}</text></svg>`),
      left: x,
      top: y + 110,
    });
  }
}
await sharp({ create: { width: tileWidth * 7, height: tileHeight * 5, channels: 3, background: "#222" } })
  .composite(composites)
  .png()
  .toFile("D:/dekstop/casting/iframe-slot/.tmp-remaining-gif-sheet.png");
