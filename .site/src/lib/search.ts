// Движок встроенного поиска: без зависимостей, работает в браузере по /search-index.json.
// Ищет по началу слов с грубым стеммингом («нейросетях» найдёт «нейросети»),
// понимает ё/е и запрос в неправильной раскладке («utj» → «гео»).

export type SearchDoc = {
  t: string; // заголовок
  u: string; // адрес
  s: string; // раздел: Услуги, Продукты, Блог, Глоссарий, Инструменты, Страницы
  d?: string; // короткое описание
  k?: string; // ключевые слова: синонимы, английское название, категория
  b?: string; // начало текста страницы
};

export type SearchHit = SearchDoc & { score: number; snippet: string; terms: string[] };

export const SECTION_ORDER = ["Услуги", "Продукты", "Глоссарий", "Инструменты", "Шрифты", "Дизайн-системы", "UI-библиотеки", "Стартапы", "Блог", "Страницы"];

export const normalize = (s: string) =>
  s.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]+/g, " ").trim();

// Отрезаем окончание у длинных русских слов: «продвижения» → «продвижен»
function stem(w: string) {
  if (/[а-я]/.test(w)) {
    if (w.length >= 7) return w.slice(0, -2);
    if (w.length >= 5) return w.slice(0, -1);
  } else if (w.length >= 5 && w.endsWith("s")) return w.slice(0, -1);
  return w;
}

const EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`";
const RU = "йцукенгшщзхъфывапролджэячсмитьбюё";
const swap = (s: string, from: string, to: string) =>
  [...s.toLowerCase()].map((c) => (from.includes(c) ? to[from.indexOf(c)] : c)).join("");

type Prepared = { doc: SearchDoc; t: string; k: string; d: string; b: string };
const cache = new WeakMap<SearchDoc[], Prepared[]>();
function prepare(docs: SearchDoc[]) {
  let p = cache.get(docs);
  if (!p) {
    p = docs.map((doc) => ({ doc, t: ` ${normalize(doc.t)} `, k: ` ${normalize(doc.k ?? "")} `, d: ` ${normalize(doc.d ?? "")} `, b: ` ${normalize(doc.b ?? "")} ` }));
    cache.set(docs, p);
  }
  return p;
}

// Фрагмент текста вокруг первого совпадения — когда слово нашлось только в тексте страницы
function snippetAround(text: string, terms: string[], len = 150) {
  const low = text.toLowerCase().replace(/ё/g, "е");
  let at = -1;
  for (const t of terms) {
    const m = new RegExp(`(^|[^a-zа-я\\d])${t}`).exec(low);
    if (m && (at < 0 || m.index < at)) at = m.index + m[1].length;
  }
  if (at < 0) return "";
  const start = Math.max(0, text.lastIndexOf(" ", Math.max(0, at - 40)));
  const piece = text.slice(start, start + len);
  return `${start > 0 ? "…" : ""}${piece.slice(0, piece.lastIndexOf(" ") > 0 && start + len < text.length ? piece.lastIndexOf(" ") : undefined).trim()}${start + len < text.length ? "…" : ""}`;
}

function run(docs: SearchDoc[], query: string, limit: number): SearchHit[] {
  const q = normalize(query);
  if (!q) return [];
  const words = q.split(" ");
  const terms = words.map(stem);
  const hits: SearchHit[] = [];
  for (const p of prepare(docs)) {
    let score = 0;
    let onlyBody = true;
    let ok = true;
    for (let i = 0; i < terms.length; i++) {
      const t = ` ${terms[i]}`;
      let s = 0;
      if (p.t.includes(t)) s += p.t.includes(` ${words[i]} `) ? 14 : 10;
      if (p.k.includes(t)) s += 6;
      if (p.d.includes(t)) s += 3;
      if (s) onlyBody = false;
      else if (p.b.includes(t)) s += 1;
      if (!s) { ok = false; break; }
      score += s;
    }
    if (!ok) continue;
    if (p.t.trim() === q) score += 40;
    else if (p.t.startsWith(` ${q}`)) score += 20;
    const snippet = onlyBody && p.doc.b ? snippetAround(p.doc.b, terms) || p.doc.d || "" : p.doc.d ?? "";
    hits.push({ ...p.doc, score, snippet, terms });
  }
  return hits.sort((a, b) => b.score - a.score || a.t.length - b.t.length).slice(0, limit);
}

// Транслитерация для названий латиницей: «тильда» → «tilda», «фигма» → «figma»
const TR: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
const translit = (s: string) => [...normalize(s)].map((c) => TR[c] ?? c).join("");

function merge(a: SearchHit[], b: SearchHit[], limit: number) {
  const byUrl = new Map(a.map((h) => [h.u, h]));
  for (const h of b) if (!byUrl.has(h.u) || byUrl.get(h.u)!.score < h.score) byUrl.set(h.u, h);
  return [...byUrl.values()].sort((x, y) => y.score - x.score || x.t.length - y.t.length).slice(0, limit);
}

// Запрос как есть плюс его транслитерация, если в нём кириллица
function runAll(docs: SearchDoc[], query: string, limit: number) {
  const hits = run(docs, query, limit);
  if (!/[а-яё]/i.test(query)) return hits;
  const lat = translit(query);
  return lat ? merge(hits, run(docs, lat, limit).map((h) => ({ ...h, score: h.score * 0.9 })), limit) : hits;
}

export function search(docs: SearchDoc[], query: string, limit = 40): { hits: SearchHit[]; fixed?: string } {
  const hits = runAll(docs, query, limit);
  if (hits.length) return { hits };
  // Ничего не нашлось — пробуем другую раскладку клавиатуры
  const alt = /[a-z]/i.test(query) ? swap(query, EN, RU) : swap(query, RU, EN);
  if (alt === query.toLowerCase()) return { hits };
  const altHits = runAll(docs, alt, limit);
  return altHits.length ? { hits: altHits, fixed: alt } : { hits };
}

// Разбивка текста на куски для подсветки совпадений по началу слов
export function highlight(text: string, terms: string[]): { text: string; match: boolean }[] {
  if (!terms.length) return [{ text, match: false }];
  const esc = terms.filter(Boolean).sort((a, b) => b.length - a.length).map((t) => t.replace(/е/g, "[её]"));
  const re = new RegExp(`(^|[^a-zа-яё\\d])((?:${esc.join("|")})[a-zа-яё\\d]*)`, "gi");
  const out: { text: string; match: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const s = m.index! + m[1].length;
    if (s > last) out.push({ text: text.slice(last, s), match: false });
    out.push({ text: m[2], match: true });
    last = s + m[2].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), match: false });
  return out;
}
