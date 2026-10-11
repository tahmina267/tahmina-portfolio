# Tahmina Sultana — Portfolio

Product designer · UI/UX · Frontend · QA · AI-native.
Next.js 16 (App Router) site with eight case studies and **Tara**, a small star mascot that answers questions about my work.

## Run locally

```bash
cp .env.example .env.local   # add your GLM_API_KEY
npm install
npm run dev                  # http://localhost:3000
npm run check                # guardrail self-check
```

## Tara, the assistant

- **Model:** GLM‑5.3 (falls back to GLM‑5.3‑flash) via the Z.ai coding-plan endpoint. The key lives only on the server (`GLM_API_KEY`).
- **Tool calling, streamed:** `app/api/chat/route.ts` streams NDJSON events — text deltas, steps and UI actions. Data tools (`get_project`) run on the server; UI tools (navigate, project card, contact button, skills chart, map, theme, mascot mood, effects) are validated against an allowlist in `lib/guard.ts` before reaching the browser.
- **Guardrails:** same-origin requests only, per-IP rate limit (8/min, 80/day), 600-char input cap, last 10 turns only, a jailbreak pre-filter, a system prompt grounded only in `lib/content.ts`, safe Markdown rendering (no raw HTML, links only to this site or my own profiles), 45 s timeout.
- The rate limit is in memory per instance. For a hard global limit, add a Vercel Firewall rate-limit rule on `/api/chat`.

## Deploy (Vercel)

Set `GLM_API_KEY`, `GLM_BASE_URL`, `GLM_MODEL` and `GLM_FALLBACK_MODEL` in the project's environment variables, then deploy. Security headers (CSP, HSTS, nosniff, Permissions-Policy) are set in `next.config.ts`.

## Credits

Illustrations by andsproject, ninikvaratskhelia, Atky and MissyWhimsyArt on Pixabay (Pixabay Content License).
Projects are concept and self-initiated case studies. The Telegram study is unofficial and not affiliated with Telegram.
