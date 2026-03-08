import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Circle } from "lucide-react";
import type { Project } from "../types";

// ── Helpers ────────────────────────────────────────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function daysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function startDayOfWeek(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function isToday(d: Date): boolean {
    return isSameDay(d, new Date());
}

// ── Status badge colors ────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
    "on-track": "bg-blue-500",
    delayed: "bg-amber-500",
    completed: "bg-emerald-500",
};

// ── Deadline map: project → estimated end date ─────────
function getDeadlineDate(project: Project): Date {
    return new Date(project.createdAt + project.estimatedDays * 86400000);
}

// ── Main Calendar Component ────────────────────────────
interface SimpleCalendarProps {
    projects: Project[];
    onSelectProject: (id: string) => void;
}

export default function SimpleCalendar({ projects, onSelectProject }: SimpleCalendarProps) {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    // Build deadline lookup: dateKey → Project[]
    const deadlines = useMemo(() => {
        const map = new Map<string, Project[]>();
        for (const p of projects) {
            const d = getDeadlineDate(p);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const arr = map.get(key) ?? [];
            arr.push(p);
            map.set(key, arr);
        }
        return map;
    }, [projects]);

    const lookup = (d: Date) =>
        deadlines.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) ?? [];

    // Calendar grid
    const totalDays = daysInMonth(year, month);
    const startDay = startDayOfWeek(year, month);
    const cells: (Date | null)[] = [];

    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);

    // Nav
    const prev = useCallback(() => {
        if (month === 0) { setYear((y) => y - 1); setMonth(11); }
        else setMonth((m) => m - 1);
    }, [month]);
    const next = useCallback(() => {
        if (month === 11) { setYear((y) => y + 1); setMonth(0); }
        else setMonth((m) => m + 1);
    }, [month]);
    const goToday = useCallback(() => {
        setYear(now.getFullYear());
        setMonth(now.getMonth());
        setSelectedDay(now);
    }, [now]);

    const selectedProjects = selectedDay ? lookup(selectedDay) : [];

    return (
        <div className="flex flex-col lg:flex-row gap-4">
            {/* Calendar grid */}
            <div
                className="
          flex-1 rounded-2xl overflow-hidden
          bg-white/40 dark:bg-white/[0.03]
          backdrop-blur-[40px] border-[0.5px] border-black/5 dark:border-white/10
          shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]
          dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.25)]
        "
            >
                {/* Header nav */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={prev}
                            className="w-8 h-8 rounded-xl flex items-center justify-center bg-foreground/[0.04] dark:bg-white/[0.06] hover:bg-foreground/[0.08] text-foreground transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </motion.button>
                        <h2 className="text-sm font-bold tracking-tight text-foreground min-w-[140px] text-center">
                            {MONTHS[month]} {year}
                        </h2>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={next}
                            className="w-8 h-8 rounded-xl flex items-center justify-center bg-foreground/[0.04] dark:bg-white/[0.06] hover:bg-foreground/[0.08] text-foreground transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={goToday}
                        className="text-[10px] font-semibold px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                        Today
                    </motion.button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 px-3 pt-3">
                    {DAYS.map((d) => (
                        <div
                            key={d}
                            className="text-center text-[10px] font-semibold text-muted-foreground/50 py-2"
                        >
                            {d}
                        </div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
                    {cells.map((date, idx) => {
                        if (!date) {
                            return <div key={`empty-${idx}`} className="h-14" />;
                        }

                        const dayProjects = lookup(date);
                        const isSelected = selectedDay ? isSameDay(date, selectedDay) : false;
                        const today = isToday(date);

                        return (
                            <motion.button
                                key={date.toISOString()}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedDay(date)}
                                className={`
                  relative h-14 rounded-xl flex flex-col items-center justify-start pt-1.5 gap-0.5
                  transition-colors duration-200
                  ${isSelected
                                        ? "bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/30"
                                        : "hover:bg-foreground/[0.03] dark:hover:bg-white/[0.03]"}
                `}
                            >
                                <span
                                    className={`
                    text-xs font-semibold tabular-nums
                    ${today
                                            ? "w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center"
                                            : isSelected
                                                ? "text-primary"
                                                : "text-foreground/70"}
                  `}
                                >
                                    {date.getDate()}
                                </span>

                                {/* Deadline dots */}
                                {dayProjects.length > 0 && (
                                    <div className="flex items-center gap-0.5 mt-auto mb-1">
                                        {dayProjects.slice(0, 3).map((p) => (
                                            <Circle
                                                key={p.id}
                                                className={`w-1.5 h-1.5 ${STATUS_COLORS[p.status] ?? "bg-muted-foreground"} rounded-full fill-current`}
                                            />
                                        ))}
                                        {dayProjects.length > 3 && (
                                            <span className="text-[7px] font-bold text-muted-foreground/50">
                                                +{dayProjects.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Sidebar: selected day details */}
            <AnimatePresence mode="wait">
                {selectedDay && (
                    <motion.div
                        key={selectedDay.toISOString()}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="
              w-full lg:w-72 shrink-0 rounded-2xl overflow-hidden flex flex-col
              bg-white/40 dark:bg-white/[0.03]
              backdrop-blur-[40px] border-[0.5px] border-black/5 dark:border-white/10
              shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]
              dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.25)]
            "
                    >
                        <div className="px-4 py-3 border-b border-black/5 dark:border-white/[0.06]">
                            <h3 className="text-xs font-bold tracking-tight text-foreground">
                                {selectedDay.toLocaleDateString(undefined, {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </h3>
                            <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                                {selectedProjects.length} deadline{selectedProjects.length !== 1 ? "s" : ""}
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                            {selectedProjects.length === 0 ? (
                                <div className="flex items-center justify-center h-24 text-[10px] text-muted-foreground/40">
                                    No deadlines this day
                                </div>
                            ) : (
                                selectedProjects.map((project) => (
                                    <motion.button
                                        key={project.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => onSelectProject(project.id)}
                                        className="
                      w-full text-left p-3 rounded-xl
                      bg-foreground/[0.02] dark:bg-white/[0.03]
                      hover:bg-foreground/[0.05] dark:hover:bg-white/[0.06]
                      border-[0.5px] border-black/5 dark:border-white/[0.06]
                      transition-colors
                    "
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[project.status] ?? "bg-muted-foreground"}`} />
                                            <span className="text-xs font-bold tracking-tight text-foreground truncate stealth-blur">
                                                {project.name}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground/60 line-clamp-1 stealth-blur">
                                            {project.description}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <div className="w-12 h-1 rounded-full bg-foreground/[0.06] dark:bg-white/[0.08] overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-primary/70"
                                                    style={{ width: `${project.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-[8px] font-mono font-semibold text-muted-foreground/50 tabular-nums">
                                                {project.progress}%
                                            </span>
                                        </div>
                                    </motion.button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
