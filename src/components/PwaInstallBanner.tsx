import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

/**
 * A sleek, dismissible PWA install banner that appears when the browser
 * fires `beforeinstallprompt`. Matches the STRIDE glassmorphic design.
 */
const PwaInstallBanner = memo(function PwaInstallBanner() {
    const { canShow, promptInstall, dismiss } = usePwaInstall();

    return (
        <AnimatePresence>
            {canShow && (
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 60 }}
                    transition={{ type: "spring", stiffness: 340, damping: 26 }}
                    className="
            fixed bottom-6 left-4 right-4 z-[90]
            md:left-auto md:right-6 md:max-w-sm
          "
                >
                    <div
                        className="
              relative flex items-start gap-3
              rounded-2xl p-4
              bg-white/95 dark:bg-slate-950/95
              md:bg-white/80 md:dark:bg-black/75
              backdrop-blur-[48px]
              border border-black/[0.06] dark:border-white/[0.08]
              shadow-sm
              md:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.18),0_0_24px_rgba(99,102,241,0.08)]
              dark:shadow-sm
              md:dark:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.5),0_0_24px_rgba(99,102,241,0.12)]
            "
                    >
                        {/* Icon */}
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_rgba(99,102,241,0.25)]">
                            <Download className="w-4 h-4 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-tight">
                                Install STRIDE
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                Get a faster, native-like experience on your device.
                            </p>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-3">
                                <button
                                    onClick={dismiss}
                                    className="h-7 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                                >
                                    Not now
                                </button>
                                <button
                                    onClick={promptInstall}
                                    className="
                    h-7 px-4 rounded-lg text-xs font-semibold
                    inline-flex items-center gap-1.5
                    bg-primary text-primary-foreground
                    shadow-[0_1px_2px_rgba(0,0,0,0.05),0_2px_8px_rgba(99,102,241,0.25)]
                    hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_14px_rgba(99,102,241,0.35)]
                    active:scale-[0.97] transition-all duration-150
                  "
                                >
                                    <Download className="w-3 h-3" />
                                    Install
                                </button>
                            </div>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={dismiss}
                            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-foreground/[0.06] dark:hover:bg-white/[0.08] transition-colors"
                            aria-label="Dismiss install prompt"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

export default PwaInstallBanner;
