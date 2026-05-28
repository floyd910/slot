import fs from "node:fs";

const files = ["live-umi.2b6773fa.css", "live-umi.48370fa4.js"];
const interesting = /double|doubl|x2|x0|gold|cell|win|lose|eldorado|loto|flame|circle|doubling/i;

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const urls = [];
  for (let index = source.indexOf("/img/"); index !== -1; index = source.indexOf("/img/", index + 5)) {
    let end = index;
    while (end < source.length && !["'", "\"", ")", "\\", " ", "\n", "\r"].includes(source[end])) {
      end += 1;
    }
    urls.push(source.slice(index, end));
  }
  const unique = [...new Set(urls)];
  console.log(`\nFILE ${file} urls ${unique.length}`);
  for (const url of unique.filter((item) => interesting.test(item))) {
    console.log(url);
  }
}
