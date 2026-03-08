import { toast } from "sonner";

/**
 * Centralised notification service for the STRIDE dashboard.
 * Fires rich Sonner toasts and can be extended to push
 * in‑app notifications via NotificationSystem later.
 */
export class NotificationService {
    /* ── Assignment ────────────────────────────────── */
    static taskAssigned(taskName: string, userName: string) {
        toast.success(`📌 ${userName} assigned`, {
            description: taskName,
            duration: 4000,
        });
    }

    /* ── Sub-task completion ───────────────────────── */
    static subtaskCompleted(subtaskName: string, userName: string) {
        toast("🎉 Sub-task completed", {
            description: `${userName} finished "${subtaskName}"`,
            duration: 4000,
        });
    }
}
