/**
 * ImageControls — Resizable image wrapper with drag handles & floating toolbar.
 *
 * Renders outside the contentEditable flow as a portal-positioned overlay.
 * When a user clicks an <img> inside the editor, NotesPage activates this
 * component which draws:
 *   1. Eight resize handles (4 corners + 4 sides)
 *   2. A floating toolbar (alignment + preset sizes + delete)
 *
 * All changes are applied directly to the DOM <img> element via inline
 * styles (width/height) and class names (alignment), which survive
 * DOMPurify sanitisation because `style`, `class`, `width`, `height`
 * are in the ALLOWED_ATTR list.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    AlignLeft, AlignCenter, AlignRight,
    Maximize2, Minimize2, RectangleHorizontal,
    Trash2, RotateCcw,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────── */
type Handle =
    | "nw" | "n" | "ne"
    | "w"  |        "e"
    | "sw" | "s" | "se";

interface ImageControlsProps {
    /** The actual <img> DOM element inside contentEditable */
    img: HTMLImageElement;
    /** Called when user clicks outside or presses Escape */
    onDismiss: () => void;
    /** Called after any mutation so the parent can persist content */
    onMutate: () => void;
}

/* ─── Handle metadata ─────────────────────────────────── */
const HANDLES: { id: Handle; cursor: string; x: "left" | "center" | "right"; y: "top" | "center" | "bottom" }[] = [
    { id: "nw", cursor: "nwse-resize", x: "left",   y: "top" },
    { id: "n",  cursor: "ns-resize",   x: "center", y: "top" },
    { id: "ne", cursor: "nesw-resize", x: "right",  y: "top" },
    { id: "w",  cursor: "ew-resize",   x: "left",   y: "center" },
    { id: "e",  cursor: "ew-resize",   x: "right",  y: "center" },
    { id: "sw", cursor: "nesw-resize", x: "left",   y: "bottom" },
    { id: "s",  cursor: "ns-resize",   x: "center", y: "bottom" },
    { id: "se", cursor: "nwse-resize", x: "right",  y: "bottom" },
];

/* ─── Toolbar definitions ─────────────────────────────── */
const IMG_ALIGNS = [
    { id: "img-left",   label: "Align Left",   icon: AlignLeft },
    { id: "img-center", label: "Align Center", icon: AlignCenter },
    { id: "img-right",  label: "Align Right",  icon: AlignRight },
] as const;

const IMG_SIZES = [
    { id: "img-sm",   label: "Small (33%)",  icon: Minimize2 },
    { id: "img-md",   label: "Medium (50%)", icon: RectangleHorizontal },
    { id: "img-full", label: "Full Width",   icon: Maximize2 },
] as const;

const ALIGN_IDS = IMG_ALIGNS.map((a) => a.id);
const SIZE_IDS  = IMG_SIZES.map((s) => s.id);

/* minimum resize dimension */
const MIN_W = 48;
const MIN_H = 48;

/* ═════════════════════════════════════════════════════════
   Component
   ═════════════════════════════════════════════════════════ */
export default function ImageControls({ img, onDismiss, onMutate }: ImageControlsProps) {
    /* ── Overlay rect (tracks the image's viewport position) ── */
    const [rect, setRect] = useState<DOMRect | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    const sync = useCallback(() => {
        setRect(img.getBoundingClientRect());
    }, [img]);

    useEffect(() => {
        sync();
        window.addEventListener("scroll", sync, true);
        window.addEventListener("resize", sync);
        const mo = new MutationObserver(sync);
        mo.observe(img, { attributes: true, attributeFilter: ["style", "class", "width", "height"] });
        return () => {
            window.removeEventListener("scroll", sync, true);
            window.removeEventListener("resize", sync);
            mo.disconnect();
        };
    }, [img, sync]);

    /* ── Dismiss on outside click ── */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                overlayRef.current &&
                !overlayRef.current.contains(e.target as Node) &&
                e.target !== img
            ) {
                onDismiss();
            }
        };
        const t = setTimeout(() => document.addEventListener("mousedown", handler), 0);
        return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
    }, [img, onDismiss]);

    /* ── Dismiss on Escape ── */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onDismiss(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onDismiss]);

    /* ── Drag-resize logic ── */
    const startResize = useCallback((handle: Handle, startEvent: React.MouseEvent) => {
        startEvent.preventDefault();
        startEvent.stopPropagation();

        const startX = startEvent.clientX;
        const startY = startEvent.clientY;
        const startW = img.offsetWidth;
        const startH = img.offsetHeight;
        const aspect = startW / startH;

        const onMove = (e: MouseEvent) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            let newW = startW;
            let newH = startH;

            // Horizontal component
            if (handle.includes("e")) newW = startW + dx;
            if (handle.includes("w")) newW = startW - dx;

            // Vertical component
            if (handle.includes("s")) newH = startH + dy;
            if (handle.includes("n")) newH = startH - dy;

            // Corner handles: maintain aspect ratio
            if (handle.length === 2) {
                // Use the larger delta to drive the ratio
                if (Math.abs(dx) > Math.abs(dy)) {
                    newH = newW / aspect;
                } else {
                    newW = newH * aspect;
                }
            }

            newW = Math.max(MIN_W, Math.round(newW));
            newH = Math.max(MIN_H, Math.round(newH));

            img.style.width  = `${newW}px`;
            img.style.height = `${newH}px`;

            // Remove any preset-size classes since we're doing manual resize
            SIZE_IDS.forEach((c) => img.classList.remove(c));

            sync();
        };

        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            onMutate();
        };

        document.body.style.cursor = HANDLES.find((h) => h.id === handle)?.cursor || "nwse-resize";
        document.body.style.userSelect = "none";
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    }, [img, sync, onMutate]);

    /* ── Toolbar actions ── */
    const toggleClass = useCallback((cls: string, group: readonly string[]) => {
        group.forEach((g) => img.classList.remove(g));
        if (!img.classList.contains(cls)) img.classList.add(cls);
        // When using class-based sizing, clear inline width/height
        if (SIZE_IDS.includes(cls)) {
            img.style.width = "";
            img.style.height = "";
        }
        sync();
        onMutate();
    }, [img, sync, onMutate]);

    const resetSize = useCallback(() => {
        img.style.width = "";
        img.style.height = "";
        SIZE_IDS.forEach((c) => img.classList.remove(c));
        ALIGN_IDS.forEach((c) => img.classList.remove(c));
        sync();
        onMutate();
    }, [img, sync, onMutate]);

    const removeImage = useCallback(() => {
        img.remove();
        onDismiss();
        onMutate();
    }, [img, onDismiss, onMutate]);

    if (!rect) return null;

    /* ── Handle positions ── */
    const HANDLE_SIZE = 10;
    const half = HANDLE_SIZE / 2;

    function handleStyle(h: typeof HANDLES[number]): React.CSSProperties {
        const base: React.CSSProperties = {
            position: "absolute",
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            cursor: h.cursor,
            zIndex: 2,
        };
        // X
        if (h.x === "left")   base.left = -half;
        if (h.x === "center") { base.left = "50%"; base.marginLeft = -half; }
        if (h.x === "right")  base.right = -half;
        // Y
        if (h.y === "top")    base.top = -half;
        if (h.y === "center") { base.top = "50%"; base.marginTop = -half; }
        if (h.y === "bottom") base.bottom = -half;
        return base;
    }

    /* ── Toolbar position: above image, clamped to viewport ── */
    const TOOLBAR_H = 40;
    const TOOLBAR_W = 280;
    const pad = 8;
    let toolbarTop = rect.top - TOOLBAR_H - pad;
    if (toolbarTop < pad) toolbarTop = rect.bottom + pad;
    let toolbarLeft = rect.left + rect.width / 2 - TOOLBAR_W / 2;
    toolbarLeft = Math.max(pad, Math.min(toolbarLeft, window.innerWidth - TOOLBAR_W - pad));

    return createPortal(
        <div ref={overlayRef} onMouseDown={(e) => e.preventDefault()}>
            {/* ── Selection outline + resize handles ── */}
            <div
                className="fixed pointer-events-none z-[9997]"
                style={{
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                }}
            >
                {/* Blue selection border */}
                <div className="absolute inset-0 rounded-lg border-2 border-primary ring-2 ring-primary/20" />

                {/* Resize handles */}
                {HANDLES.map((h) => (
                    <div
                        key={h.id}
                        className="pointer-events-auto bg-background border-2 border-primary rounded-sm shadow-md hover:bg-primary hover:border-primary transition-colors"
                        style={handleStyle(h)}
                        onMouseDown={(e) => startResize(h.id, e)}
                    />
                ))}
            </div>

            {/* ── Floating toolbar ── */}
            <div
                className="
                    fixed z-[9998] flex items-center gap-0.5 px-1.5 py-1 rounded-xl
                    bg-background/95 backdrop-blur-lg
                    border border-border/50
                    shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                "
                style={{ top: toolbarTop, left: toolbarLeft }}
            >
                {/* ── Alignment ── */}
                {IMG_ALIGNS.map((a) => {
                    const Icon = a.icon;
                    const active = img.classList.contains(a.id);
                    return (
                        <button
                            key={a.id}
                            onClick={() => toggleClass(a.id, ALIGN_IDS)}
                            title={a.label}
                            className={`
                                w-7 h-7 rounded-lg grid place-items-center transition-colors
                                ${active
                                    ? "bg-primary/15 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06]"
                                }
                            `}
                        >
                            <Icon className="w-3.5 h-3.5" />
                        </button>
                    );
                })}

                <div className="w-px h-4 bg-border/30 mx-0.5" />

                {/* ── Preset sizes ── */}
                {IMG_SIZES.map((s) => {
                    const Icon = s.icon;
                    const active = img.classList.contains(s.id);
                    return (
                        <button
                            key={s.id}
                            onClick={() => toggleClass(s.id, SIZE_IDS)}
                            title={s.label}
                            className={`
                                w-7 h-7 rounded-lg grid place-items-center transition-colors
                                ${active
                                    ? "bg-primary/15 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06]"
                                }
                            `}
                        >
                            <Icon className="w-3.5 h-3.5" />
                        </button>
                    );
                })}

                <div className="w-px h-4 bg-border/30 mx-0.5" />

                {/* ── Reset ── */}
                <button
                    onClick={resetSize}
                    title="Reset to original"
                    className="w-7 h-7 rounded-lg grid place-items-center text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* ── Delete ── */}
                <button
                    onClick={removeImage}
                    title="Remove image"
                    className="w-7 h-7 rounded-lg grid place-items-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>,
        document.body,
    );
}
