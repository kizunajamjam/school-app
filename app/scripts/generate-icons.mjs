// PWA 用のアイコンを scripts/source-icon.png から生成する。
//
// 元画像はスマホのモックアップにアイコンが写っている構図なので、
//   1. 中央の角丸正方形だけを切り出す
//   2. 角丸のぶん四隅に残る白を、マスクで透過に抜く
//   3. 用途に応じて背景を敷いて書き出す
// という手順を踏む。透過のまま書き出すと iOS で黒く出るため、背景は必ず敷く。
//
// 使い方（school-app/app で実行）:
//   node scripts/generate-icons.mjs

import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "scripts/source-icon.png";

// 元画像の空と芝に合わせた背景。四隅を抜いた部分をここで埋める。
const gradient = (size) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#5cc0f0"/>
        <stop offset="100%" stop-color="#5cc45a"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#g)"/>
  </svg>`,
);

// 角丸の白を抜くためのマスク
const roundedMask = (size, radiusRatio) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${size * radiusRatio}" ry="${size * radiusRatio}" fill="#fff"/>
  </svg>`,
);

const { width, height } = await sharp(SOURCE).metadata();

// 端末の枠を含めないよう、高さより少し内側を正方形で切り出す
const side = Math.round(height * 0.79);
const cropped = await sharp(SOURCE)
  .extract({
    left: Math.round((width - side) / 2),
    top: Math.round((height - side) / 2),
    width: side,
    height: side,
  })
  .toBuffer();

// 四隅の白を透過にする
const rounded = await sharp(cropped)
  .composite([{ input: roundedMask(side, 0.18), blend: "dest-in" }])
  .png()
  .toBuffer();

console.log(`元画像 ${width}x${height} から ${side}x${side} を切り出し、四隅を抜きました`);

await mkdir("public", { recursive: true });

// padding は maskable 用の安全域（端末側で円形などに切り抜かれる前提）
async function write(file, size, { padding = 0 } = {}) {
  const inner = Math.round(size * (1 - padding * 2));
  const resized = await sharp(rounded).resize(inner, inner, { fit: "cover" }).toBuffer();

  const image = await sharp(gradient(size))
    .composite([{ input: resized, gravity: "center" }])
    .png()
    .toBuffer();

  await writeFile(`public/${file}`, image);
  console.log(`生成: public/${file} (${size}x${size})`);
}

await write("icon-192.png", 192);
await write("icon-512.png", 512);
await write("icon-maskable-512.png", 512, { padding: 0.1 });
await write("apple-touch-icon.png", 180);
await write("favicon.png", 32);
