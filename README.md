# Tahmina Sultana · Portfolio

Product designer · UI/UX · Frontend · QA · AI-native.
Next.js 16 (App Router) site with nine case studies and **Tara**, a small star mascot that answers questions about my work.

## Run locally

```bash
cp .env.example .env.local   # add your GLM_API_KEY
npm install
npm run dev                  # http://localhost:3000
npm run check                # guardrail self-check
```

## Tara, the assistant

- **Model:** GLM‑5.3 (falls back to GLM‑5.3‑flash) via the Z.ai coding-plan endpoint. The key lives only on the server (`GLM_API_KEY`).
- **Tool calling, streamed:** `app/api/chat/route.ts` streams NDJSON events: text deltas, steps and UI actions. Data tools (`get_project`) run on the server; UI tools (navigate, project card, contact button, skills chart, map, theme, mascot mood, effects) are validated against an allowlist in `lib/guard.ts` before reaching the browser.
- **Smarter answers:** page-aware (knows which case study you're reading), a `search_portfolio` tool over every case study, follow-up suggestions after each answer, a narrated guided tour, a Stop button, and ⌘K to open.
- **Key safety:** the GLM client lives in `lib/glm.ts` behind `import "server-only"` (the build fails if it is imported by client code), and `npm run build` runs `scripts/check-bundle.mjs`, which fails the build if the key or anything shaped like it appears in browser-facing output. Streamed text is also redacted for key-shaped strings.
- **Guardrails:** same-origin requests only, per-IP rate limit (8/min, 80/day) and one answer at a time per visitor, 600-char input cap, last 10 turns only, a jailbreak pre-filter, a system prompt grounded only in `lib/content.ts`, safe Markdown rendering (no raw HTML, links only to this site or my own profiles), 45 s timeout.
- The rate limit is in memory per instance. For a hard global limit, add a Vercel Firewall rate-limit rule on `/api/chat`.

## Kova live prototype

The Kova case study's dashboard is a real React component (`components/kova`): a balance chart with 7D/30D/90D ranges, hover and keyboard inspection, payroll and invoice event markers, a 14-day forecast with the projected low, sparklines per currency account, an animated cash-flow chart, and a working "Hold Priya & send 41" approval.

## Playground

Six working components from the case studies (`components/playground`): a canvas constellation you draw by clicking stars, an agent run that stops at an approval gate, a streaming reply with tone switching, a hold-to-confirm button (pointer and keyboard), a day/night switch that themes the whole site, and a tilting, flipping Kova card.

## Deploy (Vercel)

Set `GLM_API_KEY`, `GLM_BASE_URL`, `GLM_MODEL` and `GLM_FALLBACK_MODEL` in the project's environment variables, then deploy. Security headers (CSP, HSTS, nosniff, Permissions-Policy) are set in `next.config.ts`.

## Credits

Illustrations by andsproject, ninikvaratskhelia, Atky and MissyWhimsyArt on Pixabay (Pixabay Content License).
Projects are concept and self-initiated case studies. The Telegram study is unofficial and not affiliated with Telegram.
