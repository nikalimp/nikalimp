import type { DsItem, DsType, Look } from "@/lib/design-systems";
import "./ds-cover.css";

// Обложки коллекций «Дизайн-системы» и «UI-библиотеки» — SVG без JavaScript, рисуются при сборке.
// Система: мини-интерфейс в её фирменных токенах (цвет, радиус, светлая или тёмная тема).
// Библиотека: сцена по главному типу (блоки — лендинг, анимации — движение, иконки — сетка…) в цветах её системы.
// Анимация только у библиотек анимаций: transform и opacity, при «меньше движения» стоит на месте.

const W = 320, H = 200;

function lum(hex: string) {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return 0.3;
  const n = parseInt(m[1], 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

type P = { bg: string; surface: string; fg: string; line: string; soft: string; p: string; on: string; a: string; r: number; dark: boolean };
function palette(l: Look): P {
  const dark = l.dark;
  return {
    bg: dark ? "#0c0c10" : "#ffffff", surface: dark ? "#18181d" : "#f5f5f7", fg: dark ? "#f4f4f5" : "#18181b",
    line: dark ? "#2e2e36" : "#e4e4e7", soft: dark ? "#3a3a44" : "#d4d4d8",
    p: l.primary, on: lum(l.primary) > 0.45 ? "#111111" : "#ffffff", a: l.accent, r: l.radius, dark,
  };
}
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const rr = (r: number, max: number) => Math.min(r, max);

/** Строка-«текст»: серая полоска */
const Line = ({ x, y, w, c, h = 5 }: { x: number; y: number; w: number; c: string; h?: number }) => <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={c} />;

function Frame({ c, children, label }: { c: P; children: React.ReactNode; label?: string }) {
  return (
    <>
      <rect x="18" y="16" width={W - 36} height={H - 16} rx={rr(c.r, 14)} fill={c.bg} stroke={c.line} />
      <circle cx="32" cy="29" r="3" fill={c.soft} /><circle cx="42" cy="29" r="3" fill={c.soft} /><circle cx="52" cy="29" r="3" fill={c.soft} />
      {label && <text x="160" y="32" textAnchor="middle" fontSize="8" fill={c.fg} opacity=".55">{label}</text>}
      <line x1="18" x2={W - 18} y1="40" y2="40" stroke={c.line} />
      {children}
    </>
  );
}

/* ——— Системы: три компоновки мини-интерфейса ——— */
function SystemApp({ c, name }: { c: P; name: string }) {
  const r = rr(c.r, 10);
  return (
    <Frame c={c} label={name}>
      <rect x="19" y="41" width="62" height={H - 26} fill={c.surface} />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x="26" y={50 + i * 17} width="48" height="11" rx={rr(c.r, 5)} fill={i === 1 ? c.p : "transparent"} opacity={i === 1 ? 0.16 : 1} />)}
      {[0, 1, 2, 3, 4].map((i) => <Line key={i} x={31} y={53 + i * 17} w={i === 1 ? 30 : 24 + (i % 2) * 10} c={i === 1 ? c.p : c.soft} />)}
      <Line x={94} y={52} w={90} c={c.fg} h={7} />
      <rect x="236" y="48" width="58" height="16" rx={r} fill={c.p} /><Line x={247} y={54} w={36} c={c.on} h={4} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={94 + i * 68} y="74" width="60" height="44" rx={r} fill={c.bg} stroke={c.line} />
          <Line x={101 + i * 68} y={81} w={26} c={c.soft} h={4} />
          <Line x={101 + i * 68} y={91} w={34} c={c.fg} h={7} />
          <path d={`M${101 + i * 68} 112 l9 -${4 + i * 2} l9 3 l9 -${7 - i} l9 2 l9 -6`} fill="none" stroke={i === 1 ? c.a : c.p} strokeWidth="1.6" />
        </g>
      ))}
      <rect x="94" y="126" width="196" height="54" rx={r} fill={c.surface} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => { const h = 10 + ((i * 37) % 30); return <rect key={i} x={102 + i * 17} y={174 - h} width="9" height={h} rx={rr(c.r, 3)} fill={i % 4 === 2 ? c.a : c.p} opacity={i % 4 === 2 ? 0.9 : 0.75} />; })}
    </Frame>
  );
}

function SystemForm({ c, name }: { c: P; name: string }) {
  const r = rr(c.r, 12);
  return (
    <>
      <circle cx="58" cy="44" r="46" fill={c.p} opacity=".14" /><circle cx="270" cy="168" r="54" fill={c.a} opacity=".14" />
      <rect x="78" y="18" width="164" height="166" rx={rr(c.r, 16)} fill={c.bg} stroke={c.line} />
      <text x="94" y="42" fontSize="12" fontWeight="600" fill={c.fg}>{name}</text>
      <Line x={94} y={50} w={96} c={c.soft} h={4} />
      {[0, 1].map((i) => (
        <g key={i}>
          <Line x={94} y={64 + i * 30} w={30} c={c.soft} h={4} />
          <rect x="94" y={71 + i * 30} width="132" height="17" rx={r} fill={c.bg} stroke={i === 0 ? c.p : c.line} strokeWidth={i === 0 ? 1.5 : 1} />
          <Line x={101} y={77 + i * 30} w={i === 0 ? 62 : 44} c={i === 0 ? c.fg : c.soft} h={4} />
        </g>
      ))}
      <rect x="94" y="130" width="10" height="10" rx={rr(c.r, 3)} fill={c.p} /><path d="M96.5 135 l2 2 l3.5 -4" stroke={c.on} strokeWidth="1.4" fill="none" />
      <Line x={110} y={133} w={48} c={c.soft} h={4} />
      <rect x="196" y="129" width="26" height="13" rx="6.5" fill={c.p} /><circle cx="215.5" cy="135.5" r="4.5" fill={c.on} />
      <rect x="94" y="152" width="132" height="20" rx={r} fill={c.p} /><Line x={136} y={160} w={48} c={c.on} h={4} />
    </>
  );
}

function SystemLanding({ c, name }: { c: P; name: string }) {
  const r = rr(c.r, 12);
  return (
    <Frame c={c}>
      <text x="32" y="58" fontSize="9" fontWeight="700" fill={c.fg}>{name}</text>
      {[0, 1, 2].map((i) => <Line key={i} x={176 + i * 30} y={53} w={22} c={c.soft} h={4} />)}
      <rect x="114" y="68" width="92" height="13" rx="6.5" fill={c.p} opacity=".14" /><Line x={124} y={72.5} w={72} c={c.p} h={4} />
      <Line x={74} y={89} w={172} c={c.fg} h={9} /><Line x={98} y={103} w={124} c={c.fg} h={9} />
      <Line x={110} y={119} w={100} c={c.soft} h={4} />
      <rect x="110" y="130" width="48" height="16" rx={r} fill={c.p} /><Line x={121} y={136} w={26} c={c.on} h={4} />
      <rect x="164" y="130" width="48" height="16" rx={r} fill="none" stroke={c.soft} /><Line x={175} y={136} w={26} c={c.fg} h={4} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={40 + i * 84} y="156" width="72" height="30" rx={r} fill={c.surface} />
          <circle cx={52 + i * 84} cy="171" r="6" fill={i === 1 ? c.a : c.p} opacity=".85" />
          <Line x={63 + i * 84} y={166} w={38} c={c.fg} h={4} /><Line x={63 + i * 84} y={174} w={28} c={c.soft} h={3} />
        </g>
      ))}
    </Frame>
  );
}


const short = (n: string, max = 18) => (n.length > max ? n.slice(0, max - 1) + "…" : n);

/** Блоки, вариант «первый экран»: название библиотеки как заголовок, картинка, логотипы */
function BlocksHero({ c, name }: { c: P; name: string }) {
  const r = rr(c.r, 10);
  return (
    <Frame c={c}>
      <rect x="30" y="50" width="16" height="7" rx="3.5" fill={c.p} />{[0, 1, 2].map((i) => <Line key={i} x={200 + i * 28} y={51} w={20} c={c.soft} h={4} />)}
      <rect x="32" y="70" width="70" height="12" rx="6" fill={c.p} opacity=".14" /><Line x={40} y={74} w={54} c={c.p} h={4} />
      <text x="32" y="104" fontSize="17" fontWeight="700" fill={c.fg} letterSpacing="-0.5">{short(name, 14)}</text>
      <Line x={32} y={114} w={120} c={c.soft} h={4} /><Line x={32} y={122} w={90} c={c.soft} h={4} />
      <rect x="32" y="134" width="50" height="16" rx={r} fill={c.p} /><Line x={43} y={140} w={28} c={c.on} h={4} />
      <rect x="88" y="134" width="50" height="16" rx={r} fill="none" stroke={c.soft} />
      <rect x="168" y="66" width="122" height="88" rx={r} fill={c.a} opacity=".22" />
      <circle cx="205" cy="102" r="20" fill={c.p} opacity=".75" /><rect x="222" y="96" width="52" height="40" rx={rr(c.r, 8)} fill={c.bg} opacity=".9" />
      <Line x={230} y={104} w={34} c={c.fg} h={4} /><Line x={230} y={113} w={24} c={c.soft} h={3} /><rect x="230" y="122" width="30" height="7" rx="3.5" fill={c.a} />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={40 + i * 52} y="168" width="36" height="8" rx="4" fill={c.soft} opacity=".7" />)}
    </Frame>
  );
}

/** Блоки, вариант «тарифы» */
function BlocksPricing({ c, name }: { c: P; name: string }) {
  const r = rr(c.r, 10);
  return (
    <>
      <text x="160" y="34" textAnchor="middle" fontSize="13" fontWeight="700" fill={c.fg}>{short(name, 22)}</text>
      <Line x={110} y={42} w={100} c={c.soft} h={4} />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${28 + i * 90} ${i === 1 ? 54 : 62})`}>
          <rect width="82" height={i === 1 ? 130 : 118} rx={r} fill={i === 1 ? c.p : c.bg} stroke={i === 1 ? "none" : c.line} />
          <Line x={10} y={12} w={30} c={i === 1 ? c.on : c.soft} h={4} />
          <text x="10" y="40" fontSize="16" fontWeight="700" fill={i === 1 ? c.on : c.fg}>${[0, 49, 149][i]}</text>
          {[0, 1, 2, 3].map((k) => <g key={k}><circle cx="13" cy={56 + k * 12} r="2.5" fill={i === 1 ? c.on : c.a} /><Line x={20} y={54 + k * 12} w={40 + ((k * 13) % 18)} c={i === 1 ? c.on : c.soft} h={3.5} /></g>)}
          <rect x="10" y={i === 1 ? 108 : 96} width="62" height="14" rx={rr(c.r, 7)} fill={i === 1 ? c.on : c.p} opacity={i === 1 ? 0.95 : 1} />
        </g>
      ))}
    </>
  );
}

/** Анимации, вариант «кинетический текст» */
function AnimText({ c, name }: { c: P; name: string }) {
  const word = short(name.toUpperCase(), 14);
  return (
    <g className="dsc-anim">
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} className="dsc-orb" x={-20 + i * 72} y="0" width="34" height="200" fill={i % 2 ? c.a : c.p} opacity=".12" transform={`skewX(-18)`} style={{ animationDelay: `${-i * 1.3}s` }} />)}
      <g className="dsc-marquee-w">{[0, 1, 2, 3].map((i) => <text key={i} x={i * 240 - 20} y="62" fontSize="17" fontWeight="800" fill="none" stroke={c.soft} strokeWidth="1">{word}</text>)}</g>
      <text x="160" y="112" textAnchor="middle" fontSize="26" fontWeight="800" fill={c.fg} letterSpacing="-1" className="dsc-pulse">{word}</text>
      <rect x="110" y="124" width="100" height="4" rx="2" fill={c.p} /><rect x="110" y="124" width="46" height="4" rx="2" fill={c.a} className="dsc-orb" />
      <g className="dsc-marquee-w" style={{ animationDirection: "reverse" }}>{[0, 1, 2, 3].map((i) => <text key={i} x={i * 240 - 140} y="168" fontSize="17" fontWeight="800" fill={c.p} opacity=".35">{word}</text>)}</g>
    </g>
  );
}

/** Анимации, вариант «сетка с волной» */
function AnimGrid({ c, name }: { c: P; name: string }) {
  return (
    <g className="dsc-anim">
      {Array.from({ length: 60 }, (_, i) => { const x = 22 + (i % 12) * 24, y = 26 + Math.floor(i / 12) * 32; return <rect key={i} className="dsc-pulse" x={x} y={y} width="16" height="16" rx={rr(c.r, 5)} fill={(i + Math.floor(i / 12)) % 5 === 0 ? c.a : c.p} opacity=".5" style={{ animationDelay: `${((i % 12) + Math.floor(i / 12)) * 0.12}s` }} />; })}
      <rect x="84" y="82" width="152" height="36" rx={rr(c.r, 18)} fill={c.bg} stroke={c.line} />
      <text x="160" y="105" textAnchor="middle" fontSize="13" fontWeight="700" fill={c.fg}>{short(name, 20)}</text>
    </g>
  );
}

/** Компоненты, вариант «диалог поверх списка» */
function ComponentsDialog({ c, name }: { c: P; name: string }) {
  const r = rr(c.r, 10);
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => <g key={i}><rect x="30" y={22 + i * 34} width="260" height="26" rx={r} fill={c.surface} /><circle cx="45" cy={35 + i * 34} r="6" fill={c.soft} /><Line x={58} y={33 + i * 34} w={90} c={c.soft} h={4} /></g>)}
      <rect width={W} height={H} fill={c.dark ? "#000" : "#18181b"} opacity=".35" />
      <rect x="70" y="40" width="180" height="122" rx={rr(c.r, 14)} fill={c.bg} stroke={c.line} />
      <text x="86" y="64" fontSize="11" fontWeight="700" fill={c.fg}>{short(name, 22)}</text>
      <Line x={86} y={72} w={120} c={c.soft} h={4} />
      <rect x="86" y="84" width="148" height="18" rx={r} fill={c.bg} stroke={c.p} strokeWidth="1.5" /><Line x={94} y={91} w={60} c={c.fg} h={4} />
      <rect x="86" y="110" width="10" height="10" rx={rr(c.r, 3)} fill={c.p} /><Line x={102} y={113} w={70} c={c.soft} h={4} />
      <rect x="140" y="134" width="44" height="16" rx={r} fill="none" stroke={c.soft} /><rect x="190" y="134" width="44" height="16" rx={r} fill={c.p} /><Line x={200} y={140} w={24} c={c.on} h={4} />
    </>
  );
}


/** 3D: каркасная сфера с орбитой — для библиотек на Three.js и WebGL */
function Anim3D({ c, name }: { c: P; name: string }) {
  return (
    <g className="dsc-anim">
      <circle cx="160" cy="92" r="70" fill={c.p} opacity=".16" />
      <g className="dsc-spin" style={{ transformOrigin: "160px 92px", animationDuration: "40s" }} fill="none" stroke={c.p} strokeWidth="1.2">
        {[0, 1, 2, 3, 4, 5].map((i) => <ellipse key={`m${i}`} cx="160" cy="92" rx={Math.abs(Math.cos((i * Math.PI) / 6)) * 56 + 0.5} ry="56" transform={`rotate(${i * 12 - 30} 160 92)`} opacity=".7" />)}
        {[-36, -18, 0, 18, 36].map((y) => <ellipse key={`p${y}`} cx="160" cy={92 + y} rx={Math.sqrt(56 * 56 - y * y)} ry={Math.sqrt(56 * 56 - y * y) * 0.22} opacity=".55" />)}
      </g>
      <ellipse cx="160" cy="92" rx="96" ry="22" fill="none" stroke={c.a} strokeWidth="1.6" transform="rotate(-14 160 92)" />
      <circle className="dsc-orb" cx="250" cy="72" r="7" fill={c.a} />
      <rect x="96" y="164" width="128" height="22" rx={rr(c.r, 11)} fill={c.bg} stroke={c.line} />
      <text x="160" y="179" textAnchor="middle" fontSize="10" fontWeight="700" fill={c.fg}>{short(name, 22)}</text>
    </g>
  );
}

/* ——— Библиотеки: сцена по главному типу ——— */
function LibScene({ type, c, name, seed, three }: { type: DsType; c: P; name: string; seed: number; three?: boolean }) {
  const r = rr(c.r, 10);
  if (three && (type === "animations" || type === "components")) return <Anim3D c={c} name={name} />;
  if (type === "blocks" && seed % 3 === 1) return <BlocksHero c={c} name={name} />;
  if (type === "blocks" && seed % 3 === 2) return <BlocksPricing c={c} name={name} />;
  if (type === "animations" && seed % 3 === 1) return <AnimText c={c} name={name} />;
  if (type === "animations" && seed % 3 === 2) return <AnimGrid c={c} name={name} />;
  if ((type === "components" || !["blocks", "animations", "templates", "charts", "icons", "themes", "figma", "tool", "directory", "primitives"].includes(type)) && seed % 2 === 1) return <ComponentsDialog c={c} name={name} />;
  switch (type) {
    case "blocks":
      return (
        <>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${30 + i * 92} ${28 + (i % 2) * 14})`}>
              <rect width="80" height="150" rx={r} fill={c.bg} stroke={c.line} />
              <rect x="6" y="6" width="68" height={i === 1 ? 40 : 30} rx={rr(c.r, 6)} fill={i === 1 ? c.p : c.surface} opacity={i === 1 ? 0.9 : 1} />
              <Line x={14} y={i === 1 ? 20 : 16} w={44} c={i === 1 ? c.on : c.fg} h={5} />
              <Line x={14} y={i === 1 ? 30 : 25} w={30} c={i === 1 ? c.on : c.soft} h={3} />
              {i === 0 && [0, 1, 2].map((k) => <g key={k}><circle cx="16" cy={52 + k * 20} r="5" fill={k === 1 ? c.a : c.p} opacity=".8" /><Line x={26} y={49 + k * 20} w={40} c={c.fg} h={4} /><Line x={26} y={56 + k * 20} w={28} c={c.soft} h={3} /></g>)}
              {i === 1 && [0, 1].map((k) => <g key={k}><rect x={6 + k * 35} y="54" width="33" height="58" rx={rr(c.r, 6)} fill={c.surface} stroke={k ? c.p : "none"} /><Line x={12 + k * 35} y={62} w={16} c={c.soft} h={3} /><Line x={12 + k * 35} y={70} w={20} c={c.fg} h={7} /><rect x={11 + k * 35} y="98" width="23" height="8" rx={rr(c.r, 4)} fill={k ? c.p : c.soft} /></g>)}
              {i === 1 && <><Line x={8} y={122} w={64} c={c.soft} h={3} /><Line x={8} y={130} w={50} c={c.soft} h={3} /></>}
              {i === 2 && <><rect x="6" y="42" width="68" height="40" rx={rr(c.r, 6)} fill={c.a} opacity=".18" />{[0, 1, 2, 3].map((k) => <Line key={k} x={8} y={92 + k * 10} w={k % 2 ? 46 : 62} c={c.soft} h={3} />)}<rect x="8" y="132" width="34" height="10" rx={rr(c.r, 5)} fill={c.p} /></>}
            </g>
          ))}
        </>
      );
    case "animations":
      return (
        <g className="dsc-anim">
          <circle className="dsc-orb" cx="110" cy="96" r="56" fill={c.p} opacity=".55" />
          <circle className="dsc-orb dsc-orb2" cx="206" cy="108" r="48" fill={c.a} opacity=".55" />
          <g className="dsc-spin" style={{ transformOrigin: "160px 100px" }}>
            {Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return <circle key={i} cx={160 + 62 * Math.cos(a)} cy={100 + 62 * Math.sin(a)} r={i % 3 ? 2.2 : 3.5} fill={c.fg} opacity=".55" />; })}
          </g>
          <rect x="96" y="80" width="128" height="40" rx={rr(c.r, 20)} fill={c.bg} opacity=".9" stroke={c.line} />
          <text x="160" y="105" textAnchor="middle" fontSize="13" fontWeight="700" fill={c.fg} className="dsc-pulse">{name.length > 16 ? name.slice(0, 15) + "…" : name}</text>
          <g className="dsc-marquee">
            {Array.from({ length: 8 }, (_, i) => <rect key={i} x={i * 80 - 10} y="168" width="64" height="12" rx="6" fill={i % 2 ? c.p : c.a} opacity=".35" />)}
          </g>
        </g>
      );
    case "templates":
    case "charts": {
      const pts = Array.from({ length: 9 }, (_, i) => [42 + i * 30, 150 - (20 + ((i * 53 + seed) % 70))]);
      const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ");
      return (
        <Frame c={c} label={type === "templates" ? name : undefined}>
          {type === "templates" && [0, 1, 2].map((i) => <g key={i}><rect x={32 + i * 88} y="50" width="80" height="34" rx={r} fill={c.surface} /><Line x={40 + i * 88} y={57} w={28} c={c.soft} h={4} /><Line x={40 + i * 88} y={67} w={40} c={c.fg} h={8} /></g>)}
          {type === "charts" && [0, 1, 2, 3].map((i) => <Line key={i} x={36} y={58 + i * 30} w={250} c={c.line} h={1} />)}
          <path d={`${d} L282 172 L42 172 Z`} fill={c.p} opacity=".14" />
          <path d={d} fill="none" stroke={c.p} strokeWidth="2.2" strokeLinejoin="round" />
          <path d={pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1] + 18 + (i % 3) * 6}`).join(" ")} fill="none" stroke={c.a} strokeWidth="1.6" strokeDasharray="4 3" />
          {pts.filter((_, i) => i % 2 === 0).map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={c.bg} stroke={c.p} strokeWidth="1.6" />)}
        </Frame>
      );
    }
    case "icons": {
      const glyph = (i: number, x: number, y: number) => {
        const k = (i + seed) % 8, s = { fill: "none", stroke: i % 5 === 0 ? c.p : c.fg, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
        return [
          <circle key="a" cx={x} cy={y} r="8" {...s} />, <rect key="b" x={x - 8} y={y - 8} width="16" height="16" rx="4" {...s} />,
          <path key="c" d={`M${x - 8} ${y + 6} L${x} ${y - 8} L${x + 8} ${y + 6} Z`} {...s} />, <path key="d" d={`M${x - 8} ${y} L${x - 2} ${y + 6} L${x + 8} ${y - 6}`} {...s} />,
          <path key="e" d={`M${x} ${y - 8} V${y + 8} M${x - 8} ${y} H${x + 8}`} {...s} />, <path key="f" d={`M${x - 7} ${y - 4} h14 M${x - 7} ${y + 1} h14 M${x - 7} ${y + 6} h9`} {...s} />,
          <path key="g" d={`M${x} ${y + 8} C${x - 12} ${y - 2} ${x - 4} ${y - 12} ${x} ${y - 4} C${x + 4} ${y - 12} ${x + 12} ${y - 2} ${x} ${y + 8} Z`} {...s} />,
          <path key="h" d={`M${x - 8} ${y + 7} L${x - 8} ${y - 3} L${x} ${y - 9} L${x + 8} ${y - 3} L${x + 8} ${y + 7} Z`} {...s} />,
        ][k];
      };
      return <>{Array.from({ length: 24 }, (_, i) => { const x = 48 + (i % 8) * 32, y = 52 + Math.floor(i / 8) * 46; return <g key={i}><rect x={x - 14} y={y - 14} width="28" height="28" rx={rr(c.r, 8)} fill={i % 5 === 0 ? c.p : c.surface} opacity={i % 5 === 0 ? 0.14 : 1} />{glyph(i, x, y)}</g>; })}</>;
    }
    case "themes":
      return (
        <>
          {[c.p, c.a, c.fg, c.soft, c.surface].map((col, i) => <rect key={i} x={36 + i * 50} y="30" width="42" height="64" rx={rr(c.r, 10)} fill={col} stroke={c.line} />)}
          <text x="36" y="160" fontSize="56" fontWeight="700" fill={c.fg}>Aa</text>
          {[0, 1, 2].map((i) => <rect key={i} x={140 + i * 52} y="118" width="44" height="16" rx={rr(c.r, 8) * (i / 2 + 0.2)} fill={i === 1 ? c.p : "none"} stroke={i === 1 ? "none" : c.soft} />)}
          <Line x={140} y={148} w={148} c={c.soft} h={4} /><Line x={140} y={158} w={110} c={c.soft} h={4} />
        </>
      );
    case "figma":
      return (
        <>
          <rect width={W} height={H} fill={c.dark ? "#1e1e1e" : "#e9e9ec"} />
          {[0, 1, 2].map((i) => <g key={i}><text x={30 + i * 92} y="36" fontSize="7" fill={c.fg} opacity=".5">Frame {i + 1}</text><rect x={30 + i * 92} y="42" width="80" height="128" rx="2" fill={c.bg} /><rect x={36 + i * 92} y="50" width="68" height="24" rx={rr(c.r, 6)} fill={i === 1 ? c.p : c.surface} /><Line x={36 + i * 92} y={82} w={50} c={c.soft} h={4} /><Line x={36 + i * 92} y={92} w={60} c={c.soft} h={4} /><rect x={36 + i * 92} y="148" width="40" height="12" rx={rr(c.r, 6)} fill={c.p} /></g>)}
          <rect x="120" y="40" width="84" height="132" fill="none" stroke="#0d99ff" strokeWidth="1.2" />
          {[[120, 40], [204, 40], [120, 172], [204, 172]].map(([x, y], i) => <rect key={i} x={x - 3} y={y - 3} width="6" height="6" fill="#fff" stroke="#0d99ff" />)}
          <path d="M232 128 l0 22 l6 -6 l5 10 l4 -2 l-5 -10 l8 -1 z" fill={c.a} stroke="#fff" />
        </>
      );
    case "tool":
      return (
        <>
          <rect x="24" y="26" width="272" height="150" rx={rr(c.r, 12)} fill="#0f1115" />
          <circle cx="40" cy="40" r="3.5" fill="#ff5f57" /><circle cx="51" cy="40" r="3.5" fill="#febc2e" /><circle cx="62" cy="40" r="3.5" fill="#28c840" />
          <text x="40" y="72" fontSize="10" fontFamily="ui-monospace,monospace" fill="#e4e4e7"><tspan fill={c.a}>$</tspan> npx shadcn add</text>
          <text x="40" y="90" fontSize="10" fontFamily="ui-monospace,monospace" fill="#a1a1aa">✔ Resolving registry</text>
          <text x="40" y="108" fontSize="10" fontFamily="ui-monospace,monospace" fill="#a1a1aa">✔ Writing components</text>
          <rect x="40" y="124" width="120" height="8" rx="4" fill="#27272a" /><rect x="40" y="124" width="84" height="8" rx="4" fill={c.p} />
          <rect x="40" y="146" width="7" height="12" fill="#e4e4e7" className="dsc-blink" />
        </>
      );
    case "directory":
      return (
        <>
          <rect x="40" y="22" width="240" height="22" rx={rr(c.r, 11)} fill={c.bg} stroke={c.line} /><circle cx="54" cy="33" r="4.5" fill="none" stroke={c.soft} strokeWidth="1.6" /><Line x={64} y={31} w={70} c={c.soft} h={4} />
          {[0, 1, 2, 3, 4].map((i) => <g key={i}><rect x="40" y={54 + i * 27} width="240" height="22" rx={rr(c.r, 8)} fill={i === 1 ? c.surface : "transparent"} /><rect x="48" y={58 + i * 27} width="14" height="14" rx={rr(c.r, 4)} fill={[c.p, c.a, c.fg, c.p, c.a][i]} opacity=".85" /><Line x={70} y={60 + i * 27} w={60 + ((i * 29) % 50)} c={c.fg} h={4} /><Line x={70} y={67 + i * 27} w={40 + ((i * 17) % 40)} c={c.soft} h={3} /><Line x={246} y={62 + i * 27} w={26} c={c.soft} h={4} /></g>)}
        </>
      );
    case "primitives":
      return (
        <g fill="none" stroke={c.fg} strokeDasharray="4 3" opacity=".75">
          <rect x="40" y="36" width="110" height="26" rx={r} /><rect x="40" y="74" width="110" height="80" rx={r} />
          {[0, 1, 2].map((i) => <rect key={i} x="50" y={86 + i * 20} width="90" height="12" rx="3" />)}
          <rect x="176" y="36" width="104" height="60" rx={r} /><circle cx="196" cy="128" r="12" /><rect x="220" y="118" width="40" height="20" rx="10" stroke={c.p} strokeDasharray="none" strokeWidth="1.6" /><circle cx="250" cy="128" r="6" fill={c.p} stroke="none" />
        </g>
      );
    default: {
      // components: витрина элементов
      return (
        <>
          <rect x="30" y="30" width="80" height="22" rx={r} fill={c.p} /><Line x={46} y={39} w={48} c={c.on} h={4} />
          <rect x="120" y="30" width="80" height="22" rx={r} fill="none" stroke={c.soft} /><Line x={136} y={39} w={48} c={c.fg} h={4} />
          <rect x="212" y="33" width="34" height="17" rx="8.5" fill={c.p} /><circle cx="237" cy="41.5" r="6" fill={c.on} />
          <rect x="254" y="33" width="34" height="17" rx="8.5" fill={c.soft} /><circle cx="263" cy="41.5" r="6" fill={c.bg} />
          <rect x="30" y="66" width="170" height="22" rx={r} fill={c.bg} stroke={c.p} strokeWidth="1.5" /><Line x={40} y={75} w={70} c={c.fg} h={4} /><rect x="111" y="71" width="1.5" height="12" fill={c.p} className="dsc-blink" />
          {[0, 1, 2].map((i) => <circle key={i} cx={222 + i * 22} cy="77" r="10" fill={[c.p, c.a, c.soft][i]} stroke={c.bg} strokeWidth="2" />)}
          <Line x={30} y={106} w={170} c={c.line} h={4} /><rect x="30" y="106" width="104" height="4" rx="2" fill={c.p} /><circle cx="134" cy="108" r="7" fill={c.bg} stroke={c.p} strokeWidth="2" />
          {[0, 1, 2].map((i) => <rect key={i} x={212 + i * 26} y="100" width="22" height="16" rx={rr(c.r, 8)} fill={i === 0 ? c.a : c.surface} opacity={i === 0 ? 0.25 : 1} />)}
          <rect x="30" y="128" width="258" height="50" rx={r} fill={c.bg} stroke={c.line} />
          <circle cx="50" cy="153" r="11" fill={c.a} opacity=".6" /><Line x={70} y={144} w={90} c={c.fg} h={5} /><Line x={70} y={155} w={140} c={c.soft} h={4} />
          <rect x="230" y="145" width="46" height="16" rx={r} fill={c.p} opacity=".14" /><Line x={240} y={151} w={26} c={c.p} h={4} />
        </>
      );
    }
  }
}

export function DsCover({ item, className = "", type }: { item: DsItem; className?: string; type?: DsType }) {
  const c = palette(item.look);
  const seed = hash(item.slug);
  const t = type ?? item.types[0] ?? "components";
  const darkScene = item.kind === "library" && t === "tool";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`ds-cover block aspect-[16/10] w-full ${className}`} role="img" aria-label={`Обложка: ${item.name}`} fontFamily="Inter Variable, Inter, ui-sans-serif, sans-serif">
      <rect width={W} height={H} fill={darkScene ? "#1b1d23" : c.dark ? "#101014" : "#fafafa"} />
      <rect width={W} height={H} fill={`url(#g-${item.slug})`} />
      <defs>
        <radialGradient id={`g-${item.slug}`} cx={seed % 2 ? "15%" : "85%"} cy="0%" r="90%">
          <stop offset="0" stopColor={c.p} stopOpacity={c.dark ? 0.35 : 0.22} />
          <stop offset="1" stopColor={c.p} stopOpacity="0" />
        </radialGradient>
      </defs>
      {item.kind === "system"
        ? [SystemApp, SystemForm, SystemLanding][seed % 3]({ c, name: item.name })
        : <LibScene type={t} c={c} name={item.name} seed={seed} three={/three|webgl|3d/i.test(`${item.styling ?? ""} ${item.short}`)} />}
    </svg>
  );
}
