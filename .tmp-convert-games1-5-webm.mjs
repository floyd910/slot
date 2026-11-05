import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const mappings = {
  1: { 0: "Hands and a ball.gif", 7: "Coin.gif", 8: "Leaf.gif", 9: "Horseshoe.gif", 10: "Bug.gif", 11: "Parfume spray.gif", 12: "Girl.gif" },
  2: { 0: "Pearl.gif", 7: "Fish.gif", 8: "Group of fish.gif", 9: "Horsefish.gif", 10: "Scat.gif", 11: "Crab.gif", 12: "Dolphin.gif" },
  3: { 0: "Bag of gold Sprite.gif", 7: "Table Sprite.gif", 8: "Violin Sprite.gif", 9: "Donkey Sprite.gif", 10: "Woman Sprite.gif", 11: "King sprite.gif", 12: "Khiradmandi Sprite.gif" },
  4: { 0: "Eye.gif", 7: "Bug.gif", 8: "Cat.gif", 9: "Golden Eagle.gif", 10: "Sphinx.gif", 11: "Piramids.gif", 12: "Tutan Hamun.gif" },
  5: { 0: "Persian Warriors.gif", 7: "Warrior #1.gif", 8: "Warrior #2.gif", 9: "Axes.gif", 10: "Bow.gif", 11: "2 Warriors.gif", 12: "Warrior #3.gif" },
};
const destinationRoot = "D:/dekstop/casting/game-room-slot/public/assets/video/animations";
const jobs = [];
for (const [game, symbols] of Object.entries(mappings)) {
  const destination = path.join(destinationRoot, `game${game}`);
  await fs.mkdir(destination, { recursive: true });
  for (const [symbol, file] of Object.entries(symbols)) {
    const source = `C:/Users/user/Desktop/game ${game}/${file}`;
    jobs.push({ source, destination: path.join(destination, `${symbol}-win.webm`), scale: "288:188", crf: "29" });
    jobs.push({ source, destination: path.join(destination, `${symbol}-win-desktop.webm`), scale: "384:250", crf: "28" });
  }
}

const run = ({ source, destination, scale, crf }) => new Promise((resolve, reject) => {
  const child = spawn("ffmpeg", [
    "-y", "-v", "error", "-i", source,
    "-vf", `fps=25,scale=${scale}:flags=lanczos`,
    "-an", "-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p",
    "-crf", crf, "-b:v", "0", "-row-mt", "1",
    "-deadline", "good", "-cpu-used", "2", destination,
  ], { stdio: ["ignore", "ignore", "pipe"] });
  let error = "";
  child.stderr.on("data", (chunk) => { error += chunk; });
  child.on("error", reject);
  child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${destination}: ${error || `exit ${code}`}`)));
});

let completed = 0;
const queue = [...jobs];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    await run(queue.shift());
    completed += 1;
    if (completed % 10 === 0 || completed === jobs.length) console.log(`${completed}/${jobs.length}`);
  }
}));
