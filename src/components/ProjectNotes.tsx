import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNote, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useProjectData } from "./ProjectDataContext";
import { useAuth } from "./AuthContext";
import { sanitizeInput } from "@/lib/sanitize";

interface ProjectNotesProps {
    projectId: string;
}

export default function ProjectNotes({ projectId }: ProjectNotesProps) {
    const { getProject, addNote, deleteNote } = useProjectData();
    const { user } = useAuth();
    const [expanded, setExpanded] = useState(true);
    const [draft, setDraft] = useState("");

    const project = getProject(projectId);
    const notes = project?.notes ?? [];

    const handleAdd = () => {
        const safeDraft = sanitizeInput(draft);
        if (!safeDraft || !user) return;
        const initials = user.fullName?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "??";
        addNote(projectId, safeDraft, user.fullName || "Unknown", initials);
        setDraft("");
    };

    const timeAgo = (ts: number) => {
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60_000);
        if (mins < 1) return "just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="
        rounded-[2rem] p-6 relative overflow-hidden
        bg-white/40 dark:bg-white/[0.06]
        backdrop-blur-[40px] border-[0.5px] border-black/5 dark:border-white/20
        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08),0_8px_24px_-8px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.6)]
        dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5),0_0_30px_rgba(99,102,241,0.05),inset_0_1px_1px_rgba(255,255,255,0.06)]
      "
        >
            {/* Header */}
            <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-2 w-full text-left mb-4"
            >
                <div className="w-8 h-8 rounded-full bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                    <StickyNote className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground flex-1">
                    Notes ({notes.length})
                </span>
                {expanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="overflow-hidden"
                    >
                        {/* Compose */}
                        <div className="flex gap-2 mb-4">
                            <textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAdd();
                                    }
                                }}
                                placeholder="Add a note… (Enter to send)"
                                rows={2}
                                className="
                  flex-1 rounded-xl px-4 py-2.5 text-xs text-foreground
                  placeholder:text-muted-foreground/50
                  bg-foreground/[0.03] dark:bg-white/[0.04]
                  backdrop-blur-xl ring-1 ring-white/10
                  outline-none focus:shadow-neon transition-premium resize-none
                "
                            />
                            <button
                                onClick={handleAdd}
                                disabled={!draft.trim()}
                                className="
                  w-10 h-10 self-end rounded-xl bg-primary/15 text-primary
                  flex items-center justify-center
                  hover:bg-primary/25 transition-colors
                  disabled:opacity-30 disabled:pointer-events-none
                "
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Notes list */}
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            <AnimatePresence>
                                {notes.length === 0 && (
                                    <p className="text-[10px] text-muted-foreground/50 text-center py-4">
                                        No notes yet. Be the first to add one!
                                    </p>
                                )}
                                {notes.map((note) => (
                                    <motion.div
                                        key={note.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: 30 }}
                                        className="
                      group flex gap-3 px-4 py-3 rounded-xl
                      bg-foreground/[0.02] dark:bg-white/[0.03]
                      ring-1 ring-white/10 backdrop-blur-xl
                    "
                                    >
                                        <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-[8px] font-bold text-primary">{note.authorInitials}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[10px] font-semibold text-foreground stealth-blur">{note.authorName}</span>
                                                <span className="text-[9px] text-muted-foreground/60">{timeAgo(note.createdAt)}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap stealth-blur">{note.content}</p>
                                        </div>
                                        <button
                                            onClick={() => deleteNote(projectId, note.id)}
                                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0 active:scale-[0.85]"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
