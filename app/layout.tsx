import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import Tara from "@/components/Tara";
import { profile } from "@/lib/content";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  title: `${profile.name} · Product designer, UI/UX, frontend, QA, AI-native`,
  description: profile.intro,
  openGraph: { title: profile.name, description: profile.intro, images: ["/art/hero.webp"] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`} data-theme="day" suppressHydrationWarning>
      <head>
        {/* apply saved day/night before paint (no flash) */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("theme");if(t==="night"||t==="day")document.documentElement.dataset.theme=t}catch(e){}` }} />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <Nav />
        <main id="main">{children}</main>
        <footer className="footer">
          <div className="wrap footer-row">
            <span>© {new Date().getFullYear()} {profile.name}</span>
            <a href={profile.phoneHref}>{profile.phone}</a>
            <a href={profile.whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <span className="muted">Illustrations: andsproject, ninikvaratskhelia, Atky &amp; MissyWhimsyArt via Pixabay</span>
          </div>
        </footer>
        <Reveal />
        <Tara />
      </body>
    </html>
  );
}
