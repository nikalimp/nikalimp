import { getGalleryCategoryPages } from "@/lib/sites";
import { CategoryView, categoryMeta } from "./category";

// Категория галереи: «Бизнес», «Интернет-магазины», «Портфолио»… — как в галерее-источнике
export function generateStaticParams() {
  const all = getGalleryCategoryPages().filter((c) => !c.parent);
  return all.length ? all.map((c) => ({ cat: c.slug })) : [{ cat: "none" }];
}
export async function generateMetadata({ params }: { params: Promise<{ cat: string }> }) {
  return categoryMeta((await params).cat);
}
export default async function Page({ params }: { params: Promise<{ cat: string }> }) {
  return <CategoryView slug={(await params).cat} />;
}
