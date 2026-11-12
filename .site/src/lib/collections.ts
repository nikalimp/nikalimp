// Ссылки на коллекции сайта (примеры сайтов, дизайн-системы, UI-библиотеки, стили, шрифты) с карточек инструментов и терминов.
// Search Console 9.11: у /sites/, /ui-libraries/, /design-systems/ и /design-styles/ 0 показов — на них не вели ссылки из проиндексированных разделов.
import { getDsItems } from "./design-systems";

export type CollectionLink = { href: string; title: string; text: string };

const sites: CollectionLink = { href: "/sites/", title: "Примеры сайтов", text: "коллекция красивых сайтов по нишам" };
const systems: CollectionLink = { href: "/design-systems/", title: "Дизайн-системы", text: "shadcn/ui, MUI, Gravity UI и другие" };
const libraries: CollectionLink = { href: "/ui-libraries/", title: "UI-библиотеки", text: "блоки, компоненты и анимации для сайтов" };
const styles: CollectionLink = { href: "/design-styles/", title: "Дизайн-направления", text: "20 визуальных стилей с примерами" };
const fonts: CollectionLink = { href: "/fonts/", title: "Шрифты с кириллицей", text: "бесплатный каталог с превью" };

const bySubcategory: Record<string, CollectionLink[]> = {
  "Конструкторы сайтов": [sites, styles],
  "WordPress-конструкторы и темы": [sites, styles],
  "UI-библиотеки и компоненты": [libraries, systems],
  "Фреймворки и библиотеки": [systems, libraries],
  "Дизайн и прототипирование интерфейсов": [systems, styles],
  "Насмотренность и референсы": [sites, styles],
  "Анимация и моушн-дизайн": [libraries, styles],
  "Цвет и контраст": [styles, systems],
  "Иконки": [libraries, systems],
  "Плагины Figma": [systems, libraries],
  "Шрифты и типографика": [fonts, styles],
};

const byCategory: Record<string, CollectionLink[]> = {
  "UI/UX дизайн": [systems, styles, libraries, fonts],
  "Графический дизайн и бренд": [styles, fonts, sites],
  "No-code и CMS": [sites, styles],
};

/** Для карточки инструмента: своя страница в коллекции (если есть) + подборки по подкатегории */
export function toolCollections(slug: string, subcategory: string): CollectionLink[] {
  const own: CollectionLink[] = [];
  for (const x of getDsItems().filter((d) => d.tool === slug)) {
    own.push(x.kind === "library"
      ? { href: `/ui-libraries/${x.slug}/`, title: `${x.name} в каталоге UI-библиотек`, text: "что внутри, цена и с чем сочетается" }
      : { href: `/design-systems/${x.slug}/`, title: `${x.name} в каталоге дизайн-систем`, text: "компоненты и библиотеки к ней" });
  }
  const list = [...own, ...(bySubcategory[subcategory] ?? [])];
  return list.filter((x, i) => list.findIndex((y) => y.href === x.href) === i).slice(0, 3);
}

/** Для термина глоссария: подборки по категории */
export const termCollections = (category: string): CollectionLink[] => byCategory[category] ?? [];
