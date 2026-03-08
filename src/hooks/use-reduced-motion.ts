import { useEffect, useState } from "react";
import { useIsMobile } from "./use-mobile";

/**
 * Detects whether the user prefers reduced motion (OS-level setting)
 * or is on a mobile device where heavy animations cause jitter.
 *
 * Usage:
 *   const prefersReduced = usePrefersReducedMotion();
 *   const mobileSimple    = useMobileReducedMotion();
 */

/** True when the OS `prefers-reduced-motion: reduce` media query matches. */
export function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    });

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    return reduced;
}

/**
 * Combined check: returns `true` when either:
 *  • The user has `prefers-reduced-motion: reduce` enabled, OR
 *  • The viewport is mobile-sized (< 768 px)
 *
 * Components should use this to replace spring/layout animations
 * with simple opacity fades on mobile.
 */
export function useMobileReducedMotion(): boolean {
    const prefersReduced = usePrefersReducedMotion();
    const isMobile = useIsMobile();
    return prefersReduced || isMobile;
}
