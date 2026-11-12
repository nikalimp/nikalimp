import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { services } from "@/lib/services";
import { getPosts } from "@/lib/posts";
import { getDigests } from "@/lib/digests";
import { getCaseStudies } from "@/lib/case-studies";
import { getTerms } from "@/lib/glossary";
import { getDesignStyles } from "@/lib/design-styles";
import { getSystems, getUiLibraries } from "@/lib/design-systems";
import { getFonts } from "@/lib/fonts";
import { getGalleryBase, getGalleryCategoryPages, getGallerySites, galleryCatPath } from "@/lib/sites";
import { getStartupBase, getStartupCategoryPages, getStartupsWithPages } from "@/lib/startups";
import { getComparePairs, getSubcategories, getTools } from "@/lib/tools";

export const dynamic = "force-static";

// Правила sitemap:
// 1. Только страницы, открытые для индексации (без noindex, с canonical на себя).
// 2. lastmod — только настоящая дата изменения (у статей — updated/date из frontmatter).
//    Дату сборки не ставим: сайт пересобирается при каждом коммите, и «всё обновилось сегодня»
//    приучает Google игнорировать lastmod. Нет честной даты — нет lastmod.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${site.url}/`, priority: 1 },
    { url: `${site.url}/services/`, priority: 0.9 },
    { url: `${site.url}/geo-audit/`, priority: 0.9 },
    { url: `${site.url}/products/`, priority: 0.8 },
    ...services.map((s) => ({ url: `${site.url}/services/${s.slug}/`, priority: 0.8 })),
    { url: `${site.url}/methodology/`, priority: 0.7 },
    { url: `${site.url}/cases/`, priority: 0.7 },
    ...getCaseStudies().map((c) => ({ url: `${site.url}/cases/${c.slug}/`, priority: 0.7 })),
    { url: `${site.url}/contacts/`, priority: 0.6 },
    { url: `${site.url}/partners/`, priority: 0.6 },
    { url: `${site.url}/terms/`, priority: 0.3 },
    { url: `${site.url}/privacy-policy/`, priority: 0.3 },
    { url: `${site.url}/consent/`, priority: 0.2 },
    { url: `${site.url}/blog/`, lastModified: getPosts().map((p) => p.updated ?? p.date).sort().at(-1), priority: 0.7 },
    ...getPosts().map((p) => ({ url: `${site.url}/blog/${p.slug}/`, lastModified: p.updated ?? p.date, priority: 0.7 })),
    { url: `${site.url}/digest/`, lastModified: getDigests().map((d) => d.date).sort().at(-1), priority: 0.6 },
    ...getDigests().map((d) => ({ url: `${site.url}/digest/${d.slug}/`, lastModified: d.date, priority: 0.5 })),
    { url: `${site.url}/glossary/`, priority: 0.7 },
    { url: `${site.url}/privacy-generator/`, priority: 0.8 },
    { url: `${site.url}/utm-generator/`, priority: 0.8 },
    { url: `${site.url}/qr-generator/`, priority: 0.8 },
    { url: `${site.url}/contract-generator/`, priority: 0.8 },
    { url: `${site.url}/semantics/`, priority: 0.8 },
    { url: `${site.url}/site-audit/`, priority: 0.8 },
    { url: `${site.url}/seo-audit/`, priority: 0.8 },
    ...getTerms().map((t) => ({ url: `${site.url}/glossary/${t.slug}/`, priority: 0.5 })),
    ...(getTools().length ? [{ url: `${site.url}/tools/`, priority: 0.7 }] : []),
    ...getTools().map((t) => ({ url: `${site.url}/tools/${t.slug}/`, priority: t.rich ? 0.7 : 0.5 })),
    ...getSubcategories().map((g) => ({ url: `${site.url}/tools/c/${g.slug}/`, priority: 0.6 })),
    { url: `${site.url}/libraries/`, priority: 0.7 },
    ...(getDesignStyles().length ? [{ url: `${site.url}/design-styles/`, priority: 0.7 }] : []),
    ...getDesignStyles().map((s) => ({ url: `${site.url}/design-styles/${s.slug}/`, priority: 0.6 })),
    ...(getSystems().length ? [{ url: `${site.url}/design-systems/`, priority: 0.7 }, { url: `${site.url}/ui-libraries/`, priority: 0.7 }] : []),
    ...getSystems().map((x) => ({ url: `${site.url}/design-systems/${x.slug}/`, lastModified: x.checked, priority: 0.6 })),
    ...getUiLibraries().map((x) => ({ url: `${site.url}/ui-libraries/${x.slug}/`, lastModified: x.checked, priority: 0.5 })),
    ...(getFonts().length ? [{ url: `${site.url}/fonts/`, priority: 0.7 }] : []),
    ...getFonts().map((f) => ({ url: `${site.url}/fonts/${f.s}/`, priority: 0.5 })),
    ...(getStartupsWithPages().length ? [{ url: `${site.url}/startups/`, lastModified: getStartupBase().updated, priority: 0.8 }] : []),
    ...getStartupCategoryPages().map((c) => ({ url: `${site.url}/startups/c/${c.slug}/`, lastModified: getStartupBase().updated, priority: 0.6 })),
    ...(getGallerySites().length ? [{ url: `${site.url}/sites/`, lastModified: getGalleryBase().updated, priority: 0.8 }] : []),
    ...getGalleryCategoryPages().map((c) => ({ url: `${site.url}${galleryCatPath(c)}`, lastModified: getGalleryBase().updated, priority: 0.6 })),
    ...getGallerySites().map((i) => ({ url: `${site.url}/sites/${i.s}/`, priority: 0.4 })),
    ...getStartupsWithPages().map((i) => ({ url: `${site.url}/startups/${i.s}/`, lastModified: getStartupBase().updated, priority: 0.5 })),
    ...getComparePairs().map((x) => ({ url: `${site.url}/tools/compare/${x.slug}/`, priority: 0.6 })),
  ];
}
