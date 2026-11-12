import { getGalleryCategoryPages } from "@/lib/sites";
import { CategoryView, categoryMeta } from "../category";

// Подкатегория — ниша внутри категории галереи: «Бизнес → Еда и рестораны»
export function generateStaticParams() {
  const all = getGalleryCategoryPages().filter((c) => c.parent);
  return all.length ? all.map((c) => ({ cat: c.parent!, niche: c.niche! })) : [{ cat: "none", niche: "none" }];
}
export async function generateMetadata({ params }: { params: Promise<{ cat: string; niche: string }> }) {
  const { cat, niche } = await params;
  return categoryMeta(`${cat}/${niche}`);
}
export default async function Page({ params }: { params: Promise<{ cat: string; niche: string }> }) {
  const { cat, niche } = await params;
  return <CategoryView slug={`${cat}/${niche}`} />;
}
