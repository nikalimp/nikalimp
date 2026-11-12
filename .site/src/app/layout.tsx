import { metaDesc } from "@/lib/utils";
import type { Metadata } from "next";
import "@fontsource-variable/inter/wght.css";
import "./globals.css";
import { site } from "@/lib/site";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ScrollToTop } from "@/components/scroll-to-top";
import { JsonLd } from "@/components/json-ld";
import { graph, orgSchema, personSchema } from "@/lib/schema";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s — ${site.name}` },
  description: metaDesc(site.description),
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "ru_RU", siteName: site.name, title: site.title, description: metaDesc(site.description), url: site.url },
  robots: { index: true, follow: true },
};

// Яндекс Метрика, счётчик 113548506
const metrikaId = 113548506;
// Метрика грузится после первого действия посетителя или через 4 с после загрузки: не блокирует первый экран на телефоне (PageSpeed).
const metrikaScript = `(function(){var done=0;function load(){if(done)return;done=1;(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=${metrikaId}','ym');ym(${metrikaId},'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});}['scroll','pointerdown','keydown','touchstart'].forEach(function(e){addEventListener(e,load,{once:true,passive:true})});addEventListener('load',function(){setTimeout(load,4000)})})()`;

// Подсветка рамки карточки за курсором: только CSS-переменные, контент не трогает
const spotlightScript = `document.addEventListener('pointermove',function(e){var c=e.target.closest&&e.target.closest('.card');if(!c)return;var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')},{passive:true});`;

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: metrikaScript }} />
        <JsonLd data={graph({ "@type": "WebSite", "@id": `${site.url}/#website`, url: site.url, name: site.name, inLanguage: "ru-RU", publisher: { "@id": `${site.url}/#org` }, potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${site.url}/search/?q={search_term_string}` }, "query-input": "required name=search_term_string" } }, orgSchema, personSchema)} />
      </head>
      <body className="flex min-h-screen flex-col">
        <noscript><div><img src={`https://mc.yandex.ru/watch/${metrikaId}`} style={{ position: "absolute", left: "-9999px" }} alt="" /></div></noscript>
        <ScrollToTop />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <script dangerouslySetInnerHTML={{ __html: spotlightScript }} />
      </body>
    </html>
  );
}
