// Типограф NikitOS — по мотивам Типографа Tilda. Без зависимостей.
// Ставит неразрывные пробелы, «ёлочки», длинное тире, многоточие, разряды чисел.
// Не трогает: frontmatter, код (``` и `), HTML-теги, URL, email, [[вики-ссылки]], адреса ссылок ](...).
//
// Ядро — копия .claude/skills/web-dev/typograf.mjs (без CLI). Применяется:
//   • статьи content/blog — при сборке (src/lib/posts.ts);
//   • тексты в src — скриптом scripts/typograf.mjs перед каждой сборкой (npm run typograf).

const NBSP = "\u00A0";

// Короткие служебные слова, которые «прилипают» к следующему слову (кроме всех 1–2-буквенных кириллических)
const STICKY = [
  "без", "безо", "для", "над", "надо", "под", "подо", "при", "про", "через", "перед", "передо", "между", "около", "возле",
  "вокруг", "после", "сквозь", "ради", "вне", "меж", "изо", "ото", "обо", "из-за", "из-под",
  "как", "что", "чем", "или", "либо", "чтобы", "если", "хотя", "пока", "лишь", "даже",
];
const PARTICLES = ["бы", "б", "ли", "ль", "же", "ж"];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function protect(text, { markdown }) {
  const saved = [];
  const keep = (m) => `\uE000${saved.push(m) - 1}\uE001`;
  const rules = [
    markdown && /^---\n[\s\S]*?\n---\n/,                 // frontmatter
    /```[\s\S]*?```|~~~[\s\S]*?~~~/g,                     // блоки кода
    /<(script|style|pre|code|textarea)\b[\s\S]*?<\/\1>/gi, // теги с кодом внутри
    /<!--[\s\S]*?-->/g,                                    // HTML-комментарии
    /<\/?[a-zA-Z][^>]*>/g,                                 // HTML-теги
    /`[^`\n]+`/g,                                          // inline-код
    /\[\[[^\]\n]+\]\]/g,                                   // [[вики-ссылки]] Obsidian
    /\]\([^)\s]*(?:\s+"[^"]*")?\)/g,                       // адрес markdown-ссылки
    /\b(?:https?:\/\/|www\.)[^\s<>()«»"]+/g,               // URL
    /[\w.+-]+@[\w-]+\.[\w.-]+/g,                           // email
    /&[a-z]+;|&#\d+;/gi,                                   // HTML-сущности
  ].filter(Boolean);
  for (const re of rules) text = text.replace(re, keep);
  return { text, restore: (t) => t.replace(/\uE000(\d+)\uE001/g, (_, i) => saved[+i]) };
}

function quotes(t) {
  // "…" → «…», вложенные → „…“
  let depth = 0;
  let out = "";
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c !== '"') { out += c; continue; }
    const prev = i ? t[i - 1] : "";
    const opening = prev === "" || /[\s(\[{«„—–\-\/\uE001\u00A0]/.test(prev) && !/\s/.test(t[i + 1] || " ");
    if (opening) { out += depth++ % 2 ? "„" : "«"; }
    else if (depth > 0) { out += --depth % 2 ? "“" : "»"; }
    else { out += c; } // непарная — не трогаем (дюймы и т. п.)
  }
  return out;
}

export function typograf(input, { html = false, markdown = true } = {}) {
  const { text, restore } = protect(input, { markdown });
  let t = text;

  t = quotes(t);
  t = t.replace(/\.{3}/g, "…");
  t = t.replace(/\((c|с)\)/gi, "©").replace(/\(r\)/gi, "®").replace(/\(tm\)/gi, "™");

  // Пробелы: двойные внутри строки → один; пробел перед знаками препинания — убрать
  t = t.replace(/(?<=\S) {2,}(?=\S)/g, " ");
  t = t.replace(/(?<=[\p{L}\d»)]) +(?=[,;:!?](?:\s|$))/gu, "");

  // Тире: « - », « -- », « – » между словами → «NBSP— »; неразрывный пробел перед любым тире
  t = t.replace(/(?<=[^\s|])[ \u00A0]+(?:--?|–|—)[ ]+(?=\S)/g, `${NBSP}— `);
  // Диапазоны чисел 5-10 → 5–10 (только короткие числа, чтобы не трогать телефоны и даты)
  t = t.replace(/(?<![\d\-+./])(\d{1,4})-(\d{1,4})(?![\d\-./])/g, "$1–$2");
  // Диапазон не рвётся по строкам: 1–2 недели целиком (невидимый word joiner U+2060 вокруг тире)
  t = t.replace(/(\d)–(?=\d)/g, "$1\u2060–\u2060");

  // Числа: разряды (5+ цифр; номера после № — лицензии, договоры — не трогаем), неразрывный пробел между разрядами и после числа
  t = t.replace(/(?<![\d.,+#/\-\p{L}])(?<!№[ \u00A0]?)(\d{5,9})(?![\d.,\p{L}])/gu, (n) => n.replace(/\B(?=(\d{3})+$)/g, NBSP));
  t = t.replace(/(?<=\d) (?=\d{3}(?!\d))/g, NBSP);
  t = t.replace(/(?<=\d) (?=[\p{L}₽$€%‰°×])/gu, NBSP);
  t = t.replace(/(№|§) ?(?=\d)/g, `$1${NBSP}`);

  // Инициалы и сокращения: А. С. Пушкин, т. е., т. д., и т. п.
  t = t.replace(/(?<![\p{L}])([А-ЯЁA-Z]\.) ?([А-ЯЁA-Z]\.) ?(?=[А-ЯЁA-Z][\p{L}-]+)/gu, `$1${NBSP}$2${NBSP}`);
  t = t.replace(/(?<![\p{L}])([А-ЯЁ]\.) (?=[А-ЯЁ][а-яё]+)/gu, `$1${NBSP}`);
  t = t.replace(/(?<![\p{L}])(т|и|др|пр)\. ?(?=(е|д|п|к|н|ч)\.)/gu, `$1.${NBSP}`);
  t = t.replace(/(?<![\p{L}])(и) (?=(т|др|пр)\.)/gu, `$1${NBSP}`);

  // Предлоги, союзы и короткие слова прилипают к следующему слову
  const sticky = new RegExp(`(?<![\\p{L}\\d\\-])([а-яё]{1,2}|${STICKY.map(esc).join("|")})[ ](?=[\\p{L}\\d«„"(\\[*_\\uE000])`, "giu");
  t = t.replace(sticky, `$1${NBSP}`);
  // Частицы прилипают к предыдущему слову
  const particles = new RegExp(`(?<=[\\p{L}])[ ](${PARTICLES.join("|")})(?![\\p{L}\\-])`, "gu");
  t = t.replace(particles, `${NBSP}$1`);

  t = restore(t);
  if (html) t = t.replaceAll(NBSP, "&nbsp;");
  return t;
}

