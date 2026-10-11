"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { disciplines, profile, projects } from "@/lib/content";
import type { Action } from "@/lib/guard";
import Markdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string; actions?: Action[]; steps?: string[]; live?: boolean };

const SUGGEST = ["Why should I hire Tahmina?", "Give me the tour ✦", "Show me her best AI project", "Has she used Playwright?", "Make it night ✦", "How can I contact her?"];
const TOUR = [
  ["work", "Eight case studies — each one from first sketch to shipped code."],
  ["about", "Five hats: product, UI/UX, frontend, QA and AI-native."],
  ["process", "Her process — frame, design the behaviour, build, then try to break it."],
  ["playground", "The fun bit: motion experiments and the studio critters."],
  ["contact", "And here’s how to reach her. WhatsApp is quickest! ✦"],
] as const;
type Tip = { text: string; prompt?: string };
const STORE = "tara-chat";
const GREETING: Msg = {
  role: "assistant",
  content: "Hi, I’m Tara ✦ — Tahmina’s little helper. Ask me about her work, skills or how to reach her. I can also move things around the page!",
};

export default function Tara() {
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<string>("idle");
  const [tip, setTip] = useState<Tip | null>(null);
  const [everOpened, setEverOpened] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    if (typeof window === "undefined") return [GREETING];
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) ?? "null") as Msg[] | null;
      if (Array.isArray(saved) && saved.length) return saved.map((m) => ({ ...m, live: false }));
    } catch {}
    return [GREETING];
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const moodTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const tourRef = useRef(0);
  const project = projects.find((p) => path === `/work/${p.slug}`);
  const show = useCallback((v: boolean) => {
    setOpen(v);
    if (v) { setEverOpened(true); setTip(null); tourRef.current++; }
  }, []);

  // restore theme
  useEffect(() => {
    try {
      const theme = localStorage.getItem("theme");
      if (theme === "night" || theme === "day") document.documentElement.dataset.theme = theme;
    } catch {}
  }, []);
  // a page-aware nudge, a few seconds after arriving
  useEffect(() => {
    const p = projects.find((x) => path === `/work/${x.slug}`);
    const t = setTimeout(() => setTip(p ? { text: `Want the 30-second version of ${p.name}?`, prompt: `Give me the 30-second version of ${p.name}.` } : { text: "Hi! I’m Tara ✦ ask me about Tahmina" }), p ? 4000 : 2600);
    const u = setTimeout(() => setTip(null), p ? 12000 : 9000);
    return () => (clearTimeout(t), clearTimeout(u));
  }, [path]);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    try { sessionStorage.setItem(STORE, JSON.stringify(msgs.filter((m) => !m.live).slice(-20))); } catch {}
  }, [msgs, busy]);
  // eyes follow the cursor
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches) return;
    let raf = 0;
    const on = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrapRef.current?.querySelector(".tara");
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const k = Math.min(1, Math.hypot(dx, dy) / 300) * 3.6 / (Math.hypot(dx, dy) || 1);
        wrapRef.current!.style.setProperty("--lx", `${dx * k}px`);
        wrapRef.current!.style.setProperty("--ly", `${dy * k}px`);
      });
    };
    window.addEventListener("pointermove", on);
    return () => (window.removeEventListener("pointermove", on), cancelAnimationFrame(raf));
  }, []);
  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); tourRef.current++; }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); show(!open); }
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, show]);

  const sendRef = useRef<(t: string) => void>(() => {});
  useEffect(() => {
    const on = (e: Event) => {
      show(true);
      const q = (e as CustomEvent<string | undefined>).detail;
      if (q) setTimeout(() => sendRef.current(q), 350);
    };
    window.addEventListener("tara:open", on);
    return () => window.removeEventListener("tara:open", on);
  }, [show]);

  const feel = useCallback((m: string, ms = 2800) => {
    setMood(m);
    clearTimeout(moodTimer.current);
    moodTimer.current = setTimeout(() => setMood("idle"), ms);
  }, []);

  const tour = useCallback(async () => {
    const id = ++tourRef.current;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    await wait(1400); // let the visitor read the reply first
    if (id !== tourRef.current) return;
    setOpen(false);
    if (path !== "/") { router.push("/"); await wait(900); }
    // the visitor takes over (scroll, tap, key) → tour stops
    const stop = () => { tourRef.current++; setTip(null); };
    const opts = { once: true, passive: true } as const;
    setTimeout(() => ["wheel", "touchstart", "keydown"].forEach((ev) => window.addEventListener(ev, stop, opts)), 300);
    for (const [section, text] of TOUR) {
      if (id !== tourRef.current) return;
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
      setTip({ text });
      feel("wave", 1200);
      await wait(3200);
    }
    if (id !== tourRef.current) return;
    feel("dance", 2600);
    burst("stars");
    setTip({ text: "That’s the tour! Ask me anything ✦" });
    setTimeout(() => setTip(null), 4000);
  }, [feel, path, router]);

  // Page-driving actions run in order: navigate → wait for the page → spotlight / operate.
  const queue = useRef<Promise<void>>(Promise.resolve());
  const ensure = useCallback(async (sel: string, href: string) => {
    let el = document.querySelector(sel);
    if (!el) { router.push(href); el = await waitFor(sel); }
    return el;
  }, [router]);
  const drive = useCallback((a: Action) => {
    queue.current = queue.current.then(async () => {
      if (a.type === "navigate") {
        const p = projects.find((x) => x.slug === a.target);
        if (p) { router.push(`/work/${p.slug}`); await waitFor(`[data-page="${p.slug}"]`); window.scrollTo({ top: 0 }); }
        else if (path !== "/") { router.push(`/#${a.target}`); await waitFor(`#${a.target}`); }
        else document.getElementById(a.target)?.scrollIntoView({ behavior: "smooth" });
        await sleep(500);
      }
      if (a.type === "spotlight") {
        const kova = a.target.startsWith("kova-");
        const home = ["hats", "steps", "playground", "map"].includes(a.target);
        const el = await ensure(`[data-spot="${a.target}"]`, kova ? "/work/kova" : home ? "/" : path);
        if (el) { if (window.innerWidth < 760) setOpen(false); await spotlight(el, a.caption); }
      }
      if (a.type === "kova") {
        const sel = a.cmd === "hold_priya" ? '[data-spot="kova-approvals"]' : '[data-spot="kova-chart"]';
        const el = await ensure(sel, "/work/kova");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        await sleep(700);
        window.dispatchEvent(new CustomEvent("kova:cmd", { detail: a.cmd }));
        await sleep(900);
      }
      if (a.type === "demo") {
        const el = await ensure(`[data-demo="${a.demo}"]`, "/#playground");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        await sleep(700);
        window.dispatchEvent(new CustomEvent("pg:cmd", { detail: a.demo }));
        el?.classList.add("glow-tile");
        setTimeout(() => el?.classList.remove("glow-tile"), 2400);
        await sleep(600);
      }
    }).catch(() => {});
  }, [ensure, path, router]);

  const run = useCallback(
    (actions: Action[] = []) => {
      for (const a of actions) {
        if (a.type === "navigate" || a.type === "spotlight" || a.type === "kova" || a.type === "demo") { drive(a); continue; }
        if (a.type === "tour") tour();
        if (a.type === "mascot") feel(a.mood, a.mood === "sleep" ? 5000 : 2800);
        if (a.type === "theme") {
          document.documentElement.dataset.theme = a.value;
          try { localStorage.setItem("theme", a.value); } catch {}
        }
        if (a.type === "effect") burst(a.value);
        if (a.type === "highlight") {
          const go = () => {
            const el = document.querySelector(`[data-project="${a.project}"]`);
            if (!el) return;
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("glow");
            setTimeout(() => el.classList.remove("glow"), 3200);
          };
          if (path !== "/") { router.push("/#work"); setTimeout(go, 900); } else go();
        }
      }
    },
    [drive, feel, path, router, tour],
  );

  async function send(text: string) {
    const content = text.trim().slice(0, 1500);
    if (!content || busy || cooldown) return;
    const history = [...msgs.filter((m) => m !== GREETING && m.content), { role: "user" as const, content }];
    setMsgs((m) => [...m, { role: "user", content }, { role: "assistant", content: "", actions: [], steps: [], live: true }]);
    setInput("");
    setBusy(true);
    feel("think", 60_000);
    const patch = (f: (m: Msg) => Msg) => setMsgs((all) => [...all.slice(0, -1), f(all[all.length - 1])]);
    let acted = false;
    const ctrl = (abortRef.current = new AbortController());
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: path, messages: history.map(({ role, content }) => ({ role, content })).slice(-10) }),
      });
      if (res.status === 429) setCooldown(Number(res.headers.get("Retry-After") ?? 20));
      if (!res.body || !(res.headers.get("content-type") ?? "").includes("ndjson")) throw new Error("bad response");
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        const lines = buf.split("\n");
        buf = lines.pop()!;
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line) as { t: string; d?: string; a?: Action; label?: string };
          if (ev.t === "text" && ev.d) { setMood((m) => (m === "think" ? "talk" : m)); patch((m) => ({ ...m, content: m.content + ev.d })); }
          if (ev.t === "step" && ev.label) patch((m) => ({ ...m, steps: [...(m.steps ?? []), ev.label!] }));
          if (ev.t === "action" && ev.a) {
            const a = ev.a;
            patch((m) => ({ ...m, actions: [...(m.actions ?? []), a] }));
            if (a.type === "mascot") acted = true;
            run([a]);
          }
        }
      }
    } catch {
      if (ctrl.signal.aborted) patch((m) => ({ ...m, content: (m.content ? m.content + " " : "") + "_— stopped._" }));
      else patch((m) => ({ ...m, content: m.content || "I couldn’t reach my star brain. Check your connection, or WhatsApp Tahmina directly.", actions: m.content ? m.actions : [{ type: "contact", channel: "whatsapp" }] }));
    } finally {
      abortRef.current = null;
      patch((m) => ({ ...m, live: false }));
      setBusy(false);
      setMood((m) => (m === "think" || m === "talk" ? "idle" : m));
      if (!acted) feel("wave", 1600);
      setCooldown((c) => Math.max(c, 2)); // gentle client-side throttle
    }
  }

  useEffect(() => { sendRef.current = send; });

  const last = msgs[msgs.length - 1];
  const followups = everOpened && last?.role === "assistant" && !last.live ? last.actions?.find((a) => a.type === "followups")?.items : undefined;
  const suggestions = followups ?? (project ? [`Give me the 30-second version of ${project.name}`, "What was the hardest decision?", "How did she test it?", "Why should I hire Tahmina?"] : SUGGEST);

  return (
    <>
      <div className={`tara-wrap ${open ? "is-open" : ""}`} ref={wrapRef}>
        {tip && !open && (
          <button key={tip.text} className="tara-bubble" onClick={() => { const q = tip.prompt; show(true); if (q) setTimeout(() => sendRef.current(q), 350); }}>
            {tip.text}
          </button>
        )}
        <button className={`tara mood-${mood}`} aria-label={open ? "Close Tara" : "Open Tara, the portfolio assistant (⌘K)"} aria-expanded={open} onClick={() => (show(!open), feel("wave", 1400))}>
          <TaraSvg />
          <span className="tara-z">z</span>
          <span className="tara-heart">♥</span>
        </button>
      </div>

      <section className={`chat ${open ? "is-open" : ""}`} aria-label="Chat with Tara" aria-hidden={!open}>
        <header className="chat-head">
          <div className="chat-avatar"><TaraSvg /></div>
          <div>
            <strong>Tara</strong>
            <small>{busy ? "thinking…" : "Tahmina’s portfolio assistant"}</small>
          </div>
          <button className="chat-x" aria-label="Start over" title="Start over" onClick={() => { abortRef.current?.abort(); setMsgs([GREETING]); }} disabled={!everOpened || msgs.length < 2}>↺</button>
          <button className="chat-x" aria-label="Close" onClick={() => setOpen(false)}>✕</button>
        </header>

        <div className="chat-list" ref={listRef} aria-live="polite">
          {everOpened && msgs.map((m, i) => (
            <div key={i} className={`msg msg-${m.role} ${m.live ? "is-live" : ""}`}>
              {!!m.steps?.length && (
                <ul className="steps-mini">{m.steps.map((s, j) => <li key={j}>{s}</li>)}</ul>
              )}
              {m.role === "assistant" ? (
                m.content ? <Md text={m.content} /> : m.live && <span className="dots"><i /><i /><i /></span>
              ) : (
                <p>{m.content}</p>
              )}
              {m.actions?.map((a, j) => <ActionView key={j} a={a} />)}
            </div>
          ))}
        </div>

        <div className="chat-suggest">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)} disabled={busy || !!cooldown}>{s}</button>
          ))}
        </div>

        <form className="chat-form" onSubmit={(e) => (e.preventDefault(), send(input))}>
          <textarea
            ref={inputRef}
            value={input}
            maxLength={1500}
            rows={1}
            placeholder={cooldown ? `One moment… ${cooldown}s` : "Ask about Tahmina’s work…"}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            aria-label="Message"
          />
          {busy ? (
            <button type="button" className="stop" onClick={() => abortRef.current?.abort()} aria-label="Stop">■</button>
          ) : (
            <button type="submit" disabled={!!cooldown || !input.trim()} aria-label="Send">↑</button>
          )}
        </form>
        <p className="chat-note">AI can be wrong · only about Tahmina · <kbd>⌘K</kbd> · {input.length}/1500</p>
      </section>
    </>
  );
}

function ActionView({ a }: { a: Action }) {
  if (a.type === "card") {
    const p = projects.find((x) => x.slug === a.project);
    if (!p) return null;
    return (
      <Link href={`/work/${p.slug}`} className="chat-card">
        <Image src={`/work/${p.shot}.webp`} alt="" width={260} height={170} />
        <span><strong>{p.name}</strong><small>{p.tagline}</small></span>
      </Link>
    );
  }
  if (a.type === "contact") {
    const map = {
      whatsapp: ["WhatsApp " + profile.phone, profile.whatsappHref],
      phone: ["Call " + profile.phone, profile.phoneHref],
      linkedin: ["LinkedIn profile", profile.linkedin],
    } as const;
    const [label, href] = map[a.channel];
    return <a className="chat-btn" href={href} target="_blank" rel="noreferrer">{label} ↗</a>;
  }
  if (a.type === "skills") {
    return (
      <div className="chat-skills">
        {disciplines.map((d) => (
          <div key={d.name}>
            <span>{d.name}</span>
            <i style={{ ["--w" as string]: `${(d.level / 5) * 100}%`, ["--c" as string]: d.color }} />
          </div>
        ))}
      </div>
    );
  }
  if (a.type === "compare") return <CompareCard slugs={a.slugs} />;
  if (a.type === "fit") return <FitCard role={a.role} items={a.items} />;
  if (a.type === "draft") return <DraftCard channel={a.channel} text={a.text} />;
  if (a.type === "map") {
    return (
      <figure className="chat-map">
        <iframe
          title="Map of Dhaka showing North South University"
          src="https://www.openstreetmap.org/export/embed.html?bbox=90.33%2C23.72%2C90.52%2C23.88&layer=mapnik&marker=23.8151%2C90.4255"
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin"
        />
        <figcaption>📍 Dhaka, Bangladesh · North South University (Bashundhara)</figcaption>
      </figure>
    );
  }
  return null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitFor(sel: string, ms = 4000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const el = document.querySelector(sel);
    if (el) return el;
    await sleep(100);
  }
  return null;
}

/** Dim the page, cut a glowing hole around `el`, show a caption. Click or 5 s to dismiss. */
async function spotlight(el: Element, caption: string) {
  document.querySelector(".spot")?.remove();
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  await sleep(650);
  const chat = document.querySelector(".chat.is-open");
  chat?.classList.add("peek"); // slide the chat aside so it never covers what we point at
  const hole = document.createElement("div");
  hole.className = "spot";
  const cap = document.createElement("div");
  cap.className = "spot-cap";
  cap.textContent = caption || "Look here ✦";
  hole.appendChild(cap);
  document.body.appendChild(hole);
  let raf = 0;
  const place = () => {
    const r = el.getBoundingClientRect(), pad = 10;
    Object.assign(hole.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
    cap.dataset.below = r.top < 120 ? "1" : "";
    raf = requestAnimationFrame(place);
  };
  place();
  await new Promise<void>((done) => {
    const end = () => { cancelAnimationFrame(raf); hole.classList.add("out"); chat?.classList.remove("peek"); setTimeout(() => hole.remove(), 350); window.removeEventListener("pointerdown", end); done(); };
    setTimeout(end, 5200);
    setTimeout(() => window.addEventListener("pointerdown", end), 300);
  });
}

function CompareCard({ slugs }: { slugs: string[] }) {
  const ps = slugs.map((s) => projects.find((p) => p.slug === s)!).filter(Boolean);
  const rows: [string, (p: (typeof projects)[number]) => React.ReactNode][] = [
    ["Sector", (p) => p.sector],
    ["Year", (p) => p.year],
    ["Hats", (p) => <span className="dots-mini">{p.disciplines.map((d) => <i key={d} title={d} style={{ background: disciplines.find((x) => x.name === d)?.color }} />)}</span>],
    ["AI rules", (p) => (p.ai ? `${p.ai.prompt.length - 2} rules` : "—")],
    ["QA cases", (p) => `${p.qa.matrix.length} × ${p.qa.cols.length} matrix`],
    ["Big call", (p) => p.decisions[0].title],
  ];
  return (
    <div className="cmp" style={{ ["--n" as string]: ps.length }}>
      <div className="cmp-row cmp-head"><span />{ps.map((p) => <Link key={p.slug} href={`/work/${p.slug}`} style={{ ["--tint" as string]: p.tint }}>{p.name}</Link>)}</div>
      {rows.map(([label, f]) => (
        <div key={label} className="cmp-row"><span>{label}</span>{ps.map((p) => <div key={p.slug}>{f(p)}</div>)}</div>
      ))}
    </div>
  );
}

function FitCard({ role, items }: { role: string; items: { req: string; evidence: string; project?: string; level: "strong" | "partial" | "gap" }[] }) {
  const score = items.reduce((n, i) => n + (i.level === "strong" ? 1 : i.level === "partial" ? 0.5 : 0), 0) / items.length;
  return (
    <div className="fit">
      <div className="fit-head">
        <div><small>Fit check</small><strong>{role}</strong></div>
        <svg viewBox="0 0 36 36" className="fit-ring" aria-label={`${Math.round(score * 100)}% evidenced`}>
          <circle cx="18" cy="18" r="15" />
          <circle cx="18" cy="18" r="15" pathLength={1} style={{ strokeDashoffset: 1 - score }} className="on" />
          <text x="18" y="21" textAnchor="middle">{Math.round(score * 100)}%</text>
        </svg>
      </div>
      <ul>
        {items.map((i, k) => (
          <li key={k} className={`lv-${i.level}`} style={{ animationDelay: `${k * 90}ms` }}>
            <b>{i.req}</b>
            <span>{i.evidence || (i.level === "gap" ? "Not shown in the portfolio — worth asking her." : "")}</span>
            <em>{i.level}{i.project && <> · <Link href={`/work/${i.project}`}>{projects.find((p) => p.slug === i.project)?.name} →</Link></>}</em>
          </li>
        ))}
      </ul>
      <small className="fit-note">Based only on what’s in this portfolio.</small>
    </div>
  );
}

function DraftCard({ channel, text }: { channel: "whatsapp" | "linkedin"; text: string }) {
  const [body, setBody] = useState(text);
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(body); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {} };
  return (
    <div className="draft">
      <small>Draft · edit before sending</small>
      <textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, 600))} rows={4} aria-label="Message draft" />
      <div className="draft-row">
        {channel === "whatsapp" ? (
          <a className="chat-btn" href={`${profile.whatsappHref}?text=${encodeURIComponent(body)}`} target="_blank" rel="noreferrer">Open in WhatsApp ↗</a>
        ) : (
          <a className="chat-btn" href={profile.linkedin} target="_blank" rel="noreferrer" onClick={copy}>Copy & open LinkedIn ↗</a>
        )}
        <button onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button>
      </div>
    </div>
  );
}

// Safe markdown: no raw HTML, a small element allowlist, and links only to this site or her own profiles.
const SAFE_HOSTS = ["bd.linkedin.com", "www.linkedin.com", "wa.me"];
function Md({ text }: { text: string }) {
  return (
    <div className="md">
      <Markdown
        allowedElements={["p", "strong", "em", "ul", "ol", "li", "code", "a", "br", "blockquote"]}
        unwrapDisallowed
        components={{
          a({ href = "", children }) {
            if (href.startsWith("/") && !href.startsWith("//")) return <Link href={href}>{children}</Link>;
            try {
              if (SAFE_HOSTS.includes(new URL(href).hostname)) return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
            } catch {}
            return <>{children}</>;
          },
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}

function burst(kind: "stars" | "confetti" | "shooting-star") {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const layer = document.createElement("div");
  layer.className = `fx fx-${kind}`;
  const n = kind === "shooting-star" ? 3 : 36;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("i");
    s.style.setProperty("--x", `${Math.random() * 100}vw`);
    s.style.setProperty("--d", `${Math.random() * 0.8}s`);
    s.style.setProperty("--r", `${Math.random() * 720 - 360}deg`);
    s.style.setProperty("--h", `${[220, 45, 15, 140, 265][i % 5]}`);
    layer.appendChild(s);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 3200);
}

function TaraSvg() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <radialGradient id="tg" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#FFF1A8" />
          <stop offset="0.6" stopColor="#FFD24A" />
          <stop offset="1" stopColor="#F2A93B" />
        </radialGradient>
      </defs>
      <g className="tara-body">
        <path d="M60 6 C66 34 76 44 112 52 C78 62 70 72 64 112 C58 76 48 66 8 60 C44 50 54 40 60 6 Z" fill="url(#tg)" stroke="#E0952A" strokeWidth="2" strokeLinejoin="round" />
        <g className="tara-eyes"><g className="tara-look">
          <ellipse cx="50" cy="56" rx="4.2" ry="5.6" fill="#141A33" />
          <ellipse cx="70" cy="56" rx="4.2" ry="5.6" fill="#141A33" />
          <circle cx="51.5" cy="54" r="1.4" fill="#fff" />
          <circle cx="71.5" cy="54" r="1.4" fill="#fff" />
        </g></g>
        <ellipse cx="43" cy="66" rx="5" ry="3" fill="#FF8A80" opacity=".6" />
        <ellipse cx="77" cy="66" rx="5" ry="3" fill="#FF8A80" opacity=".6" />
        <path className="tara-mouth" d="M53 66 Q60 73 67 66" stroke="#141A33" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
