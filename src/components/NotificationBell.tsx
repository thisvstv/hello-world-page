import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useNotifications, NotificationFlyout, type NotifType, type Notification } from "./NotificationSystem";
import { useAuth } from "./AuthContext";
import api, { getAccessToken } from "@/lib/axios";

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000";

// ── Backend notification shape ─────────────────────────────────
interface BackendNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

// Map backend type strings (e.g. "GENERAL", "WARNING") to frontend NotifType.
const TYPE_MAP: Record<string, NotifType> = {
  info: "info",
  success: "success",
  warning: "warning",
  update: "update",
  team: "team",
};

function mapType(raw: string): NotifType {
  return TYPE_MAP[raw.toLowerCase()] ?? "info";
}

function mapBackendNotification(n: BackendNotification): Notification {
  return {
    id: n.id,
    type: mapType(n.type),
    title: n.title,
    message: n.message,
    time: new Date(n.createdAt).toLocaleString(),
    read: n.isRead,
  };
}

// ─────────────────────────────────────────────────────────────
// NotificationBell
// ─────────────────────────────────────────────────────────────
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { unreadCount, addNotification, seedNotifications } = useNotifications();
  const { user } = useAuth();
  const esRef = useRef<EventSource | null>(null);

  // ── Initial fetch: load persisted notifications from REST API ──
  useEffect(() => {
    if (!user) return;

    api
      .get<BackendNotification[]>("/api/notifications")
      .then((res) => {
        // Backend returns newest-first. Process and filter out fully read ones
        // so they don't clog up the popup after refresh.
        const unreadOnly = res.data.filter(n => !n.isRead);
        seedNotifications(unreadOnly.map(mapBackendNotification));
      })
      .catch(() => {
        // Non-critical — silently ignore. SSE will still deliver new ones.
      });
  }, [user, seedNotifications]);

  // ── SSE: receive real-time notifications ──────────────────────
  useEffect(() => {
    if (!user) return;

    const token = getAccessToken();
    if (!token) return;

    // Pass the JWT as a query param — EventSource does not support
    // custom headers, so the backend must accept token via ?token=.
    const url = `${BASE_URL}/api/notifications/stream?token=${encodeURIComponent(token)}`;

    let reconnectDelay = 1_000;
    let dead = false;
    let es: EventSource | null = null;

    function connect() {
      if (dead) return;

      es = new EventSource(url, {
        // Send cookies (refresh token) alongside the request.
        withCredentials: true,
      });

      esRef.current = es;

      // Reset back-off on successful connection
      es.addEventListener("connected", () => {
        reconnectDelay = 1_000;
      });

      // Unnamed `data:` frames (sent by sendRealtimeNotification)
      es.onmessage = (event: MessageEvent) => {
        try {
          const n = JSON.parse(event.data as string) as Partial<BackendNotification>;
          if (n.title && n.message) {
            addNotification({
              type: mapType(n.type ?? ""),
              title: n.title,
              message: n.message,
              time: n.createdAt ? new Date(n.createdAt).toLocaleString() : "Just now",
            });
          }
        } catch {
          // Ignore malformed SSE frames
        }
      };

      es.onerror = () => {
        es?.close();
        es = null;
        esRef.current = null;
        if (dead) return;
        setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
      };
    }

    connect();

    return () => {
      dead = true;
      es?.close();
      esRef.current = null;
    };
  }, [user, addNotification]);

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-2xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-premium"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="w-4 h-4" />

        {/* Red dot / count badge */}
        {unreadCount > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow-neon"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <NotificationFlyout open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
