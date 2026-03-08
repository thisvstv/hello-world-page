import { useEffect, useRef } from "react";
import { getAccessToken } from "@/lib/axios";
import { useAuth } from "@/components/AuthContext";

type SSEEventHandler = (data: unknown) => void;

/**
 * React hook that opens an EventSource to the backend SSE
 * notifications stream and dispatches events to registered handlers.
 *
 * Automatically reconnects on disconnect with exponential back-off
 * (up to 30 seconds).  Closes cleanly on unmount or logout.
 *
 * Usage:
 * ```ts
 * useSSE({
 *   "task:updated": (data) => console.log("task updated", data),
 *   "member:joined": (data) => toast.success(`${data.name} joined`),
 * });
 * ```
 */
export function useSSE(handlers: Record<string, SSEEventHandler> = {}): void {
  const { user } = useAuth();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!user) return; // not logged in

    const token = getAccessToken();
    if (!token) return; // no auth token yet

    // SSE base URL — same as API base minus any trailing /api path
    const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000";
    const url = `${base}/api/notifications/stream?token=${encodeURIComponent(token)}`;

    let reconnectDelay = 1000;
    let es: EventSource | null = null;
    let dead = false;

    function connect() {
      if (dead) return;
      es = new EventSource(url, { withCredentials: true });

      es.addEventListener("connected", () => {
        reconnectDelay = 1000; // reset back-off on successful connection
      });

      // Dispatch named events to handlers
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const handler = handlersRef.current["message"];
          if (handler) handler(data);
        } catch { /* ignore parse errors */ }
      };

      // Register specific event listeners
      for (const eventName of Object.keys(handlersRef.current)) {
        if (eventName === "message") continue; // handled by onmessage
        es.addEventListener(eventName, (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            const handler = handlersRef.current[eventName];
            if (handler) handler(data);
          } catch { /* ignore */ }
        });
      }

      es.onerror = () => {
        es?.close();
        es = null;
        if (dead) return;
        // Exponential back-off with 30s cap
        setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
      };
    }

    connect();

    return () => {
      dead = true;
      es?.close();
      es = null;
    };
  }, [user]);
}
