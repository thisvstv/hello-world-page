import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    StickyNote, Plus, Trash2, Search, Pin, PinOff,
    FileText, FolderKanban, Clock, Sparkles, X, Check,
    Bold, Italic, Underline, Strikethrough, Code2, Quote, Palette,
    Heading1, Heading2, Type, Link2, ImagePlus, ALargeSmall,
} from "lucide-react";
import { computePosition, flip, shift, offset } from "@floating-ui/dom";
import { useAuth } from "@/components/AuthContext";
import { useProjectData } from "@/components/ProjectDataContext";
import { useIsMobile } from "@/hooks/use-mobile";
import ImageControls from "@/components/ImageControls";
import { sanitizeInput, sanitizeHtml } from "@/lib/sanitize";
import type { StandaloneNote } from "@/types";

/* ─── Constants ────────────────────────────────────── */
const STORAGE_KEY = "stride_standalone_notes";
const NOTE_COLORS = [
    { id: "none", label: "None", class: "" },
    { id: "blue", label: "Blue", class: "border-l-blue-500" },
    { id: "emerald", label: "Green", class: "border-l-emerald-500" },
    { id: "amber", label: "Amber", class: "border-l-amber-500" },
    { id: "rose", label: "Rose", class: "border-l-rose-500" },
    { id: "violet", label: "Violet", class: "border-l-violet-500" },
];

/* ─── Persistence helpers ──────────────────────────── */
function loadNotes(): StandaloneNote[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveNotes(notes: StandaloneNote[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

/* ─── Time-ago helper ──────────────────────────────── */
function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

/* ─── Animation presets ────────────────────────────── */
const fadeUp = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
};

/* ─── Rich-text editor typography ──────────────────── */
const EDITOR_TYPOGRAPHY = [
    /* <pre> — code blocks */
    "[&_pre]:bg-foreground/[0.04] dark:[&_pre]:bg-white/[0.06]",
    "[&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:my-3",
    "[&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-relaxed",
    "[&_pre]:border [&_pre]:border-border/30 [&_pre]:overflow-x-auto",
    /* <code> — inline code */
    "[&_code]:bg-foreground/[0.06] dark:[&_code]:bg-white/[0.1]",
    "[&_code]:rounded-md [&_code]:px-1.5 [&_code]:py-0.5",
    "[&_code]:font-mono [&_code]:text-[13px] [&_code]:text-primary/80",
    /* <blockquote> */
    "[&_blockquote]:border-l-4 [&_blockquote]:border-primary/30",
    "[&_blockquote]:bg-primary/[0.03] dark:[&_blockquote]:bg-primary/[0.06]",
    "[&_blockquote]:pl-4 [&_blockquote]:pr-3 [&_blockquote]:py-2 [&_blockquote]:my-3",
    "[&_blockquote]:italic [&_blockquote]:rounded-r-lg [&_blockquote]:text-foreground/70",
    /* headings */
    "[&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h1]:mt-4 [&_h1]:mb-2",
    "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-3 [&_h2]:mb-1.5",
    /* basic formatting */
    "[&_b]:font-bold [&_strong]:font-bold",
    "[&_i]:italic [&_em]:italic",
    "[&_u]:underline [&_u]:decoration-primary/40",
    "[&_s]:line-through [&_strike]:line-through",
    /* images — base + alignment/size classes that survive DOMPurify */
    "[&_img]:h-auto [&_img]:rounded-lg [&_img]:my-3 [&_img]:max-w-full [&_img]:min-w-[48px] [&_img]:min-h-[48px]",
    "[&_img]:cursor-pointer [&_img]:transition-shadow",
    "[&_img.img-left]:float-left [&_img.img-left]:mr-4 [&_img.img-left]:mb-2",
    "[&_img.img-center]:block [&_img.img-center]:mx-auto",
    "[&_img.img-right]:float-right [&_img.img-right]:ml-4 [&_img.img-right]:mb-2",
    "[&_img.img-sm]:w-1/3 [&_img.img-md]:w-1/2 [&_img.img-full]:w-full",
    "[&_img.img-selected]:ring-2 [&_img.img-selected]:ring-primary [&_img.img-selected]:ring-offset-2 [&_img.img-selected]:ring-offset-background",
    /* links */
    "[&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/40",
].join(" ");

/* ─── Font Sizes ───────────────────────────────────── */
const FONT_SIZES = [
    { label: "Small", value: "2" },
    { label: "Normal", value: "3" },
    { label: "Large", value: "5" },
    { label: "Huge", value: "7" },
];

/* ─── Context Menu Item ────────────────────────────── */
function CtxItem({ onClick, icon, label, shortcut }: {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    shortcut?: string;
}) {
    return (
        <button
            onClick={onClick}
            className="
                w-[calc(100%-4px)] flex items-center gap-2.5 px-3 py-1.5 text-[13px]
                text-foreground/80 hover:bg-foreground/[0.06] dark:hover:bg-white/[0.06]
                transition-colors rounded-md mx-0.5
            "
        >
            <span className="w-4 h-4 flex items-center justify-center text-muted-foreground shrink-0">
                {icon}
            </span>
            <span className="flex-1 text-left">{label}</span>
            {shortcut && (
                <span className="text-[10px] text-muted-foreground/40 font-mono">{shortcut}</span>
            )}
        </button>
    );
}

/* ─── Text Colors ──────────────────────────────────── */
const BUBBLE_COLORS = [
    { label: "Default", value: "" },
    { label: "Red", value: "#ef4444" },
    { label: "Orange", value: "#f97316" },
    { label: "Emerald", value: "#10b981" },
    { label: "Blue", value: "#3b82f6" },
    { label: "Violet", value: "#8b5cf6" },
    { label: "Rose", value: "#f43f5e" },
];

function EditorContextMenu({ editorRef, pos, visible, onClose }: {
    editorRef: React.RefObject<HTMLDivElement | null>;
    pos: { x: number; y: number };
    visible: boolean;
    onClose: () => void;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [showColors, setShowColors] = useState(false);
    const [showFontSize, setShowFontSize] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ── Position via @floating-ui virtual element at cursor (viewport coords) ── */
    useEffect(() => {
        if (!visible || !menuRef.current) return;

        const virtualEl = {
            getBoundingClientRect: () => ({
                width: 0, height: 0,
                x: pos.x, y: pos.y,
                top: pos.y, left: pos.x,
                right: pos.x, bottom: pos.y,
                toJSON() { return this; },
            }),
        };

        computePosition(virtualEl, menuRef.current, {
            strategy: "fixed",
            placement: "bottom-start",
            middleware: [
                offset(4),
                flip({ fallbackPlacements: ["top-start", "bottom-end", "top-end"] }),
                shift({ padding: 8 }),
            ],
        }).then(({ x, y }) => {
            if (menuRef.current) {
                menuRef.current.style.left = `${x}px`;
                menuRef.current.style.top = `${y}px`;
            }
        });
    }, [visible, pos]);

    /* Close on outside click */
    useEffect(() => {
        if (!visible) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
        };
        const t = setTimeout(() => document.addEventListener("mousedown", handler), 0);
        return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
    }, [visible, onClose]);

    /* Close on Escape */
    useEffect(() => {
        if (!visible) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [visible, onClose]);

    /* Reset sub-panels */
    useEffect(() => {
        if (!visible) { setShowColors(false); setShowFontSize(false); }
    }, [visible]);

    if (!visible) return null;

    const exec = (cmd: string, val?: string) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, val);
    };

    const wrapInlineCode = () => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        let node: Node | null = sel.anchorNode;
        while (node && node !== editorRef.current) {
            if ((node as Element).tagName === "CODE") {
                const parent = node.parentNode;
                const text = document.createTextNode(node.textContent || "");
                parent?.replaceChild(text, node);
                onClose();
                return;
            }
            node = node.parentNode;
        }
        const text = sel.toString();
        exec("insertHTML", `<code>${text}</code>`);
        onClose();
    };

    const setHeading = (tag: string) => {
        exec("formatBlock", tag);
        onClose();
    };

    const insertLink = () => {
        const url = window.prompt("Enter URL:");
        if (url) {
            editorRef.current?.focus();
            document.execCommand("createLink", false, url);
        }
        onClose();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 1_048_576) {
            alert("Image must be under 1 MB.\nAccount storage limit is 10 MB.");
            e.target.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const editor = editorRef.current;
            if (!editor) return;
            editor.focus();
            document.execCommand("insertImage", false, reader.result as string);
            // Apply sensible default size so the image is immediately visible
            const allImgs = editor.getElementsByTagName("img");
            const inserted = allImgs[allImgs.length - 1];
            if (inserted && !inserted.style.width) {
                inserted.style.width = "320px";
                inserted.style.maxWidth = "100%";
            }
        };
        reader.readAsDataURL(file);
        e.target.value = "";
        onClose();
    };

    return createPortal(
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
            />
            <div
                ref={menuRef}
                className="
                    fixed z-[9999] min-w-[220px] max-h-[calc(100vh-16px)] overflow-y-auto
                    py-1.5 rounded-xl
                    bg-background/95 backdrop-blur-lg
                    border border-border/50
                    shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                "
                style={{ top: 0, left: 0 }}
                onMouseDown={(e) => e.preventDefault()}
            >
                {/* ── Text block type ── */}
                <CtxItem icon={<Heading1 className="w-3.5 h-3.5" />} label="Heading 1" onClick={() => setHeading("H1")} />
                <CtxItem icon={<Heading2 className="w-3.5 h-3.5" />} label="Heading 2" onClick={() => setHeading("H2")} />
                <CtxItem icon={<Type className="w-3.5 h-3.5" />} label="Normal Text" onClick={() => setHeading("P")} />

                <div className="h-px bg-border/30 my-1 mx-3" />

                {/* ── Inline formatting ── */}
                <CtxItem icon={<Bold className="w-3.5 h-3.5" />} label="Bold" shortcut="Ctrl+B" onClick={() => { exec("bold"); onClose(); }} />
                <CtxItem icon={<Italic className="w-3.5 h-3.5" />} label="Italic" shortcut="Ctrl+I" onClick={() => { exec("italic"); onClose(); }} />
                <CtxItem icon={<Underline className="w-3.5 h-3.5" />} label="Underline" shortcut="Ctrl+U" onClick={() => { exec("underline"); onClose(); }} />
                <CtxItem icon={<Strikethrough className="w-3.5 h-3.5" />} label="Strikethrough" onClick={() => { exec("strikeThrough"); onClose(); }} />

                <div className="h-px bg-border/30 my-1 mx-3" />

                {/* ── Block formatting ── */}
                <CtxItem icon={<Code2 className="w-3.5 h-3.5" />} label="Inline Code" onClick={wrapInlineCode} />
                <CtxItem icon={<Quote className="w-3.5 h-3.5" />} label="Blockquote" onClick={() => { exec("formatBlock", "BLOCKQUOTE"); onClose(); }} />

                <div className="h-px bg-border/30 my-1 mx-3" />

                {/* ── Font Size ── */}
                <button
                    onClick={() => setShowFontSize((v) => !v)}
                    className="
                        w-[calc(100%-4px)] flex items-center gap-2.5 px-3 py-1.5 text-[13px]
                        text-foreground/80 hover:bg-foreground/[0.06] dark:hover:bg-white/[0.06]
                        transition-colors rounded-md mx-0.5
                    "
                >
                    <span className="w-4 h-4 flex items-center justify-center text-muted-foreground shrink-0">
                        <ALargeSmall className="w-3.5 h-3.5" />
                    </span>
                    <span className="flex-1 text-left">Font Size</span>
                    <span className="text-[10px] text-muted-foreground/40">▸</span>
                </button>
                {showFontSize && (
                    <div className="ml-7 mr-2 mb-1 flex flex-wrap gap-1">
                        {FONT_SIZES.map((s) => (
                            <button
                                key={s.value}
                                onClick={() => { exec("fontSize", s.value); setShowFontSize(false); onClose(); }}
                                className="
                                    px-2.5 py-1 text-[11px] rounded-md
                                    bg-foreground/[0.04] dark:bg-white/[0.06]
                                    hover:bg-primary/10 hover:text-primary
                                    transition-colors
                                "
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="h-px bg-border/30 my-1 mx-3" />

                {/* ── Insert ── */}
                <CtxItem icon={<Link2 className="w-3.5 h-3.5" />} label="Insert Link" onClick={insertLink} />
                <CtxItem icon={<ImagePlus className="w-3.5 h-3.5" />} label="Insert Image" onClick={() => fileInputRef.current?.click()} />

                <div className="h-px bg-border/30 my-1 mx-3" />

                {/* ── Text Color ── */}
                <button
                    onClick={() => setShowColors((v) => !v)}
                    className="
                        w-[calc(100%-4px)] flex items-center gap-2.5 px-3 py-1.5 text-[13px]
                        text-foreground/80 hover:bg-foreground/[0.06] dark:hover:bg-white/[0.06]
                        transition-colors rounded-md mx-0.5
                    "
                >
                    <span className="w-4 h-4 flex items-center justify-center text-muted-foreground shrink-0">
                        <Palette className="w-3.5 h-3.5" />
                    </span>
                    <span className="flex-1 text-left">Text Color</span>
                    <span className="text-[10px] text-muted-foreground/40">▸</span>
                </button>
                {showColors && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 ml-7">
                        {BUBBLE_COLORS.map((c) => (
                            <button
                                key={c.label}
                                onClick={() => {
                                    if (c.value) exec("foreColor", c.value);
                                    else exec("removeFormat");
                                    setShowColors(false);
                                    onClose();
                                }}
                                className="
                                    w-5 h-5 rounded-full transition-all hover:scale-125
                                    ring-1 ring-border/40 hover:ring-2 hover:ring-primary/50
                                "
                                style={{ backgroundColor: c.value || "hsl(var(--muted-foreground) / 0.2)" }}
                                title={c.label}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>,
        document.body,
    );
}

/* ─── Mobile Formatting Bar ────────────────────────── */
function MobileFormatBar({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) {
    const exec = (cmd: string, val?: string) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, val);
    };
    const btns: { cmd: string; icon: React.ReactNode; title: string; val?: string }[] = [
        { cmd: "bold", icon: <Bold className="w-3.5 h-3.5" />, title: "Bold" },
        { cmd: "italic", icon: <Italic className="w-3.5 h-3.5" />, title: "Italic" },
        { cmd: "underline", icon: <Underline className="w-3.5 h-3.5" />, title: "Underline" },
        { cmd: "strikeThrough", icon: <Strikethrough className="w-3.5 h-3.5" />, title: "Strike" },
        { cmd: "formatBlock", icon: <Heading1 className="w-3.5 h-3.5" />, title: "H1", val: "H1" },
        { cmd: "formatBlock", icon: <Heading2 className="w-3.5 h-3.5" />, title: "H2", val: "H2" },
    ];
    return (
        <div className="
            sticky bottom-0 z-50 flex items-center gap-0.5 p-1.5
            bg-background/95 backdrop-blur-lg
            border-t border-border/30
            overflow-x-auto
        ">
            {btns.map((b, i) => (
                <button
                    key={i}
                    onTouchEnd={(e) => { e.preventDefault(); exec(b.cmd, b.val); }}
                    onClick={() => exec(b.cmd, b.val)}
                    className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors shrink-0"
                    title={b.title}
                >
                    {b.icon}
                </button>
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   NotesPage — Standalone Notion-like Workspace
   ═══════════════════════════════════════════════════════ */
export default function NotesPage() {
    const { user } = useAuth();
    const { projects } = useProjectData();
    const isMobile = useIsMobile();

    const [notes, setNotes] = useState<StandaloneNote[]>(loadNotes);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filterProject, setFilterProject] = useState<string | "all">("all");
    const titleRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [ctxMenu, setCtxMenu] = useState({ visible: false, x: 0, y: 0 });
    const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);

    // Persist on every change
    useEffect(() => { saveNotes(notes); }, [notes]);

    // ── Selected note ─────────────────────────────
    const selectedNote = useMemo(
        () => notes.find((n) => n.id === selectedId) ?? null,
        [notes, selectedId],
    );

    // ── Filtered + sorted list ────────────────────
    const filteredNotes = useMemo(() => {
        let list = [...notes];
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(
                (n) =>
                    n.title.toLowerCase().includes(q) ||
                    n.content.toLowerCase().includes(q),
            );
        }
        if (filterProject !== "all") {
            list = list.filter((n) =>
                filterProject === "standalone" ? !n.projectId : n.projectId === filterProject,
            );
        }
        // Pinned first, then most-recently updated
        return list.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.updatedAt - a.updatedAt;
        });
    }, [notes, search, filterProject]);

    // ── CRUD ──────────────────────────────────────
    const createNote = useCallback(() => {
        if (!user) return;
        const initials = user.fullName?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "??";
        const now = Date.now();
        const newNote: StandaloneNote = {
            id: `note_${now}_${Math.random().toString(36).slice(2, 8)}`,
            title: "",
            content: "",
            authorName: user.fullName || "Unknown",
            authorInitials: initials,
            createdAt: now,
            updatedAt: now,
        };
        setNotes((prev) => [newNote, ...prev]);
        setSelectedId(newNote.id);
        // Focus title after render
        setTimeout(() => titleRef.current?.focus(), 80);
    }, [user]);

    const updateNote = useCallback(
        (id: string, patch: Partial<StandaloneNote>) => {
            setNotes((prev) =>
                prev.map((n) =>
                    n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n,
                ),
            );
        },
        [],
    );

    const deleteNote = useCallback(
        (id: string) => {
            setNotes((prev) => prev.filter((n) => n.id !== id));
            if (selectedId === id) setSelectedId(null);
        },
        [selectedId],
    );

    const togglePin = useCallback(
        (id: string) => {
            updateNote(id, { pinned: !notes.find((n) => n.id === id)?.pinned });
        },
        [notes, updateNote],
    );

    // ── Save handler (sanitise content) ───────────
    const handleContentBlur = useCallback(() => {
        if (!selectedNote) return;
        const rawContent = contentRef.current?.innerHTML ?? "";
        // sanitizeHtml preserves safe formatting, strips XSS
        const safeContent = sanitizeHtml(rawContent);
        updateNote(selectedNote.id, { content: safeContent });
    }, [selectedNote, updateNote]);

    const handleTitleBlur = useCallback(() => {
        if (!selectedNote) return;
        const rawTitle = titleRef.current?.value ?? "";
        updateNote(selectedNote.id, { title: sanitizeInput(rawTitle) });
    }, [selectedNote, updateNote]);

    // ── Smart Enter key handler ───────────────────
    const handleEditorKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== "Enter") return;

        if (e.shiftKey) {
            // Shift+Enter → soft line break inside current block
            e.preventDefault();
            document.execCommand("insertLineBreak");
            return;
        }

        // Plain Enter → break out of formatted blocks into <p>
        const sel = window.getSelection();
        if (!sel || !sel.anchorNode) return;

        let block: Node | null = sel.anchorNode;
        while (block && block !== contentRef.current) {
            const tag = (block as Element).tagName;
            if (tag && /^(H[1-6]|BLOCKQUOTE|PRE)$/.test(tag)) {
                e.preventDefault();
                // If cursor is at the end of the block, insert a new clean paragraph after it
                const range = sel.getRangeAt(0);
                const textAfter = range.cloneRange();
                textAfter.selectNodeContents(block);
                textAfter.setStart(range.endContainer, range.endOffset);
                const remaining = textAfter.toString().trim();

                if (remaining.length === 0) {
                    // At end — insert empty <p> after the block
                    const p = document.createElement("p");
                    p.appendChild(document.createElement("br"));
                    (block as Element).after(p);
                    // Move caret into the new <p>
                    const newRange = document.createRange();
                    newRange.setStart(p, 0);
                    newRange.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(newRange);
                } else {
                    // Mid-block — use insertParagraph then reset to <p>
                    document.execCommand("insertParagraph");
                    document.execCommand("formatBlock", false, "P");
                }
                return;
            }
            block = block.parentNode;
        }
        // Normal context — let the browser handle it
    }, []);

    // ── Image click detection ─────────────────────
    const handleEditorClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "IMG") {
            // Deselect previous
            contentRef.current?.querySelectorAll("img.img-selected").forEach((el) => el.classList.remove("img-selected"));
            target.classList.add("img-selected");
            setSelectedImg(target as HTMLImageElement);
        } else {
            contentRef.current?.querySelectorAll("img.img-selected").forEach((el) => el.classList.remove("img-selected"));
            setSelectedImg(null);
        }
    }, []);

    // ── Clear image selection on note switch ───────
    useEffect(() => {
        setSelectedImg(null);
    }, [selectedId]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
            {/* ═══════════════════════════════════════════
               LEFT: Notes Sidebar/List
               ═══════════════════════════════════════════ */}
            <motion.aside
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="
                    w-full lg:w-80 shrink-0
                    rounded-[1.5rem] overflow-hidden
                    bg-white/[0.55] dark:bg-white/[0.025]
                    backdrop-blur-lg
                    border border-black/[0.06] dark:border-white/[0.06]
                    shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none
                    flex flex-col
                "
            >
                {/* Sidebar header */}
                <div className="p-4 pb-3 border-b border-border/30">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                <StickyNote className="w-4 h-4 text-white/90" />
                            </div>
                            <h2 className="text-sm font-bold tracking-tight">Notes</h2>
                            <span className="text-[11px] text-muted-foreground/60">
                                ({notes.length})
                            </span>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={createNote}
                            className="
                                w-8 h-8 rounded-lg bg-primary/10 text-primary
                                grid place-items-center hover:bg-primary/20
                                transition-colors
                            "
                            aria-label="New note"
                        >
                            <Plus className="w-4 h-4" />
                        </motion.button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search notes…"
                            className="
                                w-full h-8 pl-8 pr-3 rounded-lg text-xs
                                bg-foreground/[0.03] dark:bg-white/[0.04]
                                border border-border/30
                                placeholder:text-muted-foreground/40
                                focus:outline-none focus:ring-1 focus:ring-primary/30
                                transition-all
                            "
                        />
                    </div>

                    {/* Project filter */}
                    <select
                        value={filterProject}
                        onChange={(e) => setFilterProject(e.target.value)}
                        className="
                            w-full mt-2 h-8 px-3 rounded-lg text-xs
                            bg-foreground/[0.03] dark:bg-white/[0.04]
                            border border-border/30 text-foreground
                            focus:outline-none focus:ring-1 focus:ring-primary/30
                        "
                    >
                        <option value="all">All Notes</option>
                        <option value="standalone">Standalone Only</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Note list */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <AnimatePresence>
                        {filteredNotes.length === 0 && (
                            <motion.div
                                {...fadeUp}
                                className="flex flex-col items-center justify-center py-12 text-center"
                            >
                                <FileText className="w-8 h-8 text-muted-foreground/20 mb-3" />
                                <p className="text-xs text-muted-foreground/50">
                                    {search ? "No notes match your search" : "No notes yet"}
                                </p>
                                {!search && (
                                    <button
                                        onClick={createNote}
                                        className="mt-2 text-xs text-primary hover:underline"
                                    >
                                        Create your first note
                                    </button>
                                )}
                            </motion.div>
                        )}

                        {filteredNotes.map((note) => {
                            const isActive = selectedId === note.id;
                            const colorClass = NOTE_COLORS.find((c) => c.id === note.color)?.class ?? "";
                            const linkedProject = note.projectId
                                ? projects.find((p) => p.id === note.projectId)
                                : null;

                            return (
                                <motion.button
                                    key={note.id}
                                    {...fadeUp}
                                    onClick={() => setSelectedId(note.id)}
                                    className={`
                                        w-full text-left p-3 rounded-xl transition-all duration-150
                                        border-l-[3px] ${colorClass || "border-l-transparent"}
                                        ${isActive
                                            ? "bg-primary/8 dark:bg-primary/10 ring-1 ring-primary/20"
                                            : "hover:bg-foreground/[0.03] dark:hover:bg-white/[0.03]"
                                        }
                                    `}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-[13px] font-semibold truncate ${isActive ? "text-primary" : "text-foreground"}`}>
                                                {note.title || "Untitled"}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">
                                                {note.content?.replace(/<[^>]*>/g, "").slice(0, 80) || "Empty note"}
                                            </p>
                                        </div>
                                        {note.pinned && (
                                            <Pin className="w-3 h-3 text-primary/60 flex-shrink-0 mt-0.5" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[10px] text-muted-foreground/40">
                                            {timeAgo(note.updatedAt)}
                                        </span>
                                        {linkedProject && (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/40">
                                                <FolderKanban className="w-2.5 h-2.5" />
                                                {linkedProject.name}
                                            </span>
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </motion.aside>

            {/* ═══════════════════════════════════════════
               RIGHT: Note Editor
               ═══════════════════════════════════════════ */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="
                    flex-1 rounded-[1.5rem] overflow-hidden
                    bg-white/[0.55] dark:bg-white/[0.025]
                    backdrop-blur-lg
                    border border-black/[0.06] dark:border-white/[0.06]
                    shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none
                    flex flex-col
                "
            >
                {selectedNote ? (
                    <>
                        {/* Editor toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-border/30">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[9px] font-bold text-primary">{selectedNote.authorInitials}</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-muted-foreground/50">
                                        by {selectedNote.authorName} · {timeAgo(selectedNote.updatedAt)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                                {/* Color picker — uses inline styles to avoid Tailwind purge */}
                                <div className="flex items-center gap-1.5 mr-2">
                                    {NOTE_COLORS.map((c) => {
                                        const isSelected = (selectedNote.color || "none") === c.id;
                                        const colorMap: Record<string, string> = {
                                            none: "hsl(var(--muted-foreground) / 0.15)",
                                            blue: "#3b82f6",
                                            emerald: "#10b981",
                                            amber: "#f59e0b",
                                            rose: "#f43f5e",
                                            violet: "#8b5cf6",
                                        };
                                        return (
                                            <button
                                                key={c.id}
                                                onClick={() => updateNote(selectedNote.id, { color: c.id === "none" ? undefined : c.id })}
                                                className={`
                                                    w-6 h-6 rounded-full transition-all
                                                    ring-1 ring-border/40
                                                    ${isSelected
                                                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                                                        : "hover:scale-125 hover:ring-2 hover:ring-primary/40"
                                                    }
                                                `}
                                                style={{ backgroundColor: colorMap[c.id] || colorMap.none }}
                                                title={c.label}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Project link */}
                                <select
                                    value={selectedNote.projectId || ""}
                                    onChange={(e) => updateNote(selectedNote.id, { projectId: e.target.value || undefined })}
                                    className="
                                        h-8 px-2 rounded-lg text-[11px]
                                        bg-foreground/[0.03] dark:bg-white/[0.04]
                                        border border-border/30 text-foreground
                                        focus:outline-none focus:ring-1 focus:ring-primary/30
                                    "
                                    title="Link to project"
                                >
                                    <option value="">No project</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>

                                {/* Pin */}
                                <button
                                    onClick={() => togglePin(selectedNote.id)}
                                    className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                    title={selectedNote.pinned ? "Unpin" : "Pin"}
                                >
                                    {selectedNote.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                                </button>

                                {/* Delete */}
                                <button
                                    onClick={() => deleteNote(selectedNote.id)}
                                    className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                    title="Delete note"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="px-6 pt-5">
                            <input
                                ref={titleRef}
                                key={`title-${selectedNote.id}`}
                                defaultValue={selectedNote.title}
                                onBlur={handleTitleBlur}
                                placeholder="Untitled note…"
                                className="
                                    w-full text-2xl font-bold tracking-tight bg-transparent
                                    placeholder:text-muted-foreground/30
                                    outline-none border-none
                                "
                            />
                        </div>

                        {/* Content — Rich Text Editor */}
                        <div className="flex-1 px-4 sm:px-6 pt-3 pb-6 relative overflow-y-auto">
                            <EditorContextMenu
                                editorRef={contentRef}
                                pos={{ x: ctxMenu.x, y: ctxMenu.y }}
                                visible={ctxMenu.visible}
                                onClose={() => setCtxMenu({ visible: false, x: 0, y: 0 })}
                            />
                            {selectedImg && (
                                <ImageControls
                                    img={selectedImg}
                                    onDismiss={() => {
                                        selectedImg.classList.remove("img-selected");
                                        setSelectedImg(null);
                                    }}
                                    onMutate={handleContentBlur}
                                />
                            )}
                            <div
                                ref={contentRef}
                                key={`content-${selectedNote.id}`}
                                contentEditable
                                suppressContentEditableWarning
                                dir="auto"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedNote.content) }}
                                onBlur={handleContentBlur}
                                onKeyDown={handleEditorKeyDown}
                                onClick={handleEditorClick}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    // clientX/clientY = viewport-relative; portal + fixed positions the menu exactly at cursor
                                    setCtxMenu({ visible: true, x: e.clientX, y: e.clientY });
                                }}
                                data-placeholder={isMobile ? "Start writing… Use toolbar below." : "Start writing… Right-click to format."}
                                className={`
                                    w-full min-h-[200px] outline-none
                                    text-sm leading-relaxed text-foreground/80
                                    empty:before:content-[attr(data-placeholder)]
                                    empty:before:text-muted-foreground/25
                                    empty:before:pointer-events-none
                                    ${EDITOR_TYPOGRAPHY}
                                `}
                            />
                        </div>
                        {/* Mobile sticky formatting bar */}
                        {isMobile && <MobileFormatBar editorRef={contentRef} />}
                    </>
                ) : (
                    /* Empty state */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center mb-5">
                                <Sparkles className="w-7 h-7 text-amber-500/60" />
                            </div>
                            <h3 className="text-lg font-bold tracking-tight mb-2">
                                Your Notes Workspace
                            </h3>
                            <p className="text-sm text-muted-foreground/60 max-w-xs mb-5 leading-relaxed">
                                Select a note from the sidebar or create a new one to start writing.
                                Link notes to projects for better organisation.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={createNote}
                                className="
                                    inline-flex items-center gap-2 px-5 h-10 rounded-xl
                                    bg-primary text-primary-foreground text-sm font-semibold
                                    shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30
                                    transition-shadow
                                "
                            >
                                <Plus className="w-4 h-4" />
                                New Note
                            </motion.button>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
