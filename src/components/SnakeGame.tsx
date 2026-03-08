/**
 * SnakeGame.tsx
 *
 * Pure React canvas-based Snake game.
 * Controls: Arrow keys or WASD.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";

const GRID_SIZE = 20;
const CELL_SIZE = 16;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const INITIAL_SPEED = 120;

type Point = { x: number; y: number };
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

const OPPOSITE: Record<Direction, Direction> = {
    UP: "DOWN",
    DOWN: "UP",
    LEFT: "RIGHT",
    RIGHT: "LEFT",
};

function randomFood(snake: Point[]): Point {
    let food: Point;
    do {
        food = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
        };
    } while (snake.some((s) => s.x === food.x && s.y === food.y));
    return food;
}

export default function SnakeGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<"waiting" | "playing" | "done">("waiting");
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        const saved = localStorage.getItem("stride_snake_high");
        return saved ? parseInt(saved, 10) : 0;
    });

    const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]);
    const foodRef = useRef<Point>(randomFood(snakeRef.current));
    const dirRef = useRef<Direction>("RIGHT");
    const nextDirRef = useRef<Direction>("RIGHT");
    const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const scoreRef = useRef(0);

    const draw = useCallback(() => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        // Background
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-background") || "#0a0a0f";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Grid
        ctx.strokeStyle = "rgba(255,255,255,0.03)";
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL_SIZE, 0);
            ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * CELL_SIZE);
            ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
            ctx.stroke();
        }

        // Food
        const food = foodRef.current;
        ctx.fillStyle = "#f43f5e";
        ctx.shadowColor = "#f43f5e";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(food.x * CELL_SIZE + 2, food.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4, 4);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Snake
        snakeRef.current.forEach((seg, i) => {
            const t = i / Math.max(snakeRef.current.length - 1, 1);
            ctx.fillStyle = i === 0
                ? "#818cf8"
                : `rgba(99, 102, 241, ${0.9 - t * 0.5})`;
            ctx.shadowColor = i === 0 ? "#6366f1" : "transparent";
            ctx.shadowBlur = i === 0 ? 6 : 0;
            ctx.beginPath();
            ctx.roundRect(seg.x * CELL_SIZE + 1, seg.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2, i === 0 ? 5 : 3);
            ctx.fill();
        });
        ctx.shadowBlur = 0;
    }, []);

    const tick = useCallback(() => {
        const snake = snakeRef.current;
        dirRef.current = nextDirRef.current;
        const head = snake[0];
        const dir = dirRef.current;

        const newHead: Point = {
            x: head.x + (dir === "RIGHT" ? 1 : dir === "LEFT" ? -1 : 0),
            y: head.y + (dir === "DOWN" ? 1 : dir === "UP" ? -1 : 0),
        };

        // Wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
            endGame();
            return;
        }

        // Self collision
        if (snake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
            endGame();
            return;
        }

        const newSnake = [newHead, ...snake];
        const food = foodRef.current;

        if (newHead.x === food.x && newHead.y === food.y) {
            scoreRef.current += 10;
            setScore(scoreRef.current);
            foodRef.current = randomFood(newSnake);
        } else {
            newSnake.pop();
        }

        snakeRef.current = newSnake;
        draw();
    }, [draw]);

    const endGame = useCallback(() => {
        if (gameLoopRef.current) {
            clearInterval(gameLoopRef.current);
            gameLoopRef.current = null;
        }
        setGameState("done");
        if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
            localStorage.setItem("stride_snake_high", String(scoreRef.current));
        }
    }, [highScore]);

    const startGame = useCallback(() => {
        snakeRef.current = [{ x: 10, y: 10 }];
        foodRef.current = randomFood(snakeRef.current);
        dirRef.current = "RIGHT";
        nextDirRef.current = "RIGHT";
        scoreRef.current = 0;
        setScore(0);
        setGameState("playing");
        draw();
    }, [draw]);

    // Game loop
    useEffect(() => {
        if (gameState !== "playing") return;
        gameLoopRef.current = setInterval(tick, INITIAL_SPEED);
        return () => {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        };
    }, [gameState, tick]);

    // Keyboard
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const map: Record<string, Direction> = {
                ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT",
                w: "UP", s: "DOWN", a: "LEFT", d: "RIGHT",
                W: "UP", S: "DOWN", A: "LEFT", D: "RIGHT",
            };
            const newDir = map[e.key];
            if (!newDir) return;
            e.preventDefault();
            if (newDir !== OPPOSITE[dirRef.current]) {
                nextDirRef.current = newDir;
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    // Initial draw
    useEffect(() => { draw(); }, [draw]);

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-between w-full px-2">
                <div className="text-sm font-bold text-foreground tabular-nums">Score: {score}</div>
                <div className="text-xs text-muted-foreground tabular-nums">Best: {highScore}</div>
            </div>

            <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-lg">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_SIZE}
                    height={CANVAS_SIZE}
                    className="block"
                    style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
                />
            </div>

            {gameState === "waiting" && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startGame}
                    className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg"
                >
                    Start Game
                </motion.button>
            )}

            {gameState === "done" && (
                <div className="flex flex-col items-center gap-3">
                    <p className="text-sm text-muted-foreground">Game Over!</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startGame}
                        className="px-6 py-2.5 rounded-xl bg-primary/15 text-primary font-semibold text-sm"
                    >
                        Play Again
                    </motion.button>
                </div>
            )}

            {gameState === "playing" && (
                <p className="text-[10px] text-muted-foreground">Use Arrow keys or WASD</p>
            )}
        </div>
    );
}
