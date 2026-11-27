import type { ReactNode } from "react";
import type { OfficeEmployee } from "@/lib/office";
import { cn } from "@/lib/utils";

const SKINS = ["#f6d2b0", "#e8b48a", "#c98b5e"];
const OUT = "#2a2f3d";
const WHITE = "#fbfcfe";

function shade(hex: string, k = 0.28) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.min(255, Math.round(v * (1 - k))).toString(16).padStart(2, "0");
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

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

/** Статичный или анимированный пиксельный спрайт агента (используется на /agents/ и внутри здания). */
export function AgentSprite({ emp, className, staticOnly = false }: { emp: OfficeEmployee; className?: string; staticOnly?: boolean }) {
  const skin = SKINS[emp.skin] ?? SKINS[0];
  const pal: Record<string, string> = {
    o: OUT, h: emp.hair, H: shade(emp.hair, 0.35), s: skin, S: shade(skin, 0.15), r: "#f3a6a0",
    c: emp.accent, C: shade(emp.accent), w: WHITE, p: "#3b4a6b", b: OUT,
  };
  const body = applyHair(BODY, emp.hairStyle);
  return (
    <svg viewBox="0 0 16 24" shapeRendering="crispEdges" className={cn(!staticOnly && "px-sprite", "block h-auto w-full overflow-visible", className)} aria-hidden="true">
      <rect x="2" y="23" width="12" height="1" fill="#000" opacity="0.14" />
      <g className={staticOnly ? undefined : "px-legs-a"}><PixelRows rows={LEGS_A} y0={20} pal={pal} /></g>
      {!staticOnly && <g className="px-legs-b"><PixelRows rows={LEGS_B} y0={20} pal={pal} /></g>}
      <g className={staticOnly ? undefined : "px-upper"}>
        <PixelRows rows={body} y0={0} pal={pal} />
        <g className={staticOnly ? undefined : "px-eyes"} fill="#1d2230">
          <rect x="5" y="7" width="1" height="2" />
          <rect x="10" y="7" width="1" height="2" />
        </g>
        {emp.accessory === "glasses" && (
          <g>
            <rect x="4" y="6" width="3" height="3" fill="none" stroke={OUT} strokeWidth="0.7" />
            <rect x="9" y="6" width="3" height="3" fill="none" stroke={OUT} strokeWidth="0.7" />
            <rect x="7" y="7" width="2" height="1" fill={OUT} />
          </g>
        )}
        {emp.accessory === "headset" && (
          <g fill={OUT}>
            <rect x="2" y="5" width="1" height="4" />
            <rect x="13" y="5" width="1" height="4" />
            <rect x="3" y="9" width="3" height="1" />
          </g>
        )}
        {emp.accessory === "coffee" && (
          <g>
            <rect x="13" y="13" width="3" height="3" fill={WHITE} stroke={OUT} strokeWidth="0.5" />
            <rect x="14" y="14" width="1" height="1" fill="#8b5a2b" />
          </g>
        )}
        {emp.accessory === "laptop" && (
          <g>
            <rect x="11" y="13" width="5" height="3" fill="#4a5368" />
            <rect x="12" y="14" width="3" height="1" fill="#64b5f6" />
          </g>
        )}
      </g>
    </svg>
  );
}
