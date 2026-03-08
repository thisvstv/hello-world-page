import { useMemo, useId, memo } from "react";
import { motion } from "framer-motion";
import {
    BarChart3,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Layers,
    Rocket,
    Sparkles,
    Palette,
    Shield,
    Zap,
    Globe,
    Code,
    Database,
    Terminal,
    Star,
    Heart,
    Users,
    User,
} from "lucide-react";
import { useProjectData, type ProjectStatus } from "@/components/ProjectDataContext";

// ── Icon map ───────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
    Palette, Layers, Rocket, Sparkles, Shield, Zap, Globe,
    Code, Database, Terminal, Star, Heart,
};

// ── Status meta ────────────────────────────────────────
const STATUS_META: Record<ProjectStatus, { label: string; badgeLight: string; badgeDark: string; icon: React.ElementType }> = {
    "on-track": {
        label: "On Track",
        badgeLight: "bg-emerald-100 text-emerald-700",
        badgeDark: "dark:bg-transparent dark:ring-1 dark:ring-emerald-400/60 dark:text-emerald-300",
        icon: CheckCircle2,
    },
    delayed: {
        label: "Delayed",
        badgeLight: "bg-rose-100 text-rose-700",
        badgeDark: "dark:bg-transparent dark:ring-1 dark:ring-rose-400/60 dark:text-rose-300",
        icon: AlertTriangle,
    },
    completed: {
        label: "Completed",
        badgeLight: "bg-indigo-100 text-indigo-700",
        badgeDark: "dark:bg-transparent dark:ring-1 dark:ring-indigo-400/60 dark:text-indigo-300",
        icon: CheckCircle2,
    },
};

// ── Progress ring ──────────────────────────────────────
const MiniRing = memo(function MiniRing({ value, size = 44 }: { value: number; size?: number }) {
    const gradId = useId();
    const stroke = 3;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (value / 100) * circ;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-foreground/[0.06] dark:text-white/[0.08]" />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke={`url(#${gradId})`} strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />
                <defs>
                    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
                    </linearGradient>
                </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                {value}%
            </span>
        </div>
    );
});

// ── Stat Card ──────────────────────────────────────────
const StatCard = memo(function StatCard({
    label,
    value,
    sub,
    icon: Icon,
    gradient,
    delay = 0,
}: {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ElementType;
    gradient: string;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay }}
            className="
        rounded-[2rem] p-6 relative overflow-hidden
        bg-white/60 dark:bg-white/[0.04]
        backdrop-blur-[40px] border-[0.5px] border-black/5 dark:border-white/20
        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07),inset_0_1px_1px_rgba(255,255,255,0.4)]
        dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.06)]
      "
        >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br ${gradient} mb-4 shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
            <p className="text-3xl font-black tracking-tighter text-foreground mt-1">{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
        </motion.div>
    );
});

// ── Main ───────────────────────────────────────────────
export default function AnalyticsPage() {
    const { projects } = useProjectData();

    const stats = useMemo(() => {
        const totalProjects = projects.length;
        const avgProgress = totalProjects ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / totalProjects) : 0;
        const onTrack = projects.filter((p) => p.status === "on-track").length;
        const delayed = projects.filter((p) => p.status === "delayed").length;
        const completed = projects.filter((p) => p.status === "completed").length;
        const avgDays = totalProjects ? Math.round(projects.reduce((s, p) => s + p.estimatedDays, 0) / totalProjects) : 0;
        const totalNotes = projects.reduce((s, p) => s + p.notes.length, 0);
        const totalMembers = new Set(projects.flatMap((p) => p.members.map((m) => m.name))).size;
        const sorted = [...projects].sort((a, b) => b.progress - a.progress);
        return { totalProjects, avgProgress, onTrack, delayed, completed, avgDays, totalNotes, totalMembers, sorted };
    }, [projects]);

    const { totalProjects, avgProgress, onTrack, delayed, completed, avgDays, totalNotes, totalMembers, sorted } = stats;

    // Empty state
    if (totalProjects === 0) {
        return (
            <div className="max-w-6xl mx-auto flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-7 h-7 text-primary/50" />
                </div>
                <h2 className="text-lg font-bold text-foreground">No Analytics Yet</h2>
                <p className="text-sm text-muted-foreground text-center max-w-sm">Create your first project to see analytics and progress tracking here.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Page header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="flex items-center gap-3 mb-1">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    <h1 className="text-3xl font-black tracking-tighter text-foreground">Analytics</h1>
                </div>
                <p className="text-sm text-muted-foreground">Overview of all your projects, progress, and time estimates.</p>
            </motion.div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <StatCard label="Total Projects" value={totalProjects} icon={Layers} gradient="from-indigo-500 to-violet-500" delay={0} />
                <StatCard label="Avg Progress" value={`${avgProgress}%`} icon={TrendingUp} gradient="from-emerald-500 to-teal-500" delay={0.05} sub={`${completed} completed`} />
                <StatCard label="Avg Est. Time" value={`${avgDays}d`} icon={Clock} gradient="from-amber-500 to-orange-500" delay={0.1} sub={`across ${totalProjects} projects`} />
                <StatCard label="Team Members" value={totalMembers} icon={Users} gradient="from-sky-500 to-cyan-500" delay={0.15} sub={`${totalNotes} total notes`} />
            </div>

            {/* Status breakdown */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="
          rounded-[2rem] p-6
          bg-white/60 dark:bg-white/[0.04]
          backdrop-blur-[40px] border-[0.5px] border-black/5 dark:border-white/20
          shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07),inset_0_1px_1px_rgba(255,255,255,0.4)]
          dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.06)]
        "
            >
                <h2 className="text-sm font-bold tracking-tight text-foreground mb-4">Status Breakdown</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                    {(["on-track", "delayed", "completed"] as ProjectStatus[]).map((st) => {
                        const meta = STATUS_META[st];
                        const Icon = meta.icon;
                        const count = st === "on-track" ? onTrack : st === "delayed" ? delayed : completed;
                        const pct = totalProjects ? Math.round((count / totalProjects) * 100) : 0;
                        return (
                            <div key={st} className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className={`w-4 h-4 ${st === "on-track" ? "text-emerald-500" : st === "delayed" ? "text-rose-500" : "text-indigo-500"}`} />
                                    <span className="text-xs font-semibold text-foreground">{meta.label}</span>
                                    <span className="ml-auto text-xs font-mono text-muted-foreground">{count}</span>
                                </div>
                                <div className="h-2 rounded-full bg-foreground/[0.06] dark:bg-white/[0.08] overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                                        className={`h-full rounded-full ${st === "on-track"
                                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                            : st === "delayed"
                                                ? "bg-gradient-to-r from-rose-500 to-pink-400"
                                                : "bg-gradient-to-r from-indigo-500 to-violet-400"
                                            }`}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Project breakdown */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="
          rounded-[2rem] p-6
          bg-white/60 dark:bg-white/[0.04]
          backdrop-blur-[40px] border-[0.5px] border-black/5 dark:border-white/20
          shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07),inset_0_1px_1px_rgba(255,255,255,0.4)]
          dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.06)]
        "
            >
                <h2 className="text-sm font-bold tracking-tight text-foreground mb-5">Project Progress</h2>
                <div className="space-y-4">
                    {sorted.length === 0 && (
                        <p className="text-xs text-muted-foreground/50 text-center py-8">No projects yet. Create one to see analytics.</p>
                    )}
                    {sorted.map((proj, i) => {
                        const Icon = ICON_MAP[proj.iconName] || Layers;
                        const sm = STATUS_META[proj.status];
                        const elapsed = Math.floor((Date.now() - proj.createdAt) / 86_400_000);
                        const remaining = Math.max(0, proj.estimatedDays - elapsed);

                        return (
                            <motion.div
                                key={proj.id}
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.06 }}
                                className="flex items-center gap-4"
                            >
                                {/* Icon */}
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-5 h-5 text-primary" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-foreground truncate">{proj.name}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-semibold ${sm.badgeLight} ${sm.badgeDark}`}>
                                            {sm.label}
                                        </span>
                                        {proj.mode === "solo" ? (
                                            <User className="w-3 h-3 text-muted-foreground/50" />
                                        ) : (
                                            <Users className="w-3 h-3 text-muted-foreground/50" />
                                        )}
                                    </div>

                                    {/* Progress bar */}
                                    <div className="h-1.5 rounded-full bg-foreground/[0.06] dark:bg-white/[0.08] overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${proj.progress}%` }}
                                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 + i * 0.06 }}
                                            className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60"
                                        />
                                    </div>

                                    <div className="flex gap-4 mt-1">
                                        <span className="text-[10px] text-muted-foreground">
                                            {proj.members.length} member{proj.members.length !== 1 && "s"}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            ~{remaining}d remaining
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {proj.notes.length} note{proj.notes.length !== 1 && "s"}
                                        </span>
                                    </div>
                                </div>

                                {/* Ring */}
                                <div className="hidden sm:block">
                                    <MiniRing value={proj.progress} />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}
