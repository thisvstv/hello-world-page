/**
 * Game2048.tsx
 *
 * Premium 2048 with smooth tile-sliding animations, an indigo/violet palette,
 * score-pop effects, responsive sizing, and distinct Win / Game-Over overlays.
 *
 * Controls: Arrow keys, WASD, or swipe on mobile.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trophy, Frown } from "lucide-react";

// ── Constants ──────────────────────────────────────────
const SIZE = 4;
const GAP = 8;   // px between tiles
const PAD = 10;  // board padding in px

type Cell = { value: number; id: number; merged?: boolean };
type Grid = (Cell | null)[][];

let nextCellId = 0;

// ── Grid helpers (pure) ────────────────────────────────
function emptyGrid(): Grid {
    return Array.from({ length: SIZE }, () => Array<Cell | null>(SIZE).fill(null));
}
function cloneGrid(g: Grid): Grid {
    return g.map((r) => r.map((c) => (c ? { ...c, merged: false } : null)));
}
function addRandom(g: Grid): Grid {
    const spots: [number, number][] = [];
    for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++) if (!g[r][c]) spots.push([r, c]);
    if (!spots.length) return g;
    const [r, c] = spots[Math.floor(Math.random() * spots.length)];
    const ng = cloneGrid(g);
    ng[r][c] = { value: Math.random() < 0.9 ? 2 : 4, id: nextCellId++ };
    return ng;
}
function initGrid(): Grid { return addRandom(addRandom(emptyGrid())); }

function slideRow(row: (Cell | null)[]): { row: (Cell | null)[]; score: number } {
    const tiles = row.filter(Boolean) as Cell[];
    const out: (Cell | null)[] = [];
    let score = 0, i = 0;
    while (i < tiles.length) {
        if (i + 1 < tiles.length && tiles[i].value === tiles[i + 1].value) {
            const v = tiles[i].value * 2;
            out.push({ value: v, id: nextCellId++, merged: true });
            score += v;
            i += 2;
        } else {
            out.push({ ...tiles[i], merged: false });
            i++;
        }
    }
    while (out.length < SIZE) out.push(null);
    return { row: out, score };
}
function rotateGrid(g: Grid): Grid {
    const n = emptyGrid();
    for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++) n[c][SIZE - 1 - r] = g[r][c];
    return n;
}
function moveLeft(g: Grid) {
    const ng = cloneGrid(g);
    let total = 0, moved = false;
    for (let r = 0; r < SIZE; r++) {
        const { row, score } = slideRow(ng[r]);
        total += score;
        if (row.some((c, i) => {
            const o = ng[r][i];
            if (!c && !o) return false;
            if (!c || !o) return true;
            return c.value !== o.value;
        })) moved = true;
        ng[r] = row;
    }
    return { grid: ng, score: total, moved };
}
function doMove(g: Grid, dir: "left" | "right" | "up" | "down") {
    const rots = { left: 0, up: 1, right: 2, down: 3 }[dir];
    let r = cloneGrid(g);
    for (let i = 0; i < rots; i++) r = rotateGrid(r);
    const res = moveLeft(r);
    for (let i = 0; i < (4 - rots) % 4; i++) res.grid = rotateGrid(res.grid);
    return res;
}
function canMove(g: Grid): boolean {
    for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++) {
            if (!g[r][c]) return true;
            if (c + 1 < SIZE && g[r][c + 1]?.value === g[r][c]!.value) return true;
            if (r + 1 < SIZE && g[r + 1][c]?.value === g[r][c]!.value) return true;
        }
    return false;
}
function hasWon(g: Grid): boolean {
    return g.some((r) => r.some((c) => c && c.value >= 2048));
}

// ── Premium palette ────────────────────────────────────
const TILE_STYLE: Record<number, { bg: string; text: string; shadow: string }> = {
    2: { bg: "bg-slate-200 dark:bg-slate-700/60", text: "text-slate-700 dark:text-slate-200", shadow: "shadow-slate-300/40 dark:shadow-slate-800/30" },
    4: { bg: "bg-slate-300 dark:bg-slate-600/60", text: "text-slate-800 dark:text-slate-100", shadow: "shadow-slate-400/40 dark:shadow-slate-700/30" },
    8: { bg: "bg-indigo-400 dark:bg-indigo-500/70", text: "text-white", shadow: "shadow-indigo-500/40" },
    16: { bg: "bg-indigo-500 dark:bg-indigo-500/80", text: "text-white", shadow: "shadow-indigo-600/40" },
    32: { bg: "bg-violet-500 dark:bg-violet-500/80", text: "text-white", shadow: "shadow-violet-600/40" },
    64: { bg: "bg-violet-600 dark:bg-violet-600/80", text: "text-white", shadow: "shadow-violet-700/40" },
    128: { bg: "bg-fuchsia-500 dark:bg-fuchsia-500/80", text: "text-white", shadow: "shadow-fuchsia-600/40" },
    256: { bg: "bg-rose-500 dark:bg-rose-500/80", text: "text-white", shadow: "shadow-rose-600/40" },
    512: { bg: "bg-amber-500 dark:bg-amber-500/80", text: "text-white", shadow: "shadow-amber-600/40" },
    1024: { bg: "bg-emerald-500 dark:bg-emerald-500/80", text: "text-white", shadow: "shadow-emerald-600/40" },
    2048: { bg: "bg-gradient-to-br from-indigo-500 to-violet-600", text: "text-white font-black", shadow: "shadow-indigo-500/60 shadow-lg" },
};
const DEFAULT_STYLE = { bg: "bg-indigo-700", text: "text-white font-black", shadow: "shadow-indigo-800/50 shadow-lg" };

function tileFont(v: number) {
    if (v >= 1024) return "text-base sm:text-lg";
    if (v >= 128) return "text-lg sm:text-xl";
    return "text-xl sm:text-2xl";
}

// ── Score Pop component ────────────────────────────────
function ScorePop({ delta }: { delta: { value: number; key: number } | null }) {
    return (
        <AnimatePresence>
            {delta && delta.value > 0 && (
                <motion.span
                    key={delta.key}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -28 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="absolute -top-2 right-0 text-xs font-bold text-primary pointer-events-none"
                >
                    +{delta.value}
                </motion.span>
            )}
        </AnimatePresence>
    );
}

// ── Main component ─────────────────────────────────────
export default function Game2048() {
    const [grid, setGrid] = useState<Grid>(initGrid);
    const [score, setScore] = useState(0);
    const [scoreDelta, setScoreDelta] = useState<{ value: number; key: number } | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [highScore, setHighScore] = useState(() => {
        const s = localStorage.getItem("stride_2048_high");
        return s ? parseInt(s, 10) : 0;
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const deltaKey = useRef(0);

    // Responsive tile size
    const TILE = 68;   // px, base tile size
    const BOARD = TILE * SIZE + GAP * (SIZE - 1) + PAD * 2;

    const handleMove = useCallback((dir: "left" | "right" | "up" | "down") => {
        if (gameOver) return;
        setGrid((prev) => {
            const res = doMove(prev, dir);
            if (!res.moved) return prev;
            const ng = addRandom(res.grid);

            if (res.score > 0) {
                setScoreDelta({ value: res.score, key: ++deltaKey.current });
            }
            setScore((s) => {
                const ns = s + res.score;
                if (ns > highScore) {
                    setHighScore(ns);
                    localStorage.setItem("stride_2048_high", String(ns));
                }
                return ns;
            });
            if (hasWon(ng) && !won) setWon(true);
            if (!canMove(ng)) setGameOver(true);
            return ng;
        });
    }, [gameOver, won, highScore]);

    // Keyboard
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const map: Record<string, "left" | "right" | "up" | "down"> = {
                ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
                w: "up", s: "down", a: "left", d: "right",
                W: "up", S: "down", A: "left", D: "right",
            };
            const d = map[e.key];
            if (d) { e.preventDefault(); handleMove(d); }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [handleMove]);

    // Touch/swipe
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        let sx = 0, sy = 0, tracking = false;

        const onStart = (e: TouchEvent) => {
            sx = e.touches[0].clientX;
            sy = e.touches[0].clientY;
            tracking = true;
        };
        const onMove = (e: TouchEvent) => {
            // Prevent scroll while swiping on the board
            if (tracking) e.preventDefault();
        };
        const onEnd = (e: TouchEvent) => {
            if (!tracking) return;
            tracking = false;
            const dx = e.changedTouches[0].clientX - sx;
            const dy = e.changedTouches[0].clientY - sy;
            const ax = Math.abs(dx), ay = Math.abs(dy);
            if (Math.max(ax, ay) < 20) return;
            if (ax > ay) handleMove(dx > 0 ? "right" : "left");
            else handleMove(dy > 0 ? "down" : "up");
        };
        el.addEventListener("touchstart", onStart, { passive: true });
        el.addEventListener("touchmove", onMove, { passive: false });
        el.addEventListener("touchend", onEnd, { passive: true });
        return () => {
            el.removeEventListener("touchstart", onStart);
            el.removeEventListener("touchmove", onMove);
            el.removeEventListener("touchend", onEnd);
        };
    }, [handleMove]);

    const restart = useCallback(() => {
        nextCellId = 0;
        setGrid(initGrid());
        setScore(0);
        setScoreDelta(null);
        setGameOver(false);
        setWon(false);
    }, []);

    // Flatten grid to positioned tiles for rendering
    const tiles: { cell: Cell; row: number; col: number }[] = [];
    for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++) {
            const cell = grid[r][c];
            if (cell) tiles.push({ cell, row: r, col: c });
        }

    return (
        <div className="flex flex-col items-center gap-5 select-none" ref={containerRef}>
            {/* ── Score bar ──────────────────────────── */}
            <div className="flex items-center justify-between w-full max-w-xs px-1">
                <div className="relative flex flex-col items-start">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Score</span>
                    <span className="text-lg font-black tabular-nums text-foreground">{score}</span>
                    <ScorePop delta={scoreDelta} />
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Best</span>
                    <span className="text-lg font-black tabular-nums text-muted-foreground">{highScore}</span>
                </div>
            </div>

            {/* ── Board ──────────────────────────────── */}
            <div
                className="relative rounded-3xl bg-foreground/[0.05] dark:bg-white/[0.04] ring-1 ring-foreground/[0.06] dark:ring-white/[0.08] overflow-hidden"
                style={{ width: BOARD, height: BOARD, padding: PAD }}
            >
                {/* Empty cell backgrounds */}
                <div className="grid grid-cols-4" style={{ gap: GAP }}>
                    {Array.from({ length: SIZE * SIZE }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-2xl bg-foreground/[0.04] dark:bg-white/[0.04]"
                            style={{ width: TILE, height: TILE }}
                        />
                    ))}
                </div>

                {/* Animated tiles - absolutely positioned */}
                <AnimatePresence>
                    {tiles.map(({ cell, row, col }) => {
                        const s = TILE_STYLE[cell.value] || DEFAULT_STYLE;
                        const x = PAD + col * (TILE + GAP);
                        const y = PAD + row * (TILE + GAP);

                        return (
                            <motion.div
                                key={cell.id}
                                initial={cell.merged
                                    ? { scale: 0.85, left: x, top: y }
                                    : { scale: 0, left: x, top: y }
                                }
                                animate={{ scale: 1, left: x, top: y }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={cell.merged
                                    ? { scale: { type: "spring", stiffness: 500, damping: 18 }, left: { duration: 0.12 }, top: { duration: 0.12 } }
                                    : { scale: { type: "spring", stiffness: 400, damping: 22, delay: 0.06 }, left: { duration: 0.12 }, top: { duration: 0.12 } }
                                }
                                className={`
                  absolute rounded-2xl flex items-center justify-center
                  font-extrabold ${tileFont(cell.value)}
                  ${s.bg} ${s.text} shadow-md ${s.shadow}
                  will-change-transform
                `}
                                style={{ width: TILE, height: TILE }}
                            >
                                {cell.value}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* ── Overlays ──────────────────────────── */}
                <AnimatePresence>
                    {won && (
                        <motion.div
                            key="win"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/80 to-violet-600/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-30"
                        >
                            <Trophy className="w-10 h-10 text-yellow-300 drop-shadow-lg" />
                            <p className="text-2xl font-black text-white tracking-tight">You Win!</p>
                            <div className="flex gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setWon(false)}
                                    className="px-5 py-2 rounded-xl bg-white/20 text-white font-semibold text-sm backdrop-blur-sm hover:bg-white/30 transition-colors"
                                >
                                    Keep Playing
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={restart}
                                    className="px-5 py-2 rounded-xl bg-white text-indigo-600 font-semibold text-sm hover:bg-white/90 transition-colors"
                                >
                                    New Game
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {gameOver && (
                        <motion.div
                            key="over"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0 rounded-3xl bg-background/85 dark:bg-background/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-30"
                        >
                            <Frown className="w-10 h-10 text-muted-foreground/60" />
                            <p className="text-xl font-black text-foreground tracking-tight">Game Over</p>
                            <p className="text-sm text-muted-foreground tabular-nums">Final score: {score}</p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={restart}
                                className="px-6 py-2.5 rounded-xl bg-primary/15 text-primary font-bold text-sm hover:bg-primary/25 transition-colors flex items-center gap-2"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Try Again
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Controls hint ──────────────────────── */}
            <p className="text-[10px] text-muted-foreground/60 tracking-wide">
                Arrow keys · WASD · Swipe on mobile
            </p>
        </div>
    );
}
