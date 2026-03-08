import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bold,
    Italic,
    Code,
    List,
    Heading2,
    Quote,
    Plus,
    FileText,
    Trash2,
    ChevronRight,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────
interface NoteBlock {
    id: string;
    type: "text" | "heading" | "code" | "quote" | "list";
    content: string;
    language?: string;
}

interface NoteDoc {
    id: string;
    title: string;
    blocks: NoteBlock[];
    updatedAt: number;
}

// ── Storage helpers ────────────────────────────────────
const STORAGE_KEY = "stride-simple-notes";

function loadNotes(): NoteDoc[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveNotes(notes: NoteDoc[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function newBlock(type: NoteBlock["type"] = "text"): NoteBlock {
    return { id: crypto.randomUUID(), type, content: "", language: type === "code" ? "python" : undefined };
}

function newDoc(): NoteDoc {
    return {
        id: crypto.randomUUID(),
        title: "Untitled",
        blocks: [newBlock()],
        updatedAt: Date.now(),
    };
}

// ── Block toolbar ──────────────────────────────────────
const BLOCK_TYPES: { type: NoteBlock["type"]; icon: React.ElementType; label: string }[] = [
    { type: "text", icon: FileText, label: "Text" },
    { type: "heading", icon: Heading2, label: "Heading" },
    { type: "code", icon: Code, label: "Code" },
    { type: "quote", icon: Quote, label: "Quote" },
    { type: "list", icon: List, label: "List" },
];

const CODE_LANGUAGES = ["python", "javascript", "typescript", "csharp", "java", "html", "css", "sql", "bash"];

// ── Block component ────────────────────────────────────
function NoteBlockEditor({
    block,
    onChange,
    onRemove,
    onTypeChange,
    autoFocus,
}: {
    block: NoteBlock;
    onChange: (content: string) => void;
    onRemove: () => void;
    onTypeChange: (type: NoteBlock["type"]) => void;
    autoFocus?: boolean;
}) {
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (autoFocus && ref.current) ref.current.focus();
    }, [autoFocus]);

    // Auto-resize
    const resize = useCallback(() => {
        const el = ref.current;
        if (el) {
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
        }
    }, []);

    useEffect(resize, [block.content, resize]);

    const baseClass = "w-full bg-transparent outline-none resize-none placeholder:text-muted-foreground/30 text-foreground";

    const typeStyles: Record<NoteBlock["type"], string> = {
        text: "text-sm leading-relaxed",
        heading: "text-lg font-bold tracking-tight",
        code: "font-mono text-xs leading-relaxed bg-foreground/[0.03] dark:bg-white/[0.04] rounded-xl p-3 border border-foreground/[0.05] dark:border-white/[0.06]",
        quote: "text-sm italic border-l-2 border-primary/40 pl-4",
        list: "text-sm leading-loose",
    };

    const placeholders: Record<NoteBlock["type"], string> = {
        text: "Start typing...",
        heading: "Heading",
        code: "// paste code here",
        quote: "Quote...",
        list: "- Item 1\n- Item 2",
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="group relative"
        >
            {/* Type selector — inline row on mobile, absolute left on desktop */}
            <div className="flex md:hidden items-center gap-0.5 mb-1.5 overflow-x-auto scrollbar-thin">
                {BLOCK_TYPES.map(({ type, icon: BIcon, label }) => (
                    <button
                        key={type}
                        onClick={() => onTypeChange(type)}
                        title={label}
                        className={`
              w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0
              ${block.type === type
                                ? "bg-primary/15 text-primary"
                                : "text-muted-foreground/40 hover:text-foreground/60 hover:bg-foreground/[0.04]"}
            `}
                    >
                        <BIcon className="w-3 h-3" />
                    </button>
                ))}
                <button
                    onClick={onRemove}
                    title="Remove block"
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
            <div className="hidden md:flex absolute -left-9 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex-col gap-0.5">
                {BLOCK_TYPES.map(({ type, icon: BIcon, label }) => (
                    <button
                        key={type}
                        onClick={() => onTypeChange(type)}
                        title={label}
                        className={`
              w-6 h-6 rounded-lg flex items-center justify-center transition-colors
              ${block.type === type
                                ? "bg-primary/15 text-primary"
                                : "text-muted-foreground/40 hover:text-foreground/60 hover:bg-foreground/[0.04]"}
            `}
                    >
                        <BIcon className="w-3 h-3" />
                    </button>
                ))}
                <button
                    onClick={onRemove}
                    title="Remove block"
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>

            {/* Language selector for code blocks */}
            {block.type === "code" && (
                <div className="flex items-center gap-1.5 mb-2">
                    <Code className="w-3 h-3 text-muted-foreground/50" />
                    <select
                        value={block.language ?? "python"}
                        onChange={(e) => onChange(block.content)} // trigger re-render
                        className="text-[10px] font-mono bg-transparent text-muted-foreground/60 outline-none cursor-pointer"
                    >
                        {CODE_LANGUAGES.map((lang) => (
                            <option key={lang} value={lang}>
                                {lang}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <textarea
                ref={ref}
                value={block.content}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholders[block.type]}
                rows={1}
                className={`${baseClass} ${typeStyles[block.type]}`}
            />
        </motion.div>
    );
}

// ── Main Notes Component ───────────────────────────────
export default function SimpleNotes() {
    const [docs, setDocs] = useState<NoteDoc[]>(() => {
        const loaded = loadNotes();
        return loaded.length > 0 ? loaded : [newDoc()];
    });
    const [activeId, setActiveId] = useState<string>(docs[0]?.id ?? "");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Persist
    useEffect(() => {
        saveNotes(docs);
    }, [docs]);

    const activeDoc = docs.find((d) => d.id === activeId) ?? docs[0];

    // ── Doc operations ───────────────────────────────────
    const addDoc = () => {
        const doc = newDoc();
        setDocs((prev) => [doc, ...prev]);
        setActiveId(doc.id);
    };

    const deleteDoc = (id: string) => {
        setDocs((prev) => {
            const next = prev.filter((d) => d.id !== id);
            if (next.length === 0) {
                const fresh = newDoc();
                setActiveId(fresh.id);
                return [fresh];
            }
            if (activeId === id) setActiveId(next[0].id);
            return next;
        });
    };

    const updateTitle = (title: string) => {
        setDocs((prev) =>
            prev.map((d) =>
                d.id === activeId ? { ...d, title, updatedAt: Date.now() } : d
            )
        );
    };

    // ── Block operations ─────────────────────────────────
    const updateBlock = (blockId: string, content: string) => {
        setDocs((prev) =>
            prev.map((d) =>
                d.id === activeId
                    ? {
                        ...d,
                        updatedAt: Date.now(),
                        blocks: d.blocks.map((b) =>
                            b.id === blockId ? { ...b, content } : b
                        ),
                    }
                    : d
            )
        );
    };

    const changeBlockType = (blockId: string, type: NoteBlock["type"]) => {
        setDocs((prev) =>
            prev.map((d) =>
                d.id === activeId
                    ? {
                        ...d,
                        updatedAt: Date.now(),
                        blocks: d.blocks.map((b) =>
                            b.id === blockId
                                ? { ...b, type, language: type === "code" ? "python" : undefined }
                                : b
                        ),
                    }
                    : d
            )
        );
    };

    const removeBlock = (blockId: string) => {
        setDocs((prev) =>
            prev.map((d) => {
                if (d.id !== activeId) return d;
                const next = d.blocks.filter((b) => b.id !== blockId);
                return {
                    ...d,
                    updatedAt: Date.now(),
                    blocks: next.length > 0 ? next : [newBlock()],
                };
            })
        );
    };

    const addBlock = () => {
        const block = newBlock();
        setDocs((prev) =>
            prev.map((d) =>
                d.id === activeId
                    ? { ...d, updatedAt: Date.now(), blocks: [...d.blocks, block] }
                    : d
            )
        );
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-20rem)] min-h-[400px]">
            {/* Mobile sidebar toggle */}
            <div className="flex md:hidden items-center gap-2">
                <button
                    onClick={() => setSidebarOpen((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                    {sidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
                    {sidebarOpen ? "Hide docs" : `Docs (${docs.length})`}
                </button>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={addDoc}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                </motion.button>
            </div>

            {/* Sidebar: doc list — hidden on mobile unless toggled */}
            <div
                className={`
          ${sidebarOpen ? "flex" : "hidden"} md:flex
          w-full md:w-56 shrink-0 rounded-2xl overflow-hidden flex-col
          bg-white/40 dark:bg-white/[0.03]
          backdrop-blur-[40px] border-[0.5px] border-black/5 dark:border-white/10
          shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]
          dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.25)]
          max-h-48 md:max-h-none
        `}
            >
                {/* Header */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-black/5 dark:border-white/[0.06]">
                    <span className="text-xs font-bold tracking-tight text-foreground">Documents</span>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={addDoc}
                        className="w-6 h-6 rounded-lg flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </motion.button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto py-1.5 scrollbar-thin">
                    {docs.map((doc) => (
                        <button
                            key={doc.id}
                            onClick={() => setActiveId(doc.id)}
                            className={`
                w-full text-left px-4 py-2 flex items-center gap-2 group/item transition-colors
                ${doc.id === activeId
                                    ? "bg-primary/10 dark:bg-primary/15 text-foreground"
                                    : "text-muted-foreground hover:bg-foreground/[0.03] dark:hover:bg-white/[0.03]"}
              `}
                        >
                            <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${doc.id === activeId ? "rotate-90 text-primary" : ""}`} />
                            <span className="text-xs font-medium truncate flex-1">{doc.title}</span>
                            <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteDoc(doc.id);
                                }}
                                className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover/item:opacity-100 text-muted-foreground/40 hover:text-red-500 transition-all"
                            >
                                <Trash2 className="w-3 h-3" />
                            </motion.button>
                        </button>
                    ))}
                </div>
            </div>

            {/* Editor */}
            {activeDoc && (
                <div
                    className="
            flex-1 rounded-2xl overflow-hidden flex flex-col
            bg-white/40 dark:bg-white/[0.03]
            backdrop-blur-[40px] border-[0.5px] border-black/5 dark:border-white/10
            shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]
            dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.25)]
          "
                >
                    {/* Title */}
                    <div className="px-6 pt-5 pb-3 border-b border-black/5 dark:border-white/[0.06]">
                        <input
                            value={activeDoc.title}
                            onChange={(e) => updateTitle(e.target.value)}
                            placeholder="Document title"
                            className="
                w-full bg-transparent outline-none
                text-xl font-black tracking-tighter text-foreground
                placeholder:text-muted-foreground/30
              "
                        />
                        <p className="text-[10px] text-muted-foreground/40 mt-1">
                            {activeDoc.blocks.length} block{activeDoc.blocks.length !== 1 ? "s" : ""} · Last edited{" "}
                            {new Date(activeDoc.updatedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                    </div>

                    {/* Toolbar */}
                    <div className="px-6 py-2 flex items-center gap-1 border-b border-black/5 dark:border-white/[0.04]">
                        {[
                            { icon: Bold, label: "Bold", type: "text" as const },
                            { icon: Italic, label: "Italic", type: "text" as const },
                            { icon: Heading2, label: "Heading", type: "heading" as const },
                            { icon: Code, label: "Code", type: "code" as const },
                            { icon: Quote, label: "Quote", type: "quote" as const },
                            { icon: List, label: "List", type: "list" as const },
                        ].map(({ icon: TIcon, label }) => (
                            <button
                                key={label}
                                title={label}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-foreground/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                            >
                                <TIcon className="w-3.5 h-3.5" />
                            </button>
                        ))}
                    </div>

                    {/* Blocks */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 ps-4 md:ps-14 scrollbar-thin">
                        <AnimatePresence mode="popLayout">
                            {activeDoc.blocks.map((block, idx) => (
                                <NoteBlockEditor
                                    key={block.id}
                                    block={block}
                                    onChange={(c) => updateBlock(block.id, c)}
                                    onRemove={() => removeBlock(block.id)}
                                    onTypeChange={(t) => changeBlockType(block.id, t)}
                                    autoFocus={idx === activeDoc.blocks.length - 1}
                                />
                            ))}
                        </AnimatePresence>

                        {/* Add block button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={addBlock}
                            className="
                w-full py-3 rounded-xl border border-dashed
                border-foreground/[0.06] dark:border-white/[0.06]
                text-muted-foreground/30 hover:text-muted-foreground/60
                hover:border-primary/30
                flex items-center justify-center gap-2
                transition-all duration-300 text-xs
              "
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add block
                        </motion.button>
                    </div>
                </div>
            )}
        </div>
    );
}
