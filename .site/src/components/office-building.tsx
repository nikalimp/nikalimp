"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { officeFloors, officeRoof, type OfficeEmployee } from "@/lib/office";
import { cn } from "@/lib/utils";

type SelectedEntity =
  | { kind: "roof"; id: string; name: string; role: string; tool: string; speech: string; accent: string }
  | { kind: "employee"; floorTitle: string; employee: OfficeEmployee };

function Avatar({ color, active }: { color: string; active: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background transition-colors",
        active ? "border-brand ring-2 ring-brand/25" : "border-border",
      )}
    >
      <svg viewBox="0 0 36 36" className="size-8" aria-hidden="true">
        <rect x="11" y="6" width="14" height="11" rx="4" fill={color} opacity="0.92" />
        <rect x="14.5" y="10.5" width="2.2" height="2.2" rx="0.6" fill="currentColor" className="text-background" />
        <rect x="19.3" y="10.5" width="2.2" height="2.2" rx="0.6" fill="currentColor" className="text-background" />
        <path d="M7.5 30c0-5 4.2-9 10.5-9s10.5 4 10.5 9" fill={color} opacity="0.22" />
        <path d="M10 30c0-3.8 3.2-7 8-7s8 3.2 8 7" fill={color} opacity="0.86" />
        <rect x="12" y="25.5" width="12" height="4.5" rx="1.2" fill="currentColor" className="text-foreground/75" />
      </svg>
      <span
        className={cn(
          "absolute -right-1 -top-1 size-2.5 rounded-full ring-2 ring-card",
          active ? "bg-brand" : "bg-emerald-500",
        )}
      />
    </span>
  );
}

export function OfficeBuilding() {
  const [selectedId, setSelectedId] = useState<string>(officeRoof.id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selected: SelectedEntity | null = (() => {
    if (!selectedId) return null;
    if (selectedId === officeRoof.id) {
      return {
        kind: "roof",
        id: officeRoof.id,
        name: officeRoof.name,
        role: officeRoof.role,
        tool: officeRoof.subtitle,
        speech: officeRoof.speech,
        accent: "#2563eb",
      };
    }
    for (const floor of officeFloors) {
      const emp = floor.employees.find((e) => e.id === selectedId);
      if (emp) return { kind: "employee", floorTitle: `${floor.number} этаж · ${floor.title}`, employee: emp };
    }
    return null;
  })();

  const toggle = (id: string) => setSelectedId((cur) => (cur === id ? "" : id));

  return (
    <div className="mt-10">
      {/* Крыша здания с вывеской NikAlimp */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => toggle(officeRoof.id)}
          aria-expanded={selectedId === officeRoof.id}
          className={cn(
            "group relative flex w-full max-w-md cursor-pointer flex-col items-center rounded-t-2xl border border-b-0 bg-card px-6 py-4 text-center transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selectedId === officeRoof.id ? "border-brand/60 bg-brand-bg/40" : "border-border",
          )}
        >
          <span className="inline-flex items-center gap-2 font-mono text-lg font-bold tracking-wider text-foreground">
            <span className="size-2 rounded-full bg-brand" />
            {officeRoof.sign}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">{officeRoof.subtitle}</span>
        </button>

        {/* Корпус здания с этажами */}
        <div className="w-full overflow-hidden rounded-2xl border bg-card">
          <div className="divide-y">
            {officeFloors.map((floor) => (
              <div key={floor.number} className={cn("border-l-4 p-4 sm:p-5", floor.borderClass)}>
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={cn("rounded-md px-2 py-0.5 font-mono text-xs font-semibold", floor.badgeClass)}>
                      {floor.number}F
                    </span>
                    <h3 className="text-base font-semibold text-foreground">{floor.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{floor.zone}</p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  {floor.employees.map((emp) => {
                    const active = selectedId === emp.id;
                    return (
                      <div key={emp.id} className="relative">
                        <button
                          type="button"
                          onClick={() => toggle(emp.id)}
                          aria-expanded={active}
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active
                              ? "border-brand/60 bg-brand-bg/50"
                              : "border-border bg-background hover:border-foreground/25 hover:bg-accent/40",
                          )}
                        >
                          <Avatar color={emp.accent} active={active} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">{emp.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{emp.tool}</p>
                            <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground/80">{emp.role}</p>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Фундамент + речевой бабл выбранного сотрудника */}
          <div className="border-t bg-background/80 p-4 sm:p-5">
            {selected ? (
              <div
                role="region"
                aria-live="polite"
                aria-label={selected.kind === "roof" ? selected.name : selected.employee.name}
                className="relative flex flex-col gap-3 rounded-xl border border-brand/40 bg-card p-4 sm:flex-row sm:items-start sm:gap-4"
              >
                <Avatar
                  color={selected.kind === "roof" ? selected.accent : selected.employee.accent}
                  active
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pr-7">
                    <p className="font-semibold text-foreground">
                      {selected.kind === "roof" ? selected.name : selected.employee.name}
                    </p>
                    <span className="rounded-full border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {selected.kind === "roof" ? selected.tool : selected.employee.tool}
                    </span>
                    {selected.kind === "employee" && (
                      <span className="text-xs text-muted-foreground">{selected.floorTitle}</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    «{selected.kind === "roof" ? selected.speech : selected.employee.speech}»
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
                Нажмите на вывеску «NikAlimp» или на любого сотрудника на этажах, чтобы узнать, за что он отвечает.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Доступное текстовое описание архитектуры для поисковиков и нейросетей без JavaScript */}
      <noscript>
        <div className="mt-6 space-y-4 rounded-xl border bg-card p-5 text-sm">
          <p className="font-semibold">{officeRoof.sign}: {officeRoof.subtitle}</p>
          <p>{officeRoof.speech}</p>
          {officeFloors.map((floor) => (
            <div key={floor.number}>
              <p className="font-semibold">{floor.number} этаж — {floor.title}</p>
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
