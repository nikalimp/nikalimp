// Генератор QR-кода: данные по типу (ссылка, текст, Wi-Fi, визитка…) и сборка SVG.
// Всё работает в браузере: картинка для центра читается локально и встраивается в SVG как data URL.
import qrcode from "qrcode-generator";

export type QrKind = "url" | "text" | "wifi" | "vcard" | "email" | "phone" | "telegram";
export type ModuleStyle = "square" | "rounded" | "dots";
export type LogoShape = "circle" | "square";

export type QrData = {
  url: string; text: string;
  wifiSsid: string; wifiPass: string; wifiType: "WPA" | "WEP" | "nopass"; wifiHidden: boolean;
  name: string; org: string; title: string; phone: string; email: string; site: string;
  mailTo: string; mailSubject: string; mailBody: string;
  tel: string; tg: string;
};

export const emptyData: QrData = {
  url: "", text: "",
  wifiSsid: "", wifiPass: "", wifiType: "WPA", wifiHidden: false,
  name: "", org: "", title: "", phone: "", email: "", site: "",
  mailTo: "", mailSubject: "", mailBody: "",
  tel: "", tg: "",
};

const esc = (s: string) => s.replace(/([\\;,:"])/g, "\\$1"); // экранирование для Wi-Fi и vCard
const withProto = (u: string) => (!u.trim() ? "" : /^[a-z][a-z0-9+.-]*:/i.test(u.trim()) ? u.trim() : "https://" + u.trim());

/** Строка, которую кодируем в QR, для выбранного типа. */
export function payload(kind: QrKind, d: QrData): string {
  switch (kind) {
    case "url": return withProto(d.url);
    case "text": return d.text;
    case "wifi":
      if (!d.wifiSsid) return "";
      return `WIFI:T:${d.wifiType};S:${esc(d.wifiSsid)};${d.wifiType !== "nopass" ? `P:${esc(d.wifiPass)};` : ""}${d.wifiHidden ? "H:true;" : ""};`;
    case "vcard": {
      if (!d.name && !d.phone && !d.email) return "";
      const [first = "", ...rest] = d.name.trim().split(/\s+/);
      const last = rest.join(" ");
      return [
        "BEGIN:VCARD", "VERSION:3.0",
        `N:${esc(last)};${esc(first)};;;`, `FN:${esc(d.name.trim())}`,
        d.org && `ORG:${esc(d.org)}`, d.title && `TITLE:${esc(d.title)}`,
        d.phone && `TEL;TYPE=CELL:${d.phone.replace(/[^\d+]/g, "")}`,
        d.email && `EMAIL:${d.email.trim()}`, d.site && `URL:${withProto(d.site)}`,
        "END:VCARD",
      ].filter(Boolean).join("\n");
    }
    case "email": {
      if (!d.mailTo) return "";
      const q = [d.mailSubject && `subject=${encodeURIComponent(d.mailSubject)}`, d.mailBody && `body=${encodeURIComponent(d.mailBody)}`].filter(Boolean).join("&");
      return `mailto:${d.mailTo.trim()}${q ? "?" + q : ""}`;
    }
    case "phone": return d.tel ? `tel:${d.tel.replace(/[^\d+]/g, "")}` : "";
    case "telegram": {
      const u = d.tg.trim().replace(/^@/, "").replace(/^(https?:\/\/)?(t\.me|telegram\.me)\//i, "");
      return u ? `https://t.me/${u}` : "";
    }
  }
}

export type Matrix = { size: number; dark: (r: number, c: number) => boolean };

export function makeMatrix(text: string, ecc: "L" | "M" | "Q" | "H"): Matrix | null {
  if (!text) return null;
  qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
  try {
    const q = qrcode(0, ecc);
    q.addData(text, "Byte");
    q.make();
    const size = q.getModuleCount();
    return { size, dark: (r, c) => q.isDark(r, c) };
  } catch {
    return null; // слишком много данных для QR
  }
}

export type SvgOptions = {
  fg: string; bg: string; style: ModuleStyle; margin: number;
  logo?: { src: string; shape: LogoShape; scale: number }; // scale — доля стороны кода, 0.15–0.28
};

const isFinder = (r: number, c: number, n: number) =>
  (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

/** SVG целиком: фон, модули, «глазки» и картинка в центре. viewBox в модулях — масштабируется без потерь. */
export function buildSvg(m: Matrix, o: SvgOptions): string {
  const n = m.size, pad = o.margin, total = n + pad * 2;
  const parts: string[] = [];
  parts.push(`<rect width="${total}" height="${total}" fill="${o.bg}"/>`);

  // Зона под картинку: модули под ней не рисуем, чтобы картинка лежала на чистом фоне
  let hole: { x: number; y: number; s: number } | null = null;
  if (o.logo) {
    const s = Math.round(n * o.logo.scale) + 2;
    const x = Math.floor((n - s) / 2);
    hole = { x, y: x, s };
  }
  const inHole = (r: number, c: number) => {
    if (!hole) return false;
    if (o.logo?.shape === "circle") {
      const cx = hole.x + hole.s / 2, cy = hole.y + hole.s / 2;
      return (c + 0.5 - cx) ** 2 + (r + 0.5 - cy) ** 2 <= (hole.s / 2) ** 2;
    }
    return r >= hole.y && r < hole.y + hole.s && c >= hole.x && c < hole.x + hole.s;
  };

  let d = "";
  const dots: string[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (!m.dark(r, c) || isFinder(r, c, n) || inHole(r, c)) continue;
    const x = c + pad, y = r + pad;
    if (o.style === "square") d += `M${x} ${y}h1v1h-1z`;
    else if (o.style === "dots") dots.push(`<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.47"/>`);
    else dots.push(`<rect x="${x + 0.06}" y="${y + 0.06}" width="0.88" height="0.88" rx="0.3"/>`);
  }
  if (d) parts.push(`<path d="${d}" fill="${o.fg}"/>`);
  if (dots.length) parts.push(`<g fill="${o.fg}">${dots.join("")}</g>`);

  // «Глазки» по углам: квадраты для square, скругления для остальных стилей
  const round = o.style === "square" ? 0 : 1;
  for (const [r0, c0] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    const x = c0 + pad, y = r0 + pad;
    parts.push(`<path fill-rule="evenodd" fill="${o.fg}" d="${roundRect(x, y, 7, 7, round * 1.6)} ${roundRect(x + 1, y + 1, 5, 5, round * 1.1)}"/>`);
    parts.push(`<path fill="${o.fg}" d="${roundRect(x + 2, y + 2, 3, 3, round * 0.8)}"/>`);
  }

  if (o.logo && hole) {
    const x = hole.x + pad, y = hole.y + pad, s = hole.s, inner = s - 1.2, ix = x + 0.6, iy = y + 0.6;
    const clip = o.logo.shape === "circle"
      ? `<clipPath id="qr-logo"><circle cx="${ix + inner / 2}" cy="${iy + inner / 2}" r="${inner / 2}"/></clipPath>`
      : `<clipPath id="qr-logo"><rect x="${ix}" y="${iy}" width="${inner}" height="${inner}" rx="${inner * 0.14}"/></clipPath>`;
    parts.push(`<defs>${clip}</defs>`);
    parts.push(`<image href="${o.logo.src}" x="${ix}" y="${iy}" width="${inner}" height="${inner}" preserveAspectRatio="xMidYMid slice" clip-path="url(#qr-logo)"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="${o.style === "square" ? "crispEdges" : "geometricPrecision"}">${parts.join("")}</svg>`;
}

function roundRect(x: number, y: number, w: number, h: number, r: number) {
  if (!r) return `M${x} ${y}h${w}v${h}h${-w}z`;
  return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;
}

/** Контраст двух цветов по WCAG: сканеры плохо читают код с контрастом ниже 4:1. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const h = hex.replace("#", "");
    const v = h.length === 3 ? h.split("").map((x) => x + x) : [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)];
    const [r, g, bl] = v.map((x) => parseInt(x, 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Относительная яркость цвета (0 — чёрный, 1 — белый). */
export function luminance(hex: string): number {
  return contrast(hex, "#000000") * 0.05 - 0.05;
}

/** Версия QR (1–40) по стороне матрицы: чем больше, тем мельче точки при той же площади печати. */
export const qrVersion = (size: number) => (size - 17) / 4;

/** Рисует SVG на холст нужного размера. Фон заливаем — у JPEG и для сканера не должно быть прозрачности. */
export function svgToCanvas(svg: string, px: number, bg: string, smooth: boolean): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = px;
      const ctx = c.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) return reject(new Error("no canvas"));
      ctx.fillStyle = bg; ctx.fillRect(0, 0, px, px);
      ctx.imageSmoothingEnabled = smooth;
      ctx.drawImage(img, 0, 0, px, px);
      resolve(c);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("svg load")); };
    img.src = url;
  });
}

export function canvasBlob(c: HTMLCanvasElement, type = "image/png", quality = 0.95): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), type, quality));
}

export function downloadBlob(blob: Blob, name: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export type ScanResult = "ok" | "mismatch" | "unreadable" | "unsupported";

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type DetectorCtor = { new (o: { formats: string[] }): Detector; getSupportedFormats?: () => Promise<string[]> };

/** Есть ли в браузере встроенный распознаватель BarcodeDetector с поддержкой QR. */
export async function scanSupported(): Promise<boolean> {
  const D = (globalThis as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
  if (!D) return false;
  try { return D.getSupportedFormats ? (await D.getSupportedFormats()).includes("qr_code") : true; } catch { return false; }
}

const norm = (s: string) => s.replace(/\r\n/g, "\n").trim();

/** Рисует код и считывает его встроенным распознавателем браузера: читается ли код и тот же ли в нём текст. */
export async function verifyScan(svg: string, bg: string, text: string, smooth: boolean): Promise<ScanResult> {
  if (!(await scanSupported())) return "unsupported";
  const D = (globalThis as unknown as { BarcodeDetector: DetectorCtor }).BarcodeDetector;
  try {
    const canvas = await svgToCanvas(svg, 600, bg, smooth);
    const found = await new D({ formats: ["qr_code"] }).detect(canvas);
    if (!found.length) return "unreadable";
    return found.some((f) => norm(f.rawValue) === norm(text)) ? "ok" : "mismatch";
  } catch {
    return "unsupported";
  }
}

/** Имя файла из содержимого кода: без протокола и символов, которые не любят файловые системы. */
export function fileSlug(text: string, max = 60): string {
  const s = text
    .replace(/^[a-z][a-z0-9+.-]*:(\/\/)?/i, "")
    .replace(new RegExp("[^\\p{L}\\p{N}._-]+", "gu"), "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, max)
    .replace(/[-.]+$/, "");
  return s || "qr";
}
