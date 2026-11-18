// Офферы формы заявки (LeadForm) по типу страницы. 18.11.2026: трафик сайта информационный —
// глоссарий, стартапы, инструменты, шрифты (Search Console), — поэтому у каждой страницы свой первый шаг, а не один «закажите сайт».
// id уходит в заявку и в цель Метрики lead — по нему видно, какой оффер работает.
import { offers, support } from "./offers";
import { audit } from "./services";

export type LeadOffer = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  button: string;
  /** Подсказка для поля «Задача» */
  task: string;
};

const o = (x: LeadOffer) => x;

export const leadOffers = {
  site: o({ id: "site", eyebrow: "Сайт под ключ", title: "Обсудим ваш сайт", text: `Напишите, какой сайт нужен, — предложу структуру и назову цену. Личный сайт — ${offers.personal.price}, корпоративный — ${offers.corporate.price}, первый год администрирования входит.`, button: "Обсудить сайт", task: "Какой сайт нужен и для чего" }),
  personal: o({ id: "personal", eyebrow: "Личный сайт", title: "Сайт на ваше имя, который находят и советуют", text: `Эксклюзивный дизайн, упаковка услуг, парсер заявок в Telegram и QR-визитка — ${offers.personal.price}, 1⁠–⁠2 недели. Напишите, чем вы занимаетесь, — предложу структуру.`, button: "Обсудить личный сайт", task: "Чем вы занимаетесь и кому продаёте" }),
  corporate: o({ id: "corporate", eyebrow: "Корпоративный сайт", title: "Сайт компании, который приводит заявки из поиска и нейросетей", text: `Страница на каждую услугу, админка, личный кабинет и блог по плану — ${offers.corporate.price}, 3⁠–⁠6 недель. Напишите, что продаёт компания, — отвечу структурой и ценой.`, button: "Обсудить сайт компании", task: "Что продаёт компания и что не так с текущим сайтом" }),
  geo: o({ id: "geo", eyebrow: "GEO-аудит", title: "Узнайте, что нейросети говорят о вашем бизнесе", text: `Проверю ChatGPT, Алису AI, GigaChat, Perplexity и DeepSeek по запросам ваших клиентов. Покажу, кого советуют вместо вас и почему. Экспресс-проверка — ${audit.express.price}, полный аудит — ${audit.price}.`, button: "Получить проверку", task: "Город, услуги и 2⁠–⁠3 конкурента" }),
  seo: o({ id: "seo", eyebrow: "Аудит сайта", title: "Разберу ваш сайт и скажу, что мешает заявкам", text: "Пришлите адрес сайта. Проверю индексацию, тексты, разметку и доступ для нейросетей и пришлю главные исправления по приоритету. Бесплатно.", button: "Получить разбор", task: "Что беспокоит: мало заявок, нет в поиске, старый дизайн" }),
  support: o({ id: "support", eyebrow: "Поддержка сайта", title: "Администрирование сайта без штатного программиста", text: `Отчёт каждый месяц: посещаемость, заявки, позиции и упоминания в нейросетях. Новые инструменты и 2 итерации правок в год. ${support.price.replace(/^./, (c) => c.toUpperCase())}. Напишите, какой у вас сайт, — скажу, что входит в поддержку именно его.`, button: "Обсудить поддержку", task: "Адрес сайта и на чём он сделан" }),
  content: o({ id: "content", eyebrow: "Контент-завод", title: "Блог, который пишется и выходит без вас", text: "Статьи под запросы клиентов, обложки, посты в Telegram и Max и отчёт раз в неделю. Запуск — 20 000 ₽, ведение — от 10 000 ₽ в месяц.", button: "Обсудить блог", task: "Адрес сайта и тема блога" }),
  marketing: o({ id: "marketing", eyebrow: "Сайт для рекламы", title: "Реклама приводит людей — сайт превращает их в заявки", text: `Делаю сайты со страницей на каждую услугу, целями в Метрике и формой заявки. Тогда видно, сколько стоит клиент из Директа, VK Рекламы и поиска. Корпоративный сайт — ${offers.corporate.price}.`, button: "Обсудить сайт", task: "Где вы рекламируетесь и что продаёте" }),
  service: o({ id: "service", eyebrow: "Веб-сервис", title: "Личный кабинет, админка или MVP под ключ", text: "Next.js и Supabase, спецификация до старта и фиксированная цена. MVP — от 4 недель, клиентская часть — от 300 000 ₽.", button: "Обсудить сервис", task: "Что должен делать сервис и для кого" }),
  startup: o({ id: "startup", eyebrow: "Для основателей", title: "Лендинг или MVP для вашего стартапа", text: "Соберу лендинг, который находят в поиске и нейросетях, или MVP с главным сценарием за 4⁠–⁠6 недель. Ваш проект уже в базе? Напишите — обновлю описание бесплатно.", button: "Написать о проекте", task: "Название проекта и что нужно: лендинг, MVP, обновить карточку" }),
  design: o({ id: "design", eyebrow: "Дизайн сайта", title: "Сайт с эксклюзивным дизайном, а не шаблоном", text: `Свой визуал, шрифты и анимация под ваш характер — и разметка, чтобы сайт находили в Яндексе и нейросетях. Личный сайт — ${offers.personal.price}, корпоративный — ${offers.corporate.price}.`, button: "Обсудить дизайн", task: "Какой сайт нужен и какие сайты вам нравятся" }),
  audit: o({ id: "audit", eyebrow: "План исправлений", title: "Разберу этот отчёт и составлю план", text: "Оставьте контакт — бесплатно напишу, что исправить в первую очередь, сколько это займёт и что можно сделать самим.", button: "Получить план", task: "Что для вас главное: заявки, позиции, нейросети" }),
} satisfies Record<string, LeadOffer>;

export type LeadOfferId = keyof typeof leadOffers;

// Термины, по которым в Search Console приходят коммерческие запросы (18.11.2026) — свой оффер точнее, чем оффер категории
const termOffer: Record<string, LeadOfferId> = {
  "website-maintenance": "support", "website-administration": "support",
  "seo-audit": "seo", audit: "seo", "ux-audit": "seo", "content-audit": "seo", "technical-seo": "seo",
  "promo-website": "corporate", landing: "corporate", "landing-page": "corporate", "corporate-website": "corporate", portfolio: "personal", "personal-brand": "personal",
  mvp: "service",
};

/** Оффер по категории глоссария или каталога инструментов */
export function offerForCategory(category: string): LeadOfferId {
  if (/GEO|AI-поиск|AI и LLM/i.test(category)) return "geo";
  if (/^SEO/i.test(category)) return "seo";
  if (/Контент|копирайт|Telegram|соцсет/i.test(category)) return "content";
  if (/Маркетинг|аналитик/i.test(category)) return "marketing";
  if (/Product|Веб-разработка|Хостинг|No-code/i.test(category)) return "service";
  if (/дизайн|бренд|UI/i.test(category)) return "design";
  return "site";
}

export function offerForTerm(slug: string, category: string): LeadOfferId {
  return termOffer[slug] ?? offerForCategory(category);
}

/** Оффер статьи блога по адресу: статьи про нейросети и эксперимент — GEO, про личный сайт — личный сайт, остальное — сайт компании */
export function offerForPost(slug: string): LeadOfferId {
  if (/personal-website/.test(slug)) return "personal";
  if (/geo|ai-|alice|chatgpt|nejros|llms|eksperiment|experiment|semrush|company-facts|kompanii/.test(slug)) return "geo";
  if (/telegram/.test(slug)) return "content";
  return "corporate";
}
