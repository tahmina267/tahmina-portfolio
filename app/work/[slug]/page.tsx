import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { disciplines, profile, projects } from "@/lib/content";
import AskTara from "@/components/AskTara";
import { Browser, Phone } from "@/components/Device";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  return p ? { title: `${p.name} — ${p.tagline} · ${profile.name}`, description: p.summary } : {};
}

const RES = { pass: "✓", warn: "!", fail: "✕" } as const;

export default async function CaseStudy({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const i = projects.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const p = projects[i];
  const next = projects[(i + 1) % projects.length];
  const color = (d: string) => disciplines.find((x) => x.name === d)?.color;

  return (
    <article className="cs" style={{ ["--tint" as string]: p.tint }}>
      <header className={`cs-hero ${p.dark ? "is-dark" : ""}`}>
        <div className="stars" aria-hidden />
        <div className="wrap cs-hero-grid">
          <div>
            <Link href="/#work" className="back">← All work</Link>
            <p className="eyebrow reveal">{p.sector} · {p.year}</p>
            <h1 className="display reveal">{p.name}</h1>
            <p className="cs-tagline reveal">{p.tagline}</p>
            <p className="lede reveal">{p.summary}</p>
            <ul className="chips reveal">{p.disciplines.map((d) => <li key={d} data-d={d}>{d}</li>)}</ul>
          </div>
          <Image src={`/art/${p.art}.webp`} alt="" width={460} height={460} className="cs-art float-slow" priority />
        </div>
        <dl className="wrap cs-facts reveal">
          <div><dt>Role</dt><dd>{p.role}</dd></div>
          <div><dt>Year</dt><dd>{p.year}</dd></div>
          <div><dt>Disciplines</dt><dd>{p.disciplines.join(" · ")}</dd></div>
        </dl>
      </header>

      <section className="wrap cs-stage reveal">
        <Browser src={`/work/${p.shot}.webp`} url={`${p.slug}.app`} />
        {p.phones.length > 0 && (
          <div className="cs-phones">{p.phones.map((ph, j) => <Phone key={ph} src={`/work/${ph}.webp`} className={`cs-phone c${j}`} />)}</div>
        )}
      </section>

      <section className="wrap cs-block">
        <p className="cs-label reveal"><span>01</span> The problem</p>
        <p className="cs-big reveal">{p.problem}</p>
      </section>

      <section className="wrap cs-block">
        <p className="cs-label reveal"><span>02</span> Key decisions</p>
        <div className="decisions">
          {p.decisions.map((d, j) => (
            <div key={d.title} className={`decision reveal ${j % 2 ? "flip" : ""}`}>
              <div className="decision-img"><Image src={`/work/${d.img}.webp`} alt="" width={900} height={600} /></div>
              <div><span className="decision-n">0{j + 1}</span><h3>{d.title}</h3><p>{d.body}</p></div>
            </div>
          ))}
        </div>
      </section>

      {p.ai && (
        <section className="wrap cs-block">
          <p className="cs-label reveal"><span>03</span> Designing the model’s behaviour</p>
          <div className="code-card reveal ai">
            <div className="code-bar"><i /><i /><i /><span>{p.ai.file}</span></div>
            <pre>{p.ai.prompt.map((l, j) => <code key={j} className={l.startsWith("-") ? "rule" : ""}>{l}{"\n"}</code>)}</pre>
          </div>
        </section>
      )}

      <section className="wrap cs-block cs-two">
        <div>
          <p className="cs-label reveal"><span>{p.ai ? "04" : "03"}</span> Built in code</p>
          <div className="code-card reveal">
            <div className="code-bar"><i /><i /><i /><span>{p.code.file}</span></div>
            <pre>{p.code.lines.map((l, j) => <code key={j}><b>{String(j + 1).padStart(2, " ")}</b>{l}{"\n"}</code>)}</pre>
          </div>
        </div>
        <div>
          <p className="cs-label reveal"><span>{p.ai ? "05" : "04"}</span> Then I tried to break it</p>
          <div className="matrix reveal">
            <div className="matrix-row head"><span>Case</span>{p.qa.cols.map((c) => <span key={c}>{c}</span>)}</div>
            {p.qa.matrix.map((r) => (
              <div key={r.case} className="matrix-row">
                <span>{r.case}</span>
                {r.result.map((x, j) => <i key={j} className={x} title={x}>{RES[x]}</i>)}
              </div>
            ))}
          </div>
          <ul className="edge reveal">{p.qa.edgeCases.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      </section>

      <section className="wrap cs-block">
        <p className="cs-label reveal"><span>✦</span> What I’d measure</p>
        <div className="measures">
          {p.metrics.map((m) => (
            <div key={m.value} className="measure reveal"><strong>{m.value}</strong><span>{m.label}</span></div>
          ))}
        </div>
        <p className="muted small reveal">Concept project — these are the success measures I designed for, not reported results.</p>
      </section>

      <section className="wrap cs-block cs-next-row">
        <div className="reveal">
          <p className="cs-label"><span>→</span> What I’d do next</p>
          <p className="cs-big">{p.next}</p>
        </div>
        <div className="cs-ask reveal">
          <AskTara className="btn btn-line" prompt={`Tell me the most interesting decision in the ${p.name} project.`}>Ask Tara about {p.name} ✦</AskTara>
          <div className="dots-row">{p.disciplines.map((d) => <i key={d} style={{ background: color(d) }} title={d} />)}</div>
        </div>
      </section>

      <Link href={`/work/${next.slug}`} className="next-project" style={{ ["--tint" as string]: next.tint }}>
        <div className="wrap next-row">
          <div><small>Next case study</small><strong>{next.name}</strong><span>{next.tagline}</span></div>
          <Image src={`/work/${next.shot}.webp`} alt="" width={520} height={340} />
          <b className="next-arrow">→</b>
        </div>
      </Link>
    </article>
  );
}
