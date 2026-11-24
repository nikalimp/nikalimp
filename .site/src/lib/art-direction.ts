import fs from "node:fs";
import path from "node:path";
import { typograf } from "./typograf.mjs";

// Библиотека «Художественные направления»: Library/DesignStyles/<slug>.md.
// Обложка каждого направления — статичный WebP в public/art-direction/<slug>.webp.
// Frontmatter: name, title, description, short, group, also, palette (HEX через запятую), fonts, related (slug через запятую), coverAlt, artwork.
export const ART_DIRECTION_GROUPS = [
  "Классика и живопись",
  "Авангард и XX век",
  "Графика и печать",
  "Цифровой дизайн",
] as const;

export type ArtDirectionGroup = (typeof ART_DIRECTION_GROUPS)[number];

export type ArtDirection = {
  slug: string;
  name: string;
  title: string;
  description: string;
  short: string;
  group: ArtDirectionGroup;
  also: string[];
  palette: string[];
  fonts: string[];
  related: string[];
  coverAlt: string;
  artwork?: string;
  body: string;
  faq: { q: string; a: string }[];
  order: number;
};

// Порядок карточек в каталоге (внутри групп и в общем списке)
export const ART_DIRECTION_ORDER = [
  // Классика и живопись
  "impressionism", "oil-painting", "classical-sculpture", "renaissance", "baroque", "rococo",
  "classicism", "romanticism", "realism", "post-impressionism", "art-nouveau", "watercolor", "ukiyo-e", "engraving",
  // Авангард и XX век
  "expressionism", "cubism", "surrealism", "fauvism", "abstract-art", "suprematism", "constructivism",
  "bauhaus", "art-deco", "pop-art", "minimalism",
  // Графика и печать
  "swiss-style", "neobrutalism", "risograph", "collage", "comic", "halftone", "blueprint",
  // Цифровой дизайн
  "glassmorphism", "claymorphism", "cyberpunk", "neon", "gradient", "holography", "isometric",
  "pixel-art", "retro-vhs", "kinetic-typography", "particles", "morphing", "wireframe", "ascii-art", "split-flap",
];

const G_CLASSIC = ART_DIRECTION_GROUPS[0];
const G_AVANT = ART_DIRECTION_GROUPS[1];
const G_PRINT = ART_DIRECTION_GROUPS[2];
const G_DIGITAL = ART_DIRECTION_GROUPS[3];

const DEFAULT_GROUP: Record<string, ArtDirectionGroup> = {
  impressionism: G_CLASSIC,
  "oil-painting": G_CLASSIC,
  "classical-sculpture": G_CLASSIC,
  renaissance: G_CLASSIC,
  baroque: G_CLASSIC,
  rococo: G_CLASSIC,
  classicism: G_CLASSIC,
  romanticism: G_CLASSIC,
  realism: G_CLASSIC,
  "post-impressionism": G_CLASSIC,
  "art-nouveau": G_CLASSIC,
  watercolor: G_CLASSIC,
  "ukiyo-e": G_CLASSIC,
  engraving: G_CLASSIC,
  expressionism: G_AVANT,
  cubism: G_AVANT,
  surrealism: G_AVANT,
  fauvism: G_AVANT,
  "abstract-art": G_AVANT,
  suprematism: G_AVANT,
  constructivism: G_AVANT,
  bauhaus: G_AVANT,
  "art-deco": G_AVANT,
  "pop-art": G_AVANT,
  minimalism: G_AVANT,
  "swiss-style": G_PRINT,
  neobrutalism: G_PRINT,
  risograph: G_PRINT,
  collage: G_PRINT,
  comic: G_PRINT,
  halftone: G_PRINT,
  blueprint: G_PRINT,
};

const dir = path.join(process.cwd(), "../Library/DesignStyles");
const list = (s = "") => s.split(",").map((x) => x.trim()).filter(Boolean);
const norm = (s: string) => s.replace(/\u00a0/g, " ").trim();

function parseGroup(raw: string | undefined, slug: string): ArtDirectionGroup {
  if (raw) {
    const n = norm(raw);
    const match = ART_DIRECTION_GROUPS.find((g) => norm(g) === n);
    if (match) return match;
  }
  return DEFAULT_GROUP[slug] ?? G_DIGITAL;
}

function parse(file: string): ArtDirection | null {
  const raw = fs.readFileSync(path.join(dir, file), "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
  const slug = file.replace(/\.md$/, "");
  const body = m[2].trim();
  const faqPart = body.split(/^## Частые вопросы\s*$/m)[1] ?? "";
  const faq = faqPart
    .split(/^### /m)
    .slice(1)
    .map((b) => {
      const [q, ...a] = b.split("\n");
      return { q: typograf(q.trim()), a: typograf(a.join(" ").replace(/\s+/g, " ").trim()) };
    })
    .filter((x) => x.q && x.a);
  const name = meta.name ?? slug;
  const artwork = meta.artwork ? typograf(meta.artwork) : undefined;
  const coverAlt = meta.coverAlt
    ? typograf(meta.coverAlt)
    : artwork
      ? `${artwork} — пример художественного направления «${name}»`
      : `Визуальный пример художественного направления «${name}»`;
  return {
    slug,
    name,
    title: typograf(meta.title ?? ""),
    description: typograf(meta.description ?? ""),
    short: typograf(meta.short ?? ""),
    group: parseGroup(meta.group, slug),
    also: list(meta.also),
    palette: list(meta.palette).filter((c) => /^#[0-9a-f]{3,8}$/i.test(c)),
    fonts: list(meta.fonts),
    related: list(meta.related),
    coverAlt,
    artwork,
    // Промпт в блоке кода Типограф не трогает: его копируют как есть
    body: body.split(/(```[\s\S]*?```)/).map((part) => (part.startsWith("```") ? part : typograf(part))).join(""),
    faq,
    order: ART_DIRECTION_ORDER.indexOf(slug) < 0 ? 999 : ART_DIRECTION_ORDER.indexOf(slug),
  };
}

let cache: ArtDirection[] | null = null;
export function getArtDirections(): ArtDirection[] {
  if (cache) return cache;
  if (!fs.existsSync(dir)) return (cache = []);
  return (cache = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map(parse)
    .filter((x): x is ArtDirection => !!x)
    .sort((a, b) => a.order - b.order));
}
export const getArtDirection = (slug: string) => getArtDirections().find((s) => s.slug === slug);
