import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Kanban,
    FileText,
    Plus,
    Trash2,
    GripVertical,
    CircleDot,
    Loader2,
    CheckCircle2,
    Bold,
    Italic,
    Code,
    List,
    Heading2,
    Quote,
    ChevronRight,
    X,
    Tag,
    PanelLeftClose,
    PanelLeftOpen,
    Inbox,
} from "lucide-react";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
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
import type { Project } from "../types";

// ═══════════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════════
type KanbanStatus = "todo" | "in-progress" | "done";
type SimpleTab = "board" | "notes";

interface KanbanTask {
    id: string;
    title: string;
    description: string;
    status: KanbanStatus;
    priority: "low" | "medium" | "high";
    tags: string[];
    assignees: string[];
    createdAt: number;
}

interface NoteBlock {
    id: string;
    type: "text" | "heading" | "code" | "quote" | "list";
    content: string;
    language?: string;
}

interface NoteDoc {
    id: string;
    title: string;
    blocks: NoteBlock[];
    updatedAt: number;
}

// ═══════════════════════════════════════════════════════
//  Storage helpers (project-scoped)
// ═══════════════════════════════════════════════════════
function loadTasks(projectId: string): KanbanTask[] {
    try {
        const raw = localStorage.getItem(`stride-simple-board-${projectId}`);
        if (!raw) return [];
        const tasks: KanbanTask[] = JSON.parse(raw);
        return tasks.map(t => ({ ...t, tags: t.tags ?? [], assignees: t.assignees ?? [] }));
    } catch {
        return [];
    }
}
function saveTasks(projectId: string, tasks: KanbanTask[]) {
    localStorage.setItem(`stride-simple-board-${projectId}`, JSON.stringify(tasks));
}

function loadNotes(projectId: string): NoteDoc[] {
    try {
        const raw = localStorage.getItem(`stride-simple-notes-${projectId}`);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}
function saveNotes(projectId: string, notes: NoteDoc[]) {
    localStorage.setItem(`stride-simple-notes-${projectId}`, JSON.stringify(notes));
}

function newBlock(type: NoteBlock["type"] = "text"): NoteBlock {
    return {
        id: crypto.randomUUID(),
        type,
        content: "",
        language: type === "code" ? "python" : undefined,
    };
}
function newDoc(): NoteDoc {
    return {
        id: crypto.randomUUID(),
        title: "Untitled",
        blocks: [newBlock()],
        updatedAt: Date.now(),
    };
}

// ═══════════════════════════════════════════════════════
//  Kanban Column Config
// ═══════════════════════════════════════════════════════
interface ColumnDef {
    key: KanbanStatus;
    label: string;
    icon: React.ElementType;
    gradient: string;
    dot: string;
}

const COLUMNS: ColumnDef[] = [
    { key: "todo", label: "To Do", icon: CircleDot, gradient: "from-blue-500/20 to-blue-400/5", dot: "bg-blue-500" },
    { key: "in-progress", label: "In Progress", icon: Loader2, gradient: "from-amber-500/20 to-amber-400/5", dot: "bg-amber-500" },
    { key: "done", label: "Done", icon: CheckCircle2, gradient: "from-emerald-500/20 to-emerald-400/5", dot: "bg-emerald-500" },
];

const PRIORITIES: { key: KanbanTask["priority"]; label: string; color: string }[] = [
    { key: "low", label: "Low", color: "bg-slate-400" },
    { key: "medium", label: "Med", color: "bg-amber-500" },
    { key: "high", label: "High", color: "bg-rose-500" },
];

const TAG_COLORS = [
    "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    "bg-purple-500/15 text-purple-700 dark:text-purple-300",
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
];
function tagColor(tag: string) {
    let h = 0;
    for (let i = 0; i < tag.length; i++) h = ((h << 5) - h + tag.charCodeAt(i)) | 0;
    return TAG_COLORS[Math.abs(h) % TAG_COLORS.length];
}

// ═══════════════════════════════════════════════════════
//  Sortable Task Card
// ═══════════════════════════════════════════════════════
function SortableTaskCard({
    task,
    onDelete,
    onUpdate,
}: {
    task: KanbanTask;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: Partial<KanbanTask>) => void;
}) {
    const [addingTag, setAddingTag] = useState(false);
    const [addingAssignee, setAddingAssignee] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const [assigneeInput, setAssigneeInput] = useState("");
    const tagRef = useRef<HTMLInputElement>(null);
    const assigneeRef = useRef<HTMLInputElement>(null);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { type: "task", task },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const prio = PRIORITIES.find((p) => p.key === task.priority);

    useEffect(() => { if (addingTag && tagRef.current) tagRef.current.focus(); }, [addingTag]);
    useEffect(() => { if (addingAssignee && assigneeRef.current) assigneeRef.current.focus(); }, [addingAssignee]);

    const commitTag = () => {
        const val = tagInput.trim();
        if (val && !task.tags.includes(val)) onUpdate(task.id, { tags: [...task.tags, val] });
        setTagInput(""); setAddingTag(false);
    };
    const removeTag = (tag: string) => onUpdate(task.id, { tags: task.tags.filter(t => t !== tag) });

    const commitAssignee = () => {
        const val = assigneeInput.trim();
        if (val && !task.assignees.includes(val)) onUpdate(task.id, { assignees: [...task.assignees, val] });
        setAssigneeInput(""); setAddingAssignee(false);
    };
    const removeAssignee = (name: string) => onUpdate(task.id, { assignees: task.assignees.filter(a => a !== name) });

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="
        group relative rounded-xl p-3 select-none
        bg-white/60 dark:bg-white/[0.04]
        backdrop-blur-[40px] border-[0.5px] border-black/5 dark:border-white/10
        shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)]
        dark:shadow-[0_2px_12px_-3px_rgba(0,0,0,0.25)]
        transition-shadow duration-200
      "
        >
            {/* Drag handle */}
            <button
                {...attributes}
                {...listeners}
                className="absolute top-2.5 right-2.5 w-5 h-5 rounded flex items-center justify-center
          text-muted-foreground/20 group-hover:text-muted-foreground/50
          hover:bg-foreground/[0.04] cursor-grab active:cursor-grabbing transition-colors"
            >
                <GripVertical className="w-3 h-3" />
            </button>

            <h4 className="text-xs font-bold tracking-tight text-foreground mb-1 pr-6 stealth-blur">
                {task.title}
            </h4>
            {task.description && (
                <p className="text-[10px] text-muted-foreground/60 line-clamp-2 leading-relaxed mb-1.5 stealth-blur">
                    {task.description}
                </p>
            )}

            {/* Tags */}
            {(task.tags.length > 0 || addingTag) && (
                <div className="flex flex-wrap items-center gap-1 mb-1.5">
                    {task.tags.map((tag) => (
                        <span key={tag} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${tagColor(tag)}`}>
                            <Tag className="w-2 h-2 opacity-60" />
                            {tag}
                            <button onClick={() => removeTag(tag)} className="ml-0.5 opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity">
                                <X className="w-2 h-2" />
                            </button>
                        </span>
                    ))}
                    {addingTag && (
                        <input
                            ref={tagRef}
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") commitTag(); if (e.key === "Escape") { setAddingTag(false); setTagInput(""); } }}
                            onBlur={commitTag}
                            placeholder="tag\u2026"
                            className="w-14 h-4 bg-transparent outline-none text-[9px] text-foreground placeholder:text-muted-foreground/30"
                        />
                    )}
                </div>
            )}

            {/* Assignees \u2014 full name text badges, NO avatars */}
            {(task.assignees.length > 0 || addingAssignee) && (
                <div className="flex flex-wrap items-center gap-1 mb-1.5">
                    {task.assignees.map((name) => (
                        <span key={name} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-primary/10 text-primary dark:text-primary/80">
                            👤 {name}
                            <button onClick={() => removeAssignee(name)} className="opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity">
                                <X className="w-2 h-2" />
                            </button>
                        </span>
                    ))}
                    {addingAssignee && (
                        <input
                            ref={assigneeRef}
                            value={assigneeInput}
                            onChange={(e) => setAssigneeInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") commitAssignee(); if (e.key === "Escape") { setAddingAssignee(false); setAssigneeInput(""); } }}
                            onBlur={commitAssignee}
                            placeholder="Name\u2026"
                            className="w-16 h-4 bg-transparent outline-none text-[9px] text-foreground placeholder:text-muted-foreground/30"
                        />
                    )}
                </div>
            )}

            {/* Bottom row: priority + actions */}
            <div className="flex items-center gap-1.5">
                {prio && (
                    <span className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground/60">
                        <span className={`w-1.5 h-1.5 rounded-full ${prio.color}`} />
                        {prio.label}
                    </span>
                )}
                <div className="flex items-center gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setAddingTag(true)} title="Add tag"
                        className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/30 hover:text-foreground/60 hover:bg-foreground/[0.04] transition-colors">
                        <Tag className="w-2.5 h-2.5" />
                    </button>
                    <button onClick={() => setAddingAssignee(true)} title="Assign"
                        className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/30 hover:text-foreground/60 hover:bg-foreground/[0.04] transition-colors">
                        <Plus className="w-2.5 h-2.5" />
                    </button>
                    <button onClick={() => onDelete(task.id)}
                        className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/30 hover:text-red-500 transition-colors">
                        <Trash2 className="w-2.5 h-2.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Drag overlay card (ghost while dragging) ───────────
function TaskOverlay({ task }: { task: KanbanTask }) {
    const prio = PRIORITIES.find((p) => p.key === task.priority);
    return (
        <div
            className="
        rounded-xl p-3 w-64
        bg-white/90 dark:bg-slate-800/90
        backdrop-blur-xl border border-primary/20
        shadow-[0_12px_40px_-6px_rgba(99,102,241,0.25)]
        rotate-2
      "
        >
            <h4 className="text-xs font-bold tracking-tight text-foreground mb-1">{task.title}</h4>
            {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                    {task.tags.map((tag) => (
                        <span key={tag} className={`px-1.5 py-0.5 rounded-md text-[8px] font-semibold ${tagColor(tag)}`}>{tag}</span>
                    ))}
                </div>
            )}
            {task.assignees.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                    {task.assignees.map((name) => (
                        <span key={name} className="px-1.5 py-0.5 rounded-md text-[8px] font-semibold bg-primary/10 text-primary">👤 {name}</span>
                    ))}
                </div>
            )}
            {prio && (
                <span className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground/60">
                    <span className={`w-1.5 h-1.5 rounded-full ${prio.color}`} />
                    {prio.label}
                </span>
            )}
        </div>
    );
}

// ── Droppable column wrapper ───────────────────────────
function DroppableColumn({
    id,
    children,
}: {
    id: string;
    children: React.ReactNode;
}) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={`
        flex flex-col gap-2 min-h-[120px] rounded-xl p-1 transition-colors duration-200
        ${isOver ? "bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20" : ""}
      `}
        >
            {children}
        </div>
    );
}

// ═══════════════════════════════════════════════════════
//  Kanban Board Tab
// ═══════════════════════════════════════════════════════
function ProjectBoard({ projectId }: { projectId: string }) {
    const [tasks, setTasks] = useState<KanbanTask[]>(() => loadTasks(projectId));
    const [newTitle, setNewTitle] = useState("");
    const [addingTo, setAddingTo] = useState<KanbanStatus | null>(null);
    const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset when project changes
    useEffect(() => {
        setTasks(loadTasks(projectId));
    }, [projectId]);

    // Persist
    useEffect(() => {
        saveTasks(projectId, tasks);
    }, [projectId, tasks]);

    // Group tasks by status
    const grouped = useMemo(() => {
        const map: Record<KanbanStatus, KanbanTask[]> = { todo: [], "in-progress": [], done: [] };
        for (const t of tasks) (map[t.status] ??= []).push(t);
        return map;
    }, [tasks]);

    // Add task
    const addTask = (status: KanbanStatus) => {
        const title = newTitle.trim();
        if (!title) return;
        setTasks((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                title,
                description: "",
                status,
                priority: "medium",
                tags: [],
                assignees: [],
                createdAt: Date.now(),
            },
        ]);
        setNewTitle("");
        setAddingTo(null);
    };

    const deleteTask = useCallback((id: string) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const updateTask = useCallback((id: string, updates: Partial<KanbanTask>) => {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    }, []);

    // DnD
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const handleDragStart = (e: DragStartEvent) => {
        const task = tasks.find((t) => t.id === e.active.id);
        if (task) setActiveTask(task);
    };

    const handleDragOver = (e: DragOverEvent) => {
        const { active, over } = e;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Determine target column
        let targetStatus: KanbanStatus | null = null;

        // Dropped over a column directly
        if (["todo", "in-progress", "done"].includes(overId)) {
            targetStatus = overId as KanbanStatus;
        } else {
            // Dropped over another task — get that task's column
            const overTask = tasks.find((t) => t.id === overId);
            if (overTask) targetStatus = overTask.status;
        }

        if (!targetStatus) return;

        const activeTask = tasks.find((t) => t.id === activeId);
        if (!activeTask || activeTask.status === targetStatus) return;

        setTasks((prev) =>
            prev.map((t) => (t.id === activeId ? { ...t, status: targetStatus! } : t))
        );
    };

    const handleDragEnd = (e: DragEndEvent) => {
        setActiveTask(null);

        const { active, over } = e;
        if (!over || active.id === over.id) return;

        // Reorder within same column
        const activeTask = tasks.find((t) => t.id === active.id);
        const overTask = tasks.find((t) => t.id === over.id);

        if (activeTask && overTask && activeTask.status === overTask.status) {
            const colTasks = tasks.filter((t) => t.status === activeTask.status);
            const oldIdx = colTasks.findIndex((t) => t.id === active.id);
            const newIdx = colTasks.findIndex((t) => t.id === over.id);
            const reordered = arrayMove(colTasks, oldIdx, newIdx);

            setTasks((prev) => {
                const other = prev.filter((t) => t.status !== activeTask.status);
                return [...other, ...reordered];
            });
        }
    };

    // Focus input when opening add form
    useEffect(() => {
        if (addingTo && inputRef.current) inputRef.current.focus();
    }, [addingTo]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="overflow-x-auto -mx-2 px-2 pb-2 md:overflow-x-visible md:mx-0 md:px-0 md:pb-0">
                <div className="grid grid-cols-[repeat(3,minmax(240px,1fr))] md:grid-cols-3 min-w-[720px] md:min-w-0 gap-4">
                    {COLUMNS.map((col) => {
                        const items = grouped[col.key] ?? [];
                        const ColIcon = col.icon;
                        return (
                            <div key={col.key} className="flex flex-col gap-2.5">
                                {/* Column header */}
                                <div
                                    className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-2xl
                  bg-gradient-to-b ${col.gradient}
                  backdrop-blur-xl border-[0.5px] border-black/5 dark:border-white/10
                `}
                                >
                                    <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                                    <ColIcon className="w-3.5 h-3.5 text-foreground/70" />
                                    <span className="text-xs font-bold tracking-tight text-foreground">{col.label}</span>
                                    <span className="ml-auto text-[10px] font-mono font-semibold text-muted-foreground/60 tabular-nums">
                                        {items.length}
                                    </span>
                                </div>

                                {/* Droppable area */}
                                <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                                    <DroppableColumn id={col.key}>
                                        {items.length === 0 && !addingTo && (
                                            <div className="flex items-center justify-center h-20 rounded-xl border border-dashed border-foreground/[0.06] dark:border-white/[0.06]">
                                                <span className="text-[10px] text-muted-foreground/30">No tasks</span>
                                            </div>
                                        )}
                                        {items.map((task) => (
                                            <SortableTaskCard key={task.id} task={task} onDelete={deleteTask} onUpdate={updateTask} />
                                        ))}
                                    </DroppableColumn>
                                </SortableContext>

                                {/* Add task form */}
                                {addingTo === col.key ? (
                                    <div className="flex gap-1.5">
                                        <input
                                            ref={inputRef}
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") addTask(col.key);
                                                if (e.key === "Escape") { setAddingTo(null); setNewTitle(""); }
                                            }}
                                            placeholder="Task title…"
                                            className="flex-1 h-8 rounded-lg glass px-3 text-[11px] text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                                        />
                                        <button
                                            onClick={() => addTask(col.key)}
                                            className="h-8 px-3 rounded-lg bg-primary/15 text-primary text-[11px] font-semibold hover:bg-primary/25 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => { setAddingTo(col.key); setNewTitle(""); }}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                    text-[10px] font-medium text-muted-foreground/40
                    hover:text-muted-foreground/70 hover:bg-foreground/[0.02]
                    transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add task
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

            </div>

            <DragOverlay>
                {activeTask && <TaskOverlay task={activeTask} />}
            </DragOverlay>
        </DndContext>
    );
}

// ═══════════════════════════════════════════════════════
//  Notes Tab (project-scoped)
// ═══════════════════════════════════════════════════════
const BLOCK_TYPES: { type: NoteBlock["type"]; icon: React.ElementType; label: string }[] = [
    { type: "text", icon: FileText, label: "Text" },
    { type: "heading", icon: Heading2, label: "Heading" },
    { type: "code", icon: Code, label: "Code" },
    { type: "quote", icon: Quote, label: "Quote" },
    { type: "list", icon: List, label: "List" },
];

const CODE_LANGUAGES = ["python", "javascript", "typescript", "csharp", "java", "html", "css", "sql", "bash"];

// ── Block editor ───────────────────────────────────────
function BlockEditor({
    block,
    onChange,
    onRemove,
    onTypeChange,
    autoFocus,
}: {
    block: NoteBlock;
    onChange: (content: string) => void;
    onRemove: () => void;
    onTypeChange: (type: NoteBlock["type"]) => void;
    autoFocus?: boolean;
}) {
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (autoFocus && ref.current) ref.current.focus();
    }, [autoFocus]);

    const resize = useCallback(() => {
        const el = ref.current;
        if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
    }, []);
    useEffect(resize, [block.content, resize]);

    const base = "w-full bg-transparent outline-none resize-none placeholder:text-muted-foreground/30 text-foreground";
    const styles: Record<NoteBlock["type"], string> = {
        text: "text-sm leading-relaxed",
        heading: "text-lg font-bold tracking-tight",
        code: "font-mono text-xs leading-relaxed bg-foreground/[0.03] dark:bg-white/[0.04] rounded-xl p-3 border border-foreground/[0.05] dark:border-white/[0.06]",
        quote: "text-sm italic border-l-2 border-primary/40 pl-4",
        list: "text-sm leading-loose",
    };
    const placeholders: Record<NoteBlock["type"], string> = {
        text: "Start typing...",
        heading: "Heading",
        code: "// paste code here (C#, Python, etc.)",
        quote: "Quote...",
        list: "- Item 1\n- Item 2",
    };

    return (
        <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="group relative">
            {/* Type selector — inline row on mobile, absolute left on desktop */}
            <div className="flex md:hidden items-center gap-0.5 mb-1.5 overflow-x-auto scrollbar-thin">
                {BLOCK_TYPES.map(({ type, icon: BIcon, label }) => (
                    <button
                        key={type}
                        onClick={() => onTypeChange(type)}
                        title={label}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0
              ${block.type === type ? "bg-primary/15 text-primary" : "text-muted-foreground/40 hover:text-foreground/60 hover:bg-foreground/[0.04]"}`}
                    >
                        <BIcon className="w-3 h-3" />
                    </button>
                ))}
                <button onClick={onRemove} title="Remove block"
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0">
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
            <div className="hidden md:flex absolute -left-9 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex-col gap-0.5">
                {BLOCK_TYPES.map(({ type, icon: BIcon, label }) => (
                    <button
                        key={type}
                        onClick={() => onTypeChange(type)}
                        title={label}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors
              ${block.type === type ? "bg-primary/15 text-primary" : "text-muted-foreground/40 hover:text-foreground/60 hover:bg-foreground/[0.04]"}`}
                    >
                        <BIcon className="w-3 h-3" />
                    </button>
                ))}
                <button onClick={onRemove} title="Remove block"
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>

            {block.type === "code" && (
                <div className="flex items-center gap-1.5 mb-2">
                    <Code className="w-3 h-3 text-muted-foreground/50" />
                    <select
                        value={block.language ?? "python"}
                        onChange={() => { }}
                        className="text-[10px] font-mono bg-transparent text-muted-foreground/60 outline-none cursor-pointer"
                    >
                        {CODE_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
            )}

            <textarea
                ref={ref}
                value={block.content}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholders[block.type]}
                rows={1}
                className={`${base} ${styles[block.type]}`}
            />
        </motion.div>
    );
}

// ── Notes main ─────────────────────────────────────────
function ProjectNotesTab({ projectId }: { projectId: string }) {
    const [docs, setDocs] = useState<NoteDoc[]>(() => {
        const loaded = loadNotes(projectId);
        return loaded.length > 0 ? loaded : [newDoc()];
    });
    const [activeId, setActiveId] = useState(docs[0]?.id ?? "");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const loaded = loadNotes(projectId);
        const d = loaded.length > 0 ? loaded : [newDoc()];
        setDocs(d);
        setActiveId(d[0]?.id ?? "");
    }, [projectId]);

    useEffect(() => { saveNotes(projectId, docs); }, [projectId, docs]);

    const activeDoc = docs.find((d) => d.id === activeId) ?? docs[0];

    const addDoc = () => { const d = newDoc(); setDocs((p) => [d, ...p]); setActiveId(d.id); };

    const deleteDoc = (id: string) => {
        setDocs((prev) => {
            const next = prev.filter((d) => d.id !== id);
            if (next.length === 0) { const f = newDoc(); setActiveId(f.id); return [f]; }
            if (activeId === id) setActiveId(next[0].id);
            return next;
        });
    };

    const updateTitle = (title: string) => {
        setDocs((p) => p.map((d) => (d.id === activeId ? { ...d, title, updatedAt: Date.now() } : d)));
    };

    const updateBlock = (blockId: string, content: string) => {
        setDocs((p) => p.map((d) =>
            d.id === activeId
                ? { ...d, updatedAt: Date.now(), blocks: d.blocks.map((b) => (b.id === blockId ? { ...b, content } : b)) }
                : d
        ));
    };

    const changeBlockType = (blockId: string, type: NoteBlock["type"]) => {
        setDocs((p) => p.map((d) =>
            d.id === activeId
                ? { ...d, updatedAt: Date.now(), blocks: d.blocks.map((b) => (b.id === blockId ? { ...b, type, language: type === "code" ? "python" : undefined } : b)) }
                : d
        ));
    };

    const removeBlock = (blockId: string) => {
        setDocs((p) => p.map((d) => {
            if (d.id !== activeId) return d;
            const next = d.blocks.filter((b) => b.id !== blockId);
            return { ...d, updatedAt: Date.now(), blocks: next.length > 0 ? next : [newBlock()] };
        }));
    };

    const addBlock = () => {
        const b = newBlock();
        setDocs((p) => p.map((d) => (d.id === activeId ? { ...d, updatedAt: Date.now(), blocks: [...d.blocks, b] } : d)));
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-22rem)] min-h-[400px]">
            {/* Mobile sidebar toggle */}
            <div className="flex md:hidden items-center gap-2">
                <button
                    onClick={() => setSidebarOpen((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                    {sidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
                    {sidebarOpen ? "Hide docs" : `Docs (${docs.length})`}
                </button>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={addDoc}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                </motion.button>
            </div>

            {/* Sidebar — hidden on mobile unless toggled */}
            <div className={`
                ${sidebarOpen ? "flex" : "hidden"} md:flex
                w-full md:w-52 shrink-0 rounded-2xl overflow-hidden flex-col
                bg-white/40 dark:bg-white/[0.03] backdrop-blur-[40px]
                border-[0.5px] border-black/5 dark:border-white/10
                shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.25)]
                max-h-48 md:max-h-none
            `}>
                <div className="px-4 py-3 flex items-center justify-between border-b border-black/5 dark:border-white/[0.06]">
                    <span className="text-xs font-bold tracking-tight text-foreground">Documents</span>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={addDoc}
                        className="w-6 h-6 rounded-lg flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                    </motion.button>
                </div>
                <div className="flex-1 overflow-y-auto py-1.5 scrollbar-thin">
                    {docs.map((doc) => (
                        <button key={doc.id} onClick={() => setActiveId(doc.id)}
                            className={`w-full text-left px-4 py-2 flex items-center gap-2 group/item transition-colors
                ${doc.id === activeId ? "bg-primary/10 dark:bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-foreground/[0.03]"}`}>
                            <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${doc.id === activeId ? "rotate-90 text-primary" : ""}`} />
                            <span className="text-xs font-medium truncate flex-1">{doc.title}</span>
                            <motion.button whileTap={{ scale: 0.8 }} onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                                className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover/item:opacity-100 text-muted-foreground/40 hover:text-red-500 transition-all">
                                <Trash2 className="w-3 h-3" />
                            </motion.button>
                        </button>
                    ))}
                </div>
            </div>

            {/* Editor */}
            {activeDoc && (
                <div className="flex-1 rounded-2xl overflow-hidden flex flex-col
          bg-white/40 dark:bg-white/[0.03] backdrop-blur-[40px]
          border-[0.5px] border-black/5 dark:border-white/10
          shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.25)]">
                    {/* Title */}
                    <div className="px-6 pt-5 pb-3 border-b border-black/5 dark:border-white/[0.06]">
                        <input value={activeDoc.title} onChange={(e) => updateTitle(e.target.value)} placeholder="Document title"
                            className="w-full bg-transparent outline-none text-xl font-black tracking-tighter text-foreground placeholder:text-muted-foreground/30" />
                        <p className="text-[10px] text-muted-foreground/40 mt-1">
                            {activeDoc.blocks.length} block{activeDoc.blocks.length !== 1 ? "s" : ""} · Last edited{" "}
                            {new Date(activeDoc.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                    </div>
                    {/* Toolbar */}
                    <div className="px-6 py-2 flex items-center gap-1 border-b border-black/5 dark:border-white/[0.04]">
                        {[Bold, Italic, Heading2, Code, Quote, List].map((TIcon, i) => (
                            <button key={i}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-foreground/[0.04] dark:hover:bg-white/[0.06] transition-colors">
                                <TIcon className="w-3.5 h-3.5" />
                            </button>
                        ))}
                    </div>
                    {/* Blocks */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 ps-4 md:ps-14 scrollbar-thin">
                        <AnimatePresence mode="popLayout">
                            {activeDoc.blocks.map((block, idx) => (
                                <BlockEditor key={block.id} block={block}
                                    onChange={(c) => updateBlock(block.id, c)}
                                    onRemove={() => removeBlock(block.id)}
                                    onTypeChange={(t) => changeBlockType(block.id, t)}
                                    autoFocus={idx === activeDoc.blocks.length - 1} />
                            ))}
                        </AnimatePresence>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={addBlock}
                            className="w-full py-3 rounded-xl border border-dashed border-foreground/[0.06] dark:border-white/[0.06]
                text-muted-foreground/30 hover:text-muted-foreground/60 hover:border-primary/30
                flex items-center justify-center gap-2 transition-all duration-300 text-xs">
                            <Plus className="w-3.5 h-3.5" /> Add block
                        </motion.button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════
const TABS: { key: SimpleTab; label: string; icon: React.ElementType }[] = [
    { key: "board", label: "Project Board", icon: Kanban },
    { key: "notes", label: "Docs & Notes", icon: FileText },
];

interface SimpleProjectDetailsProps {
    project: Project;
    onBack: () => void;
    onOpenSettings: () => void;
}

export default function SimpleProjectDetails({
    project,
    onBack,
    onOpenSettings,
}: SimpleProjectDetailsProps) {
    const [activeTab, setActiveTab] = useState<SimpleTab>("board");

    return (
        <div className="flex flex-col gap-6 md:gap-8">
            {/* Back + Title + Settings */}
            <div className="flex items-center gap-2 flex-wrap">
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onBack}
                    className="
            flex items-center gap-2 px-4 py-2 rounded-full
            text-xs font-semibold text-muted-foreground
            bg-foreground/[0.03] dark:bg-white/[0.04]
            backdrop-blur-xl ring-1 ring-white/10
            hover:text-foreground transition-colors duration-200
          "
                >
                    ← All Projects
                </motion.button>

                <div className="flex-1 min-w-0">
                    <h1 className="text-lg md:text-xl font-black tracking-tighter text-foreground truncate stealth-blur">
                        {project.name}
                    </h1>
                </div>

                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onOpenSettings}
                    className="
            flex items-center gap-2 px-4 py-2 rounded-full
            text-xs font-semibold text-muted-foreground
            bg-foreground/[0.03] dark:bg-white/[0.04]
            backdrop-blur-xl ring-1 ring-white/10
            hover:text-foreground transition-colors duration-200
          "
                >
                    ⚙ Settings
                </motion.button>
            </div>

            {/* Tab bar */}
            <div
                className="
          inline-flex items-center gap-1 p-1 rounded-2xl self-start
          bg-white/50 dark:bg-white/[0.04]
          backdrop-blur-[40px] border-[0.5px] border-black/5 dark:border-white/10
          shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.3)]
        "
            >
                {TABS.map(({ key, label, icon: TabIcon }) => {
                    const active = activeTab === key;
                    return (
                        <motion.button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            whileTap={{ scale: 0.96 }}
                            className={`
                relative px-4 py-2 rounded-xl text-xs font-semibold
                flex items-center gap-2 transition-colors duration-200
                ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"}
              `}
                        >
                            {active && (
                                <motion.div
                                    layoutId="simple-project-tab"
                                    className="absolute inset-0 rounded-xl
                    bg-white dark:bg-white/[0.08]
                    shadow-[0_1px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.2)]
                    ring-[0.5px] ring-black/[0.04] dark:ring-white/[0.06]"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <TabIcon className="w-4 h-4" />
                                {label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === "board" && <ProjectBoard projectId={project.id} />}
                    {activeTab === "notes" && <ProjectNotesTab projectId={project.id} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
