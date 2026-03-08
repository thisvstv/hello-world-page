import { useState, useCallback, createContext, useContext, ReactNode, memo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, AlertTriangle, Info, Sparkles, Trash2, Users } from "lucide-react";
import api from "@/lib/axios";

// ── Types ──────────────────────────────────────────────
export type NotifType = "info" | "success" | "warning" | "update" | "team";

export interface Notification {
    id: string;
    type: NotifType;
    title: string;
    message: string;
    time: string;
    read: boolean;
}

// ── Context ────────────────────────────────────────────
interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markRead: (id: string) => void;
    markAllRead: () => void;
    dismiss: (id: string) => void;
    clearAll: () => void;
    addNotification: (n: Omit<Notification, "id" | "read">) => void;
    /** Bulk-replace the list (used by NotificationBell for the initial REST fetch). */
    seedNotifications: (items: Notification[]) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
    // Start with an empty list — real notifications arrive via SSE from the backend.
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markRead = useCallback((id: string) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        api.patch(`/api/notifications/${id}/read`).catch(console.error);
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        api.patch("/api/notifications/read-all").catch(console.error);
    }, []);

    const dismiss = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        api.delete(`/api/notifications/${id}`).catch(console.error);
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        api.delete("/api/notifications/clear-all").catch(console.error);
    }, []);

    const addNotification = useCallback((n: Omit<Notification, "id" | "read">) => {
        setNotifications((prev) => [{ ...n, id: `n-${Date.now()}`, read: false }, ...prev]);
    }, []);

    const seedNotifications = useCallback((items: Notification[]) => {
        setNotifications(items);
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, dismiss, clearAll, addNotification, seedNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
    return ctx;
}

// ── Icon mapping ───────────────────────────────────────
const NOTIF_ICON: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
    info: { icon: Info, color: "text-sky-500", bg: "bg-sky-500/10 ring-sky-400/20" },
    success: { icon: Check, color: "text-emerald-500", bg: "bg-emerald-500/10 ring-emerald-400/20" },
    warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10 ring-amber-400/20" },
    update: { icon: Sparkles, color: "text-indigo-500", bg: "bg-indigo-500/10 ring-indigo-400/20" },
    team: { icon: Users, color: "text-violet-500", bg: "bg-violet-500/10 ring-violet-400/20" },
};

// ── Notification Flyout ────────────────────────────────
export const NotificationFlyout = memo(function NotificationFlyout({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { notifications, unreadCount, markRead, markAllRead, dismiss, clearAll } = useNotifications();

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[70]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="
              fixed md:absolute
              left-4 right-4 top-16
              md:left-auto md:right-0 md:top-full md:mt-3
              z-[80]
              w-auto md:w-[min(380px,calc(100vw-2rem))]
              max-h-[60vh] overflow-hidden
              rounded-[1.5rem] md:rounded-[2rem] flex flex-col
              bg-white/95 dark:bg-slate-950/95
              md:bg-white/80 md:dark:bg-black/80
              backdrop-blur-[48px]
              border-[0.5px] border-black/5 dark:border-white/15
              shadow-sm md:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.15),0_12px_36px_-8px_rgba(0,0,0,0.08)]
              dark:shadow-sm md:dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.6),0_12px_36px_-8px_rgba(0,0,0,0.4)]
            "
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary text-primary-foreground shadow-[0_0_12px_rgba(99,102,241,0.4)]">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-primary hover:bg-primary/[0.06] transition-colors active:scale-[0.96]">
                                        Mark all read
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button onClick={clearAll}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/[0.06] transition-colors active:scale-[0.96]">
                                        Clear all
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <div className="w-12 h-12 rounded-full bg-foreground/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
                                        <Bell className="w-5 h-5 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-xs text-muted-foreground/40">All caught up!</p>
                                </div>
                            ) : (
                                <div className="py-2">
                                    <AnimatePresence>
                                        {notifications.map((notif) => {
                                            const nc = NOTIF_ICON[notif.type];
                                            const NIcon = nc.icon;
                                            return (
                                                <motion.div
                                                    key={notif.id}
                                                    layout
                                                    initial={{ opacity: 0, x: -12 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 30, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    onClick={() => markRead(notif.id)}
                                                    className={`
                            flex items-start gap-3 px-5 py-3.5 cursor-pointer
                            hover:bg-foreground/[0.03] dark:hover:bg-white/[0.04]
                            transition-colors duration-150
                            ${!notif.read ? "bg-primary/[0.02] dark:bg-primary/[0.03]" : ""}
                          `}
                                                >
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ring-1 ${nc.bg}`}>
                                                        <NIcon className={`w-3.5 h-3.5 ${nc.color}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-xs font-semibold truncate ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                                                                {notif.title}
                                                            </p>
                                                            {!notif.read && (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(99,102,241,0.5)] shrink-0" />
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">{notif.message}</p>
                                                        <p className="text-[9px] text-muted-foreground/40 font-mono mt-1">{notif.time}</p>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                                                        aria-label="Dismiss notification"
                                                        className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground/30 hover:text-destructive hover:bg-destructive/[0.06] transition-all shrink-0 active:scale-[0.85]">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
});
