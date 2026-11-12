// Контент-завод (скилл /content): скриншоты, фото, обложки и инфографика статей в фирменном стиле проекта.
// Оригинал — NikitOS/.claude/plugins/website/skills/content/tools/media/media.mjs; в проекты копируется как есть.
// Бренд (цвета, шрифт, автор, аватар, логотипы, CTA) — brand.json проекта; пути в нём — относительно самого brand.json.
//
//   node media.mjs [--brand brand.json] [--specs content/media] [--out public/blog] [--root .] [<slug>] [--force]
//   — отрисовать новое и изменённое (по хэшу спецификации) или одну статью
//   PW_CHROMIUM=/путь/к/chromium — свой Chromium (облачная среда Claude); в CI — npx playwright install chromium
//   MEDIA_OFFLINE=1              — без сети: скриншоты пропускаются, на обложке заглушка (превью)
//
// Схема <specs>/<slug>.json:
// {
//   "cover": { "layout": "shot" | "logos" | "type" | "photo", "title": "до 60 знаков", "kicker": "Рубрика",
//              "shot": "shot-1", "logos": ["имя-svg", "favicon:tilda.cc"], "accent": "цифра или слово",
//              "photo": "путь от --root", "focus": 0.5 },
//   "photos": [ { "name": "photo-1", "src": "путь от --root", "width": 1600 } ],
//   "shots": [ { "name": "shot-1", "url": "https://…", "width": 1440, "height": 900, "scroll": 0,
//                "hide": [".cookie"], "dark": false, "wait": 1500 } ],
//   "graphics": [ { "name": "info-1", "type": "steps|compare|stats|bars|checklist|quote|timeline",
//                   "title": "…", "subtitle": "…", "data": …, "source": "Источник: …" } ],
//   "telegram": { "text": "HTML-подпись поста для Telegram и Max" }
// }
// Результат: <out>/<slug>/cover.jpg, shot-N.jpg, photo-N.jpg, info-N.png
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const ROOT = path.resolve(opt("--root", process.cwd()));
const SPEC_DIR = path.resolve(opt("--specs", "content/media"));
const OUT_DIR = path.resolve(opt("--out", "public/blog"));
const STATE = path.join(SPEC_DIR, ".rendered.json");
const HERE = path.dirname(fileURLToPath(import.meta.url));
const force = args.includes("--force");
const valued = new Set(["--brand", "--specs", "--out", "--root"]);
const only = args.find((a, i) => !a.startsWith("--") && !valued.has(args[i - 1]));
const offline = process.env.MEDIA_OFFLINE === "1";

// ---------- бренд ----------
const BRAND_FILE = opt("--brand", process.env.MEDIA_BRAND || "");
const B = BRAND_FILE ? JSON.parse(fs.readFileSync(BRAND_FILE, "utf8")) : {};
const bpath = (p) => (p ? path.resolve(path.dirname(path.resolve(BRAND_FILE || ".")), p) : "");
const C = { bg: "oklch(1 0 0)", fg: "oklch(0.205 0 0)", card: "oklch(0.99 0 0)", muted: "oklch(0.97 0 0)", mfg: "oklch(0.52 0 0)",
  border: "oklch(0.922 0 0)", brand: "oklch(0.55 0.15 255)", brandBg: "oklch(0.97 0.02 255)", onBrand: "#fff", shade: "rgb(28 28 30)", ...(B.colors || {}) };
const AUTHOR = B.author ?? "";
const SITE_LABEL = B.siteLabel ?? (B.site ? new URL(B.site).host : "");
const NAME = B.name ?? SITE_LABEL;
const RADIUS = B.radius ?? 14;

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Висячие предлоги и союзы — к следующему слову, как типограф на сайте
const nb = (s = "") => esc(s).replace(/(^|[\s(«])([а-яёА-ЯЁa-zA-Z]{1,3}|без|для|при|под|над|про|что|как|или|через)\s+/g, "$1$2 ").replace(/\s+—/g, " —");
const dataUri = (file, mime) => `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;

// Шрифт: brand.font = { family, source: "fontsource:inter" } (пакет @fontsource-variable/<имя> в node_modules проекта
// или рядом со скриптом) или { family, files: [{ path, weight }] } — свои .woff2/.otf/.ttf
function fontFaces() {
  const f = B.font || { family: "Inter", source: "fontsource:inter" };
  const fam = f.family || "Inter";
  const mime = (p) => (p.endsWith(".woff2") ? "font/woff2" : p.endsWith(".otf") ? "font/otf" : "font/ttf");
  if (f.files) return f.files.map((x) => `@font-face{font-family:"${fam}";font-weight:${x.weight || 400};font-display:block;src:url(${dataUri(bpath(x.path), mime(x.path))})}`).join("");
  const pkg = (f.source || "fontsource:inter").replace("fontsource:", "");
  for (const base of [path.join(process.cwd(), "node_modules"), path.join(HERE, "node_modules")]) {
    const dir = path.join(base, "@fontsource-variable", pkg, "files");
    if (!fs.existsSync(dir)) continue;
    return ["latin", "cyrillic"].map((s) => path.join(dir, `${pkg}-${s}-wght-normal.woff2`)).filter((p) => fs.existsSync(p))
      .map((p) => `@font-face{font-family:"${fam}";font-weight:100 900;font-display:block;src:url(${dataUri(p, "font/woff2")}) format("woff2")}`).join("");
  }
  console.warn(`  ! шрифт ${pkg} не найден — npm i @fontsource-variable/${pkg}`);
  return "";
}
const FAMILY = (B.font && B.font.family) || "Inter";

// Токены из src/app/globals.css (shadcn neutral + единственный акцент — синий)
const BASE_CSS = () => `${fontFaces()}
:root{--bg:${C.bg};--fg:${C.fg};--card:${C.card};--muted:${C.muted};--mfg:${C.mfg};
--border:${C.border};--brand:${C.brand};--brand-bg:${C.brandBg};--on-brand:${C.onBrand};--r:${RADIUS}px}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--bg);color:var(--fg);font-family:"${FAMILY}",system-ui,sans-serif;-webkit-font-smoothing:antialiased;
font-feature-settings:"cv11","ss01";text-wrap:pretty}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.08em}
.pill{display:inline-flex;align-items:center;gap:10px;border-radius:999px;background:var(--brand-bg);color:var(--brand);padding:8px 16px;font-size:17px;font-weight:600}
.dot{width:8px;height:8px;border-radius:50%;background:var(--brand)}
.grid-bg{${B.pattern === "none" ? "" : "background-image:radial-gradient(color-mix(in oklch,var(--fg) 18%,transparent) 1.2px,transparent 1.2px);background-size:28px 28px"}}
.sign{display:flex;align-items:center;gap:14px;font-size:20px;color:var(--mfg)}
.sign img{width:44px;height:44px;border-radius:50%;object-fit:cover;box-shadow:0 1px 3px rgb(0 0 0/.18)}
.sign img.logo{width:auto;height:36px;border-radius:0;box-shadow:none}
.sign b{color:var(--fg);font-weight:600}
`;

const imgMime = (p) => ({ ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" })[path.extname(p).toLowerCase()] || "image/png";
function avatar() {
  const p = bpath(B.avatar);
  return p && fs.existsSync(p) ? dataUri(p, imgMime(p)) : "";
}
function signature() {
  const logo = bpath(B.logo);
  if (logo && fs.existsSync(logo) && !AUTHOR) return `<div class="sign"><img class="logo" src="${dataUri(logo, imgMime(logo))}"><span>${esc(SITE_LABEL)}</span></div>`;
  return `<div class="sign">${avatar() ? `<img src="${avatar()}">` : ""}<span>${AUTHOR ? `<b>${esc(AUTHOR)}</b> · ` : ""}${esc(SITE_LABEL)}</span></div>`;
}

function browserFrame(src, url = "") {
  const host = url ? new URL(url).host.replace(/^www\./, "") : "";
  return `<div class="frame"><div class="bar"><i></i><i></i><i></i><span>${esc(host)}</span></div>
  ${src ? `<img src="${src}">` : `<div class="ph">скриншот появится при сборке</div>`}</div>`;
}
const FRAME_CSS = `.frame{border-radius:16px;border:1px solid var(--border);background:var(--bg);overflow:hidden;
box-shadow:0 30px 60px -20px rgb(0 0 0/.25),0 0 0 1px rgb(0 0 0/.02)}
.frame .bar{height:40px;display:flex;align-items:center;gap:8px;padding:0 16px;background:var(--muted);border-bottom:1px solid var(--border)}
.frame .bar i{width:11px;height:11px;border-radius:50%;background:oklch(0.86 0 0)}
.frame .bar span{margin-left:14px;font-size:14px;color:var(--mfg);background:var(--bg);border-radius:6px;padding:4px 14px;flex:1;max-width:340px}
.frame img{display:block;width:100%}.frame .ph{height:520px;display:grid;place-items:center;color:var(--mfg);font-size:18px;background:var(--muted)}`;

function logoSrc(key) {
  if (key.startsWith("favicon:")) return { src: `https://www.google.com/s2/favicons?domain=${key.slice(8)}&sz=128`, label: key.slice(8) };
  const dir = bpath(B.logosDir) || path.join(ROOT, "public/logos");
  const p = [".svg", ".png", ".webp"].map((e) => path.join(dir, key + e)).find((x) => fs.existsSync(x));
  return p ? { src: dataUri(p, imgMime(p)), label: key } : null;
}

// ---------- обложка-фото: кадр на весь формат, затемнение снизу, светлый текст ----------
function photoCoverHtml(c) {
  const p = path.resolve(ROOT, c.photo || "");
  const src = c.photo && fs.existsSync(p) ? dataUri(p, imgMime(p)) : "";
  const len = (c.title || "").length;
  const size = len > 48 ? 58 : len > 34 ? 66 : 76;
  const fx = Math.round((c.focus ?? 0.5) * 100), fy = Math.round((c.focusY ?? 0.5) * 100);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS()}
  body{width:1200px;height:630px;overflow:hidden;position:relative;background:${C.shade}}
  .ph{position:absolute;inset:0;background:url(${src}) ${fx}% ${fy}%/cover no-repeat}
  .sh{position:absolute;inset:0;background:linear-gradient(180deg,color-mix(in srgb,${C.shade} 45%,transparent) 0,transparent 26%,transparent 38%,color-mix(in srgb,${C.shade} 92%,transparent) 100%)}
  .wrap{position:absolute;inset:0;padding:52px 60px;display:flex;flex-direction:column;justify-content:space-between;color:#fff}
  h1{font-size:${size}px;line-height:1.04;font-weight:650;letter-spacing:-.035em;max-width:1000px;margin-top:20px}
  .pill{background:rgb(255 255 255/.16);color:#fff;backdrop-filter:blur(6px)}.dot{background:#fff}
  .sign,.sign b{color:#fff}</style></head><body><div class="ph"></div><div class="sh"></div>
  <div class="wrap">${signature()}<div>${c.kicker ? `<span class="pill"><span class="dot"></span>${esc(c.kicker)}</span>` : ""}<h1>${nb(c.title)}</h1></div></div></body></html>`;
}

// ---------- обложка 1200×630 (@2x) ----------
function coverHtml(c, slug) {
  if (c.layout === "photo") return photoCoverHtml(c);
  const title = nb(c.title);
  const len = (c.title || "").length;
  const size = len > 48 ? 58 : len > 34 ? 66 : 76;
  const kicker = c.kicker ? `<span class="pill"><span class="dot"></span>${esc(c.kicker)}</span>` : "";
  let right = "";
  if (c.layout === "shot") {
    const f = path.join(OUT_DIR, slug, `${c.shot || "shot-1"}.jpg`);
    const shotSpec = (c._shots || []).find((s) => s.name === (c.shot || "shot-1"));
    right = `<div class="right shot">${browserFrame(fs.existsSync(f) ? dataUri(f, "image/jpeg") : "", shotSpec?.url)}</div>`;
  } else if (c.layout === "logos") {
    const tiles = (c.logos || []).map(logoSrc).filter(Boolean).slice(0, 9)
      .map((l) => `<div class="tile"><img src="${l.src}" alt=""></div>`).join("");
    right = `<div class="right logos">${tiles}</div>`;
  } else {
    const al = (c.accent || "").length;
    const asz = al <= 3 ? 190 : al <= 5 ? 140 : al <= 9 ? 104 : 76;
    right = c.accent ? `<div class="right accent"><div class="big" style="font-size:${asz}px">${nb(c.accent)}</div></div>` : "";
  }
  const wide = c.layout === "type" && !c.accent;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS()}${FRAME_CSS}
  body{width:1200px;height:630px;overflow:hidden;position:relative}
  .wrap{position:absolute;inset:0;padding:56px 60px;display:flex;flex-direction:column;justify-content:space-between;width:${wide ? 1080 : 600}px;z-index:2}
  h1{font-size:${size}px;line-height:1.04;font-weight:650;letter-spacing:-.035em;margin-top:28px}
  .right{position:absolute;z-index:1}
  .shot{left:640px;top:70px;width:720px}
  .logos{right:56px;top:50%;transform:translateY(-50%);width:470px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
  .tile{aspect-ratio:1.25;border:1px solid var(--border);border-radius:var(--r);background:var(--bg);display:grid;place-items:center;padding:22px;box-shadow:0 8px 24px -12px rgb(0 0 0/.15)}
  .tile img{max-width:100%;max-height:64px;object-fit:contain}
  .accent{right:56px;top:56px;bottom:56px;width:470px;border-radius:24px;background:var(--brand);display:grid;place-items:center;color:var(--on-brand);overflow:hidden}
  .accent .big{font-size:150px;font-weight:700;letter-spacing:-.06em;line-height:.9;text-align:center;padding:20px}
  .fade{position:absolute;inset:0;background:linear-gradient(90deg,var(--bg) 0 46%,transparent 62%);z-index:1}
  </style></head><body class="grid-bg">${c.layout === "shot" ? '<div class="fade"></div>' : ""}${right}
  <div class="wrap"><div>${kicker}<h1>${title}</h1></div>${signature()}</div></body></html>`;
}

// ---------- инфографика: ширина 1200, высота по содержимому (@2x) ----------
const G_CSS = `body{width:1200px;padding:56px 60px 48px}
.card{}
.head .mono{font-size:15px;color:var(--brand);margin-bottom:14px}
h2{font-size:44px;line-height:1.1;font-weight:650;letter-spacing:-.03em;max-width:1000px}
.sub{font-size:22px;color:var(--mfg);margin-top:12px;max-width:960px;line-height:1.4}
.body{margin-top:40px}
.foot{display:flex;justify-content:space-between;align-items:center;margin-top:40px;padding-top:22px;border-top:1px solid var(--border);font-size:16px;color:var(--mfg)}
.foot b{color:var(--fg);font-weight:600}
.steps{display:grid;gap:14px}
.step{display:grid;grid-template-columns:64px 1fr;gap:20px;align-items:start;border:1px solid var(--border);border-radius:var(--r);padding:22px 24px;background:var(--card)}
.step .n{width:48px;height:48px;border-radius:12px;background:var(--brand-bg);color:var(--brand);display:grid;place-items:center;font-weight:700;font-size:22px}
.step h3,.col h3,.item h3{font-size:24px;font-weight:600;letter-spacing:-.01em}
.step p,.item p{font-size:19px;color:var(--mfg);margin-top:6px;line-height:1.45}
.cmp{display:grid;gap:0;border:1px solid var(--border);border-radius:var(--r);overflow:hidden}
.cmp .row{display:grid;border-top:1px solid var(--border)}.cmp .row:first-child{border-top:0}
.cmp .row>div{padding:18px 22px;font-size:19px;line-height:1.4;border-left:1px solid var(--border)}.cmp .row>div:first-child{border-left:0;color:var(--mfg)}
.cmp .hd>div{font-weight:600;font-size:20px;background:var(--muted);color:var(--fg)!important}
.cmp .hd>div.win{background:var(--brand);color:var(--on-brand)!important}
.stats{display:grid;gap:16px}
.stat{border:1px solid var(--border);border-radius:var(--r);padding:28px;background:var(--card)}
.stat .v{font-size:64px;font-weight:700;letter-spacing:-.04em;line-height:1;color:var(--brand)}
.stat .l{font-size:19px;color:var(--mfg);margin-top:12px;line-height:1.4}
.bars{display:grid;gap:18px}
.bar{display:grid;grid-template-columns:300px 1fr 110px;gap:20px;align-items:center;font-size:20px}
.bar .t{height:34px;border-radius:8px;background:var(--muted);overflow:hidden}.bar .t i{display:block;height:100%;background:var(--brand);border-radius:8px}
.bar.dim .t i{background:oklch(0.8 0 0)}
.bar .v{font-weight:650;text-align:right}
.check{display:grid;grid-template-columns:1fr 1fr;gap:12px 28px}
.check .it{display:grid;grid-template-columns:30px 1fr;gap:14px;font-size:20px;line-height:1.4;padding:10px 0;border-bottom:1px solid var(--border)}
.check .it .b{width:26px;height:26px;border-radius:7px;border:2px solid var(--brand);display:grid;place-items:center;color:var(--brand);font-weight:800;font-size:16px;margin-top:2px}
.quote{border-left:4px solid var(--brand);padding:8px 0 8px 36px}
.quote p{font-size:40px;line-height:1.25;font-weight:550;letter-spacing:-.02em}
.quote .who{font-size:20px;color:var(--mfg);margin-top:22px}
.tl{position:relative;display:grid;gap:22px;padding-left:40px}
.tl:before{content:"";position:absolute;left:11px;top:8px;bottom:8px;width:2px;background:var(--border)}
.tl .item{position:relative}.tl .item:before{content:"";position:absolute;left:-36px;top:6px;width:16px;height:16px;border-radius:50%;background:var(--bg);border:3px solid var(--brand)}
.tl .when{font-size:15px;color:var(--brand)}`;

function graphicBody(g) {
  const d = g.data || [];
  switch (g.type) {
    case "steps": return `<div class="steps">${d.map((s, i) => `<div class="step"><div class="n">${i + 1}</div><div><h3>${nb(s.title)}</h3>${s.text ? `<p>${nb(s.text)}</p>` : ""}</div></div>`).join("")}</div>`;
    case "compare": {
      const cols = d.columns || []; const win = d.highlight ?? -1;
      const tpl = `grid-template-columns:${d.labelWidth || 260}px repeat(${cols.length},1fr)`;
      return `<div class="cmp"><div class="row hd" style="${tpl}"><div></div>${cols.map((c, i) => `<div class="${i === win ? "win" : ""}">${nb(c)}</div>`).join("")}</div>
      ${(d.rows || []).map((r) => `<div class="row" style="${tpl}"><div>${nb(r[0])}</div>${r.slice(1).map((c) => `<div>${nb(c)}</div>`).join("")}</div>`).join("")}</div>`;
    }
    case "stats": return `<div class="stats" style="grid-template-columns:repeat(${Math.min(d.length, 3)},1fr)">${d.map((s) => `<div class="stat"><div class="v">${esc(s.value)}</div><div class="l">${nb(s.label)}</div></div>`).join("")}</div>`;
    case "bars": {
      const max = Math.max(...d.map((b) => +b.value || 0), 1);
      return `<div class="bars">${d.map((b) => `<div class="bar ${b.dim ? "dim" : ""}"><div>${nb(b.label)}</div><div class="t"><i style="width:${Math.max(2, (100 * (+b.value || 0)) / max)}%"></i></div><div class="v">${esc(b.display ?? b.value)}</div></div>`).join("")}</div>`;
    }
    case "checklist": return `<div class="check">${d.map((t) => `<div class="it"><div class="b">✓</div><div>${nb(t)}</div></div>`).join("")}</div>`;
    case "quote": return `<div class="quote"><p>«${nb(d.text)}»</p>${d.who ? `<div class="who">${nb(d.who)}</div>` : ""}</div>`;
    case "timeline": return `<div class="tl">${d.map((s) => `<div class="item"><div class="mono when">${esc(s.when)}</div><h3>${nb(s.title)}</h3>${s.text ? `<p>${nb(s.text)}</p>` : ""}</div>`).join("")}</div>`;
    default: throw new Error(`Неизвестный тип инфографики: ${g.type}`);
  }
}

const graphicHtml = (g) => `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS()}${G_CSS}</style></head><body>
<div class="head">${g.kicker ? `<div class="mono">${esc(g.kicker)}</div>` : ""}<h2>${nb(g.title)}</h2>${g.subtitle ? `<p class="sub">${nb(g.subtitle)}</p>` : ""}</div>
<div class="body">${graphicBody(g)}</div>
<div class="foot"><span>${g.source ? nb(g.source) : ""}</span><span><b>${esc(NAME)}</b>${SITE_LABEL && SITE_LABEL !== NAME ? ` · ${esc(SITE_LABEL)}` : ""}</span></div></body></html>`;

// ---------- рендер ----------
async function launch() {
  const { chromium } = await import("playwright");
  return chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
}

async function shot(browser, s, file) {
  const ctx = await browser.newContext({ viewport: { width: s.width || 1440, height: s.height || 900 }, deviceScaleFactor: 1,
    colorScheme: s.dark ? "dark" : "light", locale: "ru-RU",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36" });
  const page = await ctx.newPage();
  try {
    await page.goto(s.url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => page.waitForTimeout(3000));
    await page.waitForTimeout(s.wait ?? 1500);
    const hide = ["[class*=cookie]", "[id*=cookie]", "[class*=consent]", ...(s.hide || [])];
    await page.addStyleTag({ content: `${hide.join(",")}{display:none!important}` }).catch(() => {});
    if (s.scroll) { await page.evaluate((y) => window.scrollTo(0, y), s.scroll); await page.waitForTimeout(600); }
    await page.screenshot({ path: file, type: "jpeg", quality: 82, fullPage: !!s.fullPage });
    return true;
  } catch (e) {
    console.warn(`  ! скриншот ${s.url}: ${e.message.split("\n")[0]}`);
    return false;
  } finally { await ctx.close(); }
}

async function renderHtml(browser, html, file, { w = 1200, h = null, type = "png", scale = 2 } = {}) {
  const page = await browser.newPage({ viewport: { width: w, height: h || 100 }, deviceScaleFactor: scale });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const opts = { path: file, type, ...(type === "jpeg" ? { quality: 86 } : {}) };
  if (h) await page.screenshot({ ...opts, clip: { x: 0, y: 0, width: w, height: h } });
  else await page.screenshot({ ...opts, fullPage: true });
  await page.close();
}

async function main() {
  if (!fs.existsSync(SPEC_DIR)) { console.log("media: нет content/media — пропускаю"); return; }
  const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")) : {};
  const skip = new Set(["channels.json", "brand.json"]);
  const specs = fs.readdirSync(SPEC_DIR).filter((f) => f.endsWith(".json") && !f.startsWith(".") && !skip.has(f) && !f.endsWith(".config.json"))
    .map((f) => f.replace(/\.json$/, "")).filter((s) => !only || s === only);
  const todo = specs.filter((slug) => {
    const raw = fs.readFileSync(path.join(SPEC_DIR, `${slug}.json`), "utf8");
    const hash = crypto.createHash("sha1").update(raw).digest("hex").slice(0, 12);
    return force || state[slug] !== hash || !fs.existsSync(path.join(OUT_DIR, slug, "cover.jpg"));
  });
  if (!todo.length) { console.log("media: всё отрисовано"); return; }
  const browser = await launch();
  for (const slug of todo) {
    const raw = fs.readFileSync(path.join(SPEC_DIR, `${slug}.json`), "utf8");
    const spec = JSON.parse(raw);
    const dir = path.join(OUT_DIR, slug);
    fs.mkdirSync(dir, { recursive: true });
    console.log(`media: ${slug}`);
    for (const s of spec.shots || []) {
      const f = path.join(dir, `${s.name}.jpg`);
      if (offline || !s.url) continue; // без url — файл положили руками
      if (fs.existsSync(f) && !force && !s.refresh) continue;
      if (await shot(browser, s, f)) console.log(`  ✓ ${s.name}.jpg`);
    }
    for (const ph of spec.photos || []) { // фото работ: уменьшить до ширины и сжать
      const p = path.resolve(ROOT, ph.src);
      if (!fs.existsSync(p)) { console.warn(`  ! нет фото ${ph.src}`); continue; }
      const w = ph.width || 1600;
      await renderHtml(browser, `<!doctype html><style>*{margin:0}body{width:${w}px}img{display:block;width:100%}</style><img src="${dataUri(p, imgMime(p))}">`,
        path.join(dir, `${ph.name}.jpg`), { w, type: "jpeg", scale: 1 });
      console.log(`  ✓ ${ph.name}.jpg`);
    }
    for (const g of spec.graphics || []) {
      await renderHtml(browser, graphicHtml(g), path.join(dir, `${g.name}.png`));
      console.log(`  ✓ ${g.name}.png`);
    }
    if (spec.cover) {
      await renderHtml(browser, coverHtml({ ...spec.cover, _shots: spec.shots }, slug), path.join(dir, "cover.jpg"), { w: 1200, h: 630, type: "jpeg" });
      console.log("  ✓ cover.jpg");
    }
    if (!offline) state[slug] = crypto.createHash("sha1").update(raw).digest("hex").slice(0, 12);
  }
  await browser.close();
  fs.writeFileSync(STATE, JSON.stringify(state, null, 1) + "\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
