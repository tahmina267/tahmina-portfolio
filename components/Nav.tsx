"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { profile } from "@/lib/content";

const LINKS = [
  ["Work", "/#work"],
  ["About", "/#about"],
  ["Process", "/#process"],
  ["Playground", "/#playground"],
  ["Contact", "/#contact"],
] as const;

export default function Nav() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) { setLastPath(path); setOpen(false); }

  return (
    <header className={`nav ${scrolled ? "is-scrolled" : ""} ${open ? "is-open" : ""}`}>
      <div className="wrap nav-row">
        <Link href="/" className="brand" aria-label="Home">
          <span className="mono-mark">ts</span>
          <span>{profile.name}</span>
        </Link>
        <nav className="nav-links" aria-label="Main">
          {LINKS.map(([l, h]) => (
            <Link key={l} href={h} onClick={() => setOpen(false)}>{l}</Link>
          ))}
        </nav>
        <div className="nav-cta">
          <span className="pill pill-ok"><i /> Open to work</span>
          <a className="btn btn-dark btn-sm" href={profile.whatsappHref} target="_blank" rel="noreferrer">WhatsApp ↗</a>
        </div>
        <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <span /><span />
        </button>
      </div>
    </header>
  );
}
