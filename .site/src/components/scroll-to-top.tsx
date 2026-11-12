"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// При переходе на новую страницу — в самый верх. Без этого Next прокручивает к началу <main>,
// и его верх оказывается под липкой шапкой. Ссылки с якорем (#раздел) не трогаем.
export function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.location.hash) return;
    const top = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    top();
    // Next докручивает страницу после отрисовки — повторяем в следующих кадрах
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => { top(); raf2 = requestAnimationFrame(top); });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [pathname]);
  return null;
}
