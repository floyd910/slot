import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = "D:/dekstop/casting/game-room-slot/public/assets/img";
const symbols = [0, 7, 8, 9, 10, 11, 12];
const games = {
  1: (symbol) => `game1-korvonsaroi-karavan-view2-symbol${symbol}-static.webp`,
  2: (symbol) => `game2-view2-symbol${symbol}-static.webp`,
  3: (symbol) => `view2-symbol-${symbol}-static.webp`,
  4: (symbol) => `game4-view2-symbol${symbol}-static-optimized.webp`,
  5: (symbol) => `game5-view2-symbol${symbol}-static.webp`,
};
const tileWidth = 150;
const tileHeight = 125;
const composites = [];
for (const [row, [game, resolveName]] of Object.entries(games).entries()) {
  for (const [column, symbol] of symbols.entries()) {
    const file = path.join(root, resolveName(symbol));
    await fs.access(file);
    const image = await sharp(file).resize(140, 95, { fit: "contain" }).png().toBuffer();
    const x = column * tileWidth + 5;
    const y = row * tileHeight;
    composites.push({ input: image, left: x, top: y });
    composites.push({
      input: Buffer.from(`<svg width="140" height="25"><rect width="140" height="25" fill="#111"/><text x="70" y="18" text-anchor="middle" fill="white" font-size="14" font-family="Arial">G${game} · symbol ${symbol}</text></svg>`),
      left: x,
      top: y + 95,
    });
  }
}
await sharp({ create: { width: tileWidth * symbols.length, height: tileHeight * 5, channels: 3, background: "#222" } })
  .composite(composites)
  .png()
  .toFile("D:/dekstop/casting/iframe-slot/.tmp-remaining-static-sheet.png");
