"use client";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import s from "./kova.module.css";
import { ACCOUNTS, APPROVALS, BALANCE, CASHFLOW, FORECAST, SERIES, day, fmt, fmtShort } from "./data";

const RANGES = { "7D": 7, "30D": 30, "90D": 90 } as const;
type Range = keyof typeof RANGES;
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Live, interactive Kova dashboard. `compact` = balance + accounts only (for small stages). */
export default function KovaDashboard({ compact = false }: { compact?: boolean }) {
  const width = compact ? 860 : 1180;
  const outer = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [seen, setSeen] = useState(false);

  // scale the fixed-width design to fit its frame, like a real screen
  useLayoutEffect(() => {
    const el = outer.current!;
    const ro = new ResizeObserver(([e]) => setZoom(Math.min(1, e.contentRect.width / width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.25 });
    io.observe(outer.current!);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={outer} className={s.outer}>
      <div className={`${s.app} ${seen ? s.seen : ""} ${compact ? s.compact : ""}`} style={{ width, zoom }}>
        {!compact && <Sidebar />}
        <div className={s.main}>
          <header className={s.head}>
            <div>
              <h4>Good afternoon, Nadia</h4>
              <p>Sun 11 Oct · <b>3 approvals waiting</b></p>
            </div>
            <div className={s.actions}>
              <button className={s.primary}>Send</button>
              <button>Request</button>
              <button>Convert</button>
              {!compact && <button>New card</button>}
            </div>
          </header>
          <div className={s.top}>
            <BalanceCard seen={seen} />
            <Accounts seen={seen} />
          </div>
          {!compact && (
            <div className={s.bottom}>
              <CashFlow seen={seen} />
              <Approvals />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  const items = ["Home", "Payments", "Payouts", "Cards", "Accounts", "Treasury", "Team", "Settings"];
  return (
    <aside className={s.side}>
      <div className={s.logo}><i />kova</div>
      <span className={s.org}>Northwind Studio Ltd</span>
      {items.map((x, i) => (
        <span key={x} className={i === 0 ? s.active : ""}>{x}{x === "Payouts" && <em>3</em>}</span>
      ))}
      <div className={s.me}><i>NC</i><span>Nadia Chowdhury<small>Finance lead</small></span></div>
    </aside>
  );
}

/* ─────────── Balance chart ─────────── */

function monotonePath(xs: number[], ys: number[]) {
  const n = xs.length;
  if (n < 2) return "";
  const dx: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = xs[i + 1] - xs[i]; m[i] = (ys[i + 1] - ys[i]) / dx[i]; }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  t[n - 1] = m[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], h = a * a + b * b;
    if (h > 9) { const k = 3 / Math.sqrt(h); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = `M${xs[0]},${ys[0]}`;
  for (let i = 0; i < n - 1; i++) {
    const c = dx[i] / 3;
    d += `C${xs[i] + c},${ys[i] + c * t[i]} ${xs[i + 1] - c},${ys[i + 1] - c * t[i + 1]} ${xs[i + 1]},${ys[i + 1]}`;
  }
  return d;
}

function niceTicks(min: number, max: number, count = 4) {
  const raw = (max - min) / count;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * p).find((k) => k >= raw)!;
  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) ticks.push(v);
  return ticks;
}

function useCountUp(target: number, run: boolean) {
  const [v, setV] = useState(target);
  const from = useRef(target * 0.92);
  useEffect(() => {
    if (!run || reduced()) return;
    const start = performance.now(), a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / 1100);
      setV(a + (target - a) * (1 - (1 - k) ** 3));
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return v;
}

const W = 640, H = 230, PL = 6, PR = 54, PT = 16, PB = 26;

function BalanceCard({ seen }: { seen: boolean }) {
  const [range, setRange] = useState<Range>("30D");
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");
  const data = useMemo(() => SERIES.slice(-RANGES[range]), [range]);
  const all = useMemo(() => (range === "7D" ? data : [...data, ...FORECAST]), [data, range]);
  const fc = all.slice(data.length);
  const nA = data.length;
  const first = data[0].v, last = data[data.length - 1].v;
  const change = (last - first) / first;
  const shown = useCountUp(BALANCE, seen);

  const { xs, ys, ticks, y } = useMemo(() => {
    const vs = all.map((d) => d.v);
    const lo = Math.min(...vs), hi = Math.max(...vs), pad = (hi - lo) * 0.18;
    const y0 = lo - pad, y1 = hi + pad;
    const y = (v: number) => PT + (1 - (v - y0) / (y1 - y0)) * (H - PT - PB);
    const xs = all.map((_, i) => PL + (i / (all.length - 1)) * (W - PL - PR));
    return { xs, ys: vs.map(y), ticks: niceTicks(y0, y1), y };
  }, [all]);
  const line = monotonePath(xs.slice(0, nA), ys.slice(0, nA));
  const fcLine = fc.length ? monotonePath(xs.slice(nA - 1), ys.slice(nA - 1)) : "";
  const area = `${line} L${xs[nA - 1]},${H - PB} L${xs[0]},${H - PB} Z`;
  const labelIdx = fc.length ? [0, Math.round((nA - 1) / 2), nA - 1, all.length - 1] : [0, Math.round((nA - 1) / 3), Math.round(((nA - 1) * 2) / 3), nA - 1];
  const events = all.map((d, i) => ({ d, i })).filter((x) => x.d.ev && x.d.ev.kind !== "fx");
  const low = fc.length ? fc.reduce((a, b) => (b.v < a.v ? b : a)) : null;
  const h = hover ?? nA - 1;
  const hp = all[h];
  const prev = all[h - 1] ?? SERIES[SERIES.length - RANGES[range] - 1];

  const pick = (clientX: number, el: Element) => {
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(all.length - 1, Math.round(((x - PL) / (W - PL - PR)) * (all.length - 1)))));
  };

  return (
    <section className={`${s.card} ${s.balance}`}>
      <div className={s.balTop}>
        <div>
          <small className={s.cap}>Total balance · USD equivalent</small>
          <div className={s.bal}>
            <strong>{fmt(shown).replace(/\.\d+$/, "")}</strong><span>.{fmt(BALANCE).split(".")[1]}</span>
            <em className={change >= 0 ? s.up : s.down}>{change >= 0 ? "▲" : "▼"} {(Math.abs(change) * 100).toFixed(1)}% · {range}</em>
          </div>
        </div>
        <div className={s.tabs} role="tablist" aria-label="Chart range">
          {(Object.keys(RANGES) as Range[]).map((r) => (
            <button key={r} role="tab" aria-selected={r === range} className={r === range ? s.on : ""} onClick={() => (setRange(r), setHover(null))}>{r}</button>
          ))}
        </div>
      </div>

      <div className={s.chartWrap}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={s.chart}
          tabIndex={0}
          role="img"
          aria-label={`Balance over ${range}: from ${fmt(first, 0)} to ${fmt(last, 0)}. Use arrow keys to inspect days.`}
          onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
          onPointerLeave={() => setHover(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setHover(Math.max(0, h - 1));
            if (e.key === "ArrowRight") setHover(Math.min(all.length - 1, h + 1));
          }}
        >
          <defs>
            <linearGradient id={`a${gid}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#2F9E5B" stopOpacity=".28" />
              <stop offset="1" stopColor="#2F9E5B" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t} className={s.grid}>
              <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} />
              <text x={W - PR + 8} y={y(t) + 4}>{fmtShort(t)}</text>
            </g>
          ))}
          {fc.length > 0 && (
            <g className={s.fcZone}>
              <rect x={xs[nA - 1]} y={PT - 6} width={xs[all.length - 1] - xs[nA - 1]} height={H - PB - PT + 6} />
              <text x={xs[nA - 1] + 6} y={PT + 6}>FORECAST</text>
            </g>
          )}
          <path key={`a${range}`} d={area} fill={`url(#a${gid})`} className={s.area} />
          <path key={`l${range}`} d={line} pathLength={1} className={s.line} />
          {fcLine && <path key={`f${range}`} d={fcLine} className={s.fcLine} />}
          {events.map(({ d, i }) => (
            <g key={d.t} className={`${s.ev} ${s[d.ev!.kind]} ${d.fc ? s.evFc : ""}`} style={{ ["--i" as string]: i / all.length }}>
              <circle cx={xs[i]} cy={ys[i]} r={range === "90D" ? 3.2 : 4.2} />
            </g>
          ))}
          {labelIdx.map((i) => (
            <text key={i} className={s.xl} x={xs[i]} y={H - 6} textAnchor={i === 0 ? "start" : i === all.length - 1 ? "end" : "middle"}>{i === nA - 1 && fc.length ? "Today" : day(all[i].t)}</text>
          ))}
          <g className={s.cursor} style={{ opacity: hover === null ? 0 : 1 }}>
            <line x1={xs[h]} x2={xs[h]} y1={PT} y2={H - PB} />
            <circle cx={xs[h]} cy={ys[h]} r={6} />
          </g>
          {hover === null && <circle className={s.pulse} cx={xs[nA - 1]} cy={ys[nA - 1]} r={5} />}
        </svg>
        {hover !== null && (
          <div className={s.tip} style={{ left: `${(xs[h] / W) * 100}%`, top: `${(ys[h] / H) * 100}%` }} data-side={xs[h] > W * 0.62 ? "l" : "r"}>
            <small>{day(hp.t, { weekday: "short", day: "numeric", month: "short" })}{hp.fc ? " · forecast" : h === nA - 1 ? " · today" : ""}</small>
            <strong>{fmt(hp.v, 0)}</strong>
            {prev && <span className={hp.v >= prev.v ? s.up : s.down}>{hp.v >= prev.v ? "+" : "−"}{fmt(Math.abs(hp.v - prev.v), 0)} that day</span>}
            {hp.ev && <b className={s[hp.ev.kind]}>{hp.ev.label} {hp.ev.amount > 0 ? "+" : "−"}{fmtShort(Math.abs(hp.ev.amount)).replace("$", "$")}</b>}
          </div>
        )}
      </div>
      <div className={s.legend}>
        <span><i className={s.payroll} /> Payroll</span>
        <span><i className={s.in} /> Money in</span>
        {low && <span className={s.low}>Projected low <b>{fmtShort(low.v)}</b> · {day(low.t)}</span>}
        <span className={s.hint}>Hover or ← →</span>
      </div>
    </section>
  );
}

/* ─────────── Accounts ─────────── */

function Spark({ v, color }: { v: number[]; color: string }) {
  const lo = Math.min(...v), hi = Math.max(...v);
  const xs = v.map((_, i) => (i / (v.length - 1)) * 64);
  const ys = v.map((x) => 20 - ((x - lo) / (hi - lo || 1)) * 18);
  return (
    <svg viewBox="0 0 64 22" className={s.spark} aria-hidden>
      <path d={monotonePath(xs, ys)} stroke={color} />
    </svg>
  );
}

function Accounts({ seen }: { seen: boolean }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <section className={`${s.card} ${s.accounts}`}>
      <div className={s.accHead}>
        <small className={s.cap}>Accounts</small>
        <small className={s.cap}>5 currencies</small>
      </div>
      <div className={s.alloc} aria-label="Balance by currency">
        {ACCOUNTS.map((a, i) => (
          <i
            key={a.code}
            style={{ width: seen ? `${a.share}%` : "0%", background: a.color, transitionDelay: `${i * 90}ms`, opacity: active && active !== a.code ? 0.3 : 1 }}
            title={`${a.code} ${a.share}%`}
          />
        ))}
      </div>
      <ul>
        {ACCOUNTS.map((a) => (
          <li key={a.code} onPointerEnter={() => setActive(a.code)} onPointerLeave={() => setActive(null)} className={active === a.code ? s.rowOn : ""}>
            <span className={s.badge} style={{ background: a.color }}>{a.sym}</span>
            <span className={s.accName}>
              <b>{a.code}</b>
              <small>{active === a.code ? a.bank : `${a.share}% of balance`}</small>
            </span>
            <Spark v={a.spark} color={a.color} />
            <span className={s.amt}>
              {a.code === "USDC" ? `${a.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : `${a.sym === "◎" ? "" : a.sym}${a.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ─────────── Cash flow ─────────── */

function CashFlow({ seen }: { seen: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...CASHFLOW.flatMap((w) => [w.inflow, w.outflow]));
  const tin = CASHFLOW.reduce((a, w) => a + w.inflow, 0), tout = CASHFLOW.reduce((a, w) => a + w.outflow, 0);
  const h = hover ?? CASHFLOW.length - 1;
  const w = CASHFLOW[h];
  return (
    <section className={`${s.card} ${s.flow}`}>
      <div className={s.accHead}>
        <small className={s.cap}>Cash flow · last 6 weeks</small>
        <small className={s.cap}>Net {fmtShort(tin - tout)}</small>
      </div>
      <div className={s.flowBody}>
        <div className={s.flowNums}>
          <span><i className={s.in} />In <b>{fmtShort(tin)}</b></span>
          <span><i className={s.payroll} />Out <b>{fmtShort(tout)}</b></span>
          <div className={s.flowWeek}>
            <small>Week of {w.week}</small>
            <strong className={w.inflow - w.outflow >= 0 ? s.up : s.down}>{w.inflow - w.outflow >= 0 ? "+" : ""}{fmtShort(w.inflow - w.outflow)}</strong>
          </div>
        </div>
        <div className={s.bars} onPointerLeave={() => setHover(null)}>
          {CASHFLOW.map((x, i) => (
            <button key={x.week} className={`${s.barCol} ${i === h ? s.barOn : ""}`} onPointerEnter={() => setHover(i)} onFocus={() => setHover(i)} aria-label={`Week of ${x.week}: in ${fmt(x.inflow, 0)}, out ${fmt(x.outflow, 0)}`}>
              <span className={s.barIn} style={{ height: seen ? `${(x.inflow / max) * 100}%` : 0, transitionDelay: `${i * 70}ms` }} />
              <span className={s.barOut} style={{ height: seen ? `${(x.outflow / max) * 100}%` : 0, transitionDelay: `${i * 70 + 40}ms` }} />
              <small>{x.week}</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Approvals() {
  const [held, setHeld] = useState(false);
  return (
    <section className={`${s.card} ${s.appr}`}>
      <div className={s.accHead}>
        <small className={s.cap}>Waiting for you</small>
        <small className={s.cap}>{APPROVALS.length}</small>
      </div>
      <ul>
        {APPROVALS.map((a) => (
          <li key={a.title} className={a.tone === "review" ? s.review : ""}>
            <span>
              <b>{a.title}</b>
              <small>{a.meta}</small>
              {a.flag && <em>{held ? "Priya held · 41 ready to send" : a.flag}</em>}
            </span>
            <strong>{a.amount}</strong>
            {a.flag && <button onClick={() => setHeld((v) => !v)} className={held ? s.heldBtn : ""}>{held ? "Undo" : "Hold Priya & send 41"}</button>}
          </li>
        ))}
      </ul>
    </section>
  );
}

