import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { consentDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Согласие на обработку персональных данных",
  description: "Согласие пользователя сайта nikalimp.ru на обработку персональных данных по 152-ФЗ: цели, состав данных, срок действия и порядок отзыва.",
  alternates: { canonical: "/consent/" },
};

export default function Page() {
  return <LegalPage doc={consentDoc()} path="/consent/" crumb="Согласие на обработку данных" />;
}
