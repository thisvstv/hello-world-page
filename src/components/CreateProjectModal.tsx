import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMobileReducedMotion } from "@/hooks/use-reduced-motion";
import {
    X,
    Users,
    User,
    Palette,
    Layers,
    Rocket,
    Sparkles,
    Shield,
    Zap,
    Globe,
    Code,
    Database,
    Terminal,
    Star,
    Heart,
    Plus,
    Trash2,
    Crown,
    ShieldCheck,
    Pencil,
    Briefcase,
    GraduationCap,
    Coffee,
    Gamepad2,
    Music,
    Camera,
    BookOpen,
    Plane,
    Trophy,
    Lightbulb,
    PenTool,
    Gem,
} from "lucide-react";
import { useProjectData, type ProjectRole, type ProjectMode, type ProjectViewMode } from "./ProjectDataContext";
import { useAuth } from "./AuthContext";
import { sanitizeInput } from "@/lib/sanitize";

// ── Icon map ───────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
    Palette, Layers, Rocket, Sparkles, Shield, Zap, Globe,
    Code, Database, Terminal, Star, Heart, Briefcase,
    GraduationCap, Coffee, Gamepad2, Music, Camera,
    BookOpen, Plane, Trophy, Lightbulb, PenTool, Gem,
};
const ICON_LIST = Object.entries(ICON_MAP);

const ACCENT_COLORS = [
    { name: "indigo", swatch: "bg-indigo-500" },
    { name: "violet", swatch: "bg-violet-500" },
    { name: "rose", swatch: "bg-rose-500" },
    { name: "emerald", swatch: "bg-emerald-500" },
    { name: "amber", swatch: "bg-amber-500" },
    { name: "sky", swatch: "bg-sky-500" },
];

const ROLE_META: Record<ProjectRole, { label: string; icon: React.ElementType; desc: string }> = {
    owner: { label: "Owner", icon: Crown, desc: "Full control" },
    admin: { label: "Admin", icon: ShieldCheck, desc: "Manage members & settings" },
    editor: { label: "Editor", icon: Pencil, desc: "View assigned tasks & toggle status" },
};

interface NewMember {
    email: string;
    role: ProjectRole;
}

interface CreateProjectModalProps {
    open: boolean;
    onClose: () => void;
    defaultViewMode?: ProjectViewMode;
}

export default function CreateProjectModal({ open, onClose, defaultViewMode }: CreateProjectModalProps) {
    const { addProject, projects } = useProjectData();
    const { user } = useAuth();
    const reduceMotion = useMobileReducedMotion();

    // ── Project limit enforcement ──────────────────────
    const MAX_TOTAL_PROJECTS = 4;
    const totalProjectCount = projects.length;
    const globalLimitReached = totalProjectCount >= MAX_TOTAL_PROJECTS;

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [iconName, setIconName] = useState("Rocket");
    const [color, setColor] = useState("indigo");
    const [mode] = useState<ProjectMode>("solo");
    const [estimatedDays, setEstimatedDays] = useState(30);

    const reset = () => {
        setName(""); setDescription(""); setIconName("Rocket"); setColor("indigo");
        setEstimatedDays(30);
    };

    const getInitials = (n: string) => n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

    const handleCreate = () => {
        const safeName = sanitizeInput(name);
        if (!safeName) return;
        const safeDesc = sanitizeInput(description);
        const ownerInitials = user?.fullName ? getInitials(user.fullName) : "ME";
        const ownerName = user?.fullName || "Me";
        const ownerEmail = user?.email || "me@example.com";

        const members = [
            { id: `m-${Date.now()}`, initials: ownerInitials, name: ownerName, email: ownerEmail, color: "bg-indigo-500", role: "owner" as ProjectRole },
        ];

        const proj = addProject({
            name: safeName,
            description: safeDesc,
            iconName,
            progress: 0,
            status: "on-track",
            color,
            mode,
            viewMode: defaultViewMode ?? "advanced",
            members,
            tags: [],
            estimatedDays,
        });

        // Limit hit — addProject returned null
        if (!proj) return;

        reset();
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
                        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
                        transition={reduceMotion ? { duration: 0.15 } : { type: "spring", stiffness: 400, damping: 30 }}
                        className="
              relative w-full max-w-lg max-h-[85vh] overflow-y-auto
              rounded-[2rem] p-8
              bg-white/95 dark:bg-slate-900/95
              md:bg-white/80 md:dark:bg-slate-900/80
              backdrop-blur-[60px] border border-black/5 dark:border-white/10
              shadow-sm md:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)]
              dark:shadow-sm md:dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)]
            "
                    >
                        {/* Close */}
                        <button onClick={onClose} className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors active:scale-[0.92]">
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-black tracking-tighter text-foreground mb-6">New Project</h2>

                        {/* Name */}
                        <label className="block mb-4">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Project Name</span>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="My Awesome Project"
                                className="mt-1.5 w-full h-10 rounded-xl glass px-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:shadow-neon transition-premium"
                            />
                        </label>

                        {/* Description */}
                        <label className="block mb-4">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Description</span>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What's this project about?"
                                rows={2}
                                className="mt-1.5 w-full rounded-xl glass px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:shadow-neon transition-premium resize-none"
                            />
                        </label>

                        {/* Icon picker */}
                        <div className="mb-4">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Icon</span>
                            <div className="grid grid-cols-5 gap-2 mt-1.5 max-h-[200px] overflow-y-auto pr-1">
                                {ICON_LIST.map(([iName, Icon]) => (
                                    <button
                                        key={iName}
                                        onClick={() => setIconName(iName)}
                                        className={`
                      w-9 h-9 rounded-xl flex items-center justify-center transition-premium active:scale-[0.92]
                      ${iconName === iName
                                                ? "bg-primary/15 text-primary shadow-neon ring-1 ring-primary/30"
                                                : "glass text-muted-foreground hover:text-foreground"
                                            }
                    `}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color */}
                        <div className="mb-5">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Accent Color</span>
                            <div className="flex gap-2 mt-1.5">
                                {ACCENT_COLORS.map((c) => (
                                    <button
                                        key={c.name}
                                        onClick={() => setColor(c.name)}
                                        className={`w-7 h-7 rounded-full ${c.swatch} transition-all active:scale-[0.92] ${color === c.name ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" : "opacity-60 hover:opacity-100"}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Mode — Phase 1 is Solo only */}

                        {/* Estimated days */}
                        <label className="block mb-5">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Estimated Duration (days)</span>
                            <input
                                type="number"
                                min={1}
                                value={estimatedDays}
                                onChange={(e) => setEstimatedDays(Math.max(1, +e.target.value))}
                                className="mt-1.5 w-24 h-10 rounded-xl glass px-4 text-sm text-foreground outline-none focus:shadow-neon transition-premium"
                            />
                        </label>



                        {/* Limit Warning */}
                        <AnimatePresence>
                            {globalLimitReached && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="overflow-hidden"
                                >
                                    <div className="
                                        flex items-center gap-3 p-4 rounded-2xl
                                        bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10
                                        ring-1 ring-amber-500/20 dark:ring-amber-400/20
                                        mb-4
                                    ">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                                            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Limit Reached</p>
                                            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                                                You have reached the maximum of {MAX_TOTAL_PROJECTS} projects (Solo + Team combined). Delete an existing project to create a new one.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button onClick={onClose} className="flex-1 h-11 rounded-2xl glass text-sm font-semibold text-muted-foreground hover:text-foreground transition-premium active:scale-[0.98]">
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!name.trim() || globalLimitReached}
                                className="flex-1 h-11 rounded-2xl btn-silk text-sm disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]"
                            >
                                {globalLimitReached ? "Limit Reached" : "Create Project"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
