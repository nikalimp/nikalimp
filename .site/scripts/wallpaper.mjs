// Обои для iPhone с QR-кодом на страницу-визитку и аватаркой в центре кода.
//   PW_CHROMIUM=/opt/pw-browsers/chromium node scripts/wallpaper.mjs [out.png]
// Размер 1290×2796 — iPhone 15/16 Pro Max и Plus; на других моделях iOS сам подгоняет картинку.
import fs from "node:fs";
import path from "node:path";
import qrcode from "qrcode-generator";
import sharp from "sharp";
import { chromium } from "playwright";

const ROOT = process.cwd();
const OUT = process.argv[2] || path.join(ROOT, "public/card/wallpaper-iphone.png");
const URL = "https://nikalimp.ru/card/";
const W = 1290, H = 2796;

const qr = qrcode(0, "H"); qr.addData(URL); qr.make();
const n = qr.getModuleCount(), cell = 22, size = n * cell;
const hole = Math.round(n * 0.26) | 1, h0 = Math.floor((n - hole) / 2); // центр под аватар: при уровне H код читается и без него
const finder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
let mods = "";
for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
  if (!qr.isDark(r, c) || finder(r, c)) continue;
  if (r >= h0 - 1 && r < h0 + hole + 1 && c >= h0 - 1 && c < h0 + hole + 1) continue;
  mods += `<rect x="${c * cell + 2}" y="${r * cell + 2}" width="${cell - 4}" height="${cell - 4}" rx="${cell * 0.32}"/>`;
}
const eye = (x, y) => `<rect x="${x + cell / 2}" y="${y + cell / 2}" width="${cell * 6}" height="${cell * 6}" rx="${cell * 1.8}" fill="none" stroke="#0b0b12" stroke-width="${cell}"/><rect x="${x + cell * 2}" y="${y + cell * 2}" width="${cell * 3}" height="${cell * 3}" rx="${cell}"/>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" fill="#0b0b12">${mods}${eye(0, 0)}${eye((n - 7) * cell, 0)}${eye(0, (n - 7) * cell)}</svg>`;

const avatar = `data:image/png;base64,${(await sharp(path.join(ROOT, "public/avatar.webp")).resize(512, 512).png().toBuffer()).toString("base64")}`;
const font = (w) => [`inter-cyrillic-${w}-normal`, `inter-latin-${w}-normal`].map((f) => path.join(ROOT, "node_modules/@fontsource/inter/files", f + ".woff2")).filter(fs.existsSync)
  .map((f) => `@font-face{font-family:Inter;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(f).toString("base64")})}`).join("");
const avatarSize = hole * cell * 0.92;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${font(400)}${font(600)}${font(700)}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:Inter,sans-serif;color:#fff;-webkit-font-smoothing:antialiased;
  background:radial-gradient(120% 60% at 50% 38%,#26315f 0%,#121628 55%,#07080f 100%)}
body::before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgb(255 255 255/.10) 2px,transparent 2.4px);background-size:44px 44px;
  -webkit-mask:radial-gradient(70% 45% at 50% 52%,#000 30%,transparent 80%);mask:radial-gradient(70% 45% at 50% 52%,#000 30%,transparent 80%)}
.glow{position:absolute;left:50%;top:1500px;width:1300px;height:1300px;translate:-50% -50%;border-radius:50%;background:radial-gradient(circle,rgb(91 125 255/.45),transparent 62%);filter:blur(30px)}
.card{position:absolute;left:50%;top:1500px;translate:-50% -50%;width:${size + 120}px;padding:60px;border-radius:96px;background:#fff;box-shadow:0 60px 120px -30px rgb(0 0 0/.6),0 0 0 2px rgb(255 255 255/.4)}
.qr{position:relative;width:${size}px;height:${size}px}
.qr img{position:absolute;left:50%;top:50%;width:${avatarSize}px;height:${avatarSize}px;translate:-50% -50%;border-radius:50%;object-fit:cover;border:12px solid #fff;box-shadow:0 6px 18px rgb(0 0 0/.25)}
.who{position:absolute;left:0;right:0;top:${1500 + (size + 240) / 2 + 70}px;text-align:center}
.who b{display:block;font-size:76px;font-weight:700;letter-spacing:-.03em}
.who span{display:block;margin-top:18px;font-size:38px;color:rgb(255 255 255/.7)}
.who i{display:inline-block;margin-top:44px;font-style:normal;font-size:34px;font-weight:600;letter-spacing:.02em;color:#fff;padding:18px 34px;border-radius:99px;background:rgb(255 255 255/.12);border:2px solid rgb(255 255 255/.18)}
</style></head><body><div class="glow"></div>
<div class="card"><div class="qr">${svg}<img src="${avatar}"></div></div>
<div class="who"><b>Никита Алимпиев</b><span>Сайты с продвижением в нейросетях</span><i>nikalimp.ru/card</i></div>
</body></html>`;

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
await page.screenshot({ path: OUT, type: "png" });
await browser.close();
console.log(`✓ ${path.relative(ROOT, OUT)} (QR ${n}×${n}, ${URL})`);
