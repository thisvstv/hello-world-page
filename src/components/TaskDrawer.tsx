import { useState, useCallback, useEffect, useMemo, useRef, memo } from "react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import { toast } from "sonner";
import { useMobileReducedMotion } from "@/hooks/use-reduced-motion";
import {
  X,
  Calendar as CalendarIcon,
  Flag,
  Check,
  Plus,
  Trash2,
  MessageSquare,
  ChevronDown,
  Timer,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { sanitizeInput } from "@/lib/sanitize";
import { TEAM_MEMBERS, type TagOption } from "./TaskContextMenu";
import type { ProjectMember as ProjectMemberType } from "@/types";
import { useFocusTimer } from "./FocusTimerContext";
import { NotificationService } from "@/api/NotificationService";
import { useAuth } from "./AuthContext";
import { ProjectService, type ActivityLogEntry } from "@/api/projectService";
import type { Tag, Priority, DrawerTask, SubTask, ActivityEntry } from "@/types";

// Re-export DrawerTask for backward compat
export type { DrawerTask };

interface TaskDrawerProps {
  task: DrawerTask | null;
  open: boolean;
  onClose: () => void;
  onUpdateTask: (id: string, updates: Partial<DrawerTask>) => void;
  onToggleDone: (id: string) => void;
  isSolo?: boolean;
  projectMembers?: ProjectMemberType[];
  projectId?: string;
  /** When true, the drawer is read-only — editor role can only toggle done status */
  readOnly?: boolean;
  /** Project-level tags to use in the tag picker */
  availableTags?: { label: string; color: string }[];
}

// ── Priority config ────────────────────────────────────
const PRIORITIES: { value: Priority; label: string; accent: string }[] = [
  { value: "low", label: "Low", accent: "ring-emerald-400/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10" },
  { value: "medium", label: "Medium", accent: "ring-sky-400/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10" },
  { value: "high", label: "High", accent: "ring-amber-400/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10" },
  { value: "critical", label: "Critical", accent: "ring-rose-400/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10" },
];

const PRIORITY_ACTIVE: Record<Priority, string> = {
  low: "bg-emerald-500/15 ring-emerald-400/60 text-emerald-600 dark:text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.2)]",
  medium: "bg-sky-500/15 ring-sky-400/60 text-sky-600 dark:text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]",
  high: "bg-amber-500/15 ring-amber-400/60 text-amber-600 dark:text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.2)]",
  critical: "bg-rose-500/15 ring-rose-400/60 text-rose-600 dark:text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]",
};

// ── Helper: format relative time from ISO timestamp ───
function formatRelativeTime(isoTimestamp: string): string {
  const now = Date.now();
  const then = new Date(isoTimestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(isoTimestamp).toLocaleDateString();
}

// ── Multi-Assignee Picker ──────────────────────────────
function MultiAssigneePicker({ value, onChange, members }: { value: string[]; onChange: (v: string[]) => void; members?: { initials: string; name: string; color: string }[] }) {
  const memberList = members && members.length > 0 ? members : TEAM_MEMBERS;
  const toggle = (initials: string) => {
    onChange(
      value.includes(initials)
        ? value.filter((v) => v !== initials)
        : [...value, initials]
    );
  };

  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">
        Assignees
      </h3>
      {/* Selected badges */}
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        <AnimatePresence>
          {value.map((initials) => {
            const member = memberList.find((m) => m.initials === initials);
            return (
              <motion.button
                key={initials}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onClick={() => toggle(initials)}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold
                  text-white ${member?.color || "bg-primary"}
                  ring-1 ring-white/20
                  shadow-[0_2px_8px_rgba(0,0,0,0.15)]
                  hover:opacity-80 transition-opacity duration-150
                `}
              >
                {member?.name || initials}
                <X className="w-2.5 h-2.5" />
              </motion.button>
            );
          })}
        </AnimatePresence>
        {value.length === 0 && (
          <span className="text-[10px] text-muted-foreground/50 italic">No assignees</span>
        )}
      </div>
      {/* All members */}
      <div className="grid grid-cols-5 gap-1.5">
        {memberList.map((member) => {
          const selected = value.includes(member.initials);
          return (
            <motion.button
              key={member.initials}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => toggle(member.initials)}
              className={`
                relative flex flex-col items-center gap-1 py-2 px-1 rounded-xl
                transition-all duration-200
                ${selected
                  ? "bg-primary/[0.08] ring-1 ring-primary/30"
                  : "bg-foreground/[0.02] dark:bg-white/[0.03] ring-1 ring-white/10 hover:ring-primary/20"
                }
              `}
            >
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white
                ${member.color}
                ring-2 ring-white/80 dark:ring-black/60
                shadow-[0_2px_8px_rgba(0,0,0,0.12)]
                ${selected ? "shadow-[0_0_12px_rgba(99,102,241,0.3)]" : ""}
              `}>
                {member.initials}
              </div>
              <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                {member.name.split(" ")[0]}
              </span>
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                >
                  <Check className="w-2 h-2" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Mini Sub-task Assignee Picker ──────────────────────
function MiniSubTaskAssignee({
  assigneeId,
  members,
  onChange,
}: {
  assigneeId?: string;
  members: { initials: string; name: string; color: string }[];
  onChange: (initials: string | undefined) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const member = assigneeId ? members.find((m) => m.initials === assigneeId) : null;

  return (
    <div className="relative shrink-0">
      <motion.button
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => { e.stopPropagation(); setPickerOpen((p) => !p); }}
        className={`
          w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold
          transition-all duration-200
          ${member
            ? `${member.color} text-white ring-2 ring-white/60 dark:ring-black/40 shadow-[0_2px_6px_rgba(0,0,0,0.15)]`
            : "ring-1 ring-foreground/10 hover:ring-primary/40 text-muted-foreground/40 hover:text-muted-foreground bg-foreground/[0.03] dark:bg-white/[0.04]"
          }
        `}
        title={member ? member.name : "Assign"}
      >
        {member ? member.initials : <Plus className="w-2.5 h-2.5" />}
      </motion.button>

      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -4 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="
              absolute right-0 bottom-full mb-1 z-30
              flex gap-1 p-1.5 rounded-xl
              bg-white/80 dark:bg-black/80
              backdrop-blur-[48px]
              ring-1 ring-white/20 dark:ring-white/10
              shadow-[0_8px_32px_-6px_rgba(0,0,0,0.15)]
              dark:shadow-[0_8px_32px_-6px_rgba(0,0,0,0.5)]
            "
          >
            {members.map((m) => (
              <motion.button
                key={m.initials}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onChange(m.initials); setPickerOpen(false); }}
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-[7px] font-bold text-white
                  ${m.color}
                  ring-1 ring-white/30
                  ${assigneeId === m.initials ? "ring-2 ring-primary shadow-[0_0_8px_rgba(99,102,241,0.4)]" : ""}
                  transition-all duration-150
                `}
                title={m.name}
              >
                {m.initials}
              </motion.button>
            ))}
            {assigneeId && (
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onChange(undefined); setPickerOpen(false); }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-destructive bg-foreground/[0.04] ring-1 ring-white/10 transition-colors"
                title="Unassign"
              >
                <X className="w-2.5 h-2.5" />
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Memoized Sub-task Row ──────────────────────────────
interface SubTaskRowProps {
  st: SubTask;
  celebrateId: string | null;
  isSolo: boolean;
  memberList: { initials: string; name: string; color: string }[];
  onToggle: (id: string) => void;
  onAssignee: (subTaskId: string, assigneeId: string | undefined) => void;
  onDelete: (id: string) => void;
}

const SubTaskRow = memo(function SubTaskRow({
  st,
  celebrateId,
  isSolo,
  memberList,
  onToggle,
  onAssignee,
  onDelete,
}: SubTaskRowProps) {
  const reduceMotion = useMobileReducedMotion();
  return (
    <motion.div
      layout={!reduceMotion}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: reduceMotion ? 0 : 30 }}
      transition={reduceMotion ? { duration: 0.15 } : undefined}
      className="
        flex items-center gap-3 px-4 py-2.5 rounded-2xl
        bg-foreground/[0.02] dark:bg-white/[0.03]
        ring-1 ring-white/10
        backdrop-blur-xl
      "
    >
      <motion.button
        onClick={() => onToggle(st.id)}
        whileTap={{ scale: 0.8 }}
        className={`
          w-5 h-5 rounded-full flex items-center justify-center shrink-0
          transition-all duration-300
          ${st.done
            ? "bg-primary text-primary-foreground shadow-[0_0_14px_rgba(99,102,241,0.5)]"
            : "ring-1 ring-foreground/10 hover:ring-primary/40"
          }
        `}
      >
        {st.done && <Check className="w-3 h-3" />}
      </motion.button>

      {/* Celebration pop */}
      <AnimatePresence>
        {celebrateId === st.id && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute w-5 h-5 rounded-full bg-primary/30"
          />
        )}
      </AnimatePresence>

      <span
        className={`
          text-xs flex-1 min-w-0
          ${st.done
            ? "line-through text-muted-foreground/50 decoration-primary/40"
            : "text-foreground"
          }
        `}
      >
        {st.label}
      </span>

      {/* Mini Assignee Picker */}
      {!isSolo && (
        <MiniSubTaskAssignee
          assigneeId={st.assigneeId}
          members={memberList}
          onChange={(initials) => onAssignee(st.id, initials)}
        />
      )}

      {/* Delete sub-task */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        onClick={() => onDelete(st.id)}
        className="
          w-5 h-5 rounded-full flex items-center justify-center shrink-0
          text-muted-foreground/40 hover:text-destructive
          transition-colors duration-200
        "
        title="Delete sub-task"
      >
        <Trash2 className="w-3 h-3" />
      </motion.button>
    </motion.div>
  );
});

// ── Date Picker Tile ───────────────────────────────────
function DatePickerTile({ value, onChange, disabled = false }: { value?: Date; onChange: (d: Date | undefined) => void; disabled?: boolean }) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <Popover open={disabled ? false : popoverOpen} onOpenChange={disabled ? undefined : setPopoverOpen}>
      <PopoverTrigger asChild>
        <button disabled={disabled} className={`
          rounded-2xl p-3 flex flex-col items-center gap-1.5 w-full
          bg-foreground/[0.02] dark:bg-white/[0.03]
          backdrop-blur-xl ring-1 ring-white/10
          shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]
          dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]
          ${disabled ? "cursor-default opacity-70" : "hover:ring-primary/20 cursor-pointer"}
          transition-all duration-200
        `}>
          <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Due Date</span>
          <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
            {value ? format(value, "MMM d") : "Not set"}
            <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-2xl bg-white dark:bg-neutral-900 backdrop-blur-[48px] ring-1 ring-white/20 dark:ring-white/10 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.15)] z-[60]"
        align="center"
        sideOffset={8}
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => { onChange(d); setPopoverOpen(false); }}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

// ── Drawer ─────────────────────────────────────────────
export default function TaskDrawer({
  task,
  open,
  onClose,
  onUpdateTask,
  onToggleDone,
  isSolo = false,
  projectMembers = [],
  projectId,
  readOnly = false,
  availableTags,
}: TaskDrawerProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // Tags use local state for optimistic UI — no flicker on toggle.
  // Synced from the task prop via useEffect below.
  const [localTags, setLocalTags] = useState<Tag[]>(task?.tags ?? []);

  // Custom tag creation state
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagColor, setNewTagColor] = useState<string>("indigo");

  // Merge project-level tags + task's existing custom tags into a
  // single selectable tag list, without needing any hardcoded fallback.
  const tagList = useMemo(() => {
    const base: TagOption[] = availableTags && availableTags.length > 0 ? availableTags : [];
    const baseLabels = new Set(base.map((t) => t.label.toLowerCase()));
    const customTags: TagOption[] = localTags
      .filter((t) => !baseLabels.has(t.label.toLowerCase()))
      .map((t) => ({ label: t.label, color: t.color || "indigo" }));
    return [...base, ...customTags];
  }, [availableTags, localTags]);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTask, setNewSubTask] = useState("");
  const [celebrateId, setCelebrateId] = useState<string | null>(null);
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const { openTimer } = useFocusTimer();

  // Resolve member list for sub-task assignee picker
  const memberList = projectMembers.length > 0
    ? projectMembers.map(m => ({ initials: m.initials, name: m.name, color: m.color }))
    : TEAM_MEMBERS;

  // Sync ALL local state when the task object changes (not just on id switch).
  // This fixes the tag desync bug: when tags are toggled via context menu or
  // board card while the drawer is open, the drawer now re-syncs immediately.
  // We use a serialised key so React detects changes to tags, assignees, subtasks, etc.
  const taskSyncKey = task
    ? `${task.id}|${task.title}|${task.description}|${JSON.stringify(task.tags)}|${JSON.stringify(task.assignees)}|${task.priority}|${task.dueDate?.toISOString?.() ?? task.dueDate ?? ""}|${task.done}|${JSON.stringify(task.subtasks)}`
    : "";

  // Sync all local state whenever the task prop changes.
  // We depend on [task] (object reference) rather than [taskSyncKey] (serialised
  // string) so that any async prop update — including tag changes delivered via
  // liveDrawerTask from the live board — is always picked up. liveDrawerTask
  // creates a fresh object reference every time columns update, so this fires
  // correctly even when the serialised key would appear identical.
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setLocalTags(task.tags ?? []);
      setAssignees(task.assignees || []);
      setPriority(task.priority || "medium");
      setDueDate(task.dueDate);
      // Use real subtasks from backend (attached to the task by mapTaskColumns)
      setSubTasks(task.subtasks ?? []);
    }
  }, [task]);

  // Fetch real audit logs from backend when drawer opens
  useEffect(() => {
    if (!open || !projectId) {
      setActivityEntries([]);
      return;
    }
    let cancelled = false;
    ProjectService.fetchActivity(projectId, 1, 10)
      .then(({ logs }) => {
        if (cancelled) return;
        setActivityEntries(
          logs.map((l: ActivityLogEntry) => ({
            id: l.id,
            text: l.action,
            time: formatRelativeTime(l.timestamp),
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setActivityEntries([]);
      });
    return () => { cancelled = true; };
  }, [open, projectId]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const completedCount = subTasks.filter((s) => s.done).length;
  const progress = subTasks.length > 0 ? (completedCount / subTasks.length) * 100 : 0;

  // ── Subtask persistence ─────────────────────────────────
  // Maps frontend SubTask[] (label/assigneeId) → backend schema
  // (title/assignee) and PATCHes the parent task.
  const subTasksRef = useRef(subTasks);
  subTasksRef.current = subTasks;

  const persistSubTasks = useCallback(
    (next: SubTask[]) => {
      if (!task || !projectId) return;
      const payload = next.map((s, i) => ({
        id: s.id,
        title: s.label,
        done: s.done,
        assignee: s.assigneeId,
        sortOrder: i,
      }));
      ProjectService.patchTask(projectId, task.id, { subtasks: payload }).catch(() => {
        toast.error("Failed to save subtasks.");
      });
    },
    [task, projectId],
  );

  const toggleSubTask = useCallback((id: string) => {
    setSubTasks((prev) => {
      const next = prev.map((s) => {
        if (s.id === id) {
          if (!s.done) {
            setCelebrateId(id);
            setTimeout(() => setCelebrateId(null), 600);
            const userName = user?.fullName || "You";
            NotificationService.subtaskCompleted(s.label, userName);
          }
          return { ...s, done: !s.done };
        }
        return s;
      });
      persistSubTasks(next);
      return next;
    });
  }, [user?.fullName, persistSubTasks]);

  const updateSubTaskAssignee = useCallback((subTaskId: string, assigneeId: string | undefined) => {
    setSubTasks((prev) => {
      const next = prev.map((s) => {
        if (s.id !== subTaskId) return s;
        const newAssigneeId = s.assigneeId === assigneeId ? undefined : assigneeId;
        if (newAssigneeId) {
          const member = memberList.find((m) => m.initials === newAssigneeId);
          NotificationService.taskAssigned(s.label, member?.name || newAssigneeId);
        }
        return { ...s, assigneeId: newAssigneeId };
      });
      persistSubTasks(next);
      return next;
    });
  }, [memberList, persistSubTasks]);

  const addSubTask = useCallback(() => {
    const safeLabel = sanitizeInput(newSubTask);
    if (safeLabel) {
      setSubTasks((prev) => {
        const next = [
          ...prev,
          { id: `st-${crypto.randomUUID().slice(0, 8)}`, label: safeLabel, done: false },
        ];
        persistSubTasks(next);
        return next;
      });
      setNewSubTask("");
    }
  }, [newSubTask, persistSubTasks]);

  const deleteSubTask = useCallback((id: string) => {
    setSubTasks((prev) => {
      const next = prev.filter((s) => s.id !== id);
      persistSubTasks(next);
      return next;
    });
  }, [persistSubTasks]);

  const handleTitleBlur = useCallback(() => {
    if (!task) return;
    const safe = title.trim();
    if (!safe) { setTitle(task.title); return; } // revert empty
    if (safe !== task.title) onUpdateTask(task.id, { title: safe });
  }, [task, title, onUpdateTask]);

  const handleDescriptionBlur = useCallback(() => {
    if (task && description !== task.description) {
      onUpdateTask(task.id, { description });
    }
  }, [task, description, onUpdateTask]);

  const handleAssigneesChange = useCallback((v: string[]) => {
    // Detect newly added assignees
    const added = v.filter((a) => !assignees.includes(a));
    for (const initials of added) {
      const member = memberList.find((m) => m.initials === initials);
      if (task) NotificationService.taskAssigned(task.title, member?.name || initials);
    }
    setAssignees(v);
    if (task) onUpdateTask(task.id, { assignees: v });
  }, [task, onUpdateTask, assignees, memberList]);

  const handlePriorityChange = useCallback((v: Priority) => {
    setPriority(v);
    if (task) onUpdateTask(task.id, { priority: v });
  }, [task, onUpdateTask]);

  const handleDueDateChange = useCallback((d: Date | undefined) => {
    setDueDate(d);
    if (task) onUpdateTask(task.id, { dueDate: d });
  }, [task, onUpdateTask]);

  const handleTagToggle = useCallback((tag: Tag) => {
    if (!task) return;
    const has = localTags.some((t) => t.label === tag.label);
    const next = has ? localTags.filter((t) => t.label !== tag.label) : [...localTags, tag];
    // Optimistic local update (no flicker), then persist to global state
    setLocalTags(next);
    onUpdateTask(task.id, { tags: next });
  }, [task, localTags, onUpdateTask]);

  /** Add a custom tag typed by the user */
  const handleAddCustomTag = useCallback(() => {
    if (!task || !newTagLabel.trim()) return;
    const label = newTagLabel.trim();
    // Prevent duplicates (case-insensitive)
    if (localTags.some((t) => t.label.toLowerCase() === label.toLowerCase())) {
      setNewTagLabel("");
      return;
    }
    const customTag: Tag = { label, color: newTagColor };
    const next = [...localTags, customTag];
    setLocalTags(next);
    onUpdateTask(task.id, { tags: next });
    setNewTagLabel("");
  }, [task, localTags, newTagLabel, newTagColor, onUpdateTask]);

  const reduceMotion = useMobileReducedMotion();

  return (
    <AnimatePresence>
      {open && task && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { x: "100%" }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: "100%" }}
            transition={reduceMotion ? { duration: 0.15 } : { type: "spring", damping: 25, stiffness: 300 }}
            className="
              fixed right-0 top-0 bottom-0 z-50
              w-full md:max-w-[480px]
              bg-white/95 dark:bg-slate-950/95
              md:bg-white/60 md:dark:bg-black/60
              backdrop-blur-[64px]
              shadow-sm border-l border-border/50
              md:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.15),inset_-1px_-1px_2px_rgba(0,0,0,0.05),-20px_0_60px_rgba(0,0,0,0.1)]
              md:dark:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.06),inset_-1px_-1px_2px_rgba(0,0,0,0.2),-20px_0_60px_rgba(0,0,0,0.4)]
              md:border-l-0
              flex flex-col overflow-hidden
            "
          >
            {/* Progress bar at top */}
            <div className="h-1 w-full bg-foreground/[0.04] dark:bg-white/[0.06]">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 shadow-neon"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 30 }}
              />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <input
                    value={title}
                    onChange={(e) => !readOnly && setTitle(e.target.value)}
                    onBlur={readOnly ? undefined : handleTitleBlur}
                    onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                    readOnly={readOnly}
                    className={`
                      stealth-blur
                      w-full text-2xl font-black tracking-tighter text-foreground
                      bg-transparent outline-none border-none
                      rounded-xl px-2 py-1 -mx-2
                      ${readOnly ? "cursor-default" : "focus:bg-foreground/[0.03] dark:focus:bg-white/[0.05] focus:ring-1 focus:ring-primary/20"}
                      transition-all duration-200
                      placeholder:text-muted-foreground/40
                    `}
                    placeholder="Task title..."
                  />
                  <p className="text-[10px] text-muted-foreground/50 font-mono mt-1 px-2">
                    {completedCount}/{subTasks.length} sub-tasks complete
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  aria-label="Close task drawer"
                  className="
                    w-8 h-8 rounded-full flex items-center justify-center
                    bg-foreground/[0.04] dark:bg-white/[0.06]
                    hover:bg-foreground/[0.08] dark:hover:bg-white/[0.1]
                    text-muted-foreground
                    transition-colors duration-200
                  "
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Description */}
              <section>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">
                  Description
                </h3>
                <textarea
                  value={description}
                  onChange={(e) => !readOnly && setDescription(e.target.value)}
                  onBlur={readOnly ? undefined : handleDescriptionBlur}
                  rows={3}
                  readOnly={readOnly}
                  placeholder={readOnly ? "No description" : "Add a description... (supports **bold**, *italic*, `code`)"}
                  className={`
                    stealth-blur
                    w-full text-sm text-foreground leading-relaxed
                    bg-foreground/[0.02] dark:bg-white/[0.03]
                    backdrop-blur-xl rounded-2xl p-4
                    ring-1 ring-white/10
                    outline-none resize-none
                    ${readOnly ? "cursor-default" : "focus:ring-primary/20"}
                    placeholder:text-muted-foreground/40
                    transition-all duration-200
                    font-mono text-xs
                  `}
                />
              </section>

              {/* Priority selector — hidden in readOnly mode */}
              {!readOnly && (
                <section>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                    Priority
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {PRIORITIES.map((p) => (
                      <motion.button
                        key={p.value}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handlePriorityChange(p.value)}
                        className={`
                        py-2 px-2 rounded-xl text-[10px] font-semibold
                        backdrop-blur-xl ring-1 transition-all duration-300
                        ${priority === p.value
                            ? PRIORITY_ACTIVE[p.value]
                            : "ring-white/10 text-muted-foreground bg-foreground/[0.02] dark:bg-white/[0.03] " + p.accent
                          }
                      `}
                      >
                        {p.label}
                      </motion.button>
                    ))}
                  </div>
                </section>
              )}

              {/* Priority badge — shown in readOnly mode */}
              {readOnly && (
                <section>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                    Priority
                  </h3>
                  <span className={`inline-block px-3 py-1.5 rounded-xl text-[10px] font-semibold ring-1 ${PRIORITY_ACTIVE[priority]}`}>
                    {PRIORITIES.find((p) => p.value === priority)?.label ?? priority}
                  </span>
                </section>
              )}

              {/* Tags — interactive in edit mode, display-only in readOnly */}
              {!readOnly ? (
                <section>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tagList.map((tag) => {
                      const active = localTags.some((t) => t.label === tag.label);
                      const palette: Record<string, string> = {
                        indigo: active ? "bg-indigo-500/20 ring-indigo-400/60 text-indigo-600 dark:text-indigo-300" : "ring-white/10 text-muted-foreground hover:ring-indigo-400/30",
                        emerald: active ? "bg-emerald-500/20 ring-emerald-400/60 text-emerald-600 dark:text-emerald-300" : "ring-white/10 text-muted-foreground hover:ring-emerald-400/30",
                        sky: active ? "bg-sky-500/20 ring-sky-400/60 text-sky-600 dark:text-sky-300" : "ring-white/10 text-muted-foreground hover:ring-sky-400/30",
                        amber: active ? "bg-amber-500/20 ring-amber-400/60 text-amber-600 dark:text-amber-300" : "ring-white/10 text-muted-foreground hover:ring-amber-400/30",
                        rose: active ? "bg-rose-500/20 ring-rose-400/60 text-rose-600 dark:text-rose-300" : "ring-white/10 text-muted-foreground hover:ring-rose-400/30",
                      };
                      return (
                        <motion.button
                          key={tag.label}
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => handleTagToggle(tag)}
                          className={`
                          px-3 py-1.5 rounded-full text-[10px] font-semibold
                          ring-1 backdrop-blur-xl transition-all duration-200
                          ${palette[tag.color] || palette.indigo}
                          ${active ? "shadow-[0_0_10px_rgba(99,102,241,0.15)]" : "bg-foreground/[0.02] dark:bg-white/[0.03]"}
                        `}
                        >
                          {tag.label}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* ── Custom tag input ── */}
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="text"
                      value={newTagLabel}
                      onChange={(e) => setNewTagLabel(sanitizeInput(e.target.value).slice(0, 24))}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCustomTag(); } }}
                      placeholder="New tag…"
                      className="flex-1 h-8 rounded-xl px-3 text-[11px] font-medium bg-foreground/[0.03] dark:bg-white/[0.04] ring-1 ring-white/10 placeholder:text-muted-foreground/50 text-foreground outline-none focus:ring-primary/40 transition-all"
                    />
                    {/* Color selector */}
                    <div className="flex gap-1">
                      {(["indigo", "emerald", "sky", "amber", "rose"] as const).map((c) => {
                        const dotColor: Record<string, string> = {
                          indigo: "bg-indigo-500",
                          emerald: "bg-emerald-500",
                          sky: "bg-sky-500",
                          amber: "bg-amber-500",
                          rose: "bg-rose-500",
                        };
                        return (
                          <button
                            key={c}
                            onClick={() => setNewTagColor(c)}
                            className={`w-5 h-5 rounded-full ${dotColor[c]} transition-all ${newTagColor === c ? "ring-2 ring-offset-1 ring-offset-background ring-white/60 scale-110" : "opacity-50 hover:opacity-80"}`}
                            aria-label={`Color ${c}`}
                          />
                        );
                      })}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleAddCustomTag}
                      disabled={!newTagLabel.trim()}
                      className="h-8 w-8 rounded-xl flex items-center justify-center bg-primary/10 text-primary ring-1 ring-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </section>
              ) : localTags.length > 0 && (
                <section>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {localTags.map((tag) => {
                      const palette: Record<string, string> = {
                        indigo: "bg-indigo-500/20 ring-indigo-400/60 text-indigo-600 dark:text-indigo-300",
                        emerald: "bg-emerald-500/20 ring-emerald-400/60 text-emerald-600 dark:text-emerald-300",
                        sky: "bg-sky-500/20 ring-sky-400/60 text-sky-600 dark:text-sky-300",
                        amber: "bg-amber-500/20 ring-amber-400/60 text-amber-600 dark:text-amber-300",
                        rose: "bg-rose-500/20 ring-rose-400/60 text-rose-600 dark:text-rose-300",
                      };
                      return (
                        <span
                          key={tag.label}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-semibold ring-1 backdrop-blur-xl ${palette[tag.color] || palette.indigo} shadow-[0_0_10px_rgba(99,102,241,0.15)]`}
                        >
                          {tag.label}
                        </span>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Assignees — hidden for solo projects AND in readOnly mode */}
              {!isSolo && !readOnly && (
                <section>
                  <MultiAssigneePicker
                    value={assignees}
                    onChange={handleAssigneesChange}
                    members={projectMembers.length > 0 ? projectMembers.map(m => ({ initials: m.initials, name: m.name, color: m.color })) : undefined}
                  />
                </section>
              )}

              {/* Metadata bento grid */}
              <section>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                  Details
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <DatePickerTile value={dueDate} onChange={handleDueDateChange} disabled={readOnly} />
                  <div className="
                    rounded-2xl p-3 flex flex-col items-center gap-1.5
                    bg-foreground/[0.02] dark:bg-white/[0.03]
                    backdrop-blur-xl ring-1 ring-white/10
                    shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]
                    dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]
                  ">
                    <Flag className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Status</span>
                    <span className="text-[11px] font-semibold text-foreground">
                      {task.done ? "Done" : "Active"}
                    </span>
                  </div>
                </div>
              </section>

              {/* Sub-tasks */}
              <section>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                  Sub-tasks
                </h3>
                <div className="space-y-2">
                  {subTasks.length === 0 && (
                    <p className="text-[10px] text-muted-foreground/40 text-center py-3">
                      {readOnly ? "No sub-tasks." : "No sub-tasks yet. Add one below."}
                    </p>
                  )}
                  <AnimatePresence>
                    {subTasks.map((st) => (
                      <SubTaskRow
                        key={st.id}
                        st={st}
                        celebrateId={celebrateId}
                        isSolo={isSolo || readOnly}
                        memberList={memberList}
                        onToggle={readOnly ? () => { } : toggleSubTask}
                        onAssignee={readOnly ? () => { } : updateSubTaskAssignee}
                        onDelete={readOnly ? () => { } : deleteSubTask}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Add sub-task — hidden in readOnly mode */}
                  {!readOnly && (
                    <div className="flex gap-2">
                      <input
                        value={newSubTask}
                        onChange={(e) => setNewSubTask(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addSubTask(); }}
                        placeholder="Add sub-task..."
                        className="
                        flex-1 px-4 py-2 rounded-2xl text-xs
                        bg-foreground/[0.02] dark:bg-white/[0.03]
                        ring-1 ring-white/10 backdrop-blur-xl
                        text-foreground placeholder:text-muted-foreground/40
                        outline-none focus:ring-primary/20
                        transition-all duration-200
                      "
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={addSubTask}
                        className="
                        w-8 h-8 rounded-full flex items-center justify-center
                        bg-primary/10 text-primary
                        hover:bg-primary/20
                        transition-colors duration-200
                      "
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  )}
                </div>
              </section>

              {/* Activity Log */}
              <section>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" />
                  Activity
                </h3>
                <div className="relative pl-5">
                  {/* Vertical line */}
                  <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />

                  <div className="space-y-4">
                    {activityEntries.length === 0 && (
                      <p className="text-[10px] text-muted-foreground/40 text-center py-3">No activity recorded yet.</p>
                    )}
                    {activityEntries.map((entry, idx) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="relative flex items-start gap-3"
                      >
                        {/* Glowing dot */}
                        <div
                          className="
                            absolute -left-5 top-1 w-[9px] h-[9px] rounded-full
                            bg-primary/60 ring-2 ring-background
                            shadow-[0_0_8px_rgba(99,102,241,0.5)]
                          "
                        />
                        <div>
                          <p className="text-xs text-foreground">{entry.text}</p>
                          <p className="text-[9px] text-muted-foreground/50 font-mono">{entry.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            {/* Read-only notice for editor role */}
            {readOnly && (
              <div className="px-6 py-2 border-t border-white/[0.06] bg-amber-500/[0.04]">
                <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 text-center">
                  Editor — You can only change the task status
                </p>
              </div>
            )}

            {/* Footer action */}
            <div className="px-6 py-4 border-t border-white/[0.06] flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { onToggleDone(task.id); onClose(); }}
                className={`
                  flex-1 py-3 rounded-2xl text-sm font-semibold
                  transition-all duration-300
                  ${task.done
                    ? "bg-foreground/[0.05] text-muted-foreground hover:bg-foreground/[0.08]"
                    : "btn-silk"
                  }
                `}
              >
                {task.done ? "Mark as Incomplete" : "Mark as Complete"}
              </motion.button>
              {!task.done && (
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => openTimer(task.title)}
                  className="
                    w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0
                    bg-foreground/[0.04] dark:bg-white/[0.04]
                    ring-1 ring-white/10
                    text-primary hover:text-primary/80
                    hover:bg-primary/[0.06]
                    transition-all duration-200
                  "
                  title="Start Focus Timer"
                >
                  <Timer className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </motion.div>
        </>
      )
      }
    </AnimatePresence >
  );
}
