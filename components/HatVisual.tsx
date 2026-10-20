import type { Discipline } from "@/lib/content";

// Small live mini-artifacts for each discipline; hover motion lives in CSS (.hat:hover ...).
export default function HatVisual({ d }: { d: Discipline }) {
  if (d === "Product")
    return (
      <div className="hv hv-product">
        <div className="hv-metric"><small>APPROVAL TIME</small><strong>4m 10s</strong>
          <svg viewBox="0 0 160 40"><path d="M0 6 L30 10 L60 8 L90 22 L120 28 L160 36" /></svg>
        </div>
        <div className="hv-sticky">NOT NOW:<br />· dark mode<br />· export CSV</div>
      </div>
    );
  if (d === "UI/UX")
    return (
      <div className="hv hv-ux">
        <div className="hv-wire"><i /><i /><i /></div>
        <div className="hv-ui"><b>Payouts</b>{[0, 1, 2].map((i) => <span key={i}><i /><em /><u data-i={i} /></span>)}</div>
        <svg className="hv-cursor" viewBox="0 0 22 26"><path d="M2 2 L2 20 L7 15 L11 24 L14 22 L10 14 L17 14 Z" /></svg>
      </div>
    );
  if (d === "Frontend")
    return (
      <div className="hv hv-fe">
        <pre><span className="y">&lt;ApprovalBar</span>{"\n"}<span className="v">  batch={"{batch}"}</span>{"\n"}<span className="g">  holdMs={"{1200}"}</span>{"\n"}<span className="y">/&gt;</span></pre>
        <span className="hv-build">✓ build passed</span>
      </div>
    );
  if (d === "QA")
    return (
      <div className="hv hv-qa">
        {["Gate", "Offline", "Timeout", "RTL"].map((r, i) => (
          <div key={r}><span>{r}</span>{[0, 1, 2, 3].map((j) => <i key={j} className={i === 2 && j === 1 ? "fail" : i === 1 && j === 2 ? "warn" : ""} />)}</div>
        ))}
      </div>
    );
  return (
    <div className="hv hv-ai">
      <span className="hv-q">“Book the cheapest one”</span>
      <span className="hv-a">Two are within 10%. Want me to ask before picking?</span>
      <span className="hv-spark">✦</span>
    </div>
  );
}
