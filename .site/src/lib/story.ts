// Путь Никиты по эпохам: фото, годы, заголовок, теги, короткий текст.
// Главная показывает его карточками со слайдером (StoryCarousel), /cases/ ссылается на главную.
// people — с кем работал в эту эпоху: аватар (img) или инициалы, если фото ещё нет.

export type StoryPerson = { name: string; img?: string };
export type StoryLink = { label: string; href: string };
export type StoryTag = { label: string; icon?: string; href?: string }; // icon — путь к значку (награды, флаги), href — ссылка
export type StoryStep = {
  years: string;
  title: string;
  img: string;
  imgAlt: string;
  tags?: StoryTag[];
  text: string;
  people?: StoryPerson[];
  link?: StoryLink;
};

export const story: StoryStep[] = [
  {
    years: "2018–2020",
    title: "Начало работы в диджитал",
    img: "/story/2019-2020-start.webp",
    imgAlt: "Никита Алимпиев в спортзале",
    tags: [{ label: "Made on Tilda", icon: "/badges/made-on-tilda.svg" }],
    text: "После трёх лет преподавания акробатики я попал в сетевой маркетинг, где и познакомился с интернет-маркетингом. Первые проекты делал бесплатно ради опыта и портфолио: настраивал таргет и контекст, делал лендинги на Tilda. Так я влюбился в веб-дизайн и UI/UX и начал получать первые награды Made on Tilda.",
  },
  {
    years: "2021",
    title: "Первый стартап и инвестиции",
    img: "/story/2021-startup-agency.webp",
    imgAlt: "Команда стартапа на общем фото",
    text: "В университете я нашёл первую команду единомышленников: вместе мы создали сервис стриминга лекций по подписке, привлекли миллион рублей инвестиций и заехали в офис. Параллельно запустили SMM-агентство, где я руководил веб-разработкой: делали сайты под ключ для локальных брендов. Тогда же начал активно развивать фриланс и делать сайты для топовых русских блогеров и рэперов.",
    people: [{ name: "Ян Топлес", img: "/story/yan-toples.webp" }, { name: "LOVV66", img: "/story/lovv66.webp" }, { name: "TOXIS", img: "/story/toxis.webp" }, { name: "ROCKET", img: "/story/rocket.webp" }, { name: "FRIENDLY THUG 52 NGG", img: "/story/friendly-thug-52-ngg.webp" }, { name: "ALBLAK 52", img: "/story/alblak-52.webp" }],
  },
  {
    years: "2022",
    title: "Начало международной карьеры",
    img: "/story/2022-kazakhstan.webp",
    imgAlt: "Друзья за столом в Астане",
    tags: [{ label: "Webflow Partner", icon: "/badges/webflow-partner.svg" }],
    text: "Принял решение одним днём уехать в Астану и начать всё с нуля. Освоил Webflow, получил статус Certified Webflow Partner.",
  },
  {
    years: "2023",
    title: "Работа UI/UX-дизайнером в Astana Hub",
    img: "/story/2023-astana-hub.webp",
    imgAlt: "Demo Day акселератора Silkway в Astana Hub",
    text: "Попал на работу мечты в главном технопарке Центральной Азии и партнёре Google for Startups. Занимался редизайном сайтов программ для стартапов, проектировал LMS, участвовал в развитии акселератора Silkway. Отсюда начался качественный нетворкинг и первые международные проекты от Казахстана до Кремниевой долины.",
    tags: [
      { label: "Польша", icon: "/flags/pl.svg" },
      { label: "Германия", icon: "/flags/de.svg" },
      { label: "Италия", icon: "/flags/it.svg" },
      { label: "Франция", icon: "/flags/fr.svg" },
      { label: "ОАЭ", icon: "/flags/ae.svg" },
      { label: "Кения", icon: "/flags/ke.svg" },
      { label: "США", icon: "/flags/us.svg" },
    ],
  },
  {
    years: "2024",
    title: "Venture-builder в Дубае",
    img: "/story/2024-dubai-blog.webp",
    imgAlt: "Никита в Apple Vision Pro на съёмке блога",
    text: "Вошёл в первое партнёрство и запустил в Дубае компанию по брендингу, разработке и маркетингу для стартапов за долю в них. Вместе с этим начал вести блог на YouTube, чтобы запечатлевать жизнь, показывать развитие в формате build in public и бороться с постоянным чувством одиночества.",
    tags: [{ label: "YouTube", icon: "/badges/youtube.svg", href: "https://www.youtube.com/@nikalimp/" }],
  },
  {
    years: "2025",
    title: "Новый стартап для блогеров — facebase",
    img: "/story/2025-facebase.webp",
    imgAlt: "Созвон команды facebase",
    text: "В рамках венчур-билдера запустили B2B SaaS-платформу инфлюенс-маркетинга. Разработали MVP, вышли на стадию Go-to-Market и получили награду «Продукт месяца» на ПродуктРадаре. Вместе с этим перевёл блог в вертикальный формат для большего охвата широкой аудитории.",
    tags: [{ label: "Продукт месяца", icon: "/badges/product-month.svg" }],
  },
];
