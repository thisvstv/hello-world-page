import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from "react";
import apiClient from "@/api/apiClient";

// ── Types ──────────────────────────────────────────────
export type TimerMode = "focus" | "short-break" | "long-break";
export type TimerStatus = "idle" | "running" | "paused";

/** Productivity method presets */
export type ProductivityMethod = "pomodoro" | "52-17" | "90-min-flow";

export interface MethodConfig {
    label: string;
    description: string;
    focusDuration: number;      // seconds
    breakDuration: number;      // seconds
    longBreakDuration: number;  // seconds
}

export const PRODUCTIVITY_METHODS: Record<ProductivityMethod, MethodConfig> = {
    pomodoro: {
        label: "Pomodoro",
        description: "25m Focus / 5m Break",
        focusDuration: 25 * 60,
        breakDuration: 5 * 60,
        longBreakDuration: 15 * 60,
    },
    "52-17": {
        label: "52/17 Rule",
        description: "52m Focus / 17m Break",
        focusDuration: 52 * 60,
        breakDuration: 17 * 60,
        longBreakDuration: 17 * 60,
    },
    "90-min-flow": {
        label: "90-Min Flow",
        description: "90m Focus / 20m Break",
        focusDuration: 90 * 60,
        breakDuration: 20 * 60,
        longBreakDuration: 20 * 60,
    },
};

/** Derive mode durations from the active method */
function getModeDurations(method: ProductivityMethod): Record<TimerMode, number> {
    const cfg = PRODUCTIVITY_METHODS[method];
    return {
        focus: cfg.focusDuration,
        "short-break": cfg.breakDuration,
        "long-break": cfg.longBreakDuration,
    };
}

// Keep backward-compat export (defaults to pomodoro)
export const MODE_DURATIONS: Record<TimerMode, number> = getModeDurations("pomodoro");

export const MODE_LABELS: Record<TimerMode, string> = {
    focus: "Focus",
    "short-break": "Short Break",
    "long-break": "Long Break",
};

interface FocusTimerState {
    isOpen: boolean;
    minimized: boolean;
    taskTitle: string;
    mode: TimerMode;
    method: ProductivityMethod;
    status: TimerStatus;
    timeLeft: number;
    /** Unix ms when timer was last started/resumed — for drift-proof restore */
    startedAt: number | null;
}

interface FocusTimerContextType extends FocusTimerState {
    openTimer: (title: string) => void;
    closeTimer: () => void;
    minimize: () => void;
    restore: () => void;
    play: () => void;
    pause: () => void;
    reset: () => void;
    setMode: (m: TimerMode) => void;
    setMethod: (m: ProductivityMethod) => void;
    /** Current method's durations */
    durations: Record<TimerMode, number>;
}

const STORAGE_KEY = "stride_focus_timer";

// ── Persistence helpers ────────────────────────────────
function loadState(): Partial<FocusTimerState> | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function saveState(s: FocusTimerState) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch { /* quota */ }
}

// ── Audio ding (Web Audio API) ─────────────────────────
export function playDing() {
    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(830, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
        // Clean up AudioContext after sound finishes to prevent memory leaks
        setTimeout(() => { try { ctx.close(); } catch { /* */ } }, 1500);
    } catch { /* web audio not available */ }
}

/** Fire a native browser desktop notification */
function fireNativeNotification(title: string, body: string) {
    try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(title, { body, icon: "/favicon.ico" });
        }
    } catch { /* notification API not available */ }
}

// ── Defaults ───────────────────────────────────────────
const DEFAULT_METHOD: ProductivityMethod = "pomodoro";

const DEFAULT_STATE: FocusTimerState = {
    isOpen: false,
    minimized: false,
    taskTitle: "",
    mode: "focus",
    method: DEFAULT_METHOD,
    status: "idle",
    timeLeft: PRODUCTIVITY_METHODS[DEFAULT_METHOD].focusDuration,
    startedAt: null,
};

const FocusTimerContext = createContext<FocusTimerContextType>({
    ...DEFAULT_STATE,
    openTimer: () => { },
    closeTimer: () => { },
    minimize: () => { },
    restore: () => { },
    play: () => { },
    pause: () => { },
    reset: () => { },
    setMode: () => { },
    setMethod: () => { },
    durations: getModeDurations(DEFAULT_METHOD),
});

// ── Provider ───────────────────────────────────────────
export function FocusTimerProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<FocusTimerState>(() => {
        const saved = loadState();
        if (!saved) return DEFAULT_STATE;

        const method: ProductivityMethod = (saved as any).method ?? DEFAULT_METHOD;
        const durations = getModeDurations(method);
        const mode = saved.mode ?? "focus";
        let timeLeft = saved.timeLeft ?? durations[mode];

        // Reconstruct elapsed time if running when page closed
        if (saved.status === "running" && saved.startedAt) {
            const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
            timeLeft = Math.max(0, timeLeft - elapsed);
        }

        return {
            isOpen: saved.isOpen ?? false,
            minimized: saved.minimized ?? false,
            taskTitle: saved.taskTitle ?? "",
            mode,
            method,
            status: timeLeft <= 0 ? "idle" : (saved.status ?? "idle"),
            timeLeft: timeLeft <= 0 ? durations[mode] : timeLeft,
            startedAt: saved.status === "running" && timeLeft > 0 ? Date.now() : null,
        };
    });

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const durations = useMemo(() => getModeDurations(state.method), [state.method]);

    // Request notification permission on mount
    useEffect(() => {
        try {
            if (typeof Notification !== "undefined" && Notification.permission === "default") {
                Notification.requestPermission();
            }
        } catch { /* */ }
    }, []);

    // Persist on meaningful state changes (avoid high-frequency writes on every tick)
    const prevStatusRef = useRef(state.status);
    const prevMethodRef = useRef(state.method);
    const prevModeRef = useRef(state.mode);
    useEffect(() => {
        // Always persist on status/method/mode change; throttle timeLeft writes
        if (
            state.status !== prevStatusRef.current ||
            state.method !== prevMethodRef.current ||
            state.mode !== prevModeRef.current
        ) {
            prevStatusRef.current = state.status;
            prevMethodRef.current = state.method;
            prevModeRef.current = state.mode;
            saveState(state);
        }
    }, [state.status, state.method, state.mode, state]);

    // Tick logic
    useEffect(() => {
        if (state.status === "running") {
            intervalRef.current = setInterval(() => {
                setState((prev) => {
                    if (prev.timeLeft <= 1) {
                        playDing();
                        const notifTitle = "Timer complete! 🎉";
                        const notifBody = prev.mode === "focus"
                            ? `Great focus on "${prev.taskTitle}". Time for a break!`
                            : "Break's over — ready to focus again?";
                        fireNativeNotification(notifTitle, notifBody);

                        // Persist completed focus session to backend
                        if (prev.mode === "focus") {
                            const d = getModeDurations(prev.method);
                            const focusMinutes = Math.round(d.focus / 60);
                            apiClient.patch("/api/auth/me/focus-time", { minutes: focusMinutes }).catch((err) => {
                                console.error("[FocusTimer] Failed to persist focus time:", err);
                            });
                        }

                        const d = getModeDurations(prev.method);
                        return { ...prev, status: "idle", timeLeft: d[prev.mode], startedAt: null };
                    }
                    return { ...prev, timeLeft: prev.timeLeft - 1 };
                });
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        return () => {
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        };
    }, [state.status]);

    // ── Actions ────────────────────────────────────────
    const openTimer = useCallback((title: string) => {
        setState((prev) => {
            const d = getModeDurations(prev.method);
            return {
                ...prev,
                isOpen: true,
                minimized: false,
                taskTitle: title,
                ...(prev.status === "idle" ? { timeLeft: d[prev.mode], startedAt: null } : {}),
            };
        });
    }, []);

    const closeTimer = useCallback(() => {
        setState((prev) => {
            const d = getModeDurations(prev.method);
            return {
                ...prev, isOpen: false, minimized: false, status: "idle",
                timeLeft: d[prev.mode], startedAt: null,
            };
        });
    }, []);

    const minimize = useCallback(() => setState((p) => ({ ...p, minimized: true })), []);
    const restore = useCallback(() => setState((p) => ({ ...p, minimized: false })), []);

    const play = useCallback(() => {
        try { if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission(); } catch { /**/ }
        setState((prev) => {
            const d = getModeDurations(prev.method);
            return {
                ...prev,
                status: "running",
                startedAt: Date.now(),
                timeLeft: prev.timeLeft === 0 ? d[prev.mode] : prev.timeLeft,
            };
        });
    }, []);

    const pause = useCallback(() => setState((p) => ({ ...p, status: "paused", startedAt: null })), []);

    const reset = useCallback(() => {
        setState((p) => {
            const d = getModeDurations(p.method);
            return { ...p, status: "idle", timeLeft: d[p.mode], startedAt: null };
        });
    }, []);

    const setModeAction = useCallback((m: TimerMode) => {
        setState((p) => {
            const d = getModeDurations(p.method);
            return { ...p, mode: m, status: "idle", timeLeft: d[m], startedAt: null };
        });
    }, []);

    const setMethodAction = useCallback((method: ProductivityMethod) => {
        setState((p) => {
            const d = getModeDurations(method);
            return { ...p, method, mode: "focus", status: "idle", timeLeft: d.focus, startedAt: null };
        });
    }, []);

    const value = useMemo<FocusTimerContextType>(() => ({
        ...state, openTimer, closeTimer, minimize, restore, play, pause, reset, setMode: setModeAction, setMethod: setMethodAction, durations,
    }), [state, openTimer, closeTimer, minimize, restore, play, pause, reset, setModeAction, setMethodAction, durations]);

    return (
        <FocusTimerContext.Provider value={value}>
            {children}
        </FocusTimerContext.Provider>
    );
}

// ── Hook ───────────────────────────────────────────────
export function useFocusTimer() {
    return useContext(FocusTimerContext);
}
