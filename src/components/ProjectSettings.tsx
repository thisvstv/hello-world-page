import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMobileReducedMotion } from "@/hooks/use-reduced-motion";
import { sanitizeInput } from "@/lib/sanitize";
import { toast } from "sonner";
import {
  X,
  Plus,
  Trash2,
  Check,
  Pencil,
  Crown,
  ShieldCheck,
  Palette,
  Layers,
  Rocket,
  Sparkles,
  Shield,
  Zap,
  Globe,
  Heart,
  Star,
  Sun,
  Moon,
  Cloud,
  Code,
  Database,
  Terminal,
  Music,
  Camera,
  BookOpen,
  AlertTriangle,
  Lock,
  Clock,
  ScrollText,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────
type ProjectTag = { id: string; label: string; color: string };
type ProjectMember = {
  email: string;
  id: string;
  initials: string;
  name: string;
  color: string;
  role: "owner" | "admin" | "editor";
};

export type ProjectSettings = {
  projectId: string;
  name: string;
  iconName: string;
  accentColor: string;
  tags: ProjectTag[];
  members: ProjectMember[];
};

import type { ProjectMode, ProjectRole, AuditLogEntry } from "./ProjectDataContext";

interface ProjectSettingsOverlayProps {
  open: boolean;
  onClose: () => void;
  settings: ProjectSettings;
  onUpdateSettings: (settings: ProjectSettings) => void;
  projectMode?: ProjectMode;
  onDeleteProject?: (projectId: string) => void;
  userRole?: ProjectRole;
  auditLogs?: AuditLogEntry[];
}

// ── Constants ──────────────────────────────────────────
const TAG_COLORS = [
  { name: "indigo", gradient: "from-indigo-400 to-violet-400" },
  { name: "rose", gradient: "from-rose-400 to-pink-400" },
  { name: "emerald", gradient: "from-emerald-400 to-teal-400" },
  { name: "amber", gradient: "from-amber-400 to-yellow-400" },
  { name: "sky", gradient: "from-sky-400 to-cyan-400" },
  { name: "fuchsia", gradient: "from-fuchsia-400 to-purple-400" },
  { name: "orange", gradient: "from-orange-400 to-red-400" },
  { name: "lime", gradient: "from-lime-400 to-green-400" },
];

const ACCENT_COLORS = [
  { name: "indigo", hsl: "239 84% 67%", swatch: "bg-indigo-500" },
  { name: "violet", hsl: "263 70% 58%", swatch: "bg-violet-500" },
  { name: "rose", hsl: "350 89% 60%", swatch: "bg-rose-500" },
  { name: "emerald", hsl: "160 84% 39%", swatch: "bg-emerald-500" },
  { name: "amber", hsl: "38 92% 50%", swatch: "bg-amber-500" },
  { name: "sky", hsl: "199 89% 48%", swatch: "bg-sky-500" },
  { name: "fuchsia", hsl: "292 84% 61%", swatch: "bg-fuchsia-500" },
  { name: "orange", hsl: "25 95% 53%", swatch: "bg-orange-500" },
];

const ICON_OPTIONS: { name: string; icon: React.ElementType }[] = [
  { name: "Palette", icon: Palette },
  { name: "Layers", icon: Layers },
  { name: "Rocket", icon: Rocket },
  { name: "Sparkles", icon: Sparkles },
  { name: "Shield", icon: Shield },
  { name: "Zap", icon: Zap },
  { name: "Globe", icon: Globe },
  { name: "Heart", icon: Heart },
  { name: "Star", icon: Star },
  { name: "Sun", icon: Sun },
  { name: "Moon", icon: Moon },
  { name: "Cloud", icon: Cloud },
  { name: "Code", icon: Code },
  { name: "Database", icon: Database },
  { name: "Terminal", icon: Terminal },
  { name: "Music", icon: Music },
  { name: "Camera", icon: Camera },
  { name: "BookOpen", icon: BookOpen },
];

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; accent: string }> = {
  owner: { label: "Owner", icon: Crown, accent: "text-amber-500" },
  admin: { label: "Admin", icon: ShieldCheck, accent: "text-indigo-500" },
  editor: { label: "Editor", icon: Pencil, accent: "text-emerald-500" },
};

type SettingsTab = "general" | "tags" | "members" | "activity";

// ── Tag Manager ────────────────────────────────────────
function TagManager({
  tags,
  onChange,
}: {
  tags: ProjectTag[];
  onChange: (tags: ProjectTag[]) => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("indigo");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const addTag = () => {
    const safeLabel = sanitizeInput(newLabel);
    if (!safeLabel) return;
    onChange([
      ...tags,
      { id: `tag-${crypto.randomUUID().slice(0, 8)}`, label: safeLabel, color: newColor },
    ]);
    setNewLabel("");
  };

  const removeTag = (id: string) => onChange(tags.filter((t) => t.id !== id));

  const startEdit = (tag: ProjectTag) => {
    setEditingId(tag.id);
    setEditLabel(tag.label);
  };

  const saveEdit = (id: string) => {
    const safeLabel = sanitizeInput(editLabel) || undefined;
    onChange(tags.map((t) => (t.id === id ? { ...t, label: safeLabel || t.label } : t)));
    setEditingId(null);
  };

  const updateColor = (id: string, color: string) => {
    onChange(tags.map((t) => (t.id === id ? { ...t, color } : t)));
  };

  const gradient = (color: string) =>
    TAG_COLORS.find((c) => c.name === color)?.gradient || TAG_COLORS[0].gradient;

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Project Tags
      </h3>
      <p className="text-[10px] text-muted-foreground/60">
        Tags are unique to this project and won't affect other projects.
      </p>

      {/* Existing tags */}
      <div className="space-y-2">
        <AnimatePresence>
          {tags.map((tag) => (
            <motion.div
              key={tag.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="
                flex items-center gap-3 px-4 py-3 rounded-2xl
                bg-foreground/[0.02] dark:bg-white/[0.03]
                ring-1 ring-white/10 backdrop-blur-xl
              "
            >
              <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${gradient(tag.color)} shrink-0`} />

              {editingId === tag.id ? (
                <input
                  autoFocus
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={() => saveEdit(tag.id)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveEdit(tag.id); }}
                  className="
                    flex-1 text-xs bg-transparent outline-none
                    text-foreground border-b border-primary/30
                  "
                />
              ) : (
                <span className="flex-1 text-xs font-medium text-foreground">{tag.label}</span>
              )}

              {/* Color picker dots */}
              <div className="flex gap-1">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => updateColor(tag.id, c.name)}
                    className={`
                      w-3 h-3 rounded-full bg-gradient-to-r ${c.gradient}
                      transition-all duration-200
                      ${tag.color === c.name ? "ring-2 ring-primary scale-125" : "opacity-40 hover:opacity-80"}
                    `}
                  />
                ))}
              </div>

              <button onClick={() => startEdit(tag)} className="text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="w-3 h-3" />
              </button>
              <button onClick={() => removeTag(tag.id)} className="text-destructive/60 hover:text-destructive transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add new tag */}
      <div className="flex gap-2 items-center">
        <div className="flex gap-1.5">
          {TAG_COLORS.slice(0, 5).map((c) => (
            <button
              key={c.name}
              onClick={() => setNewColor(c.name)}
              className={`
                w-4 h-4 rounded-full bg-gradient-to-r ${c.gradient}
                transition-all duration-200
                ${newColor === c.name ? "ring-2 ring-primary scale-125" : "opacity-40 hover:opacity-80"}
              `}
            />
          ))}
        </div>
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addTag(); }}
          placeholder="New tag name…"
          className="
            flex-1 px-3 py-2 rounded-xl text-xs
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
          onClick={addTag}
          className="
            w-8 h-8 rounded-full flex items-center justify-center
            bg-primary/10 text-primary hover:bg-primary/20
            transition-colors duration-200
          "
        >
          <Plus className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>
  );
}

// ── Audit Log Timeline ─────────────────────────────────
function AuditLogTimeline({ logs }: { logs: AuditLogEntry[] }) {
  if (logs.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-foreground/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
          <ScrollText className="w-6 h-6 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">No activity yet</p>
          <p className="text-[11px] text-muted-foreground mt-1">Actions like settings changes, member updates, and notes will appear here.</p>
        </div>
      </div>
    );
  }

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let relative: string;
    if (diffMin < 1) relative = "Just now";
    else if (diffMin < 60) relative = `${diffMin}m ago`;
    else if (diffHrs < 24) relative = `${diffHrs}h ago`;
    else if (diffDays < 7) relative = `${diffDays}d ago`;
    else relative = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const full = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

    return { relative, time, full };
  };

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Activity Timeline &middot; {logs.length} {logs.length === 1 ? "entry" : "entries"}
      </p>
      <div className="max-h-[420px] overflow-y-auto pr-1 -mr-1 scrollbar-thin">
        <div className="relative pl-6 border-l border-foreground/[0.06] dark:border-white/[0.08] space-y-4">
          {logs.map((entry) => {
            const ts = formatTimestamp(entry.timestamp);
            return (
              <div key={entry.id} className="relative group">
                {/* Timeline dot */}
                <div className="absolute -left-[25px] top-1.5 w-2 h-2 rounded-full bg-foreground/20 dark:bg-white/20 ring-2 ring-background group-hover:bg-primary/60 transition-colors" />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-foreground leading-snug">{entry.action}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {entry.userEmail}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5" title={`${ts.full} at ${ts.time}`}>
                    <Clock className="w-3 h-3 text-muted-foreground/40" />
                    <span className="text-[10px] text-muted-foreground/60 tabular-nums">{ts.relative}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Member Management ──────────────────────────────────
function MemberManager({
  members,
  onChange,
}: {
  members: ProjectMember[];
  onChange: (members: ProjectMember[]) => void;
}) {
  const [newName, setNewName] = useState("");
  const MAX_MEMBERS = 5;
  const memberLimitReached = members.length >= MAX_MEMBERS;

  const addMember = () => {
    if (memberLimitReached) {
      toast.error("Maximum 5 members allowed per project");
      return;
    }
    const safeName = newName.trim().replace(/<[^>]*>/g, "");
    if (!safeName) return;
    const initials = safeName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const colors = ["bg-indigo-500", "bg-violet-500", "bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-fuchsia-500"];
    onChange([
      ...members,
      {
        id: `member-${crypto.randomUUID().slice(0, 8)}`,
        initials,
        name: safeName,
        email: "",
        color: colors[members.length % colors.length],
        role: "editor",
      },
    ]);
    setNewName("");
  };

  const removeMember = (id: string) => {
    const m = members.find((x) => x.id === id);
    if (m?.role === "owner") return;
    onChange(members.filter((x) => x.id !== id));
  };

  const changeRole = (id: string, role: "admin" | "editor") => {
    const m = members.find((x) => x.id === id);
    if (m?.role === "owner") return;
    onChange(members.map((x) => (x.id === id ? { ...x, role } : x)));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Project Members
      </h3>
      <p className="text-[10px] text-muted-foreground/60">
        Members added here are specific to this project only.
      </p>

      {/* Members list */}
      <div className="space-y-2">
        <AnimatePresence>
          {members.map((member) => {
            const rc = ROLE_CONFIG[member.role];
            const RoleIcon = rc.icon;
            return (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className="
                  flex items-center gap-3 px-4 py-3 rounded-2xl
                  bg-foreground/[0.02] dark:bg-white/[0.03]
                  ring-1 ring-white/10 backdrop-blur-xl
                "
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  text-[10px] font-bold text-white ${member.color}
                  ring-2 ring-white/80 dark:ring-black/60
                  shadow-[0_2px_8px_rgba(0,0,0,0.12)]
                `}>
                  {member.initials}
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-foreground block">{member.name}</span>
                  <span className={`text-[9px] font-semibold flex items-center gap-1 ${rc.accent}`}>
                    <RoleIcon className="w-2.5 h-2.5" />
                    {rc.label}
                  </span>
                </div>

                {member.role !== "owner" && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => changeRole(member.id, member.role === "admin" ? "editor" : "admin")}
                      className="
                        px-2 py-1 rounded-lg text-[9px] font-semibold
                        bg-foreground/[0.04] dark:bg-white/[0.06]
                        text-muted-foreground hover:text-foreground
                        transition-colors duration-150
                      "
                    >
                      {member.role === "admin" ? "Demote" : "Promote"}
                    </button>
                    <button
                      onClick={() => removeMember(member.id)}
                      className="text-destructive/60 hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add member */}
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addMember(); }}
          placeholder={memberLimitReached ? "Member limit reached" : "Full name…"}
          disabled={memberLimitReached}
          className={`
            flex-1 px-3 py-2 rounded-xl text-xs
            bg-foreground/[0.02] dark:bg-white/[0.03]
            ring-1 ring-white/10 backdrop-blur-xl
            text-foreground placeholder:text-muted-foreground/40
            outline-none focus:ring-primary/20
            transition-all duration-200
            ${memberLimitReached ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
        <motion.button
          whileHover={memberLimitReached ? {} : { scale: 1.05 }}
          whileTap={memberLimitReached ? {} : { scale: 0.9 }}
          onClick={addMember}
          disabled={memberLimitReached}
          title={memberLimitReached ? "Maximum 5 members allowed per project" : "Invite a new member"}
          className={`
            px-3 py-2 rounded-xl flex items-center gap-1.5 text-[10px] font-semibold
            transition-colors duration-200
            ${memberLimitReached
              ? "bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
              : "bg-primary/10 text-primary hover:bg-primary/20"
            }
          `}
        >
          <Plus className="w-3 h-3" />
          Invite
        </motion.button>
      </div>

      {/* Member limit hint */}
      {memberLimitReached && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mt-1">
          <Lock className="w-3 h-3" />
          Maximum 5 members allowed per project
        </p>
      )}
    </div>
  );
}

// ── General Settings ───────────────────────────────────
function GeneralSettings({
  settings,
  onChange,
}: {
  settings: ProjectSettings;
  onChange: (updates: Partial<ProjectSettings>) => void;
}) {
  const currentIcon = ICON_OPTIONS.find((i) => i.name === settings.iconName) || ICON_OPTIONS[0];
  const CurrentIconComp = currentIcon.icon;

  return (
    <div className="space-y-6">
      {/* Project Name */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Project Name
        </h3>
        <input
          value={settings.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="
            w-full px-4 py-3 rounded-2xl text-sm font-semibold
            bg-foreground/[0.02] dark:bg-white/[0.03]
            ring-1 ring-white/10 backdrop-blur-xl
            text-foreground outline-none focus:ring-primary/20
            transition-all duration-200
          "
        />
      </div>

      {/* Icon Picker */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Project Icon
        </h3>
        <div className="flex items-center gap-3 mb-3">
          <div className="
            w-12 h-12 rounded-2xl flex items-center justify-center
            bg-primary/10 dark:bg-primary/15
            shadow-[0_0_20px_rgba(99,102,241,0.15)]
          ">
            <CurrentIconComp className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">{currentIcon.name}</span>
        </div>
        <div className="grid grid-cols-9 gap-2">
          {ICON_OPTIONS.map((opt) => {
            const IconComp = opt.icon;
            const isActive = settings.iconName === opt.name;
            return (
              <motion.button
                key={opt.name}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onChange({ iconName: opt.name })}
                className={`
                  w-9 h-9 rounded-xl flex items-center justify-center
                  transition-all duration-200
                  ${isActive
                    ? "bg-primary/15 ring-1 ring-primary/40 text-primary shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                    : "bg-foreground/[0.03] dark:bg-white/[0.04] text-muted-foreground hover:text-foreground ring-1 ring-white/10"
                  }
                `}
              >
                <IconComp className="w-4 h-4" />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Accent Color */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Accent Color
        </h3>
        <div className="flex gap-3">
          {ACCENT_COLORS.map((c) => {
            const isActive = settings.accentColor === c.name;
            return (
              <motion.button
                key={c.name}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onChange({ accentColor: c.name })}
                className={`
                  w-8 h-8 rounded-full ${c.swatch}
                  transition-all duration-200
                  ${isActive
                    ? "ring-2 ring-offset-2 ring-offset-background ring-foreground/30 scale-110 shadow-[0_0_16px_rgba(99,102,241,0.3)]"
                    : "opacity-50 hover:opacity-80"
                  }
                `}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Settings Overlay ──────────────────────────────
export default function ProjectSettingsOverlay({
  open,
  onClose,
  settings,
  onUpdateSettings,
  projectMode = "solo",
  onDeleteProject,
  userRole = "owner",
  auditLogs = [],
}: ProjectSettingsOverlayProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const reduceMotion = useMobileReducedMotion();
  const isSolo = projectMode === "solo";
  const isEditorRole = userRole === "editor";
  const canDelete = userRole === "owner" || userRole === "admin";

  // ── Delete confirmation state ────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const deleteNameMatches = deleteConfirmName.trim().toLowerCase() === settings.name.trim().toLowerCase();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Allowed settings keys — prevents prototype pollution via DevTools
  const ALLOWED_SETTINGS_KEYS = new Set<keyof ProjectSettings>([
    "projectId", "name", "iconName", "accentColor", "tags", "members",
  ]);

  const handleUpdateGeneral = useCallback(
    (updates: Partial<ProjectSettings>) => {
      const safe: Partial<ProjectSettings> = {};
      for (const key of Object.keys(updates)) {
        if (ALLOWED_SETTINGS_KEYS.has(key as keyof ProjectSettings)) {
          (safe as Record<string, unknown>)[key] = (updates as Record<string, unknown>)[key];
        }
      }
      onUpdateSettings({ ...settings, ...safe });
    },
    [settings, onUpdateSettings]
  );

  const handleUpdateTags = useCallback(
    (tags: ProjectTag[]) => {
      onUpdateSettings({ ...settings, tags });
    },
    [settings, onUpdateSettings]
  );

  const handleUpdateMembers = useCallback(
    (members: ProjectMember[]) => {
      onUpdateSettings({ ...settings, members });
    },
    [settings, onUpdateSettings]
  );

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: "general", label: "General" },
    { key: "tags", label: "Tags" },
    ...(isSolo ? [] : [{ key: "members" as SettingsTab, label: "Members" }]),
    ...(canDelete ? [{ key: "activity" as SettingsTab, label: "Activity" }] : []),
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          />

          {/* Overlay Panel */}
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            transition={reduceMotion ? { duration: 0.15 } : { type: "spring", stiffness: 400, damping: 30 }}
            className="
              fixed inset-2 md:inset-8 z-[80] flex flex-col
              rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden
              bg-white/95 dark:bg-slate-950/95
              md:bg-white/70 md:dark:bg-black/70
              backdrop-blur-[64px]
              ring-1 ring-white/20 dark:ring-white/10
              shadow-[0_32px_100px_-20px_rgba(0,0,0,0.2),0_16px_48px_-12px_rgba(0,0,0,0.1)]
              dark:shadow-[0_32px_100px_-20px_rgba(0,0,0,0.7),0_16px_48px_-12px_rgba(0,0,0,0.5)]
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/[0.06]">
              <div>
                <h1 className="text-xl font-black tracking-tighter text-foreground">
                  Project Settings
                </h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {settings.name}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="
                  w-10 h-10 rounded-full flex items-center justify-center
                  bg-foreground/[0.04] dark:bg-white/[0.06]
                  hover:bg-foreground/[0.08] dark:hover:bg-white/[0.1]
                  text-muted-foreground
                  transition-colors duration-200
                "
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-8 pt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    relative px-4 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-200
                    ${activeTab === tab.key
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId={reduceMotion ? undefined : "settingsTab"}
                      className="absolute inset-0 rounded-xl bg-primary/[0.08] ring-1 ring-primary/20"
                      transition={reduceMotion ? { duration: 0.15 } : { type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <AnimatePresence mode="wait">
                {activeTab === "general" && (
                  <motion.div
                    key="general"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Hide settings controls from editors */}
                    {isEditorRole ? (
                      <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground">You have limited access — editors cannot modify project settings.</p>
                      </div>
                    ) : (
                      <GeneralSettings settings={settings} onChange={handleUpdateGeneral} />
                    )}

                    {/* ── Danger Zone ── */}
                    {canDelete && onDeleteProject && (
                      <div className="mt-10 pt-8 border-t border-destructive/10">
                        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-destructive">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Danger Zone
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-1 mb-4">
                          Irreversible and destructive actions. Proceed with caution.
                        </p>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { setDeleteConfirmName(""); setDeleteDialogOpen(true); }}
                          className="
                            flex items-center gap-2 px-5 py-3 rounded-2xl
                            bg-destructive/10 text-destructive ring-1 ring-destructive/20
                            hover:bg-destructive/20 hover:ring-destructive/40
                            text-sm font-semibold
                            transition-all duration-200
                          "
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Project
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )}
                {activeTab === "tags" && (
                  <motion.div
                    key="tags"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isEditorRole ? (
                      <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground">You have limited access — editors cannot modify tags.</p>
                      </div>
                    ) : (
                      <TagManager tags={settings.tags} onChange={handleUpdateTags} />
                    )}
                  </motion.div>
                )}
                {activeTab === "members" && !isSolo && (
                  <motion.div
                    key="members"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isEditorRole ? (
                      <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground">You have limited access — editors cannot manage members.</p>
                      </div>
                    ) : (
                      <MemberManager members={settings.members} onChange={handleUpdateMembers} />
                    )}
                  </motion.div>
                )}
                {activeTab === "activity" && (
                  <motion.div
                    key="activity"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* RBAC: strictly owner/admin only */}
                    {!canDelete ? (
                      <div className="py-16 flex flex-col items-center gap-4 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-foreground/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
                          <Lock className="w-6 h-6 text-muted-foreground/40" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Restricted Access</p>
                          <p className="text-[11px] text-muted-foreground mt-1">Only project owners and admins can view the activity log.</p>
                        </div>
                      </div>
                    ) : (
                      <AuditLogTimeline logs={auditLogs} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {deleteDialogOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteDialogOpen(false)}
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            transition={reduceMotion ? { duration: 0.15 } : { type: "spring", stiffness: 400, damping: 30 }}
            className="
              fixed z-[90] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-full max-w-md p-8 rounded-[2rem]
              bg-white/95 dark:bg-slate-900/95
              md:bg-white/90 md:dark:bg-slate-900/90
              backdrop-blur-[60px] border border-white/10
              shadow-sm md:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)]
            "
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tighter text-foreground">Delete Project</h2>
                <p className="text-[11px] text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              All tasks, notes, and settings for <strong className="text-foreground">{settings.name}</strong> will be permanently deleted.
            </p>

            <label className="block mb-6">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Type <span className="text-destructive font-bold">{settings.name}</span> to confirm
              </span>
              <input
                autoFocus
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && deleteNameMatches) {
                    try {
                      onDeleteProject!(settings.projectId);
                      toast.success("Project deleted successfully");
                    } catch {
                      toast.error("Failed to delete project");
                    }
                    setDeleteDialogOpen(false);
                    onClose();
                  }
                  if (e.key === "Escape") setDeleteDialogOpen(false);
                }}
                placeholder={settings.name}
                className="
                  mt-1.5 w-full h-11 rounded-xl px-4 text-sm
                  bg-foreground/[0.03] dark:bg-white/[0.03]
                  ring-1 ring-destructive/20 focus:ring-destructive/40
                  text-foreground placeholder:text-muted-foreground/30
                  outline-none transition-all duration-200
                "
              />
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="flex-1 h-11 rounded-2xl text-sm font-semibold text-muted-foreground bg-foreground/[0.04] hover:bg-foreground/[0.08] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!deleteNameMatches) return;
                  try {
                    onDeleteProject!(settings.projectId);
                    toast.success("Project deleted successfully");
                  } catch {
                    toast.error("Failed to delete project");
                  }
                  setDeleteDialogOpen(false);
                  onClose();
                }}
                disabled={!deleteNameMatches}
                className="
                  flex-1 h-11 rounded-2xl text-sm font-semibold
                  bg-destructive text-destructive-foreground
                  hover:bg-destructive/90
                  disabled:opacity-30 disabled:pointer-events-none
                  transition-all duration-200
                "
              >
                Delete Forever
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
