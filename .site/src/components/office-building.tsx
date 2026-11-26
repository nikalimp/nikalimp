"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import "@fontsource/pixelify-sans/500.css";
import "@fontsource/pixelify-sans/700.css";
import { officeFloors, officeHost, type OfficeEmployee, type OfficeFloor } from "@/lib/office";
import { cn } from "@/lib/utils";

/*
 * Пиксельное здание NikAlimp в духе app.teamly.to.
 * Вся графика — SVG из прямоугольников на сетке 1 юнит = 1 пиксель арта (crispEdges).
 * Этаж — 320×80 юнитов, крыша — 320×40, лобби — 320×52. Персонаж — 16×24.
 */

type WalkDir = "left" | "right" | null;
type AgentMotion = Record<string, { x: number; walk: WalkDir; dur?: number }>;

/** Порядок диалогов: хозяин на крыше, дальше этажи сверху вниз. */
const CAST: { emp: OfficeEmployee; floor: OfficeFloor | null }[] = [
  { emp: officeHost, floor: null },
  ...officeFloors.flatMap((floor) => floor.employees.map((emp) => ({ emp, floor }))),
];
const WALKERS = officeFloors.flatMap((f) => f.employees);

/* ---------- Палитра ---------- */
const C = {
  out: "#2a2f3d",
  line: "#3d4659",
  wall: "#e9eef6",
  wallSeam: "#dbe2ed",
  ceil: "#cfd7e3",
  base: "#c5cfdd",
  floor: "#d6dde8",
  floorSeam: "#c3ccda",
  slabTop: "#cdd5e1",
  slab: "#adb8c9",
  slabDark: "#8a97ad",
  side: "#bcc6d5",
  sideDark: "#97a3b7",
  wood: "#c4905a",
  woodDark: "#9a6b3e",
  metal: "#4a5368",
  screen: "#2f3645",
  blue: "#2f6fe4",
  blueDark: "#1f4fb0",
  green: "#4caf50",
  greenDark: "#2e7d32",
  greenLight: "#7bd27f",
  pot: "#f4f6fa",
  potShade: "#c9d1dd",
  white: "#fbfcfe",
  glass: "#cfe2fb",
  glassDark: "#a9c8f2",
  pink: "#f48fb1",
  orange: "#ffb74d",
  yellow: "#ffe36e",
  sky: "#64b5f6",
};
const SKINS = ["#f6d2b0", "#e8b48a", "#c98b5e"];

function shade(hex: string, k = 0.28) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.min(255, Math.round(v * (1 - k))).toString(16).padStart(2, "0");
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

/* ---------- Пиксельный спрайт сотрудника ---------- */
// o контур, h волосы, H тень волос, s кожа, S тень кожи, r румянец, c одежда, C тень одежды, w воротник, p брюки, b обувь
const BODY = [
  "................",
  "....oooooooo....",
  "...ohhhhhhhho...",
  "..ohhhhhhhhhho..",
  "..ohhhhhhhHHho..",
  "..ohssssssssho..",
  "..osssssssssso..",
  "..osssssssssso..",
  "..osssssssssso..",
  "..osrssssssrso..",
  "...osssSSssso...",
  "....oossssoo....",
  "...occcwwccco...",
  "..occcccccccco..",
  ".occcccccccccco.",
  ".ocCccccccccCco.",
  ".osCccccccccCso.",
  ".oocCCCCCCCCcoo.",
  "...oppppppppo...",
  "...opppoopppo...",
];
const LEGS_A = ["...oppo..oppo...", "...oppo..oppo...", "..obbbo..obbbo..", "..ooooo..ooooo.."];
const LEGS_B = ["...oppo..oppo...", "..obbbo..oppo...", "..ooooo.obbbo...", "........ooooo..."];

function applyHair(rows: string[], style: OfficeEmployee["hairStyle"]) {
  const g = rows.map((r) => r.split(""));
  const set = (r: number, c: number, v: string) => {
    if (g[r] && c >= 0 && c < 16) g[r][c] = v;
  };
  if (style === "bun") {
    set(0, 6, "o"); set(0, 7, "h"); set(0, 8, "h"); set(0, 9, "o");
  }
  if (style === "long") {
    for (let r = 5; r <= 11; r++) { set(r, 3, "h"); set(r, 12, "h"); set(r, 2, "o"); set(r, 13, "o"); }
    set(11, 4, "o"); set(11, 11, "o");
  }
  if (style === "spiky") {
    set(0, 4, "o"); set(0, 7, "o"); set(0, 10, "o");
    set(1, 4, "h"); set(1, 7, "h"); set(1, 10, "h");
  }
  if (style === "cap") {
    for (let c = 3; c <= 12; c++) { set(2, c, "c"); set(3, c, "c"); }
    for (let c = 3; c <= 14; c++) set(4, c, "C");
    set(4, 15, "o"); set(3, 13, "o"); set(2, 12, "o");
  }
  return g.map((r) => r.join(""));
}

function PixelRows({ rows, y0, pal }: { rows: string[]; y0: number; pal: Record<string, string> }) {
  const rects: ReactNode[] = [];
  rows.forEach((row, ri) => {
    let c = 0;
    while (c < row.length) {
      const ch = row[c];
      if (ch === ".") { c++; continue; }
      let end = c + 1;
      while (end < row.length && row[end] === ch) end++;
      rects.push(<rect key={`${ri}-${c}`} x={c} y={y0 + ri} width={end - c} height={1} fill={pal[ch]} />);
      c = end;
    }
  });
  return <>{rects}</>;
}

function AgentSprite({ emp, className }: { emp: OfficeEmployee; className?: string }) {
  const skin = SKINS[emp.skin] ?? SKINS[0];
  const pal: Record<string, string> = {
    o: C.out, h: emp.hair, H: shade(emp.hair, 0.35), s: skin, S: shade(skin, 0.15), r: "#f3a6a0",
    c: emp.accent, C: shade(emp.accent), w: C.white, p: "#3b4a6b", b: C.out,
  };
  const body = applyHair(BODY, emp.hairStyle);
  return (
    <svg viewBox="0 0 16 24" shapeRendering="crispEdges" className={cn("px-sprite block h-auto w-full overflow-visible", className)} aria-hidden="true">
      <rect x="2" y="23" width="12" height="1" fill="#000" opacity="0.14" />
      <g className="px-legs-a"><PixelRows rows={LEGS_A} y0={20} pal={pal} /></g>
      <g className="px-legs-b"><PixelRows rows={LEGS_B} y0={20} pal={pal} /></g>
      <g className="px-upper">
        <PixelRows rows={body} y0={0} pal={pal} />
        {/* Глаза: моргают */}
        <g className="px-eyes" fill="#1d2230">
          <rect x="5" y="7" width="1" height="2" />
          <rect x="10" y="7" width="1" height="2" />
        </g>
        {emp.accessory === "glasses" && (
          <g fill={C.out}>
            <rect x="4" y="6" width="3" height="1" /><rect x="9" y="6" width="3" height="1" />
            <rect x="4" y="9" width="3" height="1" /><rect x="9" y="9" width="3" height="1" />
            <rect x="3" y="7" width="1" height="2" /><rect x="7" y="7" width="2" height="1" /><rect x="12" y="7" width="1" height="2" />
          </g>
        )}
        {emp.accessory === "headset" && (
          <g>
            <rect x="1" y="6" width="2" height="4" fill={C.out} />
            <rect x="13" y="6" width="2" height="4" fill={C.out} />
            <rect x="3" y="10" width="1" height="1" fill={C.out} />
            <rect x="4" y="11" width="2" height="1" fill={emp.accent} />
          </g>
        )}
        {emp.accessory === "coffee" && (
          <g>
            <rect x="13" y="13" width="4" height="4" fill={C.out} />
            <rect x="14" y="14" width="2" height="2" fill={C.white} />
            <rect x="17" y="14" width="1" height="2" fill={C.out} />
            <g className="px-steam" fill="#cfd7e3">
              <rect x="14" y="11" width="1" height="1" /><rect x="15" y="10" width="1" height="1" />
            </g>
          </g>
        )}
        {emp.accessory === "laptop" && (
          <g>
            <rect x="3" y="14" width="10" height="5" fill={C.out} />
            <rect x="4" y="15" width="8" height="3" fill="#cfd7e3" />
            <rect x="7" y="16" width="2" height="1" fill={emp.accent} />
          </g>
        )}
      </g>
    </svg>
  );
}

/* ---------- Мебель и декор (SVG-юниты этажа) ---------- */
function Plant({ x, y = 70, big = false }: { x: number; y?: number; big?: boolean }) {
  const h = big ? 22 : 14;
  return (
    <g>
      <rect x={x + 3} y={y - h} width="2" height={h - 6} fill={C.greenDark} />
      <rect x={x} y={y - h + 2} width="3" height="2" fill={C.green} />
      <rect x={x - 2} y={y - h + 4} width="3" height="2" fill={C.greenDark} />
      <rect x={x + 5} y={y - h} width="3" height="2" fill={C.green} />
      <rect x={x + 7} y={y - h + 3} width="3" height="2" fill={C.greenLight} />
      <rect x={x + 1} y={y - h - 2} width="2" height="3" fill={C.greenLight} />
      {big && (
        <>
          <rect x={x - 3} y={y - 13} width="4" height="2" fill={C.green} />
          <rect x={x + 6} y={y - 11} width="5" height="2" fill={C.greenDark} />
          <rect x={x + 4} y={y - 16} width="3" height="2" fill={C.greenLight} />
        </>
      )}
      <rect x={x} y={y - 7} width="8" height="7" fill={C.pot} />
      <rect x={x} y={y - 7} width="8" height="1" fill={C.potShade} />
      <rect x={x + 6} y={y - 6} width="2" height="6" fill={C.potShade} />
    </g>
  );
}

function Monitor({ x, y, accent, w = 14 }: { x: number; y: number; accent: string; w?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height="10" fill={C.screen} />
      <rect x={x + 1} y={y + 1} width={w - 2} height="7" fill="#3f4a5e" />
      <rect x={x + 2} y={y + 2} width={w - 6} height="1" fill={accent} />
      <rect x={x + 2} y={y + 4} width={w - 4} height="1" fill="#8fa3c4" />
      <rect x={x + 2} y={y + 6} width={w - 8} height="1" fill="#8fa3c4" />
      <rect x={x + w / 2 - 1} y={y + 10} width="2" height="2" fill={C.metal} />
      <rect x={x + w / 2 - 3} y={y + 12} width="6" height="1" fill={C.metal} />
    </g>
  );
}

function Desk({ x, accent, monitors = 2, chair = true }: { x: number; accent: string; monitors?: 1 | 2; chair?: boolean }) {
  return (
    <g>
      {monitors === 2 ? (
        <>
          <Monitor x={x + 6} y={37} accent={accent} />
          <Monitor x={x + 22} y={37} accent={accent} />
        </>
      ) : (
        <Monitor x={x + 14} y={37} accent={accent} w={16} />
      )}
      <rect x={x} y={50} width="44" height="3" fill={C.wood} />
      <rect x={x} y={53} width="44" height="1" fill={C.woodDark} />
      <rect x={x + 2} y={54} width="2" height="15" fill={C.metal} />
      <rect x={x + 40} y={54} width="2" height="15" fill={C.metal} />
      <rect x={x + 30} y={54} width="9" height="12" fill="#5a6478" />
      <rect x={x + 33} y={57} width="3" height="1" fill="#8e98ab" />
      <rect x={x + 33} y={61} width="3" height="1" fill="#8e98ab" />
      {chair && (
        <g>
          <rect x={x + 15} y={46} width="10" height="11" fill={C.blue} />
          <rect x={x + 15} y={46} width="10" height="1" fill="#5b8ff0" />
          <rect x={x + 23} y={47} width="2" height="10" fill={C.blueDark} />
          <rect x={x + 13} y={57} width="14" height="3" fill={C.blueDark} />
          <rect x={x + 19} y={60} width="2" height="5" fill={C.out} />
          <rect x={x + 14} y={65} width="12" height="1" fill={C.out} />
          <rect x={x + 14} y={66} width="2" height="2" fill={C.out} />
          <rect x={x + 24} y={66} width="2" height="2" fill={C.out} />
        </g>
      )}
    </g>
  );
}

function Board({ x, y, w, h, title, children }: { x: number; y: number; w: number; h: number; title?: string; children?: ReactNode }) {
  return (
    <g>
      {title && (
        <text x={x + w / 2} y={y - 3} textAnchor="middle" className="px-font" fontSize="7" fontWeight="700" fill={C.blue}>
          {title}
        </text>
      )}
      <rect x={x} y={y} width={w} height={h} fill={C.sideDark} />
      <rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} fill={C.white} />
      {children}
      <rect x={x + 2} y={y + h} width={w - 4} height="1" fill={C.sideDark} />
    </g>
  );
}

function Shelf({ x, y, items }: { x: number; y: number; items: string[] }) {
  return (
    <g>
      {items.map((col, i) => (
        <rect key={i} x={x + 2 + i * 3} y={y - 6 + (i % 3 === 0 ? 1 : 0)} width="2" height={6 - (i % 3 === 0 ? 1 : 0)} fill={col} />
      ))}
      <rect x={x} y={y} width={items.length * 3 + 6} height="2" fill={C.wood} />
      <rect x={x} y={y + 2} width={items.length * 3 + 6} height="1" fill={C.woodDark} />
    </g>
  );
}

function ServerRack({ x, accent, delay }: { x: number; accent: string; delay: number }) {
  return (
    <g>
      <rect x={x} y={22} width="20" height="48" fill={C.screen} />
      <rect x={x + 1} y={23} width="18" height="1" fill="#4a5568" />
      {[26, 32, 38, 44, 50, 56, 62].map((y, i) => (
        <g key={y}>
          <rect x={x + 2} y={y} width="16" height="4" fill="#3f4a5e" />
          <rect x={x + 3} y={y + 1} width="8" height="1" fill="#566179" />
          <rect
            x={x + 14}
            y={y + 1}
            width="2"
            height="2"
            fill={i % 3 === 0 ? accent : "#4ade80"}
            className="px-led"
            style={{ animationDelay: `${(delay + i * 0.37) % 2}s` }}
          />
        </g>
      ))}
    </g>
  );
}

/* ---------- Этажи ---------- */
function FloorShell({ children }: { children: ReactNode }) {
  return (
    <>
      <rect width="320" height="80" fill={C.wall} />
      {[40, 80, 120, 160, 200, 240, 280].map((x) => (
        <rect key={x} x={x} y="3" width="1" height="57" fill={C.wallSeam} />
      ))}
      <rect width="320" height="3" fill={C.ceil} />
      <rect y="3" width="320" height="1" fill={C.wallSeam} />
      <rect y="60" width="320" height="2" fill={C.base} />
      <rect y="62" width="320" height="10" fill={C.floor} />
      <rect y="66" width="320" height="1" fill={C.floorSeam} />
      {Array.from({ length: 14 }).map((_, i) => (
        <rect key={i} x={12 + i * 24} y={i % 2 ? 62 : 67} width="1" height={i % 2 ? 4 : 5} fill={C.floorSeam} />
      ))}
      {children}
      <rect y="72" width="320" height="1" fill={C.slabTop} />
      <rect y="73" width="320" height="6" fill={C.slab} />
      <rect y="79" width="320" height="1" fill={C.slabDark} />
      <rect width="5" height="80" fill={C.side} />
      <rect x="5" width="1" height="72" fill={C.sideDark} />
      <rect x="315" width="5" height="80" fill={C.side} />
      <rect x="314" width="1" height="72" fill={C.sideDark} />
    </>
  );
}

function FloorArt({ floor }: { floor: OfficeFloor }) {
  const a = floor.accentHex;
  let art: ReactNode = null;

  if (floor.theme === "build") {
    art = (
      <>
        <Board x={22} y={16} w={58} h={34} title="SITEMAP">
          <rect x={44} y={20} width="14" height="5" fill={a} />
          <rect x={50} y={25} width="2" height="4" fill={C.line} />
          <rect x={30} y={29} width="42" height="1" fill={C.line} />
          {[28, 45, 62].map((bx) => (
            <g key={bx}>
              <rect x={bx + 2} y={29} width="1" height="4" fill={C.line} />
              <rect x={bx} y={33} width="10" height="5" fill="#bcd2f7" />
              <rect x={bx} y={40} width="10" height="3" fill={C.yellow} />
            </g>
          ))}
        </Board>
        <Plant x={8} big />
        <Desk x={100} accent={a} />
        <Board x={160} y={18} w={36} h={26} title="UI KIT">
          {[0, 1, 2].map((i) => (
            <rect key={i} x={164 + i * 10} y={22} width="8" height="8" fill={[a, C.pink, C.orange][i]} />
          ))}
          <rect x={164} y={33} width="28" height="3" fill="#cfd7e3" />
          <rect x={164} y={38} width="18" height="3" fill={a} />
        </Board>
        <Desk x={212} accent={a} monitors={1} />
        <Shelf x={262} y={26} items={[a, C.orange, C.green, C.pink, C.sky, C.yellow, a]} />
        <Plant x={300} />
      </>
    );
  }

  if (floor.theme === "geo") {
    art = (
      <>
        <Plant x={9} big />
        <Desk x={30} accent={a} monitors={1} />
        <g>
          <text x={128} y={11} textAnchor="middle" className="px-font" fontSize="7" fontWeight="700" fill={a}>AI SEARCH</text>
          <rect x={92} y={14} width="72" height="34" fill={C.screen} />
          <rect x={94} y={16} width="68" height="30" fill="#1e2433" />
          {[[98, 38], [106, 36], [114, 37], [122, 32], [130, 33], [138, 27], [146, 24], [154, 20]].map(([px, py], i, arr) => (
            <g key={px}>
              <rect x={px} y={py} width="3" height="2" fill={i === arr.length - 1 ? "#4ade80" : a} />
              {i < arr.length - 1 && <rect x={px + 3} y={Math.min(py, arr[i + 1][1]) + 1} width="5" height="1" fill={shade(a, -0.4)} opacity="0.7" />}
            </g>
          ))}
          <rect x={97} y={42} width="62" height="1" fill="#3f4a5e" />
          <rect x={126} y={48} width="4" height="12" fill={C.metal} />
        </g>
        <Desk x={176} accent={a} />
        <Board x={236} y={18} w={34} h={30} title="SCHEMA">
          {[22, 27, 32, 37, 42].map((y, i) => (
            <rect key={y} x={240 + (i % 2) * 4} y={y} width={i % 2 ? 20 : 26} height="2" fill={i === 0 ? a : "#cfd7e3"} />
          ))}
        </Board>
        <Shelf x={280} y={36} items={[a, C.sky, C.orange, a, C.green]} />
        <Plant x={298} big />
      </>
    );
  }

  if (floor.theme === "content") {
    art = (
      <>
        <Plant x={8} big />
        <Board x={24} y={14} w={62} h={38} title="CONTENT PLAN">
          {Array.from({ length: 5 }).map((_, c) => (
            <rect key={c} x={27 + c * 12} y={17} width="10" height="2" fill="#cfd7e3" />
          ))}
          {Array.from({ length: 3 }).map((_, r) =>
            Array.from({ length: 5 }).map((_, c) => (
              <rect key={`${r}-${c}`} x={27 + c * 12} y={21 + r * 10} width="10" height="8" fill="#eef2f8" />
            )),
          )}
          <rect x={29} y={23} width="5" height="4" fill={C.pink} />
          <rect x={53} y={33} width="5" height="4" fill={a} />
          <rect x={65} y={23} width="5" height="4" fill={C.orange} />
          <rect x={77} y={43} width="5" height="4" fill={C.sky} />
          <rect x={41} y={43} width="5" height="4" fill={C.yellow} />
        </Board>
        {/* Свет и камера для видео */}
        <g>
          <rect x={104} y={22} width="14" height="12" fill={C.screen} />
          <rect x={105} y={23} width="12" height="10" fill="#f5f7fb" />
          <rect x={110} y={34} width="2" height="34" fill={C.out} />
          <rect x={105} y={66} width="12" height="1" fill={C.out} />
          <rect x={104} y={67} width="2" height="3" fill={C.out} />
          <rect x={116} y={67} width="2" height="3" fill={C.out} />
          <rect x={128} y={34} width="12" height="8" fill={C.out} />
          <rect x={131} y={36} width="5" height="4" fill="#566179" />
          <rect x={139} y={36} width="3" height="3" fill={C.out} />
          <rect x={133} y={42} width="2" height="26" fill={C.out} />
          <rect x={128} y={67} width="12" height="1" fill={C.out} />
        </g>
        <Desk x={170} accent={a} />
        <g>
          <text x={258} y={13} textAnchor="middle" className="px-font" fontSize="7" fontWeight="700" fill={C.blue}>LEADS</text>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={234 + i * 17} y={17} width="14" height="12" fill={C.sideDark} />
              <rect x={235 + i * 17} y={18} width="12" height="10" fill={C.white} />
              <rect x={237 + i * 17} y={20} width="8" height="2" fill={i === 1 ? a : C.sky} />
              <rect x={237 + i * 17} y={24} width="6" height="1" fill="#cfd7e3" />
            </g>
          ))}
        </g>
        <Desk x={236} accent={a} monitors={1} chair={false} />
        <Plant x={298} big />
      </>
    );
  }

  if (floor.theme === "ops") {
    art = (
      <>
        <ServerRack x={9} accent={a} delay={0} />
        <ServerRack x={31} accent={a} delay={0.6} />
        <Desk x={66} accent={a} />
        <g>
          <text x={160} y={11} textAnchor="middle" className="px-font" fontSize="7" fontWeight="700" fill={C.blue}>STATUS 24/7</text>
          <rect x={128} y={14} width="64" height="32" fill={C.screen} />
          <rect x={130} y={16} width="60" height="28" fill="#1e2433" />
          {[10, 16, 12, 20, 18, 24, 22].map((h, i) => (
            <rect key={i} x={134 + i * 8} y={42 - h} width="5" height={h} fill={i === 6 ? "#4ade80" : a} opacity={0.6 + i * 0.05} />
          ))}
          <rect x={158} y={46} width="4" height="14" fill={C.metal} />
        </g>
        <Desk x={204} accent={a} monitors={1} />
        <g>
          {/* Кофемашина и кулер */}
          <rect x={258} y={48} width="22" height="22" fill="#d7dde7" />
          <rect x={258} y={48} width="22" height="1" fill={C.sideDark} />
          <rect x={261} y={38} width="10" height="10" fill={C.metal} />
          <rect x={263} y={40} width="3" height="2" fill="#4ade80" />
          <rect x={264} y={44} width="3" height="3" fill={C.white} />
          <rect x={274} y={34} width="5" height="14" fill="#bfe0ff" />
        </g>
        <Plant x={298} big />
      </>
    );
  }

  return (
    <svg
      viewBox="0 0 320 80"
      shapeRendering="crispEdges"
      className="pointer-events-none absolute inset-0 size-full"
      aria-hidden="true"
    >
      <FloorShell>{art}</FloorShell>
    </svg>
  );
}

function RoofArt() {
  return (
    <svg viewBox="0 0 320 40" shapeRendering="crispEdges" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
      {/* Перила */}
      {[
        [12, 98],
        [222, 308],
      ].map(([x1, x2]) => (
        <g key={x1}>
          <rect x={x1} y={24} width={x2 - x1} height="2" fill={C.sideDark} />
          {Array.from({ length: Math.floor((x2 - x1) / 8) + 1 }).map((_, i) => (
            <rect key={i} x={x1 + i * 8} y={24} width="2" height="8" fill={C.sideDark} />
          ))}
        </g>
      ))}
      {/* Кондиционеры */}
      {[60, 238].map((x) => (
        <g key={x}>
          <rect x={x} y={14} width="26" height="18" fill={C.out} />
          <rect x={x + 1} y={15} width="24" height="16" fill="#e3e8f0" />
          <rect x={x + 3} y={17} width="12" height="12" fill={C.out} />
          <rect x={x + 4} y={18} width="10" height="10" fill="#566179" />
          <g className="px-fan" style={{ transformOrigin: `${x + 9}px 23px` }}>
            <rect x={x + 8} y={19} width="2" height="8" fill="#9aa6b9" />
            <rect x={x + 5} y={22} width="8" height="2" fill="#9aa6b9" />
          </g>
          {[18, 21, 24, 27].map((y) => (
            <rect key={y} x={x + 17} y={y} width="6" height="1" fill="#9aa6b9" />
          ))}
        </g>
      ))}
      {/* Вывеска */}
      <rect x={128} y={24} width="2" height="8" fill={C.metal} />
      <rect x={190} y={24} width="2" height="8" fill={C.metal} />
      <rect x={106} y={2} width="108" height="23" fill={C.blue} />
      <rect x={108} y={4} width="104" height="19" fill="#f2f6fd" />
      <rect x={108} y={4} width="104" height="1" fill={C.white} />
      {/* Пиксельный значок */}
      <rect x={115} y={7} width="12" height="13" fill={C.blue} />
      <rect x={117} y={11} width="8" height="7" fill="#f2f6fd" />
      <rect x={118} y={13} width="2" height="2" fill={C.blue} />
      <rect x={122} y={13} width="2" height="2" fill={C.blue} />
      <rect x={119} y={16} width="4" height="1" fill={C.blue} />
      <text x={133} y={18} className="px-font" fontSize="12" fontWeight="700" fill={C.blue}>
        NikAlimp
      </text>
      {/* Плита крыши */}
      <rect y="32" width="320" height="1" fill={C.slabTop} />
      <rect y="33" width="320" height="6" fill={C.slab} />
      <rect y="39" width="320" height="1" fill={C.slabDark} />
      <rect x="2" y="30" width="316" height="2" fill={C.side} />
    </svg>
  );
}

function LobbyArt() {
  return (
    <svg viewBox="0 0 320 52" shapeRendering="crispEdges" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
      <rect width="320" height="52" fill={C.wall} />
      <rect width="320" height="3" fill={C.ceil} />
      {/* Стеклянная витрина слева со знаком */}
      <rect x={10} y={6} width="96" height="34" fill="#5d6b85" />
      <rect x={12} y={8} width="92" height="30" fill={C.glass} />
      <rect x={14} y={10} width="40" height="24" fill="#f2f6fd" />
      <rect x={18} y={14} width="9" height="10" fill={C.blue} />
      <rect x={20} y={17} width="5" height="5" fill="#f2f6fd" />
      <text x={30} y={23} className="px-font" fontSize="7" fontWeight="700" fill={C.blue}>NikAlimp</text>
      <rect x={70} y={8} width="2" height="30" fill={C.glassDark} />
      <rect x={78} y={10} width="4" height="12" fill="#e5f0fe" opacity="0.8" />
      {/* Двери */}
      <rect x={130} y={4} width="60" height="36" fill="#5d6b85" />
      <rect x={132} y={6} width="27" height="34" fill={C.glass} />
      <rect x={161} y={6} width="27" height="34" fill={C.glass} />
      <rect x={155} y={18} width="2" height="10" fill="#5d6b85" />
      <rect x={163} y={18} width="2" height="10" fill="#5d6b85" />
      <rect x={136} y={9} width="3" height="14" fill="#e5f0fe" />
      <rect x={165} y={9} width="3" height="14" fill="#e5f0fe" />
      <rect x={136} y={40} width="48" height="3" fill={C.blue} />
      {/* Ресепшен */}
      <rect x={234} y={8} width="18" height="32" fill={C.wood} />
      {[237, 241, 245, 249].map((x) => (
        <rect key={x} x={x} y={8} width="1" height="32" fill={C.woodDark} />
      ))}
      <Monitor x={262} y={18} accent={C.blue} />
      <rect x={252} y={30} width="42" height="12" fill={C.white} />
      <rect x={252} y={30} width="42" height="1" fill={C.sideDark} />
      <rect x={256} y={33} width="34" height="7" fill={C.wood} />
      <Plant x={114} y={42} big />
      <Plant x={204} y={42} big />
      <Plant x={300} y={42} />
      {/* Тротуар */}
      <rect y="42" width="320" height="10" fill="#c9d1dd" />
      <rect y="42" width="320" height="1" fill="#e0e6ee" />
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={16 + i * 32} y={43} width="1" height="9" fill="#b3bdcc" />
      ))}
      <rect width="5" height="42" fill={C.side} />
      <rect x="315" width="5" height="42" fill={C.side} />
    </svg>
  );
}

/* ---------- Диалоговый бабл ---------- */
function useTypewriter(text: string, run: boolean) {
  const [n, setN] = useState(text.length);
  useEffect(() => {
    if (!run) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setN(text.length); return; }
    setN(0);
    let i = 0;
    const t = window.setInterval(() => {
      i += 2;
      // Клик по баблу уже дописал текст — таймер его не откатывает
      setN((p) => (p >= text.length ? p : Math.min(i, text.length)));
      if (i >= text.length) window.clearInterval(t);
    }, 24);
    return () => window.clearInterval(t);
  }, [text, run]);
  return [n, () => setN(text.length)] as const;
}

function SpeechBubble({
  emp,
  floor,
  index,
  anchor,
  below,
  bubbleRef,
  nextRef,
  onNext,
  onClose,
}: {
  emp: OfficeEmployee;
  floor: OfficeFloor | null;
  index: number;
  anchor: "left" | "center" | "right" | "side";
  below: boolean;
  bubbleRef: React.RefObject<HTMLDivElement | null>;
  nextRef: React.RefObject<HTMLButtonElement | null>;
  onNext: () => void;
  onClose: () => void;
}) {
  const [typed, finish] = useTypewriter(emp.speech, true);
  const done = typed >= emp.speech.length;
  const isLast = index === CAST.length - 1;

  return (
    <div
      ref={bubbleRef}
      role="group"
      aria-label={`Реплика: ${emp.name}`}
      data-anchor={anchor}
      data-below={below && anchor !== "side" ? "true" : undefined}
      className="px-bubble"
      onClick={() => !done && finish()}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-bold leading-tight sm:text-sm" style={{ color: shade(emp.accent, 0.1) }}>
          {emp.name}
        </p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Закрыть реплику"
          className="-mr-1 -mt-1 cursor-pointer px-1 text-sm leading-none px-muted hover:text-[var(--px-out)]"
        >
          ✕
        </button>
      </div>
      <p className="mt-0.5 font-mono text-[11px] leading-tight px-muted">
        {emp.tool}
        {floor ? ` · ${floor.number} этаж` : " · крыша"}
      </p>
      <p className="mt-2 text-[13px] leading-snug px-ink">
        <span className="sr-only">{emp.speech}</span>
        <span aria-hidden="true">
          {emp.speech.slice(0, typed)}
          <span className="invisible">{emp.speech.slice(typed)}</span>
        </span>
      </p>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] px-faint">
          {index + 1} / {CAST.length}
        </span>
        <button
          ref={nextRef}
          type="button"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="px-next cursor-pointer text-xs font-semibold"
        >
          {isLast ? "Сначала" : "Дальше"}
          <svg viewBox="0 0 4 7" shapeRendering="crispEdges" className={cn("ml-1.5 inline-block h-[9px] w-[5px] align-[-1px]", done && "px-blink")} aria-hidden="true">
            <path d="M0 0h1v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-1z" fill="currentColor" />
          </svg>
        </button>
      </div>
      <span className="px-tail" aria-hidden="true" />
    </div>
  );
}

/* ---------- Персонаж на сцене ---------- */
function Agent({
  emp,
  x,
  walk,
  dur = 0,
  open,
  says,
  bottom,
  order,
  onToggle,
  children,
  wrapRef,
}: {
  emp: OfficeEmployee;
  x: number;
  walk: WalkDir;
  dur?: number;
  open: boolean;
  says: boolean;
  bottom: string;
  order: number;
  onToggle: () => void;
  children?: ReactNode;
  wrapRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={open ? wrapRef : undefined}
      className="px-agent"
      data-walk={walk ?? undefined}
      data-open={open ? "true" : undefined}
      data-says={says && !open ? "true" : undefined}
      style={{ left: `${x}%`, bottom, ["--d" as string]: `${(order * 0.53) % 3}s`, ["--walk" as string]: `${dur}s` }}
    >
      <span className="px-status" aria-hidden="true">{emp.actionPill}</span>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={`${emp.name}, ${emp.tool}: открыть реплику`}
        className="px-agent-btn"
      >
        {open && <span className="px-marker" aria-hidden="true">▼</span>}
        <AgentSprite emp={emp} />
      </button>
      {children}
    </div>
  );
}

export function OfficeBuilding() {
  const [selectedId, setSelectedId] = useState<string>("");
  const [pillIndex, setPillIndex] = useState(0);
  const [below, setBelow] = useState(false);
  const [motion, setMotion] = useState<AgentMotion>(() =>
    Object.fromEntries(WALKERS.map((e) => [e.id, { x: e.baseX, walk: null }])),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const focusNext = useRef(false);
  const greeted = useRef(false);

  const selectedIndex = CAST.findIndex((c) => c.emp.id === selectedId);
  const selected = selectedIndex >= 0 ? CAST[selectedIndex] : null;

  // Хозяин здоровается, когда здание впервые попадает в экран
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !greeted.current) {
          greeted.current = true;
          setSelectedId((cur) => cur || officeHost.id);
          io.disconnect();
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Escape или нажатие мимо бабла закрывают реплику
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId("");
    };
    // click, а не pointerdown: прокрутка пальцем не закрывает бабл
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t || !rootRef.current?.contains(t) || t.closest(".px-bubble") || t.closest(".px-agent-btn")) return;
      setSelectedId("");
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  // Бабл открывается вниз, если сверху не хватает места
  useLayoutEffect(() => {
    if (!selectedId || !wrapRef.current || !bubbleRef.current || !rootRef.current) return;
    const space = wrapRef.current.getBoundingClientRect().top - rootRef.current.getBoundingClientRect().top;
    setBelow(space < bubbleRef.current.offsetHeight + 14);
  }, [selectedId]);

  // Бабл не вылезает за края здания: сдвигаем его внутрь, хвостик остаётся над говорящим
  useLayoutEffect(() => {
    const fit = () => {
      const bubble = bubbleRef.current;
      const root = rootRef.current;
      if (!bubble || !root) return;
      bubble.style.setProperty("--shift", "0px");
      // Ширину берём без анимации появления (scale), центр — из реального положения
      const rect = bubble.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const b = { left: cx - bubble.offsetWidth / 2, right: cx + bubble.offsetWidth / 2 };
      const r = root.getBoundingClientRect();
      const pad = 8;
      let shift = 0;
      if (b.right > r.right - pad) shift = r.right - pad - b.right;
      if (b.left + shift < r.left + pad) shift = r.left + pad - b.left;
      bubble.style.setProperty("--shift", `${Math.round(shift)}px`);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [selectedId, below]);

  useEffect(() => {
    if (focusNext.current && nextRef.current) {
      nextRef.current.focus({ preventScroll: true });
      focusNext.current = false;
    }
  }, [selectedId]);

  // Короткие статусы над головами по очереди
  useEffect(() => {
    const t = window.setInterval(() => setPillIndex((i) => (i + 1) % WALKERS.length), 2400);
    return () => window.clearInterval(t);
  }, []);

  // Прогулки по этажу
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stops: number[] = [];
    const t = window.setInterval(() => {
      const pool = WALKERS.filter((e) => e.id !== selectedId);
      const emp = pool[Math.floor(Math.random() * pool.length)];
      if (!emp) return;
      setMotion((prev) => {
        const cur = prev[emp.id]?.x ?? emp.baseX;
        const target = Math.round(emp.minX + Math.random() * (emp.maxX - emp.minX));
        if (Math.abs(target - cur) < 2) return prev;
        const dist = Math.abs(target - cur);
        stops.push(
          window.setTimeout(() => setMotion((p) => ({ ...p, [emp.id]: { x: target, walk: null } })), dist * 260),
        );
        return { ...prev, [emp.id]: { x: target, walk: target < cur ? "left" : "right", dur: dist * 0.26 } };
      });
    }, 2600);
    return () => {
      window.clearInterval(t);
      stops.forEach((s) => window.clearTimeout(s));
    };
  }, [selectedId]);

  // Открытый собеседник останавливается
  useEffect(() => {
    if (!selectedId) return;
    setMotion((p) => (p[selectedId]?.walk ? { ...p, [selectedId]: { ...p[selectedId], walk: null } } : p));
  }, [selectedId]);

  const toggle = useCallback((id: string) => setSelectedId((cur) => (cur === id ? "" : id)), []);
  const next = useCallback(() => {
    focusNext.current = true;
    setSelectedId((cur) => {
      const i = CAST.findIndex((c) => c.emp.id === cur);
      return CAST[(i + 1) % CAST.length].emp.id;
    });
  }, []);
  const close = useCallback(() => setSelectedId(""), []);

  const pillOwner = WALKERS[pillIndex]?.id;

  const bubbleFor = (emp: OfficeEmployee, x: number) =>
    selected && selected.emp.id === emp.id ? (
      <SpeechBubble
        key={emp.id}
        emp={emp}
        floor={selected.floor}
        index={selectedIndex}
        anchor={emp.id === officeHost.id ? "side" : x < 34 ? "left" : x > 66 ? "right" : "center"}
        below={below}
        bubbleRef={bubbleRef}
        nextRef={nextRef}
        onNext={next}
        onClose={close}
      />
    ) : null;

  return (
    <div ref={rootRef} className="px-scene relative mt-10 rounded-2xl border border-border">
      <div className="px-sky pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden="true">
        <span className="px-cloud" style={{ top: "6%", animationDelay: "-12s" }} />
        <span className="px-cloud px-cloud-sm" style={{ top: "14%", animationDelay: "-40s" }} />
        <span className="px-cloud" style={{ top: "3%", animationDelay: "-70s" }} />
      </div>

      <div className="relative mx-auto max-w-3xl px-3 pt-16 sm:px-6 sm:pt-44">
        {/* Крыша: вывеска и хозяин здания */}
        <div className="relative aspect-[320/40]">
          <RoofArt />
          <Agent
            emp={officeHost}
            x={officeHost.baseX}
            walk={null}
            open={selectedId === officeHost.id}
            says={false}
            bottom="20%"
            order={0}
            onToggle={() => toggle(officeHost.id)}
            wrapRef={wrapRef}
          >
            {bubbleFor(officeHost, officeHost.baseX)}
          </Agent>
        </div>

        {/* Этажи в разрезе */}
        {officeFloors.map((floor, fi) => (
          <div key={floor.number} className="relative aspect-[320/80]">
            <FloorArt floor={floor} />
            <p className="px-plate">
              <span style={{ color: floor.accentHex }}>{floor.number}</span> {floor.title}
            </p>
            {floor.employees.map((emp, ei) => {
              const pos = motion[emp.id] ?? { x: emp.baseX, walk: null };
              return (
                <Agent
                  key={emp.id}
                  emp={emp}
                  x={pos.x}
                  walk={pos.walk}
                  dur={pos.dur}
                  open={selectedId === emp.id}
                  says={pillOwner === emp.id}
                  bottom="12.5%"
                  order={fi * 4 + ei + 1}
                  onToggle={() => toggle(emp.id)}
                  wrapRef={wrapRef}
                >
                  {bubbleFor(emp, pos.x)}
                </Agent>
              );
            })}
          </div>
        ))}

        {/* Лобби */}
        <div className="relative aspect-[320/52]">
          <LobbyArt />
        </div>
      </div>
      <div className="px-street h-4 rounded-b-2xl" aria-hidden="true" />

      <p className="relative border-t border-border bg-card px-4 py-3 text-center text-sm text-muted-foreground sm:rounded-b-2xl">
        Нажмите на любого сотрудника — он расскажет о себе. Кнопка «Дальше» проведёт по всем этажам.
      </p>

      {/* Полный текст для поисковиков и нейросетей без JavaScript */}
      <noscript>
        <div className="space-y-4 border-t bg-card p-5 text-sm">
          <p>
            <strong>{officeHost.name}</strong>: {officeHost.speech}
          </p>
          {officeFloors.map((floor) => (
            <div key={floor.number}>
              <p className="font-semibold">
                {floor.number} этаж — {floor.title}
              </p>
              <ul className="mt-1 list-disc pl-5">
                {floor.employees.map((e) => (
                  <li key={e.id}>
                    <strong>
                      {e.name} ({e.tool})
                    </strong>
                    : {e.speech}
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
