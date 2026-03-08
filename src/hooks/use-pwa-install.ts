import { useState, useEffect, useCallback } from "react";

/**
 * Captures the browser's `beforeinstallprompt` event and exposes
 * a simple API for triggering the native PWA install flow.
 */

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "stride_pwa_install_dismissed";

export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isDismissed, setIsDismissed] = useState(() => {
        try {
            return localStorage.getItem(DISMISS_KEY) === "true";
        } catch {
            return false;
        }
    });

    useEffect(() => {
        // Already installed as standalone PWA
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const installedHandler = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", handler);
        window.addEventListener("appinstalled", installedHandler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
            window.removeEventListener("appinstalled", installedHandler);
        };
    }, []);

    const promptInstall = useCallback(async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setIsInstalled(true);
        }
        setDeferredPrompt(null);
    }, [deferredPrompt]);

    const dismiss = useCallback(() => {
        setIsDismissed(true);
        try {
            localStorage.setItem(DISMISS_KEY, "true");
        } catch {
            // noop
        }
    }, []);

    const canShow = !!deferredPrompt && !isInstalled && !isDismissed;

    return { canShow, isInstalled, promptInstall, dismiss };
}
