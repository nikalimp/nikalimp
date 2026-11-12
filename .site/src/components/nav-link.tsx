"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const norm = (p: string) => (p.endsWith("/") ? p : p + "/");

// Активна ли ссылка: точное совпадение пути или (prefix) любая вложенная страница раздела
export function useIsActive(paths: string | string[], prefix = false) {
  const current = norm(usePathname() || "/");
  return [paths].flat().some((p) => {
    const target = norm(p);
    return current === target || (prefix && target !== "/" && current.startsWith(target));
  });
}

type Props = React.ComponentProps<"a"> & {
  href: string;
  section?: boolean; // подсвечивать и на вложенных страницах раздела
  reload?: boolean; // устарело: все ссылки навигации — обычные <a>
  also?: string[]; // другие разделы, на которых ссылка тоже подсвечивается (например, страницы продуктов)
};

// Ссылка навигации: текущая страница выделяется акцентным цветом и помечается aria-current
export function NavLink({ href, section, reload, also = [], className, children, ...rest }: Props) {
  const active = useIsActive([href, ...also], section);
  const exact = useIsActive(href);
  const cls = cn(className, active && "nav-active");
  const aria = exact ? ("page" as const) : undefined;
  // Навигация — обычные <a> с полной загрузкой страницы: на хостинге клиентский переход Next.js
  // по ссылкам меню и подвала срабатывал не всегда (31.10.2026). Для статического сайта разница в скорости незаметна.
  void reload;
  return <a href={href} className={cls} aria-current={aria} {...rest}>{children}</a>;
}

// Текст-заголовок раздела (например, «Продукты» в шапке): подсвечивается, если открыта одна из его страниц
export function NavSection({ paths, className, children }: { paths: string[]; className?: string; children: React.ReactNode }) {
  const active = useIsActive(paths, true);
  return <span className={cn(className, active && "nav-active")}>{children}</span>;
}
