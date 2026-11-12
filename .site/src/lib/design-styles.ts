import fs from "node:fs";
import path from "node:path";
import { typograf } from "./typograf.mjs";

// Библиотека «Дизайн-направления»: Library/DesignStyles/<slug>.md в vault NikitOS.
// Обложка каждого направления — живая сцена в components/style-cover.tsx (тот же slug).
// Frontmatter: name, title, description, short, also, palette (HEX через запятую), fonts, related (slug через запятую).
export type DesignStyle = {
  slug: string; name: string; title: string; description: string; short: string; also: string[];
  palette: string[]; fonts: string[]; related: string[]; body: string; faq: { q: string; a: string }[]; order: number;
};

// Порядок карточек в каталоге
export const STYLE_ORDER = [
  "particles", "holography", "morphing", "neon", "wireframe", "glassmorphism", "kinetic-typography", "isometric", "claymorphism", "ascii-art",
  "gradient", "comic", "split-flap", "retro-vhs", "halftone", "bauhaus", "pixel-art", "blueprint", "art-deco", "neobrutalism",
];

const dir = path.join(process.cwd(), "../Library/DesignStyles");
const list = (s = "") => s.split(",").map((x) => x.trim()).filter(Boolean);

function parse(file: string): DesignStyle | null {
  const raw = fs.readFileSync(path.join(dir, file), "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) { const i = line.indexOf(":"); if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, ""); }
  const slug = file.replace(/\.md$/, "");
  const body = m[2].trim();
  const faqPart = body.split(/^## Частые вопросы\s*$/m)[1] ?? "";
  const faq = faqPart.split(/^### /m).slice(1).map((b) => { const [q, ...a] = b.split("\n"); return { q: typograf(q.trim()), a: typograf(a.join(" ").replace(/\s+/g, " ").trim()) }; }).filter((x) => x.q && x.a);
  return {
    slug, name: meta.name ?? slug, title: typograf(meta.title ?? ""), description: typograf(meta.description ?? ""), short: typograf(meta.short ?? ""),
    also: list(meta.also), palette: list(meta.palette).filter((c) => /^#[0-9a-f]{3,8}$/i.test(c)), fonts: list(meta.fonts), related: list(meta.related),
    // Промпт в блоке кода Типограф не трогает: его копируют как есть
    body: body.split(/(```[\s\S]*?```)/).map((part) => (part.startsWith("```") ? part : typograf(part))).join(""),
    faq, order: STYLE_ORDER.indexOf(slug) < 0 ? 99 : STYLE_ORDER.indexOf(slug),
  };
}

let cache: DesignStyle[] | null = null;
export function getDesignStyles(): DesignStyle[] {
  if (cache) return cache;
  if (!fs.existsSync(dir)) return (cache = []);
  return (cache = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map(parse).filter((x): x is DesignStyle => !!x).sort((a, b) => a.order - b.order));
}
export const getDesignStyle = (slug: string) => getDesignStyles().find((s) => s.slug === slug);
