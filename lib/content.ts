// Single source of truth for the site AND the AI assistant's knowledge.
// Only put facts here that are true — the assistant is told to never go beyond this file.

export const profile = {
  name: "Tahmina Sultana",
  role: "Product designer · UI/UX · Frontend · QA · AI-native",
  location: "Dhaka, Bangladesh",
  education: "North South University — graduated 2025",
  phone: "+880 1750-793849",
  phoneHref: "tel:+8801750793849",
  whatsappHref: "https://wa.me/8801750793849",
  linkedin: "https://bd.linkedin.com/in/tahmina-sultana-188051247",
  availability: "Open to product design and design-engineering roles — remote or Dhaka",
  intro:
    "A North South University graduate (2025) who works across the whole life of a feature — the research, the interface, how the AI behaves, the React, and the test plan.",
};

export type Discipline = "Product" | "UI/UX" | "Frontend" | "QA" | "AI-native";

export const disciplines: {
  name: Discipline;
  color: string;
  tint: string;
  line: string;
  skills: string[];
  level: number;
}[] = [
  { name: "Product", color: "#C2562F", tint: "#F6D8C9", level: 4.5, line: "I find the one job worth doing — and say “not now” to the rest.", skills: ["Discovery", "Jobs-to-be-done", "PRDs", "Success metrics"] },
  { name: "UI/UX", color: "#2A3F9E", tint: "#D9DEF5", level: 5, line: "Flows and systems that feel obvious later. Accessible by default.", skills: ["IA", "Interaction", "Motion", "Design tokens", "WCAG 2.2"] },
  { name: "Frontend", color: "#3E8E57", tint: "#D6EBDA", level: 4, line: "I build the components I design, in React and TypeScript.", skills: ["React", "Next.js", "TypeScript", "Storybook", "Three.js"] },
  { name: "QA", color: "#B8860B", tint: "#F5E5BE", level: 4.5, line: "The test plan comes before the first screen. Then I try to break it.", skills: ["Test matrices", "Playwright", "VoiceOver", "Bug bashes"] },
  { name: "AI-native", color: "#7B6CFF", tint: "#E2DEFF", level: 4.5, line: "I design model behaviour like screens — the bad answers first.", skills: ["Prompts", "Evals", "Guardrails", "RAG + tool-use UX"] },
];

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  sector: string;
  year: string;
  tint: string;
  dark?: boolean;
  art: string;
  shot: string;
  phones: string[];
  summary: string;
  disciplines: Discipline[];
  role: string;
  problem: string;
  decisions: { title: string; body: string; img: string }[];
  ai?: { file: string; prompt: string[] };
  qa: { matrix: { case: string; result: ("pass" | "warn" | "fail")[] }[]; cols: string[]; edgeCases: string[] };
  code: { file: string; lines: string[] };
  metrics: { value: string; label: string }[];
  next: string;
};

export const projects: Project[] = [
  {
    slug: "kova", name: "Kova", tagline: "Making a six-figure payroll feel boring.", sector: "Fintech · business banking", year: "2026", tint: "#F2C9B4",
    art: "g01", shot: "kova", phones: [],
    summary: "Business banking for teams that pay people in 38 countries. I redesigned payouts — the scariest button in the product — around one question: is anything unusual in this batch?",
    disciplines: ["Product", "UI/UX", "Frontend", "QA"], role: "Concept project · product design + React",
    problem: "Finance leads approve large payroll batches by exporting them to a spreadsheet first. The product shows everything, so it highlights nothing — the one recipient whose bank details changed is buried in row 31.",
    decisions: [
      { title: "Show what changed, not what’s there", body: "The batch highlights the one recipient whose bank details changed this week — and holds them, so the other 41 can go.", img: "kova-payouts" },
      { title: "One approval bar, always in reach", body: "Who approved, who’s left, and the exact action, pinned to the bottom. “Hold Priya & send 41” is a first-class button.", img: "kova-payouts" },
      { title: "Routing you can read", body: "Every payout shows its rail — ACH, SEPA, BEFTN or USDC — and arrival time before you sign.", img: "kova-bento" },
    ],
    qa: { cols: ["Desktop", "iPad", "Screen reader", "Slow 3G"], matrix: [
      { case: "Batch of 42, one changed", result: ["pass", "pass", "pass", "pass"] },
      { case: "Approver goes offline mid-sign", result: ["pass", "pass", "warn", "pass"] },
      { case: "FX rate expires during review", result: ["pass", "pass", "pass", "fail"] },
      { case: "RTL recipient names", result: ["pass", "warn", "pass", "pass"] },
    ], edgeCases: ["Double-click must never approve twice", "Amounts are read with their currency", "৳ symbol never clips in the bar", "Held recipients survive a refresh"] },
    code: { file: "payouts/ApprovalBar.tsx", lines: ["export function ApprovalBar({ batch }: Props) {", "  const held = batch.items.filter(changedBankDetails({ days: 7 }))", "  const ready = batch.items.length - held.length", "  return (", "    <Bar tone={held.length ? \"review\" : \"ready\"} aria-live=\"polite\">", "      {held.length > 0 && <Button>Hold {names(held)} & send {ready}</Button>}", "      <Button primary holdMs={1200}>Approve {money(batch.total)}</Button>", "    </Bar>", "  )", "}"] },
    metrics: [{ value: "Time to approve", label: "a batch, inside the product" }, { value: "Misrouted payouts", label: "the number that must stay at zero" }, { value: "Spreadsheet exports", label: "should drop as trust goes up" }],
    next: "“Recall within 10 minutes” — people trust a button more when they know they can undo it.",
  },
  {
    slug: "relay", name: "Relay", tagline: "An agent you actually let drive.", sector: "AI agents", year: "2026", tint: "#CFD6F2",
    art: "g08", shot: "relay", phones: ["m-relay-1", "m-relay-2", "m-relay-0"],
    summary: "Relay plans, runs and reports multi-step work. I designed how it shows its plan, when it stops to ask, and how you watch it from your lock screen — and I wrote its system prompt.",
    disciplines: ["Product", "UI/UX", "AI-native", "QA"], role: "Concept project · product + prompt design",
    problem: "People don’t trust agents that “just do things”. They can’t see what the agent is about to do, or how to stop it once it starts spending money.",
    decisions: [
      { title: "A plan before any action", body: "Every run starts with a five-line plan you can edit. Nothing touches money, messages or files until you tap Run.", img: "relay" },
      { title: "Hold to confirm at four risky moments", body: "Pay, send, delete, invite — each is a hold-to-confirm gate with the exact consequence written out.", img: "m-relay-1" },
      { title: "Watch it from your lock screen", body: "A Live Activity shows the current step, so you can leave the app without losing trust.", img: "m-relay-0" },
    ],
    ai: { file: "prompts/relay.system.md", prompt: ["You are Relay. You plan, then act — never the reverse.", "Rules:", "- Before any step that spends, sends, deletes or invites, stop and ask.", "- If two options are within 10% on price, ask; don’t pick.", "- Say “I couldn’t” plainly. Never invent a confirmation.", "- Keep plans to five lines a person can scan in 12 seconds."] },
    qa: { cols: ["Web", "iOS", "Live Activity", "VoiceOver"], matrix: [
      { case: "Run with a payment gate", result: ["pass", "pass", "pass", "pass"] },
      { case: "Phone locked mid-run", result: ["pass", "pass", "pass", "warn"] },
      { case: "Prompt injection in an email", result: ["pass", "pass", "pass", "pass"] },
      { case: "Two runs at once", result: ["pass", "fail", "pass", "pass"] },
    ], edgeCases: ["Never retry a payment after a timeout", "A scroll gesture can’t trigger “hold to send”", "Long plans never truncate silently", "VoiceOver reads the step counter"] },
    code: { file: "gates/HoldToConfirm.tsx", lines: ["export function HoldToConfirm({ action, onConfirm }: Props) {", "  const [p, setP] = useState(0)", "  const hold = usePressHold({ ms: 1200, onProgress: setP, onDone: onConfirm })", "  return (", "    <GateButton {...hold} aria-describedby=\"consequence\">", "      <Ring value={p} /> Hold to {action.verb} {action.object}", "    </GateButton>", "  )", "}"] },
    metrics: [{ value: "Plans approved first time", label: "a proxy for “the plan made sense”" }, { value: "Unconfirmed spends", label: "must be zero — always" }, { value: "Median plan review", label: "target: under 15 seconds" }],
    next: "Trust that grows: after ten clean bookings, Relay could ask once a week instead of every time.",
  },
  {
    slug: "lattice", name: "Lattice", tagline: "Proteins you can hold in your hand.", sector: "Edtech · 3D + AR", year: "2025", tint: "#1A2150", dark: true,
    art: "g05", shot: "lattice", phones: ["m-lattice-0", "m-lattice-2", "m-lattice-4"],
    summary: "A 3D viewer built from real Protein Data Bank files, an AR flow from study card to desk in three taps, and quizzes you answer by pointing.",
    disciplines: ["Product", "UI/UX", "Frontend", "QA"], role: "Concept project · design + Three.js prototype",
    problem: "Biology students memorise shapes they’ve never seen. Diagrams are flat, and classroom 3D models are rare and shared.",
    decisions: [
      { title: "Every model is real data", body: "Structures come straight from the Protein Data Bank — 4HHB for hemoglobin, 1BNA for DNA.", img: "lattice" },
      { title: "Three taps to the desk", body: "Card → View in AR → place. Surface detection starts while the card is still open, so placing feels instant.", img: "lattice-app" },
      { title: "Quizzes you answer by pointing", body: "“Aim at an α chain.” A reticle locks on, and misses become tomorrow’s five-minute review.", img: "m-lattice-4" },
    ],
    qa: { cols: ["Older iPhone", "New iPhone", "iPad", "Android"], matrix: [
      { case: "Place on a glossy desk", result: ["warn", "pass", "pass", "warn"] },
      { case: "Low evening light", result: ["pass", "pass", "pass", "fail"] },
      { case: "4,556-atom model at 60 fps", result: ["pass", "pass", "pass", "warn"] },
      { case: "Colour-blind palettes", result: ["pass", "pass", "pass", "pass"] },
    ], edgeCases: ["AR session survives an incoming call", "Chain colours work for deuteranopia", "Reticle visible on white desks", "Large models show load progress"] },
    code: { file: "viewer/useStructure.ts", lines: ["export function useStructure(pdbId: string) {", "  const atoms = usePdb(pdbId)                // files.rcsb.org", "  const mesh = useMemo(() => instancedSpheres(atoms, {", "    radius: vdw, color: byChain(palette.colourSafe),", "  }), [atoms])", "  useLod(mesh, { far: 0.35, near: 1 })         // 60 fps on phones", "  return mesh", "}"] },
    metrics: [{ value: "Quiz scores vs 2D", label: "same lesson, A/B classes" }, { value: "Placed a model in AR", label: "in the first lesson" }, { value: "Taps to AR", label: "must stay at three" }],
    next: "Let teachers build their own “take it apart” moments for any structure.",
  },
  {
    slug: "vital", name: "Vital", tagline: "Health data, in one calm sentence.", sector: "Health · AI", year: "2025", tint: "#F6CFC6",
    art: "g02", shot: "vital", phones: ["m-vital-0", "m-vital-1", "m-vital-3"],
    summary: "A daily read that compares you to yourself, a blood-test explainer with real ranges, and a one-page GP brief — with an AI that explains and never diagnoses.",
    disciplines: ["Product", "UI/UX", "AI-native", "Frontend"], role: "Concept project · product design + data-viz",
    problem: "People have the data — watch, blood tests, GP notes — but not the meaning. A lab PDF lists numbers, and a 10-minute GP visit is spent finding the right result.",
    decisions: [
      { title: "Compare to your own baseline", body: "Every chart shows your normal range, not the population’s. A dip only matters when it leaves your band.", img: "vital" },
      { title: "A range bar for every marker", body: "Ferritin 18 sits visibly below 30–400, with a plain-English meaning and the question to ask your GP.", img: "m-vital-1" },
      { title: "A one-page GP brief", body: "Symptoms, what changed, the evidence and three questions — shared before you arrive.", img: "m-vital-3" },
    ],
    ai: { file: "prompts/vital.explain.md", prompt: ["You explain a person’s own health data to them.", "Rules:", "- Never diagnose. Say “worth raising with your GP”.", "- Every number keeps its unit and its range.", "- Compare to the person’s baseline before any average.", "- If a value is urgent, show the emergency card. Nothing else."] },
    qa: { cols: ["iOS", "Watch", "VoiceOver", "Large text"], matrix: [
      { case: "Marker below range", result: ["pass", "pass", "pass", "pass"] },
      { case: "Urgent value", result: ["pass", "pass", "pass", "pass"] },
      { case: "Two labs, different units", result: ["pass", "pass", "warn", "pass"] },
      { case: "Offline at the clinic", result: ["pass", "pass", "pass", "pass"] },
    ], edgeCases: ["Never mix mmol/L and mg/dL in one chart", "Range bar readable at XXL text", "Screen readers say the unit", "Sleep chart crosses midnight"] },
    code: { file: "components/RangeBar.tsx", lines: ["export function RangeBar({ value, low, high, unit }: Props) {", "  const pos = clamp((value - low) / (high - low), -0.15, 1.15)", "  return (", "    <Track role=\"meter\" aria-valuenow={value}", "      aria-valuetext={`${value} ${unit}, range ${low}–${high}`}>", "      <Dot tone={pos < 0 || pos > 1 ? \"amber\" : \"mint\"} at={pos} />", "    </Track>", "  )", "}"] },
    metrics: [{ value: "Open the daily read", label: "days per week" }, { value: "GP visit prep time", label: "self-reported" }, { value: "Diagnoses made", label: "zero, by design" }],
    next: "A weekly “all clear” that’s worded as carefully as the warnings.",
  },
  {
    slug: "tally", name: "Tally", tagline: "Money, explained like a friend.", sector: "Personal finance · AI", year: "2025", tint: "#DCE8B8",
    art: "g06", shot: "tally", phones: ["m-tally-0", "m-tally-2", "m-tally-3"],
    summary: "Answer the question people actually ask — a 30-day forecast, a chat that shows its working, and a subscription killer that never shames.",
    disciplines: ["Product", "UI/UX", "AI-native", "Frontend"], role: "Concept project · brand + product design",
    problem: "Budgeting apps tell people what they did wrong — red bars and categories — never what they can do next. So people open them once, feel guilty and leave.",
    decisions: [
      { title: "Safe to spend, until payday", body: "One number, a 30-day forecast and a floor you set. Tally warns you before the 17th, not after.", img: "tally" },
      { title: "Ask, and see the maths", body: "“Can I afford Lisbon?” returns a costed answer, the transactions behind it, and one change that makes it fit.", img: "m-tally-2" },
      { title: "Never shame, always suggest", body: "Every warning comes with exactly one action: move £200, pause a subscription.", img: "m-tally-3" },
    ],
    ai: { file: "prompts/tally.ask.md", prompt: ["You answer money questions for one person, using their data.", "Rules:", "- Lead with yes / no / not yet. Then the number.", "- Show the three biggest inputs, linked to transactions.", "- Offer exactly one change that would make it work.", "- Never use: should, irresponsible, overspent, bad."] },
    qa: { cols: ["iOS", "Web", "Bank A", "Bank B"], matrix: [
      { case: "Payday moves for a holiday", result: ["pass", "pass", "pass", "warn"] },
      { case: "Refund after the forecast", result: ["pass", "pass", "pass", "pass"] },
      { case: "Card spend abroad", result: ["pass", "pass", "pass", "fail"] },
      { case: "Dynamic Type XXL", result: ["pass", "pass", "pass", "pass"] },
    ], edgeCases: ["Pending transactions never double-count", "Foreign spends converted once", "“Safe to spend” never wraps", "Missing merchant logos fall back to initials"] },
    code: { file: "forecast/Forecast.tsx", lines: ["export function Forecast({ txns, floor, today }: Props) {", "  const days = project(txns, { horizon: 30, recurring: detectRecurring(txns) })", "  const dip = days.find(d => d.balance < floor)", "  return (", "    <Chart days={days} floor={floor} today={today}>", "      {dip && <Callout at={dip.date}>Dips to {fmt(dip.balance)}</Callout>}", "    </Chart>", "  )", "}"] },
    metrics: [{ value: "Day-60 retention", label: "vs. the category average" }, { value: "Forecast accuracy", label: "within ±£20" }, { value: "Subscriptions cancelled", label: "per user, first 90 days" }],
    next: "Say how sure Tally is — “likely £486, could be £420” — instead of one confident number.",
  },
  {
    slug: "margin", name: "Margin", tagline: "Hints, not answers, in the margin.", sector: "Edtech · AI tutor", year: "2024", tint: "#E4DCF7",
    art: "g12", shot: "margin", phones: ["m-margin-0", "m-margin-1", "m-margin-2"],
    summary: "An AI tutor that never hands over the answer. It writes hints in the margin of your notes, asks you to explain it back, and turns live classes into notes and exams.",
    disciplines: ["Product", "UI/UX", "AI-native", "Frontend"], role: "Concept project · learning design + React",
    problem: "AI homework apps paste the answer. Grades go up, understanding goes down — and teachers can tell.",
    decisions: [
      { title: "A hint ladder, not an answer", body: "Nudge → hint → one worked step. The answer is never shown before the student has tried twice.", img: "margin" },
      { title: "Snap a problem, get a question back", body: "Point the camera at homework. Margin replies with a question that points to the next step.", img: "m-margin-1" },
      { title: "Explain it back", body: "Before a topic is done, students explain it in their own words — graded on reasoning, not wording.", img: "m-margin-2" },
    ],
    ai: { file: "prompts/margin.tutor.md", prompt: ["You are a tutor. Your job is understanding, not answers.", "Rules:", "- Never state the final answer before two student attempts.", "- Climb the ladder: nudge → hint → one worked step.", "- End with a question whenever possible.", "- If the student is upset, slow down and praise effort."] },
    qa: { cols: ["iPad", "iPhone", "Chromebook", "Screen reader"], matrix: [
      { case: "“Just tell me the answer”", result: ["pass", "pass", "pass", "pass"] },
      { case: "Photo of a full exam", result: ["pass", "pass", "warn", "pass"] },
      { case: "Handwritten chemistry", result: ["pass", "warn", "pass", "pass"] },
      { case: "Offline in class", result: ["pass", "pass", "fail", "pass"] },
    ], edgeCases: ["“My teacher said you can” jailbreak", "Subscripts in handwriting", "Margin at 200% zoom", "Exam timer when the tab is hidden"] },
    code: { file: "lesson/Margin.tsx", lines: ["export function Margin({ doc, hints }: Props) {", "  const anchors = useAnchors(doc)", "  const placed = avoidOverlap(hints.map(h => ({ ...h, y: anchors[h.ref] })))", "  return (", "    <Gutter aria-label=\"Tutor hints\">", "      {placed.map(h => <Hint key={h.id} y={h.y} level={h.level} />)}", "    </Gutter>", "  )", "}"] },
    metrics: [{ value: "Two-week recall", label: "vs. a control class" }, { value: "Copied answers", label: "teacher-graded" }, { value: "Hints before frustration", label: "the sweet spot is about three" }],
    next: "Ask students to apply the idea to a new example, not paraphrase the hint.",
  },
  {
    slug: "packed", name: "Packed", tagline: "Tell it the trip; it packs the bag.", sector: "Agentic commerce", year: "2024", tint: "#D9EBD9",
    art: "g15", shot: "packed", phones: ["m-packed-0", "m-packed-4", "m-packed-6"],
    summary: "An outdoor shop with an agent at the counter. It reads the forecast and the route, builds the kit, compares three shops — and asks before it buys.",
    disciplines: ["Product", "UI/UX", "AI-native", "QA"], role: "Concept project · flows + agent design",
    problem: "First-time campers spend hours across dozens of tabs — then still buy a summer tent for an April trip.",
    decisions: [
      { title: "Start with the trip, not the catalogue", body: "“Lake District, April, three nights, solo, I own a stove.” The agent reads forecast and route before showing a product.", img: "packed" },
      { title: "Every item has a why", body: "“Two poles, rated for 40 mph — gusts on Saturday hit 35.” Weight and budget update live as you swap.", img: "m-packed-4" },
      { title: "Ask before buying", body: "Six items, three shops, one Apple Pay sheet. The agent never checks out on its own.", img: "m-packed-6" },
    ],
    ai: { file: "prompts/packed.kit.md", prompt: ["You build gear lists for a specific trip.", "Rules:", "- Read the forecast and route before suggesting anything.", "- Every item needs one reason tied to the trip.", "- Never add what the person already owns.", "- Never purchase. Prepare the cart and ask."] },
    qa: { cols: ["Web", "iOS", "Apple Pay", "Stock API"], matrix: [
      { case: "Forecast changes after purchase", result: ["pass", "pass", "pass", "warn"] },
      { case: "Out of stock at one shop", result: ["pass", "pass", "pass", "pass"] },
      { case: "Over budget", result: ["pass", "pass", "pass", "pass"] },
      { case: "Discount code expired", result: ["pass", "pass", "fail", "pass"] },
    ], edgeCases: ["Owned items are never added", "Stale stock refreshes before checkout", "Apple Pay total includes discounts", "Map works on slow networks"] },
    code: { file: "kit/BudgetBar.tsx", lines: ["export function BudgetBar({ items, budget }: Props) {", "  const total = sum(items.map(i => i.price))", "  const kg = sum(items.map(i => i.weight))", "  return (", "    <Bar over={total > budget} aria-live=\"polite\">", "      <Meter value={total} max={budget} /> {fmt(total)} · {kg.toFixed(1)} kg", "    </Bar>", "  )", "}"] },
    metrics: [{ value: "Research time", label: "from first search to cart" }, { value: "Wrong-season kits", label: "must be zero" }, { value: "Second trips", label: "people who come back" }],
    next: "Make the post-trip “keep, care, return” moment the start of the next trip.",
  },
  {
    slug: "telegram", name: "Telegram study", tagline: "Telegram for iOS, rebuilt from the pixels up.", sector: "Design-system study", year: "2024", tint: "#D3E6F4",
    art: "g16", shot: "telegram", phones: [],
    summary: "A self-initiated, unofficial study: I rebuilt Telegram for iOS as a Figma design system — tokens, type, bubbles, cells and full screens — to learn how it stays fast and calm.",
    disciplines: ["UI/UX", "Frontend", "QA"], role: "Self-initiated · not affiliated with Telegram",
    problem: "Why does Telegram feel faster and calmer than apps that do much less? I measured the shipping app to find the system behind it.",
    decisions: [
      { title: "Foundations as tokens", body: "Colour, type and an 8-pt grid, published as Figma variables with light and dark modes.", img: "telegram" },
      { title: "Components with real states", body: "Bubbles (in, out, reply, voice, photo, reactions), cells, input bar and switches — each with pressed, disabled and RTL.", img: "telegram" },
      { title: "Full screens from parts only", body: "Chats, chat, profile, settings, call, channel and attach sheet — assembled only from the components.", img: "telegram" },
    ],
    qa: { cols: ["Light", "Dark", "RTL", "Dynamic Type"], matrix: [
      { case: "Chat list cell", result: ["pass", "pass", "pass", "warn"] },
      { case: "Outgoing bubble + tail", result: ["pass", "pass", "pass", "pass"] },
      { case: "Voice message", result: ["pass", "pass", "warn", "pass"] },
      { case: "Reactions row", result: ["pass", "warn", "pass", "pass"] },
    ], edgeCases: ["Bubble tail flips in RTL", "Badge above 99", "Waveform at XXL text", "Dark-mode separators"] },
    code: { file: "Bubble.swift", lines: ["struct Bubble: View {", "  let message: Message", "  var body: some View {", "    Text(message.text).font(.body)", "      .padding(.init(top: 7, leading: 12, bottom: 7, trailing: 12))", "      .background(message.isOutgoing ? .outgoing : .incoming)", "      .clipShape(BubbleShape(tail: message.isLastInGroup))", "  }", "}"] },
    metrics: [{ value: "Components", label: "with every state" }, { value: "Screens", label: "assembled only from parts" }, { value: "Pixel match", label: "against the shipping app" }],
    next: "Stretch the same system to the three-column macOS client.",
  },
];

export const process = [
  { n: "01", title: "Frame", d: "Product" as Discipline, body: "One-sentence job, a success metric, and the “not now” list." },
  { n: "02", title: "Sketch the behaviour", d: "AI-native" as Discipline, body: "Write what the product should do — including how the model behaves when it’s wrong." },
  { n: "03", title: "Design", d: "UI/UX" as Discipline, body: "Flows, states, motion and copy. Empty, error and slow states first." },
  { n: "04", title: "Build", d: "Frontend" as Discipline, body: "React + TypeScript, tokens straight from the Figma file. I pair on the PR." },
  { n: "05", title: "Break it", d: "QA" as Discipline, body: "Test matrix, device lab, VoiceOver pass and adversarial prompts." },
  { n: "06", title: "Measure & tune", d: "Product" as Discipline, body: "Ship behind a flag, read the funnel and the transcripts, fix the prompt." },
];

export const tools = ["Figma", "FigJam", "Framer", "Protopie", "React", "TypeScript", "Next.js", "Tailwind", "Storybook", "Framer Motion", "Three.js", "Playwright", "Claude", "GLM", "Cursor", "Notion", "Linear"];

// Plain-text knowledge pack for the assistant (kept small to save tokens).
export function knowledge(): string {
  const p = profile;
  const proj = projects
    .map((x) => `- ${x.name} (${x.slug}, ${x.year}, ${x.sector}; ${x.role}): ${x.summary} Disciplines: ${x.disciplines.join(", ")}.`)
    .join("\n");
  const d = disciplines.map((x) => `- ${x.name} (${x.level}/5): ${x.line} Skills: ${x.skills.join(", ")}.`).join("\n");
  return `NAME: ${p.name}
ROLE: ${p.role}
LOCATION: ${p.location}
EDUCATION: ${p.education}
AVAILABILITY: ${p.availability}
CONTACT: phone and WhatsApp ${p.phone}; LinkedIn ${p.linkedin}
ABOUT: ${p.intro}
DISCIPLINES:
${d}
PROJECTS (concept and self-initiated case studies on this site):
${proj}
PROCESS: ${process.map((s) => `${s.n} ${s.title} — ${s.body}`).join(" ")}
TOOLS: ${tools.join(", ")}`;
}
