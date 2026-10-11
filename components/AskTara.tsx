"use client";
// Opens Tara's chat (optionally with a question) from anywhere on the page.
export default function AskTara({ children, className, prompt }: { children: React.ReactNode; className?: string; prompt?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new CustomEvent("tara:open", { detail: prompt }))}>
      {children}
    </button>
  );
}
