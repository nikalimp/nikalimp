import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Описание для сниппета: до 160 знаков, режем по концу предложения или по слову
export function metaDesc(text: string, max = 160) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1); // место под «…»
  const dot = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  // конец предложения берём, только если описание остаётся не короче 120 знаков (стандарт §3: 120–160)
  if (dot + 1 >= 120) return cut.slice(0, dot + 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,:;—–-]$/, "").trim() + "…";
}

// Заголовок страницы: если с суффиксом « — NikAlimp» длиннее 65 знаков (стандарт §3), суффикс не добавляем
export function metaTitle(title: string, max = 65) {
  return title.length + " — NikAlimp".length > max ? { absolute: title } : title;
}
