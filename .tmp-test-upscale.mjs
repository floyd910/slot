import sharp from "sharp";

const input = "D:/dekstop/casting/game-room-slot/public/assets/img/animations/view2-symbol-7-win.webp";
const output = "D:/dekstop/casting/iframe-slot/.tmp-view2-symbol-7-win-hq.webp";
await sharp(input, { animated: true })
  .resize(240, 156, { kernel: sharp.kernel.lanczos3 })
  .sharpen({ sigma: 0.7, m1: 0.5, m2: 1.5 })
  .webp({ quality: 84, alphaQuality: 100, effort: 4, smartSubsample: true })
  .toFile(output);
console.log(await sharp(output, { animated: true }).metadata());
