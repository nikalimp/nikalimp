import Link from "next/link";
import { Container, Section } from "@/components/container";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, graph } from "@/lib/schema";
import { toHtml, type Doc } from "@/lib/privacy-policy";
import { typograf } from "@/lib/typograf.mjs";

const fix = (s: string) => typograf(s, { markdown: false });

export function LegalPage({ doc, path, crumb }: { doc: Doc; path: string; crumb: string }) {
  const html = toHtml(doc, fix).replace(/^<h1>.*?<\/h1>\n?/, "");
  return (
    <>
      <JsonLd data={graph(breadcrumbs([{ name: "Главная", path: "/" }, { name: crumb, path }]))} />
      <Section className="pt-12">
        <Container className="max-w-3xl">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{fix(doc.title)}</h1>
          <div className="policy-doc legal-doc mt-8 text-[15px]" dangerouslySetInnerHTML={{ __html: html.replace(/<h2>/g, "<h3>").replace(/<\/h2>/g, "</h3>") }} />
        </Container>
      </Section>
    </>
  );
}
