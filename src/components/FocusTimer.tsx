import { useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, X, Timer, Minus, Coffee, Brain, Armchair } from "lucide-react";
import { useFocusTimer, PRODUCTIVITY_METHODS, MODE_LABELS, type TimerMode, type ProductivityMethod } from "./FocusTimerContext";

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const MODE_ICONS: Record<TimerMode, typeof Brain> = {
    focus: Brain,
    "short-break": Coffee,
    "long-break": Armchair,
};

// ── Minimized Pill ─────────────────────────────────────
const MinimizedPill = memo(function MinimizedPill() {
    const { status, timeLeft, mode, restore, play, pause } = useFocusTimer();

    const ModeIcon = MODE_ICONS[mode];
    const isRunning = status === "running";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="
                fixed bottom-32 md:bottom-6 right-4 md:right-6 z-[80]
                flex items-center gap-2 h-10 px-3 rounded-full
                bg-white/95 dark:bg-[#0a0a14]/95
                md:bg-white/70 md:dark:bg-[#0a0a14]/70
                backdrop-blur-[60px]
                border-[0.5px] border-white/30 dark:border-white/[0.08]
                shadow-sm md:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.2)]
                dark:shadow-sm md:dark:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.5)]
                cursor-pointer select-none
            "
            onClick={restore}
        >
            <ModeIcon className="w-3.5 h-3.5 text-primary/60" />
            <span className="text-sm font-bold tabular-nums font-mono text-foreground">
                {formatTime(timeLeft)}
            </span>
            <button
                onClick={(e) => { e.stopPropagation(); isRunning ? pause() : play(); }}
                className="w-6 h-6 rounded-full flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-colors active:scale-[0.85]"
            >
                {isRunning
                    ? <Pause className="w-3 h-3 text-primary" />
                    : <Play className="w-3 h-3 text-primary ml-0.5" />}
            </button>
        </motion.div>
    );
});

// ── Full Timer Widget ──────────────────────────────────
const FullTimer = memo(function FullTimer() {
    const {
        taskTitle, mode, status, timeLeft, method,
        closeTimer, minimize, play, pause, reset, setMode, setMethod, durations,
    } = useFocusTimer();

    const duration = durations[mode];
    const progress = 1 - timeLeft / duration;
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference * (1 - progress);

    const ringColor =
        mode !== "focus"
            ? "stroke-emerald-500"
            : timeLeft > 5 * 60
                ? "stroke-primary"
                : timeLeft > 60
                    ? "stroke-amber-500"
                    : "stroke-rose-500";

    const statusLabel =
        mode === "focus" ? "focusing" : mode === "short-break" ? "resting" : "chilling";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            drag
            dragMomentum={false}
            className="
                fixed bottom-32 md:bottom-6 right-4 md:right-6 z-[80]
                w-[calc(100vw-2rem)] max-w-[230px]
                rounded-3xl overflow-hidden
                bg-white/95 dark:bg-[#0a0a14]/95
                md:bg-white/70 md:dark:bg-[#0a0a14]/70
                backdrop-blur-[60px]
                border-[0.5px] border-white/30 dark:border-white/[0.08]
                shadow-sm md:shadow-[0_20px_80px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.05)]
                dark:shadow-sm md:dark:shadow-[0_20px_80px_-12px_rgba(0,0,0,0.6),0_0_60px_rgba(99,102,241,0.06)]
                cursor-grab active:cursor-grabbing
                select-none
            "
        >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <div className="flex items-center gap-1.5">
                    <Timer className="w-3 h-3 text-primary/60" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50">
                        {MODE_LABELS[mode]}
                    </span>
                </div>
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={minimize}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-foreground/[0.06] transition-colors duration-150 active:scale-[0.85]"
                    >
                        <Minus className="w-3 h-3" />
                    </button>
                    <button
                        onClick={closeTimer}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-foreground/[0.06] transition-colors duration-150 active:scale-[0.85]"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* ── Mode tabs ── */}
            <div className="flex items-center gap-1 px-3 pb-1">
                {(["focus", "short-break", "long-break"] as TimerMode[]).map((m) => {
                    const Icon = MODE_ICONS[m];
                    const active = mode === m;
                    return (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            disabled={status === "running"}
                            className={`
                                flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[8px] font-semibold uppercase tracking-wider
                                transition-all duration-200
                                disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.95]
                                ${active
                                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                                    : "text-muted-foreground/40 hover:text-muted-foreground/70 hover:bg-foreground/[0.03]"}
                            `}
                        >
                            <Icon className="w-2.5 h-2.5" />
                            <span className="hidden min-[0px]:inline">{m === "focus" ? "Focus" : m === "short-break" ? "Short" : "Long"}</span>
                        </button>
                    );
                })}
            </div>

            {/* ── Method selector ── */}
            <div className="flex items-center gap-1 px-3 pb-1">
                {(Object.entries(PRODUCTIVITY_METHODS) as [ProductivityMethod, typeof PRODUCTIVITY_METHODS.pomodoro][]).map(([key, cfg]) => {
                    const active = method === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setMethod(key)}
                            disabled={status === "running"}
                            title={cfg.description}
                            className={`
                                flex-1 py-1 rounded-lg text-[7px] font-bold uppercase tracking-wider
                                transition-all duration-200
                                disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.95]
                                ${active
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20"
                                    : "text-muted-foreground/40 hover:text-muted-foreground/70 hover:bg-foreground/[0.03]"}
                            `}
                        >
                            {cfg.label}
                        </button>
                    );
                })}
            </div>

            {/* ── Circular timer ── */}
            <div className="flex flex-col items-center px-4 pb-2 pt-1">
                <div className="relative w-[128px] h-[128px] flex items-center justify-center">
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" strokeWidth="4"
                            className="stroke-foreground/[0.06] dark:stroke-white/[0.06]" />
                        <circle cx="60" cy="60" r="54" fill="none" strokeWidth="4" strokeLinecap="round"
                            className={`${ringColor} transition-colors duration-500`}
                            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                            style={{ transition: "stroke-dashoffset 0.4s ease" }} />
                    </svg>

                    <div className="flex flex-col items-center z-10">
                        <span className="text-3xl font-black tracking-tighter text-foreground tabular-nums font-mono">
                            {formatTime(timeLeft)}
                        </span>
                        {status === "running" && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-[8px] font-semibold text-primary/60 uppercase tracking-[0.15em] mt-0.5"
                            >
                                {statusLabel}
                            </motion.span>
                        )}
                        {status === "paused" && (
                            <span className="text-[8px] font-semibold text-amber-500/70 uppercase tracking-[0.15em] mt-0.5">
                                paused
                            </span>
                        )}
                        {status === "idle" && timeLeft === 0 && (
                            <span className="text-[8px] font-semibold text-emerald-500/70 uppercase tracking-[0.15em] mt-0.5">
                                done!
                            </span>
                        )}
                    </div>
                </div>

                <p className="text-[10px] text-muted-foreground/50 text-center truncate max-w-full mt-1 px-2">
                    {taskTitle}
                </p>
            </div>

            {/* ── Controls ── */}
            <div className="flex items-center justify-center gap-3 px-4 pb-4 pt-1">
                <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={reset}
                    disabled={status === "idle" && timeLeft === duration}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-foreground/[0.04] dark:bg-white/[0.04] text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
                    title="Reset"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                    onClick={status === "running" ? pause : play}
                    className="w-12 h-12 rounded-full flex items-center justify-center btn-silk shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                    title={status === "running" ? "Pause" : "Play"}
                >
                    {status === "running"
                        ? <Pause className="w-5 h-5 text-white" />
                        : <Play className="w-5 h-5 text-white ml-0.5" />}
                </motion.button>

                <div className="w-9 h-9" />
            </div>
        </motion.div>
    );
});

// ── Exported wrapper — renders either pill or full ─────
export default function FocusTimer() {
    const { isOpen, minimized, closeTimer } = useFocusTimer();

    // Close on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeTimer(); };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [closeTimer]);

    if (!isOpen) return null;

    return (
        <AnimatePresence mode="wait">
            {minimized ? <MinimizedPill key="pill" /> : <FullTimer key="full" />}
        </AnimatePresence>
    );
}
