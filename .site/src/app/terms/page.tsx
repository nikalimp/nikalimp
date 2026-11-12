import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { termsDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Пользовательское соглашение сайта nikalimp.ru",
  description: "Условия использования nikalimp.ru: информация на сайте, бесплатные инструменты, интеллектуальная собственность, ссылки и ответственность.",
  alternates: { canonical: "/terms/" },
};

export default function Page() {
  return <LegalPage doc={termsDoc()} path="/terms/" crumb="Пользовательское соглашение" />;
}
