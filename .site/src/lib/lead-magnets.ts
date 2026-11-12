import type { MagnetKind } from "@/components/lead-magnet";

/** Какой лид-магнит показать по категории глоссария или каталога инструментов */
export function magnetFor(category: string): MagnetKind {
  if (/GEO|AI-поиск/i.test(category)) return "geo-audit";
  if (/SEO|AI|LLM|Контент|копирайт/i.test(category)) return "seo-audit";
  if (/Маркетинг|аналитик|Telegram|соцсет/i.test(category)) return "utm";
  if (/Фриланс|бизнес/i.test(category)) return "contract";
  if (/Графический|бренд/i.test(category)) return "styles";
  return "site-audit";
}
