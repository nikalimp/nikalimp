// Сбор семантики: разбор выгрузки Вордстата, минус-слова, отсев, словоформы, типы запросов,
// слова спроса и структура сайта. Всё считается в браузере, без сервера.
// Типограф этот файл не трогает (SKIP_FILES в scripts/typograf.mjs): в строках — словари для поиска.

export type Intent = "commercial" | "info" | "product" | "niche";
export type Status = "work" | "filtered" | "form" | "removed";

export type RawRow = { phrase: string; count: number | null; parent?: string; assoc?: boolean };

export type Row = RawRow & {
  key: string; // нормализованная фраза
  tokens: string[];
  stems: string[];
  intent: Intent;
  status: Status;
  reason?: string; // категория отсева, минус-слово или «словоформа …»
};

export const INTENTS: { v: Intent; label: string }[] = [
  { v: "commercial", label: "коммерческий" },
  { v: "product", label: "товарный" },
  { v: "niche", label: "ниша" },
  { v: "info", label: "информационный" },
];
export const intentLabel = (i: Intent) => INTENTS.find((x) => x.v === i)!.label;

// ——— Нормализация и основа слова ———

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[+!"«»“”„\[\]()]/g, " ")
    .replace(/(^|\s)-\S+/g, " ") // минус-слова из операторов Директа
    .replace(/[^\p{L}\p{N}\s.\-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ENDINGS = [
  "иями", "ями", "ых", "их", "ым", "им", "ами", "ого", "его", "ому", "ему", "ыми", "ими", "иях", "ах", "ях", "ов", "ев", "ей", "ий", "ый", "ой", "ая", "яя",
  "ое", "ее", "ые", "ие", "ую", "юю", "ом", "ем", "ам", "ям", "ия", "ию", "ии", "ье", "ья", "ьи", "ть", "ти", "а", "я", "о", "е",
  "ы", "и", "у", "ю", "ь", "й",
].sort((a, b) => b.length - a.length);

// Простое отсечение окончаний: «кондиционеров» → «кондиционер», «натяжные» → «натяжн»
export function stem(word: string): string {
  if (!/[а-я]/.test(word) || word.length <= 3) return word;
  for (const e of ENDINGS) {
    if (word.endsWith(e) && word.length - e.length >= 3) return word.slice(0, -e.length);
  }
  return word;
}

export const STOP = new Set([
  "в", "во", "на", "по", "для", "с", "со", "к", "ко", "от", "до", "из", "за", "о", "об", "у", "и", "или", "а", "без", "под", "над", "при",
  "через", "не", "ли", "же", "бы", "то", "как", "что", "это", "мне", "my", "the", "of", "for",
]);

export function tokenize(key: string): string[] {
  return key.split(" ").filter(Boolean);
}

// ——— Разбор вставленного текста ———

const HEADER = /^(фраза|запрос|ключев|ключ|keyword|phrase|число|количество|показ|частот|count)/i;
const NUM_SEP = /^(.*?)\s*[\t;|]\s*["']?([\d\s .,]+)["']?\s*(?:[\t;|].*)?$/;
const NUM_COMMA = /^"?(.*?)"?\s*,\s*"?([\d\s ]+)"?\s*$/;
const NUM_SPACE = /^(.*?\S)\s+(\d{1,3}(?:[  ]\d{3})+|\d+)$/;
const ONLY_NUM = /^[\d\s ]+$/;

const toNum = (s: string) => {
  const n = parseInt(s.replace(/[\s .,]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

export function parseInput(text: string): RawRow[] {
  const lines = text.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  const out: RawRow[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (HEADER.test(l) && !/\d/.test(l.replace(/\D+$/, ""))) continue;
    if (ONLY_NUM.test(l)) continue; // одинокое число без фразы
    const m = l.match(NUM_SEP) || l.match(NUM_COMMA) || l.match(NUM_SPACE);
    if (m && m[1].trim()) {
      out.push({ phrase: m[1].trim(), count: toNum(m[2]) });
      continue;
    }
    // Формат «фраза на одной строке, число на следующей»
    if (i + 1 < lines.length && ONLY_NUM.test(lines[i + 1])) {
      out.push({ phrase: l, count: toNum(lines[i + 1]) });
      i++;
      continue;
    }
    out.push({ phrase: l, count: null });
  }
  return out.filter((r) => normalize(r.phrase));
}

// ——— Минус-слова ———
// «слово» — все словоформы, «авто*» — всё, что начинается с «авто», «!слово» — только эта форма,
// «яндекс маркет» — фраза, где есть оба слова.

export type Minus = { raw: string; test: (tokens: string[], stems: string[]) => boolean };

export function parseMinus(list: string[]): Minus[] {
  const out: Minus[] = [];
  for (const rawIn of list) {
    const raw = rawIn.trim().replace(/^-/, "");
    if (!raw) continue;
    const parts = raw.toLowerCase().replace(/ё/g, "е").split(/\s+/).filter(Boolean);
    const checks = parts.map((p) => {
      if (p.endsWith("*")) { const pre = p.slice(0, -1); return (t: string[]) => t.some((x) => x.startsWith(pre)); }
      if (p.startsWith("!")) { const w = p.slice(1); return (t: string[]) => t.includes(w); }
      const s = stem(p);
      return (t: string[], st: string[]) => t.includes(p) || st.includes(s);
    });
    out.push({ raw, test: (t, st) => checks.every((c) => c(t, st)) });
  }
  return out;
}

export function splitMinus(text: string): string[] {
  return [...new Set(text.split(/[,\n;]+/).map((s) => s.trim().replace(/^-/, "").toLowerCase()).filter(Boolean))];
}

// ——— Категории отсева ———

export type Category = { id: string; label: string; words: string[] };

export const CATEGORIES: Category[] = [
  { id: "market", label: "Маркетплейсы и сети", words: ["озон", "ozon", "вайлдберриз", "валдберис", "wildberries", "вб", "wb", "авито", "avito", "алиэкспресс", "aliexpress", "али", "мегамаркет", "ламода", "lamoda", "маркет", "market", "днс", "dns", "эльдорадо", "мвидео", "ситилинк", "леруа", "оби", "икеа", "ikea", "hoff", "хофф", "яндекс маркет"] },
  { id: "media", label: "Фото и видео", words: ["фото", "фотографи*", "картинк*", "видео", "youtube", "ютуб", "смотреть", "рисунок", "рисунк*", "обои", "png", "jpg", "гиф", "gif"] },
  { id: "download", label: "Скачать и рефераты", words: ["скачать", "торрент", "torrent", "apk", "pdf", "реферат*", "презентаци*", "доклад*", "курсов*", "dwg", "чертеж*"] },
  { id: "diy", label: "Своими руками", words: ["своими руками", "самостоятельно", "!сам", "!самому", "в домашних условиях"] },
  { id: "jobs", label: "Работа и вакансии", words: ["ваканси*", "резюме", "зарплат*", "требуется", "требуются", "hh"] },
  { id: "used", label: "Б/у и бесплатно", words: ["бу", "б у", "!бесплатно", "даром", "отдам", "обмен"] },
];

// Города: если выбран конкретный регион, остальные города уходят в отсев
export const REGIONS = [
  { id: "213", label: "Москва", city: "москв|мск|зеленоград" },
  { id: "1", label: "Москва и область", city: "москв|мск|подольск|химк|балаших|мытищ|королев|люберц|одинцов|зеленоград|подмосков" },
  { id: "2", label: "Санкт-Петербург", city: "петербург|спб|питер" },
  { id: "225", label: "Россия", city: "" },
  { id: "54", label: "Екатеринбург", city: "екатеринбург|екб" },
  { id: "65", label: "Новосибирск", city: "новосибирск|нск" },
  { id: "43", label: "Казань", city: "казан" },
  { id: "47", label: "Нижний Новгород", city: "нижн|новгород|нн" },
  { id: "35", label: "Краснодар", city: "краснодар" },
  { id: "39", label: "Ростов-на-Дону", city: "ростов" },
  { id: "51", label: "Самара", city: "самар" },
  { id: "172", label: "Уфа", city: "уф" },
  { id: "66", label: "Омск", city: "омск" },
  { id: "56", label: "Челябинск", city: "челябинск" },
  { id: "193", label: "Воронеж", city: "воронеж" },
  { id: "11", label: "Рязань", city: "рязан" },
];

const CITIES = [
  "москв", "мск", "петербург", "спб", "питер", "екатеринбург", "екб", "новосибирск", "казан", "нижн", "краснодар", "ростов", "самар",
  "уф", "омск", "челябинск", "воронеж", "рязан", "пермь", "перм", "волгоград", "красноярск", "саратов", "тюмен", "тольятти", "ижевск",
  "барнаул", "ульяновск", "иркутск", "хабаровск", "ярославл", "владивосток", "махачкал", "томск", "оренбург", "кемерово", "новокузнецк",
  "астрахан", "пенз", "липецк", "тул", "киров", "чебоксар", "калининград", "курск", "сочи", "ставропол", "твер", "брянск", "белгород",
  "сургут", "владимир", "архангельск", "смоленск", "калуг", "мурманск", "вологд", "минск", "алматы", "астан", "киев", "ташкент",
  "подольск", "химк", "балаших", "мытищ", "королев", "люберц", "одинцов", "зеленоград", "новгород",
];

type CatTest = { id: string; label: string; test: (tokens: string[], stems: string[], key: string) => boolean };

function catTests(region: string): CatTest[] {
  const tests: CatTest[] = CATEGORIES.map((c) => {
    const m = parseMinus(c.words);
    return { id: c.id, label: c.label, test: (t, s) => m.some((x) => x.test(t, s)) };
  });
  const reg = REGIONS.find((r) => r.id === region);
  if (reg && reg.city) {
    const own = new RegExp(`^(${reg.city})`);
    tests.push({
      id: "city",
      label: "Другие города",
      test: (t) => t.some((w) => !own.test(w) && CITIES.some((c) => (c.length <= 3 ? w === c || (w.startsWith(c) && w.length <= c.length + 3) : w.startsWith(c)))),
    });
  }
  tests.push({ id: "assoc", label: "Похожие запросы", test: () => false });
  return tests;
}

export function categoryLabels(region: string) {
  return catTests(region).map(({ id, label }) => ({ id, label }));
}

// ——— Тип запроса ———

const COMM_STRONG = ["купить", "куплю", "цена", "цены", "ценам", "стоимост*", "заказать", "заказ", "доставк*", "недорог*", "дешев*", "магазин*", "прайс*", "аренд*", "прокат*", "оптом", "опт", "распродаж*", "скидк*", "акци*", "рассрочк*", "кредит", "вызвать", "вызов", "под ключ", "руб", "рублей", "р"];
const COMM_SOFT = ["услуг*", "установк*", "установить", "монтаж*", "ремонт*", "обслуживан*", "мастер*", "компани*", "фирм*", "сервис*", "чистк*", "замен*", "заправк*", "диагностик*", "изготовлени*", "производств*", "студи*", "агентств*", "официальн*", "дилер*", "калькулятор*", "расчет*", "рассчитать", "замер*"];
const INFO = ["как", "что", "почему", "зачем", "какой", "какая", "какое", "какие", "каким", "чем", "сколько", "когда", "где", "можно", "нужно", "ли", "своими руками", "инструкци*", "схем*", "отзыв*", "рейтинг*", "лучш*", "топ", "сравнени*", "отличи*", "разниц*", "или", "vs", "ошибк*", "код*", "плюсы", "минусы", "виды", "типы", "выбрать", "выбор", "характеристик*", "что такое", "это"];

const commStrong = parseMinus(COMM_STRONG);
const commSoft = parseMinus(COMM_SOFT);
const info = parseMinus(INFO);
const hit = (list: Minus[], t: string[], s: string[]) => list.some((m) => m.test(t, s));

export function classify(tokens: string[], stems: string[]): Intent {
  if (hit(commStrong, tokens, stems) && !(tokens.includes("сколько") && !tokens.includes("стоит"))) return "commercial";
  if (tokens.includes("стоит") && tokens.includes("сколько")) return "commercial";
  if (hit(info, tokens, stems)) return "info";
  if (hit(commSoft, tokens, stems)) return "commercial";
  if (tokens.some((t) => /^[a-z]{2,}/.test(t) || /\d/.test(t))) return "product";
  return "niche";
}

// ——— Главная обработка ———

export type Options = {
  minus: string[]; // минус-слова пользователя
  removed: string[]; // фразы, убранные вручную (key)
  region: string;
  off: string[]; // категории отсева, которые пользователь вернул в работу
};

export function prepare(raw: RawRow[]): Row[] {
  const map = new Map<string, Row>();
  for (const r of raw) {
    const key = normalize(r.phrase);
    if (!key) continue;
    const prev = map.get(key);
    if (prev) {
      if ((r.count ?? -1) > (prev.count ?? -1)) prev.count = r.count;
      if (!r.assoc) prev.assoc = false;
      continue;
    }
    const tokens = tokenize(key);
    const stems = tokens.map(stem);
    map.set(key, { ...r, phrase: key, key, tokens, stems, intent: classify(tokens, stems), status: "work" });
  }
  return [...map.values()];
}

export function process(rows: Row[], o: Options): Row[] {
  const minus = parseMinus(o.minus);
  const cats = catTests(o.region).filter((c) => !o.off.includes(c.id));
  const removed = new Set(o.removed);
  const out = rows.map((r): Row => {
    if (removed.has(r.key)) return { ...r, status: "removed", reason: "убрано вручную" };
    const m = minus.find((x) => x.test(r.tokens, r.stems));
    if (m) return { ...r, status: "removed", reason: `минус-слово «${m.raw}»` };
    if (r.assoc && !o.off.includes("assoc")) return { ...r, status: "filtered", reason: "Похожие запросы" };
    const c = cats.find((x) => x.test(r.tokens, r.stems, r.key));
    if (c) return { ...r, status: "filtered", reason: c.label };
    return { ...r, status: "work", reason: undefined };
  });
  // Словоформы: одинаковый набор основ слов — в работе остаётся самая частая фраза
  const best = new Map<string, Row>();
  for (const r of out) {
    if (r.status !== "work") continue;
    const k = r.stems.filter((s) => !STOP.has(s)).sort().join(" ");
    const b = best.get(k);
    if (!b || (r.count ?? -1) > (b.count ?? -1)) best.set(k, r);
  }
  return out.map((r) => {
    if (r.status !== "work") return r;
    const b = best.get(r.stems.filter((s) => !STOP.has(s)).sort().join(" "))!;
    return b === r ? r : { ...r, status: "form", reason: `словоформа «${b.phrase}»` };
  });
}

// ——— Слова спроса ———

export type Word = { stem: string; word: string; total: number; phrases: number };

export function demandWords(rows: Row[], limit = 300): Word[] {
  const map = new Map<string, { forms: Map<string, number>; total: number; phrases: number }>();
  for (const r of rows) {
    if (r.status !== "work") continue;
    const seen = new Set<string>();
    r.tokens.forEach((t, i) => {
      const s = r.stems[i];
      if (STOP.has(t) || seen.has(s) || t.length < 2) return;
      seen.add(s);
      const e = map.get(s) ?? { forms: new Map(), total: 0, phrases: 0 };
      e.forms.set(t, (e.forms.get(t) ?? 0) + 1);
      e.total += r.count ?? 0;
      e.phrases += 1;
      map.set(s, e);
    });
  }
  return [...map.entries()]
    .map(([s, e]) => ({ stem: s, word: [...e.forms.entries()].sort((a, b) => b[1] - a[1])[0][0], total: e.total, phrases: e.phrases }))
    .sort((a, b) => b.phrases - a.phrases || b.total - a.total)
    .slice(0, limit);
}

// ——— Структура сайта ———

export type Page = { name: string; demand: number; phrases: Row[] };
export type Structure = { commercial: Page[]; blog: Page[] };

const GENERIC = new Set([...COMM_STRONG, ...INFO, "москв", "мск", "спб"].map((w) => stem(w.replace("*", ""))));

// «потолок» и «потолк» — одно слово: беглые гласные отсечением окончаний не ловятся
function near(a: string, b: string) {
  if (a === b) return true;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i >= Math.max(4, Math.min(a.length, b.length) - 2);
}
const inBase = (s: string, base: Set<string>) => base.has(s) || [...base].some((b) => near(s, b));

function groupPages(rows: Row[], base: Set<string>, max: number): Page[] {
  const left = new Set(rows);
  const pages: Page[] = [];
  const modsOf = (r: Row) => r.stems.filter((s, i) => !inBase(s, base) && !STOP.has(r.tokens[i]) && !GENERIC.has(s) && s.length > 1);
  let minN = 2;
  while (left.size && pages.length < max) {
    const score = new Map<string, { n: number; sum: number }>();
    for (const r of left) for (const s of new Set(modsOf(r))) {
      const e = score.get(s) ?? { n: 0, sum: 0 };
      e.n += 1; e.sum += r.count ?? 0;
      score.set(s, e);
    }
    // Сначала страницы, где сошлись 2+ запроса, потом — по одному запросу
    const top = [...score.entries()].filter(([, e]) => e.n >= minN).sort((a, b) => b[1].sum - a[1].sum || b[1].n - a[1].n)[0];
    if (!top) { if (minN === 2) { minN = 1; continue; } break; }
    const group = [...left].filter((r) => modsOf(r).includes(top[0])).sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
    group.forEach((r) => left.delete(r));
    pages.push({ name: cap(group[0].phrase), demand: group.reduce((s, r) => s + (r.count ?? 0), 0), phrases: group });
  }
  if (left.size) {
    const rest = [...left].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
    pages.push({ name: "Остальные запросы", demand: rest.reduce((s, r) => s + (r.count ?? 0), 0), phrases: rest });
  }
  return pages;
}

export function buildStructure(rows: Row[], product: string, masks: string[] = []): Structure {
  const work = rows.filter((r) => r.status === "work");
  const base = new Set(tokenize(normalize([product, ...masks].join(" "))).map(stem));
  // Если не сказали, что продаёте, основой считаем самые частые слова
  if (!base.size) demandWords(work, 2).forEach((w) => base.add(w.stem));
  const comm = work.filter((r) => r.intent !== "info");
  const blog = work.filter((r) => r.intent === "info");
  const head = comm.filter((r) => r.stems.every((s, i) => inBase(s, base) || STOP.has(r.tokens[i]) || GENERIC.has(s)));
  const rest = comm.filter((r) => !head.includes(r));
  const commercial = groupPages(rest, base, 40);
  if (head.length) commercial.unshift({ name: "Главная и каталог", demand: head.reduce((s, r) => s + (r.count ?? 0), 0), phrases: head.sort((a, b) => (b.count ?? 0) - (a.count ?? 0)) });
  return { commercial, blog: groupPages(blog, base, 30) };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ——— Генератор фраз (перемножение) ———

export type MatchType = "broad" | "quotes" | "fix" | "order";

export function multiply(cols: string[][], match: MatchType = "broad", limit = 20000): string[] {
  const lists = cols.map((c) => c.map((s) => s.trim()).filter(Boolean)).filter((c) => c.length);
  if (!lists.length) return [];
  let acc: string[] = [""];
  for (const l of lists) {
    const next: string[] = [];
    for (const a of acc) for (const w of l) { next.push(a ? `${a} ${w}` : w); if (next.length >= limit) break; }
    acc = next.slice(0, limit);
  }
  const fmt = (p: string) => {
    if (match === "quotes") return `"${p}"`;
    if (match === "fix") return p.split(" ").map((w) => `!${w}`).join(" ");
    if (match === "order") return `[${p}]`;
    return p;
  };
  return [...new Set(acc.map((p) => p.replace(/\s+/g, " ").trim()))].map(fmt);
}

// ——— Экспорт ———

export function toCsv(rows: Row[]): string {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = ["Фраза", "Показы", "Тип", "Статус", "Через", "Причина"];
  const st: Record<Status, string> = { work: "в работе", filtered: "отсеяно", form: "словоформа", removed: "убрано" };
  return "﻿" + [head, ...rows.map((r) => [r.phrase, r.count, intentLabel(r.intent), st[r.status], r.parent ?? "", r.reason ?? ""])].map((l) => l.map(esc).join(";")).join("\r\n");
}

export function structureRows(s: Structure): (string | number)[][] {
  const out: (string | number)[][] = [["Раздел", "Страница", "Спрос, показы", "Фраза", "Показы"]];
  const add = (section: string, pages: Page[]) => pages.forEach((p) => p.phrases.forEach((r, i) => out.push([section, i ? "" : p.name, i ? "" : p.demand, r.phrase, r.count ?? ""])));
  add("Коммерческие страницы", s.commercial);
  add("Блог", s.blog);
  return out;
}

export const fmt = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString("ru-RU"));

// ——— Демо-данные (частоты условные) ———

export const DEMO_MASKS = ["натяжные потолки", "натяжной потолок"];
export const DEMO = `натяжные потолки	412000
натяжные потолки цена	98000
натяжные потолки москва	61000
натяжной потолок	54000
натяжные потолки цена за м2 с установкой	38000
натяжные потолки фото	31000
натяжные потолки отзывы	12400
натяжные потолки с подсветкой	22000
натяжные потолки установка	18500
натяжные потолки купить	14200
натяжные потолки в зале	9800
натяжные потолки в спальню	8600
натяжные потолки на кухне	11300
натяжные потолки в ванной	7400
натяжные потолки глянцевые	6900
натяжные потолки матовые	8100
натяжные потолки сатиновые	4200
натяжные потолки двухуровневые	12900
натяжные потолки парящие	15600
парящие натяжные потолки цена	5100
теневой натяжной потолок	6300
натяжные потолки с световыми линиями	9400
световые линии на натяжном потолке цена	3900
натяжной потолок звездное небо	7200
натяжные потолки тканевые	5600
тканевые натяжные потолки цена	2100
натяжные потолки калькулятор	8800
рассчитать стоимость натяжного потолка	4600
натяжные потолки под ключ	3700
натяжные потолки недорого	6200
натяжные потолки акция	2300
натяжные потолки производитель	1900
натяжные потолки своими руками	5400
как установить натяжной потолок самостоятельно	2600
как помыть натяжной потолок	9100
чем мыть натяжной потолок	4800
как снять натяжной потолок	3100
какой натяжной потолок лучше матовый или глянцевый	3300
натяжной потолок плюсы и минусы	2700
сколько стоит натяжной потолок	7600
натяжной потолок вред для здоровья	2200
натяжной потолок затопили соседи что делать	2900
натяжные потолки спб	14800
натяжные потолки екатеринбург	9700
натяжные потолки казань	5200
натяжные потолки авито	3400
натяжные потолки вакансии	1800
натяжные потолки видео	2500
натяжные потолки скачать каталог	600
натяжные потолки картинки	1400
потолки натяжные	3200
натяжных потолков	2800
натяжные потолки мск	2100
натяжные потолки с фотопечатью	3500
натяжные потолки в коридор	2400
натяжной потолок в детской	2300
натяжные потолки msd	1700
натяжные потолки pongs	900
натяжные потолки lumfer	800
ремонт натяжного потолка	3600
замена натяжного потолка	1500
слив воды с натяжного потолка	2700
натяжные потолки б у	300
натяжные потолки бесплатный замер	1100
натяжные потолки замер	2600
натяжные потолки рассрочка	700`;
