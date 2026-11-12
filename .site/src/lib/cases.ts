// Проекты по годам — список со старого портфолио nikalimp.webflow.io.
// Подробные кейсы новых проектов будут отдельными страницами.
export type CaseItem = {
  name?: string; // бренд, если не под NDA
  text: string; // что за проект
  site?: string;
  behance?: string; // id работы на Behance
  nda?: boolean;
};

export const cases: { year: string; items: CaseItem[] }[] = [
  {
    year: "2025",
    items: [
      { text: "Сайт международного сервиса оплаты парковки", nda: true },
      { text: "Прототип мобильного приложения онлайн-банка, Германия", nda: true },
      { name: "Slkrd", text: "Венчурный фонд, Кремниевая долина, США", site: "https://www.slkrd.club/", behance: "220728971" },
      { text: "Сайт стартапа, который создаёт ИИ-модели, Великобритания и США", nda: true },
      { name: "Topnotch Labs", text: "ИИ-лаборатория, Лондон" },
      { text: "Прототип Telegram Mini App для игры-викторины", nda: true },
    ],
  },
  {
    year: "2024",
    items: [
      { name: "Factfood", text: "Настольная игра от Топлеса", site: "https://factfood.toples.shop/", behance: "167125411" },
      { name: "Astana Hub", text: "Лендинги технопарка, Казахстан", behance: "170448623" },
      { name: "Astana Hub", text: "Дашборд технопарка, Казахстан", behance: "175605707" },
      { name: "Fonte", text: "Венчурный фонд, Астана", site: "https://fonte.kz/", behance: "206930769" },
      { name: "EBS", text: "Бизнес-сообщество, Лондон", site: "https://www.uclebs.io/", behance: "183785531" },
      { text: "Фонд, Берлин", nda: true },
      { text: "Медиа, Германия и США", nda: true },
      { text: "Программа для сообщества, Кения", nda: true },
      { name: "FoxRiver", text: "Аренда апартаментов, Дубай", site: "https://foxriver.ae/", behance: "169043833" },
      { text: "Маркетплейс товаров ручной работы, Казахстан", nda: true },
      { text: "Прототип мобильного приложения для путешествий", nda: true },
      { name: "Eco Energy Group", text: "Зелёная электроэнергия, Франция", site: "https://ecoenergygroup.fr/", behance: "208582709" },
      { name: "52 DAY", text: "Мероприятие, Екатеринбург" },
      { name: "Dentalmarket", text: "Стоматологическая клиника", site: "https://clinic-dm.ru/" },
    ],
  },
  {
    year: "2023",
    items: [
      { name: "Toples bot", text: "EdTech-продукт Топлеса", site: "https://bot.toples.shop/", behance: "187925297" },
      { name: "BGlobal", text: "Венчурный фонд, Астана", site: "https://bglobal.vc/", behance: "220728369" },
      { name: "Settler", text: "Приложение для ремонта, Дубай", site: "https://settler.ae/", behance: "175605707" },
      { name: "UDAR", text: "Телеканал", site: "https://udar.tv/", behance: "187925297" },
      { name: "RCC Pilates", text: "Фитнес-студия, Екатеринбург", site: "https://rcc-pilates.ru/", behance: "187925297" },
      { name: "Polerina Wear", text: "Интернет-магазин одежды, Дубай", site: "https://polerinawear.com/", behance: "175605707" },
      { text: "Цветочный сервис, Варшава", nda: true },
      { name: "Champion", text: "Магазин для гимнастики", site: "https://champstore.ru/", behance: "175605707" },
      { name: "Techbase", text: "Профессиональная техника", behance: "175605707" },
      { name: "STAYA POOL", text: "Вечеринки в аквапарке", behance: "175605707" },
      { name: "Apelsin", text: "Складские комплексы, Екатеринбург", site: "https://apelsin-sk.ru/", behance: "162241369" },
      { name: "Stem Solutions", text: "Технологическая компания, Казахстан", behance: "187925297" },
    ],
  },
  {
    year: "2022",
    items: [
      { name: "O'Smisle", text: "EdTech-платформа", site: "https://osmisle.ru/", behance: "140240321" },
      { name: "O'Smisle", text: "Стриминговый сервис лекций", behance: "146479941" },
      { name: "СТАЯ", text: "Промо-лендинги", behance: "155501343" },
      { name: "The Village", text: "Городское медиа", behance: "144387043" },
      { name: "HVALA", text: "Wi-Fi-сервис", site: "https://hvalacloud.com/", behance: "162241369" },
      { name: "MIKHALIT", text: "Строительство домов, Екатеринбург", behance: "162241369" },
      { name: "MeYou", text: "Интернет-магазин одежды", behance: "149698753" },
      { name: "Seasons", text: "Ресторан, Екатеринбург", behance: "162241369" },
      { name: "SPgroup", text: "Мебельное производство, Екатеринбург", site: "https://spgroupmebel.ru/", behance: "162241369" },
      { name: "ГородГоворит", text: "Подкаст об урбанистике", behance: "162241369" },
      { name: "Unique", text: "Онлайн-галерея", behance: "162241369" },
      { name: "Elite Tackle", text: "Рыболовный интернет-магазин", behance: "162241369" },
      { name: "uKNITedmarket", text: "Магазин пряжи, Екатеринбург", behance: "142276063" },
      { name: "YOCREATORS", text: "Ювелирный магазин", site: "https://yocreators.com/", behance: "137363737" },
    ],
  },
  {
    year: "2021",
    items: [
      { name: "INDIVID", text: "Производство сувениров, Екатеринбург", site: "https://individfabrika.ru/", behance: "140584191" },
      { name: "RCMG", text: "Управляющая компания, Екатеринбург", behance: "139318061" },
      { name: "MLZ GROUP", text: "Производство, Екатеринбург", site: "https://mlzgroup.ru/", behance: "133324893" },
      { name: "HOG", text: "Клуб владельцев Harley-Davidson, Екатеринбург", behance: "139318061" },
      { name: "URALDOMA", text: "Ремонт домов, Екатеринбург", site: "https://uraldoma.ru/" },
      { name: "PITON CIDERS", text: "Магазин сидров, Екатеринбург", behance: "138561217" },
      { name: "ZAGOROD96", text: "Строительство домов, Екатеринбург", behance: "140584191" },
      { name: "Decorum", text: "Строительство домов, Екатеринбург", behance: "140584191" },
      { name: "Жаворонки", text: "Строительство домов, Екатеринбург", behance: "140584191" },
      { name: "Ectevita", text: "Клиника косметологии, Екатеринбург" },
      { name: "ZooElf", text: "Зоомагазин, Екатеринбург", behance: "107123131" },
    ],
  },
];

export const casesCount = cases.reduce((n, y) => n + y.items.length, 0);
