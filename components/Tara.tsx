"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { disciplines, profile, projects } from "@/lib/content";
import type { Action } from "@/lib/guard";
import Markdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string; actions?: Action[]; steps?: string[]; live?: boolean };

const SUGGEST = ["Why should I hire Tahmina?", "Show me her best AI project", "Make it night ✦", "Make Tara dance", "How can I contact her?"];
const GREETING: Msg = {
  role: "assistant",
  content: "Hi, I’m Tara ✦ — Tahmina’s little helper. Ask me about her work, skills or how to reach her. I can also move things around the page!",
};

export default function Tara() {
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<string>("idle");
  const [bubble, setBubble] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const moodTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // restore theme
  useEffect(() => {
    try {
      const theme = localStorage.getItem("theme");
      if (theme === "night" || theme === "day") document.documentElement.dataset.theme = theme;
    } catch {}
    const t = setTimeout(() => setBubble(true), 2600);
    const u = setTimeout(() => setBubble(false), 9000);
    return () => (clearTimeout(t), clearTimeout(u));
  }, []);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);
  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const sendRef = useRef<(t: string) => void>(() => {});
  useEffect(() => {
    const on = (e: Event) => {
      setOpen(true);
      setBubble(false);
      const q = (e as CustomEvent<string | undefined>).detail;
      if (q) setTimeout(() => sendRef.current(q), 350);
    };
    window.addEventListener("tara:open", on);
    return () => window.removeEventListener("tara:open", on);
  }, []);

  const feel = useCallback((m: string, ms = 2800) => {
    setMood(m);
    clearTimeout(moodTimer.current);
    moodTimer.current = setTimeout(() => setMood("idle"), ms);
  }, []);

  const run = useCallback(
    (actions: Action[] = []) => {
      for (const a of actions) {
        if (a.type === "mascot") feel(a.mood, a.mood === "sleep" ? 5000 : 2800);
        if (a.type === "theme") {
          document.documentElement.dataset.theme = a.value;
          try { localStorage.setItem("theme", a.value); } catch {}
        }
        if (a.type === "effect") burst(a.value);
        if (a.type === "navigate") {
          if (projects.some((p) => p.slug === a.target)) router.push(`/work/${a.target}`);
          else if (path !== "/") router.push(`/#${a.target}`);
          else document.getElementById(a.target)?.scrollIntoView({ behavior: "smooth" });
        }
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
    [feel, path, router],
  );

  async function send(text: string) {
    const content = text.trim().slice(0, 600);
    if (!content || busy || cooldown) return;
    const history = [...msgs.filter((m) => m !== GREETING && m.content), { role: "user" as const, content }];
    setMsgs((m) => [...m, { role: "user", content }, { role: "assistant", content: "", actions: [], steps: [], live: true }]);
    setInput("");
    setBusy(true);
    feel("think", 60_000);
    const patch = (f: (m: Msg) => Msg) => setMsgs((all) => [...all.slice(0, -1), f(all[all.length - 1])]);
    let acted = false;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })).slice(-10) }),
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
      patch((m) => ({ ...m, content: m.content || "I couldn’t reach my star brain. Check your connection, or WhatsApp Tahmina directly.", actions: m.content ? m.actions : [{ type: "contact", channel: "whatsapp" }] }));
    } finally {
      patch((m) => ({ ...m, live: false }));
      setBusy(false);
      setMood((m) => (m === "think" || m === "talk" ? "idle" : m));
      if (!acted) feel("wave", 1600);
      setCooldown((c) => Math.max(c, 2)); // gentle client-side throttle
    }
  }

  useEffect(() => { sendRef.current = send; });

  return (
    <>
      <div className={`tara-wrap ${open ? "is-open" : ""}`}>
        {bubble && !open && (
          <button className="tara-bubble" onClick={() => (setOpen(true), setBubble(false))}>
            Hi! I’m Tara ✦ ask me about Tahmina
          </button>
        )}
        <button className={`tara mood-${mood}`} aria-label={open ? "Close Tara" : "Open Tara, the portfolio assistant"} onClick={() => (setOpen((v) => !v), setBubble(false), feel("wave", 1400))}>
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
          <button className="chat-x" aria-label="Close" onClick={() => setOpen(false)}>✕</button>
        </header>

        <div className="chat-list" ref={listRef} aria-live="polite">
          {msgs.map((m, i) => (
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
          {SUGGEST.map((s) => (
            <button key={s} onClick={() => send(s)} disabled={busy || !!cooldown}>{s}</button>
          ))}
        </div>

        <form className="chat-form" onSubmit={(e) => (e.preventDefault(), send(input))}>
          <textarea
            ref={inputRef}
            value={input}
            maxLength={600}
            rows={1}
            placeholder={cooldown ? `One moment… ${cooldown}s` : "Ask about Tahmina’s work…"}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            aria-label="Message"
          />
          <button type="submit" disabled={busy || !!cooldown || !input.trim()} aria-label="Send">↑</button>
        </form>
        <p className="chat-note">AI can be wrong · answers only about Tahmina · {input.length}/600</p>
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
        <g className="tara-eyes">
          <ellipse cx="50" cy="56" rx="4.2" ry="5.6" fill="#141A33" />
          <ellipse cx="70" cy="56" rx="4.2" ry="5.6" fill="#141A33" />
          <circle cx="51.5" cy="54" r="1.4" fill="#fff" />
          <circle cx="71.5" cy="54" r="1.4" fill="#fff" />
        </g>
        <ellipse cx="43" cy="66" rx="5" ry="3" fill="#FF8A80" opacity=".6" />
        <ellipse cx="77" cy="66" rx="5" ry="3" fill="#FF8A80" opacity=".6" />
        <path className="tara-mouth" d="M53 66 Q60 73 67 66" stroke="#141A33" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
