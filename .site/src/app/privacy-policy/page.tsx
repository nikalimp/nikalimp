import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { policyDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных",
  description: "Как сайт nikalimp.ru обрабатывает персональные данные: цели, состав данных, cookie и Яндекс Метрика, права пользователей и контакты оператора.",
  alternates: { canonical: "/privacy-policy/" },
};

export default function Page() {
  return <LegalPage doc={policyDoc()} path="/privacy-policy/" crumb="Политика конфиденциальности" />;
}
