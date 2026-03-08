import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    FolderKanban,
    Plus,
    ArrowRight,
    CalendarClock,
    BarChart3,
    Sparkles,
    Sun,
    Moon,
    Timer,
    Play,
    Pause,
    RotateCcw,
    Zap,
    Target,
    Gamepad2,
    X,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useProjectData } from "@/components/ProjectDataContext";
import { useTheme } from "@/components/ThemeProvider";
import { Link } from "react-router-dom";
import { FocusTimerProvider, useFocusTimer, PRODUCTIVITY_METHODS, MODE_LABELS } from "@/components/FocusTimerContext";
import { ProjectService } from "@/api/projectService";
import type { Task } from "@/types";
import { toLocalDateStr, getSaturdayOfWeek, buildWeekForOffset } from "@/lib/taskUtils";
import SnakeGame from "@/components/SnakeGame";
import Game2048 from "@/components/Game2048";

/* ─── Animation presets ─────────────────────────────── */
const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
};

const stagger = {
    animate: { transition: { staggerChildren: 0.07 } },
};

/* ─── Greeting helper ───────────────────────────────── */
function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
}

/* ─── Quick Action Card ─────────────────────────────── */
function QuickAction({
    icon: Icon,
    gradient,
    title,
    description,
    onClick,
    delay = 0,
    disabled = false,
}: {
    icon: React.ElementType;
    gradient: string;
    title: string;
    description: string;
    onClick: () => void;
    delay?: number;
    disabled?: boolean;
}) {
    return (
        <motion.button
            {...fadeUp}
            transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={disabled ? {} : { scale: 1.01 }}
            whileTap={disabled ? {} : { scale: 0.98 }}
            onClick={disabled ? undefined : onClick}
            aria-disabled={disabled}
            className={`
        group relative text-left p-6 rounded-[1.5rem] overflow-hidden
        bg-white/[0.55] dark:bg-white/[0.025]
        backdrop-blur-lg
        border border-black/[0.06] dark:border-white/[0.06]
        shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none
        hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]
        transition-shadow duration-200 w-full
        ${disabled ? "opacity-60 cursor-not-allowed" : ""}
      `}
        >
            <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}
            >
                <Icon className="w-5 h-5 text-white/90" />
            </div>
            <h3 className="text-[15px] font-bold tracking-tight mb-1 group-hover:text-primary transition-colors">
                {title}
            </h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
                {description}
            </p>
            <ArrowRight className="absolute top-6 right-6 w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </motion.button>
    );
}

/* ─── Widget Card (placeholder) ─────────────────────── */
function WidgetCard({
    icon: Icon,
    gradient,
    title,
    children,
    delay = 0,
}: {
    icon: React.ElementType;
    gradient: string;
    title: string;
    children: React.ReactNode;
    delay?: number;
}) {
    return (
        <motion.div
            {...fadeUp}
            transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="
        relative p-6 rounded-[1.5rem] overflow-hidden
        bg-white/[0.55] dark:bg-white/[0.025]
        backdrop-blur-lg
        border border-black/[0.06] dark:border-white/[0.06]
        shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none
      "
        >
            <div className="flex items-center gap-3 mb-4">
                <div
                    className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}
                >
                    <Icon className="w-4 h-4 text-white/90" />
                </div>
                <h3 className="text-sm font-bold tracking-tight">{title}</h3>
            </div>
            {children}
        </motion.div>
    );
}

/* ─── Type for fetched task entries ─────────────────── */
type TaskEntry = { projectId: string; projectName: string; task: Task; columnDate?: string };

/* ─── Embedded mini Focus Timer widget ─────────────── */
function MiniTimer() {
    const timer = useFocusTimer();
    const { mode, status, timeLeft, method, durations } = timer;

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const total = durations[mode];
    const pct = total > 0 ? ((total - timeLeft) / total) * 100 : 0;
    const cfg = PRODUCTIVITY_METHODS[method];

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-primary/80 uppercase tracking-wider">
                    {cfg.label} · {MODE_LABELS[mode]}
                </span>
                <span className="text-[10px] text-muted-foreground/50">{cfg.description}</span>
            </div>

            {/* Circular-ish progress + time */}
            <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/20" />
                        <circle
                            cx="32" cy="32" r="28" fill="none" strokeWidth="3"
                            className="text-primary transition-all duration-500"
                            strokeDasharray={Math.PI * 56}
                            strokeDashoffset={Math.PI * 56 * (1 - pct / 100)}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold tabular-nums">
                            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    {status === "running" ? (
                        <button
                            onClick={timer.pause}
                            className="w-9 h-9 rounded-xl bg-primary/10 text-primary grid place-items-center hover:bg-primary/20 transition-colors"
                        >
                            <Pause className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                if (status === "idle") timer.openTimer("Focus Session");
                                timer.play();
                            }}
                            className="w-9 h-9 rounded-xl bg-primary/10 text-primary grid place-items-center hover:bg-primary/20 transition-colors"
                        >
                            <Play className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={timer.reset}
                        className="w-9 h-9 rounded-xl bg-muted/30 text-muted-foreground grid place-items-center hover:bg-muted/50 transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Mode selector */}
            <div className="flex gap-1.5">
                {(["focus", "short-break", "long-break"] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => timer.setMode(m)}
                        className={`
                            flex-1 h-7 rounded-lg text-[10px] font-semibold transition-all
                            ${mode === m
                                ? "bg-primary/15 text-primary"
                                : "bg-foreground/[0.03] text-muted-foreground/60 hover:text-muted-foreground"
                            }
                        `}
                    >
                        {MODE_LABELS[m]}
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ─── Full-screen Pomodoro Focus Modal ──────────────── */
function PomodoroModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const timer = useFocusTimer();
    const { mode, status, timeLeft, method, durations } = timer;

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const total = durations[mode];
    const pct = total > 0 ? ((total - timeLeft) / total) * 100 : 0;
    const cfg = PRODUCTIVITY_METHODS[method];

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xl"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 25 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-md mx-4 p-8 rounded-[2rem] bg-background/95 backdrop-blur-lg border border-border/50 shadow-2xl"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/40 grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="text-center mb-6">
                        <h2 className="text-xl font-extrabold tracking-tight mb-1">Focus Mode</h2>
                        <p className="text-sm text-muted-foreground">{cfg.label} &middot; {cfg.description}</p>
                    </div>

                    {/* Large circular timer */}
                    <div className="flex justify-center mb-8">
                        <div className="relative w-48 h-48">
                            <svg className="w-48 h-48 -rotate-90" viewBox="0 0 192 192">
                                <circle cx="96" cy="96" r="84" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
                                <circle
                                    cx="96" cy="96" r="84" fill="none" strokeWidth="6"
                                    className="text-primary transition-all duration-500"
                                    strokeDasharray={Math.PI * 168}
                                    strokeDashoffset={Math.PI * 168 * (1 - pct / 100)}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black tabular-nums tracking-tighter">
                                    {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                                </span>
                                <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-wider mt-1">
                                    {MODE_LABELS[mode]}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                        {status === "running" ? (
                            <button
                                onClick={timer.pause}
                                className="w-14 h-14 rounded-2xl bg-primary/15 text-primary grid place-items-center hover:bg-primary/25 transition-colors"
                            >
                                <Pause className="w-6 h-6" />
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    if (status === "idle") timer.openTimer("Focus Session");
                                    timer.play();
                                }}
                                className="w-14 h-14 rounded-2xl bg-primary/15 text-primary grid place-items-center hover:bg-primary/25 transition-colors"
                            >
                                <Play className="w-6 h-6" />
                            </button>
                        )}
                        <button
                            onClick={timer.reset}
                            className="w-14 h-14 rounded-2xl bg-muted/30 text-muted-foreground grid place-items-center hover:bg-muted/50 transition-colors"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mode selector */}
                    <div className="flex gap-2">
                        {(["focus", "short-break", "long-break"] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => timer.setMode(m)}
                                className={`flex-1 h-10 rounded-xl text-xs font-semibold transition-all ${mode === m
                                    ? "bg-primary/15 text-primary ring-1 ring-primary/20"
                                    : "bg-foreground/[0.03] text-muted-foreground/60 hover:text-muted-foreground"
                                    }`}
                            >
                                {MODE_LABELS[m]}
                            </button>
                        ))}
                    </div>

                    {/* Method selector */}
                    <div className="flex gap-2 mt-3">
                        {(Object.keys(PRODUCTIVITY_METHODS) as Array<keyof typeof PRODUCTIVITY_METHODS>).map((m) => (
                            <button
                                key={m}
                                onClick={() => timer.setMethod(m)}
                                className={`flex-1 h-8 rounded-lg text-[10px] font-semibold transition-all ${method === m
                                    ? "bg-primary/10 text-primary"
                                    : "bg-foreground/[0.02] text-muted-foreground/40 hover:text-muted-foreground"
                                    }`}
                            >
                                {PRODUCTIVITY_METHODS[m].label}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ═══════════════════════════════════════════════════════
   UserHome — The Command Center (with FocusTimer wrapper)
   ═══════════════════════════════════════════════════════ */
export default function UserHome() {
    return (
        <FocusTimerProvider>
            <UserHomeInner />
        </FocusTimerProvider>
    );
}

function UserHomeInner() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { projects } = useProjectData();
    const { theme, toggleTheme } = useTheme();

    const firstName = user?.fullName?.split(" ")[0] || "there";
    const activeCount = projects.filter((p) => p.status !== "completed").length;
    const completedCount = projects.filter((p) => p.status === "completed").length;

    // Modal states for quick actions
    const [showPomodoro, setShowPomodoro] = useState(false);
    const [showMiniGame, setShowMiniGame] = useState(false);
    const [activeGame, setActiveGame] = useState<"snake" | "2048">("snake");

    // ── Fetch tasks from API for all projects ──────
    const [allTasks, setAllTasks] = useState<TaskEntry[]>([]);

    const fetchAllTasks = useCallback(async () => {
        if (projects.length === 0) { setAllTasks([]); return; }
        const projectMap = new Map(projects.map((p) => [p.id, p.name]));
        try {
            const results = await Promise.all(
                projects.map((p) => ProjectService.fetchTasks(p.id).catch(() => []))
            );
            const entries: TaskEntry[] = [];
            results.forEach((columns, idx) => {
                const pid = projects[idx].id;
                const pName = projectMap.get(pid) || pid;
                for (const col of columns) {
                    if (!Array.isArray(col.tasks)) continue;
                    const colDate = col.date ? toLocalDateStr(col.date) : undefined;
                    for (const t of col.tasks) {
                        entries.push({ projectId: pid, projectName: pName, task: t, columnDate: colDate });
                    }
                }
            });
            setAllTasks(entries);
        } catch { setAllTasks([]); }
    }, [projects]);

    useEffect(() => { fetchAllTasks(); }, [fetchAllTasks]);

    // ── Tasks due today (within current Sat-Fri window) ──
    const todayTasks = useMemo(() => {
        const todayStr = toLocalDateStr(new Date());
        // Current week boundaries (Saturday through Friday)
        const satStart = getSaturdayOfWeek(new Date());
        const friEnd = new Date(satStart);
        friEnd.setDate(satStart.getDate() + 6);
        const weekStartStr = toLocalDateStr(satStart);
        const weekEndStr = toLocalDateStr(friEnd);

        return allTasks
            .filter((t) => {
                if (t.task.done) return false;
                // Use column date or explicit dueDate
                const dateStr = t.columnDate
                    || (t.task.dueDate ? toLocalDateStr(t.task.dueDate) : undefined);
                if (!dateStr) return false;
                // Must be today
                return dateStr === todayStr;
            })
            .slice(0, 5);
    }, [allTasks]);

    // ── Planned for next week (peek ahead) ──
    const nextWeekTasks = useMemo(() => {
        const nextWeekCols = buildWeekForOffset(1);
        const nextStart = toLocalDateStr(nextWeekCols[0].date);
        const nextEnd = toLocalDateStr(nextWeekCols[6].date);

        return allTasks
            .filter((t) => {
                if (t.task.done) return false;
                const dateStr = t.columnDate
                    || (t.task.dueDate ? toLocalDateStr(t.task.dueDate) : undefined);
                if (!dateStr) return false;
                return dateStr >= nextStart && dateStr <= nextEnd;
            })
            .slice(0, 4);
    }, [allTasks]);

    // ── Active sprints (non-completed projects) ───
    const activeSprints = useMemo(
        () => projects.filter((p) => p.status !== "completed").slice(0, 4),
        [projects],
    );

    // ── Completed tasks today (minigame unlock gate) ───
    // Count tasks marked done that fall on today’s date column.
    const completedTodayCount = useMemo(() => {
        const todayStr = toLocalDateStr(new Date());
        return allTasks.filter((t) => {
            if (!t.task.done) return false;
            const dateStr = t.columnDate
                || (t.task.dueDate ? toLocalDateStr(t.task.dueDate) : undefined);
            return dateStr === todayStr;
        }).length;
    }, [allTasks]);

    // Game unlocks ONLY when ≥3 tasks have been completed today.
    const gameUnlocked = completedTodayCount >= 3;

    return (
        <div
            className={`min-h-screen ${theme === "dark" ? "mesh-gradient-dark" : "mesh-gradient-light"
                }`}
        >
            {/* ── Nav Bar ─────────────────────────────────── */}
            <nav className="fixed top-0 inset-x-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div
                        className="flex items-center justify-between h-14 mt-3 px-4 rounded-2xl
              bg-background/70 backdrop-blur-lg
              border border-border/50
              shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_12px_rgba(0,0,0,0.04)]
              dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
                    >
                        <Link to="/home" className="flex items-center gap-2.5">
                            <img
                                src="/stride-logo.webp"
                                alt="STRIDE"
                                className="w-7 h-7 object-contain"
                            />
                            <span className="text-[15px] font-extrabold tracking-tight">
                                STRIDE
                            </span>
                        </Link>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {theme === "dark" ? (
                                    <Sun className="w-4 h-4" />
                                ) : (
                                    <Moon className="w-4 h-4" />
                                )}
                            </button>
                            <Link
                                to="/profile"
                                className="h-8 px-4 rounded-lg text-[13px] font-medium inline-flex items-center gap-1.5
                  bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.1]
                  transition-all duration-150"
                            >
                                Profile
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Content ─────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20">
                {/* Greeting */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="mb-10"
                >
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
                        {getGreeting()},{" "}
                        <span className="bg-gradient-to-r from-primary via-violet-500 to-indigo-400 bg-clip-text text-transparent">
                            {firstName}
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-[15px]">
                        Here&apos;s your command center. What would you like to work on?
                    </p>
                </motion.div>

                {/* Quick Actions */}
                <motion.section {...stagger} initial="initial" animate="animate" className="mb-10">
                    <motion.p
                        {...fadeUp}
                        className="text-[11px] font-semibold text-primary uppercase tracking-widest mb-4"
                    >
                        Quick Actions
                    </motion.p>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <QuickAction
                            icon={FolderKanban}
                            gradient="from-indigo-500 to-violet-600"
                            title="Go to Project Dashboard"
                            description="View all your projects, sprints, and task boards."
                            onClick={() => navigate("/dashboard")}
                            delay={0.05}
                        />
                        <QuickAction
                            icon={Target}
                            gradient="from-rose-500 to-pink-600"
                            title="Focus Mode"
                            description="Launch a Pomodoro timer and enter deep focus."
                            onClick={() => setShowPomodoro(true)}
                            delay={0.1}
                        />
                        <QuickAction
                            icon={Gamepad2}
                            gradient="from-emerald-500 to-teal-600"
                            title="Minigames"
                            description={
                                gameUnlocked
                                    ? "Reward unlocked! Play Snake or 2048."
                                    : `Complete ${Math.max(0, 3 - completedTodayCount)} more task${3 - completedTodayCount !== 1 ? "s" : ""} today to unlock.`
                            }
                            disabled={!gameUnlocked}
                            onClick={() => {
                                setShowMiniGame(true);
                            }}
                            delay={0.15}
                        />
                    </div>
                </motion.section>

                {/* Modals */}
                <PomodoroModal open={showPomodoro} onClose={() => setShowPomodoro(false)} />
                {/* Game Selector Modal */}
                <AnimatePresence>
                    {showMiniGame && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xl"
                            onClick={() => setShowMiniGame(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.85, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 260, damping: 25 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full max-w-sm mx-4 rounded-[2rem] bg-background/95 backdrop-blur-lg border border-border/50 shadow-2xl overflow-hidden"
                            >
                                <button
                                    onClick={() => setShowMiniGame(false)}
                                    className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted/40 grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                {/* Tab toggle */}
                                <div className="px-8 pt-8 pb-4 text-center">
                                    <h2 className="text-xl font-extrabold tracking-tight mb-3">Minigames</h2>
                                    <div className="inline-flex rounded-xl bg-muted/50 p-1 gap-1">
                                        <button
                                            onClick={() => setActiveGame("snake")}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeGame === "snake"
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            Snake
                                        </button>
                                        <button
                                            onClick={() => setActiveGame("2048")}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeGame === "2048"
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            2048
                                        </button>
                                    </div>
                                </div>

                                {/* Game area */}
                                <div className="flex items-center justify-center px-4 pb-8">
                                    {activeGame === "snake" ? <SnakeGame /> : <Game2048 />}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Widget Area — 2×2 grid ──────────────── */}
                <motion.section {...stagger} initial="initial" animate="animate">
                    <motion.p
                        {...fadeUp}
                        className="text-[11px] font-semibold text-primary uppercase tracking-widest mb-4"
                    >
                        Overview
                    </motion.p>
                    <div className="grid sm:grid-cols-2 gap-4">

                        {/* ── Focus Timer Widget ───────────── */}
                        <WidgetCard
                            icon={Timer}
                            gradient="from-violet-500 to-purple-600"
                            title="Focus Timer"
                            delay={0.15}
                        >
                            <MiniTimer />
                            {/* Total logged focus time */}
                            {typeof user?.totalFocusMinutes === "number" && user.totalFocusMinutes > 0 && (
                                <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-violet-400" />
                                    <p className="text-[10px] text-muted-foreground">
                                        Total focus:{" "}
                                        <span className="font-semibold text-foreground">
                                            {user.totalFocusMinutes >= 60
                                                ? `${Math.floor(user.totalFocusMinutes / 60)}h ${user.totalFocusMinutes % 60}m`
                                                : `${user.totalFocusMinutes}m`}
                                        </span>
                                    </p>
                                </div>
                            )}
                        </WidgetCard>

                        {/* ── Tasks Due Today Widget ───────── */}
                        <WidgetCard
                            icon={CalendarClock}
                            gradient="from-amber-500 to-orange-600"
                            title="Due Today"
                            delay={0.2}
                        >
                            <div className="space-y-2">
                                {todayTasks.length === 0 ? (
                                    <div className="flex flex-col items-center py-4 text-center">
                                        <Zap className="w-5 h-5 text-emerald-500/40 mb-1.5" />
                                        <p className="text-[11px] text-muted-foreground/50">
                                            All clear — no tasks due today!
                                        </p>
                                    </div>
                                ) : (
                                    todayTasks.map((t, i) => (
                                        <div
                                            key={t.task.id}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-background/60 dark:bg-white/[0.03] border border-border/40"
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.task.priority === "critical" ? "bg-rose-500"
                                                : t.task.priority === "high" ? "bg-amber-500"
                                                    : t.task.priority === "medium" ? "bg-sky-500"
                                                        : "bg-emerald-500"
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] text-foreground/70 truncate">{t.task.title}</p>
                                                <p className="text-[10px] text-muted-foreground/40 truncate">{t.projectName}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {todayTasks.length > 0 && (
                                    <button
                                        onClick={() => navigate("/dashboard")}
                                        className="w-full text-center text-[10px] text-primary hover:underline pt-1"
                                    >
                                        View all in Dashboard →
                                    </button>
                                )}
                            </div>
                        </WidgetCard>

                        {/* ── Planned for Next Week Widget ── */}
                        <WidgetCard
                            icon={ArrowRight}
                            gradient="from-violet-500 to-purple-600"
                            title="Next Week"
                            delay={0.25}
                        >
                            <div className="space-y-2">
                                {nextWeekTasks.length === 0 ? (
                                    <div className="flex flex-col items-center py-4 text-center">
                                        <Sparkles className="w-5 h-5 text-violet-500/40 mb-1.5" />
                                        <p className="text-[11px] text-muted-foreground/50">
                                            Nothing planned for next week yet
                                        </p>
                                    </div>
                                ) : (
                                    nextWeekTasks.map((t) => (
                                        <div
                                            key={t.task.id}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-background/60 dark:bg-white/[0.03] border border-border/40"
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.task.priority === "critical" ? "bg-rose-500"
                                                : t.task.priority === "high" ? "bg-amber-500"
                                                    : t.task.priority === "medium" ? "bg-sky-500"
                                                        : "bg-emerald-500"
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] text-foreground/70 truncate">{t.task.title}</p>
                                                <p className="text-[10px] text-muted-foreground/40 truncate">{t.projectName}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {nextWeekTasks.length > 0 && (
                                    <button
                                        onClick={() => navigate("/dashboard")}
                                        className="w-full text-center text-[10px] text-primary hover:underline pt-1"
                                    >
                                        Plan in Dashboard →
                                    </button>
                                )}
                            </div>
                        </WidgetCard>

                        {/* ── Active Sprints Widget ────────── */}
                        <WidgetCard
                            icon={BarChart3}
                            gradient="from-emerald-500 to-teal-600"
                            title={`Active Projects (${activeCount})`}
                            delay={0.3}
                        >
                            <div className="space-y-2.5">
                                {activeSprints.length === 0 ? (
                                    <div className="flex flex-col items-center py-4 text-center">
                                        <Sparkles className="w-5 h-5 text-muted-foreground/20 mb-1.5" />
                                        <p className="text-[11px] text-muted-foreground/50">No active projects</p>
                                        <button
                                            onClick={() => navigate("/dashboard?action=create")}
                                            className="mt-1 text-[10px] text-primary hover:underline"
                                        >
                                            Create a project
                                        </button>
                                    </div>
                                ) : (
                                    activeSprints.map((project) => (
                                        <button
                                            key={project.id}
                                            onClick={() => navigate("/dashboard")}
                                            className="w-full text-left px-3 py-2.5 rounded-xl bg-background/60 dark:bg-white/[0.03] border border-border/40 hover:bg-background/80 transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <p className="text-[12px] font-semibold text-foreground/80 truncate">{project.name}</p>
                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${project.status === "on-track"
                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                    }`}>
                                                    {project.status === "on-track" ? "On Track" : "Delayed"}
                                                </span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full bg-primary/70"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(project.progress, 100)}%` }}
                                                    transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground/40 mt-1">
                                                {project.progress}% complete · {project.members.length} member{project.members.length !== 1 ? "s" : ""}
                                            </p>
                                        </button>
                                    ))
                                )}
                                {activeCount > 4 && (
                                    <button
                                        onClick={() => navigate("/dashboard")}
                                        className="w-full text-center text-[10px] text-primary hover:underline pt-1"
                                    >
                                        +{activeCount - 4} more projects →
                                    </button>
                                )}
                            </div>
                        </WidgetCard>

                    </div>
                </motion.section>
            </div>
        </div>
    );
}
