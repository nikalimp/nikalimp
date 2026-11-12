import fs from "node:fs";
import path from "node:path";

/**
 * Агентная система NikitOS для блока на главной: сколько скиллов в каждом плагине и инструментов.
 * Считается при сборке из ../.claude (сайт живёт в том же репозитории). Нет папки — запасные числа.
 */
const ROOT = path.join(process.cwd(), "..", ".claude");
const dirs = (p: string) => {
  try { return fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); } catch { return []; }
};
const skills = (plugin: string, fallback: number) => dirs(path.join(ROOT, "plugins", plugin, "skills")).length || fallback;

export const system = {
  plugins: [
    { id: "web", skills: skills("web", 50), title: "Сайты и веб-сервисы", text: "Бриф, спецификация, дизайн, сборка и запуск сайта, сервиса или админки по 9 этапам." },
    { id: "geo-audit", skills: skills("geo-audit", 13), title: "Видимость в нейросетях", text: "Запросы, замеры в 5 нейросетях, доля упоминаний, план на 90 дней." },
    { id: "content-factory", skills: skills("content-factory", 6), title: "Блог по расписанию", text: "Статья в день, краткая версия в Telegram, отчёт по пятницам." },
  ],
  tools: dirs(path.join(ROOT, "toolkit")).length || 15,
};
export const totalSkills = system.plugins.reduce((n, p) => n + p.skills, 0);
