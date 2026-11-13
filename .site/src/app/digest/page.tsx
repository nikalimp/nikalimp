import type { Metadata } from "next";
import Link from "next/link";
import { getDigests } from "@/lib/digests";
import { formatDate } from "@/lib/posts";
import { Container, Section } from "@/components/container";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, graph } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Дайджест: ИИ, бизнес, тренды и маркетинг за неделю",
  description: "Главные события недели на рынках ИИ, роботов и гаджетов в США, Китае и России — с выводами Никиты Алимпиева и ссылками на первоисточники.",
  alternates: { canonical: "/digest/" },
};

export default function DigestIndex() {
  const all = getDigests();
  return (
    <>
      <JsonLd data={graph(breadcrumbs([{ name: "Главная", path: "/" }, { name: "Дайджест", path: "/digest/" }]))} />
      <Section className="pt-12">
        <Container className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-center mx-auto text-balance">Дайджест недели</h1>
          <p className="mt-3 text-muted-foreground text-center mx-auto max-w-2xl">
            Каждую неделю читаю 23 источника о рынках ИИ, роботов и гаджетов в США, Китае и России. Сюда попадают сюжеты, которые важны для бизнеса, — с моим выводом и ссылкой на первоисточник.
          </p>
          {all.length === 0 ? (
            <p className="mt-10 text-center text-muted-foreground">Первый выпуск выйдет во вторник.</p>
          ) : (
            <ul className="mt-10 divide-y border-y">
              {all.map((d) => (
                <li key={d.slug}>
                  <Link href={`/digest/${d.slug}/`} className="group block py-5">
                    <p className="text-sm text-muted-foreground">
                      {formatDate(d.date)}
                      {d.count > 0 && <> · {d.count} сюж.</>}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold leading-snug group-hover:text-brand">{d.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="prose-site mt-14">
            <h2>Как собирается выпуск</h2>
            <p>
              Каждое утро моя лента забирает новые статьи из 23 источников: официальных блогов компаний, изданий со срочными новостями и авторов с собственным анализом. Сайты, которые пересказывают чужие новости, в ленту не попадают. Нейросеть Claude читает анонс каждой статьи и определяет тему и страну. Статьи об одном событии она склеивает в один сюжет и пишет короткий обзор на русском: что произошло и почему это важно для бизнеса.
            </p>
            <p>
              За неделю я отмечаю сюжеты, которые стоит обсудить, и добавляю к части из них свой вывод. Во вторник выходит выпуск: короткое вступление о главном за неделю, затем список сюжетов. У каждого сюжета есть обзор, страна, издание и ссылка на первоисточник. Полный текст статьи читайте на сайте издания.
            </p>
            <h2>Темы и страны</h2>
            <ul>
              <li><strong>ИИ</strong> — новые модели и продукты, сделки и инвестиции, чипы, регулирование и исследования.</li>
              <li><strong>Роботы</strong> — гуманоиды, промышленные и бытовые роботы, беспилотники и автономные машины.</li>
              <li><strong>Гаджеты</strong> — смартфоны, ноутбуки и носимая электроника: запуски и то, что они меняют на рынке.</li>
            </ul>
            <p>
              Фокус выпуска — США, Китай и Россия. Отдельно отмечаю события, которые касаются всего мира.
            </p>
            <h2>Откуда берутся новости</h2>
            <p>
              Компании: OpenAI, Google DeepMind, Google, NVIDIA, Mistral, Hugging Face, Apple, Samsung. Издания: Bloomberg, The Verge, IEEE Spectrum, MIT Technology Review, The Robot Report, SCMP, «Ведомости». Авторы: Simon Willison, Import AI, One Useful Thing, Benedict Evans, Platformer, ChinAI.
            </p>
            <h2>Частые вопросы</h2>
            <h3>Зачем читать дайджест, а не сами издания?</h3>
            <p>Дайджест экономит время. За 10 минут вы видите главное из 23 источников на трёх рынках и сразу понимаете, какие статьи стоит открыть целиком.</p>
            <h3>Как часто выходит дайджест?</h3>
            <p>Раз в неделю, по вторникам. Выпуск охватывает семь дней до даты выхода.</p>
            <h3>Кто отбирает сюжеты?</h3>
            <p>Отбираю я, {site.person}. Нейросеть помогает разметить и кратко пересказать статьи, а решение о том, что попадёт в выпуск, принимаю сам.</p>
          </div>
        </Container>
      </Section>
    </>
  );
}
