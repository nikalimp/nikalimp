// Сертификаты и награды: оригиналы — в vault, папка «Сертификаты и ачивки»; картинки — public/achievements/<id>.webp.
// На главной показываются как сторис: кружок на каждого выдавшего, внутри — документы по порядку.
export type Achievement = { id: string; title: string; date: string; verify?: string };
export type AchievementGroup = { id: string; name: string; caption: string; items: Achievement[] };

export const achievements: AchievementGroup[] = [
  {
    id: "cssda", name: "CSS Design Awards", caption: "Награды за сайт Koop",
    items: [
      { id: "cssda-innovation", title: "Innovation Design Award", date: "14 ноября 2023" },
      { id: "cssda-ui", title: "UI Design Award", date: "14 ноября 2023" },
      { id: "cssda-ux", title: "UX Design Award", date: "14 ноября 2023" },
      { id: "cssda-kudos", title: "Special Kudos Award от жюри", date: "14 ноября 2023" },
    ],
  },
  {
    id: "claude", name: "Claude Academy", caption: "Курсы Anthropic по Claude",
    items: [
      { id: "claude-101", title: "Claude 101", date: "15 октября 2026", verify: "https://academy.claude.com/verify/82c6cf41ecc3fd38f5f059aea69ea02d" },
      { id: "claude-code-101", title: "Claude Code 101", date: "15 октября 2026", verify: "https://academy.claude.com/verify/cfc919c54d711b59604246629b21f0ac" },
      { id: "claude-platform-101", title: "Claude Platform 101", date: "20 октября 2026", verify: "https://academy.claude.com/verify/90d5899287bb309c5b6acd046aeb6f24" },
      { id: "claude-cowork", title: "Introduction to Claude Cowork", date: "20 октября 2026", verify: "https://academy.claude.com/verify/b9cf3766948a8dcc636c268f18d9a5ca" },
      { id: "claude-tag", title: "Introduction to Claude Tag", date: "20 октября 2026", verify: "https://academy.claude.com/verify/725a9e0bdb0d454468ead25c23aca55a" },
    ],
  },
  {
    id: "webflow", name: "Webflow", caption: "Сертификационные экзамены",
    items: [
      { id: "webflow-101-2023-11", title: "Webflow 101", date: "27 ноября 2023" },
      { id: "webflow-layouts-2", title: "Layouts, уровень 2", date: "18 апреля 2023" },
      { id: "webflow-101-2023-04", title: "Webflow 101", date: "26 апреля 2023" },
      { id: "webflow-layouts-1", title: "Layouts, уровень 1", date: "5 января 2023" },
      { id: "webflow-cms-1", title: "CMS, уровень 1", date: "5 января 2023" },
    ],
  },
  {
    id: "coursera", name: "Coursera", caption: "UX-дизайн от Google и CalArts",
    items: [
      { id: "google-ux", title: "Foundations of UX Design — Google", date: "18 апреля 2023" },
      { id: "calarts-ux", title: "UX Design Fundamentals — CalArts", date: "28 декабря 2020" },
    ],
  },
  { id: "geekbrains", name: "GeekBrains", caption: "Основы Swift", items: [{ id: "geekbrains-swift", title: "Основы языка Swift", date: "18 октября 2021" }] },
  { id: "tilda", name: "Tilda", caption: "Курс PRO", items: [{ id: "tilda-pro", title: "Курс PRO: продвинутые возможности Tilda", date: "июль 2020" }] },
];
