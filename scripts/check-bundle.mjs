// Post-build: fail if the GLM key (or anything key-shaped) is in anything the browser can download.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

let key = process.env.GLM_API_KEY;
if (!key && existsSync(".env.local")) key = readFileSync(".env.local", "utf8").match(/^GLM_API_KEY=(.+)$/m)?.[1]?.trim();

const shaped = /\b[a-f0-9]{32}\.[A-Za-z0-9]{8,}\b/;
const roots = [".next/static", ".next/server/app"]; // client bundles + prerendered HTML/RSC payloads
const hits = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (d.startsWith(".next/server/app") && !/\.(html|rsc|body|meta)$/.test(f)) continue; // server code itself never ships
    const s = readFileSync(p, "utf8");
    if ((key && s.includes(key)) || shaped.test(s) || s.includes("GLM_API_KEY")) hits.push(p);
  }
};
roots.filter(existsSync).forEach(walk);
if (hits.length) {
  console.error("✗ Secret found in browser-facing build output:\n  " + hits.join("\n  "));
  process.exit(1);
}
console.log(`bundle ✓ no API key in client output${key ? "" : " (key not set — checked key-shaped strings only)"}`);
