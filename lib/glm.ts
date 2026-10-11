// GLM client. `server-only` makes the build fail if this file is ever imported from client code,
// so the key can't end up in a browser bundle.
import "server-only";
import { TOOLS } from "./guard";

export type Call = { id: string; name: string; args: string };
export type Msg = { role: string; content?: string; tool_calls?: unknown[]; tool_call_id?: string };

export const hasKey = () => Boolean(process.env.GLM_API_KEY);
export const models = () => [process.env.GLM_MODEL ?? "glm-5.3", process.env.GLM_FALLBACK_MODEL ?? "glm-5.3-flash"];

// Belt and braces: the model never sees the key, but never let it (or anything key-shaped) out in text.
export function redact(text: string) {
  const key = process.env.GLM_API_KEY;
  if (key && text.includes(key)) text = text.split(key).join("[redacted]");
  return text.replace(/\b[a-f0-9]{32}\.[A-Za-z0-9]{8,}\b/g, "[redacted]").replace(/\b(ghp|sk|pk)_[A-Za-z0-9_-]{16,}/g, "[redacted]");
}

/** One streamed completion. Yields content deltas; returns any tool calls. Upstream errors never include response bodies. */
export async function* complete(model: string, messages: Msg[], signal: AbortSignal): AsyncGenerator<string, Call[]> {
  const res = await fetch(`${process.env.GLM_BASE_URL ?? "https://api.z.ai/api/coding/paas/v4"}/chat/completions`, {
    method: "POST",
    signal,
    headers: { Authorization: `Bearer ${process.env.GLM_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, tools: TOOLS, stream: true, max_tokens: 1500, temperature: 0.7, thinking: { type: "enabled", effort: "low" } }),
  });
  if (!res.ok || !res.body) throw new Error(`upstream ${res.status}`);
  const calls: Call[] = [];
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    const lines = buf.split("\n");
    buf = lines.pop()!;
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      let delta;
      try { delta = JSON.parse(data)?.choices?.[0]?.delta; } catch { continue; }
      if (!delta) continue;
      if (delta.content) yield redact(delta.content as string);
      for (const tc of delta.tool_calls ?? []) {
        const c = (calls[tc.index] ??= { id: "", name: "", args: "" });
        if (tc.id) c.id = tc.id;
        if (tc.function?.name) c.name += tc.function.name;
        if (tc.function?.arguments) c.args += tc.function.arguments;
      }
    }
  }
  return calls.filter(Boolean);
}
