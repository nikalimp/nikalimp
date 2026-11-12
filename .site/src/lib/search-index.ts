import { site } from "./site";
import { audit, services } from "./services";
import { getPosts } from "./posts";
import { getTerms } from "./glossary";
import { getTools } from "./tools";
import { getStartupBase, getStartupsWithPages } from "./startups";
import { getGalleryBase, getGallerySites } from "./sites";
import { getDesignStyles } from "./design-styles";
import { getSystems, getUiLibraries } from "./design-systems";
import { getFonts } from "./fonts";
import { processAnswer } from "./process";
import { methodAnswer, methodPath, methodTitle } from "./method";
import type { SearchDoc } from "./search";

// Индекс встроенного поиска: собирается при сборке в /search-index.json,
// браузер скачивает его при первом открытии поиска. Источники — те же, что у llms.txt.

const BODY_MAX = 700; // хватает, чтобы находить по тексту, и индекс остаётся лёгким

// Markdown → простой текст: без разметки, ссылок [[…]] и неразрывных пробелов типографа
function plain(md: string) {
  return md
    .replace(/ /g, " ").replace(/⁠/g, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[\[([^\]|]+)\|([^\]]+)]]/g, "$2")
    .replace(/\[\[([^\]]+)]]/g, "$1")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/[*_`>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
const cut = (s: string, max = BODY_MAX) => (s.length > max ? s.slice(0, s.lastIndexOf(" ", max)) : s);

const pages: SearchDoc[] = [
  { t: "Услуги", u: "/services/", s: "Страницы", d: "GEO-продвижение в нейросетях, сайты на Next.js, веб-сервисы, админки и дашборды." },
  { t: "Продукты", u: "/products/", s: "Страницы", d: "GEO-аудит видимости в нейросетях и бесплатные инструменты: глоссарий, каталог сервисов, сбор семантики, генераторы политики и договора.", k: "продукты инструменты генераторы семантика" },
  { t: "GEO-аудит", u: "/geo-audit/", s: "Продукты", d: `Что нейросети отвечают о вашем бизнесе и план на 90 дней. ${audit.price} или ${audit.free}.`, k: "аудит экспресс-проверка бесплатно проверка видимости" },
  { t: "Глоссарий GEO, AEO и SEO", u: "/glossary/", s: "Продукты", d: "Термины продвижения в нейросетях и поиске простыми словами.", k: "словарь термины" },
  { t: "Каталог инструментов", u: "/tools/", s: "Продукты", d: "Сервисы для SEO, GEO, веба и дизайна: цены, аналоги, работа из России.", k: "сервисы инструменты" },
  { t: "Библиотеки", u: "/libraries/", s: "Страницы", d: "Справочные базы: стартапы, инструменты, глоссарий, дизайн-направления и шрифты.", k: "библиотеки справочник базы" },
  { t: "Дизайн-направления", u: "/design-styles/", s: "Продукты", d: "20 визуальных стилей с живыми примерами: что это, где уместно, цвета, шрифты и промпт для нейросети.", k: "стили дизайна тренды глассморфизм необрутализм" },
  { t: "Дизайн-системы", u: "/design-systems/", s: "Продукты", d: "Дизайн-системы для сайтов и сервисов с библиотеками блоков, компонентов и анимаций.", k: "дизайн-система shadcn ui mui gravity tailwind компоненты" },
  { t: "UI-библиотеки", u: "/ui-libraries/", s: "Продукты", d: "Готовые блоки, анимации, шаблоны, иконки и Figma-киты для дизайн-систем.", k: "ui библиотеки блоки секции анимации шаблоны компоненты" },
  { t: "Бесплатные шрифты с кириллицей", u: "/fonts/", s: "Продукты", d: "Кириллические шрифты: превью, начертания, лицензии и пары для сочетания.", k: "шрифты кириллица бесплатно скачать" },
  { t: "Коллекция красивых сайтов", u: "/sites/", s: "Продукты", d: "Примеры сайтов по категориям и нишам: скриншот, разбор и ссылка на каждый.", k: "примеры сайтов референсы дизайн вдохновение галерея" },
  { t: "База стартапов России", u: "/startups/", s: "Продукты", d: "Российские стартапы и продукты: поиск, фильтры по нише, городу и статусу — кто ищет инвестиции или продаёт проект.", k: "стартапы проекты продукты инвестиции кофаундер product radar" },
  { t: "Генератор политики конфиденциальности", u: "/privacy-generator/", s: "Продукты", d: "Политика обработки персональных данных и согласие по 152-ФЗ за 5 минут. Бесплатно, копирование в Tilda и HTML.", k: "152-ФЗ персональные данные политика согласие" },
  { t: "Аудит сайта онлайн", u: "/site-audit/", s: "Продукты", d: "Бесплатный технический аудит: скорость, HTTPS, мобильная версия, robots.txt, карта сайта и 404.", k: "проверка сайта скорость pagespeed lighthouse технический аудит" },
  { t: "SEO-аудит сайта онлайн", u: "/seo-audit/", s: "Продукты", d: "Бесплатная проверка страницы: title, description, H1, тексты, разметка Schema.org, доступ для нейросетей.", k: "seo проверка страницы анализ сайта онлайн geo" },
  { t: "Генератор UTM-меток", u: "/utm-generator/", s: "Продукты", d: "Ссылки с UTM-метками для Яндекс Директа, VK Рекламы, Google Ads и Telegram: пресеты, динамические параметры, транслит." },
  { t: "Генератор QR-кода", u: "/qr-generator/", s: "Продукты", d: "QR-код для ссылки, визитки, Telegram и Wi-Fi с логотипом в центре. Скачивание в SVG, PNG и JPEG." },
  { t: "Генератор договора оказания услуг", u: "/contract-generator/", s: "Продукты", d: "Договор и акт для фрилансера, студии или агентства. Бесплатно, копирование в Word.", k: "договор акт фрилансер самозанятый" },
  { t: "Сбор семантического ядра", u: "/semantics/", s: "Продукты", d: "Чистка запросов из Яндекс Вордстата: минус-слова, словоформы, типы запросов и структура сайта. Выгрузка в Excel и CSV.", k: "семантика семантическое ядро вордстат wordstat ключевые слова запросы минус-слова кластеризация группировка перемножитель директ" },
  { t: "Партнёрская программа", u: "/partners/", s: "Страницы", d: "От 5 до 10 % с каждого оплаченного договора приведённого клиента. Ставка растёт слоями, калькулятор вознаграждения.", k: "партнёрка реферальная программа вознаграждение рекомендация комиссия" },
  { t: "Этапы разработки сайта", u: "/#process", s: "Страницы", d: plain(processAnswer), k: "как работаю процесс этапы сроки" },
  { t: methodTitle, u: methodPath, s: "Страницы", d: plain(methodAnswer), k: "методика замер отчёт доля упоминаний" },
  { t: "Блог", u: "/blog/", s: "Страницы", d: "Статьи о GEO, AEO, SEO и AI-ready сайтах." },
  { t: "Кейсы", u: "/cases/", s: "Страницы", d: `${site.person}: больше 100 сайтов с ${site.since} года, GEO и продуктовый дизайн.`, k: "автор никита алимпиев опыт" },
  { t: "Контакты", u: "/contacts/", s: "Страницы", d: "Telegram, почта, телефон и реквизиты.", k: `телеграм почта телефон реквизиты инн ${site.email}` },
  { t: "Политика конфиденциальности", u: "/privacy-policy/", s: "Страницы", d: "Как сайт обрабатывает персональные данные." },
  { t: "Пользовательское соглашение", u: "/terms/", s: "Страницы", d: "Условия использования сайта." },
];

export function buildSearchIndex(): SearchDoc[] {
  const startupCats = Object.fromEntries(getStartupBase().categories.map((c) => [c.slug, c.name]));
  return [
    ...services.map((s) => ({
      t: s.title, u: `/services/${s.slug}/`, s: "Услуги", d: plain(s.short),
      k: s.h1, b: cut(plain([s.answer, ...s.includes.map((i) => `${i.title} ${i.text}`)].join(" "))),
    })),
    ...pages,
    ...getPosts().map((p) => ({ t: plain(p.title), u: `/blog/${p.slug}/`, s: "Блог", d: plain(p.description), b: cut(plain(p.body)) })),
    ...getTerms().map((t) => ({
      t: t.term, u: `/glossary/${t.slug}/`, s: "Глоссарий", d: plain(t.short),
      k: [t.en, t.expansion, ...t.synonyms].filter(Boolean).join(" "), b: cut(plain(t.body)),
    })),
    ...getTools().map((t) => ({
      t: t.name, u: `/tools/${t.slug}/`, s: "Инструменты", d: plain(t.short),
      k: [t.category, t.subcategory].filter(Boolean).join(" "), b: cut(plain(t.body)),
    })),
    ...getDesignStyles().map((d) => ({ t: d.name, u: `/design-styles/${d.slug}/`, s: "Продукты", d: plain(d.short), k: d.also.join(" "), b: cut(plain(d.body)) })),
    ...getSystems().map((x) => ({ t: x.name, u: `/design-systems/${x.slug}/`, s: "Дизайн-системы", d: plain(x.short), k: x.frameworks.join(" "), b: cut(plain(x.about)) })),
    ...getUiLibraries().map((x) => ({ t: x.name, u: `/ui-libraries/${x.slug}/`, s: "UI-библиотеки", d: plain(x.short), k: x.frameworks.join(" "), b: cut(plain(x.about)) })),
    ...getFonts().map((f) => ({ t: `Шрифт ${f.n}`, u: `/fonts/${f.s}/`, s: "Шрифты", d: f.c ? "Для коммерции" : "Для личного использования", k: f.a.map((a) => a.n).join(" ") })),
    ...getGallerySites().map((i) => ({ t: i.n, u: `/sites/${i.s}/`, s: "Примеры сайтов", d: plain(i.t || getGalleryBase().niches[i.k]), k: getGalleryBase().niches[i.k] })),
    ...getStartupsWithPages().map((i) => ({ t: i.n, u: `/startups/${i.s}/`, s: "Стартапы", d: plain(i.t), k: i.c.map((c) => startupCats[c]).join(" ") })),
  ].map((d) => Object.fromEntries(Object.entries(d).filter(([, v]) => v)) as SearchDoc);
}
