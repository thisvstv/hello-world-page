import { useState, useId, useEffect } from "react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import {
  Layers,
  Rocket,
  Sparkles,
  Palette,
  Shield,
  Plus,
  Zap,
  Globe,
  Code,
  Database,
  Terminal as TerminalIcon,
  Star,
  Heart,
  Settings,
} from "lucide-react";
import { useProjectData, type Project as ProjectData, type ProjectStatus } from "./ProjectDataContext";
import CreateProjectModal from "./CreateProjectModal";
import { useCommandPalette } from "./CommandPalette";
import { AlertTriangle } from "lucide-react";

// ── Global project limit ───────────────────────────────
const MAX_TOTAL_PROJECTS = 4;

// Phase 1: advanced view only (single-player)

// ── Icon map (shared) ──────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Palette, Layers, Rocket, Sparkles, Shield, Zap, Globe,
  Code, Database, Terminal: TerminalIcon, Star, Heart,
};

// ── Status Tag ─────────────────────────────────────────
const STATUS_STYLES: Record<ProjectStatus, { light: string; dark: string; label: string }> = {
  "on-track": {
    light: "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700",
    dark: "bg-transparent ring-1 ring-emerald-400/60 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]",
    label: "On Track",
  },
  delayed: {
    light: "bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700",
    dark: "bg-transparent ring-1 ring-rose-400/60 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]",
    label: "Delayed",
  },
  completed: {
    light: "bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700",
    dark: "bg-transparent ring-1 ring-indigo-400/60 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.3)]",
    label: "Completed",
  },
};

function StatusTag({ status }: { status: ProjectStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <>
      <span className={`px-2.5 py-1 rounded-full text-[9px] font-semibold ${s.light} dark:hidden`}>{s.label}</span>
      <span className={`px-2.5 py-1 rounded-full text-[9px] font-semibold hidden dark:inline-flex ${s.dark}`}>{s.label}</span>
    </>
  );
}

// ── SVG Progress Ring ──────────────────────────────────
function ProgressRing({ progress, size = 64, strokeWidth = 4 }: { progress: number; size?: number; strokeWidth?: number }) {
  const gradId = useId();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-foreground/[0.06] dark:text-white/[0.08]"
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold font-mono text-foreground tracking-tight">
          {progress}%
        </span>
      </div>
    </div>
  );
}

// ── Animation Variants ─────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
};

// ── Project Card ───────────────────────────────────────
function ProjectCard({
  project,
  onSelect,
  onOpenSettings,
}: {
  project: ProjectData;
  onSelect: (id: string) => void;
  onOpenSettings?: (id: string) => void;
}) {
  const Icon = ICON_MAP[project.iconName] || Layers;

  return (
    <motion.div
      variants={cardVariants}
      layoutId={`project-card-${project.id}`}
      onClick={() => onSelect(project.id)}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="
        rounded-[2.5rem] p-6 cursor-pointer select-none relative
        bg-white/60 dark:bg-white/[0.04]
        backdrop-blur-[40px] border-[0.5px] border-black/5 dark:border-white/20
        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07),0_8px_24px_-8px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.4)]
        dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5),0_0_30px_rgba(99,102,241,0.04),inset_0_1px_1px_rgba(255,255,255,0.06)]
        transition-shadow duration-500
        flex flex-col gap-5
      "
    >
      {/* Top: Icon + Status */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="
            w-12 h-12 rounded-2xl flex items-center justify-center
            bg-primary/10 dark:bg-primary/15
            shadow-[0_0_20px_rgba(99,102,241,0.15)]
            dark:shadow-[0_0_20px_rgba(99,102,241,0.25)]
          ">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusTag status={project.status} />
          {onOpenSettings && (
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpenSettings(project.id); }}
              className="
                w-7 h-7 rounded-full flex items-center justify-center
                bg-foreground/[0.04] dark:bg-white/[0.06]
                hover:bg-foreground/[0.08] dark:hover:bg-white/[0.1]
                text-muted-foreground hover:text-foreground
                ring-1 ring-foreground/[0.06] dark:ring-white/[0.08]
                transition-all duration-200
              "
              title="Project Settings"
            >
              <Settings className="w-3 h-3" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Title + Description */}
      <div className="flex-1">
        <h2 className="text-lg font-black tracking-tighter text-foreground mb-1 stealth-blur">
          {project.name}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 stealth-blur">
          {project.description}
        </p>
      </div>

      {/* Bottom: Progress Ring */}
      <div className="flex items-end justify-end">
        <ProgressRing progress={project.progress} />
      </div>
    </motion.div>
  );
}

// ── Create New Card ────────────────────────────────────
function CreateProjectCard({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={disabled ? undefined : { scale: 1.03, y: -4 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={disabled ? undefined : onClick}
      className={`
        rounded-[2.5rem] p-6 select-none
        flex flex-col items-center justify-center gap-4
        min-h-[260px]
        border-2 border-dashed
        backdrop-blur-xl
        group transition-all duration-500
        ${disabled
          ? "border-foreground/[0.04] dark:border-white/[0.04] bg-foreground/[0.01] dark:bg-white/[0.005] cursor-not-allowed opacity-50"
          : "border-foreground/[0.08] dark:border-white/[0.08] bg-foreground/[0.01] dark:bg-white/[0.01] cursor-pointer hover:border-primary/30 dark:hover:border-primary/40"
        }
      `}
    >
      <motion.div
        className={`
          w-16 h-16 rounded-full flex items-center justify-center
          bg-foreground/[0.03] dark:bg-white/[0.04]
          ${disabled ? "" : "group-hover:bg-primary/10 dark:group-hover:bg-primary/15 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] dark:group-hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]"}
          transition-all duration-500
        `}
      >
        <Plus className={`w-7 h-7 ${disabled ? "text-muted-foreground/40" : "text-muted-foreground group-hover:text-primary"} transition-colors duration-300`} />
      </motion.div>
      <div className="text-center">
        <h3 className={`text-sm font-bold tracking-tight ${disabled ? "text-muted-foreground/40" : "text-muted-foreground group-hover:text-foreground"} transition-colors duration-300`}>
          {disabled ? "Limit Reached" : "New Project"}
        </h3>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {disabled ? `Maximum of ${MAX_TOTAL_PROJECTS} projects` : "Start from scratch"}
        </p>
      </div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────
interface ProjectDashboardProps {
  onSelectProject: (id: string) => void;
  onOpenSettings?: (projectId: string) => void;
}

const EMPTY_MESSAGE = {
  title: "Start your first project",
  description: "Organize tasks, track progress, and stay focused — all in one place.",
};

export default function ProjectDashboard({ onSelectProject, onOpenSettings }: ProjectDashboardProps) {
  const { projects } = useProjectData();
  const [createOpen, setCreateOpen] = useState(false);
  const { pendingAction, clearPendingAction } = useCommandPalette();

  // React to "create-project" command from palette
  useEffect(() => {
    if (pendingAction === "create-project") {
      setCreateOpen(true);
      clearPendingAction();
    }
  }, [pendingAction, clearPendingAction]);

  // ── Global limit ─────────────────────────────────────
  const totalProjects = projects.length;
  const limitReached = totalProjects >= MAX_TOTAL_PROJECTS;

  const filteredProjects = projects;

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={cardVariants} className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground">
              Projects
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {filteredProjects.length
                ? `${filteredProjects.length} project${filteredProjects.length !== 1 ? "s" : ""} · Select one to open your workspace`
                : "No projects yet — create your first one below"}
            </p>
          </div>
        </motion.div>

        {/* ── Limit Warning ─────────────────────────── */}
        {limitReached && (
          <motion.div
            variants={cardVariants}
            className="mb-5 md:mb-6 flex items-center gap-3 px-4 py-3 rounded-2xl
              bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10
              ring-1 ring-amber-500/20 dark:ring-amber-400/20"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
              Maximum limit of {MAX_TOTAL_PROJECTS} projects reached
            </p>
            <span className="ml-auto text-[10px] font-mono tabular-nums text-amber-600/60 dark:text-amber-400/50">
              {totalProjects}/{MAX_TOTAL_PROJECTS}
            </span>
          </motion.div>
        )}

        {/* Empty state */}
        {filteredProjects.length === 0 && (
          <motion.div
            variants={cardVariants}
            className="flex flex-col items-center justify-center py-16 mb-8 rounded-[2.5rem]
              bg-white/30 dark:bg-white/[0.02]
              backdrop-blur-[40px] border-[0.5px] border-black/5 dark:border-white/10"
          >
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-primary/10 dark:bg-primary/15 mb-5 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
              <Layers className="w-8 h-8 text-primary/60" />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-foreground mb-1">{EMPTY_MESSAGE.title}</h3>
            <p className="text-xs text-muted-foreground/60 mb-6 max-w-[260px] text-center leading-relaxed">
              {EMPTY_MESSAGE.description}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCreateOpen(true)}
              className="px-6 py-2.5 rounded-full btn-silk text-sm font-semibold shadow-[0_0_20px_rgba(99,102,241,0.25)]"
            >
              <Plus className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              Create Project
            </motion.button>
          </motion.div>
        )}

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={onSelectProject}
              onOpenSettings={onOpenSettings}
            />
          ))}
          <CreateProjectCard onClick={() => setCreateOpen(true)} disabled={limitReached} />
        </div>
      </motion.div>

      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} defaultViewMode="advanced" />
    </>
  );
}
