// Правила бесплатных аудитов /site-audit/ и /seo-audit/. Факты собирает public/api/audit.php, оценку считает браузер.
// Статус проверки: pass — хорошо, warn — стоит поправить, fail — важно исправить, info — для сведения (в оценку не входит).

export type Facts = {
  url: string; final: string; chain: { url: string; status: number; error?: string | null }[]; status: number; ttfb: number; time: number;
  bytes: number; cut: boolean; ssl: boolean | null; contentType: string; headers: Record<string, string>;
  html: {
    title: string | null; description: string | null; robots: string | null; canonical: string | null; lang: string | null; viewport: string | null; charset: string | null;
    headings: [number, string][]; og: Record<string, string>; twitter: Record<string, string>; jsonld: string[]; hreflang: string[];
    images: number; imagesNoAlt: number; imagesNoAltSrc: string[]; imagesLazy: number; imagesNoSize: number;
    links: number; internal: number; external: number; nofollow: number; emptyLinks: number; words: number; text: string;
    scripts: number; scriptsExternal: number; styles: number; iframes: number; forms: number; favicon: boolean; manifest: boolean; appleIcon: boolean;
    verification: string[]; analytics: string[]; generator: string | null; microdata: boolean; textRatio: number; inlineStylesBytes: number; deprecated: number;
    // для GEO-проверки (в старых кэшах их может не быть)
    lists?: number; tables?: number; tel?: number; mailto?: number; times?: number; metaAuthor?: string | null; sameAs?: number; author?: boolean; dates?: boolean; lead?: string | null; leadWords?: number;
  };
  robots: { status: number; text: string | null };
  sitemap: { url: string; status: number; urls: number; index: boolean; xml: boolean; lastmod: number };
  llms: { status: number; bytes: number };
  notFound: { status: number };
  faviconIco: number;
  httpRedirect: { status: number; location: string | null };
  wwwVariant: { host: string; status: number; location: string | null; error?: string | null };
  bots?: Record<string, number>;
};

export type Status = "pass" | "warn" | "fail" | "info";
export type Check = { id: string; title: string; status: Status; value?: string; why: string; fix?: string; weight: number };
export type Group = { title: string; checks: Check[] };
export type Mode = "site" | "seo" | "geo";

const c = (id: string, title: string, status: Status, why: string, fix?: string, value?: string, weight = 1): Check => ({ id, title, status, why, fix, value, weight });
const len = (s: string | null) => (s ?? "").replace(/\s+/g, " ").trim().length;
const kb = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} МБ` : `${Math.round(n / 1024)} КБ`);
const host = (u: string) => { try { return new URL(u).host.replace(/^www\./, ""); } catch { return u; } };

/** robots.txt: какие боты закрыты целиком (Disallow: / в своей группе или в группе *) */
export function robotsBlocked(text: string | null, bots: string[]) {
  if (!text) return { all: false, blocked: [] as string[] };
  const groups: { agents: string[]; rules: string[] }[] = [];
  let cur: { agents: string[]; rules: string[] } | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const [, k, v] = m;
    if (k.toLowerCase() === "user-agent") { if (!cur || cur.rules.length) { cur = { agents: [], rules: [] }; groups.push(cur); } cur.agents.push(v.toLowerCase()); }
    else if (cur && /^(dis)?allow$/i.test(k)) cur.rules.push(`${k.toLowerCase()}:${v.trim()}`);
  }
  const blockedFor = (agent: string) => {
    const g = groups.find((x) => x.agents.includes(agent.toLowerCase())) ?? groups.find((x) => x.agents.includes("*"));
    return !!g && g.rules.includes("disallow:/") && !g.rules.some((r) => r === "allow:/");
  };
  return { all: blockedFor("*"), blocked: bots.filter(blockedFor) };
}

const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot", "Google-Extended", "YandexBot", "DeepSeekBot"];

export function audit(f: Facts, mode: Mode): Group[] {
  const h = f.html;
  const https = f.final.startsWith("https://");
  const h1 = h.headings.filter(([l]) => l === 1);
  const skips = h.headings.some(([l], i) => i > 0 && l - h.headings[i - 1][0] > 1);
  const rb = robotsBlocked(f.robots.text, AI_BOTS);
  const noindex = /noindex/i.test(h.robots ?? "") || /noindex/i.test(f.headers["x-robots-tag"] ?? "");
  const redirects = f.chain.length - 1;
  const hsts = !!f.headers["strict-transport-security"];
  const sec = ["x-content-type-options", "referrer-policy"].filter((k) => f.headers[k]).length + (f.headers["x-frame-options"] || /frame-ancestors/.test(f.headers["content-security-policy"] ?? "") ? 1 : 0);
  const ogImage = !!h.og["og:image"];
  const canonicalOk = !!h.canonical && host(h.canonical.startsWith("http") ? h.canonical : f.final) === host(f.final);
  const httpToHttps = f.httpRedirect.status >= 300 && f.httpRedirect.status < 400 && (f.httpRedirect.location ?? "").startsWith("https://");
  const wwwOk = !!f.wwwVariant.error || (f.wwwVariant.status >= 300 && f.wwwVariant.status < 400 && host(f.wwwVariant.location ?? "") === host(f.final)) || f.wwwVariant.status === 0;
  const jsHeavy = h.words < 150 && h.scripts > 5;

  const access: Group = { title: "Доступность и безопасность", checks: [
    c("status", "Страница отвечает", f.status === 200 ? "pass" : "fail", "Поисковики и нейросети индексируют только страницы с кодом 200.", "Проверьте, что адрес не отдаёт ошибку и не закрыт паролем.", `код ${f.status}`, 3),
    c("redirects", "Редиректы до страницы", redirects === 0 ? "pass" : redirects === 1 ? "warn" : "fail", "Каждый редирект добавляет задержку и теряет часть веса ссылок.", "Ставьте ссылки сразу на конечный адрес, цепочку сократите до одного шага.", redirects ? `${redirects} шаг${redirects > 1 ? "а" : ""}: ${f.chain.map((x) => x.status).join(" → ")}` : "нет"),
    c("https", "HTTPS", https ? (f.ssl === false ? "fail" : "pass") : "fail", "Без HTTPS браузеры помечают сайт как небезопасный, а поисковики понижают в выдаче.", "Выпустите бесплатный сертификат Let’s Encrypt в панели хостинга.", https ? (f.ssl === false ? "сертификат не прошёл проверку" : "сертификат в порядке") : "сайт открывается по http", 2),
    c("http-redirect", "Редирект с http на https", f.httpRedirect.status === 0 ? "info" : httpToHttps ? "pass" : "warn", "Если http-версия открывается без редиректа, у сайта два адреса и дубли страниц.", "Настройте 301-редирект с http:// на https:// в панели хостинга или в .htaccess.", f.httpRedirect.status === 0 ? "не удалось проверить" : `код ${f.httpRedirect.status}`),
    c("www", "Одно зеркало: с www или без", wwwOk ? "pass" : "warn", "Если сайт открывается и с www, и без, поисковик видит два сайта с одинаковыми страницами.", `Настройте 301-редирект с ${f.wwwVariant.host} на основной адрес.`, f.wwwVariant.error ? "второе зеркало не отвечает" : `${f.wwwVariant.host}: код ${f.wwwVariant.status}`),
    c("hsts", "Заголовок HSTS", https ? (hsts ? "pass" : "warn") : "info", "Браузер запоминает, что сайт работает только по HTTPS, и не делает лишний переход по http.", "Добавьте заголовок Strict-Transport-Security: max-age=31536000."),
    c("security-headers", "Заголовки безопасности", sec >= 3 ? "pass" : sec >= 1 ? "warn" : "fail", "Защищают от встраивания сайта в чужие страницы и подмены типов файлов.", "Добавьте X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN и Referrer-Policy.", `${sec} из 3`, 0.5),
  ] };

  const speed: Group = { title: "Скорость", checks: [
    c("ttfb", "Время ответа сервера", f.ttfb < 600 ? "pass" : f.ttfb < 1500 ? "warn" : "fail", "Пока сервер не ответил, браузер показывает пустой экран. Норма — до 0,6 секунды.", "Включите кэширование страниц, статическую сборку или хостинг ближе к аудитории.", `${(f.ttfb / 1000).toFixed(2)} с`, 2),
    c("html-size", "Вес HTML", f.bytes < 300000 ? "pass" : f.bytes < 1000000 ? "warn" : "fail", "Тяжёлый HTML дольше грузится на мобильном интернете.", "Уберите встроенные картинки в base64, лишнюю разметку и инлайн-скрипты.", kb(f.bytes)),
    c("compression", "Сжатие gzip или Brotli", f.headers["content-encoding"] ? "pass" : "fail", "Сжатие уменьшает трафик в 3⁠–⁠5 раз.", "Включите gzip или Brotli в настройках сервера.", f.headers["content-encoding"] ?? "нет"),
    c("cache", "Кэширование", f.headers["cache-control"] ? "pass" : "warn", "Заголовок Cache-Control подсказывает браузеру, что можно не скачивать повторно.", "Настройте Cache-Control для страниц и долгий кэш для картинок, стилей и скриптов.", f.headers["cache-control"] ?? "не задано", 0.5),
    c("images-size", "Размеры у картинок", h.images === 0 || h.imagesNoSize / h.images < 0.2 ? "pass" : "warn", "Без width и height страница «прыгает» при загрузке картинок — это портит метрику CLS.", "Укажите ширину и высоту у тегов img.", h.images ? `без размеров ${h.imagesNoSize} из ${h.images}` : "картинок нет", 0.5),
    c("scripts", "Внешние скрипты", h.scriptsExternal <= 15 ? "pass" : h.scriptsExternal <= 30 ? "warn" : "fail", "Каждый скрипт — отдельный запрос и время на выполнение.", "Уберите неиспользуемые виджеты и счётчики, отложите загрузку остальных.", `${h.scriptsExternal}`, 0.5),
  ] };

  const mobile: Group = { title: "Мобильная версия и удобство", checks: [
    c("viewport", "Мобильная версия (viewport)", h.viewport ? "pass" : "fail", "Без meta viewport телефон показывает уменьшенную версию для компьютера.", "Добавьте <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.", undefined, 2),
    c("lang", "Язык страницы", h.lang ? "pass" : "warn", "Атрибут lang помогает экранным читалкам и поисковикам.", "Добавьте <html lang=\"ru\">.", h.lang ?? "не указан", 0.5),
    c("alt", "Описания у картинок (alt)", h.images === 0 || h.imagesNoAlt === 0 ? "pass" : h.imagesNoAlt / h.images < 0.2 ? "warn" : "fail", "Alt читают незрячие люди, поиск по картинкам и нейросети.", "Опишите в alt, что на картинке. Для декоративных — пустой alt=\"\".", h.images ? `без alt ${h.imagesNoAlt} из ${h.images}` : "картинок нет"),
    c("empty-links", "Ссылки без текста", h.emptyLinks === 0 ? "pass" : "warn", "Ссылка-иконка без подписи непонятна экранной читалке и поисковику.", "Добавьте aria-label или текст внутрь ссылки.", `${h.emptyLinks}`, 0.5),
    c("favicon", "Иконка сайта (favicon)", h.favicon || f.faviconIco === 200 ? "pass" : "warn", "Иконка видна во вкладке и в выдаче Яндекса и Google.", "Добавьте favicon и <link rel=\"icon\">.", undefined, 0.5),
    c("deprecated", "Устаревшие теги", h.deprecated === 0 ? "pass" : "warn", "Теги font, center, marquee не поддерживаются стандартом.", "Замените их на CSS.", `${h.deprecated}`, 0.3),
  ] };

  const service: Group = { title: "Служебные файлы и аналитика", checks: [
    c("robots", "robots.txt", f.robots.status === 200 && f.robots.text ? (rb.all ? "fail" : "pass") : "warn", "Файл говорит поисковикам, что можно индексировать.", rb.all ? "Сейчас сайт закрыт строкой Disallow: / — уберите её." : "Создайте robots.txt со ссылкой на карту сайта.", f.robots.status === 200 ? (rb.all ? "сайт закрыт от индексации" : "есть") : `код ${f.robots.status}`, rb.all ? 3 : 1),
    c("sitemap", "Карта сайта sitemap.xml", f.sitemap.status === 200 && f.sitemap.xml ? "pass" : "warn", "Карта помогает поисковикам быстрее находить новые страницы.", "Сгенерируйте sitemap.xml и укажите её в robots.txt.", f.sitemap.xml ? (f.sitemap.index ? "индекс карт" : `${f.sitemap.urls} адресов`) : `код ${f.sitemap.status}`),
    c("404", "Страница 404", f.notFound.status === 404 || f.notFound.status === 410 ? "pass" : "fail", "Если несуществующий адрес отдаёт 200, в индекс попадают мусорные страницы.", "Настройте ответ 404 для несуществующих адресов.", `несуществующий адрес → код ${f.notFound.status}`),
    c("analytics", "Счётчик аналитики", h.analytics.length ? "pass" : "warn", "Без аналитики не видно, откуда приходят клиенты и что они делают.", "Подключите Яндекс Метрику — она бесплатная.", h.analytics.join(", ") || "не найден", 0.5),
    c("cms", "Платформа сайта", "info", "Платформа влияет на скорость и на то, что можно настроить.", undefined, h.generator ?? "не определена", 0),
  ] };

  const index: Group = { title: "Индексация", checks: [
    c("noindex", "Страница открыта для индексации", noindex ? "fail" : "pass", "Тег noindex или заголовок X-Robots-Tag убирают страницу из поиска.", "Уберите noindex с тех страниц, которые должны быть в поиске.", noindex ? "noindex" : "открыта", 3),
    c("robots-all", "robots.txt не закрывает сайт", rb.all ? "fail" : f.robots.status === 200 ? "pass" : "warn", "Строка Disallow: / для всех ботов закрывает весь сайт.", "Проверьте robots.txt.", f.robots.status === 200 ? (rb.all ? "закрыт" : "открыт") : "файла нет", 2),
    c("canonical", "Канонический адрес", canonicalOk ? "pass" : h.canonical ? "warn" : "warn", "rel=canonical говорит, какой адрес страницы главный, и убирает дубли.", "Добавьте <link rel=\"canonical\"> с адресом этой страницы.", h.canonical ?? "нет"),
    c("sitemap-seo", "Карта сайта", f.sitemap.xml ? "pass" : "warn", "Без карты новые страницы индексируются медленнее.", "Сделайте sitemap.xml и добавьте её в Яндекс Вебмастер и Search Console.", f.sitemap.xml ? (f.sitemap.index ? "индекс карт" : `${f.sitemap.urls} адресов, lastmod у ${f.sitemap.lastmod}`) : "нет"),
    c("verify", "Вебмастер и Search Console", h.verification.length ? "pass" : "info", "Подтверждённый сайт в панелях поисковиков показывает ошибки индексации и запросы.", "Подтвердите права в Яндекс Вебмастере и Google Search Console (мета-тег или файл).", h.verification.length ? h.verification.join(", ") : "мета-тег не найден — мог быть подтверждён файлом", 0),
  ] };

  const meta: Group = { title: "Заголовок и описание", checks: [
    c("title", "Тег title", !h.title ? "fail" : len(h.title) >= 30 && len(h.title) <= 70 ? "pass" : "warn", "Title — заголовок сниппета в поиске. Оптимально 40⁠–⁠65 символов с главным запросом в начале.", "Напишите уникальный title: что это за страница + запрос + бренд.", h.title ? `${len(h.title)} символов: «${h.title}»` : "нет", 3),
    c("description", "Meta description", !h.description ? "fail" : len(h.description) >= 70 && len(h.description) <= 170 ? "pass" : "warn", "Описание часто попадает в сниппет. Оптимально 120⁠–⁠160 символов с выгодой и призывом.", "Напишите описание страницы своими словами, без повторов title.", h.description ? `${len(h.description)} символов` : "нет", 2),
    c("og", "Карточка для соцсетей (Open Graph)", h.og["og:title"] && ogImage ? "pass" : h.og["og:title"] ? "warn" : "fail", "Без og:title и og:image ссылка в Telegram и VK выглядит пустой.", "Добавьте og:title, og:description и og:image 1200×630.", [h.og["og:title"] ? "title" : "", h.og["og:description"] ? "description" : "", ogImage ? "image" : ""].filter(Boolean).join(", ") || "нет"),
    c("charset", "Кодировка", h.charset ? "pass" : "warn", "Без явной кодировки русский текст может отображаться кракозябрами.", "Добавьте <meta charset=\"utf-8\">.", h.charset ?? "не указана", 0.3),
  ] };

  const content: Group = { title: "Контент и структура", checks: [
    c("h1", "Один заголовок H1", h1.length === 1 ? "pass" : h1.length === 0 ? "fail" : "warn", "H1 — главный заголовок страницы. Поисковики и нейросети по нему понимают тему.", h1.length ? "Оставьте один H1, остальные сделайте H2." : "Добавьте H1 с главным запросом.", h1.length ? h1.map((x) => `«${x[1]}»`).join(", ") : "нет", 2),
    c("headings", "Иерархия заголовков", h.headings.length < 3 ? "warn" : skips ? "warn" : "pass", "Заголовки H2–H3 делят текст на смысловые блоки — так его легче читать людям и разбирать нейросетям.", "Стройте заголовки по порядку: H1 → H2 → H3, без пропусков уровней.", `${h.headings.length} заголовков${skips ? ", есть пропуски уровней" : ""}`),
    c("words", "Объём текста", h.words >= 300 ? "pass" : h.words >= 120 ? "warn" : "fail", "Страницам с коротким текстом сложно ранжироваться и попадать в ответы нейросетей.", "Ответьте на вопросы клиента: что это, для кого, сколько стоит, как заказать. Добавьте FAQ.", `${h.words} слов`, 2),
    c("text-html", "Текст в HTML, а не в скриптах", jsHeavy ? "fail" : h.words >= 150 ? "pass" : "warn", "Многие боты, в том числе нейросетей, не выполняют JavaScript и видят только текст из HTML.", "Отдавайте текст в HTML: статическая сборка или серверный рендеринг.", `${h.words} слов видно без JavaScript`),
    c("alt-seo", "Alt у картинок", h.images === 0 || h.imagesNoAlt === 0 ? "pass" : h.imagesNoAlt / h.images < 0.2 ? "warn" : "fail", "Alt — источник трафика из поиска по картинкам и подсказка для нейросетей.", "Опишите картинки словами, с запросом там, где это естественно.", h.images ? `без alt ${h.imagesNoAlt} из ${h.images}` : "картинок нет"),
    c("internal", "Внутренние ссылки", h.internal >= 5 ? "pass" : "warn", "Ссылки на другие страницы сайта помогают роботам найти их и передают вес.", "Добавьте ссылки на услуги, статьи и связанные страницы.", `${h.internal} внутренних, ${h.external} внешних`),
  ] };

  const types = h.jsonld.filter((t) => !t.startsWith("!"));
  const schema: Group = { title: "Разметка и нейросети (GEO)", checks: [
    c("jsonld", "Разметка Schema.org (JSON-LD)", h.jsonld.includes("!ошибка JSON") ? "fail" : types.length ? "pass" : h.microdata ? "warn" : "fail", "Разметка объясняет роботам, что на странице: компания, услуга, товар, статья, вопросы.", "Добавьте JSON-LD: Organization или LocalBusiness на главной, Service, Product, Article, FAQPage — на своих страницах.", types.length ? types.slice(0, 8).join(", ") : h.microdata ? "только microdata" : "нет", 2),
    c("faq", "Вопросы и ответы (FAQPage)", types.includes("FAQPage") ? "pass" : "warn", "Блок вопросов с разметкой часто цитируют нейросети и показывают в расширенном сниппете.", "Добавьте 4⁠–⁠8 частых вопросов клиентов с короткими ответами и разметкой FAQPage.", types.includes("FAQPage") ? "есть" : "нет"),
    c("ai-bots", "Доступ для ботов нейросетей", rb.blocked.length === 0 ? "pass" : rb.blocked.length < 3 ? "warn" : "fail", "Если GPTBot, ClaudeBot или PerplexityBot закрыты в robots.txt, нейросети не прочитают сайт и не порекомендуют его.", "Откройте ботов нейросетей в robots.txt.", rb.blocked.length ? `закрыты: ${rb.blocked.join(", ")}` : "открыт для всех", 2),
    c("llms", "Файл llms.txt", f.llms.bytes > 0 ? "pass" : "warn", "llms.txt — краткая справка о сайте для нейросетей: кто вы, что продаёте, где главное.", "Создайте /llms.txt по стандарту llmstxt.org.", f.llms.bytes ? kb(f.llms.bytes) : "нет", 0.5),
    c("hreflang", "Языковые версии (hreflang)", h.hreflang.length ? "pass" : "info", "Нужно, только если у сайта несколько языков.", undefined, h.hreflang.length ? h.hreflang.join(", ") : "нет", 0),
  ] };

  if (mode === "site") return [access, speed, mobile, service];
  if (mode === "seo") return [index, meta, content, schema];

  // --- GEO: готовность сайта к ответам нейросетей ---------------------------------------------------
  const bots = f.bots ?? {};
  const botNames = Object.keys(bots);
  const botBad = botNames.filter((b) => !(bots[b] >= 200 && bots[b] < 400));
  const name = (b: string) => ({ GPTBot: "ChatGPT", ClaudeBot: "Claude", PerplexityBot: "Perplexity", YandexBot: "Алиса AI и Яндекс" } as Record<string, string>)[b] ?? b;
  const questions = h.headings.filter(([l, t]) => l >= 2 && /\?\s*$/.test(t)).length;
  const entity = types.some((t) => /^(Organization|LocalBusiness|Corporation|ProfessionalService|Person|Store|Restaurant|MedicalBusiness|EducationalOrganization)$/.test(t) || /Business$/.test(t));
  const lead = h.leadWords ?? 0;
  const geoAccess: Group = { title: "Доступ для нейросетей", checks: [
    c("bots-server", "Сервер пускает ботов нейросетей", !botNames.length ? "info" : botBad.length === 0 ? "pass" : botBad.length < botNames.length ? "warn" : "fail", "Хостинг или защита от DDoS иногда отвечают ботам нейросетей ошибкой 403 — тогда сайт для них не существует, что бы ни было в robots.txt.", "Попросите хостинг или разработчика разрешить ботов в настройках защиты (Cloudflare, DDoS-Guard, файрвол хостинга).", botNames.length ? botNames.map((b) => `${name(b)}: ${bots[b] || "нет ответа"}`).join(", ") : "повторите проверку через полчаса", 3),
    c("ai-bots", "robots.txt открыт для ботов нейросетей", rb.blocked.length === 0 ? "pass" : rb.blocked.length < 3 ? "warn" : "fail", "GPTBot, ClaudeBot, PerplexityBot и YandexBot читают robots.txt перед визитом. Закрытый бот не прочитает сайт, и нейросеть будет пересказывать о вас чужие страницы.", "Уберите Disallow для ботов нейросетей или добавьте для них Allow: /.", rb.blocked.length ? `закрыты: ${rb.blocked.join(", ")}` : "открыт", 3),
    c("noindex-geo", "Страница открыта для индексации", noindex ? "fail" : "pass", "Алиса AI и Нейро отвечают по индексу Яндекса, ChatGPT — по индексу Bing. Страница с noindex в ответы не попадёт.", "Уберите noindex со страниц, которые должны быть в поиске и ответах.", noindex ? "noindex" : "открыта", 2),
    c("text-geo", "Текст виден без JavaScript", jsHeavy ? "fail" : h.words >= 150 ? "pass" : "warn", "Большинство ботов нейросетей не выполняют скрипты и видят только HTML. Если текст собирается в браузере, для них страница пустая.", "Отдавайте текст в HTML: статическая сборка или серверный рендеринг. На Tilda — текст в блоках, а не на картинках.", `${h.words} слов в HTML`, 3),
    c("llms-geo", "Файл llms.txt", f.llms.bytes > 0 ? "pass" : "warn", "Краткая справка о сайте для нейросетей: кто вы, что продаёте, какие страницы главные.", "Создайте /llms.txt по стандарту llmstxt.org — 20⁠–⁠40 строк.", f.llms.bytes ? kb(f.llms.bytes) : "нет", 1),
    c("sitemap-geo", "Карта сайта", f.sitemap.xml ? (f.sitemap.lastmod ? "pass" : "warn") : "warn", "По карте боты находят новые страницы, а по lastmod — понимают, что текст обновился.", "Сделайте sitemap.xml с датами lastmod и укажите её в robots.txt.", f.sitemap.xml ? (f.sitemap.index ? "индекс карт" : `${f.sitemap.urls} адресов, lastmod у ${f.sitemap.lastmod}`) : "нет", 1),
  ] };
  const geoContent: Group = { title: "Ответы, которые удобно цитировать", checks: [
    c("lead", "Прямой ответ в начале страницы", lead >= 20 && lead <= 90 ? "pass" : lead ? "warn" : "fail", "Нейросети цитируют короткие самодостаточные абзацы. Первый абзац должен сразу отвечать: что это, для кого, сколько стоит, где.", "Начните страницу с абзаца на 30⁠–⁠60 слов, который отвечает на главный вопрос без вступлений.", h.lead ? `${lead} слов: «${h.lead.slice(0, 140)}${h.lead.length > 140 ? "…" : ""}»` : "абзаца с текстом не нашёл", 3),
    c("questions", "Заголовки-вопросы", questions >= 3 ? "pass" : questions ? "warn" : "fail", "Люди спрашивают нейросети вопросами. Заголовок «Сколько стоит…?» с ответом под ним легко забрать в ответ.", "Сделайте часть H2–H3 вопросами клиентов и отвечайте под ними в первом предложении.", `${questions} из ${h.headings.length}`, 2),
    c("faq-geo", "Блок FAQ с разметкой", types.includes("FAQPage") ? "pass" : "warn", "Вопросы и ответы с разметкой FAQPage — самый цитируемый формат.", "Добавьте 5⁠–⁠8 частых вопросов с короткими ответами и разметкой FAQPage.", types.includes("FAQPage") ? "есть" : "нет", 2),
    c("structure", "Списки и таблицы", (h.lists ?? 0) + (h.tables ?? 0) >= 2 ? "pass" : (h.lists ?? 0) + (h.tables ?? 0) ? "warn" : "fail", "Перечни, шаги и таблицы сравнения нейросети переносят в ответ почти дословно.", "Оформите этапы, состав услуги и цены списками или таблицей.", `списков: ${h.lists ?? 0}, таблиц: ${h.tables ?? 0}`, 1),
    c("words-geo", "Объём текста", h.words >= 400 ? "pass" : h.words >= 150 ? "warn" : "fail", "Короткой странице нечем ответить на уточняющие вопросы — нейросеть возьмёт ответ у конкурента.", "Раскройте услугу: для кого, что входит, сроки, цены, примеры, вопросы.", `${h.words} слов`, 1),
  ] };
  const geoTrust: Group = { title: "Кто вы: сущность и доверие", checks: [
    c("entity", "Разметка компании или автора", entity ? "pass" : "fail", "Organization, LocalBusiness или Person в JSON-LD говорят нейросети, кто стоит за сайтом, — без этого ей сложнее связать сайт с брендом.", "Добавьте JSON-LD Organization (или LocalBusiness, Person) с названием, адресом, телефоном и логотипом.", types.length ? types.slice(0, 8).join(", ") : "разметки нет", 3),
    c("sameas", "Ссылки на профили (sameAs)", (h.sameAs ?? 0) >= 2 ? "pass" : (h.sameAs ?? 0) ? "warn" : "fail", "sameAs связывает сайт с Яндекс Бизнесом, 2ГИС, VK, Telegram и Хабром. По этим связям нейросеть понимает, что это одна компания.", "Перечислите в sameAs ссылки на карточки в картах, соцсети и каталоги.", `${h.sameAs ?? 0} ссылок`, 2),
    c("contacts", "Контакты в HTML", (h.tel ?? 0) + (h.mailto ?? 0) ? "pass" : "warn", "Телефон и почта ссылками — сигнал, что за сайтом стоит реальный бизнес.", "Добавьте кликабельные телефон и почту в шапку или подвал.", `телефон: ${h.tel ? "да" : "нет"}, почта: ${h.mailto ? "да" : "нет"}`, 1),
    c("author", "Автор", h.author || h.metaAuthor ? "pass" : "warn", "У текста с автором больше веса: нейросети ценят экспертность и первоисточник.", "Укажите автора в разметке (author) и на странице — с должностью и опытом.", h.author ? "в разметке" : h.metaAuthor ? h.metaAuthor : "не указан", 1),
    c("dates", "Даты публикации и обновления", h.dates || (h.times ?? 0) ? "pass" : "warn", "Свежесть — один из сигналов при выборе источника для ответа.", "Добавьте datePublished и dateModified в разметку и дату обновления на странице.", h.dates ? "в разметке" : h.times ? "тег time" : "нет", 1),
  ] };
  return [geoAccess, geoContent, geoTrust];
}

export function score(groups: Group[]) {
  let got = 0, max = 0;
  for (const g of groups) for (const k of g.checks) {
    if (k.status === "info") continue;
    max += k.weight;
    got += k.status === "pass" ? k.weight : k.status === "warn" ? k.weight * 0.5 : 0;
  }
  return max ? Math.round((got / max) * 100) : 0;
}

/** Самое важное: провалы, потом предупреждения — по весу */
export function priorities(groups: Group[], n = 5) {
  const rank = { fail: 0, warn: 1, pass: 2, info: 3 } as const;
  return groups.flatMap((g) => g.checks).filter((k) => k.status === "fail" || k.status === "warn").sort((a, b) => rank[a.status] - rank[b.status] || b.weight - a.weight).slice(0, n);
}

/** Текст отчёта для копирования — уходит в Telegram или в задачу разработчику */
export function reportText(f: Facts, groups: Group[], mode: Mode) {
  const mark = { pass: "✅", warn: "⚠️", fail: "❌", info: "ℹ️" } as const;
  const lines = [`${mode === "site" ? "Аудит сайта" : mode === "seo" ? "SEO-аудит" : "GEO-проверка"}: ${f.final}`, `Оценка: ${score(groups)}/100`, ""];
  for (const g of groups) {
    lines.push(g.title);
    for (const k of g.checks) lines.push(`${mark[k.status]} ${k.title}${k.value ? ` — ${k.value}` : ""}${k.status !== "pass" && k.fix ? `\n   → ${k.fix}` : ""}`);
    lines.push("");
  }
  lines.push("Проверено на nikalimp.ru");
  return lines.join("\n");
}
