// Генератор UTM-меток: пресеты площадок, динамические параметры и сборка ссылки.
// Логика без React — её использует компонент UtmGenerator и можно проверить отдельно.

export type UtmKey = "utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term";
export type UtmValues = Record<UtmKey, string>;

export const utmFields: { key: UtmKey; label: string; required: boolean; hint: string; placeholder: string }[] = [
  { key: "utm_source", label: "Источник", required: true, hint: "Откуда пришёл человек: площадка, канал или блогер.", placeholder: "yandex" },
  { key: "utm_medium", label: "Тип трафика", required: true, hint: "Канал: cpc — платная реклама, email, social, influencer, banner.", placeholder: "cpc" },
  { key: "utm_campaign", label: "Кампания", required: true, hint: "Название кампании латиницей или динамический параметр площадки.", placeholder: "personal_site_spring" },
  { key: "utm_content", label: "Объявление", required: false, hint: "Чем отличается объявление: креатив, баннер, кнопка, пост.", placeholder: "banner_240x400" },
  { key: "utm_term", label: "Ключевое слово", required: false, hint: "Запрос, по которому показали объявление. Для поиска — макрос площадки.", placeholder: "sozdanie_sajta" },
];

export type Macro = { code: string; text: string };
export type Preset = { id: string; label: string; values: Partial<UtmValues>; macros?: Macro[]; note?: string };

export const presets: Preset[] = [
  { id: "custom", label: "Свои значения", values: {} },
  {
    id: "yandex",
    label: "Яндекс Директ",
    values: { utm_source: "yandex", utm_medium: "cpc", utm_campaign: "{campaign_id}", utm_content: "{ad_id}", utm_term: "{keyword}" },
    macros: [
      { code: "{campaign_id}", text: "номер кампании" },
      { code: "{campaign_name}", text: "название кампании" },
      { code: "{ad_id}", text: "номер объявления" },
      { code: "{gbid}", text: "номер группы" },
      { code: "{keyword}", text: "ключевая фраза" },
      { code: "{source_type}", text: "поиск или сети" },
      { code: "{source}", text: "площадка показа" },
      { code: "{device_type}", text: "тип устройства" },
      { code: "{region_name}", text: "регион показа" },
    ],
  },
  {
    id: "vk",
    label: "VK Реклама",
    values: { utm_source: "vk", utm_medium: "cpc", utm_campaign: "{{campaign_id}}", utm_content: "{{banner_id}}" },
    macros: [
      { code: "{{campaign_id}}", text: "номер кампании" },
      { code: "{{campaign_name}}", text: "название кампании" },
      { code: "{{banner_id}}", text: "номер объявления" },
      { code: "{{geo}}", text: "регион" },
      { code: "{{gender}}", text: "пол" },
      { code: "{{age}}", text: "возраст" },
    ],
  },
  {
    id: "google",
    label: "Google Ads",
    values: { utm_source: "google", utm_medium: "cpc", utm_campaign: "{campaignid}", utm_content: "{creative}", utm_term: "{keyword}" },
    macros: [
      { code: "{campaignid}", text: "номер кампании" },
      { code: "{adgroupid}", text: "номер группы" },
      { code: "{creative}", text: "номер объявления" },
      { code: "{keyword}", text: "ключевое слово" },
      { code: "{matchtype}", text: "тип соответствия" },
      { code: "{device}", text: "устройство" },
      { code: "{network}", text: "сеть показа" },
    ],
  },
  { id: "tgads", label: "Telegram Ads", values: { utm_source: "telegram", utm_medium: "cpc" }, note: "Telegram Ads не подставляет динамические параметры: на каждое объявление — своя ссылка с utm_content." },
  { id: "tgpost", label: "Посев в Telegram-канале", values: { utm_source: "telegram", utm_medium: "social" }, note: "В utm_content укажите канал, где вышел пост, — так видно, какой посев окупился." },
  { id: "influencer", label: "Реклама у блогеров", values: { utm_source: "", utm_medium: "influencer" }, note: "В utm_source — ник блогера, в utm_content — формат: stories, reels, пост." },
  { id: "email", label: "Email-рассылка", values: { utm_source: "newsletter", utm_medium: "email" }, note: "В utm_campaign — тема или дата письма, в utm_content — кнопка или ссылка в письме." },
];

const ru: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export const translit = (s: string) => s.replace(/[а-яё]/gi, (ch) => {
  const t = ru[ch.toLowerCase()] ?? ch;
  return ch === ch.toLowerCase() ? t : t.charAt(0).toUpperCase() + t.slice(1);
});

export type Options = { lowercase: boolean; translit: boolean };

/** Чистит значение метки: пробелы → «_», убирает символы, ломающие ссылку, по выбору — нижний регистр и транслит.
 *  Макросы площадок в фигурных скобках не трогаем. */
export function cleanValue(raw: string, o: Options): string {
  return raw
    .trim()
    .split(/(\{\{?[^{}]+\}?\})/g)
    .map((part) => {
      if (/^\{\{?[^{}]+\}?\}$/.test(part)) return part;
      let v = part.replace(/\s+/g, "_").replace(/[#&=?]/g, "");
      if (o.translit) v = translit(v);
      if (o.lowercase) v = v.toLowerCase();
      return v;
    })
    .join("")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");
}

const enc = (v: string) => encodeURIComponent(v).replace(/%7B/gi, "{").replace(/%7D/gi, "}");

/** Нормализует адрес: протокол по умолчанию, без повторного https://. */
export function normalizeUrl(raw: string): string {
  let u = raw.trim().replace(/\s+/g, "");
  if (!u) return "";
  u = u.replace(/^(https?:\/\/)+(https?:\/\/)/i, "$2");
  if (!/^https?:\/\//i.test(u)) u = "https://" + u.replace(/^\/+/, "");
  return u;
}

export type BuildResult = { url: string; query: string; errors: string[] };

export function buildUtmUrl(rawUrl: string, values: UtmValues, o: Options): BuildResult {
  const errors: string[] = [];
  const base = normalizeUrl(rawUrl);
  if (!base) errors.push("Укажите адрес страницы.");
  else {
    try { new URL(base); } catch { errors.push("Адрес страницы выглядит неправильно."); }
  }
  for (const f of utmFields) if (f.required && !values[f.key].trim()) errors.push(`Заполните «${f.label}» (${f.key}).`);

  const pairs = utmFields
    .map((f) => [f.key, cleanValue(values[f.key], o)] as const)
    .filter(([, v]) => v);
  const query = pairs.map(([k, v]) => `${k}=${enc(v)}`).join("&");
  if (!base) return { url: "", query, errors };

  // Сохраняем свои параметры и якорь страницы, старые utm_* заменяем новыми
  const hashAt = base.indexOf("#");
  const hash = hashAt >= 0 ? base.slice(hashAt) : "";
  const noHash = hashAt >= 0 ? base.slice(0, hashAt) : base;
  const qAt = noHash.indexOf("?");
  let path = qAt >= 0 ? noHash.slice(0, qAt) : noHash;
  if (/^https?:\/\/[^/]+$/i.test(path)) path += "/"; // site.ru → site.ru/
  const kept = (qAt >= 0 ? noHash.slice(qAt + 1) : "").split("&").filter((p) => p && !/^utm_(source|medium|campaign|content|term)=/i.test(p));
  const all = [...kept, query].filter(Boolean).join("&");
  return { url: path + (all ? "?" + all : "") + hash, query, errors };
}

/** Разбирает готовую ссылку обратно: адрес без utm_* и значения меток. Нужно, чтобы взять ссылку из истории в работу. */
export function splitUtmUrl(link: string): { url: string; values: UtmValues } {
  const values: UtmValues = { utm_source: "", utm_medium: "", utm_campaign: "", utm_content: "", utm_term: "" };
  const hashAt = link.indexOf("#");
  const hash = hashAt >= 0 ? link.slice(hashAt) : "";
  const noHash = hashAt >= 0 ? link.slice(0, hashAt) : link;
  const qAt = noHash.indexOf("?");
  if (qAt < 0) return { url: link, values };
  const kept: string[] = [];
  for (const p of noHash.slice(qAt + 1).split("&")) {
    const [k, ...rest] = p.split("=");
    const key = k.toLowerCase() as UtmKey;
    if (key in values) {
      try { values[key] = decodeURIComponent(rest.join("=").replace(/\+/g, " ")); } catch { values[key] = rest.join("="); }
    } else if (p) kept.push(p);
  }
  return { url: noHash.slice(0, qAt) + (kept.length ? "?" + kept.join("&") : "") + hash, values };
}

/** CSV в строки: разделитель «,» или «;» (как сохраняет русский Excel), кавычки по RFC 4180. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const first = src.split(/\r?\n/, 1)[0] ?? "";
  const sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === sep) { row.push(cell.trim()); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell.trim()); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  row.push(cell.trim()); rows.push(row);
  return rows.filter((r) => r.some(Boolean));
}

const columns = ["url", "source", "medium", "campaign", "content", "term"] as const;

/** Строки списка в пары «адрес + метки». Заголовок необязателен; пустые ячейки берутся из формы. */
export function bulkInput(text: string, fallback: UtmValues, limit = 500): { url: string; values: UtmValues }[] {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.toLowerCase().replace(/^utm_/, ""));
  const hasHeader = head.includes("url") || head.some((h) => (columns as readonly string[]).includes(h) && h !== "url");
  const idx = columns.map((c, i) => (hasHeader ? head.indexOf(c) : i));
  return rows.slice(hasHeader ? 1 : 0, (hasHeader ? 1 : 0) + limit).map((r) => {
    const get = (i: number) => (idx[i] >= 0 ? r[idx[i]] ?? "" : "");
    const values = { ...fallback };
    utmFields.forEach((f, i) => { const v = get(i + 1); if (v) values[f.key] = v; });
    return { url: get(0), values };
  });
}

/** Строки в CSV с разделителем «;» — так файл сразу открывается колонками в русском Excel. */
export function toCsv(rows: string[][]): string {
  const cell = (v: string) => (/[";\n,]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");
}
