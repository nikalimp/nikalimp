import { getFonts } from "@/lib/fonts";
export const dynamic = "force-static";
// Список для фильтров и поиска в браузере: только то, что показывает карточка
export function GET() {
  return Response.json({ items: getFonts().map((f) => ({ s: f.s, n: f.n, c: f.c, k: f.st.length, a: f.a.map((x) => x.n).join(", "), svg: f.svg })) });
}
