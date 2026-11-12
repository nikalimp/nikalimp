// Обложки кейсов в стиле сайта: точечная сетка, плашка «тип · статус», бренд, суть проекта, главная цифра,
// браузер со скриншотом и телефон с мобильной версией. Результат — public/cases/<slug>/cover.webp (1600×1000).
//
//   node scripts/case-covers.mjs [<slug>]
//   PW_CHROMIUM=/путь/к/chromium — свой Chromium (облачная среда Claude: /opt/pw-browsers/chromium)
//
// Источники в public/cases/<slug>/: hero.webp (скриншот первого экрана) и mobile.webp (необязательно).
// Если в кейсе есть строки «coverShot:» и «coverPhone:», берутся указанные файлы.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright";

const ROOT = process.cwd();
const DIR = path.join(ROOT, "content/cases");
const only = process.argv[2];
const brand = JSON.parse(fs.readFileSync(path.join(ROOT, "content/factory/brand.json"), "utf8"));
const C = brand.colors;

const esc = (s = "") => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const uri = async (file) => `data:image/png;base64,${(await sharp(file).png().toBuffer()).toString("base64")}`;
const font = (w) => {
  const f = path.join(ROOT, `node_modules/@fontsource/inter/files/inter-cyrillic-${w}-normal.woff2`);
  const l = path.join(ROOT, `node_modules/@fontsource/inter/files/inter-latin-${w}-normal.woff2`);
  return [f, l].filter((x) => fs.existsSync(x)).map((x) => `@font-face{font-family:Inter;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(x).toString("base64")}) format("woff2")}`).join("");
};

function meta(file) {
  const raw = fs.readFileSync(file, "utf8");
  const fm = raw.match(/^---\n([\s\S]*?)\n---/)[1];
  const m = {}; const metrics = [];
  for (const line of fm.split("\n")) {
    const i = line.indexOf(":"); if (i <= 0) continue;
    const k = line.slice(0, i).trim(), v = line.slice(i + 1).trim().replace(/^"|"$/g, "");
    if (k === "metric") { const [a, b] = v.split("|").map((x) => x.trim()); metrics.push({ value: a, label: b }); } else m[k] = v;
  }
  return { ...m, metrics };
}

async function html(slug, c) {
  const dir = path.join(ROOT, "public/cases", slug);
  const shotFile = path.join(dir, c.coverShot || "hero.webp");
  const phoneFile = path.join(dir, c.coverPhone || "mobile.webp");
  const shot = fs.existsSync(shotFile) ? await uri(shotFile) : "";
  const phone = fs.existsSync(phoneFile) ? await uri(phoneFile) : "";
  const avatar = await uri(path.join(ROOT, "public/avatar.webp"));
  const sub = (c.title || "").includes(":") ? c.title.split(":").slice(1).join(":").trim() : c.title;
  const m = c.metrics[0];
  const host = c.site ? new URL(c.site).host.replace(/^www\./, "") : c.client.toLowerCase();
  const nameSize = c.client.length > 14 ? 76 : c.client.length > 9 ? 92 : 108;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${font(400)}${font(600)}${font(700)}
  :root{--bg:${C.bg};--fg:${C.fg};--mfg:${C.mfg};--border:${C.border};--muted:${C.muted};--brand:${C.brand};--brand-bg:${C.brandBg}}
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1600px;height:1000px;overflow:hidden;position:relative;background:var(--bg);color:var(--fg);font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased;
    background-image:radial-gradient(color-mix(in oklch,var(--fg) 16%,transparent) 1.4px,transparent 1.4px);background-size:32px 32px}
  .wrap{position:absolute;left:80px;top:80px;bottom:80px;width:600px;display:flex;flex-direction:column;z-index:3}
  .pill{align-self:flex-start;display:inline-flex;align-items:center;gap:12px;border-radius:999px;background:var(--brand-bg);color:var(--brand);padding:10px 20px;font-size:21px;font-weight:600}
  .dot{width:10px;height:10px;border-radius:50%;background:var(--brand)}
  h1{font-size:${nameSize}px;line-height:1;font-weight:700;letter-spacing:-.045em;margin-top:40px}
  .sub{font-size:31px;line-height:1.3;color:var(--mfg);margin-top:24px;max-width:560px;text-wrap:balance}
  .metric{margin-top:auto;margin-bottom:40px}
  .metric b{display:block;font-size:72px;line-height:1;font-weight:700;letter-spacing:-.04em;color:var(--brand)}
  .metric span{display:block;font-size:22px;color:var(--mfg);margin-top:10px;max-width:520px;line-height:1.35}
  .sign{display:flex;align-items:center;gap:16px;font-size:22px;color:var(--mfg)}
  .sign img{width:52px;height:52px;border-radius:50%;object-fit:cover;box-shadow:0 1px 3px rgb(0 0 0/.18)}
  .sign b{color:var(--fg);font-weight:600}
  .fade{position:absolute;inset:0;background:linear-gradient(90deg,var(--bg) 0 40%,color-mix(in oklch,var(--bg) 70%,transparent) 46%,transparent 54%);z-index:2}
  .frame{position:absolute;left:740px;top:110px;width:1020px;border-radius:20px;border:1px solid var(--border);background:var(--bg);overflow:hidden;z-index:1;
    box-shadow:0 40px 80px -24px rgb(0 0 0/.28),0 0 0 1px rgb(0 0 0/.03)}
  .bar{height:48px;display:flex;align-items:center;gap:10px;padding:0 20px;background:var(--muted);border-bottom:1px solid var(--border)}
  .bar i{width:13px;height:13px;border-radius:50%;background:oklch(0.86 0 0)}
  .bar span{margin-left:16px;font-size:16px;color:var(--mfg);background:var(--bg);border-radius:8px;padding:5px 16px;width:360px}
  .frame img{display:block;width:100%}
  .phone{position:absolute;left:640px;bottom:-40px;width:270px;height:560px;border-radius:44px;background:#111;padding:10px;z-index:4;
    box-shadow:0 40px 70px -20px rgb(0 0 0/.4)}
  .phone div{width:100%;height:100%;border-radius:35px;overflow:hidden;background:#fff}
  .phone img{display:block;width:100%}
  </style></head><body>
  ${shot ? `<div class="frame"><div class="bar"><i></i><i></i><i></i><span>${esc(host)}</span></div><img src="${shot}"></div>` : ""}
  <div class="fade"></div>
  ${phone ? `<div class="phone"><div><img src="${phone}"></div></div>` : ""}
  <div class="wrap">
    <span class="pill"><span class="dot"></span>${esc(c.type)} · ${esc(c.status)}</span>
    <h1>${esc(c.client)}</h1>
    <p class="sub">${esc(sub)}</p>
    ${m ? `<div class="metric"><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>` : '<div class="metric"></div>'}
    <div class="sign"><img src="${avatar}"><span><b>${esc(brand.author)}</b> · ${esc(brand.siteLabel)}</span></div>
  </div></body></html>`;
}

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".md"))) {
  const slug = f.replace(/\.md$/, "");
  if (only && only !== slug) continue;
  const c = meta(path.join(DIR, f));
  await page.setContent(await html(slug, c), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: "png" });
  await sharp(png).webp({ quality: 86 }).toFile(path.join(ROOT, "public/cases", slug, "cover.webp"));
  console.log(`✓ ${slug}/cover.webp`);
}
await browser.close();
