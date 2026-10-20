"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import s from "./playground.module.css";
import { useCmd } from "@/lib/useCmd";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Calls back once when the element first scrolls into view. */
function useSeen<T extends Element>(cb: () => void) {
  const ref = useRef<T>(null);
  const fn = useRef(cb);
  useEffect(() => { fn.current = cb; });
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (fn.current(), io.disconnect()), { threshold: 0.4 });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function Playground() {
  return (
    <div className={s.grid} data-spot="playground">
      <Tile demo="constellation" title="Constellation" meta="Canvas 2D · stars dodge your cursor · click to connect" dark>
        <Constellation />
      </Tile>
      <Tile demo="agent" title="Agent run" meta="From Relay · plan → act → stop at the risky step">
        <AgentRun />
      </Tile>
      <Tile demo="stream" title="Streaming reply" meta="From Tally · thinking shimmer → tokens · tone switch">
        <StreamReply />
      </Tile>
      <Tile demo="hold" title="Hold to confirm" meta="From Kova · 1.2 s hold · works with Space too">
        <HoldToConfirm />
      </Tile>
      <Tile demo="daynight" title="Day / night" meta="Spring 0.6 s · switches this whole site">
        <DayNight />
      </Tile>
      <Tile demo="flip_card" title="Tilt card" meta="3D transform · pointer tilt + glare · click to flip">
        <TiltCard />
      </Tile>
    </div>
  );
}

function Tile({ demo, title, meta, dark, children }: { demo: string; title: string; meta: string; dark?: boolean; children: React.ReactNode }) {
  return (
    <article className={`${s.tile} reveal`} data-demo={demo}>
      <div className={`${s.stage} ${dark ? s.dark : ""}`}>{children}</div>
      <div className={s.cap}>
        <strong>{title}</strong>
        <small>{meta}</small>
      </div>
    </article>
  );
}

/* ───────────── 1. Constellation ───────────── */

function Constellation() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [picked, setPicked] = useState(0);
  const clearRef = useRef(() => {});
  const drawRef = useRef(() => {});
  useCmd("pg:cmd", (d) => d === "constellation" && drawRef.current());

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const stars = Array.from({ length: 72 }, () => ({ x: rnd(), y: rnd(), r: 0.6 + rnd() * 1.5, p: rnd() * 6.28, sp: 0.6 + rnd() * 1.8 }));
    const chosen: number[] = [];
    let w = 0, h = 0, mx = -999, my = -999, raf = 0, on = false;
    const still = reduced();
    const t0 = performance.now();

    const resize = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const pos = (st: (typeof stars)[number]): [number, number] => {
      let x = st.x * w, y = st.y * h;
      const dx = x - mx, dy = y - my, d = Math.hypot(dx, dy);
      if (d < 80 && d > 0) { const k = ((80 - d) / 80) * 12; x += (dx / d) * k; y += (dy / d) * k; }
      return [x, y];
    };
    const nearest = () => {
      let best = -1, bd = 26;
      stars.forEach((st, i) => { const [x, y] = pos(st); const d = Math.hypot(x - mx, y - my); if (d < bd) { bd = d; best = i; } });
      return best;
    };
    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      if (chosen.length > 1) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,210,74,.85)";
        ctx.lineWidth = 1.4;
        ctx.shadowColor = "#FFD24A";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        chosen.forEach((i, j) => { const [x, y] = pos(stars[i]); if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.stroke();
        ctx.restore();
      }
      const hot = nearest();
      if (chosen.length && hot >= 0 && hot !== chosen[chosen.length - 1]) {
        const [ax, ay] = pos(stars[chosen[chosen.length - 1]]), [bx, by] = pos(stars[hot]);
        ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = "rgba(255,210,74,.45)"; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.restore();
      }
      stars.forEach((st, i) => {
        const [x, y] = pos(st);
        const sel = chosen.includes(i);
        const tw = still ? 0.85 : 0.5 + 0.5 * Math.sin(t * st.sp + st.p);
        ctx.globalAlpha = sel ? 1 : i === hot ? 1 : 0.25 + tw * 0.75;
        ctx.fillStyle = sel ? "#FFD24A" : i === hot ? "#FFE8A3" : "#fff";
        ctx.beginPath();
        ctx.arc(x, y, sel ? st.r + 1.8 : i === hot ? st.r + 1.2 : st.r, 0, 6.283);
        ctx.fill();
        if (i === hot) { ctx.globalAlpha = 0.5; ctx.strokeStyle = "#FFD24A"; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.283); ctx.stroke(); }
      });
      ctx.globalAlpha = 1;
      if (on) raf = requestAnimationFrame(draw);
    };
    const local = (e: PointerEvent) => { const r = c.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
    const move = (e: PointerEvent) => local(e);
    const leave = () => { mx = my = -999; };
    const click = (e: PointerEvent) => {
      local(e);
      const i = nearest();
      if (i < 0 || i === chosen[chosen.length - 1]) return;
      chosen.push(i);
      setPicked(chosen.length);
    };
    clearRef.current = () => { chosen.length = 0; setPicked(0); };
    // Tara can draw one: pick the star nearest each point of a little kite shape
    drawRef.current = () => {
      chosen.length = 0;
      const shape = [[0.18, 0.62], [0.32, 0.3], [0.5, 0.48], [0.66, 0.22], [0.82, 0.42], [0.62, 0.72], [0.5, 0.48]];
      shape.forEach(([sx, sy], k) => setTimeout(() => {
        let best = 0, bd = Infinity;
        stars.forEach((st, i) => { const d = Math.hypot(st.x - sx, st.y - sy); if (d < bd) { bd = d; best = i; } });
        if (chosen[chosen.length - 1] !== best) chosen.push(best);
        setPicked(chosen.length);
      }, 220 * k));
    };

    resize();
    const ro = new ResizeObserver(resize); ro.observe(c);
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (on) raf = requestAnimationFrame(draw);
    });
    io.observe(c);
    c.addEventListener("pointermove", move);
    c.addEventListener("pointerleave", leave);
    c.addEventListener("pointerdown", click);
    return () => { on = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); c.removeEventListener("pointermove", move); c.removeEventListener("pointerleave", leave); c.removeEventListener("pointerdown", click); };
  }, []);

  return (
    <>
      <canvas ref={ref} className={s.canvas} aria-label="Interactive starfield. Click stars to draw a constellation." />
      <div className={s.constHud}>
        <span>{picked === 0 ? "Click a star to begin" : picked < 5 ? `${picked} star${picked > 1 ? "s" : ""}, keep going` : `✦ A ${picked}-star constellation!`}</span>
        {picked > 0 && <button onClick={() => clearRef.current()}>Clear</button>}
      </div>
    </>
  );
}

/* ───────────── 2. Agent run ───────────── */

const STEPS = [
  { label: "Read the brief", ms: 800 },
  { label: "Searched 23 venues", ms: 1300 },
  { label: "Checked 4 calendars", ms: 1000 },
  { label: "Ranked 3 options", ms: 1100 },
  { label: "Hold 12–14 March", gate: true, ms: 0 },
];

function AgentRun() {
  const [step, setStep] = useState(-1); // index of the running step; STEPS.length = finished
  const [elapsed, setElapsed] = useState(0);
  const run = useRef(0);

  const start = useCallback(() => {
    const id = ++run.current;
    setStep(0);
    setElapsed(0);
    const t0 = performance.now();
    const tick = setInterval(() => (id === run.current ? setElapsed((performance.now() - t0) / 1000) : clearInterval(tick)), 100);
    let at = 0;
    STEPS.forEach((st, i) => {
      if (st.gate) { setTimeout(() => { if (id === run.current) { setStep(i); clearInterval(tick); } }, at); return; }
      setTimeout(() => id === run.current && setStep(i), at);
      at += st.ms;
    });
  }, []);
  const ref = useSeen<HTMLDivElement>(start);
  useCmd("pg:cmd", (d) => d === "agent" && start());
  const gateAt = STEPS.length - 1;
  const done = step >= STEPS.length;

  return (
    <div ref={ref} className={s.agent}>
      <div className={s.agentHead}>
        <span className={`${s.orb} ${step >= 0 && step < gateAt ? s.spin : ""} ${done ? s.orbDone : ""}`} />
        <b>Lisbon offsite shortlist</b>
        <code>{elapsed.toFixed(1)}s</code>
      </div>
      <div className={s.bar}><i style={{ width: `${(Math.min(step, STEPS.length) / STEPS.length) * 100}%` }} /></div>
      <ol>
        {STEPS.map((st, i) => {
          const state = done || i < step ? "done" : i === step ? (st.gate ? "gate" : "run") : "todo";
          return (
            <li key={st.label} className={s[state]}>
              <i />
              <span>{st.label}</span>
              {state === "gate" && <em>needs you</em>}
            </li>
          );
        })}
      </ol>
      <div className={s.agentFoot}>
        {step === gateAt ? (
          <>
            <button className={s.approve} onClick={() => setStep(STEPS.length)}>Approve</button>
            <button onClick={start}>Edit plan</button>
          </>
        ) : done ? (
          <>
            <span className={s.okMsg}>✓ Dates held · summary sent</span>
            <button onClick={start}>Run again</button>
          </>
        ) : (
          <span className={s.muted}>Nothing is sent until you approve.</span>
        )}
      </div>
    </div>
  );
}

/* ───────────── 3. Streaming reply ───────────── */

const REPLIES = {
  Friendly: "Yes, **Lisbon fits** if you book by the 14th. You’ll still have **£486** before payday, and pausing one unused subscription gives you a cushion. Want me to set a reminder? ✈️",
  Concise: "**Yes.** £486 left before payday. Book by the 14th.",
  Careful: "**Probably**, with one risk: the 17th dips close to your £300 floor. Book after the 12th’s freelance payment lands.",
} as const;
type Tone = keyof typeof REPLIES;

// consecutive bold words → one highlighted phrase
function group(ws: { w: string; b: boolean }[]) {
  const out: { b: boolean; ws: string[] }[] = [];
  for (const { w, b } of ws) {
    const last = out[out.length - 1];
    if (b && last?.b) last.ws.push(w);
    else out.push({ b, ws: [w] });
  }
  return out;
}

function StreamReply() {
  const [tone, setTone] = useState<Tone>("Friendly");
  const [shown, setShown] = useState(-1); // -1 = thinking
  const run = useRef(0);
  // words, with **bold** phrases kept together so they highlight as one
  const words = REPLIES[tone].split(/(\*\*[^*]+\*\*)/).filter(Boolean).flatMap((seg) =>
    seg.startsWith("**") ? seg.slice(2, -2).split(" ").map((w) => ({ w, b: true })) : seg.trim().split(/\s+/).filter(Boolean).map((w) => ({ w, b: false })),
  );

  const play = useCallback((t: Tone) => {
    const id = ++run.current;
    setTone(t);
    setShown(-1);
    const n = REPLIES[t].replace(/\*\*/g, " ").trim().split(/\s+/).length;
    const fast = reduced();
    setTimeout(() => {
      if (id !== run.current) return;
      if (fast) return setShown(n);
      let i = 0;
      const tick = () => { if (id !== run.current) return; setShown(++i); if (i < n) setTimeout(tick, 38 + Math.random() * 60); };
      tick();
    }, fast ? 0 : 900);
  }, []);
  const ref = useSeen<HTMLDivElement>(() => play("Friendly"));
  useCmd("pg:cmd", (d) => d === "stream" && play(tone === "Friendly" ? "Careful" : "Friendly"));
  const live = shown >= 0 && shown < words.length;

  return (
    <div ref={ref} className={s.stream}>
      <p className={s.ask}>Can I afford Lisbon in May?</p>
      <div className={s.answer}>
        {shown < 0 ? (
          <span className={s.shimmer}>Checking 30-day forecast…</span>
        ) : (
          <p>
            {group(words.slice(0, shown)).map((g, i) =>
              g.b ? <b key={i} className={s.tok}>{g.ws.join(" ")}</b> : g.ws.map((w, j) => <span key={`${i}-${j}`} className={s.tok}>{w} </span>),
            )}
            {live && <i className={s.caret} />}
          </p>
        )}
      </div>
      <div className={s.tones} role="tablist" aria-label="Tone">
        {(Object.keys(REPLIES) as Tone[]).map((t) => (
          <button key={t} role="tab" aria-selected={t === tone} className={t === tone ? s.on : ""} onClick={() => play(t)}>{t}</button>
        ))}
        <button className={s.regen} onClick={() => play(tone)} aria-label="Regenerate">↻</button>
      </div>
    </div>
  );
}

/* ───────────── 4. Hold to confirm ───────────── */

function HoldToConfirm() {
  const [p, setP] = useState(0);
  const [state, setState] = useState<"idle" | "holding" | "early" | "done">("idle");
  const raf = useRef(0);
  const t0 = useRef(0);

  const begin = () => {
    if (state === "done" || state === "holding") return;
    setState("holding");
    t0.current = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0.current) / 1200);
      setP(k);
      if (k < 1) raf.current = requestAnimationFrame(tick);
      else { setState("done"); setTimeout(() => (setState("idle"), setP(0)), 4000); }
    };
    raf.current = requestAnimationFrame(tick);
  };
  const end = () => {
    if (state !== "holding") return;
    cancelAnimationFrame(raf.current);
    setState("early");
    setP(0);
    setTimeout(() => setState((v) => (v === "early" ? "idle" : v)), 1400);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <div className={s.holdWrap}>
      <div className={s.holdMeta}><small>October payroll · 41 people</small><b>$412,600.00</b></div>
      <button
        className={`${s.hold} ${s[state]}`}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); begin(); }}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); begin(); } }}
        onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") end(); }}
        aria-label="Hold to send payroll"
      >
        <span className={s.fill} style={{ width: `${p * 100}%` }} />
        <svg viewBox="0 0 36 36" className={s.ring} aria-hidden>
          <circle cx="18" cy="18" r="15" />
          <circle cx="18" cy="18" r="15" pathLength={1} style={{ strokeDashoffset: 1 - p }} className={s.ringOn} />
        </svg>
        <span className={s.holdLabel}>{state === "done" ? "Sent ✓" : state === "holding" ? `Sending… ${Math.round(p * 100)}%` : "Hold to send"}</span>
        {state === "done" && <span className={s.burst} aria-hidden>{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ ["--a" as string]: `${i * 30}deg` }} />)}</span>}
      </button>
      <small className={s.holdHint} aria-live="polite">{state === "early" ? "Keep holding. This is the safe way to move money." : state === "done" ? "Recall available for 10 minutes." : "Press and hold"}</small>
    </div>
  );
}

/* ───────────── 5. Day / night ───────────── */

const subscribeTheme = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
};

function DayNight() {
  const theme = useSyncExternalStore(subscribeTheme, () => document.documentElement.dataset.theme ?? "day", () => "day");
  const night = theme === "night";
  const flip = () => {
    const next = night ? "day" : "night";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
  };
  useCmd("pg:cmd", (d) => d === "daynight" && flip());
  return (
    <div className={s.dn}>
      <button role="switch" aria-checked={night} aria-label="Night mode" className={`${s.sw} ${night ? s.night : ""}`} onClick={flip}>
        <span className={s.clouds}><i /><i /><i /></span>
        <span className={s.tiny}><i /><i /><i /><i /><i /></span>
        <span className={s.knob}><span className={s.mask} /><i /><i /><i /></span>
      </button>
      <small>{night ? "Night sky · stars are out" : "Daylight · cream paper"}</small>
    </div>
  );
}

/* ───────────── 6. Tilt card ───────────── */

function TiltCard() {
  const ref = useRef<HTMLButtonElement>(null);
  const [flipped, setFlipped] = useState(false);
  useCmd("pg:cmd", (d) => d === "flip_card" && setFlipped((v) => !v));
  const set = (rx: number, ry: number, gx: number, gy: number, on: boolean) => {
    const el = ref.current!;
    el.style.setProperty("--rx", `${rx}deg`);
    el.style.setProperty("--ry", `${ry}deg`);
    el.style.setProperty("--gx", `${gx}%`);
    el.style.setProperty("--gy", `${gy}%`);
    el.dataset.active = on ? "1" : "";
  };
  return (
    <div className={s.tiltStage}>
      <button
        ref={ref}
        className={`${s.tilt} ${flipped ? s.flipped : ""}`}
        onPointerMove={(e) => {
          if (reduced() || e.pointerType === "touch") return;
          const r = e.currentTarget.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          set((0.5 - py) * 26, (px - 0.5) * 32, px * 100, py * 100, true);
        }}
        onPointerLeave={() => set(0, 0, 50, 50, false)}
        onClick={() => setFlipped((v) => !v)}
        aria-label={flipped ? "Show card front" : "Flip card to see the back"}
      >
        <span className={s.inner}>
          <span className={`${s.face} ${s.front}`}>
            <span className={s.brand}><i />kova</span>
            <span className={s.chip} />
            <span className={s.contactless}>)))</span>
            <span className={s.num}>•••• •••• •••• 4410</span>
            <span className={s.holder}><small>Cardholder</small>NADIA CHOWDHURY</span>
            <span className={s.type}>debit</span>
            <span className={s.glare} />
          </span>
          <span className={`${s.face} ${s.back}`}>
            <span className={s.stripe} />
            <span className={s.sig}><i>Nadia C.</i><b>•••</b></span>
            <span className={s.backRow}><span>Spend limit</span><b>$25,000 / mo</b></span>
            <span className={s.backRow}><span>Frozen</span><b>No</b></span>
          </span>
        </span>
      </button>
    </div>
  );
}
