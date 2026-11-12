import fs from "node:fs";
import path from "node:path";
import { typograf } from "./typograf.mjs";
import { getTools, slugify } from "./tools";

// Две коллекции из Library/DesignSystems в vault NikitOS:
// /design-systems/ — дизайн-системы (kind: system), /ui-libraries/ — библиотеки к ним (kind: library).
// Связь: у библиотеки поле systems — слаги систем, к которым она подходит; "any" — к любой.
// looks.json — фирменные токены системы (основной цвет, акцент, радиус, тёмная тема) для обложек.

export type DsType = "components" | "blocks" | "animations" | "templates" | "themes" | "icons" | "charts" | "figma" | "primitives" | "tool" | "directory";
export type Family = "shadcn" | "tailwind" | "react" | "vue-svelte" | "ru" | "enterprise" | "css";
export type Look = { primary: string; accent: string; radius: number; dark: boolean };

export type DsItem = {
  slug: string; name: string; kind: "system" | "library"; systems: string[]; types: DsType[]; frameworks: string[];
  styling: string | null; install: string | null; size: string | null; pricing: "free" | "freemium" | "paid"; price: string | null;
  license: string | null; github: string | null; stars: string | null; url: string; status: "active" | "slow" | "moved" | "archived";
  ru: string | null; ai: string | null; best_for: string | null; short: string; about: string; sources: string[]; checked: string;
  family?: Family; tool?: string; look: Look;
};

export const TYPE_LABEL: Record<DsType, string> = {
  components: "Компоненты", blocks: "Блоки и секции", animations: "Анимации", templates: "Шаблоны", themes: "Темы",
  icons: "Иконки", charts: "Графики", figma: "Figma-киты", primitives: "Примитивы", tool: "Инструменты", directory: "Каталоги",
};
// Порядок вкладок и главный тип библиотеки (по нему рисуется обложка)
export const TYPE_ORDER: DsType[] = ["blocks", "animations", "components", "templates", "charts", "icons", "themes", "figma", "primitives", "tool", "directory"];

export const FAMILY: Record<Family, { label: string; text: string }> = {
  shadcn: { label: "shadcn/ui и порты", text: "Код компонентов копируется в проект через CLI и дальше принадлежит вам: правите как свой, обновления пакета ничего не ломают. Вокруг shadcn/ui выросла самая большая экосистема блоков и анимаций, а порты переносят тот же подход на Vue, Svelte, Angular, Solid, React Native и Flutter." },
  tailwind: { label: "Tailwind", text: "Системы на утилитарных классах Tailwind CSS: стили пишутся прямо в разметке, тема задаётся токенами. Хорошо подходят для маркетинговых сайтов и лендингов: у большинства есть готовые секции, шаблоны и Figma-киты." },
  react: { label: "React", text: "Библиотеки компонентов для React, которые ставятся npm-пакетом. Одни дают готовый визуальный стиль (MUI, Ant Design, Mantine), другие — только доступное поведение без оформления (Base UI, React Aria): на них собирают собственную дизайн-систему." },
  "vue-svelte": { label: "Vue, Svelte, Angular", text: "Системы для фреймворков помимо React. Nuxt UI и PrimeVue закрывают сайты и админки на Vue, Skeleton и Bits UI — проекты на Svelte, Prime — ещё и Angular. Выбирайте по стеку команды: переносить компоненты между фреймворками дорого." },
  ru: { label: "Российские", text: "Открытые дизайн-системы российских компаний: Яндекса, Т-Банка, VK, Сбера, Альфа-Банка, Контура и Газпром нефти. Лицензии разрешают коммерческое использование, пакеты ставятся из npm без оплаты и ограничений, документация на русском." },
  enterprise: { label: "Корпоративные", text: "Публичные дизайн-системы больших компаний и государств: Google, Microsoft, IBM, GitHub, Adobe, Salesforce, правительств Великобритании и США. Это эталоны документации, доступности и токенов; часть систем можно брать в работу, остальные — изучать как образец." },
  css: { label: "CSS и no-code", text: "Классические CSS-фреймворки и библиотеки для конструкторов: подключаются одной строкой без сборки или клонируются в Webflow и Figma. Подходят для простых сайтов, прототипов и проектов без React." },
};

export const PRICING_LABEL = { free: "Бесплатно", freemium: "Бесплатно + Pro", paid: "Платно" } as const;
export const STATUS_LABEL = { active: "", slow: "Обновляется редко", moved: "Переехал", archived: "Закрыт для новых клиентов" } as const;

const dir = path.join(process.cwd(), "../Library/DesignSystems");
const t = (s: string | null) => (s ? typograf(s) : s);

// Палитра для библиотек нейтральных систем (shadcn/ui, Base UI…) и универсальных: иначе все обложки вышли бы чёрно-белыми и одинаковыми
const VIVID = ["#6366f1", "#ec4899", "#f97316", "#10b981", "#0ea5e9", "#8b5cf6", "#ef4444", "#14b8a6", "#eab308", "#3b82f6", "#d946ef", "#22c55e"];
const seedOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const neutral = (hex: string) => { const m = hex.match(/^#(..)(..)(..)$/); if (!m) return false; const v = m.slice(1).map((x) => parseInt(x, 16)); return Math.max(...v) - Math.min(...v) < 40; };
function libLook(slug: string, base?: Look): Look {
  const h = seedOf(slug);
  if (base && !neutral(base.primary)) return base;
  const k = Math.floor(h / 7); return { primary: VIVID[k % VIVID.length], accent: VIVID[(k + 5) % VIVID.length], radius: base?.radius ?? 8, dark: (base?.dark ?? false) || h % 4 === 0 };
}

let cache: DsItem[] | null = null;
export function getDsItems(): DsItem[] {
  if (cache) return cache;
  const file = path.join(dir, "designsystems.json");
  if (!fs.existsSync(file)) return (cache = []);
  const raw = JSON.parse(fs.readFileSync(file, "utf8")).items as DsItem[];
  const looks = JSON.parse(fs.readFileSync(path.join(dir, "looks.json"), "utf8")) as Record<string, Look>;
  const tools = new Map(getTools().map((x) => [slugify(x.name), x.slug]));
  const items = raw.map((r) => {
    const sys = r.kind === "system" ? r.slug : r.systems.find((s) => looks[s]);
    const types = [...r.types].sort((a, b) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b));
    return {
      ...r, types,
      short: t(r.short)!, about: t(r.about)!, best_for: t(r.best_for), ru: t(r.ru), ai: t(r.ai), price: t(r.price), size: t(r.size), install: t(r.install),
      tool: tools.get(slugify(r.name)) ?? tools.get(slugify(r.name.replace(/\s*\(.*\)$/, ""))),
      look: r.kind === "system" ? looks[r.slug] ?? libLook(r.slug) : libLook(r.slug, sys ? looks[sys] : undefined),
    };
  });
  return (cache = items);
}

const byName = (a: DsItem, b: DsItem) => a.name.localeCompare(b.name, "en");
export const getSystems = () => getDsItems().filter((x) => x.kind === "system").sort(byName);
export const getUiLibraries = () => getDsItems().filter((x) => x.kind === "library").sort(byName);
export const getSystem = (slug: string) => getSystems().find((s) => s.slug === slug);
export const getUiLibrary = (slug: string) => getUiLibraries().find((s) => s.slug === slug);
/** Библиотеки системы: сначала живые и с бо́льшим числом звёзд */
export const librariesOf = (slug: string) => getUiLibraries().filter((l) => l.systems.includes(slug)).sort((a, b) => rank(a) - rank(b) || byName(a, b));
export const universalLibraries = () => getUiLibraries().filter((l) => l.systems.includes("any"));
export const mainType = (x: DsItem): DsType => x.types[0] ?? "components";

/** Звёзды «≈ 25,3k» → число для сортировки */
export function starsNum(s: string | null) {
  const m = s?.replace(",", ".").match(/([\d.]+)\s*k/i);
  return m ? parseFloat(m[1]) * 1000 : parseFloat(s?.replace(/[^\d.]/g, "") || "0") || 0;
}
const rank = (x: DsItem) => (x.status === "archived" ? 1e9 : x.status === "moved" ? 1e8 : 0) - starsNum(x.stars);

/** Склонение: 1 библиотека, 2 библиотеки, 5 библиотек */
export function plural(n: number, one: string, few: string, many: string) {
  const a = n % 10, b = n % 100;
  return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
}

/** Какие услуги предложить под систему или библиотеку: сервисы и админки или сайты */
export function servicesFor(x: DsItem): string[] {
  const text = `${x.best_for ?? ""} ${x.about} ${x.types.join(" ")}`.toLowerCase();
  const app = /дашборд|админ|сервис|saas|приложен|кабинет|charts|enterprise|корпоративн.*интерфейс|b2b/.test(text);
  const site = /лендинг|маркетинг|сайт|промо|blocks|templates|animations|портфолио/.test(text);
  if (app && !site) return ["web-service-development", "corporate-website"];
  if (site && !app) return ["corporate-website", "personal-website"];
  return ["corporate-website", "web-service-development"];
}

/** Вопросы и ответы для страницы — из полей записи */
export function faqFor(x: DsItem, libs: DsItem[] = []): { q: string; a: string }[] {
  const f: { q: string; a: string }[] = [];
  const free = x.pricing === "free" ? "Да, бесплатная." : x.pricing === "freemium" ? "Основная часть бесплатная, есть платная версия." : "Нет, платная.";
  f.push({ q: `${x.name} — бесплатная ${x.kind === "system" ? "система" : "библиотека"}?`, a: `${free}${x.price ? ` ${x.price[0].toUpperCase()}${x.price.slice(1)}.` : ""}${x.license ? ` Лицензия: ${x.license}.` : ""}`.replace(/\.\./g, ".") });
  if (x.ru) f.push({ q: `Можно ли использовать ${x.name} в России?`, a: `${x.ru[0].toUpperCase()}${x.ru.slice(1)}.`.replace(/\.\./g, ".") });
  if (x.kind === "system" && libs.length) {
    f.push({ q: `Какие библиотеки блоков и анимаций подходят к ${x.name}?`, a: `В каталоге ${libs.length} ${plural(libs.length, "библиотека", "библиотеки", "библиотек")} для ${x.name}: ${libs.slice(0, 6).map((l) => l.name).join(", ")}${libs.length > 6 ? " и другие" : ""}. Анимации на Motion, GSAP и Lottie подходят к любой системе.` });
  }
  if (x.kind === "library") {
    const sys = x.systems.filter((s) => s !== "any").map((s) => getSystem(s)?.name).filter(Boolean);
    f.push({ q: `С какой дизайн-системой использовать ${x.name}?`, a: sys.length ? `${x.name} рассчитана на ${sys.join(", ")}${x.systems.includes("any") ? ", но подойдёт и к другим системам" : ""}. Перед установкой сверьте версии: стили и токены должны совпадать с проектом.` : `${x.name} не привязана к одной системе: её можно подключить к любому проекту на ${x.frameworks.join(", ") || "вашем стеке"}.` });
  }
  if (x.install) f.push({ q: `Как установить ${x.name}?`, a: `Способ установки: ${x.install}. ${x.install.includes("shadcn") ? "Компонент копируется в проект исходным кодом, после этого его можно править как свой." : "Пакет обновляется вместе с зависимостями проекта."}` });
  if (x.ai) f.push({ q: `Работает ли ${x.name} с нейросетями и ИИ-агентами?`, a: `${x.ai[0].toUpperCase()}${x.ai.slice(1)}.`.replace(/\.\./g, ".") });
  return f.map((q) => ({ q: typograf(q.q), a: typograf(q.a) }));
}
