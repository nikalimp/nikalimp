import { site } from "./site";

export const personId = `${site.url}/#person`;
export const orgId = `${site.url}/#org`;

export const personSchema = {
  "@type": "Person",
  "@id": personId,
  name: site.person,
  alternateName: site.name,
  jobTitle: "Product Designer & Builder (AI-native), специалист по GEO и AEO",
  homeLocation: { "@type": "Place", name: "Hangzhou, China" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Уральский федеральный университет" },
  url: `${site.url}/cases/`,
  image: `${site.url}/avatar.webp`,
  email: site.email,
  telephone: site.phone,
  knowsAbout: ["Generative Engine Optimization", "GEO", "Answer Engine Optimization", "AEO", "SEO", "Next.js", "React", "Продуктовый дизайн", "ИИ-агенты", "Schema.org"],
  sameAs: [...site.sameAs, site.telegram].filter((u) => !u.includes("TODO")),
};

export const orgSchema = {
  "@type": ["Organization", "ProfessionalService"],
  "@id": orgId,
  image: `${site.url}/avatar.webp`,
  email: site.email,
  telephone: site.phone,
  taxID: site.legal.inn,
  contactPoint: { "@type": "ContactPoint", contactType: "customer service", email: site.email, telephone: site.phone, url: `${site.url}/contacts/`, availableLanguage: ["ru"] },
  name: site.name,
  url: site.url,
  description: site.description,
  founder: { "@id": personId },
  areaServed: ["RU", "BY", "KZ", "GE", "AM", "UZ"],
  sameAs: personSchema.sameAs,
};

// Крошки — только со второго уровня (стандарт §2.4): на страницах первого уровня их нет ни в HTML, ни в разметке
export function breadcrumbs(items: { name: string; path: string }[]) {
  if (items.length < 3) return null;
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${site.url}${it.path}` })),
  };
}

export function faqSchema(faq: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function graph(...nodes: (Record<string, unknown> | null)[]) {
  return { "@context": "https://schema.org", "@graph": nodes.filter(Boolean) };
}
