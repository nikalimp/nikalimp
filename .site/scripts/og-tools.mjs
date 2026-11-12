// OG-картинки 1200×630 для страниц инструментов с расширенной карточкой (раздел «## Карточка»).
// Запускается перед сборкой; картинки — в public/og/tools/ (в .gitignore), страница подключает их, если файл есть.
import fs from "node:fs";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const root = process.cwd();
const dir = path.join(root, "..", "Library", "Tools");
const out = path.join(root, "public", "og", "tools");
if (!fs.existsSync(path.join(dir, "tools.csv"))) { console.log("og-tools: нет Library/Tools — пропускаю"); process.exit(0); }
fs.mkdirSync(out, { recursive: true });

const font = (w) => fs.readFileSync(path.join(root, "node_modules/@fontsource/inter/files", `inter-cyrillic-${w}-normal.woff`));
const latin = (w) => fs.readFileSync(path.join(root, "node_modules/@fontsource/inter/files", `inter-latin-${w}-normal.woff`));
const fonts = [400, 600].flatMap((w) => [{ name: "Inter", data: latin(w), weight: w }, { name: "Inter", data: font(w), weight: w }]);

const csv = fs.readFileSync(path.join(dir, "tools.csv"), "utf8").replace(/^﻿/, "").split("\n").slice(1).filter(Boolean)
  .map((l) => { const c = []; let cur = "", q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === "," && !q) { c.push(cur); cur = ""; } else cur += ch; } c.push(cur); return c; });
const SPECIAL = new Set(["claude", "readme", "telegram", "tilda", "wordpress"]);
const fileName = (n) => n.replace(/:/g, "-").replace(/\//g, " ") + (SPECIAL.has(n.toLowerCase()) ? " (инструмент)" : "");
const section = (md, t) => md.match(new RegExp(`^## ${t}\\s*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, "m"))?.[1].trim() ?? "";
const plain = (s) => s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b ?? a).replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`#]/g, "").replace(/\s+/g, " ").trim();

// Очередь публикации (publish-queue.txt): эти инструменты на сайт пока не выходят — картинки не нужны
const qf = path.join(dir, "publish-queue.txt");
const queue = new Set(fs.existsSync(qf) ? fs.readFileSync(qf, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")) : []);

let n = 0;
for (const [name, category, sub, , , slug] of csv) {
  if (queue.has(name)) continue;
  const file = path.join(dir, `${fileName(name)}.md`);
  if (!slug || !fs.existsSync(file)) continue;
  const md = fs.readFileSync(file, "utf8");
  const card = section(md, "Карточка");
  if (!card || !section(md, "Описание")) continue;
  const russia = card.match(/Россия:\s*(.+)/)?.[1]?.trim() ?? "";
  let lead = plain(section(md, "Описание").split(/\n\s*\n/)[0]);
  if (lead.length > 150) lead = lead.slice(0, lead.lastIndexOf(" ", 146)) + "…";
  const r = russia.toLowerCase(); const ok = !r.includes("не") && !r.includes("vpn") && !r.includes("карт") && r.includes("работ"), blocked = r.includes("не") && r.includes("работ");
  const tone = ok ? ["#e7f6ee", "#137a43"] : blocked ? ["#fdecec", "#b42318"] : ["#fff4e0", "#9a5b00"];
  const el = {
    type: "div", props: { style: { width: 1200, height: 630, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#ffffff", fontFamily: "Inter", color: "#111" },
      children: [
        { type: "div", props: { style: { display: "flex", fontSize: 26, color: "#6b7280" }, children: `Инструменты · ${sub || category}` } },
        { type: "div", props: { style: { display: "flex", flexDirection: "column" }, children: [
          { type: "div", props: { style: { fontSize: 84, fontWeight: 600, letterSpacing: -2 }, children: name } },
          { type: "div", props: { style: { marginTop: 20, fontSize: 32, lineHeight: 1.35, color: "#4b5563", maxWidth: 1000 }, children: lead } },
        ] } },
        { type: "div", props: { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
          russia ? { type: "div", props: { style: { display: "flex", fontSize: 26, padding: "10px 22px", borderRadius: 999, background: tone[0], color: tone[1] }, children: ok ? "Работает в России" : blocked ? "Не работает в России" : `В России: ${russia}` } } : { type: "div", props: { children: "" } },
          { type: "div", props: { style: { display: "flex", fontSize: 28, fontWeight: 600, color: "#1f6feb" }, children: "nikalimp.ru" } },
        ] } },
      ] },
  };
  const svg = await satori(el, { width: 1200, height: 630, fonts });
  fs.writeFileSync(path.join(out, `${slug}.png`), new Resvg(svg).render().asPng());
  n++;
}
console.log(`og-tools: ${n} картинок`);
