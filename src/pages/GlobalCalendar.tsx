/**
 * GlobalCalendar.tsx
 *
 * Global monthly calendar showing ALL tasks across ALL projects.
 * Accessible via /calendar in the DashboardLayout.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, Circle } from "lucide-react";
import { useProjectData } from "@/components/ProjectDataContext";
import { ProjectService } from "@/api/projectService";
import TaskDrawer from "@/components/TaskDrawer";
import type { DrawerTask } from "@/components/TaskDrawer";
import type { Task } from "@/types";
import { toLocalDateStr } from "@/lib/taskUtils";

// ── Types ──────────────────────────────────────────────
interface CalendarTask extends Task {
    projectId: string;
    projectName: string;
    projectColor: string;
    date: string; // YYYY-MM-DD
}

// ── Helpers ────────────────────────────────────────────
function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
    return new Date(year, month, 1).getDay(); // 0=Sun
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TAG_GRADIENT: Record<string, string> = {
    indigo: "bg-indigo-500",
    rose: "bg-rose-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    sky: "bg-sky-500",
    violet: "bg-violet-500",
};

// ── Component ──────────────────────────────────────────
export default function GlobalCalendar() {
    const { projects, projectsLoaded } = useProjectData();
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [allTasks, setAllTasks] = useState<CalendarTask[]>([]);
    const [loading, setLoading] = useState(true);

    // Drawer state
    const [drawerTask, setDrawerTask] = useState<DrawerTask | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerProjectId, setDrawerProjectId] = useState<string | undefined>();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Fetch tasks from all projects
    useEffect(() => {
        if (!projectsLoaded || projects.length === 0) {
            setAllTasks([]);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        async function fetchAll() {
            const results: CalendarTask[] = [];

            await Promise.allSettled(
                projects.map(async (project) => {
                    try {
                        const columns = await ProjectService.fetchTasks(project.id);
                        if (!columns || cancelled) return;

                        for (const col of columns) {
                            const dateStr = toLocalDateStr(col.date);
                            for (const task of col.tasks) {
                                results.push({
                                    ...task,
                                    projectId: project.id,
                                    projectName: project.name,
                                    projectColor: project.color || "indigo",
                                    date: dateStr,
                                });
                            }
                        }
                    } catch {
                        // Skip projects that fail to load
                    }
                }),
            );

            if (!cancelled) {
                setAllTasks(results);
                setLoading(false);
            }
        }

        fetchAll();
        return () => { cancelled = true; };
    }, [projects, projectsLoaded]);

    // Group tasks by date string
    const tasksByDate = useMemo(() => {
        const map = new Map<string, CalendarTask[]>();
        for (const task of allTasks) {
            const existing = map.get(task.date) ?? [];
            existing.push(task);
            map.set(task.date, existing);
        }
        return map;
    }, [allTasks]);

    // Calendar grid cells
    const calendarCells = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfWeek(year, month);
        const cells: { day: number | null; dateStr: string }[] = [];

        // Leading blanks
        for (let i = 0; i < firstDay; i++) {
            cells.push({ day: null, dateStr: "" });
        }
        // Days of the month
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            cells.push({ day: d, dateStr });
        }
        return cells;
    }, [year, month]);

    const todayStr = toLocalDateStr(new Date());

    const goToPrev = useCallback(() => {
        setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    }, []);

    const goToNext = useCallback(() => {
        setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    }, []);

    const goToToday = useCallback(() => {
        setCurrentDate(new Date());
    }, []);

    const openTask = useCallback((task: CalendarTask) => {
        setDrawerTask(task);
        setDrawerProjectId(task.projectId);
        setDrawerOpen(true);
    }, []);

    const handleUpdateTask = useCallback((id: string, updates: Partial<Task>) => {
        // Update local calendar state optimistically
        setAllTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        );
        // Persist to backend
        if (drawerProjectId) {
            const payload: Record<string, unknown> = {};
            if (updates.title !== undefined) payload.title = updates.title;
            if (updates.description !== undefined) payload.description = updates.description;
            if (updates.done !== undefined) payload.done = updates.done;
            if (updates.tags !== undefined) payload.tags = updates.tags;
            if (updates.assignees !== undefined) payload.assignees = updates.assignees;
            if (updates.priority !== undefined) payload.priority = updates.priority ?? null;
            if (Object.keys(payload).length > 0) {
                ProjectService.patchTask(drawerProjectId, id, payload).catch(() => { });
            }
        }
    }, [drawerProjectId]);

    const handleToggleDone = useCallback((id: string) => {
        setAllTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        );
        if (drawerProjectId) {
            const task = allTasks.find((t) => t.id === id);
            if (task) {
                ProjectService.patchTask(drawerProjectId, id, { done: !task.done }).catch(() => { });
            }
        }
    }, [drawerProjectId, allTasks]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-5xl mx-auto px-4 py-6 sm:py-10"
        >
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <CalendarDays className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-foreground">Calendar</h1>
                        <p className="text-xs text-muted-foreground">All tasks across every project</p>
                    </div>
                </div>

                {/* Month navigation */}
                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={goToPrev}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-foreground/[0.04] dark:bg-white/[0.06] hover:bg-foreground/[0.08] text-muted-foreground hover:text-foreground transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </motion.button>

                    <button
                        onClick={goToToday}
                        className="px-4 py-1.5 rounded-xl text-sm font-bold text-foreground bg-foreground/[0.04] dark:bg-white/[0.06] hover:bg-foreground/[0.08] transition-all min-w-[160px] text-center"
                    >
                        {MONTH_NAMES[month]} {year}
                    </button>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={goToNext}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-foreground/[0.04] dark:bg-white/[0.06] hover:bg-foreground/[0.08] text-muted-foreground hover:text-foreground transition-all"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>

            {/* Calendar grid */}
            <div className="rounded-3xl overflow-hidden ring-1 ring-white/10 bg-white/50 dark:bg-white/[0.02] backdrop-blur-xl shadow-sm">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-foreground/[0.06] dark:border-white/[0.06]">
                    {DAY_LABELS.map((label) => (
                        <div
                            key={label}
                            className="py-3 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground"
                        >
                            {label}
                        </div>
                    ))}
                </div>

                {/* Date cells */}
                <div className="grid grid-cols-7">
                    {calendarCells.map((cell, i) => {
                        const tasks = cell.dateStr ? tasksByDate.get(cell.dateStr) ?? [] : [];
                        const isToday = cell.dateStr === todayStr;
                        const doneCount = tasks.filter((t) => t.done).length;
                        const totalCount = tasks.length;

                        return (
                            <div
                                key={i}
                                className={`
                  relative min-h-[80px] sm:min-h-[100px] p-1.5 sm:p-2
                  border-b border-r border-foreground/[0.04] dark:border-white/[0.04]
                  ${!cell.day ? "bg-foreground/[0.01] dark:bg-white/[0.01]" : ""}
                  ${isToday ? "bg-primary/[0.04] dark:bg-primary/[0.06]" : ""}
                  transition-colors
                `}
                            >
                                {cell.day && (
                                    <>
                                        {/* Date number */}
                                        <div className="flex items-center gap-1 mb-1">
                                            <span
                                                className={`
                          text-xs font-semibold tabular-nums
                          ${isToday
                                                        ? "w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]"
                                                        : "text-muted-foreground"
                                                    }
                        `}
                                            >
                                                {cell.day}
                                            </span>
                                            {totalCount > 0 && (
                                                <span className="text-[9px] text-muted-foreground/60 tabular-nums">
                                                    {doneCount}/{totalCount}
                                                </span>
                                            )}
                                        </div>

                                        {/* Task pills */}
                                        <div className="space-y-0.5 overflow-hidden max-h-[60px] sm:max-h-[72px]">
                                            {tasks.slice(0, 3).map((task) => (
                                                <button
                                                    key={task.id}
                                                    onClick={() => openTask(task)}
                                                    className={`
                            w-full text-left px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-medium
                            truncate block
                            transition-all duration-150 hover:ring-1 hover:ring-primary/30
                            ${task.done
                                                            ? "line-through text-muted-foreground/50 bg-foreground/[0.02] dark:bg-white/[0.02]"
                                                            : "text-foreground bg-foreground/[0.04] dark:bg-white/[0.06]"
                                                        }
                          `}
                                                    title={`${task.title} (${task.projectName})`}
                                                >
                                                    <span className="flex items-center gap-1 min-w-0">
                                                        <Circle
                                                            className={`w-1.5 h-1.5 flex-shrink-0 ${TAG_GRADIENT[task.projectColor] || "bg-indigo-500"} rounded-full`}
                                                            fill="currentColor"
                                                        />
                                                        <span className="truncate">{task.title}</span>
                                                    </span>
                                                </button>
                                            ))}
                                            {tasks.length > 3 && (
                                                <span className="text-[8px] text-muted-foreground/50 px-1.5">
                                                    +{tasks.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Loading state */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-8 text-center text-sm text-muted-foreground"
                    >
                        Loading tasks…
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty state */}
            {!loading && allTasks.length === 0 && (
                <div className="mt-8 text-center">
                    <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No tasks found. Create a project to get started.</p>
                </div>
            )}

            {/* Task Drawer */}
            <TaskDrawer
                key={drawerTask?.id ?? "closed"}
                task={drawerTask}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onUpdateTask={handleUpdateTask}
                onToggleDone={handleToggleDone}
                isSolo={true}
                readOnly={false}
            />
        </motion.div>
    );
}
