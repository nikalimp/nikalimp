import fs from "node:fs";
import path from "node:path";
import { typograf } from "./typograf.mjs";

// Библиотека шрифтов: Library/Fonts/fonts.json в vault NikitOS (собирает Library/Fonts/source/build.py).
// Превью названия — public/font-previews/<slug>.svg, образец текста — public/font-files/<slug>/<вес>[i].woff2 (подмножество глифов).
export type FontStyle = [number, number]; // вес, курсив 0/1
export type FontFamily = {
  s: string; n: string; c: boolean; st: FontStyle[]; about: string; a: { n: string; u: string }[];
  lic: string; allow: string; limit: string; zip?: string; pairs: string[]; sim: string[]; svg?: number; g?: string; gw?: FontStyle[];
};
type Base = { updated: string; sample: string; items: FontFamily[] };

const file = path.join(process.cwd(), "../Library/Fonts/fonts.json");
let cache: Base | null = null;
function base(): Base {
  if (cache) return cache;
  if (!fs.existsSync(file)) return (cache = { updated: "", sample: "", items: [] });
  const b: Base = JSON.parse(fs.readFileSync(file, "utf8"));
  b.items = b.items.map((i) => ({ ...i, about: typograf(i.about) }));
  return (cache = b);
}
export const getFonts = () => base().items;
export const getFontsMeta = () => ({ updated: base().updated, sample: base().sample });
export const getFont = (slug: string) => base().items.find((f) => f.s === slug);

export const WEIGHT: Record<number, string> = { 100: "Thin", 200: "ExtraLight", 300: "Light", 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold", 900: "Black" };
export const styleName = ([w, i]: FontStyle) => `${WEIGHT[w] ?? w}${i ? " Italic" : ""}`;
export const fileName = ([w, i]: FontStyle) => `${w}${i ? "i" : ""}`;

/** Первые буквы для навигации по каталогу */
export const fontLetter = (n: string) => { const c = n.trim().charAt(0).toUpperCase(); return /[A-ZА-ЯЁ]/.test(c) ? c : "#"; };
