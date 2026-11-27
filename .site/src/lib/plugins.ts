import fs from "node:fs";
import path from "node:path";
import { typograf } from "./typograf.mjs";

// Коллекция «Плагины и скиллы для ИИ-агентов»: Library/Plugins/<slug>.md.
// Frontmatter: name, title, description, short, category, kind, install, worksWith, agents (slug через запятую), related (slug через запятую).
export const PLUGIN_CATEGORIES = [
  "Разработка и дизайн",
  "SEO, GEO и аналитика",
  "Контент, выкладка и заявки",
  "Память, задачи и мониторинг",
] as const;

export type PluginCategory = (typeof PLUGIN_CATEGORIES)[number];

export type AgentPlugin = {
  slug: string;
  name: string;
  title: string;
  description: string;
  short: string;
  category: PluginCategory;
  kind: string; // MCP-сервер, CLI-инструмент, Скилл / плагин, Пайплайн
  install: string; // короткая команда установки для карточки
  worksWith: string[]; // Claude Code, Cursor, BB, Next.js, GitHub Actions...
  agents: string[]; // id агентов из office.ts
  related: string[];
  body: string;
  faq: { q: string; a: string }[];
  order: number;
};

export const PLUGIN_ORDER = [
  "spec-coding", "shadcn-ui-mcp", "anti-slop-design", "playwright-browser-mcp", "glavred-check", "typograf-tilda",
  "geo-audit-plugin", "schema-llms-kit", "yandex-webmaster-mcp", "google-search-console-mcp", "yandex-metrica-mcp",
  "content-factory-plugin", "deploy-kit-actions", "telegram-lead-router", "github-pr-plugin",
  "obsidian-llm-wiki", "todoist-calendar-mcp", "site-health-monitor",
];

const dir = path.join(process.cwd(), "../Library/Plugins");
const list = (s = "") => s.split(",").map((x) => x.trim()).filter(Boolean);
const norm = (s: string) => s.replace(/\u00a0/g, " ").trim();

function parseCategory(raw: string | undefined): PluginCategory {
  if (raw) {
    const n = norm(raw);
    const match = PLUGIN_CATEGORIES.find((c) => norm(c) === n);
    if (match) return match;
  }
  return PLUGIN_CATEGORIES[0];
}

function parse(file: string): AgentPlugin | null {
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
  return {
    slug,
    name: meta.name ?? slug,
    title: typograf(meta.title ?? ""),
    description: typograf(meta.description ?? ""),
    short: typograf(meta.short ?? ""),
    category: parseCategory(meta.category),
    kind: typograf(meta.kind ?? "Плагин"),
    install: meta.install ?? "",
    worksWith: list(meta.worksWith),
    agents: list(meta.agents),
    related: list(meta.related),
    body: body.split(/(```[\s\S]*?```)/).map((part) => (part.startsWith("```") ? part : typograf(part))).join(""),
    faq,
    order: PLUGIN_ORDER.indexOf(slug) < 0 ? 999 : PLUGIN_ORDER.indexOf(slug),
  };
}

let cache: AgentPlugin[] | null = null;
export function getPlugins(): AgentPlugin[] {
  if (cache) return cache;
  if (!fs.existsSync(dir)) return (cache = []);
  return (cache = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map(parse)
    .filter((x): x is AgentPlugin => !!x)
    .sort((a, b) => a.order - b.order));
}
export const getPlugin = (slug: string) => getPlugins().find((p) => p.slug === slug);
export const getPluginsForAgent = (agentId: string) => getPlugins().filter((p) => p.agents.includes(agentId));
