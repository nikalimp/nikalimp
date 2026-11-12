"use client";

import { useEffect, useRef } from "react";
import "./style-cover.css";

// Живая обложка дизайн-направления. Разметка сцены рендерится на сервере (видна без JavaScript),
// canvas-сцены и мелкая анимация (табло, счётчики) оживают в браузере.
// Вне экрана анимация на паузе (data-off), при «меньше движения» — один статичный кадр.

const gear = (cx: number, cy: number, r: number, n: number, c: string) => {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const a = (i * Math.PI) / n, rr = i % 2 ? r : r * 1.18;
    d += (i ? "L" : "M") + (cx + rr * Math.cos(a)).toFixed(1) + " " + (cy + rr * Math.sin(a)).toFixed(1);
  }
  return `<g class="g ${c}"><path class="draw" d="${d}Z"/><circle class="draw" cx="${cx}" cy="${cy}" r="${(r * 0.35).toFixed(1)}"/></g>`;
};
const ISO = [30, 14, 22, 8, 26, 18, 34, 10, 20, 28, 12, 24, 16, 30, 6, 22, 10, 28, 14, 20, 26, 8, 18, 32, 12];
const decoRays = () => {
  let s = "";
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI + (i * Math.PI) / 16;
    s += `<line class="ray" style="animation-delay:${(i * 0.05).toFixed(2)}s" x1="100" y1="128" x2="${(100 + 90 * Math.cos(a)).toFixed(1)}" y2="${(128 + 90 * Math.sin(a)).toFixed(1)}"/>`;
  }
  [30, 50, 70].forEach((r, i) => (s += `<path class="ray" style="animation-delay:${(0.4 + i * 0.2).toFixed(1)}s" d="M${100 - r} 128 A${r} ${r} 0 0 1 ${100 + r} 128"/>`));
  return s;
};

const MARKUP: Record<string, string> = {
  particles: "<canvas></canvas>",
  holography: "<i></i>",
  morphing: `<svg viewBox="0 0 200 150" aria-hidden="true"><defs><filter id="sc-goo"><feGaussianBlur stdDeviation="7"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 22 -9"/></filter><linearGradient id="sc-ir" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ffd6f0"/><stop offset=".5" stop-color="#b9c6ff"/><stop offset="1" stop-color="#9ff0d8"/></linearGradient></defs><g filter="url(#sc-goo)" fill="url(#sc-ir)"><circle cx="72" cy="75" r="28"/><circle cx="130" cy="75" r="22"/></g></svg>`,
  neon: `<div class="sq" style="width:78%;height:72%"></div><div class="sq c" style="width:62%;height:56%;animation-delay:-.6s"></div><div class="sq" style="width:46%;height:40%;animation-delay:-1.2s"></div><div class="sq c" style="width:30%;height:24%;animation-delay:-1.8s"></div><b>NEON</b>`,
  wireframe: "<canvas></canvas>",
  glassmorphism: `<div class="in"><div class="w">Midnight Glass<div class="bar"><i></i></div></div><div class="row"><div class="w"><b>24°</b>ясно</div><div class="w"><b data-steps>8 110</b>шагов</div></div></div>`,
  "kinetic-typography": `<div class="track"><p>MOVE</p><p class="on">MOVE</p><p>MOVE</p></div>`,
  isometric: `<div class="plane">${ISO.map((t, i) => `<i class="c" style="--t:${(t / 2.75).toFixed(1)}cqw;animation-delay:-${((i % 5) * 0.4).toFixed(1)}s"></i>`).join("")}</div>`,
  claymorphism: `<div class="s ball"></div><div class="s cube"></div><div class="s ring"></div>`,
  "ascii-art": "<canvas></canvas>",
  gradient: "<i></i><i></i><i></i>",
  comic: `<div class="star"><b>БАХ!</b></div>`,
  "split-flap": `<div class="rows" data-flap>${["ДИЗ", "АЙН"].map((r) => `<div class="r">${[...r].map((l) => `<div class="l">${l}</div>`).join("")}</div>`).join("")}</div><small>DEPARTURES · ON TIME</small>`,
  "retro-vhs": `<div class="sun"></div><div class="floor"></div><div class="scan"></div><div class="ui"><span>▶ PLAY</span><b>● REC</b></div>`,
  halftone: `<div class="b red"></div><div class="b blue"></div>`,
  bauhaus: `<div class="sh line"></div><div class="sh lamp"></div><div class="sh circ"></div><div class="sh sqr"></div><div class="sh tri"></div><small>BAUHAUS</small>`,
  "pixel-art": `<canvas width="64" height="48"></canvas><span class="coins">COINS ×01</span>`,
  blueprint: `<svg viewBox="0 0 200 150" fill="none" stroke="#fff" stroke-width="1.4" aria-hidden="true">${gear(78, 62, 26, 10, "")}${gear(124, 84, 16, 8, "r")}${gear(68, 108, 13, 7, "r")}<text x="10" y="142" fill="#fff" stroke="none" font-size="6" font-family="monospace">DWG A-01 · GEARS</text><text x="156" y="142" fill="#fff" stroke="none" font-size="6" font-family="monospace">SCALE 1:2</text></svg>`,
  "art-deco": `<svg viewBox="0 0 200 150" fill="none" stroke="#d4af37" stroke-width=".9" aria-hidden="true">${decoRays()}<text x="100" y="30" text-anchor="middle" fill="#d4af37" stroke="none" font-size="16" font-family="Inter,sans-serif" font-weight="700" letter-spacing="8">DECO</text></svg>`,
  neobrutalism: `<div class="in"><div class="box">SHIP IT.<i></i></div><div class="row"><div class="btn">98% FASTER</div><div class="btn y">★ CLICK</div></div></div><div class="tape"><span>${"SHIP IT ✦ ".repeat(16)}</span></div>`,
};

type Loop = { stop: () => void };
type Scene = (root: HTMLElement, live: () => boolean) => Loop;

/** Запускает кадр за кадром, пока сцена на экране; при «меньше движения» рисует один кадр. */
function loop(frame: (t: number) => void, live: () => boolean, fps = 60): Loop {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf = 0, t = 0, last = 0, on = true;
  const tick = (now: number) => {
    if (!on) return;
    if (live() && now - last >= 1000 / fps) { last = now; frame(t++); }
    raf = requestAnimationFrame(tick);
  };
  if (still) frame(120); else raf = requestAnimationFrame(tick);
  return { stop: () => { on = false; cancelAnimationFrame(raf); } };
}
const fit = (c: HTMLCanvasElement) => {
  const d = Math.min(window.devicePixelRatio || 1, 2);
  c.width = Math.max(1, c.clientWidth * d); c.height = Math.max(1, c.clientHeight * d);
};

const SCENES: Record<string, Scene> = {
  particles: (root, live) => {
    const c = root.querySelector("canvas")!, x = c.getContext("2d")!; fit(c);
    const P = Array.from({ length: 900 }, () => ({ a: Math.random() * Math.PI * 2, r: Math.random(), s: 0.2 + Math.random() }));
    return loop((n) => {
      const t = n * 0.008, cx = c.width / 2, cy = c.height / 2, R = Math.min(cx, cy) * 0.95, dot = Math.max(1.2, c.width / 340);
      x.fillStyle = "rgba(18,6,40,.35)"; x.fillRect(0, 0, c.width, c.height);
      for (const p of P) {
        const arm = Math.round(p.a / (Math.PI / 4)) * (Math.PI / 4), k = (Math.sin(t * 1.5) + 1) / 2;
        const ang = arm + (p.a - arm) * (1 - k * 0.85) + t * 0.4 + p.r * 1.2, rr = p.r * R * (0.6 + 0.4 * Math.sin(t + p.s * 3));
        x.fillStyle = `hsla(${280 - p.r * 40},90%,${65 + p.r * 20}%,${0.5 + p.s * 0.3})`;
        x.fillRect(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, dot, dot);
      }
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, R * 0.2);
      g.addColorStop(0, "rgba(255,220,255,.9)"); g.addColorStop(1, "transparent");
      x.fillStyle = g; x.fillRect(cx - R * 0.2, cy - R * 0.2, R * 0.4, R * 0.4);
    }, live);
  },
  wireframe: (root, live) => {
    const c = root.querySelector("canvas")!, x = c.getContext("2d")!; fit(c);
    const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
    const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    return loop((n) => {
      const t = n * 0.012, W = c.width, H = c.height, lw = W / 220;
      const P = (X: number, Y: number, Z: number): [number, number] => { const f = (W * 0.9) / (Z + 4); return [W / 2 + X * f, H * 0.55 + Y * f]; };
      const ln = (a: [number, number], b: [number, number]) => { x.beginPath(); x.moveTo(...a); x.lineTo(...b); x.stroke(); };
      x.fillStyle = "#f7f6f2"; x.fillRect(0, 0, W, H);
      x.strokeStyle = "rgba(47,79,216,.35)"; x.lineWidth = lw;
      for (let i = -6; i <= 6; i++) ln(P(i, 1.2, -1), P(i, 1.2, 8));
      for (let z = 0; z < 9; z++) { const zz = z - ((t * 2) % 1); ln(P(-6, 1.2, zz), P(6, 1.2, zz)); }
      x.strokeStyle = "#2f4fd8"; x.lineWidth = lw * 1.6;
      for (const [ox, oy, s, sp] of [[-1.6, 0.7, 0.5, 1], [1.5, 0.5, 0.7, -1], [0, -0.2, 0.8, 1.4]]) {
        const ca = Math.cos(t * sp), sa = Math.sin(t * sp), cb = Math.cos(t * 0.7), sb = Math.sin(t * 0.7);
        const pts = V.map(([X, Y, Z]) => { const x1 = X * ca - Z * sa, z1 = X * sa + Z * ca, y1 = Y * cb - z1 * sb, z2 = Y * sb + z1 * cb; return P(ox + x1 * s * 0.5, oy + y1 * s * 0.5, z2 * s * 0.5 + 1.5); });
        E.forEach(([a, b]) => ln(pts[a], pts[b]));
      }
    }, live);
  },
  "ascii-art": (root, live) => {
    const c = root.querySelector("canvas")!, x = c.getContext("2d")!; fit(c);
    const W = 46, H = 30, ch = ".,-~:;=!*#$@";
    return loop((n) => {
      const A = n * 0.04, B = n * 0.02, b = Array(W * H).fill(" "), z = Array(W * H).fill(0);
      for (let j = 0; j < 6.28; j += 0.07) for (let i = 0; i < 6.28; i += 0.02) {
        const sn = Math.sin(i), cj = Math.cos(j), sA = Math.sin(A), sj = Math.sin(j), cA = Math.cos(A), h = cj + 2, D = 1 / (sn * h * sA + sj * cA + 5);
        const cl = Math.cos(i), cB = Math.cos(B), sB = Math.sin(B), t = sn * h * cA - sj * sA;
        const px = 0 | (W / 2 + W * 0.42 * D * (cl * h * cB - t * sB) * 1.6), py = 0 | (H / 2 + H * 0.75 * D * (cl * h * sB + t * cB)), o = px + W * py;
        const N = 0 | (8 * ((sj * sA - sn * cj * cA) * cB - sn * cj * sA - sj * cA - cl * cj * sB));
        if (py < H && py >= 0 && px >= 0 && px < W && D > z[o]) { z[o] = D; b[o] = ch[N > 0 ? N : 0]; }
      }
      x.fillStyle = "#050805"; x.fillRect(0, 0, c.width, c.height);
      x.font = `${c.height / H}px ui-monospace, monospace`; x.fillStyle = "#3cff6b";
      const cw = c.width / W;
      for (let k = 0; k < b.length; k++) if (b[k] !== " ") x.fillText(b[k], (k % W) * cw, (Math.floor(k / W) + 1) * (c.height / H));
    }, live, 30);
  },
  "pixel-art": (root, live) => {
    const c = root.querySelector("canvas")!, x = c.getContext("2d")!, coins = root.querySelector(".coins")!;
    const sky = ["#2b1b4e", "#45226b", "#6d2e7f", "#b14a7c", "#ef7a5b", "#ffb35c"];
    return loop((t) => {
      sky.forEach((s, i) => { x.fillStyle = s; x.fillRect(0, i * 5, 64, 5); });
      x.fillStyle = "#ffe066";
      for (let y = -7; y <= 7; y++) for (let X = -7; X <= 7; X++) if (X * X + y * y <= 49 && y < 3) x.fillRect(32 + X, 24 + y, 1, 1);
      x.fillStyle = "#3a2559";
      for (let X = 0; X < 64; X++) { const h = 3 + Math.round(2 * Math.sin(X / 5) + Math.sin(X / 2.3)); x.fillRect(X, 28 - h, 1, h + 4); }
      x.fillStyle = "#2e8b57"; x.fillRect(0, 32, 64, 16);
      x.fillStyle = "#1f6b40"; for (let X = 0; X < 64; X += 4) x.fillRect((X + t) % 64, 34, 2, 1);
      const px = ((t * 0.6) % 70) - 4;
      x.fillStyle = "#e74c3c"; x.fillRect(px | 0, 28, 3, 3); x.fillStyle = "#fff"; x.fillRect((px | 0) + 1, 28, 1, 1);
      coins.textContent = "COINS ×0" + (1 + ((t / 40) | 0) % 9);
    }, live, 12);
  },
  "split-flap": (root, live) => {
    const el = root.querySelector("[data-flap]")!;
    const words = [["ДИЗ", "АЙН"], ["СТИ", "ЛЬ "], ["ВКУ", "С  "]], AB = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЫЭЮЯ";
    let w = 0, n = 0, tgt = words[0];
    return loop(() => {
      if (n === 0) tgt = words[++w % words.length];
      n++;
      el.innerHTML = tgt.map((r) => `<div class="r">${[...r].map((l, i) => `<div class="l">${n > 6 + i * 2 ? l : AB[(Math.random() * AB.length) | 0]}</div>`).join("")}</div>`).join("");
      if (n > 36) n = 0;
    }, live, 11);
  },
  glassmorphism: (root, live) => {
    const el = root.querySelector("[data-steps]")!; let v = 8110;
    return loop(() => { v += (Math.random() * 20) | 0; el.textContent = v.toLocaleString("ru-RU"); }, live, 1);
  },
};

export function StyleCover({ slug, className = "" }: { slug: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; root.toggleAttribute("data-off", !visible); });
    io.observe(root);
    const scene = SCENES[slug]?.(root, () => visible && !document.hidden);
    return () => { io.disconnect(); scene?.stop(); };
  }, [slug]);
  return <div ref={ref} data-off="" aria-hidden="true" className={`sc sc-${slug} ${className}`} dangerouslySetInnerHTML={{ __html: MARKUP[slug] ?? "" }} />;
}
