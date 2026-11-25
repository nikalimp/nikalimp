"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { officeFloors, officeRoof, type OfficeEmployee, type OfficeFloor } from "@/lib/office";
import { cn } from "@/lib/utils";

type WalkDir = "left" | "right" | null;
type AgentMotion = Record<string, { x: number; walk: WalkDir }>;

type SelectedEntity =
  | { kind: "roof" }
  | { kind: "employee"; floor: OfficeFloor; employee: OfficeEmployee };

const ALL_EMPLOYEES = officeFloors.flatMap((f) => f.employees);

/** SVG-персонаж сотрудника в стиле современного пиксель-офиса. */
function AgentSprite({ emp, active }: { emp: OfficeEmployee; active: boolean }) {
  return (
    <svg viewBox="0 0 40 48" className="bld-agent-svg h-12 w-10 sm:h-14 sm:w-12" aria-hidden="true">
      {/* Тень под ногами */}
      <ellipse cx="20" cy="45" rx="10" ry="2.5" fill="currentColor" opacity="0.18" />
      {/* Ноги */}
      <rect x="14" y="34" width="4.5" height="10" rx="1.5" fill="#334155" />
      <rect x="21.5" y="34" width="4.5" height="10" rx="1.5" fill="#334155" />
      {/* Тело / кофта */}
      <rect x="11" y="21" width="18" height="15" rx="4" fill={emp.accent} />
      {/* Воротник */}
      <path d="M16 21h8l-4 4z" fill="#ffffff" opacity="0.7" />
      {/* Голова */}
      <rect x="12" y="7" width="16" height="14" rx="4.5" fill="#fde6c4" />
      {/* Волосы */}
      <path d="M12 11c0-3 2.5-5 8-5s8 2 8 5v1H12v-1z" fill={emp.hair} />
      {/* Глаза */}
      <rect x="15.5" y="13.5" width="2.2" height="2.4" rx="0.6" fill="#0f172a" />
      <rect x="22.3" y="13.5" width="2.2" height="2.4" rx="0.6" fill="#0f172a" />
      {/* Аксессуары */}
      {emp.accessory === "glasses" && (
        <g stroke="#0f172a" strokeWidth="1.2" fill="none">
          <rect x="14" y="12.5" width="5" height="4" rx="1" />
          <rect x="21" y="12.5" width="5" height="4" rx="1" />
          <line x1="19" y1="14.5" x2="21" y2="14.5" />
        </g>
      )}
      {emp.accessory === "headset" && (
        <g>
          <path d="M11 13c0-5 4-8 9-8s9 3 9 8" stroke="#0f172a" strokeWidth="1.8" fill="none" />
          <rect x="9.5" y="12" width="2.8" height="5.5" rx="1.2" fill="#0f172a" />
          <rect x="27.7" y="12" width="2.8" height="5.5" rx="1.2" fill="#0f172a" />
        </g>
      )}
      {emp.accessory === "coffee" && (
        <g>
          <rect x="28" y="25" width="5.5" height="6.5" rx="1" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
          <rect x="29" y="27" width="3.5" height="2.5" fill="#b45309" />
        </g>
      )}
      {emp.accessory === "laptop" && (
        <g>
          <rect x="13" y="27" width="14" height="8" rx="1.5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.2" />
          <circle cx="20" cy="31" r="1.2" fill={emp.accent} />
        </g>
      )}
      {/* Подсветка при выборе */}
      {active && <rect x="4" y="2" width="32" height="44" rx="6" fill="none" stroke={emp.accent} strokeWidth="2" strokeDasharray="4 2" />}
    </svg>
  );
}

/** Архитектурный интерьер этажа в разрезе (столы, мониторы, доски, стойки, лампы). */
function FloorInterior({ theme, accent }: { theme: OfficeFloor["theme"]; accent: string }) {
  return (
    <svg viewBox="0 0 800 132" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
      {/* Потолочные лампы */}
      {[160, 400, 640].map((x) => (
        <g key={x}>
          <line x1={x} y1="0" x2={x} y2="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
          <rect x={x - 18} y="10" width="36" height="4" rx="2" fill={accent} opacity="0.45" />
          <polygon points={`${x - 14},14 ${x + 14},14 ${x + 42},78 ${x - 42},78`} fill={accent} opacity="0.045" />
        </g>
      ))}

      {/* Окна на задней стене */}
      {[75, 295, 515, 690].map((x) => (
        <g key={x} opacity="0.55">
          <rect x={x} y="26" width="62" height="46" rx="3" fill="currentColor" fillOpacity="0.04" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1.5" />
          <line x1={x + 31} y1="26" x2={x + 31} y2="72" stroke="currentColor" strokeOpacity="0.12" />
          <line x1={x} y1="49" x2={x + 62} y2="49" stroke="currentColor" strokeOpacity="0.12" />
        </g>
      ))}

      {/* Детали по специализации этажа */}
      {theme === "build" && (
        <g opacity="0.75">
          {/* Доска со структурой сайта */}
          <rect x="190" y="28" width="84" height="42" rx="3" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.2" />
          <rect x="200" y="36" width="28" height="10" rx="1.5" fill={accent} opacity="0.35" />
          <rect x="234" y="36" width="30" height="10" rx="1.5" fill="currentColor" opacity="0.15" />
          <rect x="200" y="51" width="64" height="11" rx="1.5" fill="currentColor" opacity="0.1" />
          {/* Столы с мониторами */}
          {[110, 320, 500, 650].map((x) => (
            <g key={x}>
              <rect x={x} y="96" width="76" height="6" rx="1.5" fill="currentColor" opacity="0.18" />
              <rect x={x + 6} y="102" width="4" height="22" fill="currentColor" opacity="0.14" />
              <rect x={x + 66} y="102" width="4" height="22" fill="currentColor" opacity="0.14" />
              <rect x={x + 22} y="76" width="30" height="18" rx="2" fill="currentColor" opacity="0.16" />
              <rect x={x + 25} y="79" width="24" height="12" rx="1" fill={accent} opacity="0.25" />
            </g>
          ))}
        </g>
      )}

      {theme === "geo" && (
        <g opacity="0.75">
          {/* График видимости в нейросетях на стене */}
          <rect x="372" y="26" width="110" height="46" rx="3" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.2" />
          <polyline points="384,62 404,55 424,57 444,44 468,34" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="468" cy="34" r="3" fill={accent} />
          {/* Столы аналитиков */}
          {[165, 370, 580].map((x) => (
            <g key={x}>
              <rect x={x} y="96" width="84" height="6" rx="1.5" fill="currentColor" opacity="0.18" />
              <rect x={x + 8} y="102" width="4" height="22" fill="currentColor" opacity="0.14" />
              <rect x={x + 72} y="102" width="4" height="22" fill="currentColor" opacity="0.14" />
              <rect x={x + 24} y="75" width="36" height="19" rx="2" fill="currentColor" opacity="0.16" />
              <rect x={x + 27} y="78" width="30" height="13" rx="1" fill={accent} opacity="0.28" />
            </g>
          ))}
        </g>
      )}

      {theme === "content" && (
        <g opacity="0.75">
          {/* Стеллаж с публикациями */}
          <rect x="175" y="34" width="60" height="58" rx="2" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.18" />
          {[46, 62, 78].map((y) => (
            <line key={y} x1="175" y1={y} x2="235" y2={y} stroke="currentColor" strokeOpacity="0.15" />
          ))}
          <rect x="183" y="38" width="14" height="7" rx="1" fill={accent} opacity="0.45" />
          <rect x="202" y="54" width="20" height="7" rx="1" fill={accent} opacity="0.35" />
          {/* Рабочие столы */}
          {[285, 470, 610].map((x) => (
            <g key={x}>
              <rect x={x} y="96" width="80" height="6" rx="1.5" fill="currentColor" opacity="0.18" />
              <rect x={x + 6} y="102" width="4" height="22" fill="currentColor" opacity="0.14" />
              <rect x={x + 70} y="102" width="4" height="22" fill="currentColor" opacity="0.14" />
              <rect x={x + 24} y="76" width="32" height="18" rx="2" fill="currentColor" opacity="0.16" />
              <rect x={x + 27} y="79" width="26" height="12" rx="1" fill={accent} opacity="0.25" />
            </g>
          ))}
        </g>
      )}

      {theme === "ops" && (
        <g opacity="0.8">
          {/* Серверные стойки */}
          {[50, 710].map((x) => (
            <g key={x}>
              <rect x={x} y="36" width="36" height="86" rx="3" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.2" />
              {[48, 62, 76, 90, 104].map((y, idx) => (
                <g key={y}>
                  <rect x={x + 6} y={y} width="24" height="7" rx="1" fill="currentColor" opacity="0.14" />
                  <circle cx={x + 26} cy={y + 3.5} r="1.5" fill={idx % 2 === 0 ? "#10b981" : accent} />
                </g>
              ))}
            </g>
          ))}
          {/* Столы управления */}
          {[165, 370, 575].map((x) => (
            <g key={x}>
              <rect x={x} y="96" width="82" height="6" rx="1.5" fill="currentColor" opacity="0.18" />
              <rect x={x + 8} y="102" width="4" height="22" fill="currentColor" opacity="0.14" />
              <rect x={x + 70} y="102" width="4" height="22" fill="currentColor" opacity="0.14" />
            </g>
          ))}
        </g>
      )}

      {/* Пол этажа */}
      <rect x="0" y="122" width="800" height="10" fill="currentColor" opacity="0.07" />
    </svg>
  );
}

/** Декоративное соседнее здание по бокам улицы (как g-ho-street-side у app.teamly.to). */
function SideBuilding({ side }: { side: "left" | "right" }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "hidden w-36 shrink-0 flex-col opacity-40 lg:flex xl:w-44",
        side === "left" ? "items-end" : "items-start",
      )}
    >
      <div className="h-4 w-4/5 rounded-t-md border border-b-0 border-border bg-card" />
      <div className="grid w-full grid-cols-3 gap-2.5 rounded-t-md border border-b-0 border-border bg-card p-3.5">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className="h-5 rounded-xs border border-border/70 bg-muted/70" />
        ))}
      </div>
    </div>
  );
}

export function OfficeBuilding() {
  const [selectedId, setSelectedId] = useState<string>(officeRoof.id);
  const [activePillIndex, setActivePillIndex] = useState<number>(0);
  const [motion, setMotion] = useState<AgentMotion>(() =>
    Object.fromEntries(ALL_EMPLOYEES.map((e) => [e.id, { x: e.baseX, walk: null }])),
  );

  // Закрытие бабла по Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Живая ротация коротких статусных баблов над головами (bld-say)
  useEffect(() => {
    const timer = window.setInterval(() => {
      setActivePillIndex((i) => (i + 1) % ALL_EMPLOYEES.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  // Автономные микро-прогулки персонажей по этажу (как в app.teamly.to)
  useEffect(() => {
    let stopTimer: number | undefined;
    const walkTimer = window.setInterval(() => {
      const candidates = ALL_EMPLOYEES.filter((e) => e.id !== selectedId);
      if (!candidates.length) return;
      const emp = candidates[Math.floor(Math.random() * candidates.length)];
      setMotion((prev) => {
        const cur = prev[emp.id]?.x ?? emp.baseX;
        const target = Math.round(emp.minX + Math.random() * (emp.maxX - emp.minX));
        if (Math.abs(target - cur) < 2) return prev;
        const dir: WalkDir = target < cur ? "left" : "right";
        window.clearTimeout(stopTimer);
        stopTimer = window.setTimeout(() => {
          setMotion((p) => ({ ...p, [emp.id]: { x: target, walk: null } }));
        }, 2400);
        return { ...prev, [emp.id]: { x: target, walk: dir } };
      });
    }, 3200);
    return () => {
      window.clearInterval(walkTimer);
      window.clearTimeout(stopTimer);
    };
  }, [selectedId]);

  const selected: SelectedEntity | null = (() => {
    if (!selectedId) return null;
    if (selectedId === officeRoof.id) return { kind: "roof" };
    for (const floor of officeFloors) {
      const emp = floor.employees.find((e) => e.id === selectedId);
      if (emp) return { kind: "employee", floor, employee: emp };
    }
    return null;
  })();

  const toggle = (id: string) => setSelectedId((cur) => (cur === id ? "" : id));
  const pillOwnerId = ALL_EMPLOYEES[activePillIndex]?.id;

  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-border">
      {/* Улица с небом и зданиями */}
      <div className="bld-street relative px-3 pt-8 sm:px-6 sm:pt-10">
        <div className="mx-auto flex max-w-5xl items-end justify-center gap-4">
          <SideBuilding side="left" />

          {/* Главное здание NikAlimp */}
          <div className="w-full max-w-3xl">
            {/* Крыша с вывеской NikAlimp */}
            <div className="relative flex flex-col items-center">
              {/* Антенна и вывеска */}
              <button
                type="button"
                onClick={() => toggle(officeRoof.id)}
                aria-expanded={selectedId === officeRoof.id}
                className={cn(
                  "group relative z-10 flex cursor-pointer flex-col items-center rounded-xl border-2 bg-card px-6 py-3 text-center transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selectedId === officeRoof.id ? "border-brand" : "border-foreground/80",
                )}
                style={{ boxShadow: "4px 4px 0 var(--border)" }}
              >
                <span className="inline-flex items-center gap-2 font-mono text-lg font-bold tracking-widest text-foreground sm:text-xl">
                  <span className="bld-edge size-2.5 rounded-full bg-brand" />
                  {officeRoof.sign}
                </span>
                <span className="mt-0.5 text-xs font-medium text-muted-foreground">{officeRoof.subtitle}</span>
              </button>
              {/* Опоры вывески + парапет крыши */}
              <div className="flex w-44 justify-between px-8" aria-hidden="true">
                <span className="h-3 w-1.5 bg-foreground/60" />
                <span className="h-3 w-1.5 bg-foreground/60" />
              </div>
              <div className="h-3.5 w-[96%] rounded-t-lg border-2 border-b-0 border-foreground/75 bg-card" aria-hidden="true" />
            </div>

            {/* Корпус с 4 этажами в разрезе */}
            <div className="relative overflow-hidden border-2 border-b-0 border-foreground/75 bg-card shadow-lg">
              <div className="divide-y-2 divide-foreground/60">
                {officeFloors.map((floor) => (
                  <div key={floor.number} className="relative h-36 sm:h-40">
                    {/* Светящаяся боковая полоска этажа как .g-bld-edge */}
                    <span
                      aria-hidden="true"
                      className="bld-edge absolute bottom-2 left-0 top-2 z-10 w-1 rounded-r"
                      style={{ backgroundColor: floor.accentHex }}
                    />

                    {/* Векторный интерьер комнаты */}
                    <FloorInterior theme={floor.theme} accent={floor.accentHex} />

                    {/* Табличка этажа на стене */}
                    <div className="pointer-events-none absolute left-3 top-2.5 z-10 flex flex-wrap items-center gap-1.5">
                      <span
                        className="rounded border border-foreground/70 bg-card px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground"
                        style={{ boxShadow: "2px 2px 0 var(--border)" }}
                      >
                        {floor.number}F · {floor.code}
                      </span>
                      <span className="hidden rounded border border-dashed border-border bg-card/90 px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline">
                        {floor.title}
                      </span>
                    </div>

                    {/* Живые аватары сотрудников на этаже */}
                    {floor.employees.map((emp) => {
                      const pos = motion[emp.id] ?? { x: emp.baseX, walk: null };
                      const active = selectedId === emp.id;
                      const showPill = pillOwnerId === emp.id || active;
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => toggle(emp.id)}
                          aria-expanded={active}
                          aria-label={`${emp.name} (${emp.tool})`}
                          data-walk={pos.walk ?? undefined}
                          data-says={showPill ? "true" : undefined}
                          style={{ left: `${pos.x}%` }}
                          className="bld-agent group z-10 flex cursor-pointer flex-col items-center focus-visible:outline-none"
                        >
                          {/* Плавающий короткий статус-бабл над головой */}
                          <span className="bld-say pointer-events-none absolute bottom-[calc(100%+4px)] left-1/2 z-20 whitespace-nowrap rounded-md border border-foreground/75 bg-card px-2 py-0.5 text-[10px] font-semibold text-foreground sm:text-[11px]">
                            {active ? emp.name : emp.actionPill}
                            <span
                              aria-hidden="true"
                              className="absolute left-1/2 top-full -ml-1 border-4 border-transparent border-t-foreground/75"
                            />
                          </span>

                          {/* Анимированное тело */}
                          <span className="bld-agent-body relative block">
                            <AgentSprite emp={emp} active={active} />
                          </span>

                          {/* Компактная подпись инструмента под ногами */}
                          <span
                            className={cn(
                              "mt-0.5 max-w-[78px] truncate rounded px-1 py-px font-mono text-[9px] font-semibold sm:max-w-[110px] sm:text-[10px]",
                              active
                                ? "bg-brand text-brand-foreground"
                                : "bg-card/90 text-muted-foreground group-hover:text-foreground",
                            )}
                          >
                            {emp.name.split(" ")[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Лобби первого этажа */}
              <div className="relative flex h-12 items-center justify-between border-t-2 border-foreground/60 bg-muted/40 px-4">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  LOBBY · ВХОД
                </span>
                {/* Стеклянные двери */}
                <div className="flex h-9 w-24 items-end justify-center gap-1 rounded-t-md border border-b-0 border-foreground/50 bg-brand-bg/50 px-2 pt-1.5" aria-hidden="true">
                  <span className="h-full w-1/2 rounded-t-xs border border-b-0 border-foreground/40 bg-card/80" />
                  <span className="h-full w-1/2 rounded-t-xs border border-b-0 border-foreground/40 bg-card/80" />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">13 инструментов</span>
              </div>
            </div>
          </div>

          <SideBuilding side="right" />
        </div>
      </div>

      {/* Тротуар улицы (как .g-ho-street-ground) */}
      <div className="bld-ground h-5 border-y-2 border-foreground/75" aria-hidden="true" />

      {/* Интерактивный речевой бабл выбранного сотрудника / вывески NikAlimp */}
      <div className="bg-card p-4 sm:p-5">
        {selected ? (
          <div
            key={selected.kind === "roof" ? officeRoof.id : selected.employee.id}
            role="region"
            aria-live="polite"
            className="bld-bubble-in relative flex flex-col gap-3 rounded-xl border-2 border-brand/50 bg-background p-4 sm:flex-row sm:items-start sm:gap-4"
            style={{ boxShadow: "4px 4px 0 var(--border)" }}
          >
            <div className="flex shrink-0 items-center justify-center rounded-xl border bg-card p-1.5">
              {selected.kind === "roof" ? (
                <span className="flex size-12 items-center justify-center rounded-lg bg-brand font-mono text-sm font-bold text-brand-foreground">
                  NA
                </span>
              ) : (
                <AgentSprite emp={selected.employee} active={false} />
              )}
            </div>
            <div className="min-w-0 flex-1 pr-6">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">
                  {selected.kind === "roof" ? officeRoof.name : selected.employee.name}
                </p>
                <span className="rounded-md border bg-card px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {selected.kind === "roof" ? officeRoof.subtitle : selected.employee.tool}
                </span>
                {selected.kind === "employee" && (
                  <span className="text-xs text-muted-foreground">
                    {selected.floor.number} этаж · {selected.floor.title}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                «{selected.kind === "roof" ? officeRoof.speech : selected.employee.speech}»
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId("")}
              aria-label="Закрыть реплику"
              className="absolute right-3 top-3 cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Нажмите на вывеску «NikAlimp» на крыше или на любого сотрудника внутри здания, чтобы открыть реплику.
          </p>
        )}
      </div>

      {/* Полный текст для поисковиков и нейросетей без JavaScript */}
      <noscript>
        <div className="space-y-4 border-t bg-card p-5 text-sm">
          <p className="font-semibold">{officeRoof.sign}: {officeRoof.subtitle}</p>
          <p>{officeRoof.speech}</p>
          {officeFloors.map((floor) => (
            <div key={floor.number}>
              <p className="font-semibold">{floor.number} этаж — {floor.title}</p>
              <ul className="mt-1 list-disc pl-5">
                {floor.employees.map((e) => (
                  <li key={e.id}>
                    <strong>{e.name} ({e.tool})</strong>: {e.speech}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </noscript>
    </div>
  );
}
