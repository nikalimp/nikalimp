export interface OfficeEmployee {
  id: string;
  name: string;
  tool: string;
  role: string;
  speech: string;
  accent: string;
  deskLabel: string;
}

export interface OfficeFloor {
  number: string;
  title: string;
  zone: string;
  borderClass: string;
  badgeClass: string;
  employees: OfficeEmployee[];
}

export const officeRoof = {
  id: "roof-nikalimp",
  sign: "NikAlimp",
  subtitle: "Всё это здание — моя работа",
  name: "Никита Алимпиев",
  role: "Основатель и архитектор системы",
  speech:
    "Всё это здание — моя личная операционная система и стек инструментов. Вместо агентства из десяти человек я собрал систему из агентов, проверок и автоматизаций: она держит единый стандарт качества на каждом этапе — от брифа и дизайна до SEO, GEO и регулярных публикаций.",
};

export const officeFloors: OfficeFloor[] = [
  {
    number: "04",
    title: "Производство сайтов и сервисов",
    zone: "Бриф, дизайн-система, сборка и контроль качества",
    borderClass: "border-l-blue-500",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    employees: [
      {
        id: "spec-architect",
        name: "Архитектор Spec",
        tool: "Spec Coding",
        role: "Бриф и структура",
        deskLabel: "01 · Spec",
        accent: "#2563eb",
        speech:
          "Я не начинаю вёрстку вслепую. Сначала разбираю бизнес, конкурентов и запросы клиентов, а затем фиксирую карту страниц и сценарии в спецификации.",
      },
      {
        id: "art-director",
        name: "Арт-директор",
        tool: "shadcn/ui · Anti-Slop",
        role: "Дизайн-система",
        deskLabel: "02 · Design",
        accent: "#3b82f6",
        speech:
          "Я собираю цвета, шрифты и компоненты в единую систему под ваш бренд и отсекаю шаблонный ИИ-дизайн ещё до первой строчки кода.",
      },
      {
        id: "frontend-dev",
        name: "Фронтенд-инженер",
        tool: "Next.js · TypeScript",
        role: "Сборка и скорость",
        deskLabel: "03 · Build",
        accent: "#0ea5e9",
        speech:
          "Я верстаю быстрые страницы с чистым HTML без тяжёлых конструкторов: сайт открывается мгновенно, держит 90+ в PageSpeed и читается без JavaScript.",
      },
      {
        id: "qa-editor",
        name: "Редактор и QA",
        tool: "Главред · Типограф · WCAG",
        role: "Тексты и доступность",
        deskLabel: "04 · QA",
        accent: "#0284c7",
        speech:
          "Я прогоняю каждый текст через инфостиль и типографику, проверяю контраст, адаптивность на 360 px и работу всех форм до запуска.",
      },
    ],
  },
  {
    number: "03",
    title: "Поиск и нейросети (SEO · GEO · AEO)",
    zone: "Видимость в Яндексе, Google, ChatGPT и Алисе AI",
    borderClass: "border-l-violet-500",
    badgeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    employees: [
      {
        id: "geo-auditor",
        name: "GEO-аудитор",
        tool: "GEO-замер",
        role: "Видимость в ИИ",
        deskLabel: "05 · GEO",
        accent: "#7c3aed",
        speech:
          "Я каждый месяц проверяю, что о вашем бизнесе отвечают Алиса AI, GigaChat, ChatGPT и Perplexity, и считаю долю упоминаний в цифрах.",
      },
      {
        id: "schema-engineer",
        name: "Инженер разметки",
        tool: "Schema.org · llms.txt",
        role: "Язык для роботов",
        deskLabel: "06 · Schema",
        accent: "#8b5cf6",
        speech:
          "Я размечаю услуги, цены, кейсы и FAQ через JSON-LD и собираю llms.txt, чтобы поисковики и нейросети цитировали вас без искажений.",
      },
      {
        id: "search-analyst",
        name: "Аналитик поиска",
        tool: "Вебмастер · Search Console",
        role: "Клики и индексация",
        deskLabel: "07 · SEO",
        accent: "#6366f1",
        speech:
          "Я сравниваю клики, показы и позиции за 28 дней к прошлым 28 дням и сразу ловлю страницы, которые выпали из индекса или просели.",
      },
    ],
  },
  {
    number: "02",
    title: "Контент-завод и заявки",
    zone: "Регулярный блог, выкладка и приём обращений",
    borderClass: "border-l-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    employees: [
      {
        id: "content-factory",
        name: "Главред завода",
        tool: "Content Factory",
        role: "Блог по плану",
        deskLabel: "08 · Blog",
        accent: "#10b981",
        speech:
          "Я веду контент-план и готовлю статьи под реальные вопросы клиентов в голосе бренда — с опорой на факты, без штампов и воды.",
      },
      {
        id: "release-bot",
        name: "Инженер выкладки",
        tool: "Deploy Kit · GitHub Actions",
        role: "Тест → Прод",
        deskLabel: "09 · Deploy",
        accent: "#059669",
        speech:
          "Я сначала собираю каждое обновление на тестовом стенде, прогоняю автопроверки и только потом выкладываю в прод без простоев.",
      },
      {
        id: "lead-router",
        name: "Диспетчер заявок",
        tool: "LeadForm · Telegram",
        role: "Сбор обращений",
        deskLabel: "10 · Leads",
        accent: "#14b8a6",
        speech:
          "Я мгновенно доставляю заявки с форм сайта в почту и Telegram, а также собираю целевые запросы из профильных чатов.",
      },
    ],
  },
  {
    number: "01",
    title: "Управление и поддержка (NikitOS)",
    zone: "База знаний, паспорта проектов и мониторинг",
    borderClass: "border-l-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    employees: [
      {
        id: "vault-keeper",
        name: "Хранитель базы",
        tool: "Obsidian · LLM Wiki",
        role: "Память проектов",
        deskLabel: "11 · Wiki",
        accent: "#f59e0b",
        speech:
          "Я храню паспорт каждого сайта, историю решений, договорённости и замеры в единой базе — ни одна деталь проекта не теряется.",
      },
      {
        id: "task-dispatcher",
        name: "Планировщик",
        tool: "Todoist · Календарь",
        role: "Сроки и правки",
        deskLabel: "12 · Plan",
        accent: "#ea580c",
        speech:
          "Я держу ритм всех проектов: плановые созвоны, две бесплатные итерации правок в год и ежемесячные отчёты без напоминаний.",
      },
      {
        id: "health-monitor",
        name: "Дежурный монитор",
        tool: "Снимки · Сигналы",
        role: "Контроль 24/7",
        deskLabel: "13 · Watch",
        accent: "#d97706",
        speech:
          "Я каждую неделю снимаю метрики и подаю сигнал, если просел трафик, сорвалась публикация или сайту нужно внимание.",
      },
    ],
  },
];
