import fs from "node:fs";
import path from "node:path";
import { officeFloors, type OfficeEmployee, type OfficeFloor } from "./office";
import type { LeadOfferId } from "./lead-offers";
import { typograf } from "./typograf.mjs";

// Страницы ИИ-агентов команды NikAlimp: Library/Agents/<id>.md + метаданные этажа и спрайта из office.ts.
// Frontmatter: title, description, plugins (slug через запятую), offer (id из lead-offers.ts), outputs (через запятую).
export type AgentPageData = {
  slug: string;
  emp: OfficeEmployee;
  floor: OfficeFloor;
  title: string;
  description: string;
  plugins: string[];
  offer: LeadOfferId;
  outputs: string[];
  body: string;
  faq: { q: string; a: string }[];
  order: number;
};

const dir = path.join(process.cwd(), "../Library/Agents");
const list = (s = "") => s.split(",").map((x) => x.trim()).filter(Boolean);

const FLOOR_OFFER: Record<OfficeFloor["theme"], LeadOfferId> = {
  build: "site",
  geo: "geo",
  content: "content",
  ops: "support",
};

const FLAT: { emp: OfficeEmployee; floor: OfficeFloor; order: number }[] = officeFloors.flatMap((floor, fi) =>
  floor.employees.map((emp, ei) => ({ emp, floor, order: fi * 10 + ei })),
);

function parse(entry: { emp: OfficeEmployee; floor: OfficeFloor; order: number }): AgentPageData | null {
  const file = path.join(dir, `${entry.emp.id}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
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
  return {
    slug: entry.emp.id,
    emp: entry.emp,
    floor: entry.floor,
    title: typograf(meta.title ?? `${entry.emp.name}: как работает ИИ-агент`),
    description: typograf(meta.description ?? entry.emp.speech),
    plugins: list(meta.plugins),
    offer: (meta.offer as LeadOfferId) || FLOOR_OFFER[entry.floor.theme],
    outputs: list(meta.outputs).map((s) => typograf(s)),
    body: body.split(/(```[\s\S]*?```)/).map((part) => (part.startsWith("```") ? part : typograf(part))).join(""),
    faq,
    order: entry.order,
  };
}

let cache: AgentPageData[] | null = null;
export function getAgents(): AgentPageData[] {
  if (cache) return cache;
  if (!fs.existsSync(dir)) return (cache = []);
  return (cache = FLAT.map(parse).filter((x): x is AgentPageData => !!x).sort((a, b) => a.order - b.order));
}
export const getAgent = (slug: string) => getAgents().find((a) => a.slug === slug);
