// Deterministic demo data for the live Kova dashboard (same numbers on server and client).

export const BALANCE = 4_826_310.42;
const END = Date.UTC(2026, 9, 11); // Sun 11 Oct 2026
const DAY = 86_400_000;

export type Ev = { label: string; amount: number; kind: "payroll" | "in" | "fx" };
export type Point = { t: number; v: number; ev?: Ev; fc?: boolean };

const EVENTS: Record<string, Ev> = {
  "2026-07-17": { label: "Payroll · 39 people", amount: -386_400, kind: "payroll" },
  "2026-07-28": { label: "Stripe payout", amount: 96_300, kind: "in" },
  "2026-07-31": { label: "Payroll · 40 people", amount: -391_900, kind: "payroll" },
  "2026-08-14": { label: "Payroll · 40 people", amount: -392_250, kind: "payroll" },
  "2026-08-20": { label: "Halcyon invoice paid", amount: 248_000, kind: "in" },
  "2026-08-28": { label: "Payroll · 41 people", amount: -401_800, kind: "payroll" },
  "2026-09-02": { label: "Northwind invoice paid", amount: 198_000, kind: "in" },
  "2026-09-11": { label: "Payroll · 41 people", amount: -402_100, kind: "payroll" },
  "2026-09-21": { label: "Stripe payout", amount: 128_400, kind: "in" },
  "2026-09-25": { label: "Payroll · 42 people", amount: -412_600, kind: "payroll" },
  "2026-09-30": { label: "Northwind invoice paid", amount: 342_500, kind: "in" },
  "2026-10-06": { label: "Aster Labs invoice paid", amount: 286_000, kind: "in" },
  "2026-10-08": { label: "€200k → USD converted", amount: 3_420, kind: "fx" },
  "2026-10-09": { label: "Payroll · 42 people", amount: -412_600, kind: "payroll" },
};

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const key = (t: number) => new Date(t).toISOString().slice(0, 10);

export const SERIES: Point[] = (() => {
  const r = rng(11);
  const pts: Point[] = [];
  let v = 0;
  for (let i = 89; i >= 0; i--) {
    const t = END - i * DAY;
    const ev = EVENTS[key(t)];
    const weekend = [0, 6].includes(new Date(t).getUTCDay());
    v += (weekend ? 2_000 : 31_000) + (r() - 0.5) * (weekend ? 8_000 : 46_000) + (ev?.amount ?? 0);
    pts.push({ t, v, ev });
  }
  const shift = BALANCE - pts[pts.length - 1].v;
  return pts.map((p) => ({ ...p, v: Math.round((p.v + shift) * 100) / 100 }));
})();

// Next 14 days: projected from the weekday run-rate plus what's already scheduled.
export const FORECAST: Point[] = (() => {
  const sched: Record<string, Ev> = {
    "2026-10-16": { label: "Aster Labs invoice due", amount: 120_000, kind: "in" },
    "2026-10-23": { label: "Payroll · 42 people (scheduled)", amount: -412_600, kind: "payroll" },
  };
  let v = BALANCE;
  return Array.from({ length: 14 }, (_, i) => {
    const t = END + (i + 1) * DAY;
    const ev = sched[key(t)];
    v += ([0, 6].includes(new Date(t).getUTCDay()) ? 2_000 : 24_000) + (ev?.amount ?? 0);
    return { t, v, ev, fc: true };
  });
})();

export const ACCOUNTS = [
  { code: "USD", name: "US dollar", sym: "$", color: "#B23A48", amount: 2_140_880.1, share: 44, bank: "Chase ··4410" },
  { code: "EUR", name: "Euro", sym: "€", color: "#2E4FB0", amount: 1_204_310.0, share: 27, bank: "Wise ··8812" },
  { code: "GBP", name: "Pound sterling", sym: "£", color: "#13235E", amount: 612_040.55, share: 16, bank: "Barclays ··0918" },
  { code: "USDC", name: "USD Coin", sym: "◎", color: "#3F7FD0", amount: 482_900.0, share: 10, bank: "Circle wallet" },
  { code: "BDT", name: "Bangladeshi taka", sym: "৳", color: "#23704A", amount: 16_410_000, share: 3, bank: "BRAC Bank ··2207" },
].map((a, i) => {
  const r = rng(100 + i);
  let v = 50;
  return { ...a, spark: Array.from({ length: 24 }, () => (v += (r() - 0.42) * 8)) };
});

export const CASHFLOW = [
  { week: "31 Aug", inflow: 412_000, outflow: 228_300 },
  { week: "7 Sep", inflow: 186_400, outflow: 521_900 },
  { week: "14 Sep", inflow: 238_900, outflow: 96_200 },
  { week: "21 Sep", inflow: 301_700, outflow: 498_400 },
  { week: "28 Sep", inflow: 486_200, outflow: 112_800 },
  { week: "5 Oct", inflow: 452_600, outflow: 531_300 },
];

export const APPROVALS = [
  { title: "October payroll", meta: "42 people · 6 countries", amount: "$412,600.00", flag: "Priya’s bank details changed 2 days ago", tone: "review" as const },
  { title: "Figma — annual seats", meta: "Vendor · due Tue", amount: "$18,240.00", tone: "ok" as const },
  { title: "Convert €200,000 → USD", meta: "Rate locked 14:05 · 1.0871", amount: "$217,420.00", tone: "ok" as const },
];

export const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtShort = (n: number) => {
  const a = Math.abs(n);
  const s = a >= 1e6 ? `${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M` : a >= 1e3 ? `${Math.round(a / 1e3)}k` : `${Math.round(a)}`;
  return `${n < 0 ? "−" : ""}$${s}`;
};
export const day = (t: number, o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
  new Date(t).toLocaleDateString("en-GB", { ...o, timeZone: "UTC" });
