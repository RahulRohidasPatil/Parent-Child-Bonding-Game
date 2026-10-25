// Reuse the existing StarTile brand mark; run after npm ci when the brand changes.
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Star } from "lucide-react";
import sharp from "sharp";

const mark = renderToStaticMarkup(createElement(Star, {
  x: 115, y: 115, width: 282, height: 282,
  fill: "#ffd36b", color: "#ffd36b", strokeWidth: 1.5,
}));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#2e8a69"/>${mark}</svg>`;
await mkdir(new URL("../public/icons/", import.meta.url), { recursive: true });
for (const [name, size] of [["icon-192", 192], ["icon-512", 512], ["apple-touch-icon", 180]]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(fileURLToPath(new URL(`../public/icons/${name}.png`, import.meta.url)));
}
