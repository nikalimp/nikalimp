// Партнёрская программа: ставки вознаграждения по слоям суммы договора (как прогрессивный налог).
// Каждая часть суммы оплачивается по ставке своего слоя, поэтому реальный процент растёт плавно.
// С 30.10.2026: 4 / 6 / 8 / 10 % по слоям 50–125 / 125–300 / 300–500 / 500–1000 тыс. ₽; первые 50 000 ₽ договора не считаются.

export type Tier = { from: number; to: number | null; rate: number };

export const TIERS: Tier[] = [
  { from: 50_000, to: 125_000, rate: 0.04 },
  { from: 125_000, to: 300_000, rate: 0.06 },
  { from: 300_000, to: 500_000, rate: 0.08 },
  { from: 500_000, to: 1_000_000, rate: 0.1 },
];

// Вместо кэшбэка — услуги стоимостью в 2 раза больше: столько «стоит» рекомендация, если брать услугами
export const SERVICES_MULTIPLIER = 2;

export const MAX_AMOUNT = 1_000_000; // верхняя граница ползунка
export const STEP = 5_000;

export type TierResult = Tier & { base: number; reward: number; fill: number };

export function calcReward(amount: number) {
  const a = Math.max(0, amount);
  const tiers: TierResult[] = TIERS.map((t) => {
    const top = t.to ?? MAX_AMOUNT;
    const base = Math.min(Math.max(a - t.from, 0), top - t.from);
    const width = top - t.from;
    return { ...t, base, reward: base * t.rate, fill: width ? base / width : 0 };
  });
  const total = tiers.reduce((s, t) => s + t.reward, 0);
  return { amount: a, tiers, total, effective: a ? total / a : 0 };
}

export const fmtRub = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} ₽`;
export const fmtPct = (r: number) => `${(r * 100).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} %`;
export const tierLabel = (t: Tier) => (t.to === null ? `свыше ${fmtRub(t.from)}` : `${fmtRub(t.from)} – ${fmtRub(t.to)}`);
