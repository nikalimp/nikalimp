# nikalimp.ru

Сайт Никиты Алимпиева — дизайн и разработка AI-Ready сайтов, каталог инструментов, глоссарий, коллекции сайтов и дизайн-систем, блог.

- `.site/` — код сайта (Next.js, статическая сборка). Подробно — `.site/README.md`.
- `Library/` — справочники, которые сайт читает при сборке: Tools, Glossary, Sites, Startups, Fonts, DesignSystems, DesignStyles.
- `.site/content/` — блог и контент-завод (`content/factory`).
- Выкладка — общий сценарий [deploy-kit](https://github.com/nikalimp/deploy-kit): `.github/workflows/deploy.yml` (push в main), `pr.yml` (проверка PR → автослияние → выкладка). Паспорт — `publish.json`.
