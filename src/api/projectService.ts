import api from "@/lib/axios";
import { toLocalDateStr } from "@/lib/taskUtils";
import type {
    DayColumn,
    Project,
    ProjectInvite,
    ProjectMember,
    ProjectNote,
    ProjectRole,
    ProjectStatus,
    SubTask,
    Task,
} from "@/types";

type AnyRecord = Record<string, unknown>;

function toProjectStatus(value: unknown): ProjectStatus {
    if (value === "on_track") return "on-track";
    if (value === "on-track" || value === "delayed" || value === "completed") {
        return value;
    }
    return "on-track";
}

function toMs(value: unknown): number {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? Date.now() : parsed;
    }
    return Date.now();
}

function initialsFromName(fullName: string): string {
    return fullName
        .split(" ")
        .filter(Boolean)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join("")
        .slice(0, 4);
}

function mapProjectMember(raw: AnyRecord): ProjectMember {
    const user = (raw.user as AnyRecord | undefined) ?? {};
    const fullName = String(user.fullName ?? raw.name ?? "Unknown User");
    return {
        id: String(raw.id ?? raw.userId ?? crypto.randomUUID()),
        initials: String(user.initials ?? raw.initials ?? initialsFromName(fullName)),
        name: fullName,
        email: String(user.email ?? raw.email ?? ""),
        color: String(raw.color ?? "bg-indigo-500"),
        role: (raw.role as ProjectRole) ?? "editor",
    };
}

function mapProjectNote(raw: AnyRecord): ProjectNote {
    const authorName = String(raw.authorName ?? "Unknown");
    return {
        id: String(raw.id ?? crypto.randomUUID()),
        content: String(raw.content ?? ""),
        authorName,
        authorInitials: initialsFromName(authorName),
        createdAt: toMs(raw.createdAt),
    };
}

function mapProject(raw: AnyRecord): Project {
    const members = Array.isArray(raw.members)
        ? raw.members.map((member) => mapProjectMember(member as AnyRecord))
        : [];

    const tags = Array.isArray(raw.tags)
        ? raw.tags.map((tag) => ({
            id: String((tag as AnyRecord).id ?? crypto.randomUUID()),
            label: String((tag as AnyRecord).label ?? ""),
            color: String((tag as AnyRecord).color ?? "indigo"),
        }))
        : [];

    const notes = Array.isArray(raw.notes)
        ? raw.notes.map((note) => mapProjectNote(note as AnyRecord))
        : [];

    return {
        id: String(raw.id),
        name: String(raw.name ?? "Untitled Project"),
        description: String(raw.description ?? ""),
        iconName: String(raw.iconName ?? "Layers"),
        progress: Number(raw.progress ?? 0),
        status: toProjectStatus(raw.status),
        color: String(raw.color ?? "indigo"),
        mode: raw.mode === "team" ? "team" : "solo",
        members,
        invites: [],
        notes,
        tags,
        createdAt: toMs(raw.createdAt),
        estimatedDays: Number(raw.estimatedDays ?? 30),
        auditLogs: [],
    };
}

function toCreatePayload(data: Omit<Project, "id" | "createdAt" | "notes" | "invites">) {
    return {
        name: data.name,
        description: data.description,
        iconName: data.iconName,
        progress: data.progress,
        status: data.status,
        color: data.color,
        mode: data.mode,
        estimatedDays: data.estimatedDays,
        members: data.members.map((member) => ({
            initials: member.initials,
            name: member.name,
            email: member.email,
            color: member.color,
            role: member.role,
        })),
        tags: data.tags.map((tag) => ({ label: tag.label, color: tag.color })),
    };
}

function toUpdatePayload(updates: Partial<Project>) {
    const payload: AnyRecord = {};

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.iconName !== undefined) payload.iconName = updates.iconName;
    if (updates.progress !== undefined) payload.progress = updates.progress;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.mode !== undefined) payload.mode = updates.mode;
    if (updates.estimatedDays !== undefined) payload.estimatedDays = updates.estimatedDays;

    return payload;
}

function mapTaskColumns(raw: unknown): DayColumn[] | null {
    if (!Array.isArray(raw)) return null;
    if (raw.length === 0) return null;

    return raw.map((column) => {
        const col = column as AnyRecord;
        const tasksRaw = Array.isArray(col.tasks) ? col.tasks : [];

        const tasks: Task[] = tasksRaw.map((taskValue) => {
            const task = taskValue as AnyRecord;

            // Map subtasks: backend sends { id, title, done, assignee, sortOrder }
            // Frontend SubTask type expects { id, label, done, assigneeId }
            const subtasks: SubTask[] = Array.isArray(task.subtasks)
                ? (task.subtasks as AnyRecord[]).map((s) => ({
                    id: String(s.id ?? crypto.randomUUID()),
                    label: String(s.title ?? s.label ?? ""),
                    done: Boolean(s.done),
                    assigneeId: s.assignee != null ? String(s.assignee) : (s.assigneeId != null ? String(s.assigneeId) : undefined),
                }))
                : [];

            return {
                id: String(task.id),
                title: String(task.title ?? ""),
                description: String(task.description ?? ""),
                tags: Array.isArray(task.tags) ? (task.tags as Task["tags"]) : [],
                assignees: Array.isArray(task.assignees) ? task.assignees.map(String) : [],
                done: Boolean(task.done),
                rolledOver: Boolean(task.rolledOver),
                priority:
                    task.priority === "low" ||
                        task.priority === "medium" ||
                        task.priority === "high" ||
                        task.priority === "critical"
                        ? task.priority
                        : undefined,
                dueDate: task.dueDate ? new Date(String(task.dueDate)) : undefined,
                subtasks,
            };
        });

        // ── FIX: Parse column date as a LOCAL date ──────────────
        // The backend sends UTC midnight ISO strings (e.g. "2026-03-01T00:00:00.000Z").
        // `new Date("…Z")` creates a UTC instant — in negative UTC offsets
        // (e.g. UTC-5) getDate()/getMonth() return the PREVIOUS day (Feb 28),
        // which causes wrong column headings and store-key mismatches in useTasks.
        // Extract the YYYY-MM-DD portion and create a LOCAL noon date so that
        // getDate()/getMonth() always return the intended calendar date regardless
        // of timezone, and noon avoids DST spring-forward edge cases.
        const isoDate = String(col.date);
        const [y, mo, d] = isoDate.slice(0, 10).split("-").map(Number);
        const localDate = new Date(y, mo - 1, d, 12, 0, 0);

        return {
            date: localDate,
            tasks,
        };
    });
}

function toTaskSavePayload(columns: DayColumn[]): unknown[] {
    return columns.map((column) => ({
        date: column.date.toISOString(),
        tasks: column.tasks.map((task) => {
            const enrichedTask = task as Task & { subtasks?: AnyRecord[] };
            return {
                id: task.id,
                title: task.title,
                description: task.description,
                tags: task.tags,
                assignees: task.assignees,
                done: task.done,
                rolledOver: task.rolledOver,
                priority: task.priority ?? null,
                dueDate: task.dueDate ? task.dueDate.toISOString() : null,
                subtasks: Array.isArray(enrichedTask.subtasks) ? enrichedTask.subtasks : [],
            };
        }),
    }));
}

export async function fetchProjects(): Promise<Project[]> {
    const response = await api.get("/api/projects");
    const rows = Array.isArray(response.data) ? response.data : [];
    return rows.map((row) => mapProject(row as AnyRecord));
}

export async function fetchProjectById(id: string): Promise<Project> {
    const response = await api.get(`/api/projects/${id}`);
    return mapProject(response.data as AnyRecord);
}

export async function createProject(
    data: Omit<Project, "id" | "createdAt" | "notes" | "invites">,
): Promise<Project> {
    if (!data.members.length) {
        throw new Error("Project creation requires at least one member (owner).");
    }

    const response = await api.post("/api/projects", toCreatePayload(data));
    return mapProject(response.data as AnyRecord);
}

export async function updateProject(
    id: string,
    updates: Partial<Project>,
): Promise<Project> {
    const response = await api.patch(`/api/projects/${id}`, toUpdatePayload(updates));
    return mapProject(response.data as AnyRecord);
}

export async function deleteProject(id: string): Promise<void> {
    await api.delete(`/api/projects/${id}`);
}

export async function addNote(
    projectId: string,
    content: string,
    authorName: string,
    authorInitials: string,
): Promise<ProjectNote> {
    const response = await api.post(`/api/projects/${projectId}/notes`, {
        content,
        authorName,
        authorInitials,
    });

    return mapProjectNote(response.data as AnyRecord);
}

export async function deleteNote(
    projectId: string,
    noteId: string,
): Promise<void> {
    await api.delete(`/api/projects/${projectId}/notes/${noteId}`);
}

export async function addMember(
    projectId: string,
    member: ProjectMember,
): Promise<void> {
    const role: "admin" | "editor" = member.role === "admin" ? "admin" : "editor";
    await api.post(`/api/projects/${projectId}/members`, {
        initials: member.initials,
        name: member.name,
        email: member.email,
        color: member.color,
        role,
    });
}

export async function removeMember(
    projectId: string,
    memberId: string,
): Promise<void> {
    await api.delete(`/api/projects/${projectId}/members/${memberId}`);
}

export async function updateMemberRole(
    projectId: string,
    memberId: string,
    role: ProjectRole,
): Promise<void> {
    await api.patch(`/api/projects/${projectId}/members/${memberId}`, { role });
}

export async function sendInvite(
    projectId: string,
    email: string,
    role: ProjectRole,
    invitedBy: string,
): Promise<ProjectInvite> {
    const localPart = email.split("@")[0] ?? "member";
    const safeName = localPart
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ") || "New Member";
    const initials = initialsFromName(safeName);
    const normalizedRole: "admin" | "editor" = role === "admin" ? "admin" : "editor";

    const response = await api.post(`/api/projects/${projectId}/members`, {
        initials,
        name: safeName,
        email,
        color: "bg-indigo-500",
        role: normalizedRole,
    });

    const created = mapProjectMember(response.data as AnyRecord);
    return {
        id: created.id,
        email: created.email,
        role: created.role,
        invitedBy,
        status: "accepted",
        createdAt: Date.now(),
    };
}

export async function acceptInvite(
    projectId: string,
    _inviteId: string,
    _name: string,
    _initials: string,
): Promise<void> {
    await api.get(`/api/projects/${projectId}`);
}

export async function declineInvite(
    projectId: string,
    _inviteId: string,
): Promise<void> {
    await api.get(`/api/projects/${projectId}`);
}

export async function fetchTasks(projectId: string): Promise<DayColumn[] | null> {
    // Pass the caller's local date so the backend lazy-rollover uses the
    // user's timezone rather than server UTC (fixes off-by-one at midnight).
    const localToday = toLocalDateStr(new Date());
    const response = await api.get(`/api/projects/${projectId}/tasks`, {
        params: { date: localToday },
    });
    return mapTaskColumns(response.data);
}

export async function saveTasks(
    projectId: string,
    columns: DayColumn[],
): Promise<void> {
    await api.put(`/api/projects/${projectId}/tasks`, toTaskSavePayload(columns));
}

// ── Atomic Task Endpoints (Delta Sync) ─────────────────────

/**
 * POST /api/projects/:id/tasks
 * Create a single task on a specific date column.
 */
export async function createSingleTask(
    projectId: string,
    task: Task,
    date: Date,
): Promise<void> {
    await api.post(`/api/projects/${projectId}/tasks`, {
        id: task.id,
        title: task.title,
        date: date.toISOString(),
        description: task.description,
        tags: task.tags,
        assignees: task.assignees,
        done: task.done,
        rolledOver: task.rolledOver,
        priority: task.priority ?? null,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        subtasks: Array.isArray(task.subtasks)
            ? task.subtasks.map((s) => ({
                id: s.id,
                title: s.label,
                done: s.done,
                assignee: s.assigneeId,
                sortOrder: 0,
            }))
            : [],
    });
}

/**
 * PATCH /api/projects/:id/tasks/:taskId
 * Update only the provided fields of a single task (atomic delta).
 */
export async function patchTask(
    projectId: string,
    taskId: string,
    updates: Record<string, unknown>,
): Promise<void> {
    await api.patch(`/api/projects/${projectId}/tasks/${taskId}`, updates);
}

/**
 * DELETE /api/projects/:id/tasks/:taskId
 * Delete a single task.
 */
export async function deleteSingleTask(
    projectId: string,
    taskId: string,
): Promise<void> {
    await api.delete(`/api/projects/${projectId}/tasks/${taskId}`);
}

/**
 * PATCH /api/projects/:id/tasks/reorder
 * Batch reorder tasks after drag-and-drop.
 * Accepts array of { id, sortOrder, columnDate }.
 */
export async function reorderTasks(
    projectId: string,
    items: { id: string; sortOrder: number; columnDate: string }[],
): Promise<void> {
    await api.patch(`/api/projects/${projectId}/tasks/reorder`, items);
}

/**
 * POST /api/projects/:id/rollover
 * Trigger server-side rollover of overdue undone tasks to today.
 * Returns the refreshed task board.
 */
export async function rolloverTasks(projectId: string): Promise<DayColumn[] | null> {
    // The backend must not derive "today" from server time; pass local date.
    const targetDate = toLocalDateStr(new Date());
    const response = await api.post(`/api/projects/${projectId}/rollover`, { targetDate });
    return mapTaskColumns(response.data);
}

// ── Avatar Upload ──────────────────────────────────────────
/**
 * Upload an avatar image via multipart/form-data.
 * The backend expects a single `file` field.
 * Returns { url, size } on success.
 */
export async function uploadAvatar(
    formData: FormData,
): Promise<{ url: string; size: number }> {
    // Note: Axios automatically handles FormData and sets Content-Type with boundary
    // Do not explicitly set Content-Type header as it overrides the boundary
    const response = await api.post("/api/uploads/image", formData);
    return response.data as { url: string; size: number };
}

// ── Activity / Audit Logs ───────────────────────────────

export interface ActivityLogEntry {
    id: string;
    action: string;
    userEmail: string;
    timestamp: string;
}

export async function fetchActivity(
    projectId: string,
    page = 1,
    limit = 20,
): Promise<{ logs: ActivityLogEntry[]; total: number }> {
    const response = await api.get(`/api/projects/${projectId}/activity`, {
        params: { page, limit },
    });
    const data = response.data as { logs: unknown[]; total: number };
    const logs: ActivityLogEntry[] = Array.isArray(data.logs)
        ? data.logs.map((entry) => {
            const e = entry as AnyRecord;
            return {
                id: String(e.id ?? crypto.randomUUID()),
                action: String(e.action ?? ""),
                userEmail: String(e.userEmail ?? ""),
                timestamp: String(e.timestamp ?? new Date().toISOString()),
            };
        })
        : [];
    return { logs, total: Number(data.total ?? 0) };
}

export const ProjectService = {
    fetchProjects,
    fetchProjectById,
    createProject,
    updateProject,
    deleteProject,
    addNote,
    deleteNote,
    addMember,
    removeMember,
    updateMemberRole,
    sendInvite,
    acceptInvite,
    declineInvite,
    fetchTasks,
    saveTasks,
    createSingleTask,
    patchTask,
    deleteSingleTask,
    reorderTasks,
    rolloverTasks,
    uploadAvatar,
    fetchActivity,
} as const;

export default ProjectService;
