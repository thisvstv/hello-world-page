import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthContext";
import { ProjectService } from "../api/projectService";

// ── Types (canonical source: @/types) ──────────────────
import type {
    ProjectRole,
    ProjectMode,
    ProjectViewMode,
    ProjectStatus,
    InviteStatus,
    ProjectMember,
    ProjectInvite,
    ProjectNote,
    ProjectTag,
    Project,
    AuditLogEntry,
} from "@/types";

// Re-export for backward compatibility — consumers can still
// import types from this module without changing their code.
export type {
    ProjectRole,
    ProjectMode,
    ProjectViewMode,
    ProjectStatus,
    InviteStatus,
    ProjectMember,
    ProjectInvite,
    ProjectNote,
    ProjectTag,
    Project,
    AuditLogEntry,
};

// Initial sync load for first render (API-first)
function loadProjectsSync(): Project[] {
    return [];
}

// ── Context ────────────────────────────────────────────
interface ProjectDataContextType {
    projects: Project[];
    /** True once the initial GET /api/projects has resolved (even if 0 results). */
    projectsLoaded: boolean;
    getProject: (id: string) => Project | undefined;
    addProject: (p: Omit<Project, "id" | "createdAt" | "notes" | "invites">) => Project | null;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    addNote: (projectId: string, content: string, authorName: string, authorInitials: string) => void;
    deleteNote: (projectId: string, noteId: string) => void;
    addMember: (projectId: string, member: ProjectMember) => void;
    removeMember: (projectId: string, memberId: string) => void;
    updateMemberRole: (projectId: string, memberId: string, role: ProjectRole) => void;
    sendInvite: (projectId: string, email: string, role: ProjectRole, invitedBy: string) => void;
    acceptInvite: (projectId: string, inviteId: string, name: string, initials: string) => void;
    declineInvite: (projectId: string, inviteId: string) => void;
    getMyRole: (projectId: string, userEmail: string) => ProjectRole | null;
    logProjectAction: (projectId: string, action: string, userEmail: string) => void;
    getAuditLogs: (projectId: string) => AuditLogEntry[];
    resetProjects: () => void;
}

const ProjectDataContext = createContext<ProjectDataContextType | null>(null);

export function ProjectDataProvider({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [projects, setProjects] = useState<Project[]>(loadProjectsSync);
    const [projectsLoaded, setProjectsLoaded] = useState(false);

    // ── Race condition guard ───────────────────────────
    // Every optimistic mutation bumps the version. After the
    // initial hydration, subsequent re-fetches only apply their
    // result if the version hasn't changed, preventing stale data
    // from overwriting in-flight optimistic state.
    const optimisticVersionRef = useRef(0);
    const hasHydratedRef = useRef(false);

    // Hydrate from API once auth is ready.
    // Waits for AuthContext to finish its silent refresh so the
    // access token is available before hitting GET /api/projects.
    useEffect(() => {
        // Don't fetch while auth is still checking the refresh cookie
        if (authLoading) return;
        // If there's no authenticated user, clear projects
        if (!user) {
            setProjects([]);
            setProjectsLoaded(false);
            hasHydratedRef.current = false;
            return;
        }

        let cancelled = false;
        const versionAtFetchStart = optimisticVersionRef.current;

        ProjectService.fetchProjects().then((data) => {
            if (cancelled) return;

            // The INITIAL fetch always applies — even if optimistic updates
            // happened while it was in flight. This prevents the refresh bug
            // where projects disappear because optimisticSave() bumped the
            // version before the first fetch resolved.
            const isInitialLoad = !hasHydratedRef.current;

            if (!isInitialLoad && optimisticVersionRef.current !== versionAtFetchStart) {
                // Subsequent re-fetch overtaken by optimistic updates — skip
                setProjectsLoaded(true);
                return;
            }

            // Merge server data: for initial load always apply; for re-fetches
            // keep any optimistic progress values that are more up-to-date
            if (isInitialLoad) {
                setProjects(data);
            } else {
                setProjects(data);
            }
            hasHydratedRef.current = true;
            setProjectsLoaded(true);
        }).catch((err) => {
            if (!cancelled) {
                setProjectsLoaded(true); // mark loaded even on error so UI doesn't wait forever
                if (import.meta.env.DEV) {
                    console.error('[ProjectDataContext] fetch failed:', err);
                }
            }
        });
        return () => { cancelled = true; };
    }, [authLoading, user]);

    // Optimistic update: apply to local state immediately, fire service call in background
    const optimistic = useCallback(
        (fn: (prev: Project[]) => Project[], sideEffect?: () => Promise<unknown>) => {
            // Bump version so any in-flight initial fetch won't overwrite
            optimisticVersionRef.current++;

            // Capture previous state for rollback
            let snapshot: Project[] | null = null;
            setProjects((prev) => {
                snapshot = prev;
                return fn(prev);
            });
            sideEffect?.().catch((err: unknown) => {
                // Rollback on failure and notify user
                if (snapshot) setProjects(snapshot);
                // Extract the actual backend message (e.g. "Maximum of 4 projects reached")
                const axiosErr = err as { response?: { data?: { message?: string } } };
                const message = axiosErr?.response?.data?.message || "Failed to save changes. Reverted to previous state.";
                toast.error(message);
                if (import.meta.env.DEV) console.error("Service error:", err);
            });
        },
        [],
    );

    const getProject = useCallback(
        (id: string) => projects.find((p) => p.id === id),
        [projects]
    );

    const addProject = useCallback(
        (p: Omit<Project, "id" | "createdAt" | "notes" | "invites">) => {
            // ── Bulletproof limit enforcement ──────────────
            const MAX_TOTAL_PROJECTS = 4;
            if (projects.length >= MAX_TOTAL_PROJECTS) {
                toast.error(`Project limit reached (${MAX_TOTAL_PROJECTS} max). Delete an existing project first.`);
                return null;
            }

            const tempId = `proj-${crypto.randomUUID().slice(0, 8)}`;
            const ownerEmail = p.members.find((m) => m.role === "owner")?.email ?? "unknown";
            const logEntry: AuditLogEntry = {
                id: `log-${crypto.randomUUID().slice(0, 8)}`,
                action: "Created project",
                userEmail: ownerEmail,
                timestamp: new Date().toISOString(),
            };
            const newProj: Project = {
                ...p,
                id: tempId,
                createdAt: Date.now(),
                notes: [],
                invites: [],
                auditLogs: [logEntry],
            };
            optimistic(
                (prev) => [...prev, newProj],
                () => ProjectService.createProject(p).then((created) => {
                    setProjects((prev) =>
                        prev.map((proj) => (proj.id === tempId ? { ...proj, ...created } : proj))
                    );
                }),
            );
            return newProj;
        },
        [optimistic, projects.length]
    );

    // ── Allowed mutable fields for in-memory updates ────
    // Mirrors the server-side allow-list to prevent prototype
    // pollution from DevTools-crafted payloads.
    const ALLOWED_UPDATE_KEYS: ReadonlySet<string> = useMemo(
        () => new Set([
            "name", "description", "iconName", "progress", "status",
            "color", "mode", "viewMode", "members", "invites", "notes", "tags",
            "estimatedDays", "auditLogs",
        ]),
        []
    );

    const updateProject = useCallback(
        (id: string, updates: Partial<Project>) => {
            // Strip disallowed / dangerous keys before spreading
            const safe: Partial<Project> = {};
            for (const key of Object.keys(updates)) {
                if (ALLOWED_UPDATE_KEYS.has(key)) {
                    (safe as Record<string, unknown>)[key] = (updates as Record<string, unknown>)[key];
                }
            }
            optimistic(
                (prev) => prev.map((p) => (p.id === id ? { ...p, ...safe } : p)),
                () => ProjectService.updateProject(id, safe),
            );
        },
        [optimistic, ALLOWED_UPDATE_KEYS]
    );

    const deleteProject = useCallback(
        (id: string) => {
            optimistic(
                (prev) => prev.filter((p) => p.id !== id),
                () => ProjectService.deleteProject(id),
            );
        },
        [optimistic]
    );

    const addNote = useCallback(
        (projectId: string, content: string, authorName: string, authorInitials: string) => {
            const tempId = `note-${crypto.randomUUID().slice(0, 8)}`;
            const note: ProjectNote = {
                id: tempId,
                content,
                authorName,
                authorInitials,
                createdAt: Date.now(),
            };
            const logEntry: AuditLogEntry = {
                id: `log-${crypto.randomUUID().slice(0, 8)}`,
                action: `Added note: "${content.slice(0, 40)}${content.length > 40 ? '…' : ''}"`,
                userEmail: authorName,
                timestamp: new Date().toISOString(),
            };
            optimistic(
                (prev) => prev.map((p) => p.id === projectId ? { ...p, notes: [note, ...p.notes], auditLogs: [logEntry, ...(p.auditLogs ?? [])] } : p),
                () => ProjectService.addNote(projectId, content, authorName, authorInitials),
            );
        },
        [optimistic]
    );

    const deleteNote = useCallback(
        (projectId: string, noteId: string) => {
            optimistic(
                (prev) => prev.map((p) => p.id === projectId ? { ...p, notes: p.notes.filter((n) => n.id !== noteId) } : p),
                () => ProjectService.deleteNote(projectId, noteId),
            );
        },
        [optimistic]
    );

    const addMember = useCallback(
        (projectId: string, member: ProjectMember) => {
            const logEntry: AuditLogEntry = {
                id: `log-${crypto.randomUUID().slice(0, 8)}`,
                action: `Added member: ${member.name} (${member.role})`,
                userEmail: member.email,
                timestamp: new Date().toISOString(),
            };
            optimistic(
                (prev) => prev.map((p) => p.id === projectId ? { ...p, members: [...p.members, member], auditLogs: [logEntry, ...(p.auditLogs ?? [])] } : p),
                () => ProjectService.addMember(projectId, member),
            );
        },
        [optimistic]
    );

    const removeMember = useCallback(
        (projectId: string, memberId: string) => {
            optimistic(
                (prev) => prev.map((p) => {
                    if (p.id !== projectId) return p;
                    const member = p.members.find((m) => m.id === memberId);
                    if (member?.role === "owner" && p.members.filter((m) => m.role === "owner").length <= 1) return p;
                    const logEntry: AuditLogEntry = {
                        id: `log-${crypto.randomUUID().slice(0, 8)}`,
                        action: `Removed member: ${member?.name ?? memberId}`,
                        userEmail: member?.email ?? "unknown",
                        timestamp: new Date().toISOString(),
                    };
                    return { ...p, members: p.members.filter((m) => m.id !== memberId), auditLogs: [logEntry, ...(p.auditLogs ?? [])] };
                }),
                () => ProjectService.removeMember(projectId, memberId),
            );
        },
        [optimistic]
    );

    const updateMemberRole = useCallback(
        (projectId: string, memberId: string, role: ProjectRole) => {
            optimistic(
                (prev) => prev.map((p) =>
                    p.id === projectId
                        ? { ...p, members: p.members.map((m) => (m.id === memberId ? { ...m, role } : m)) }
                        : p
                ),
                () => ProjectService.updateMemberRole(projectId, memberId, role),
            );
        },
        [optimistic]
    );

    const sendInvite = useCallback(
        (projectId: string, email: string, role: ProjectRole, invitedBy: string) => {
            const localPart = email.split("@")[0] ?? "member";
            const safeName = localPart
                .split(/[._-]+/)
                .filter(Boolean)
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" ") || "New Member";
            const initials = safeName
                .split(" ")
                .filter(Boolean)
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 4);
            const tempMember: ProjectMember = {
                id: `member-${crypto.randomUUID().slice(0, 8)}`,
                initials,
                name: safeName,
                email,
                color: "bg-indigo-500",
                role: role === "owner" ? "admin" : role,
            };
            const logEntry: AuditLogEntry = {
                id: `log-${crypto.randomUUID().slice(0, 8)}`,
                action: `Invited ${email} as ${role}`,
                userEmail: invitedBy,
                timestamp: new Date().toISOString(),
            };
            optimistic(
                (prev) => prev.map((p) => p.id === projectId ? { ...p, members: [...p.members, tempMember], auditLogs: [logEntry, ...(p.auditLogs ?? [])] } : p),
                () => ProjectService.sendInvite(projectId, email, role, invitedBy),
            );
        },
        [optimistic]
    );

    const acceptInvite = useCallback(
        (projectId: string, inviteId: string, name: string, initials: string) => {
            optimistic(
                (prev) => prev,
                () => ProjectService.acceptInvite(projectId, inviteId, name, initials),
            );
        },
        [optimistic]
    );

    const declineInvite = useCallback(
        (projectId: string, inviteId: string) => {
            optimistic(
                (prev) => prev,
                () => ProjectService.declineInvite(projectId, inviteId),
            );
        },
        [optimistic]
    );

    const getMyRole = useCallback(
        (projectId: string, userEmail: string): ProjectRole | null => {
            const proj = projects.find((p) => p.id === projectId);
            if (!proj) return null;
            const member = proj.members.find((m) => m.email === userEmail);
            return member?.role ?? null;
        },
        [projects]
    );

    // ── Audit log helpers ──────────────────────────────
    const logProjectAction = useCallback(
        (projectId: string, action: string, userEmail: string) => {
            const entry: AuditLogEntry = {
                id: `log-${crypto.randomUUID().slice(0, 8)}`,
                action,
                userEmail,
                timestamp: new Date().toISOString(),
            };
            setProjects((prev) =>
                prev.map((p) =>
                    p.id === projectId
                        ? { ...p, auditLogs: [entry, ...(p.auditLogs ?? [])] }
                        : p
                ),
            );
        },
        [],
    );

    const getAuditLogs = useCallback(
        (projectId: string): AuditLogEntry[] => {
            const proj = projects.find((p) => p.id === projectId);
            return proj?.auditLogs ?? [];
        },
        [projects],
    );

    // Memoize context value to prevent unnecessary consumer re-renders
    const resetProjects = useCallback(() => setProjects([]), []);

    const contextValue = useMemo<ProjectDataContextType>(
        () => ({
            projects,
            projectsLoaded,
            getProject,
            addProject,
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
            getMyRole,
            logProjectAction,
            getAuditLogs,
            resetProjects,
        }),
        [
            projects,
            projectsLoaded,
            getProject,
            addProject,
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
            getMyRole,
            logProjectAction,
            getAuditLogs,
            resetProjects,
        ]
    );

    return (
        <ProjectDataContext.Provider value={contextValue}>
            {children}
        </ProjectDataContext.Provider>
    );
}

export function useProjectData() {
    const ctx = useContext(ProjectDataContext);
    if (!ctx) throw new Error("useProjectData must be used within ProjectDataProvider");
    return ctx;
}
