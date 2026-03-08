import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
} from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    FolderKanban,
    CheckSquare,
    Zap,
    Sun,
    Moon,
    Plus,
    ArrowRight,
    UserCircle,
    EyeOff,
} from "lucide-react";
import { useProjectData, type Project } from "./ProjectDataContext";
import { useTheme } from "./ThemeProvider";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useStealth } from "./StealthMode";
import { useOS } from "@/hooks/use-os";

// ── Types ──────────────────────────────────────────────
interface PendingNav {
    projectId: string;
    taskId?: string;
}

interface CommandPaletteContextType {
    open: boolean;
    openPalette: () => void;
    closePalette: () => void;
    pendingNav: PendingNav | null;
    clearPendingNav: () => void;
    pendingAction: string | null;
    clearPendingAction: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType>({
    open: false,
    openPalette: () => { },
    closePalette: () => { },
    pendingNav: null,
    clearPendingNav: () => { },
    pendingAction: null,
    clearPendingAction: () => { },
});

export const useCommandPalette = () => useContext(CommandPaletteContext);


// ── Project color map (Tailwind can't do dynamic classes) ──
const COLOR_MAP: Record<string, { bg: string; text: string }> = {
    indigo: { bg: "bg-indigo-500/10", text: "text-indigo-500" },
    rose: { bg: "bg-rose-500/10", text: "text-rose-500" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-500" },
    sky: { bg: "bg-sky-500/10", text: "text-sky-500" },
    violet: { bg: "bg-violet-500/10", text: "text-violet-500" },
};

// ── Shared styling constants ───────────────────────────
const GROUP_HEADING_CLASS = [
    "[&_[cmdk-group-heading]]:px-3",
    "[&_[cmdk-group-heading]]:pt-3",
    "[&_[cmdk-group-heading]]:pb-1.5",
    "[&_[cmdk-group-heading]]:text-[10px]",
    "[&_[cmdk-group-heading]]:font-bold",
    "[&_[cmdk-group-heading]]:uppercase",
    "[&_[cmdk-group-heading]]:tracking-[0.08em]",
    "[&_[cmdk-group-heading]]:text-muted-foreground/40",
    "[&_[cmdk-group-heading]]:select-none",
].join(" ");

const ITEM_CLASS = [
    "group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer",
    "text-foreground/80 select-none",
    "data-[selected=true]:bg-primary/[0.08] data-[selected=true]:text-foreground",
    "transition-colors duration-100",
].join(" ");

const KBD_CLASS =
    "px-1 py-px rounded bg-foreground/[0.05] dark:bg-white/[0.05] font-mono";

// ── Provider ───────────────────────────────────────────
export function CommandPaletteProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [pendingNav, setPendingNav] = useState<PendingNav | null>(null);
    const [pendingAction, setPendingAction] = useState<string | null>(null);
    const { user } = useAuth();

    const openPalette = useCallback(() => setOpen(true), []);
    const closePalette = useCallback(() => setOpen(false), []);
    const clearPendingNav = useCallback(() => setPendingNav(null), []);
    const clearPendingAction = useCallback(() => setPendingAction(null), []);

    // Global Ctrl+K / Cmd+K listener
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                if (user) setOpen((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [user]);

    return (
        <CommandPaletteContext.Provider
            value={{
                open,
                openPalette,
                closePalette,
                pendingNav,
                clearPendingNav,
                pendingAction,
                clearPendingAction,
            }}
        >
            {children}
            {user && (
                <PaletteModal
                    open={open}
                    onClose={closePalette}
                    onNavigate={(nav) => {
                        setPendingNav(nav);
                        closePalette();
                    }}
                    onAction={(action) => {
                        setPendingAction(action);
                        closePalette();
                    }}
                />
            )}
        </CommandPaletteContext.Provider>
    );
}

// ── Modal ──────────────────────────────────────────────
function PaletteModal({
    open,
    onClose,
    onNavigate,
    onAction,
}: {
    open: boolean;
    onClose: () => void;
    onNavigate: (nav: PendingNav) => void;
    onAction: (action: string) => void;
}) {
    const { projects } = useProjectData();
    const { theme, toggleTheme } = useTheme();
    const { isStealthMode, toggleStealth } = useStealth();
    const navigate = useNavigate();
    const location = useLocation();
    const { shortcut } = useOS();

    // ── Handlers ─────────────────────────────────────────
    const goToDashboard = () => {
        if (location.pathname !== "/dashboard") navigate("/dashboard");
    };

    const handleProjectSelect = (projectId: string) => {
        goToDashboard();
        onNavigate({ projectId });
    };

    const handleToggleTheme = () => {
        toggleTheme();
        onClose();
    };

    const handleToggleStealth = () => {
        toggleStealth();
        onClose();
    };

    const handleCreateProject = () => {
        goToDashboard();
        onAction("create-project");
    };

    const handleGoTo = (path: string) => {
        navigate(path);
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* ── Backdrop ── */}
                    <motion.div
                        key="cmd-backdrop"
                        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                    />

                    {/* ── Centered container ── */}
                    <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[12vh] sm:pt-[18vh] px-4 pointer-events-none">
                        <motion.div
                            key="cmd-card"
                            initial={{ opacity: 0, scale: 0.96, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -8 }}
                            transition={{ type: "spring", stiffness: 500, damping: 32 }}
                            className="
                w-full max-w-[560px] pointer-events-auto
                rounded-2xl overflow-hidden
                bg-white/95 dark:bg-[#0a0a10]/95
                md:bg-white/80 md:dark:bg-[#0a0a10]/80
                backdrop-blur-[50px]
                border-[0.5px] border-white/30 dark:border-white/[0.08]
                shadow-sm md:shadow-[0_25px_80px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.05)]
                dark:shadow-sm md:dark:shadow-[0_25px_80px_-12px_rgba(0,0,0,0.6),0_0_60px_rgba(99,102,241,0.07)]
              "
                        >
                            <Command
                                loop
                                onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                        e.preventDefault();
                                        onClose();
                                    }
                                }}
                            >
                                {/* ── Search input with silk glow ── */}
                                <div className="px-3 pt-3 pb-2">
                                    <div
                                        className="
                      flex items-center gap-3 px-3 py-2.5
                      rounded-xl
                      bg-foreground/[0.03] dark:bg-white/[0.03]
                      ring-1 ring-primary/20
                      shadow-[0_0_16px_rgba(99,102,241,0.06),inset_0_0_12px_rgba(99,102,241,0.02)]
                      dark:shadow-[0_0_16px_rgba(99,102,241,0.12),inset_0_0_12px_rgba(99,102,241,0.04)]
                      transition-shadow duration-300
                    "
                                    >
                                        <Search className="w-[18px] h-[18px] text-primary/50 flex-shrink-0" />
                                        <Command.Input
                                            placeholder="Search projects, tasks, or type a command…"
                                            autoFocus
                                            className="
                        flex-1 bg-transparent text-[15px] font-medium
                        text-foreground placeholder:text-muted-foreground/40
                        outline-none border-none caret-primary
                      "
                                        />
                                        <kbd
                                            className="
                        hidden sm:inline-flex items-center px-1.5 py-0.5
                        rounded-md text-[10px] font-mono font-semibold
                        text-muted-foreground/40
                        bg-foreground/[0.04] dark:bg-white/[0.04]
                        border border-foreground/[0.06] dark:border-white/[0.06]
                      "
                                        >
                                            ESC
                                        </kbd>
                                    </div>
                                </div>

                                {/* ── Glowing divider ── */}
                                <div className="mx-5 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                                {/* ── Results ── */}
                                <Command.List className="max-h-[340px] overflow-y-auto overflow-x-hidden p-1.5">
                                    <Command.Empty className="flex flex-col items-center justify-center py-12 px-4">
                                        <div className="w-10 h-10 rounded-xl bg-foreground/[0.04] dark:bg-white/[0.04] flex items-center justify-center mb-3">
                                            <Search className="w-4 h-4 text-muted-foreground/30" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground/50">
                                            No results found
                                        </p>
                                        <p className="text-xs text-muted-foreground/30 mt-0.5">
                                            Try a different search term
                                        </p>
                                    </Command.Empty>

                                    {/* ── Projects ── */}
                                    <Command.Group heading="Projects" className={GROUP_HEADING_CLASS}>
                                        {projects.map((proj) => {
                                            const c = COLOR_MAP[proj.color] || COLOR_MAP.indigo;
                                            return (
                                                <Command.Item
                                                    key={proj.id}
                                                    value={`project ${proj.name} ${proj.description}`}
                                                    onSelect={() => handleProjectSelect(proj.id)}
                                                    className={ITEM_CLASS}
                                                >
                                                    <div
                                                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}
                                                    >
                                                        <FolderKanban className={`w-4 h-4 ${c.text}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-[13px] truncate">
                                                            {proj.name}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground/50 truncate">
                                                            {proj.description}
                                                        </p>
                                                    </div>
                                                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/20 flex-shrink-0 opacity-0 group-data-[selected=true]:opacity-100 transition-opacity" />
                                                </Command.Item>
                                            );
                                        })}
                                    </Command.Group>

                                    {/* ── Quick Actions ── */}
                                    <Command.Group
                                        heading="Quick Actions"
                                        className={GROUP_HEADING_CLASS}
                                    >
                                        <Command.Item
                                            value="create new project"
                                            onSelect={handleCreateProject}
                                            className={ITEM_CLASS}
                                        >
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10">
                                                <Plus className="w-4 h-4 text-primary" />
                                            </div>
                                            <span className="font-medium text-[13px]">
                                                Create New Project
                                            </span>
                                        </Command.Item>

                                        <Command.Item
                                            value="toggle dark mode light theme appearance"
                                            onSelect={handleToggleTheme}
                                            className={ITEM_CLASS}
                                        >
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-foreground/[0.04] dark:bg-white/[0.04]">
                                                {theme === "dark" ? (
                                                    <Sun className="w-4 h-4 text-amber-500" />
                                                ) : (
                                                    <Moon className="w-4 h-4 text-indigo-400" />
                                                )}
                                            </div>
                                            <span className="font-medium text-[13px]">
                                                Switch to {theme === "dark" ? "Light" : "Dark"} Mode
                                            </span>
                                        </Command.Item>

                                        <Command.Item
                                            value="toggle stealth mode privacy blur hide"
                                            onSelect={handleToggleStealth}
                                            className={ITEM_CLASS}
                                        >
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-foreground/[0.04] dark:bg-white/[0.04]">
                                                <EyeOff className={`w-4 h-4 ${isStealthMode ? "text-emerald-500" : "text-muted-foreground/60"}`} />
                                            </div>
                                            <span className="font-medium text-[13px]">
                                                {isStealthMode ? "Disable" : "Enable"} Stealth Mode
                                            </span>
                                            <kbd className="ml-auto text-[10px] font-mono font-semibold text-muted-foreground/30 bg-foreground/[0.04] dark:bg-white/[0.04] px-1.5 py-0.5 rounded-md">⇧S</kbd>
                                        </Command.Item>

                                        <Command.Item
                                            value="go to profile settings account"
                                            onSelect={() => handleGoTo("/profile")}
                                            className={ITEM_CLASS}
                                        >
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-foreground/[0.04] dark:bg-white/[0.04]">
                                                <UserCircle className="w-4 h-4 text-violet-500" />
                                            </div>
                                            <span className="font-medium text-[13px]">
                                                Go to Profile
                                            </span>
                                        </Command.Item>
                                    </Command.Group>
                                </Command.List>

                                {/* ── Footer with keyboard hints ── */}
                                <div
                                    className="
                    px-4 py-2 flex items-center gap-5
                    border-t border-foreground/[0.06] dark:border-white/[0.06]
                    text-[10px] text-muted-foreground/35 font-medium select-none
                  "
                                >
                                    <span className="flex items-center gap-1">
                                        <kbd className={KBD_CLASS}>↑</kbd>
                                        <kbd className={KBD_CLASS}>↓</kbd>
                                        navigate
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className={KBD_CLASS}>↵</kbd>
                                        select
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className={KBD_CLASS}>esc</kbd>
                                        close
                                    </span>
                                    <span className="ml-auto flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            <kbd className={KBD_CLASS}>{shortcut("K")}</kbd>
                                            open
                                        </span>
                                        <span className="flex items-center gap-1.5 text-primary/30">
                                            <Zap className="w-3 h-3" />
                                            STRIDE
                                        </span>
                                    </span>
                                </div>
                            </Command>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
