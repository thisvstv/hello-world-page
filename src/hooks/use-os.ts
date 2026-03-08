import { useMemo } from "react";

type OS = "mac" | "windows" | "linux" | "unknown";

/**
 * Detects the user's operating system via `navigator.userAgent` / `navigator.platform`.
 * Returns helper booleans and the correct modifier-key symbol (⌘ vs Ctrl).
 */
export function useOS() {
    return useMemo(() => {
        const ua = navigator.userAgent.toLowerCase();
        const platform = (navigator as any).userAgentData?.platform?.toLowerCase?.() ?? navigator.platform?.toLowerCase?.() ?? "";

        let os: OS = "unknown";
        if (platform.startsWith("mac") || ua.includes("macintosh")) os = "mac";
        else if (platform.startsWith("win") || ua.includes("windows")) os = "windows";
        else if (platform.startsWith("linux") || ua.includes("linux")) os = "linux";

        return {
            os,
            isMac: os === "mac",
            /** "⌘" on Mac, "Ctrl" on everything else */
            modKey: os === "mac" ? "⌘" : "Ctrl",
            /** The symbol used for keyboard shortcuts: "⌘K" or "Ctrl+K" */
            shortcut: (key: string) => (os === "mac" ? `⌘${key}` : `Ctrl+${key}`),
        };
    }, []);
}
