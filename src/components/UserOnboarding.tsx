import { useState, useEffect, useCallback, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Sparkles, Search, RotateCcw, EyeOff, MessageSquarePlus, Gamepad2, Paintbrush } from "lucide-react";
import { useAuth } from "./AuthContext";
import api from "@/lib/axios";

/* ─── Storage key (fast local cache to avoid flicker) ──── */
const TUTORIAL_KEY = "stride_tutorial_completed";

/* ─── Steps definition ─────────────────────────────── */
interface TourStep {
    title: string;
    description: string;
    icon: React.ElementType;
    /** CSS selector of the DOM element to anchor to. null = centred overlay. */
    target: string | null;
    /** Preferred side to position the tooltip relative to the target. */
    placement: "bottom" | "top" | "left" | "right" | "center";
}

const STEPS: TourStep[] = [
    {
        title: "Welcome to STRIDE",
        description:
            "Your premium workspace for deep work. Let's take a 30-second tour of the features that make STRIDE special.",
        icon: Sparkles,
        target: null,
        placement: "center",
    },
    {
        title: "Command Palette",
        description:
            "Search, navigate, and command entirely from your keyboard. Open it anytime with ⌘K (or Ctrl+K on Windows).",
        icon: Search,
        target: "#onboarding-command-palette",
        placement: "bottom",
    },
    {
        title: "Daily Tasks & Rollover",
        description:
            "Tasks you don't finish automatically roll over to tomorrow. No guilt — STRIDE has your back.",
        icon: RotateCcw,
        target: "#onboarding-task-board",
        placement: "top",
    },
    {
        title: "Stealth Mode & Customise",
        description:
            "Press Shift+S to blur sensitive data for screen-sharing. Use the colour picker to personalise your theme.",
        icon: Paintbrush,
        target: "#onboarding-header-actions",
        placement: "bottom",
    },
    {
        title: "Send Us Feedback",
        description:
            "Spotted a bug or have an idea? Click the Feedback button in the sidebar to share your thoughts with the team.",
        icon: MessageSquarePlus,
        target: "#onboarding-feedback",
        placement: "right",
    },
];

/* ─── Tooltip positioning ──────────────────────────── */
type Coords = { top: number; left: number; arrowSide: "top" | "bottom" | "left" | "right" | "none" };

function getTooltipCoords(target: string | null, placement: TourStep["placement"]): Coords {
    const isMobileVP = window.innerWidth < 768;
    const TOOLTIP_W = isMobileVP ? Math.min(window.innerWidth - 32, 360) : 360;
    const TOOLTIP_H_ESTIMATE = 220;

    if (!target || placement === "center") {
        return {
            top: window.innerHeight / 2 - TOOLTIP_H_ESTIMATE / 2,
            left: window.innerWidth / 2 - TOOLTIP_W / 2,
            arrowSide: "none",
        };
    }

    const el = document.querySelector(target);
    if (!el) {
        return {
            top: window.innerHeight / 2 - TOOLTIP_H_ESTIMATE / 2,
            left: window.innerWidth / 2 - TOOLTIP_W / 2,
            arrowSide: "none",
        };
    }

    const rect = el.getBoundingClientRect();
    const GAP = 14;

    let top = 0;
    let left = 0;
    let arrowSide: Coords["arrowSide"] = "none";

    // On mobile, if the target is in the bottom half of the screen,
    // render the tooltip ABOVE to avoid off-screen overflow.
    const effectivePlacement =
        isMobileVP && rect.bottom > window.innerHeight * 0.55 && placement === "bottom"
            ? "top"
            : placement;

    switch (effectivePlacement) {
        case "bottom":
            top = rect.bottom + GAP;
            left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
            arrowSide = "top";
            break;
        case "top":
            top = rect.top - GAP - TOOLTIP_H_ESTIMATE;
            left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
            arrowSide = "bottom";
            break;
        case "right":
            top = rect.top + rect.height / 2 - 100;
            left = rect.right + GAP;
            arrowSide = "left";
            break;
        case "left":
            top = rect.top + rect.height / 2 - 100;
            left = rect.left - GAP - TOOLTIP_W;
            arrowSide = "right";
            break;
    }

    // Clamp to viewport with generous padding
    left = Math.max(16, Math.min(left, window.innerWidth - TOOLTIP_W - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - TOOLTIP_H_ESTIMATE - 16));

    return { top, left, arrowSide };
}

/* ─── Spotlight highlight ──────────────────────────── */
function getHighlightRect(target: string | null): DOMRect | null {
    if (!target) return null;
    const el = document.querySelector(target);
    return el ? el.getBoundingClientRect() : null;
}

/* ═══════════════════════════════════════════════════════
   UserOnboarding component
   ═══════════════════════════════════════════════════════ */
const UserOnboarding = memo(function UserOnboarding() {
    const { user } = useAuth();
    const [active, setActive] = useState(false);
    const [step, setStep] = useState(0);
    const [coords, setCoords] = useState<Coords>({ top: 0, left: 0, arrowSide: "none" });
    const [highlight, setHighlight] = useState<DOMRect | null>(null);
    const rafRef = useRef(0);
    const completingRef = useRef(false);

    // Determine if tutorial should show based on backend flag
    // Uses localStorage as a fast cache to prevent flickering,
    // but the backend `hasSeenTutorial` is the source of truth.
    useEffect(() => {
        // No user yet (still loading or logged out) — don't show
        if (!user) return;

        // Backend says already seen — ensure cache agrees and bail
        if (user.hasSeenTutorial) {
            try { localStorage.setItem(TUTORIAL_KEY, "true"); } catch { }
            return;
        }

        // Fast cache check — if localStorage says done, skip
        // (This covers the tiny window before the backend flag propagates)
        try {
            if (localStorage.getItem(TUTORIAL_KEY) === "true") return;
        } catch { }

        // Small delay to let the dashboard paint first
        const t = setTimeout(() => setActive(true), 900);
        return () => clearTimeout(t);
    }, [user]);

    // Recalculate position whenever step changes
    const recalc = useCallback(() => {
        const s = STEPS[step];
        if (!s) return;
        setCoords(getTooltipCoords(s.target, s.placement));
        setHighlight(getHighlightRect(s.target));
    }, [step]);

    useEffect(() => {
        if (!active) return;
        recalc();

        // Reposition on resize/scroll
        const handler = () => {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(recalc);
        };
        window.addEventListener("resize", handler);
        window.addEventListener("scroll", handler, true);
        return () => {
            window.removeEventListener("resize", handler);
            window.removeEventListener("scroll", handler, true);
            cancelAnimationFrame(rafRef.current);
        };
    }, [active, recalc]);

    const complete = useCallback(() => {
        setActive(false);

        // Immediately cache locally to prevent re-showing on re-render
        try { localStorage.setItem(TUTORIAL_KEY, "true"); } catch { }

        // Persist to backend (fire-and-forget, idempotent)
        if (!completingRef.current) {
            completingRef.current = true;
            api.patch("/api/auth/me/tutorial").catch(() => {
                // If the backend call fails, the tutorial will re-appear
                // on next login — acceptable fallback behaviour
            }).finally(() => {
                completingRef.current = false;
            });
        }
    }, []);

    const next = useCallback(() => {
        if (step < STEPS.length - 1) {
            setStep((s) => s + 1);
        } else {
            complete();
        }
    }, [step, complete]);

    const skip = useCallback(() => {
        complete();
    }, [complete]);

    if (!active) return null;

    const current = STEPS[step];
    const Icon = current.icon;
    const isLast = step === STEPS.length - 1;
    const isCentered = current.placement === "center";
    const PAD = 8;

    return (
        <AnimatePresence>
            {active && (
                <div className="fixed inset-0 z-[100]" style={{ pointerEvents: "auto" }}>
                    {/* ── Backdrop with spotlight cutout ── */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0"
                        onClick={skip}
                    >
                        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
                            <defs>
                                <mask id="onboarding-mask">
                                    <rect width="100%" height="100%" fill="white" />
                                    {highlight && (
                                        <rect
                                            x={highlight.left - PAD}
                                            y={highlight.top - PAD}
                                            width={highlight.width + PAD * 2}
                                            height={highlight.height + PAD * 2}
                                            rx="16"
                                            fill="black"
                                        />
                                    )}
                                </mask>
                            </defs>
                            <rect
                                width="100%"
                                height="100%"
                                fill="rgba(0,0,0,0.55)"
                                mask="url(#onboarding-mask)"
                            />
                        </svg>

                        {/* Spotlight glow ring */}
                        {highlight && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute rounded-2xl ring-2 ring-primary/60 shadow-[0_0_30px_rgba(99,102,241,0.3)]"
                                style={{
                                    top: highlight.top - PAD,
                                    left: highlight.left - PAD,
                                    width: highlight.width + PAD * 2,
                                    height: highlight.height + PAD * 2,
                                    pointerEvents: "none",
                                }}
                            />
                        )}
                    </motion.div>

                    {/* ── Tooltip card ── */}
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`
                            absolute
                            left-4 right-4 w-auto
                            md:left-auto md:right-auto md:w-[360px]
                            max-w-[calc(100vw-2rem)]
                            rounded-[1.25rem] overflow-hidden
                            bg-white/95 dark:bg-slate-950/95
                            md:bg-white/80 md:dark:bg-black/75
                            backdrop-blur-[48px]
                            border border-black/[0.06] dark:border-white/[0.08]
                            shadow-sm md:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.2),0_0_40px_rgba(99,102,241,0.08)]
                            dark:shadow-sm md:dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.6),0_0_40px_rgba(99,102,241,0.12)]
                            p-5 md:p-6
                        `}
                        style={(() => {
                            const s: React.CSSProperties = {};
                            const mob = window.innerWidth < 768;
                            if (isCentered && !mob) {
                                s.top = "50%"; s.left = "50%"; s.transform = "translate(-50%, -50%)";
                            } else if (isCentered && mob) {
                                s.top = "50%"; s.transform = "translateY(-50%)";
                            } else if (mob) {
                                s.top = coords.top;
                            } else {
                                s.top = coords.top; s.left = coords.left;
                            }
                            return s;
                        })()}
                    >
                        {/* Arrow */}
                        {coords.arrowSide !== "none" && !isCentered && (
                            <div
                                className={`
                                    absolute w-3 h-3 rotate-45
                                    bg-white/80 dark:bg-black/75
                                    border border-black/[0.06] dark:border-white/[0.08]
                                    ${coords.arrowSide === "top" ? "-top-1.5 left-1/2 -translate-x-1/2 border-b-0 border-r-0" : ""}
                                    ${coords.arrowSide === "bottom" ? "-bottom-1.5 left-1/2 -translate-x-1/2 border-t-0 border-l-0" : ""}
                                    ${coords.arrowSide === "left" ? "top-1/2 -left-1.5 -translate-y-1/2 border-t-0 border-r-0" : ""}
                                    ${coords.arrowSide === "right" ? "top-1/2 -right-1.5 -translate-y-1/2 border-b-0 border-l-0" : ""}
                                `}
                            />
                        )}

                        {/* Header */}
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_rgba(99,102,241,0.3)]">
                                <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold tracking-tight text-foreground">
                                    {current.title}
                                </h3>
                                <p className="text-[12px] text-muted-foreground leading-relaxed mt-1">
                                    {current.description}
                                </p>
                            </div>
                            <button
                                onClick={skip}
                                className="p-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-foreground/[0.06] transition-colors flex-shrink-0"
                                aria-label="Close tutorial"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Progress dots */}
                        <div className="flex items-center gap-1.5 mb-4">
                            {STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1 rounded-full transition-all duration-300 ${i === step
                                        ? "w-5 bg-primary"
                                        : i < step
                                            ? "w-2 bg-primary/40"
                                            : "w-2 bg-foreground/10 dark:bg-white/10"
                                        }`}
                                />
                            ))}
                            <span className="ml-auto text-[10px] text-muted-foreground/50 font-mono">
                                {step + 1}/{STEPS.length}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={skip}
                                className="h-8 px-3 rounded-xl text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                            >
                                {isLast ? "Close" : "Skip Tour"}
                            </button>
                            <button
                                onClick={next}
                                className="
                                    ml-auto h-8 px-4 rounded-xl text-[12px] font-semibold
                                    inline-flex items-center gap-1.5
                                    bg-primary text-primary-foreground
                                    shadow-[0_1px_2px_rgba(0,0,0,0.05),0_2px_8px_rgba(99,102,241,0.25)]
                                    hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_14px_rgba(99,102,241,0.35)]
                                    active:scale-[0.97] transition-all duration-150
                                "
                            >
                                {isLast ? "Finish" : "Next"}
                                {!isLast && <ArrowRight className="w-3 h-3" />}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
});

export default UserOnboarding;

/* ─── Helper to reset onboarding (useful for dev/testing) ── */
export function resetOnboarding() {
    localStorage.removeItem(TUTORIAL_KEY);
}
