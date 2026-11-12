# База стартапов

Каталог российских стартапов и продуктов для страницы [nikalimp.ru/startups/](https://nikalimp.ru/startups/). Продукт описан в [[Сайт NikAlimp]].

- `startups.json` — данные сайта: проекты, категории, статусы. Руками не правится, собирается скриптом.
- `source/` — выгрузка Product Radar: `scrape.py` (сборщик), `data.jsonl` (по строке на проект), `categories.json` (категории WordPress).

## Что берём
Название, слоган, сайт (без меток вроде `utm_`), категории, статусы, город, дату публикации и голоса. Имена основателей, контакты и длинные описания на сайт не идут. Логотипы с чужого сервера не подгружаем.

Сейчас в базе только проекты, опубликованные на Product Radar в 2026 году.

## Обновление (раз в месяц)
1. На Mac: `cd source && rm -f sitemap.xml && YEAR=2026 FROM=0 MAXSEC=155 python3 scrape.py` — повторять, пока в выводе не будет `LEFT 0`. Скрипт докачивает с места остановки и делает 3 запроса параллельно с паузой.
2. Категории: `curl -s "https://productradar.ru/wp-json/wp/v2/categories?per_page=100" -o categories.json`.
3. В `.site`: `node scripts/startups-import.mjs ../Library/Startups/source/data.jsonl ../Library/Startups/source/categories.json` (переменная `YEAR=` снимает ограничение по году).
4. `npm run check` → PR.
