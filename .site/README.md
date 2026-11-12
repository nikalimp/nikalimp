# nikalimp.ru

Сайт NikAlimp — GEO, SEO и AI-ready сайты. Заметка в vault: [[Сайт NikAlimp]].

## Стек
Next.js 16 (App Router, статический экспорт) + Tailwind 4 + shadcn/ui-компоненты. Шрифт Inter хранится локально (без Google Fonts — работает в РФ).

## Команды
```bash
npm install
npm run dev      # http://localhost:3010
npm run build    # статический сайт в out/
npm run preview  # просмотр out/ на http://localhost:3011
```

## Где что править
- `src/lib/site.ts` — имя, домен, **Telegram и почта**.
- `src/lib/services.ts` — услуги, цены, FAQ, состав GEO-аудита. Отсюда же собираются llms.txt и разметка Schema.org.
- `content/blog/*.md` — статьи (frontmatter: title, description, date, updated).
- `src/app/page.tsx` — главная.

## GEO-фундамент (генерируется при сборке)
- `/llms.txt`, `/llms-full.txt` — карта сайта для LLM.
- `/robots.txt` — открыт для GPTBot, PerplexityBot, ClaudeBot, YandexBot и др.
- `/sitemap.xml`.
- JSON-LD на каждой странице: WebSite, ProfessionalService, Person, Service, FAQPage, BlogPosting, BreadcrumbList.
- Индексация: все термины глоссария в индексе, title 40–65 символов с расшифровкой (колонка «Расшифровка» в CSV); `lastmod` только у статей; IndexNow после каждой выкладки (`scripts/indexnow.mjs`). Подробно — гайд «Сайт NikAlimp — сборка и деплой».

## Деплой
Хостинг в РФ (Vercel из России открывается нестабильно). Заливаем содержимое `out/` в корень сайта.
Домен nikalimp.ru на REG.RU → A-запись на IP хостинга.
