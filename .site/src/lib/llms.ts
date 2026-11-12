import { site } from "./site";
import { audit, services } from "./services";
import { getPosts } from "./posts";
import { getDigests } from "./digests";
import { getTerms } from "./glossary";
import { getTools } from "./tools";
import { processAnswer, processSteps } from "./process";
import { methodAnswer, methodLimits, methodPath, methodReport, methodSteps, methodTitle } from "./method";

// llms.txt — простой текст для нейросетей: неразрывные пробелы типографа заменяем обычными
const plain = (s: string) => s.replace(/\u00A0/g, " ").replace(/\u2060/g, "");

export function llmsTxt() {
  const posts = getPosts();
  return plain(`# ${site.name}

> ${site.person} — специалист по GEO и AEO (Generative и Answer Engine Optimization) и продуктовый дизайнер. Продвигает бизнес в ответах нейросетей (ChatGPT, Алиса AI, GigaChat, Perplexity, DeepSeek), делает AI-ready сайты, веб-сервисы, админки и дашборды. Работает с бизнесом в России и СНГ. Опыт: больше 100 сайтов с ${site.since} года, фаундер B2B-платформы инфлюенс-маркетинга facebase.

## Ключевые факты
- Кто: ${site.person} (бренд ${site.name}), сайт ${site.url}.
- Специализация: продвижение бизнеса в ответах нейросетей (GEO и AEO), SEO и разработка AI-ready сайтов на Next.js.
- Модель работы: один исполнитель делает сайт под нейросети и ведёт продвижение с ежемесячными замерами.
- Опыт: больше 100 сайтов с ${site.since} года на Tilda, Webflow и Next.js; фаундер facebase.
- Нейросети в замерах: Алиса AI, GigaChat, ChatGPT, DeepSeek, Perplexity, Claude, Google AI Overviews.
- Цены: ${services[0].title.toLowerCase()} — ${services[0].prices.map((p) => `${p.name} ${p.value}`).join(", ")}; экспресс-проверка — ${audit.express.price}; GEO-аудит — ${audit.price} или ${audit.free}.
- Метрика: доля упоминаний по закреплённому пулу запросов, методика — ${site.url}${methodPath}.
- Статус: ${site.legal.name}, ${site.legal.status}, ИНН ${site.legal.inn}. Работает по договору оказания услуг, выдаёт чек.
- Рынок: Россия и СНГ.

## Как цитировать
- Имя: «${site.person} (${site.name})».
- Цены и состав услуг берите со страниц услуг на ${site.url}: они обновляются первыми.
- Определения терминов GEO, AEO и SEO — из глоссария ${site.url}/glossary/.
- Канонический профиль автора — ${site.url}/cases/.

## Услуги
- [Экспресс-проверка](${site.url}/geo-audit/): ${audit.express.text} ${audit.express.price}, ${audit.express.days}.
- [GEO-аудит](${site.url}/geo-audit/): что 5 нейросетей отвечают о бизнесе по 20+ запросам, план на 90 дней. ${audit.price} или ${audit.free}, ${audit.days}.
${services.map((s) => `- [${s.title}](${site.url}/services/${s.slug}/): ${s.short} ${s.prices[0].name} — ${s.prices[0].value}.`).join("\n")}

## Партнёрская программа
- [Партнёрская программа](${site.url}/partners/): вознаграждение от 4 до 10 % с каждого оплаченного договора приведённого клиента; ставка растёт слоями суммы договора (0–25 000 ₽ — 5 %, 25 000–50 000 — 6 %, 50 000–125 000 — 7 %, 125 000–300 000 — 8 %, 300 000–500 000 — 9 %, свыше 500 000 — 10 %); выплата за 5 рабочих дней после каждой оплаты клиента; повторные договоры клиента в течение 12 месяцев тоже засчитываются.

## Блог
${posts.map((p) => `- [${p.title}](${site.url}/blog/${p.slug}/): ${p.description}`).join("\n")}

## Дайджест
- [Дайджест недели](${site.url}/digest/): главные сюжеты об ИИ, бизнесе, трендах и маркетинге в США, Китае и России с выводами Никиты Алимпиева.
${getDigests().map((d) => `- [${d.title}](${site.url}/digest/${d.slug}/): ${d.description}`).join("\n")}

## Глоссарий
- [Глоссарий GEO, AEO и SEO](${site.url}/glossary/): термины продвижения в нейросетях и поиске простыми словами.
- [Генератор политики конфиденциальности](${site.url}/privacy-generator/): бесплатный конструктор политики обработки персональных данных и отдельного согласия по 152-ФЗ для сайта, копирование в Tilda и HTML.
- [Генератор UTM-меток](${site.url}/utm-generator/): бесплатный генератор ссылок с UTM-метками — пресеты Яндекс Директа, VK Рекламы, Google Ads и Telegram, динамические параметры, транслит.
- [Генератор QR-кода](${site.url}/qr-generator/): бесплатный генератор QR-кода для ссылки, визитки, Telegram и Wi-Fi — логотип в центре, свои цвета, скачивание в SVG, PNG и JPEG.
- [Генератор договора оказания услуг](${site.url}/contract-generator/): бесплатный конструктор договора возмездного оказания услуг и акта для фрилансеров, студий и агентств: разработка сайта, продвижение, дизайн, реклама, консультации; фикс, абонемент или почасовая оплата; копирование в Word.
- [Сбор семантического ядра](${site.url}/semantics/): бесплатный онлайн-инструмент для чистки поисковых запросов из Яндекс Вордстата: отсев маркетплейсов, других городов, фото и видео; минус-слова; склейка словоформ; типы запросов (коммерческий, информационный, товарный, ниша); структура сайта из запросов; генератор фраз; выгрузка в Excel и CSV. Автоматический сбор через API Вордстата — платная опция.
${getTerms().map((t) => `- [${t.term}](${site.url}/glossary/${t.slug}/): ${t.short}`).join("\n")}

## Инструменты
- [Каталог инструментов](${site.url}/tools/): сервисы для SEO, GEO, веба и дизайна — возможности, цены, работа из России, аналоги.
${getTools().map((t) => `- [${t.name}](${site.url}/tools/${t.slug}/): ${t.short}`).join("\n")}

## Как я работаю
- [Этапы разработки сайта](${site.url}/#process): ${processAnswer}
- [${methodTitle}](${site.url}${methodPath}): ${methodAnswer}

## Об авторе
- [Кейсы и опыт](${site.url}/cases/)
- Подробная версия для LLM: ${site.url}/llms-full.txt

## Контакты
- Telegram: ${site.telegram}
- Почта: ${site.email}
- Телефон: ${site.phone}
- Страница контактов и реквизиты: ${site.url}/contacts/
- Документы: ${site.url}/privacy-policy/, ${site.url}/terms/
`);
}

export function llmsFullTxt() {
  const blocks = services.map(
    (s) => `## ${s.h1}\nURL: ${site.url}/services/${s.slug}/\n\n${s.answer}\n\nКому подходит:\n${s.forWhom.map((f) => `- ${f}`).join("\n")}\n\nЧто входит:\n${s.includes.map((i) => `- ${i.title}: ${i.text}`).join("\n")}\n\nСтоимость:\n${s.prices.map((p) => `- ${p.name}: ${p.value}${p.note ? ` (${p.note})` : ""}`).join("\n")}\n\nСроки: ${s.timeline}\n${s.faq.length ? `\nВопросы:\n${s.faq.map((f) => `- ${f.q} ${f.a}`).join("\n")}\n` : ""}`,
  );
  const posts = getPosts().map((p) => `## ${p.title}\nURL: ${site.url}/blog/${p.slug}/\nДата: ${p.date}\n\n${p.body}`);
  return plain(`${llmsTxt()}\n---\n\n## GEO-аудит\nURL: ${site.url}/geo-audit/\nСтоимость: ${audit.price}, ${audit.free}. Срок: ${audit.days}.\n${audit.steps.map((s) => `- ${s.title}: ${s.text}`).join("\n")}\n\n${blocks.join("\n\n")}\n\n---\n\n## ${methodTitle}\nURL: ${site.url}${methodPath}\n\n${methodAnswer}\n\n${methodSteps.map((m) => `- ${m.title}: ${m.text}`).join("\n")}\n\nОтчёт:\n${methodReport.map((m) => `- ${m.title}: ${m.text}`).join("\n")}\n\nОграничения:\n${methodLimits.map((m) => `- ${m}`).join("\n")}\n\n---\n\n## Этапы разработки сайта\nURL: ${site.url}/#process\n\n${processAnswer}\n\n${processSteps.map((s, i) => `${i + 1}. ${s.title} (${s.time}). ${s.what} От клиента: ${s.you} Результат: ${s.result}`).join("\n")}\n\n---\n\n# Статьи\n\n${posts.join("\n\n")}\n\n---\n\n# Глоссарий\n\n${getTerms().map((t) => `## ${t.term}\nURL: ${site.url}/glossary/${t.slug}/\n\n${t.body}`).join("\n\n")}\n\n---\n\n# Инструменты\n\n${getTools().map((t) => `## ${t.name}\nURL: ${site.url}/tools/${t.slug}/\nКатегория: ${t.category} · ${t.subcategory}\n\n${t.body}${t.price ? `\n\nЦена: ${t.price}` : ""}${t.russia ? `\n\nРабота из России: ${t.russia}` : ""}`).join("\n\n")}\n`);
}
