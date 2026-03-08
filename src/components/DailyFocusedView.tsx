import { useState, useCallback, useId, useMemo, useEffect, useRef, memo } from "react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import { Plus, RotateCcw, Check, Lock, ChevronLeft, ChevronRight, CalendarDays, ArrowRight } from "lucide-react";
import TaskDrawer from "./TaskDrawer";
import type { DrawerTask } from "@/types";
import TaskContextMenu, { type ContextMenuAction } from "./TaskContextMenu";
import { useAuth } from "./AuthContext";
import { useProjectData } from "./ProjectDataContext";
import type { ProjectRole, ProjectMember } from "@/types";
import { useCommandPalette } from "./CommandPalette";
import { sanitizeInput } from "@/lib/sanitize";
import { toast } from "sonner";
import type { Tag, Task, DayColumn } from "@/types";
import { useTasks } from "@/hooks/useTasks";
import { ProjectService } from "@/api/projectService";
import { computeProgress, PRIORITY_DOT, PRIORITY_LABEL, buildWeekForOffset, weekLabel, getWeekNumber, toLocalDateStr } from "@/lib/taskUtils";

// ── Helper: compute % progress from columns ──────────
// (re-exported from @/lib/taskUtils for testing)
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Custom sensor: only activate on left-click to allow right-click context menu ──
class LeftClickSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent: event }: { nativeEvent: PointerEvent }) => {
        return event.button === 0;
      },
    },
  ];
}

// ── Types (imported from canonical @/types) ─────────────

// ── Week builder uses Saturday-Friday boundaries (from taskUtils) ──

// ── Tag styles ─────────────────────────────────────────
const TAG_STYLES: Record<string, { light: string; dark: string }> = {
  indigo: {
    light: "bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700",
    dark: "bg-transparent ring-1 ring-indigo-400/60 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.3)]",
  },
  rose: {
    light: "bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700",
    dark: "bg-transparent ring-1 ring-rose-400/60 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]",
  },
  emerald: {
    light: "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700",
    dark: "bg-transparent ring-1 ring-emerald-400/60 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]",
  },
  amber: {
    light: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700",
    dark: "bg-transparent ring-1 ring-amber-400/60 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]",
  },
  sky: {
    light: "bg-gradient-to-r from-sky-100 to-cyan-100 text-sky-700",
    dark: "bg-transparent ring-1 ring-sky-400/60 text-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.3)]",
  },
};

// Phase 1: Team assignee avatars removed (single-player only)

// ── Sub-components ─────────────────────────────────────
const TaskTag = memo(function TaskTag({ tag }: { tag: Tag }) {
  const s = TAG_STYLES[tag.color] || TAG_STYLES.indigo;
  return (
    <>
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${s.light} dark:hidden`}>{tag.label}</span>
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold hidden dark:inline-flex ${s.dark}`}>{tag.label}</span>
    </>
  );
});

// ── Priority indicator colors ──────────────────────────
// ── Static card renderer (used for overlay & display) ──
const TaskCardContent = memo(function TaskCardContent({ task }: { task: Task }) {
  return (
    <div className={`${task.done ? "opacity-60" : ""}`}>
      {task.rolledOver && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500/15 dark:bg-amber-400/20 flex items-center justify-center" title="Rolled over">
          <RotateCcw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        </div>
      )}
      <div className="flex flex-wrap gap-1 mb-2">
        {task.tags.map((t) => <TaskTag key={t.label} tag={t} />)}
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        {task.priority && (
          <span
            className={`inline-block w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] ?? ""}`}
            title={PRIORITY_LABEL[task.priority] ?? task.priority}
          />
        )}
        <h3 className={`stealth-blur font-bold tracking-tighter text-foreground text-[13px] ${task.done ? "line-through decoration-2 decoration-primary/40" : ""}`}>
          {task.title}
        </h3>
      </div>
      <p className={`stealth-blur text-[11px] text-muted-foreground leading-relaxed mb-3 ${task.done ? "line-through decoration-1 decoration-muted-foreground/30" : ""}`}>
        {task.description}
      </p>
    </div>
  );
});

// ── Sortable task card ─────────────────────────────────
const SortableTaskCard = memo(function SortableTaskCard({
  task,
  onToggle,
  onClick,
  onContextMenu,
  readOnly,
  canToggle,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  readOnly?: boolean;
  canToggle?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: isDragging ? 0.3 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`
        rounded-[2rem] p-4 ${readOnly ? "cursor-default" : "cursor-grab active:cursor-grabbing"} select-none relative
        bg-white/60 dark:bg-white/[0.04]
        backdrop-blur-lg border-[0.5px] border-black/5 dark:border-white/20
        shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06),0_2px_8px_-4px_rgba(0,0,0,0.02)]
        dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4),0_0_12px_rgba(99,102,241,0.03)]
        transition-shadow duration-200
        touch-none
      `}
      {...(readOnly ? {} : attributes)}
      {...(readOnly ? {} : listeners)}
      onContextMenu={readOnly ? undefined : onContextMenu}
    >
      <div onClick={onClick}>
        <TaskCardContent task={task} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end">
        {(canToggle !== false) && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
            className={`
              w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 active:scale-[0.85]
              ${task.done
                ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                : "ring-1 ring-foreground/10 hover:ring-primary/40 hover:bg-primary/5"
              }
            `}
          >
            {task.done && <Check className="w-3 h-3" />}
          </button>
        )}
        {canToggle === false && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center ring-1 ring-foreground/5 text-muted-foreground/30">
            <Lock className="w-2.5 h-2.5" />
          </div>
        )}
      </div>
    </motion.div>
  );
});

// ── Drag Overlay Card ──────────────────────────────────
const DragOverlayCard = memo(function DragOverlayCard({ task }: { task: Task }) {
  return (
    <div
      className="
        rounded-[2rem] p-4 select-none relative
        bg-white/80 dark:bg-white/[0.08]
        backdrop-blur-lg border-[0.5px] border-black/5 dark:border-white/20
        shadow-[0_24px_80px_-12px_rgba(99,102,241,0.25),0_12px_36px_-8px_rgba(0,0,0,0.15)]
        dark:shadow-[0_24px_80px_-12px_rgba(99,102,241,0.4),0_12px_36px_-8px_rgba(0,0,0,0.5)]
        rotate-[2deg] scale-105
        transition-all duration-150
      "
      style={{ maxWidth: 220 }}
    >
      <TaskCardContent task={task} />
    </div>
  );
});

// ── Quick Add Input ────────────────────────────────────
const QuickAdd = memo(function QuickAdd({ onAdd, disabled }: { onAdd: (title: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const isSubmittingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const dismiss = useCallback(() => {
    setValue("");
    setOpen(false);
    isSubmittingRef.current = false;
  }, []);

  // Bug fix #3 — Past dates: hide the entire add UI for past columns.
  if (disabled) return null;

  const submit = useCallback(() => {
    // Ironclad useRef lock — impervious to React state batching delays.
    // The lock is NEVER released here; it stays locked until the form
    // re-opens, preventing any queued Enter events from creating duplicates.
    if (isSubmittingRef.current) return;
    const trimmed = value.trim();
    if (!trimmed) {
      dismiss();
      return;
    }
    // Instantly lock via ref — synchronous, no state batching lag
    isSubmittingRef.current = true;
    // Fire task creation
    onAdd(trimmed);
    // Schedule form close — state batched, renders later.
    // Do NOT call dismiss() (which resets the ref lock).
    setValue("");
    setOpen(false);
  }, [value, onAdd, dismiss]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      // Small delay ensures the AnimatePresence element has rendered
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  return (
    <div className="mt-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden mb-2"
          >
            <form
              onSubmit={(e) => { e.preventDefault(); submit(); }}
              className="
                rounded-xl p-3
                bg-white/10 dark:bg-white/5
                backdrop-blur-lg
                border border-white/20
                shadow-[0_8px_30px_rgb(0,0,0,0.12)]
                dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)]
                focus-within:ring-2 focus-within:ring-primary/50
                transition-all duration-300
                w-full min-w-0 box-border overflow-hidden
              "
            >
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={isSubmittingRef.current}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                  if (e.key === "Escape") dismiss();
                }}
                onBlur={(e) => {
                  // Don't dismiss if focus moved to something inside this form
                  if (e.currentTarget.form?.contains(e.relatedTarget as Node)) return;
                  dismiss();
                }}
                placeholder="What needs to be done?"
                className="
                  w-full min-w-0 bg-transparent text-xs text-foreground
                  placeholder:text-muted-foreground/50
                  outline-none border-none
                  tracking-tight
                  break-words
                "
              />
              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/[0.06] min-w-0">
                <span className="text-[10px] text-muted-foreground/50 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <kbd className="bg-white/10 dark:bg-white/[0.06] px-1 py-0.5 rounded text-[9px] font-mono">↵</kbd>
                    <span>save</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="bg-white/10 dark:bg-white/[0.06] px-1 py-0.5 rounded text-[9px] font-mono">Esc</kbd>
                    <span>cancel</span>
                  </span>
                </span>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onMouseDown={(e) => e.preventDefault()}
                  className="
                    px-2.5 py-1 rounded-lg text-[10px] font-semibold
                    bg-primary/15 text-primary hover:bg-primary/25
                    transition-colors duration-200
                  "
                >
                  Save
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      {!open && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => { isSubmittingRef.current = false; setOpen(true); }}
          className="
            w-full flex items-center justify-center gap-1.5 py-2 rounded-2xl
            text-[10px] font-semibold text-muted-foreground
            bg-foreground/[0.03] dark:bg-white/[0.03]
            hover:bg-foreground/[0.06] dark:hover:bg-white/[0.06]
            ring-1 ring-white/10
            transition-all duration-200
          "
        >
          <Plus className="w-3 h-3" />
          Quick Add
        </motion.button>
      )}
    </div>
  );
});

// ── Droppable Day Column (memo'd to prevent re-renders on sibling updates) ──
const DroppableDayColumn = memo(function DroppableDayColumn({
  columnId,
  children,
  isToday: today,
  isPast,
  day,
  dateStr,
  taskCount,
  "data-today": dataToday,
}: {
  columnId: string;
  children: React.ReactNode;
  isToday: boolean;
  isPast: boolean;
  day: string;
  dateStr: string;
  taskCount: number;
  "data-today"?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId, disabled: isPast });

  return (
    <motion.div
      ref={setNodeRef}
      variants={colVariants}
      data-today={dataToday}
      className={`
        flex flex-col gap-3 min-w-[200px] w-[75vw] sm:w-[45vw] md:w-auto md:min-w-0 snap-center rounded-[2rem] p-4
        backdrop-blur-lg border-[0.5px] border-black/5 dark:border-white/20
        transition-all duration-300 flex-shrink-0 md:flex-shrink
        ${today
          ? "bg-primary/[0.06] dark:bg-primary/[0.08] shadow-[0_0_30px_rgba(99,102,241,0.08)]"
          : "bg-white/[0.05] dark:bg-black/[0.05]"
        }
        ${isPast
          ? "opacity-50 pointer-events-[all] cursor-not-allowed"
          : ""
        }
        ${isOver && !isPast
          ? "border-primary/30 bg-primary/[0.04] dark:bg-primary/[0.06] shadow-[0_0_40px_rgba(99,102,241,0.12)]"
          : ""
        }
      `}
    >
      {/* Day header */}
      <div className="px-1 mb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {day.slice(0, 3)}
          </h2>
          {today && (
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          )}
          <div className="
            ml-auto w-5 h-5 rounded-full flex items-center justify-center
            text-[9px] font-bold text-muted-foreground
            bg-foreground/[0.04] dark:bg-white/[0.06]
            ring-1 ring-foreground/[0.06]
          ">
            {taskCount}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{dateStr}</p>
      </div>

      {children}
    </motion.div>
  );
});

// ── Empty State ────────────────────────────────────────
function EmptyDayState() {
  return (
    <div className="flex-1 flex items-center justify-center py-8">
      <p className="text-[11px] font-medium text-muted-foreground/25 dark:text-muted-foreground/20 blur-[0.5px] select-none italic">
        Rest Day
      </p>
    </div>
  );
}

// ── Next-Week Drop Zone ────────────────────────────────
const NEXT_WEEK_DROPPABLE_ID = "next-week";

const NextWeekDropZone = memo(function NextWeekDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: NEXT_WEEK_DROPPABLE_ID });

  return (
    <motion.div
      ref={setNodeRef}
      variants={colVariants}
      className={`
        flex flex-col items-center justify-center gap-2
        min-w-[100px] w-[50vw] sm:w-[32vw] md:w-auto md:min-w-0 snap-center
        rounded-[2rem] p-4 backdrop-blur-lg
        border-[0.5px] border-dashed
        transition-all duration-300 flex-shrink-0 md:flex-shrink
        ${isOver
          ? "border-primary/50 bg-primary/[0.08] dark:bg-primary/[0.12] shadow-[0_0_40px_rgba(99,102,241,0.15)]"
          : "border-muted-foreground/20 bg-white/[0.02] dark:bg-black/[0.02]"
        }
      `}
    >
      <ArrowRight className={`w-5 h-5 transition-colors duration-200 ${isOver ? "text-primary" : "text-muted-foreground/40"}`} />
      <p className={`text-[10px] font-semibold uppercase tracking-[0.15em] transition-colors duration-200 text-center ${isOver ? "text-primary" : "text-muted-foreground/40"}`}>
        Next Week
      </p>
    </motion.div>
  );
});

// ── Day Names ──────────────────────────────────────────
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDayHeader(date: Date): { day: string; dateStr: string } {
  return {
    day: DAY_NAMES[date.getDay()],
    dateStr: `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`,
  };
}

function checkIsToday(date: Date): boolean {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

/** True when the column date is strictly before today (local). */
function checkIsPastDay(date: Date): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const colDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return colDay < today;
}

// ── Container animations ───────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const colVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

// ── Helpers ────────────────────────────────────────────
function findColumnOfTask(columns: DayColumn[], taskId: string): number {
  return columns.findIndex((col) => col.tasks.some((t) => t.id === taskId));
}

// ── Task persistence per project (via useTasks hook) ───

// ── Main Component ─────────────────────────────────────
export default function DailyFocusedView({ projectId, projectMode = "solo", projectMembers = [], projectTags = [] }: {
  projectId?: string;
  projectMode?: "solo" | "team";
  projectMembers?: ProjectMember[];
  projectTags?: { label: string; color: string }[];
}) {
  const { user } = useAuth();
  const { getMyRole, updateProject, getProject } = useProjectData();

  const isSolo = projectMode === "solo";
  const myRole: ProjectRole = "owner";
  const isEditor = false;
  const isFullAccess = true;

  // Get current user initials for filtering editor tasks
  const userInitials = useMemo(() => {
    if (!user?.fullName) return "";
    return user.fullName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }, [user?.fullName]);

  // ── Week navigation state (Saturday-Friday) ──────────
  const [weekOffset, setWeekOffset] = useState(0);
  const seedWeek = useCallback(() => buildWeekForOffset(weekOffset), [weekOffset]);

  // Listen for ChronosTimeline sync events
  useEffect(() => {
    const onToday = () => setWeekOffset(0);
    const onWeekChange = (e: Event) => {
      const offset = (e as CustomEvent).detail?.weekOffset;
      if (typeof offset === "number") setWeekOffset(offset);
    };
    window.addEventListener("chronos:today", onToday);
    window.addEventListener("chronos:weekChange", onWeekChange);
    return () => {
      window.removeEventListener("chronos:today", onToday);
      window.removeEventListener("chronos:weekChange", onWeekChange);
    };
  }, []);

  // Task state managed by useTasks hook (handles load + persist + project switch)
  const {
    columns, setColumns,
    debouncedSave, saveNow, getAllColumns, refetch,
    addTaskAtomic, toggleTaskAtomic, patchTaskAtomic, deleteTaskAtomic, reorderAtomic,
  } = useTasks(projectId, seedWeek);

  // ── Optimistic save: update progress INSTANTLY ──
  // For atomic calls we only need the local progress recalc —
  // the debouncedSave is no longer needed for individual mutations.
  const recalcProgress = useCallback(() => {
    if (projectId) {
      const allCols = getAllColumns();
      const hasTasks = allCols.some(c => c.tasks.length > 0);
      if (hasTasks) {
        const progress = computeProgress(allCols);
        updateProject(projectId, { progress });
      }
    }
  }, [projectId, updateProject, getAllColumns]);

  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const columnsSnapshotRef = useRef<DayColumn[] | null>(null);
  const [contextMenuTaskId, setContextMenuTaskId] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Stable ref to current columns — used by handleDragEnd to compute reorder payloads
  // synchronously instead of relying on React 18's deferred updater execution.
  const colRef = useRef(columns);
  colRef.current = columns;

  // Ref for the scrollable 7-day grid (mobile horizontal scroll)
  const gridRef = useRef<HTMLDivElement>(null);

  // Command palette: auto-open a task drawer when navigating to a specific task
  const { pendingNav, clearPendingNav } = useCommandPalette();
  useEffect(() => {
    if (!pendingNav?.taskId) return; // Early exit — don't scan columns when there's no pending nav
    for (const col of columns) {
      const found = col.tasks.find((t) => t.id === pendingNav.taskId);
      if (found) {
        setDrawerTask(found);
        setDrawerOpen(true);
        clearPendingNav();
        return;
      }
    }
  }, [pendingNav?.taskId, columns, clearPendingNav]);

  // For editors, filter tasks to only show assigned ones
  const visibleColumns = useMemo(() => {
    if (!isEditor || !userInitials) return columns;
    return columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((t) => t.assignees.includes(userInitials)),
    }));
  }, [columns, isEditor, userInitials]);

  // Helper: check if a column index is within ±1 day of today
  // Fix: compare calendar date components, not epoch ms. Column dates are at
  // LOCAL NOON (set by mapTaskColumns / buildWeekForOffset) so epoch equality
  // against midnight would always return -1.
  const todayIdx = useMemo(() => {
    const now = new Date();
    return columns.findIndex((c) =>
      c.date.getFullYear() === now.getFullYear() &&
      c.date.getMonth() === now.getMonth() &&
      c.date.getDate() === now.getDate()
    );
  }, [columns]);

  // Scroll the mobile grid to today's column
  const scrollToToday = useCallback(() => {
    if (!gridRef.current) return;
    const todayCol = gridRef.current.querySelector('[data-today="true"]') as HTMLElement | null;
    if (todayCol) {
      todayCol.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, []);

  // Bug fix #1 — Tag State Reversion:
  // drawerTask is a snapshot taken at open time. When the board columns update
  // (e.g. after rollover refetch or a context-menu tag change), the snapshot
  // becomes stale. liveDrawerTask resolves the same task from the current
  // columns so the TaskDrawer’s taskSyncKey always reflects live data.
  const liveDrawerTask = useMemo(() => {
    if (!drawerTask) return null;
    for (const col of columns) {
      const live = col.tasks.find((t) => t.id === drawerTask.id);
      if (live) return live as DrawerTask;
    }
    return drawerTask; // fall back to snapshot if task was removed
  }, [drawerTask, columns]);

  // Auto-scroll to today on mount (mobile)
  useEffect(() => {
    requestAnimationFrame(() => setTimeout(scrollToToday, 200));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dndId = useId();
  const sensors = useSensors(
    useSensor(LeftClickSensor, { activationConstraint: { distance: 8 } })
  );

  // Rollover: call the dedicated backend endpoint, then re-fetch
  const [isRollingOver, setIsRollingOver] = useState(false);
  const rollover = useCallback(async () => {
    if (!projectId || isRollingOver) return;
    setIsRollingOver(true);
    try {
      await ProjectService.rolloverTasks(projectId);
      await refetch();
      toast.success("Tasks rolled over to today");
    } catch (err) {
      console.error("[rollover] failed:", err);
      toast.error("Rollover failed. Please try again.");
    } finally {
      setIsRollingOver(false);
    }
  }, [projectId, isRollingOver, refetch]);

  const toggleTask = useCallback((_dayIdx: number, taskId: string) => {
    toggleTaskAtomic(taskId);
    // Recalc progress after toggle
    setTimeout(recalcProgress, 0);
  }, [toggleTaskAtomic, recalcProgress]);

  const addTask = useCallback((dayIdx: number, title: string) => {
    const safeTitle = sanitizeInput(title);
    if (!safeTitle) return;
    const newTask: Task = {
      id: `task-${crypto.randomUUID().slice(0, 8)}`,
      title: safeTitle,
      description: "",
      tags: [],
      assignees: [],
      done: false,
      rolledOver: false,
    };
    addTaskAtomic(dayIdx, newTask);
    // Recalc progress after add
    setTimeout(recalcProgress, 0);
  }, [addTaskAtomic, recalcProgress]);

  const openDrawer = useCallback((task: Task) => {
    setDrawerTask(task);
    setDrawerOpen(true);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    // Sanitize any string fields (title, description) before applying
    const sanitized: Partial<Task> = {};
    for (const [key, val] of Object.entries(updates)) {
      (sanitized as Record<string, unknown>)[key] =
        typeof val === "string" ? sanitizeInput(val) : val;
    }
    patchTaskAtomic(id, sanitized);
    // Recalc progress if done was changed
    if (sanitized.done !== undefined) {
      setTimeout(recalcProgress, 0);
    }

    // ── Auto-sync custom tags to project-level tags ──────────
    // When a task's tags are updated, detect any tags that don't
    // yet exist in the project's global tag list and push them
    // so they appear in Project Settings → Tags automatically.
    if (sanitized.tags && projectId) {
      const project = getProject(projectId);
      if (project) {
        const existingLabels = new Set(
          (project.tags ?? []).map((t) => t.label.toLowerCase()),
        );
        const newProjectTags = sanitized.tags
          .filter((t) => !existingLabels.has(t.label.toLowerCase()))
          .map((t) => ({
            id: `tag-${crypto.randomUUID().slice(0, 8)}`,
            label: t.label,
            color: t.color,
          }));
        if (newProjectTags.length > 0) {
          updateProject(projectId, {
            tags: [...(project.tags ?? []), ...newProjectTags],
          });
        }
      }
    }
  }, [patchTaskAtomic, recalcProgress, projectId, getProject, updateProject]);

  const toggleTaskById = useCallback((id: string) => {
    toggleTaskAtomic(id);
    setTimeout(recalcProgress, 0);
  }, [toggleTaskAtomic, recalcProgress]);

  const handleCardContextMenu = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setContextMenuTaskId(taskId);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  const contextMenuActions: ContextMenuAction = useMemo(() => ({
    changeTag: (taskId, tag) => {
      if (isEditor) return;
      const currentTask = colRef.current.flatMap(c => c.tasks).find(t => t.id === taskId);
      if (!currentTask) return;
      const hasTag = currentTask.tags.some(tt => tt.label === tag.label);
      const newTags = hasTag
        ? currentTask.tags.filter(tt => tt.label !== tag.label)
        : [...currentTask.tags, tag];
      // Use updateTask so custom tags auto-sync to project-level tags
      updateTask(taskId, { tags: newTags });
    },
    changeAssignee: (taskId, assigneeInitials) => {
      if (isEditor) return;
      const currentTask = colRef.current.flatMap(c => c.tasks).find(t => t.id === taskId);
      if (!currentTask) return;
      const has = currentTask.assignees.includes(assigneeInitials);
      const newAssignees = has
        ? currentTask.assignees.filter(a => a !== assigneeInitials)
        : [...currentTask.assignees, assigneeInitials];
      patchTaskAtomic(taskId, { assignees: newAssignees });
    },
    deleteTask: (taskId) => {
      if (isEditor) return;
      deleteTaskAtomic(taskId);
      setTimeout(recalcProgress, 0);
    },
  }), [isEditor, patchTaskAtomic, deleteTaskAtomic, recalcProgress, updateTask]);

  // ── DnD handlers ─────────────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (isEditor) return; // editors cannot drag tasks
    const { active } = event;
    // Snapshot columns before any mutations so we can revert on cancel/out-of-bounds
    setColumns((prev) => {
      columnsSnapshotRef.current = prev.map((c) => ({ ...c, tasks: [...c.tasks] }));
      const colIdx = findColumnOfTask(prev, active.id as string);
      if (colIdx >= 0) {
        const task = prev[colIdx].tasks.find((t) => t.id === active.id);
        if (task) setActiveTask(task);
      }
      return prev; // no mutation
    });
  }, [isEditor]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    if (isEditor) return; // editors cannot drag tasks
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // "Next week" drop zone — no live preview needed; handled fully in dragEnd
    if (overId === NEXT_WEEK_DROPPABLE_ID) return;

    setColumns((prev) => {
      const activeColIdx = findColumnOfTask(prev, activeId);
      let overColIdx = prev.findIndex((_, i) => `day-${i}` === overId);
      if (overColIdx < 0) overColIdx = findColumnOfTask(prev, overId);

      if (activeColIdx < 0 || overColIdx < 0 || activeColIdx === overColIdx) return prev;

      // Block drops on past-day columns
      if (checkIsPastDay(prev[overColIdx].date)) return prev;

      const next = prev.map((c) => ({ ...c, tasks: [...c.tasks] }));
      const taskIdx = next[activeColIdx].tasks.findIndex((t) => t.id === activeId);
      if (taskIdx < 0) return prev;
      const [task] = next[activeColIdx].tasks.splice(taskIdx, 1);

      const overTaskIdx = next[overColIdx].tasks.findIndex((t) => t.id === overId);
      if (overTaskIdx >= 0) {
        next[overColIdx].tasks.splice(overTaskIdx, 0, task);
      } else {
        next[overColIdx].tasks.push(task);
      }
      return next;
    });
  }, [isEditor]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (isEditor) { setActiveTask(null); columnsSnapshotRef.current = null; return; }
    const { active, over } = event;
    setActiveTask(null);

    // Dropped outside all droppable areas — revert to snapshot
    if (!over) {
      if (columnsSnapshotRef.current) {
        setColumns(columnsSnapshotRef.current);
      }
      columnsSnapshotRef.current = null;
      return;
    }

    columnsSnapshotRef.current = null;

    const activeId = active.id as string;
    const overId = over.id as string;

    // ── "Next Week" drop zone ──────────────────────────
    if (overId === NEXT_WEEK_DROPPABLE_ID) {
      // Capture the task + source date for undo before mutating
      let movedTask: Task | null = null;
      let sourceDateISO = "";

      setColumns((prev) => {
        const srcColIdx = findColumnOfTask(prev, activeId);
        if (srcColIdx < 0) return prev;

        const next = prev.map((c) => ({ ...c, tasks: [...c.tasks] }));
        const taskIdx = next[srcColIdx].tasks.findIndex((t) => t.id === activeId);
        if (taskIdx < 0) return prev;

        // Save for undo
        movedTask = { ...next[srcColIdx].tasks[taskIdx] };
        sourceDateISO = next[srcColIdx].date.toISOString();

        next[srcColIdx].tasks.splice(taskIdx, 1);

        // Build reorder payload: remaining tasks in source column + moved task in next week
        const nextWeekCols = buildWeekForOffset(weekOffset + 1);
        const targetDate = nextWeekCols[0].date;
        const reorderPayload: { id: string; sortOrder: number; columnDate: string }[] = [];
        next[srcColIdx].tasks.forEach((t, i) => {
          reorderPayload.push({ id: t.id, sortOrder: i, columnDate: next[srcColIdx].date.toISOString() });
        });
        reorderPayload.push({ id: activeId, sortOrder: 0, columnDate: targetDate.toISOString() });
        reorderAtomic(reorderPayload);

        return next;
      });

      toast.success("Task moved to next week", {
        action: {
          label: "Undo",
          onClick: () => {
            if (!movedTask || !sourceDateISO) return;
            const taskToRestore = movedTask;
            const srcDate = sourceDateISO;

            // Restore task back to its original column
            setColumns((prev) => {
              const colIdx = prev.findIndex(
                (c) => c.date.toISOString() === srcDate,
              );
              if (colIdx < 0) return prev; // original column no longer visible
              const next = prev.map((c) => ({ ...c, tasks: [...c.tasks] }));
              next[colIdx].tasks.push(taskToRestore);

              // Reorder API: move the task back to source date
              const reorderPayload = next[colIdx].tasks.map((t, i) => ({
                id: t.id,
                sortOrder: i,
                columnDate: srcDate,
              }));
              reorderAtomic(reorderPayload);

              return next;
            });
            toast.success("Task restored");
          },
        },
      });
      return;
    }

    // Read current columns from ref (always up-to-date, immune to React 18
    // batching deferring the setColumns updater).
    const current = colRef.current;
    const activeColIdx = findColumnOfTask(current, activeId);
    let overColIdx = current.findIndex((_, i) => `day-${i}` === overId);
    if (overColIdx < 0) overColIdx = findColumnOfTask(current, overId);

    if (activeColIdx < 0 || overColIdx < 0) return;

    // Block drops on past-day columns — revert to snapshot
    if (checkIsPastDay(current[overColIdx].date)) {
      if (columnsSnapshotRef.current) {
        setColumns(columnsSnapshotRef.current);
      }
      columnsSnapshotRef.current = null;
      return;
    }

    let finalColumns = current;

    // Same column reorder — apply arrayMove and update state
    if (activeColIdx === overColIdx && activeId !== overId) {
      const next = current.map((c) => ({ ...c, tasks: [...c.tasks] }));
      const col = next[activeColIdx];
      const oldIdx = col.tasks.findIndex((t) => t.id === activeId);
      const newIdx = col.tasks.findIndex((t) => t.id === overId);
      if (oldIdx >= 0 && newIdx >= 0) {
        col.tasks = arrayMove(col.tasks, oldIdx, newIdx);
      }
      finalColumns = next;
      setColumns(finalColumns);
    }
    // Cross-column move — state already updated by handleDragOver, no setColumns needed

    // Build reorder payload from the affected columns only (not entire board)
    const affectedIdxs = new Set<number>();
    affectedIdxs.add(activeColIdx);
    affectedIdxs.add(overColIdx);

    const reorderPayload: { id: string; sortOrder: number; columnDate: string }[] = [];
    for (const idx of affectedIdxs) {
      const c = finalColumns[idx];
      c.tasks.forEach((t, sortIdx) => {
        reorderPayload.push({ id: t.id, sortOrder: sortIdx, columnDate: c.date.toISOString() });
      });
    }

    if (reorderPayload.length > 0) {
      reorderAtomic(reorderPayload);
    }
  }, [isEditor, setColumns, reorderAtomic, weekOffset]);

  // Handle drag cancel (Escape during drag, focus loss) — revert to pre-drag state
  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
    if (columnsSnapshotRef.current) {
      setColumns(columnsSnapshotRef.current);
      columnsSnapshotRef.current = null;
    }
  }, []);

  return (
    <>
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          {/* Header with Week Navigation */}
          <motion.div id="onboarding-task-board" variants={colVariants} className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-black tracking-tighter text-foreground">
                Daily Focus
              </h1>
              {isEditor && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-semibold bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Lock className="w-3 h-3" /> Editor — Assigned Tasks Only
                </span>
              )}
              {isFullAccess && (
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={rollover}
                  disabled={isRollingOver}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold
                    bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400
                    backdrop-blur-lg ring-1 ring-white/10
                    shadow-[0_4px_16px_rgba(245,158,11,0.1)]
                    hover:shadow-[0_4px_24px_rgba(245,158,11,0.2)]
                    transition-shadow duration-300
                    ${isRollingOver ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <RotateCcw className={`w-3 h-3 ${isRollingOver ? "animate-spin" : ""}`} />
                  {isRollingOver ? "Rolling over…" : "Rollover"}
                </motion.button>
              )}
            </div>

            {/* ── Week Picker (Time Machine) ── */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setWeekOffset((w) => {
                  const next = w - 1;
                  window.dispatchEvent(new CustomEvent("daily:weekChange", { detail: { weekOffset: next } }));
                  return next;
                })}
                className="p-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Previous week"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>

              <button
                onClick={() => {
                  setWeekOffset(0);
                  window.dispatchEvent(new CustomEvent("daily:weekChange", { detail: { weekOffset: 0 } }));
                  // Scroll to today's column after state settles
                  requestAnimationFrame(() => setTimeout(scrollToToday, 80));
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${weekOffset === 0
                  ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                title={weekOffset === 0 ? "Current week" : "Jump to current week"}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{weekLabel(weekOffset)}</span>
                <span className="sm:hidden">Wk {getWeekNumber(weekOffset)}</span>
              </button>

              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setWeekOffset((w) => {
                  const next = w + 1;
                  window.dispatchEvent(new CustomEvent("daily:weekChange", { detail: { weekOffset: next } }));
                  return next;
                })}
                className="p-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Next week"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>

          {/* 7-day grid + next-week drop zone — horizontal scroll on mobile, grid on desktop */}
          <div ref={gridRef} className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [-webkit-overflow-scrolling:touch] md:grid md:grid-cols-[repeat(7,1fr)_auto] md:overflow-x-visible md:pb-0 md:snap-none">
            {visibleColumns.map((col, dayIdx) => {
              const { day, dateStr } = formatDayHeader(col.date);
              const today = checkIsToday(col.date);
              const past = checkIsPastDay(col.date);
              const columnId = `day-${dayIdx}`;

              return (
                <DroppableDayColumn
                  key={col.date.toISOString()}
                  columnId={columnId}
                  isToday={today}
                  isPast={past}
                  day={day}
                  dateStr={dateStr}
                  taskCount={col.tasks.length}
                  data-today={today ? "true" : undefined}
                >
                  {/* Tasks */}
                  <SortableContext
                    items={col.tasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2.5 flex-1 min-h-[60px]">
                      {col.tasks.length === 0 && <EmptyDayState />}
                      <AnimatePresence>
                        {col.tasks.map((task) => (
                          <SortableTaskCard
                            key={task.id}
                            task={task}
                            onToggle={(id) => toggleTask(dayIdx, id)}
                            onClick={() => openDrawer(task)}
                            onContextMenu={(e) => handleCardContextMenu(e, task.id)}
                            readOnly={false}
                            canToggle={true}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </SortableContext>

                  {/* Quick Add — hidden for editors and for past-date columns */}
                  {isFullAccess && (
                    <QuickAdd
                      onAdd={(title) => addTask(dayIdx, title)}
                      disabled={toLocalDateStr(col.date) < toLocalDateStr(new Date())}
                    />
                  )}
                </DroppableDayColumn>
              );
            })}

            {/* ── Next-week drop zone ── */}
            {isFullAccess && <NextWeekDropZone />}
          </div>
        </motion.div>

        {/* Drag overlay — the floating "lifted" card */}
        <DragOverlay dropAnimation={{
          duration: 250,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}>
          {activeTask ? <DragOverlayCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      <TaskDrawer
        key={liveDrawerTask?.id ?? "closed"}
        task={liveDrawerTask}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdateTask={updateTask}
        onToggleDone={toggleTaskById}
        isSolo={isSolo}
        projectMembers={projectMembers}
        projectId={projectId}
        readOnly={false}
        availableTags={projectTags}
      />

      <TaskContextMenu
        taskId={contextMenuTaskId}
        position={contextMenuPos}
        onClose={() => { setContextMenuTaskId(null); setContextMenuPos(null); }}
        actions={contextMenuActions}
        restrictActions={false}
        availableTags={projectTags}
      />
    </>
  );
}
