"use client";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggle() {
    const d = document.documentElement.classList.toggle("dark");
    try { localStorage.setItem("theme", d ? "dark" : "light"); } catch {}
  }
  return (
    <button onClick={toggle} aria-label="Сменить тему" className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </button>
  );
}
