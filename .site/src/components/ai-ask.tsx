"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

// Ручная проверка ответов нейросетей: собираем запросы клиента и открываем их в каждой нейросети одной кнопкой.
// Ничего не отправляем на свой сервер — ссылки ведут прямо в ChatGPT, Perplexity, Яндекс, Google и Claude.
const ENGINES: { name: string; href: (q: string) => string }[] = [
  { name: "ChatGPT", href: (q) => `https://chatgpt.com/?q=${encodeURIComponent(q)}&hints=search` },
  { name: "Алиса AI", href: (q) => `https://ya.ru/search/?text=${encodeURIComponent(q)}` },
  { name: "Perplexity", href: (q) => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}` },
  { name: "Google AI", href: (q) => `https://www.google.com/search?udm=50&q=${encodeURIComponent(q)}` },
  { name: "Claude", href: (q) => `https://claude.ai/new?q=${encodeURIComponent(q)}` },
];

const brandFrom = (u: string) => { try { return new URL(/^https?:\/\//.test(u) ? u : `https://${u}`).host.replace(/^www\./, ""); } catch { return ""; } };

export function AiAsk() {
  const [brand, setBrand] = useState("");
  const [niche, setNiche] = useState("");
  const [city, setCity] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const u = new URLSearchParams(window.location.search).get("url");
    if (u) setBrand(brandFrom(u));
  }, []);

  const where = city.trim() ? ` в ${city.trim()}` : "";
  const what = niche.trim() || "услуга, которую вы продаёте";
  const prompts = [
    `Посоветуй, где заказать: ${what}${where}. Кого выбрать и почему?`,
    `Сравни лучшие варианты: ${what}${where}. Цены, плюсы и минусы`,
    `Что ты знаешь о ${brand.trim() || "вашей компании"}? Стоит ли к ним обращаться?`,
  ];
  const ready = !!niche.trim();

  const copy = async (q: string) => { try { await navigator.clipboard.writeText(q); setCopied(q); setTimeout(() => setCopied(""), 2000); } catch {} };

  return (
    <div className="rounded-2xl border bg-background p-5 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm"><span className="text-muted-foreground">Чем вы занимаетесь</span>
          <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="ремонт квартир под ключ" className="mt-1 h-11 w-full rounded-lg border bg-background px-3 outline-none focus:ring-[3px] focus:ring-ring/50" />
        </label>
        <label className="text-sm"><span className="text-muted-foreground">Город (если важен)</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Екатеринбурге" className="mt-1 h-11 w-full rounded-lg border bg-background px-3 outline-none focus:ring-[3px] focus:ring-ring/50" />
        </label>
        <label className="text-sm"><span className="text-muted-foreground">Бренд или сайт</span>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="example.ru" className="mt-1 h-11 w-full rounded-lg border bg-background px-3 outline-none focus:ring-[3px] focus:ring-ring/50" />
        </label>
      </div>
      <ul className={`mt-6 space-y-4 transition-opacity ${ready ? "" : "opacity-60"}`}>
        {prompts.map((q) => (
          <li key={q} className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">«{q}»</p>
              <button type="button" onClick={() => copy(q)} className="inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent" aria-label="Скопировать запрос">
                {copied === q ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied === q ? "Готово" : "Копировать"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {ENGINES.map((e) => (
                <a key={e.name} href={e.href(q)} target="_blank" rel="noopener nofollow" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-muted px-3 text-sm hover:bg-accent">
                  {e.name}<ExternalLink className="size-3.5 text-muted-foreground" />
                </a>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">GigaChat и DeepSeek не принимают запрос в ссылке — скопируйте его и вставьте в чат. В каждом ответе смотрите три вещи: упомянули ли вас, кого советуют вместо вас и на какие сайты ссылаются.</p>
    </div>
  );
}
