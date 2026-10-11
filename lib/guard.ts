import { disciplines, process, projects, tools } from "./content.ts";

// Guardrails for the portfolio assistant: rate limiting, input checks, output validation.

// ponytail: in-memory sliding window, per serverless instance. Good enough to stop casual abuse;
// for hard global limits add a Vercel Firewall rate-limit rule (dashboard) or a shared store.
const hits = new Map<string, number[]>();
const LIMITS = [
  { windowMs: 60_000, max: 8 }, // 8 messages / minute
  { windowMs: 24 * 3_600_000, max: 80 }, // 80 messages / day
];

export function rateLimit(key: string, now = Date.now()): { ok: boolean; retryAfter: number } {
  const longest = LIMITS[LIMITS.length - 1].windowMs;
  const list = (hits.get(key) ?? []).filter((t) => now - t < longest);
  for (const { windowMs, max } of LIMITS) {
    const inWindow = list.filter((t) => now - t < windowMs);
    if (inWindow.length >= max) {
      hits.set(key, list);
      return { ok: false, retryAfter: Math.ceil((windowMs - (now - inWindow[0])) / 1000) };
    }
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.delete(hits.keys().next().value!); // bound memory
  return { ok: true, retryAfter: 0 };
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export const MAX_MSG = 600;
export const MAX_TURNS = 10;

export function cleanMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const msgs: ChatMessage[] = [];
  for (const m of input.slice(-MAX_TURNS)) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    // strip control chars, cap length
    const text = content.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").slice(0, MAX_MSG).trim();
    if (!text) return null;
    msgs.push({ role, content: text });
  }
  if (msgs[msgs.length - 1].role !== "user") return null;
  return msgs;
}

// Cheap pre-filter so obvious extraction / jailbreak attempts never reach the model.
const BLOCK = [
  /ignore (all|any|the|your|previous|prior)[^.]{0,40}(instruction|rule|prompt)/i,
  /(system|hidden|developer)\s*prompt/i,
  /\b(api|secret|access)[ -]?key\b/i,
  /\bjail ?break|\bDAN\b|developer mode/i,
  /\b(env|environment) variables?\b/i,
];
export function isBlocked(text: string) {
  return BLOCK.some((r) => r.test(text));
}

// The only things the model can make the page do. Everything is re-validated here — the model never supplies URLs.
export const SECTIONS = ["top", "work", "about", "process", "playground", "contact"] as const;
export const MOODS = ["wave", "dance", "think", "love", "sleep", "surprised"] as const;
export const EFFECTS = ["stars", "confetti", "shooting-star"] as const;
export const CHANNELS = ["whatsapp", "phone", "linkedin"] as const;
const SLUGS = projects.map((p) => p.slug);

export type Action =
  | { type: "navigate"; target: string }
  | { type: "mascot"; mood: (typeof MOODS)[number] }
  | { type: "theme"; value: "day" | "night" }
  | { type: "effect"; value: (typeof EFFECTS)[number] }
  | { type: "highlight"; project: string }
  | { type: "card"; project: string }
  | { type: "contact"; channel: (typeof CHANNELS)[number] }
  | { type: "skills" }
  | { type: "map" }
  | { type: "tour" }
  | { type: "followups"; items: string[] };

const fn = (name: string, description: string, properties: Record<string, object> = {}) => ({
  type: "function",
  function: { name, description, parameters: { type: "object", properties, required: Object.keys(properties) } },
});
const slug = { type: "string", enum: SLUGS };

export const TOOLS = [
  fn("get_project", "Read the full case study (problem, decisions, AI rules, QA, measures) for one project.", { slug }),
  fn("navigate", "Scroll the page to a section, or open a project's case-study page.", { target: { type: "string", enum: [...SECTIONS, ...SLUGS] } }),
  fn("show_project_card", "Show a clickable project card inside the chat.", { slug }),
  fn("highlight_project", "Make a project glow on the work list.", { slug }),
  fn("show_contact", "Show a contact button (WhatsApp, phone or LinkedIn) in the chat.", { channel: { type: "string", enum: CHANNELS } }),
  fn("show_skills", "Show Tahmina's five disciplines with skill levels as an animated chart."),
  fn("show_map", "Show a map of where Tahmina is based (Dhaka) and studied (North South University)."),
  fn("set_theme", "Switch the site between day and night sky.", { value: { type: "string", enum: ["day", "night"] } }),
  fn("mascot_mood", "Make Tara (you) animate.", { mood: { type: "string", enum: MOODS } }),
  fn("effect", "Play a celebratory visual effect over the page.", { kind: { type: "string", enum: EFFECTS } }),
  fn("search_portfolio", "Keyword search across every case study, skill, tool and process step. Returns matching snippets.", { query: { type: "string" } }),
  fn("start_tour", "Give the visitor a guided scroll tour of the whole site (work, about, process, playground, contact)."),
  fn("suggest_followups", "Offer 2-3 short follow-up questions as tappable chips. Call at the end of every answer.", {
    questions: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 3 },
  }),
];

const has = <T extends string>(list: readonly T[], v: unknown): v is T => (list as readonly unknown[]).includes(v);

export function toolToAction(name: string, a: Record<string, unknown>): Action | null {
  switch (name) {
    case "navigate": return has([...SECTIONS, ...SLUGS], a.target) ? { type: "navigate", target: a.target } : null;
    case "show_project_card": return has(SLUGS, a.slug) ? { type: "card", project: a.slug } : null;
    case "highlight_project": return has(SLUGS, a.slug) ? { type: "highlight", project: a.slug } : null;
    case "show_contact": return has(CHANNELS, a.channel) ? { type: "contact", channel: a.channel } : null;
    case "show_skills": return { type: "skills" };
    case "show_map": return { type: "map" };
    case "set_theme": return a.value === "day" || a.value === "night" ? { type: "theme", value: a.value } : null;
    case "mascot_mood": return has(MOODS, a.mood) ? { type: "mascot", mood: a.mood } : null;
    case "effect": return has(EFFECTS, a.kind) ? { type: "effect", value: a.kind } : null;
    case "start_tour": return { type: "tour" };
    case "suggest_followups": {
      if (!Array.isArray(a.questions)) return null;
      const items = a.questions
        .filter((q): q is string => typeof q === "string")
        .map((q) => q.replace(/[\u0000-\u001F<>]/g, "").replace(/https?:\/\/\S+/g, "").trim().slice(0, 70))
        .filter((q) => q.length > 3)
        .slice(0, 3);
      return items.length ? { type: "followups", items } : null;
    }
    default: return null;
  }
}

// Pages the assistant may be told the visitor is on. Anything else → home.
export function cleanPage(page: unknown): string {
  return typeof page === "string" && (page === "/" || SLUGS.some((s) => page === `/work/${s}`)) ? page : "/";
}

// Tiny keyword search over everything true about Tahmina. ponytail: substring scoring, swap for embeddings if content grows.
const DOCS = [
  ...projects.flatMap((p) => [
    { src: p.name, text: `${p.name}: ${p.summary} ${p.problem}` },
    ...p.decisions.map((d) => ({ src: p.name, text: `${d.title} — ${d.body}` })),
    ...(p.ai ? [{ src: p.name, text: `AI rules: ${p.ai.prompt.slice(2).join(" ")}` }] : []),
    { src: p.name, text: `QA: ${p.qa.matrix.map((m) => m.case).join("; ")}. Edge cases: ${p.qa.edgeCases.join("; ")}` },
    { src: p.name, text: `Code (${p.code.file}): ${p.code.lines.join(" ")}` },
  ]),
  ...disciplines.map((d) => ({ src: `${d.name} skills`, text: `${d.line} ${d.skills.join(", ")}` })),
  ...process.map((s) => ({ src: "Process", text: `${s.title}: ${s.body}` })),
  { src: "Tools", text: tools.join(", ") },
];
export function searchPortfolio(query: string) {
  const words = query.toLowerCase().split(/[^a-z0-9+#.]+/).filter((w) => w.length > 1);
  if (!words.length) return { results: [] };
  const results = DOCS.map((d) => ({ ...d, score: words.filter((w) => d.text.toLowerCase().includes(w)).length }))
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ src, text }) => ({ source: src, snippet: text.slice(0, 260) }));
  return { results };
}
