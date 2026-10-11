import { useEffect, useRef } from "react";

/** Listen for commands Tara dispatches as window CustomEvents (e.g. "kova:cmd", "pg:cmd"). */
export function useCmd(event: string, fn: (cmd: string) => void) {
  const ref = useRef(fn);
  useEffect(() => { ref.current = fn; });
  useEffect(() => {
    const on = (e: Event) => ref.current(String((e as CustomEvent).detail));
    window.addEventListener(event, on);
    return () => window.removeEventListener(event, on);
  }, [event]);
}
