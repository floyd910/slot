import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const root = "D:/dekstop/casting/game-room-slot/public/assets/video/animations";
const files = [];
for (let game = 1; game <= 5; game += 1) {
  const directory = path.join(root, `game${game}`);
  for (const file of await fs.readdir(directory)) {
    if (/\.webm$/i.test(file)) files.push(path.join(directory, file));
  }
}
const probe = (file) => new Promise((resolve, reject) => {
  const child = spawn("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate:format=duration", "-of", "json", file]);
  let output = "";
  let error = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { error += chunk; });
  child.on("error", reject);
  child.on("exit", (code) => code === 0 ? resolve(JSON.parse(output)) : reject(new Error(`${file}: ${error || code}`)));
});
let compactBytes = 0;
let desktopBytes = 0;
for (const file of files.sort()) {
  const data = await probe(file);
  const stream = data.streams?.[0];
  const desktop = file.endsWith("-desktop.webm");
  const expected = desktop ? [384, 250] : [288, 188];
  if (stream?.width !== expected[0] || stream?.height !== expected[1] || stream?.r_frame_rate !== "25/1" || Number(data.format?.duration) !== 6.04) {
    throw new Error(`Invalid output ${file}: ${JSON.stringify(data)}`);
  }
  const bytes = (await fs.stat(file)).size;
  if (desktop) desktopBytes += bytes;
  else compactBytes += bytes;
}
console.log(JSON.stringify({ files: files.length, compactMiB: +(compactBytes / 1048576).toFixed(2), desktopMiB: +(desktopBytes / 1048576).toFixed(2) }));
