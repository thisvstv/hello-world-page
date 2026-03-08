import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, UserCircle, Trash2, ChevronRight } from "lucide-react";
import type { ProjectMember as ProjectMemberType } from "./ProjectDataContext";

// ── Types ──────────────────────────────────────────────
export type TagOption = { label: string; color: string };
type MemberOption = { initials: string; name: string; color: string };

export interface ContextMenuAction {
  changeTag: (taskId: string, tag: TagOption) => void;
  changeAssignee: (taskId: string, assignee: string) => void;
  deleteTask: (taskId: string) => void;
}

interface TaskContextMenuProps {
  taskId: string | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  actions: ContextMenuAction;
  isSolo?: boolean;
  projectMembers?: ProjectMemberType[];
  restrictActions?: boolean;
  availableTags?: TagOption[];
}

export const AVAILABLE_TAGS: TagOption[] = [
  { label: "Design", color: "indigo" },
  { label: "Backend", color: "emerald" },
  { label: "Feature", color: "sky" },
  { label: "UX", color: "amber" },
  { label: "Priority", color: "rose" },
  { label: "Security", color: "rose" },
];

const TEAM_MEMBERS: MemberOption[] = [
  { initials: "AK", name: "Alex Kim", color: "bg-indigo-500" },
  { initials: "MJ", name: "Maya Jones", color: "bg-violet-500" },
  { initials: "RL", name: "Ryan Lee", color: "bg-sky-500" },
  { initials: "SC", name: "Sam Chen", color: "bg-emerald-500" },
  { initials: "TW", name: "Taylor Wu", color: "bg-amber-500" },
];

const TAG_GRADIENT: Record<string, string> = {
  indigo: "from-indigo-400 to-violet-400",
  rose: "from-rose-400 to-pink-400",
  emerald: "from-emerald-400 to-teal-400",
  amber: "from-amber-400 to-yellow-400",
  sky: "from-sky-400 to-cyan-400",
};

export { TEAM_MEMBERS };

export default function TaskContextMenu({
  taskId,
  position,
  onClose,
  actions,
  isSolo = false,
  projectMembers = [],
  restrictActions = false,
  availableTags,
}: TaskContextMenuProps) {
  const tagList = availableTags && availableTags.length > 0 ? availableTags : AVAILABLE_TAGS;
  const [subMenu, setSubMenu] = useState<"tags" | "assignee" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!taskId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [taskId, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!taskId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [taskId, onClose]);

  const isOpen = !!(taskId && position);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{
            position: "fixed",
            left: position!.x,
            top: position!.y,
            transformOrigin: "top left",
            zIndex: 100,
          }}
          className="
            min-w-[200px] py-1.5 rounded-2xl overflow-hidden
            bg-white/95 dark:bg-slate-950/95
            md:bg-white/70 md:dark:bg-black/70
            backdrop-blur-[48px]
            ring-1 ring-white/20 dark:ring-white/10
            shadow-sm md:shadow-[0_16px_64px_-12px_rgba(0,0,0,0.15),0_8px_24px_-4px_rgba(0,0,0,0.08)]
            dark:shadow-sm md:dark:shadow-[0_16px_64px_-12px_rgba(0,0,0,0.6),0_8px_24px_-4px_rgba(0,0,0,0.4)]
          "
        >
          {/* Change Tag — hidden when restricted */}
          {!restrictActions && (
            <div className="relative">
              <button
                onMouseEnter={() => setSubMenu("tags")}
                onClick={() => setSubMenu((prev) => prev === "tags" ? null : "tags")}
                className="
                w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-foreground
                hover:bg-foreground/[0.05] dark:hover:bg-white/[0.06]
                transition-colors duration-150
              "
              >
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="flex-1 text-left">Change Tag</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              </button>

              {/* Tags sub-menu */}
              <AnimatePresence>
                {subMenu === "tags" && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    onMouseLeave={() => setSubMenu(null)}
                    className="
                    absolute left-full top-0 ml-1 min-w-[160px] py-1.5 rounded-2xl
                    bg-white/70 dark:bg-black/70
                    backdrop-blur-[48px]
                    ring-1 ring-white/20 dark:ring-white/10
                    shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)]
                    dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5)]
                  "
                  >
                    {tagList.map((tag) => (
                      <button
                        key={tag.label}
                        onClick={() => { actions.changeTag(taskId!, tag); onClose(); }}
                        className="
                        w-full flex items-center gap-2.5 px-4 py-2 text-xs text-foreground
                        hover:bg-foreground/[0.05] dark:hover:bg-white/[0.06]
                        transition-colors duration-150
                      "
                      >
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${TAG_GRADIENT[tag.color] || TAG_GRADIENT.indigo}`} />
                        {tag.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Assignee — hidden for solo projects and when restricted */}
          {!isSolo && !restrictActions && (
            <div className="relative">
              <button
                onMouseEnter={() => setSubMenu("assignee")}
                onClick={() => setSubMenu((prev) => prev === "assignee" ? null : "assignee")}
                className="
                w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-foreground
                hover:bg-foreground/[0.05] dark:hover:bg-white/[0.06]
                transition-colors duration-150
              "
              >
                <UserCircle className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="flex-1 text-left">Assignee</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              </button>

              {/* Assignee sub-menu */}
              <AnimatePresence>
                {subMenu === "assignee" && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    onMouseLeave={() => setSubMenu(null)}
                    className="
                    absolute left-full top-0 ml-1 min-w-[180px] py-1.5 rounded-2xl
                    bg-white/70 dark:bg-black/70
                    backdrop-blur-[48px]
                    ring-1 ring-white/20 dark:ring-white/10
                    shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)]
                    dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5)]
                  "
                  >
                    {(projectMembers.length > 0
                      ? projectMembers.map((m) => ({ initials: m.initials, name: m.name, color: m.color }))
                      : TEAM_MEMBERS
                    ).map((member) => (
                      <button
                        key={member.initials}
                        onClick={() => { actions.changeAssignee(taskId!, member.initials); onClose(); }}
                        className="
                        w-full flex items-center gap-2.5 px-4 py-2 text-xs text-foreground
                        hover:bg-foreground/[0.05] dark:hover:bg-white/[0.06]
                        transition-colors duration-150
                      "
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${member.color}`}>
                          {member.initials}
                        </div>
                        {member.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Divider */}
          {!restrictActions && <div className="my-1.5 mx-3 h-px bg-foreground/[0.06] dark:bg-white/[0.06]" />}

          {/* Delete — hidden when restricted */}
          {!restrictActions && (
            <button
              onMouseEnter={() => setSubMenu(null)}
              onClick={() => { actions.deleteTask(taskId!); onClose(); }}
              className="
              w-full flex items-center gap-2.5 px-4 py-2.5 text-xs
              text-destructive/80 hover:text-destructive
              hover:bg-destructive/[0.06] dark:hover:bg-destructive/[0.08]
              hover:shadow-[inset_0_0_20px_rgba(239,68,68,0.06)]
              transition-all duration-150
            "
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Task
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
