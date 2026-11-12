import { getStartupsWithPages } from "@/lib/startups";
export const dynamic = "force-static";
// Список для поиска в браузере: только то, что показывает карточка
export function GET() {
  return Response.json({ items: getStartupsWithPages().map(({ s, n, t, c, v }) => ({ s, n, t, c, v })) });
}
