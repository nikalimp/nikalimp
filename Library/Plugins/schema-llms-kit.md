---
name: Schema.org и llms.txt
title: Модуль Schema.org и llms.txt для Next.js: установка
description: Как настроить JSON-LD разметку Schema.org и автоматическую генерацию llms.txt в Next.js: готовые шаблоны, граф сущностей и проверка.
short: Автогенерация JSON-LD разметки и карты сайта llms.txt
category: SEO, GEO и аналитика
kind: Модуль Next.js
install: touch src/lib/schema.ts src/app/llms.txt/route.ts
worksWith: Next.js, TypeScript, Schema.org, Google, Яндекс
agents: schema-engineer, frontend-dev
related: geo-audit-plugin, yandex-webmaster-mcp, google-search-console-mcp
---

Модуль Schema.org и `llms.txt` встраивает машиночитаемый слой прямо в сборку Next.js. Из единых файлов данных проекта автоматически собираются JSON-LD графы на каждой странице и два справочника для языковых моделей: `/llms.txt` и `/llms-full.txt`.

## Зачем нужен этот плагин

Ручное редактирование JSON-LD в коде страниц быстро устаревает: цена услуги на сайте обновилась, а в разметке осталась старая. Когда Schema.org и `llms.txt` генерируются из общих данных при сборке, поисковики и нейросети всегда видят ровно те же факты, что и посетитель.

## Инструкция по установке

1. Создайте хелпер `src/lib/schema.ts` для сборки `@graph` с едиными `@id` организации, автора и хлебных крошек:

```ts
export const graph = (...items: object[]) => ({
  "@context": "https://schema.org",
  "@graph": items,
});
```

2. Создайте компонент `src/components/json-ld.tsx`, который вставляет JSON-LD прямо в серверный HTML:

```tsx
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
```

3. Добавьте статический роут `src/app/llms.txt/route.ts` для генерации карты сайта в формате Markdown:

```ts
export const dynamic = "force-static";

export function GET() {
  const body = `# Название компании\n\n> Краткое описание услуг и специализации.\n\n## Разделы\n- [Услуги](https://example.ru/services/)\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
```

4. Откройте доступ AI-ботам в `src/app/robots.ts` и проверьте готовый `out/llms.txt` после `npm run build`.

## Как проверить, что всё работает

Откройте исходный код любой собранной страницы и убедитесь, что внутри есть валидный `<script type="application/ld+json">`. Проверьте доступность `/llms.txt` с кодировкой UTF-8 и прогоните URL через официальный валидатор `validator.schema.org`.

## Частые ошибки

- Размечают `FAQPage` вопросами, которых нет в видимом тексте страницы — Google считает это нарушением.
- Забывают указать `export const dynamic = "force-static"` в `route.ts`, из-за чего падает статический экспорт Next.js.
- Кладут в `llms.txt` рекламные лозунги вместо чёткого списка услуг, цен, географии и ссылок.

## Частые вопросы

### Нужен ли отдельно файл llms-full.txt?

Да, если на сайте много услуг и кейсов. `/llms.txt` даёт короткое оглавление со ссылками, а `/llms-full.txt` — полный текст ключевых фактов в одном файле.

### Какие типы Schema.org обязательны для коммерческого сайта?

Базовый набор: `WebSite`, `Organization` (или `LocalBusiness`), `Service`, `FAQPage`, `Article` для блога и `BreadcrumbList` для внутренних страниц.

### Поддерживает ли Яндекс разметку JSON-LD?

Да. Яндекс и Алиса AI полноценно читают JSON-LD для организаций, товаров, статей и блоков вопросов-ответов.
