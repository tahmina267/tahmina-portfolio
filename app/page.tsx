import Image from "next/image";
import Link from "next/link";
import { disciplines, process, profile, projects, tools } from "@/lib/content";
import AskTara from "@/components/AskTara";
import { Browser, Phone } from "@/components/Device";
import HatVisual from "@/components/HatVisual";
import KovaDashboard from "@/components/kova/KovaDashboard";
import Playground from "@/components/playground/Playground";

const FEATURED = projects.slice(0, 5);
const MORE = projects.slice(5);
const MARQUEE = ["Research", "Product design", "Design systems", "Prompt & eval design", "React + TypeScript", "Motion", "QA & accessibility"];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero" id="top">
        <div className="stars" aria-hidden />
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow reveal">Product · UI/UX · Frontend · QA · AI-native</p>
            <h1 className="display reveal">
              I <em className="c-ultra">design</em> the product,<br />prompt the <em className="c-blue">model</em>,<br />and ship the <em className="c-rust">code</em>.
            </h1>
            <p className="lede reveal">{profile.intro}</p>
            <div className="row gap reveal">
              <a className="btn btn-dark" href="#work">See the work ↓</a>
              <a className="btn btn-line" href={profile.whatsappHref} target="_blank" rel="noreferrer">WhatsApp me</a>
              <AskTara className="btn btn-ghost">Ask Tara ✦</AskTara>
            </div>
            <dl className="stats reveal">
              <div><dt>NSU ’25</dt><dd>North South University</dd></div>
              <div><dt>8</dt><dd>end-to-end case studies</dd></div>
              <div><dt>5</dt><dd>disciplines, one person</dd></div>
            </dl>
          </div>
          <div className="hero-art">
            <Image src="/art/hero.webp" alt="Illustration of a girl whose hair becomes a starry sky" width={760} height={760} priority className="float" />
            <div className="now-card">
              <span className="now-dot">✦</span>
              <div><small>CURRENTLY</small><strong>Designing AI that knows when to ask</strong></div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee" aria-hidden>
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE].map((w, i) => (
            <span key={i}>{w}<b>✦</b></span>
          ))}
        </div>
      </div>

      {/* WORK */}
      <section id="work" className="section">
        <div className="wrap section-head">
          <div>
            <p className="eyebrow reveal">Selected work · 2024 – 2026</p>
            <h2 className="h2 reveal">Eight products, each from first sketch to shipped code.</h2>
          </div>
          <Image src="/art/g03.webp" alt="" width={240} height={240} className="head-art reveal" />
        </div>
        {FEATURED.map((p, i) => (
          <article key={p.slug} className={`chapter ${p.dark ? "is-dark" : ""}`} data-project={p.slug} style={{ ["--tint" as string]: p.tint }}>
            <div className={`wrap chapter-grid ${i % 2 ? "flip" : ""}`}>
              {p.slug === "kova" ? (
                <div className="stage reveal">
                  <Browser url="app.kova.money" className="live"><KovaDashboard compact /></Browser>
                  <span className="live-tag">● Live prototype — try the chart</span>
                </div>
              ) : (
                <Link href={`/work/${p.slug}`} className="stage reveal" aria-label={`Open ${p.name} case study`}>
                  <Browser src={`/work/${p.shot}.webp`} url={`${p.slug}.app`} />
                  {p.phones.slice(0, 2).map((ph, j) => (
                    <Phone key={ph} src={`/work/${ph}.webp`} className={`stage-phone p${j}`} />
                  ))}
                </Link>
              )}
              <div className="chapter-copy reveal">
                <p className="eyebrow">{String(i + 1).padStart(2, "0")} — {p.sector} · {p.year}</p>
                <h3 className="h3">{p.name}</h3>
                <p className="tagline">{p.tagline}</p>
                <p className="body">{p.summary}</p>
                <ul className="chips">{p.disciplines.map((d) => <li key={d} data-d={d}>{d}</li>)}</ul>
                <p className="meta">{p.role}</p>
                <Link className="btn btn-dark arrow" href={`/work/${p.slug}`}>Read the case study <span>→</span></Link>
              </div>
            </div>
          </article>
        ))}
        <div className="wrap more">
          <div className="more-head reveal">
            <h3 className="h3s">Smaller bets, same care.</h3>
            <Image src="/art/guitar.webp" alt="" width={160} height={160} />
          </div>
          <div className="more-grid">
            {MORE.map((p) => (
              <Link key={p.slug} href={`/work/${p.slug}`} className="more-card reveal" data-project={p.slug} style={{ ["--tint" as string]: p.tint }}>
                <div className="more-shot"><Image src={`/work/${p.shot}.webp`} alt="" width={640} height={420} /></div>
                <strong>{p.name}</strong>
                <span>{p.tagline}</span>
                <small>{p.sector} · {p.year} <b>→</b></small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section">
        <div className="wrap about-hero">
          <div>
            <p className="eyebrow reveal">About</p>
            <h2 className="display-s reveal">Designer by training, <em className="c-ultra">engineer</em> by habit, <em className="c-ultra">QA</em> by paranoia.</h2>
            <p className="lede reveal">
              I graduated from North South University in 2025. I work the whole stack of a feature — the research, the screens, the prompt, the React and the test plan — so fewer things get lost between handoffs.
            </p>
            <div className="row gap reveal">
              <a className="btn btn-dark" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
              <a className="btn btn-line" href={profile.phoneHref}>{profile.phone}</a>
            </div>
          </div>
          <Image src="/art/star.webp" alt="Illustration of a girl holding a glowing star" width={560} height={560} className="float-slow reveal" />
        </div>

        <div className="wrap">
          <div className="section-head small">
            <h3 className="h2 reveal">Five hats, one person, fewer handoffs.</h3>
            <p className="muted reveal">Hover a card — each one shows real work from a case study.</p>
          </div>
          <div className="hats" data-spot="hats">
            {disciplines.map((d, i) => (
              <article key={d.name} className="hat reveal" style={{ ["--c" as string]: d.color, ["--t" as string]: d.tint }}>
                <div className="hat-vis"><HatVisual d={d.name} /></div>
                <div className="hat-top"><span className="hat-n">0{i + 1}</span><span className="hat-lvl">{d.level.toFixed(1)} / 5</span></div>
                <h4>{d.name}</h4>
                <p>{d.line}</p>
                <ul className="chips small">{d.skills.map((s) => <li key={s}>{s}</li>)}</ul>
              </article>
            ))}
            <article className="hat hat-edu reveal">
              <Image src="/art/birds.webp" alt="" width={420} height={240} />
              <p className="eyebrow">Education</p>
              <h4>North South University</h4>
              <p>Graduated 2025 · Dhaka, Bangladesh</p>
              <AskTara className="btn btn-light btn-sm" prompt="What did Tahmina study and what is she looking for?">Ask Tara about it</AskTara>
            </article>
          </div>

          <div className="tools reveal">
            <p className="eyebrow">Tools I reach for</p>
            <ul className="chips">{tools.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" className="section dark process">
        <div className="stars" aria-hidden />
        <div className="wrap process-hero">
          <div>
            <p className="eyebrow reveal">Process</p>
            <h2 className="display-s reveal">I fall into the problem before I draw a screen.</h2>
          </div>
          <Image src="/art/falling.webp" alt="Illustration of a girl falling through stars" width={520} height={520} className="float-slow reveal" />
        </div>
        <ol className="wrap steps" data-spot="steps">
          {process.map((s) => {
            const d = disciplines.find((x) => x.name === s.d)!;
            return (
              <li key={s.n} className="step reveal" style={{ ["--c" as string]: d.color }}>
                <span className="step-n">{s.n}</span>
                <div><h4>{s.title}</h4><span className="tag">{s.d}</span></div>
                <p>{s.body}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* PLAYGROUND */}
      <section id="playground" className="section">
        <div className="wrap section-head">
          <div>
            <p className="eyebrow reveal">Playground</p>
            <h2 className="h2 reveal">Motion, mischief and things nobody asked for.</h2>
            <p className="muted reveal play-sub">Six small components from the case studies — all of them work. Go on, poke them.</p>
          </div>
        </div>
        <div className="wrap">
          <Playground />
        </div>
        <div className="wrap critters">
          <div className="critter reveal"><Image src="/art/kitten.webp" alt="Patchwork kitten" width={300} height={400} /><div><h4>Patch</h4><p>Checks every colour token against WCAG. Has never approved #FF0000.</p></div></div>
          <div className="critter reveal" style={{ background: "#F7E1C2" }}><Image src="/art/ladybug.webp" alt="Ladybug in a starry swirl" width={320} height={320} /><div><h4>Dot</h4><p>Finds bugs, literally. Mascot of every bug bash.</p></div></div>
          <div className="critter dark reveal"><Image src="/art/cat.webp" alt="Cat playing drums" width={300} height={380} /><div><h4>Momo</h4><p>Head of QA. Drums on the keyboard during reviews.</p></div></div>
        </div>
        <div className="gallery">
          {["g04", "g07", "g10", "g11", "headphones", "g13", "g14", "g09"].map((g) => (
            <Image key={g} src={`/art/${g}.webp`} alt="" width={320} height={320} className="reveal" />
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section contact">
        <div className="wrap contact-grid">
          <div>
            <p className="eyebrow reveal">Contact</p>
            <h2 className="display reveal">Got a blank <em className="c-ultra">sky</em> to paint?</h2>
            <p className="lede reveal">{profile.availability}.</p>
            <ul className="contact-list reveal">
              <li><small>PHONE</small><a href={profile.phoneHref}>{profile.phone}</a></li>
              <li><small>WHATSAPP</small><a href={profile.whatsappHref} target="_blank" rel="noreferrer">Message on WhatsApp ↗</a></li>
              <li><small>LINKEDIN</small><a href={profile.linkedin} target="_blank" rel="noreferrer">tahmina-sultana ↗</a></li>
              <li><small>BASED IN</small><span>{profile.location}</span></li>
            </ul>
            <div className="row gap reveal">
              <a className="btn btn-dark" href={profile.whatsappHref} target="_blank" rel="noreferrer">Say hi on WhatsApp</a>
              <AskTara className="btn btn-line">Ask Tara first ✦</AskTara>
            </div>
          </div>
          <Image src="/art/sky.webp" alt="Illustration of a girl painting the night sky" width={720} height={720} className="reveal" />
        </div>
        <div className="wrap map-card reveal" data-spot="map">
          <div>
            <p className="eyebrow">Where I am</p>
            <h3>Dhaka, Bangladesh</h3>
            <p>Studied at North South University, Bashundhara — graduated 2025. Happy to work remotely across time zones, or on-site in Dhaka.</p>
            <AskTara className="btn btn-line btn-sm" prompt="Which time zones can Tahmina work with, and where is she based?">Ask Tara about working together</AskTara>
          </div>
          <iframe
            title="Map of Dhaka showing North South University"
            src="https://www.openstreetmap.org/export/embed.html?bbox=90.33%2C23.72%2C90.52%2C23.88&layer=mapnik&marker=23.8151%2C90.4255"
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </section>
    </>
  );
}
