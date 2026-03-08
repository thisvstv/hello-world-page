// ── useProjects hook ───────────────────────────────────
// Clean Architecture: Components use this hook to access
// project data. They never call ProjectService directly.

import { useProjectData } from "@/components/ProjectDataContext";
import type {
    Project,
    ProjectMember,
    ProjectRole,
} from "@/types";

/**
 * Thin hook that exposes project CRUD + membership operations.
 * Internally delegates to ProjectDataContext (which calls ProjectService).
 *
 * This is the ONLY entry-point components should use for project data.
 */
export function useProjects() {
    const ctx = useProjectData();
    return ctx;
}

/**
 * Convenience: returns a single project by id (or undefined).
 */
export function useProject(id: string | null) {
    const { getProject } = useProjectData();
    return id ? getProject(id) : undefined;
}

export type { Project, ProjectMember, ProjectRole };
