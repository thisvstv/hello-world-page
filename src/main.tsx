import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./i18n"; // i18next + RTL direction handler
import "./index.css";

// ── Security: Console Anti-Hijacking (Self-XSS Prevention) ─────────
// Display a prominent warning in the browser console to deter
// social-engineering attacks where users are tricked into pasting
// malicious JavaScript ("Self-XSS").
(function selfXssGuard() {
    // Styled warning — always shown, even in dev
    try {
        console.log(
            "%c🛑 STOP!",
            "color:#FF0000;font-size:48px;font-weight:900;text-shadow:2px 2px 0 #000;"
        );
        console.log(
            "%cThis browser feature is intended for developers.\n" +
            "If someone told you to copy-paste something here to " +
            "\"unlock\" a feature or \"hack\" an account, it is a scam " +
            "and will give them access to your STRIDE account.",
            "color:#FF6B35;font-size:16px;font-weight:600;line-height:1.6;"
        );
        console.log(
            "%cSee https://en.wikipedia.org/wiki/Self-XSS for more information.",
            "color:#888;font-size:12px;"
        );
    } catch {
        // Console may be unavailable in some environments
    }

    // In production builds, neuter verbose console methods so
    // no sensitive data (tokens, PII, state dumps) leaks to DevTools.
    if (import.meta.env.PROD) {
        const noop = () => { };
        console.log = noop;
        console.info = noop;
        console.trace = noop;
        console.debug = noop;
        // console.warn and console.error are preserved for operational visibility
    }
})();

createRoot(document.getElementById("root")!).render(<App />);
