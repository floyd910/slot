import sharp from "sharp";

const assets = [
  ["public/assets/img/localized/game3-header-ru.png", "public/assets/img/localized/game3-header-ru-matched.webp"],
  ["public/assets/img/localized/game3-header-tg.png", "public/assets/img/localized/game3-header-tg-matched.webp"],
  ["public/assets/img/chooser/localized/game3-ru.png", "public/assets/img/chooser/localized/game3-ru-matched.webp"],
  ["public/assets/img/chooser/localized/game3-tg.png", "public/assets/img/chooser/localized/game3-tg-matched.webp"],
];

for (const [input, output] of assets) {
  await sharp(input).webp({ lossless: true, effort: 6 }).toFile(output);
}
