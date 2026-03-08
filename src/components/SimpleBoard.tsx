import { memo } from "react";
import { motion } from "framer-motion";
import {
    CircleDot,
    Loader2,
    CheckCircle2,
    GripVertical,
    Users,
    User,
    Inbox,
} from "lucide-react";
import type { Project } from "../types";

// ── Tag color palette (static strings — safe for Tailwind purge) ─
const TAG_PALETTE: Record<string, string> = {
    indigo: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
    emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    sky: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    amber: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    rose: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
    fuchsia: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300",
    orange: "bg-orange-500/15 text-orange-600 dark:text-orange-300",
    lime: "bg-lime-500/15 text-lime-600 dark:text-lime-300",
};
const TAG_DEFAULT = "bg-primary/10 text-primary/70";

// ── Kanban Column Config ───────────────────────────────
interface ColumnDef {
    key: string;
    label: string;
    icon: React.ElementType;
    gradient: string;
    dot: string;
    statuses: string[];
}

const COLUMNS: ColumnDef[] = [
    {
        key: "todo",
        label: "To Do",
        icon: CircleDot,
        gradient: "from-blue-500/20 to-blue-400/5",
        dot: "bg-blue-500",
        statuses: ["on-track"],
    },
    {
        key: "in-progress",
        label: "In Progress",
        icon: Loader2,
        gradient: "from-amber-500/20 to-amber-400/5",
        dot: "bg-amber-500",
        statuses: ["delayed"],
    },
    {
        key: "done",
        label: "Done",
        icon: CheckCircle2,
        gradient: "from-emerald-500/20 to-emerald-400/5",
        dot: "bg-emerald-500",
        statuses: ["completed"],
    },
];

// ── Card Variants ──────────────────────────────────────
const colVariant = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
};

const cardVariant = {
    hidden: { opacity: 0, y: 16, scale: 0.96 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 340, damping: 26 },
    },
};

// ── Mini Project Card (memo'd to prevent re-renders on sibling updates) ──
const KanbanCard = memo(function KanbanCard({
    project,
    onSelect,
}: {
    project: Project;
    onSelect: (id: string) => void;
}) {
    return (
        <motion.div
            variants={cardVariant}
            whileHover={{ scale: 1.025, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(project.id)}
            className="
        group relative rounded-2xl p-4 cursor-pointer select-none
        bg-white/60 dark:bg-white/[0.04]
        backdrop-blur-[40px] border-[0.5px] border-black/5 dark:border-white/10
        shadow-[0_4px_24px_-6px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.04)]
        dark:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.35),0_1px_3px_rgba(0,0,0,0.2)]
        hover:shadow-[0_8px_32px_-6px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.05)]
        dark:hover:shadow-[0_8px_32px_-6px_rgba(0,0,0,0.45)]
        transition-shadow duration-300
      "
        >
            {/* Drag handle (decorative) */}
            <GripVertical className="absolute top-3 right-3 w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />

            <h3 className="text-sm font-bold tracking-tight text-foreground mb-1.5 pr-5 stealth-blur">
                {project.name}
            </h3>
            <p className="text-[11px] text-muted-foreground/60 line-clamp-2 leading-relaxed mb-3 stealth-blur">
                {project.description}
            </p>

            {/* Tags row */}
            {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {project.tags.slice(0, 3).map((tag) => (
                        <span key={tag.id} className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${TAG_PALETTE[tag.color] || TAG_DEFAULT}`}>
                            {tag.label}
                        </span>
                    ))}
                    {project.tags.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold text-muted-foreground/40">
                            +{project.tags.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
                <span
                    className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full ${project.mode === "solo"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        }`}
                >
                    {project.mode === "solo" ? (
                        <User className="w-2.5 h-2.5" />
                    ) : (
                        <Users className="w-2.5 h-2.5" />
                    )}
                    {project.mode}
                </span>

                {/* Progress pill */}
                <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 rounded-full bg-foreground/[0.06] dark:bg-white/[0.08] overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-primary/70"
                            initial={{ width: 0 }}
                            animate={{ width: `${project.progress}%` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                        />
                    </div>
                    <span className="text-[9px] font-mono font-semibold text-muted-foreground tabular-nums">
                        {project.progress}%
                    </span>
                </div>
            </div>
        </motion.div>
    );
});

// ── Main Board ─────────────────────────────────────────
interface SimpleBoardProps {
    projects: Project[];
    onSelectProject: (id: string) => void;
}

export default function SimpleBoard({ projects, onSelectProject }: SimpleBoardProps) {
    return (
        <div className="overflow-x-auto -mx-2 px-2 pb-2 md:overflow-x-visible md:mx-0 md:px-0 md:pb-0">
            <div className="grid grid-cols-[repeat(3,minmax(260px,1fr))] md:grid-cols-3 gap-4 md:gap-5 min-w-[780px] md:min-w-0">
                {COLUMNS.map((col) => {
                    const items = projects.filter((p) => col.statuses.includes(p.status));
                    const ColIcon = col.icon;

                    return (
                        <motion.div
                            key={col.key}
                            variants={colVariant}
                            initial="hidden"
                            animate="show"
                            className="flex flex-col gap-3"
                        >
                            {/* Column Header */}
                            <div
                                className={`
                flex items-center gap-2 px-4 py-2.5 rounded-2xl
                bg-gradient-to-b ${col.gradient}
                backdrop-blur-xl border-[0.5px] border-black/5 dark:border-white/10
              `}
                            >
                                <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                                <ColIcon className="w-3.5 h-3.5 text-foreground/70" />
                                <span className="text-xs font-bold tracking-tight text-foreground">
                                    {col.label}
                                </span>
                                <span className="ml-auto text-[10px] font-mono font-semibold text-muted-foreground/60 tabular-nums">
                                    {items.length}
                                </span>
                            </div>

                            {/* Cards */}
                            <div className="flex flex-col gap-2.5 min-h-[120px]">
                                {items.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-28 rounded-2xl border border-dashed border-foreground/[0.06] dark:border-white/[0.06] gap-2">
                                        <Inbox className="w-5 h-5 text-muted-foreground/20" />
                                        <span className="text-[10px] text-muted-foreground/30 font-medium">
                                            No projects
                                        </span>
                                    </div>
                                )}
                                {items.map((project) => (
                                    <KanbanCard
                                        key={project.id}
                                        project={project}
                                        onSelect={onSelectProject}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
