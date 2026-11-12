// Контекст страницы инструмента по категории: какой призыв к услуге и какие мои бесплатные продукты показать рядом.
import { offers } from "./offers";

type Cta = { title: string; text: string; href: string; label: string };
type Freebie = { href: string; title: string; text: string };

const site: Cta = { title: "Нужен сайт, который видят нейросети?", text: `Сделаю личный или корпоративный сайт на коде: без ограничений конструктора, с разметкой для ChatGPT и Алисы и годом администрирования. От ${offers.personal.price}.`, href: "/services/", label: "Смотреть услуги" };
const geo: Cta = { title: "Узнайте, что нейросети говорят о вашем бизнесе", text: "GEO-аудит: проверю 5 нейросетей по 20+ запросам клиентов, найду, кого советуют вместо вас, и дам план на 90 дней.", href: "/geo-audit/", label: "О GEO-аудите" };
const content: Cta = { title: "Блог, который пишется без вас", text: "Контент-завод: статьи под поиск и нейросети по плану, обложки, Telegram и отчёт раз в неделю.", href: "/services/content-factory/", label: "О контент-заводе" };
const service: Cta = { title: "Нужен свой веб-сервис или админка?", text: "Личный кабинет для клиентов, админка и дашборды для команды — на Next.js, по спецификации и с фиксированной ценой.", href: "/services/web-service-development/", label: "О веб-сервисе" };

const ctaByCategory: Record<string, Cta> = {
  "SEO": geo, "GEO и AI-поиск": geo, "Маркетинг и аналитика": geo,
  "Контент и копирайтинг": content, "Telegram и соцсети": content,
  "Product": service, "AI и LLM": service, "Веб-разработка": service, "Хостинг, домены, инфраструктура": service,
};

const semantics: Freebie = { href: "/semantics/", title: "Сбор семантики", text: "Чистка запросов из Вордстата и структура сайта" };
const utm: Freebie = { href: "/utm-generator/", title: "Генератор UTM-меток", text: "Ссылки с метками для Директа, VK и Telegram" };
const qr: Freebie = { href: "/qr-generator/", title: "Генератор QR-кода", text: "QR с логотипом, SVG, PNG и JPEG" };
const privacy: Freebie = { href: "/privacy-generator/", title: "Генератор политики", text: "Политика и согласие по 152-ФЗ за 5 минут" };
const contract: Freebie = { href: "/contract-generator/", title: "Генератор договора", text: "Договор и акт для фрилансера и студии" };
const glossary: Freebie = { href: "/glossary/", title: "Глоссарий GEO и SEO", text: "Термины простыми словами" };

const freebiesByCategory: Record<string, Freebie[]> = {
  "SEO": [semantics, glossary], "GEO и AI-поиск": [glossary, semantics],
  "Маркетинг и аналитика": [utm, semantics], "Telegram и соцсети": [utm, qr], "Контент и копирайтинг": [semantics, utm],
  "No-code и CMS": [privacy, qr], "Веб-разработка": [privacy, utm], "UI/UX дизайн": [qr, glossary], "Графический дизайн и бренд": [qr, utm],
  "Фриланс и бизнес": [contract, privacy], "Product": [contract, utm], "AI и LLM": [glossary, semantics], "Хостинг, домены, инфраструктура": [privacy, glossary],
};

export const toolCta = (category: string): Cta => ctaByCategory[category] ?? site;
export const toolFreebies = (category: string): Freebie[] => freebiesByCategory[category] ?? [glossary, utm];
