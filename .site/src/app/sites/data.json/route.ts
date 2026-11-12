import { getGallerySites } from "@/lib/sites";
export const dynamic = "force-static";
// Список для поиска и «Показать ещё»: только то, что показывает карточка
export function GET() {
  return Response.json({ items: getGallerySites().map(({ s, n, t, c, k, img }) => ({ s, n, t, c, k, img })) });
}
