import { useCallback, useSyncExternalStore } from "react";

// Tailwind's own `sm` breakpoint — the line every `sm:` class in this app
// switches on.
export const MOBILE_QUERY = "(max-width: 639px)";

// Must read the match during render, not from an effect: a card that mounts on
// a tap would otherwise paint its desktop shell for one frame and visibly swap
// to the drawer.
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}
