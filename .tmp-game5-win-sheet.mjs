import path from "node:path";
import sharp from "sharp";

const root = "D:/dekstop/casting/game-room-slot/public/assets/img/animations/game5";
const symbols = [0, 7, 8, 9, 10, 11, 12];
const composites = [];
for (const [index, symbol] of symbols.entries()) {
  const source = path.join(root, `view2-symbol-${symbol}-win.webp`);
  const frame = await sharp(source, { page: 30 }).resize(200, 130, { fit: "contain" }).png().toBuffer();
  composites.push({ input: frame, left: index * 210 + 5, top: 0 });
  composites.push({ input: Buffer.from(`<svg width="200" height="30"><rect width="200" height="30" fill="#111"/><text x="100" y="21" text-anchor="middle" fill="white" font-size="16" font-family="Arial">symbol ${symbol}</text></svg>`), left: index * 210 + 5, top: 130 });
}
await sharp({ create: { width: 1470, height: 160, channels: 3, background: "#222" } })
  .composite(composites)
  .png()
  .toFile("D:/dekstop/casting/iframe-slot/.tmp-game5-win-sheet.png");
