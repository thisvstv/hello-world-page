// ── useTasks hook ──────────────────────────────────────
// Clean Architecture: Isolates task persistence from the UI.
// Components call this hook instead of ProjectService directly.
//
// Multi-week support: a master store (Map keyed by "YYYY-MM-DD")
// holds ALL day-columns across every navigated week.  Only the
// 7 columns for the current week are exposed via `columns`.
//
// ⚡ ATOMIC DELTA SYNC:
// State updates are instant (setColumns).  Individual mutations
// (toggle, add, delete, reorder, patch) call lightweight PATCH
// endpoints instead of a heavy full-board PUT.
// The legacy full-sync (debouncedSave) is kept only as a safety
// net for week-navigation flush and unmount.

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { ProjectService } from "@/api/projectService";
import type { DayColumn, Task } from "@/types";
import { toLocalDateStr } from "@/lib/taskUtils";

/**
 * Hook that owns the task-board state for a given project.
 *
 * `seedWeek()` returns 7 empty DayColumn[] for the week the user
 * is currently viewing.  When its identity changes (week navigation),
 * the hook merges the visible columns back into the store and extracts
 * (or seeds) the new week's columns.
 *
 * Returns:
 *   - columns:        The 7 DayColumn[] for the current week
 *   - setColumns:     Standard setState for direct updates (used by drag/drop handlers)
 *   - debouncedSave:  Fire-and-forget debounced save (700ms). Call after every local mutation.
 *   - saveNow:        Flush the debounce and persist immediately.
 *   - getAllColumns:   Returns every DayColumn across all weeks (for progress calc)
 */
export function useTasks(
    projectId: string | undefined,
    seedWeek: () => DayColumn[],
) {
    // Master store: every DayColumn ever loaded or created, keyed by date string
    const storeRef = useRef<Map<string, DayColumn>>(new Map());

    // The 7 visible columns for the current week
    const [columns, _setColumns] = useState<DayColumn[]>(() => seedWeek());

    // Wrapped setter that bumps version for race condition guard
    const setColumns = useCallback((updater: DayColumn[] | ((prev: DayColumn[]) => DayColumn[])) => {
        localMutationVersionRef.current++;
        _setColumns(updater);
    }, []);

    const activeProjectRef = useRef<string | undefined>(projectId);
    const hasHydratedRef = useRef(false);
    const projectIdRef = useRef(projectId);
    const columnsRef = useRef(columns);
    columnsRef.current = columns;
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inflightRef = useRef<Promise<void> | null>(null);
    // Race condition guard: bumped on every local mutation so that a
    // stale initial fetch won't overwrite optimistic changes.
    const localMutationVersionRef = useRef(0);

    useEffect(() => {
        projectIdRef.current = projectId;
    }, [projectId]);

    // ── Core persist (not debounced — used internally) ──
    const persistNow = useCallback(async () => {
        if (!projectIdRef.current || !hasHydratedRef.current) return;
        // Sync latest visible columns into store
        for (const col of columnsRef.current) {
            storeRef.current.set(toLocalDateStr(col.date), col);
        }
        const allColumns = Array.from(storeRef.current.values())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        try {
            await ProjectService.saveTasks(projectIdRef.current, allColumns);
        } catch (err) {
            console.error("[useTasks] save failed:", err);
            toast.error("Failed to save tasks. Please try again.");
            throw err;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Uses only refs — no stale-closure risk

    // ── Debounced save (700ms — batches rapid toggles) ──
    const debouncedSave = useCallback(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            debounceTimerRef.current = null;
            // Chain after any in-flight save to avoid overlapping calls
            const run = async () => {
                if (inflightRef.current) await inflightRef.current.catch(() => { });
                await persistNow();
            };
            inflightRef.current = run().finally(() => { inflightRef.current = null; });
        }, 700);
    }, [persistNow]);

    // ── Immediate save (flushes debounce) — for page unload, week nav, etc. ──
    const saveNow = useCallback(async () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
        if (inflightRef.current) await inflightRef.current.catch(() => { });
        await persistNow();
    }, [persistNow]);

    // ── Get ALL columns across every week (for whole-project progress) ──
    const getAllColumns = useCallback((): DayColumn[] => {
        // Sync latest visible columns into store
        for (const col of columnsRef.current) {
            storeRef.current.set(toLocalDateStr(col.date), col);
        }
        return Array.from(storeRef.current.values());
    }, []);

    // ── Load from backend on project change ──
    useEffect(() => {
        let cancelled = false;

        if (!projectId) {
            activeProjectRef.current = undefined;
            hasHydratedRef.current = false;
            storeRef.current.clear();
            _setColumns(seedWeek());
            return;
        }

        if (projectId === activeProjectRef.current && hasHydratedRef.current) {
            return; // same project, already loaded
        }

        activeProjectRef.current = projectId;
        hasHydratedRef.current = false;
        storeRef.current.clear();
        // Reset mutation version so the initial fetch always applies
        localMutationVersionRef.current = 0;

        ProjectService.fetchTasks(projectId)
            .then((saved) => {
                if (cancelled) return;
                // The initial fetch ALWAYS applies — we just reset the version
                // above so any mutations that happened during fetch (e.g. from
                // optimisticSave progress recalc) won't block hydration.
                // Populate master store with ALL saved columns
                if (saved) {
                    for (const col of saved) {
                        storeRef.current.set(toLocalDateStr(col.date), col);
                    }
                }
                // Extract current week from store (fall back to seed for missing dates)
                const seed = seedWeek();
                _setColumns(seed.map(col => {
                    const key = toLocalDateStr(col.date);
                    return storeRef.current.get(key) ?? col;
                }));
                hasHydratedRef.current = true;
            })
            .catch((err) => {
                if (cancelled) return;
                console.error("[useTasks] fetch failed:", err);
                toast.error("Failed to load tasks. Please refresh.");
                _setColumns(seedWeek());
                hasHydratedRef.current = true;
            });

        return () => { cancelled = true; };
        // Only re-fetch on project change, NOT on week navigation
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    // ── When week changes (seedWeek identity), flush + extract from store ──
    const prevSeedRef = useRef(seedWeek);
    useEffect(() => {
        if (prevSeedRef.current === seedWeek) return; // identity unchanged
        prevSeedRef.current = seedWeek;
        if (!hasHydratedRef.current) return; // wait for initial load

        // Flush any pending debounced save before switching weeks
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
            persistNow().catch(() => { });
        }

        // Merge current columns into store, then extract the new week
        // Use _setColumns (raw) to avoid bumping localMutationVersionRef
        // since week switching is not a user data mutation
        _setColumns(prev => {
            for (const col of prev) {
                storeRef.current.set(toLocalDateStr(col.date), col);
            }
            const seed = seedWeek();
            return seed.map(col => {
                const key = toLocalDateStr(col.date);
                return storeRef.current.get(key) ?? col;
            });
        });
    }, [seedWeek, persistNow]);

    // ── Cleanup debounce timer on unmount ──
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                // Fire one last save on unmount
                persistNow().catch(() => { });
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Refetch: re-load from backend and hydrate store + visible columns ──
    // Used after server-side operations (e.g. rollover) that change task data
    // without going through the local state.
    const refetch = useCallback(async () => {
        if (!projectIdRef.current) return;
        const saved = await ProjectService.fetchTasks(projectIdRef.current);
        if (!saved) return;
        storeRef.current.clear();
        for (const col of saved) {
            storeRef.current.set(toLocalDateStr(col.date), col);
        }
        const seed = seedWeek();
        _setColumns(seed.map(col => {
            const key = toLocalDateStr(col.date);
            return storeRef.current.get(key) ?? col;
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seedWeek]);

    // ═════════════════════════════════════════════════════════
    //  ATOMIC DELTA OPERATIONS
    //  Each one: updates local state INSTANTLY, then fires a
    //  lightweight API call in the background (no debounce needed).
    // ═════════════════════════════════════════════════════════

    /** Add a single task — optimistic local insert + POST */
    const addTaskAtomic = useCallback((dayIdx: number, task: Task) => {
        const pid = projectIdRef.current;

        // Optimistic local insert
        setColumns((prev) => {
            const next = [...prev];
            next[dayIdx] = {
                ...next[dayIdx],
                tasks: [...next[dayIdx].tasks, task],
            };
            return next;
        });

        // Background API call — non-blocking, fire-and-forget with error toast
        if (pid) {
            // Get the date from the column at dayIdx
            const colDate = columnsRef.current[dayIdx]?.date ?? new Date();
            ProjectService.createSingleTask(pid, task, colDate).catch((err) => {
                console.error("[useTasks] createSingleTask failed:", err);
                toast.error("Failed to save new task. Please refresh.");
            });
        }
    }, [setColumns]);

    /** Toggle done — optimistic + PATCH */
    const toggleTaskAtomic = useCallback((taskId: string) => {
        const pid = projectIdRef.current;
        let newDone = false;

        setColumns((prev) =>
            prev.map((col) => ({
                ...col,
                tasks: col.tasks.map((t) => {
                    if (t.id === taskId) {
                        newDone = !t.done;
                        return { ...t, done: newDone };
                    }
                    return t;
                }),
            }))
        );

        if (pid) {
            ProjectService.patchTask(pid, taskId, { done: newDone }).catch((err) => {
                console.error("[useTasks] toggle failed:", err);
                toast.error("Failed to save change. Please refresh.");
            });
        }
    }, [setColumns]);

    /** Update arbitrary task fields — optimistic + PATCH */
    const patchTaskAtomic = useCallback((taskId: string, updates: Partial<Task>) => {
        const pid = projectIdRef.current;

        setColumns((prev) =>
            prev.map((col) => ({
                ...col,
                tasks: col.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
            }))
        );

        if (pid) {
            // Transform frontend Task shape to backend PATCH shape
            const payload: Record<string, unknown> = {};
            if (updates.title !== undefined) payload.title = updates.title;
            if (updates.description !== undefined) payload.description = updates.description;
            if (updates.done !== undefined) payload.done = updates.done;
            if (updates.rolledOver !== undefined) payload.rolledOver = updates.rolledOver;
            if (updates.priority !== undefined) payload.priority = updates.priority ?? null;
            if (updates.dueDate !== undefined) payload.dueDate = updates.dueDate ? updates.dueDate.toISOString() : null;
            if (updates.tags !== undefined) payload.tags = updates.tags;
            if (updates.assignees !== undefined) payload.assignees = updates.assignees;
            if (updates.subtasks !== undefined) {
                payload.subtasks = updates.subtasks.map((s, i) => ({
                    id: s.id,
                    title: s.label,
                    done: s.done,
                    assignee: s.assigneeId,
                    sortOrder: i,
                }));
            }

            if (Object.keys(payload).length > 0) {
                ProjectService.patchTask(pid, taskId, payload).catch((err) => {
                    console.error("[useTasks] patchTask failed:", err);
                    toast.error("Failed to save change. Please refresh.");
                });
            }
        }
    }, [setColumns]);

    /** Delete a single task — optimistic + DELETE */
    const deleteTaskAtomic = useCallback((taskId: string) => {
        const pid = projectIdRef.current;

        setColumns((prev) =>
            prev.map((col) => ({
                ...col,
                tasks: col.tasks.filter((t) => t.id !== taskId),
            }))
        );

        if (pid) {
            ProjectService.deleteSingleTask(pid, taskId).catch((err) => {
                console.error("[useTasks] deleteTask failed:", err);
                toast.error("Failed to delete task. Please refresh.");
            });
        }
    }, [setColumns]);

    /** Reorder tasks after DnD — optimistic local state already applied by caller.
     *  This fires the lightweight PATCH /reorder endpoint with the final positions. */
    const reorderAtomic = useCallback((affectedTasks: { id: string; sortOrder: number; columnDate: string }[]) => {
        const pid = projectIdRef.current;
        if (pid && affectedTasks.length > 0) {
            ProjectService.reorderTasks(pid, affectedTasks).catch((err) => {
                console.error("[useTasks] reorderTasks failed:", err);
                toast.error("Failed to save reorder. Please refresh.");
            });
        }
    }, []);

    return {
        columns, setColumns,
        // Legacy full-sync (kept for week-nav flush / edge cases)
        debouncedSave, saveNow, getAllColumns,
        refetch,
        // Atomic delta operations
        addTaskAtomic, toggleTaskAtomic, patchTaskAtomic, deleteTaskAtomic, reorderAtomic,
    } as const;
}
