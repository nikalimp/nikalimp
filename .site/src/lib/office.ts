export interface OfficeEmployee {
  id: string;
  name: string;
  tool: string;
  role: string;
  actionPill: string;
  speech: string;
  accent: string;
  hair: string;
  accessory: "glasses" | "headset" | "coffee" | "laptop";
  baseX: number; // % по ширине этажа
  minX: number;
  maxX: number;
}

export interface OfficeFloor {
  number: string;
  code: string;
  title: string;
  zone: string;
  theme: "build" | "geo" | "content" | "ops";
  accentHex: string;
  employees: OfficeEmployee[];
}

export const officeRoof = {
  id: "roof-nikalimp",
  sign: "NikAlimp",
  subtitle: "Всё это здание — моя работа",
  name: "Никита Алимпиев",
  role: "Основатель и архитектор системы",
  speech:
    "Всё это здание — моя личная операционная система и стек инструментов. Вместо агентства из десяти человек здесь работают агенты, проверки и автоматизации. Они держат единый стандарт на каждом этапе: от брифа и дизайна до SEO, GEO и публикаций.",
};

export const officeFloors: OfficeFloor[] = [
  {
    number: "04",
    code: "BUILD",
    title: "Производство сайтов",
    zone: "Бриф, дизайн-система, сборка и QA",
    theme: "build",
    accentHex: "#2563eb",
    employees: [
      {
        id: "spec-architect",
        name: "Архитектор Spec",
        tool: "Spec Coding",
        role: "Бриф и структура",
        actionPill: "Собираю spec",
        accent: "#2563eb",
        hair: "#1e293b",
        accessory: "glasses",
        baseX: 18,
        minX: 12,
        maxX: 25,
        speech:
          "Я не начинаю вёрстку вслепую. Сначала разбираю бизнес, конкурентов и запросы клиентов, а затем фиксирую карту страниц и сценарии в спецификации.",
      },
      {
        id: "art-director",
        name: "Арт-директор",
        tool: "shadcn/ui · Anti-Slop",
        role: "Дизайн-система",
        actionPill: "Подбираю токены",
        accent: "#3b82f6",
        hair: "#7c2d12",
        accessory: "coffee",
        baseX: 40,
        minX: 33,
        maxX: 47,
        speech:
          "Я собираю цвета, шрифты и компоненты в единую систему под ваш бренд и отсекаю шаблонный ИИ-дизайн ещё до первой строчки кода.",
      },
      {
        id: "frontend-dev",
        name: "Фронтенд-инженер",
        tool: "Next.js · TypeScript",
        role: "Сборка и скорость",
        actionPill: "Верстаю Next.js",
        accent: "#0ea5e9",
        hair: "#0f172a",
        accessory: "headset",
        baseX: 62,
        minX: 55,
        maxX: 69,
        speech:
          "Я верстаю быстрые страницы с чистым HTML без тяжёлых конструкторов: сайт открывается мгновенно, держит 90+ в PageSpeed и читается без JavaScript.",
      },
      {
        id: "qa-editor",
        name: "Редактор и QA",
        tool: "Главред · Типограф",
        role: "Тексты и доступность",
        actionPill: "Чищу тексты",
        accent: "#0284c7",
        hair: "#451a03",
        accessory: "laptop",
        baseX: 83,
        minX: 76,
        maxX: 89,
        speech:
          "Я прогоняю каждый текст через инфостиль и типографику, проверяю контраст, адаптивность на 360 px и работу всех форм до запуска.",
      },
    ],
  },
  {
    number: "03",
    code: "GEO",
    title: "Поиск и нейросети",
    zone: "Яндекс, Google, ChatGPT и Алиса AI",
    theme: "geo",
    accentHex: "#7c3aed",
    employees: [
      {
        id: "geo-auditor",
        name: "GEO-аудитор",
        tool: "GEO-замер",
        role: "Видимость в ИИ",
        actionPill: "Проверяю Алису AI",
        accent: "#7c3aed",
        hair: "#1e1b4b",
        accessory: "glasses",
        baseX: 24,
        minX: 16,
        maxX: 32,
        speech:
          "Я каждый месяц проверяю, что о вашем бизнесе отвечают Алиса AI, GigaChat, ChatGPT и Perplexity, и считаю долю упоминаний в цифрах.",
      },
      {
        id: "schema-engineer",
        name: "Инженер разметки",
        tool: "Schema.org · llms.txt",
        role: "Язык для роботов",
        actionPill: "Собираю llms.txt",
        accent: "#8b5cf6",
        hair: "#312e81",
        accessory: "laptop",
        baseX: 51,
        minX: 42,
        maxX: 59,
        speech:
          "Я размечаю услуги, цены, кейсы и FAQ через JSON-LD и собираю llms.txt, чтобы поисковики и нейросети цитировали вас без искажений.",
      },
      {
        id: "search-analyst",
        name: "Аналитик поиска",
        tool: "Вебмастер · GSC",
        role: "Клики и позиции",
        actionPill: "Считаю клики",
        accent: "#6366f1",
        hair: "#0f172a",
        accessory: "coffee",
        baseX: 77,
        minX: 69,
        maxX: 85,
        speech:
          "Я сравниваю клики, показы и позиции за 28 дней к прошлым 28 дням и сразу ловлю страницы, которые выпали из индекса или просели.",
      },
    ],
  },
  {
    number: "02",
    code: "CONTENT",
    title: "Контент-завод и заявки",
    zone: "Блог по плану, выкладка и лиды",
    theme: "content",
    accentHex: "#10b981",
    employees: [
      {
        id: "content-factory",
        name: "Главред завода",
        tool: "Content Factory",
        role: "Блог по плану",
        actionPill: "Пишу статью дня",
        accent: "#10b981",
        hair: "#064e3b",
        accessory: "coffee",
        baseX: 24,
        minX: 16,
        maxX: 32,
        speech:
          "Я веду контент-план и готовлю статьи под реальные вопросы клиентов в голосе бренда — с опорой на факты, без штампов и воды.",
      },
      {
        id: "release-bot",
        name: "Инженер выкладки",
        tool: "Deploy Kit · Actions",
        role: "Тест → Прод",
        actionPill: "Деплою в прод",
        accent: "#059669",
        hair: "#1e293b",
        accessory: "headset",
        baseX: 51,
        minX: 43,
        maxX: 59,
        speech:
          "Я сначала собираю каждое обновление на тестовом стенде, прогоняю автопроверки и только потом выкладываю в прод без простоев.",
      },
      {
        id: "lead-router",
        name: "Диспетчер заявок",
        tool: "LeadForm · Telegram",
        role: "Сбор обращений",
        actionPill: "Ловлю заявки",
        accent: "#14b8a6",
        hair: "#3f3f46",
        accessory: "laptop",
        baseX: 77,
        minX: 69,
        maxX: 85,
        speech:
          "Я мгновенно доставляю заявки с форм сайта в почту и Telegram, а также собираю целевые запросы из профильных чатов.",
      },
    ],
  },
  {
    number: "01",
    code: "NIKITOS",
    title: "Управление и серверная",
    zone: "База знаний, задачи и контроль 24/7",
    theme: "ops",
    accentHex: "#f59e0b",
    employees: [
      {
        id: "vault-keeper",
        name: "Хранитель базы",
        tool: "Obsidian · LLM Wiki",
        role: "Память проектов",
        actionPill: "Обновляю паспорт",
        accent: "#f59e0b",
        hair: "#78350f",
        accessory: "glasses",
        baseX: 24,
        minX: 16,
        maxX: 32,
        speech:
          "Я храню паспорт каждого сайта, историю решений, договорённости и замеры в единой базе — ни одна деталь проекта не теряется.",
      },
      {
        id: "task-dispatcher",
        name: "Планировщик",
        tool: "Todoist · Календарь",
        role: "Сроки и правки",
        actionPill: "Сверяю дедлайны",
        accent: "#ea580c",
        hair: "#1e293b",
        accessory: "coffee",
        baseX: 51,
        minX: 43,
        maxX: 59,
        speech:
          "Я держу ритм всех проектов: плановые созвоны, две бесплатные итерации правок в год и ежемесячные отчёты без напоминаний.",
      },
      {
        id: "health-monitor",
        name: "Дежурный монитор",
        tool: "Снимки · Сигналы",
        role: "Контроль 24/7",
        actionPill: "Снимаю метрики",
        accent: "#d97706",
        hair: "#27272a",
        accessory: "headset",
        baseX: 77,
        minX: 69,
        maxX: 85,
        speech:
          "Я каждую неделю снимаю метрики и подаю сигнал, если просел трафик, сорвалась публикация или сайту нужно внимание.",
      },
    ],
  },
];
