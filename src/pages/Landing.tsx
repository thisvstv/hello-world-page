import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
    ArrowRight,
    BarChart3,
    FolderKanban,
    Sparkles,
    Shield,
    Sun,
    Moon,
    Palette,
    GripVertical,
    ChevronRight,
    RotateCcw,
    EyeOff,
    Timer,
    Calendar,
} from "lucide-react";
import { useRef, type ReactNode } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthContext";

/* ─── Shared animation presets (lightweight) ───────── */
const fadeUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" } as const,
};

const fadeUpTransition = { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const };

/* ─── Bento card wrapper (will-change optimised) ───── */
function BentoCard({
    children,
    className = "",
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    return (
        <motion.div
            {...fadeUp}
            transition={{ ...fadeUpTransition, delay }}
            style={{ willChange: "transform, opacity" }}
            className={`relative rounded-[1.5rem] overflow-hidden
        bg-white/[0.55] dark:bg-white/[0.025]
        silk-blur-bg
        border border-black/[0.06] dark:border-white/[0.06]
        shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none
        group ${className}`}
        >
            {children}
        </motion.div>
    );
}

/* ─── Mini feature icon box ────────────────────────── */
function IconBox({
    icon: Icon,
    gradient,
}: {
    icon: React.ElementType;
    gradient: string;
}) {
    return (
        <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}
        >
            <Icon className="w-[18px] h-[18px] text-white/90" />
        </div>
    );
}

/* ─── Signature Feature Card ───────────────────────── */
function SignatureCard({
    icon: Icon,
    gradient,
    title,
    description,
    visual,
    delay = 0,
}: {
    icon: React.ElementType;
    gradient: string;
    title: string;
    description: string;
    visual?: ReactNode;
    delay?: number;
}) {
    return (
        <BentoCard className="p-7 sm:p-8 flex flex-col" delay={delay}>
            <IconBox icon={Icon} gradient={gradient} />
            <h3 className="text-lg font-bold mt-4 mb-1.5 tracking-tight">{title}</h3>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-5 flex-1">
                {description}
            </p>
            {visual}
        </BentoCard>
    );
}

/* ═══════════════════════════════════════════════════════
   Landing Page
   ═══════════════════════════════════════════════════════ */
export default function Landing() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"],
    });
    const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

    return (
        <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20">
            {/* ── BG ── */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]" />
                <div className="absolute inset-0 bg-background" style={{ mask: "linear-gradient(to bottom, transparent, black 40%)" }} />
            </div>

            {/* ── NAV ── */}
            <nav className="fixed top-0 inset-x-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div
                        className="flex items-center justify-between h-14 mt-3 px-4 rounded-2xl
              bg-background/70 silk-blur-bg
              border border-border/50
              shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_12px_rgba(0,0,0,0.04)]
              dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
                    >
                        <div className="flex items-center gap-2.5">
                            <Link to={user ? "/home" : "/"} className="flex items-center gap-2.5">
                                <img src="/stride-logo.webp" alt="STRIDE" className="w-7 h-7 object-contain" />
                                <span className="text-[15px] font-extrabold tracking-tight">STRIDE</span>
                                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-md bg-primary/15 text-primary ring-1 ring-primary/25">Beta</span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={toggleTheme}
                                className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                            {user ? (
                                <button
                                    onClick={() => navigate("/home")}
                                    className="ml-1 h-8 px-4 rounded-lg text-[13px] font-medium
                      bg-primary text-primary-foreground
                      hover:opacity-90 active:scale-[0.97]
                      transition-all duration-150"
                                >
                                    Go to Home
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate("/auth")}
                                    className="ml-1 h-8 px-4 rounded-lg text-[13px] font-medium
                      bg-foreground text-background
                      hover:opacity-90 active:scale-[0.97]
                      transition-all duration-150"
                                >
                                    Sign in
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* ═══════════ HERO ═══════════ */}
            <section ref={heroRef} className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 px-4">
                <motion.div
                    style={{ y: heroY, opacity: heroOpacity, willChange: "transform, opacity" }}
                    className="max-w-4xl mx-auto text-center"
                >
                    {/* Beta Banner */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full
                          bg-primary/10 dark:bg-primary/15
                          ring-1 ring-primary/20
                          text-primary text-[12px] font-semibold tracking-wide"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Now in Public Beta — Help us shape the future
                    </motion.div>

                    {/* Logo float */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-8"
                        style={{ willChange: "transform, opacity" }}
                    >
                        {/* Glow */}
                        <div className="absolute -inset-6 rounded-full bg-primary/15 blur-3xl opacity-60" />
                        <div className="relative w-full h-full rounded-[1.75rem] bg-gradient-to-br from-white/70 to-white/20 dark:from-white/10 dark:to-white/[0.02] silk-blur-bg ring-1 ring-white/40 dark:ring-white/10 shadow-[0_8px_40px_rgba(99,102,241,0.15)] overflow-hidden p-2.5">
                            <img
                                src="/stride-logo.webp"
                                alt="STRIDE"
                                className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(99,102,241,0.3)]"
                            />
                        </div>
                    </motion.div>

                    {/* Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, ...fadeUpTransition }}
                        className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.04em] leading-[1.05] mb-5"
                    >
                        Plan smarter.{" "}
                        <br className="hidden sm:block" />
                        <span className="bg-gradient-to-r from-primary via-violet-500 to-indigo-400 bg-clip-text text-transparent">
                            Ship faster.
                        </span>
                    </motion.h1>

                    {/* Sub */}
                    <motion.p
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, ...fadeUpTransition }}
                        className="text-[15px] sm:text-lg text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed"
                    >
                        Two powerful modes, one beautiful workspace. Your personal command center — plan, focus, ship.
                    </motion.p>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, ...fadeUpTransition }}
                        className="flex items-center justify-center gap-3"
                    >
                        {user ? (
                            <button
                                onClick={() => navigate("/home")}
                                className="group h-11 px-6 rounded-xl text-[14px] font-semibold inline-flex items-center gap-2
                bg-primary text-primary-foreground
                shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_16px_rgba(99,102,241,0.25)]
                hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_24px_rgba(99,102,241,0.35)]
                active:scale-[0.97] transition-all duration-200"
                            >
                                Go to Home
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate("/auth")}
                                className="group h-11 px-6 rounded-xl text-[14px] font-semibold inline-flex items-center gap-2
                bg-primary text-primary-foreground
                shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_16px_rgba(99,102,241,0.25)]
                hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_24px_rgba(99,102,241,0.35)]
                active:scale-[0.97] transition-all duration-200"
                            >
                                Get started
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        )}
                        <a
                            href="#features"
                            className="h-11 px-5 rounded-xl text-[14px] font-medium inline-flex items-center gap-1.5
                text-muted-foreground hover:text-foreground
                border border-border/60 hover:border-border
                hover:bg-muted/40 transition-all duration-200"
                        >
                            Learn more
                            <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                    </motion.div>

                    {/* Trust line */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="mt-10 flex items-center justify-center gap-6 text-[12px] text-muted-foreground/50 font-medium"
                    >
                        <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" /> Free to use
                        </span>
                        <span className="w-px h-3 bg-border" />
                        <span>No credit card</span>
                        <span className="w-px h-3 bg-border" />
                        <span>Built for modern, focused professionals</span>
                    </motion.div>
                </motion.div>
            </section>

            {/* ═══════════ THE PROBLEM WE SOLVE ═══════════ */}
            <section className="px-4 pb-20 sm:pb-28">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        {...fadeUp}
                        transition={fadeUpTransition}
                        className="text-center mb-14"
                    >
                        <p className="text-[12px] font-semibold text-primary uppercase tracking-widest mb-2">
                            The Problem We Solve
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                            Project management is broken
                        </h2>
                        <p className="text-[15px] sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Most tools force you to pick a side: simple but chaotic, or powerful but
                            suffocating. Neither works when you need to move fast{" "}
                            <em>and</em> stay in control.
                        </p>
                    </motion.div>

                    {/* Two broken extremes */}
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <BentoCard className="p-7 sm:p-8" delay={0}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4">
                                <span className="text-lg" role="img" aria-label="bucket">🪣</span>
                            </div>
                            <h3 className="text-lg font-bold tracking-tight mb-2">
                                Too Basic &rarr; Chaos
                            </h3>
                            <p className="text-[13.5px] text-muted-foreground leading-relaxed">
                                Sticky notes and bare-bones boards feel quick at first — until tasks
                                slip through the cracks, deadlines are missed, and no one knows who
                                owns what. Frictionless shouldn&apos;t mean reckless.
                            </p>
                        </BentoCard>

                        <BentoCard className="p-7 sm:p-8" delay={0.08}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-zinc-700 flex items-center justify-center mb-4">
                                <span className="text-lg" role="img" aria-label="lock">🔒</span>
                            </div>
                            <h3 className="text-lg font-bold tracking-tight mb-2">
                                Too Complex &rarr; Paralysis
                            </h3>
                            <p className="text-[13.5px] text-muted-foreground leading-relaxed">
                                Enterprise behemoths demand setup wizards, mandatory fields, and admin
                                certifications before a single task is created. The tool meant to boost
                                productivity becomes the biggest bottleneck.
                            </p>
                        </BentoCard>
                    </div>

                    {/* The bridge — Stride's answer */}
                    <BentoCard className="p-7 sm:p-9 relative overflow-hidden" delay={0.14}>
                        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-[18px] h-[18px] text-white/90" />
                                </div>
                                <h3 className="text-lg font-bold tracking-tight">
                                    Stride bridges the gap
                                </h3>
                            </div>
                            <p className="text-[14px] text-muted-foreground leading-relaxed mb-6 max-w-2xl">
                                We built Stride because we were tired of choosing between
                                &ldquo;fast but fragile&rdquo; and &ldquo;powerful but painful.&rdquo;
                                The result is a tool that starts simple and scales to advanced —
                                on your terms.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <motion.div
                                    {...fadeUp}
                                    transition={{ ...fadeUpTransition, delay: 0.2 }}
                                    className="flex items-start gap-3 p-4 rounded-xl bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/10"
                                >
                                    <span className="text-lg mt-0.5" role="img" aria-label="lightning">⚡</span>
                                    <div>
                                        <p className="text-[13px] font-semibold text-foreground mb-1">
                                            Quick Start &amp; Ghost Assignees
                                        </p>
                                        <p className="text-[12px] text-muted-foreground leading-relaxed">
                                            Start in seconds: drag-and-drop boards, type a name to
                                            assign — no extra sign-ups, zero friction.
                                            Perfect for rapid ideation and solo planning.
                                        </p>
                                    </div>
                                </motion.div>
                                <motion.div
                                    {...fadeUp}
                                    transition={{ ...fadeUpTransition, delay: 0.28 }}
                                    className="flex items-start gap-3 p-4 rounded-xl bg-violet-500/5 dark:bg-violet-500/10 border border-violet-500/10"
                                >
                                    <Shield className="w-5 h-5 text-violet-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[13px] font-semibold text-foreground mb-1">
                                            Advanced Views &amp; Focus Tools
                                        </p>
                                        <p className="text-[12px] text-muted-foreground leading-relaxed">
                                            Go deeper with Chronos timelines, weekly sprints,
                                            daily focused views, built-in Pomodoro timer,
                                            and full progress analytics.
                                            Total productivity control.
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </BentoCard>
                </div>
            </section>

            {/* ═══════════ SIGNATURE FEATURES (replaces stats) ═══════════ */}
            <section className="px-4 pb-20 sm:pb-28">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        {...fadeUp}
                        transition={fadeUpTransition}
                        className="text-center mb-12"
                    >
                        <p className="text-[12px] font-semibold text-primary uppercase tracking-widest mb-2">
                            Only in STRIDE
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            Features you won&apos;t find elsewhere
                        </h2>
                    </motion.div>

                    <div className="grid sm:grid-cols-3 gap-4">
                        {/* Auto-Rollover Tasks */}
                        <SignatureCard
                            icon={RotateCcw}
                            gradient="from-amber-500 to-orange-600"
                            title="Auto-Rollover Tasks"
                            description="Missed a deadline? Unfinished tasks automatically carry over to the next day so nothing slips through the cracks."
                            delay={0}
                            visual={
                                <div className="space-y-2">
                                    {["Monday", "Tuesday"].map((day, i) => (
                                        <motion.div
                                            key={day}
                                            {...fadeUp}
                                            transition={{ ...fadeUpTransition, delay: 0.15 + i * 0.1 }}
                                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-background/60 dark:bg-white/[0.03] border border-border/40"
                                        >
                                            <div className={`w-2 h-2 rounded-full ${i === 0 ? "bg-amber-500" : "bg-emerald-500"}`} />
                                            <span className="text-[12px] text-foreground/70 flex-1">{day}</span>
                                            {i === 0 && <RotateCcw className="w-3 h-3 text-amber-500" />}
                                            {i === 1 && (
                                                <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                    Active
                                                </span>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            }
                        />

                        {/* Cyber-Stealth Mode */}
                        <SignatureCard
                            icon={EyeOff}
                            gradient="from-slate-600 to-zinc-800"
                            title="Cyber-Stealth Mode"
                            description="Press Shift+S to instantly blur all sensitive content. Hover to reveal — perfect for screen-sharing or public spaces."
                            delay={0.08}
                            visual={
                                <div className="space-y-2">
                                    <motion.div
                                        {...fadeUp}
                                        transition={{ ...fadeUpTransition, delay: 0.25 }}
                                        className="px-3.5 py-2.5 rounded-xl bg-background/60 dark:bg-white/[0.03] border border-border/40"
                                    >
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <EyeOff className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Stealth Active</span>
                                        </div>
                                        <div className="h-3 rounded bg-muted-foreground/10 blur-[3px]" />
                                        <div className="h-2 rounded bg-muted-foreground/[0.08] blur-[3px] mt-1 w-2/3" />
                                    </motion.div>
                                    <motion.p
                                        {...fadeUp}
                                        transition={{ ...fadeUpTransition, delay: 0.35 }}
                                        className="text-[10px] text-muted-foreground/50 text-center font-mono"
                                    >
                                        <kbd className="px-1.5 py-0.5 rounded bg-muted/60 text-[9px] font-semibold">Shift</kbd>
                                        {" + "}
                                        <kbd className="px-1.5 py-0.5 rounded bg-muted/60 text-[9px] font-semibold">S</kbd>
                                    </motion.p>
                                </div>
                            }
                        />

                        {/* Focus Pomodoro Timer */}
                        <SignatureCard
                            icon={Timer}
                            gradient="from-rose-500 to-pink-600"
                            title="Focus Pomodoro Timer"
                            description="Lock into deep work with a built-in 25/5 timer. Attach it to any task and watch your productivity soar."
                            delay={0.16}
                            visual={
                                <div className="flex flex-col items-center gap-3">
                                    <motion.div
                                        {...fadeUp}
                                        transition={{ ...fadeUpTransition, delay: 0.3 }}
                                        className="relative w-20 h-20"
                                    >
                                        {/* Timer ring */}
                                        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                                            <circle cx="40" cy="40" r="34" fill="none" strokeWidth="4" className="stroke-muted/30" />
                                            <motion.circle
                                                cx="40" cy="40" r="34" fill="none" strokeWidth="4"
                                                strokeLinecap="round"
                                                className="stroke-rose-500"
                                                strokeDasharray={2 * Math.PI * 34}
                                                initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                                                whileInView={{ strokeDashoffset: 2 * Math.PI * 34 * 0.2 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-sm font-bold font-mono text-foreground">20:00</span>
                                        </div>
                                    </motion.div>
                                    <motion.p
                                        {...fadeUp}
                                        transition={{ ...fadeUpTransition, delay: 0.4 }}
                                        className="text-[10px] text-muted-foreground/50 font-medium"
                                    >
                                        Focus session in progress
                                    </motion.p>
                                </div>
                            }
                        />
                    </div>
                </div>
            </section>

            {/* ═══════════ TWO MODES ═══════════ */}
            <section className="px-4 pb-20 sm:pb-28">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        {...fadeUp}
                        transition={fadeUpTransition}
                        className="text-center mb-12"
                    >
                        <p className="text-[12px] font-semibold text-primary uppercase tracking-widest mb-2">
                            Your Workflow, Your Way
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            Quick start or deep dive. You choose.
                        </h2>
                        <p className="text-[15px] text-muted-foreground mt-3 max-w-lg mx-auto leading-relaxed">
                            Whether you need a quick visual board or full sprint planning, STRIDE adapts to the way you work best.
                        </p>
                    </motion.div>

                    <div className="max-w-lg mx-auto">
                        {/* Deep Planning */}
                        <BentoCard className="p-7 sm:p-8" delay={0}>
                            <IconBox icon={Calendar} gradient="from-violet-500 to-purple-600" />
                            <h3 className="text-lg font-bold mt-4 mb-1.5 tracking-tight">Deep Planning</h3>
                            <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-4">
                                Weekly sprints, Chronos timelines, daily focused views, and rich project notes.
                                Built for ambitious creators who need structure and velocity.
                            </p>
                            {/* Visual: mini timeline */}
                            <div className="space-y-2">
                                {[
                                    { label: "Sprint 1 — Week 1", pct: 100, color: "bg-emerald-500" },
                                    { label: "Sprint 1 — Week 2", pct: 72, color: "bg-primary" },
                                    { label: "Sprint 2 — Week 1", pct: 30, color: "bg-violet-500" },
                                ].map((row, ri) => (
                                    <motion.div key={row.label} {...fadeUp} transition={{ ...fadeUpTransition, delay: 0.2 + ri * 0.08 }}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] text-muted-foreground font-medium">{row.label}</span>
                                            <span className="text-[10px] font-semibold text-foreground/60">{row.pct}%</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                                            <motion.div className={`h-full rounded-full ${row.color}`}
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${row.pct}%` }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.4 + ri * 0.1, duration: 0.8, ease: "easeOut" }}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            {/* Advanced extras callout */}
                            <motion.div {...fadeUp} transition={{ ...fadeUpTransition, delay: 0.45 }}
                                className="mt-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-violet-500/5 dark:bg-violet-500/10 border border-violet-500/10">
                                <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                                <p className="text-[11px] text-violet-700 dark:text-violet-300 font-medium">
                                    Auto-rollover, focus timer, stealth mode &amp; real-time analytics included.
                                </p>
                            </motion.div>
                        </BentoCard>
                    </div>
                </div>
            </section>

            {/* ═══════════ BENTO FEATURES ═══════════ */}
            <section id="features" className="px-4 pb-20 sm:pb-28">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        {...fadeUp}
                        transition={fadeUpTransition}
                        className="text-center mb-12"
                    >
                        <p className="text-[12px] font-semibold text-primary uppercase tracking-widest mb-2">Features</p>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            Everything, in one place
                        </h2>
                    </motion.div>

                    {/* Row 1: 2 large cards */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        {/* Card: Projects */}
                        <BentoCard className="p-7 sm:p-8" delay={0}>
                            <IconBox icon={FolderKanban} gradient="from-indigo-500 to-violet-600" />
                            <h3 className="text-lg font-bold mt-4 mb-1.5 tracking-tight">Smart Projects</h3>
                            <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-5">
                                Break work into weekly sprints. Each project gets its own timeline,
                                task board, and progress tracker — no clutter.
                            </p>
                            {/* Mini visual: fake task cards */}
                            <div className="space-y-2">
                                {["Design landing page", "API integration", "User testing"].map((t, i) => (
                                    <motion.div
                                        key={t}
                                        {...fadeUp}
                                        transition={{ ...fadeUpTransition, delay: 0.15 + i * 0.08 }}
                                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl
                      bg-background/60 dark:bg-white/[0.03]
                      border border-border/40"
                                    >
                                        <div
                                            className={`w-2 h-2 rounded-full ${i === 0
                                                ? "bg-emerald-500"
                                                : i === 1
                                                    ? "bg-amber-500"
                                                    : "bg-muted-foreground/30"
                                                }`}
                                        />
                                        <span className="text-[13px] text-foreground/80">{t}</span>
                                        {i === 0 && (
                                            <span className="ml-auto text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                Done
                                            </span>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </BentoCard>

                        {/* Card: Analytics */}
                        <BentoCard className="p-7 sm:p-8" delay={0.06}>
                            <IconBox icon={BarChart3} gradient="from-emerald-500 to-teal-600" />
                            <h3 className="text-lg font-bold mt-4 mb-1.5 tracking-tight">Progress Tracking</h3>
                            <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-5">
                                Track progress across projects at a glance. Completion rates, daily
                                streaks, and visual progress — all in real-time.
                            </p>
                            {/* Mini visual: progress bars */}
                            <div className="space-y-3">
                                {[
                                    { label: "This week", pct: 78, color: "bg-primary" },
                                    { label: "Sprint 4", pct: 93, color: "bg-emerald-500" },
                                    { label: "Overall", pct: 61, color: "bg-violet-500" },
                                ].map((bar, i) => (
                                    <motion.div
                                        key={bar.label}
                                        {...fadeUp}
                                        transition={{ ...fadeUpTransition, delay: 0.2 + i * 0.1 }}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[12px] text-muted-foreground">{bar.label}</span>
                                            <span className="text-[12px] font-semibold text-foreground/70">{bar.pct}%</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                                            <motion.div
                                                className={`h-full rounded-full ${bar.color}`}
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${bar.pct}%` }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </BentoCard>
                    </div>

                    {/* Row 2: 3 smaller cards */}
                    <div className="grid sm:grid-cols-3 gap-4 mb-4">
                        <BentoCard className="p-6" delay={0.08}>
                            <IconBox icon={GripVertical} gradient="from-rose-500 to-pink-600" />
                            <h3 className="text-[15px] font-bold mt-3.5 mb-1 tracking-tight">Drag & Drop</h3>
                            <p className="text-[13px] text-muted-foreground leading-relaxed">
                                Reorder, reprioritise, reschedule — just grab and move. Natural and fast.
                            </p>
                        </BentoCard>

                        <BentoCard className="p-6" delay={0.12}>
                            <IconBox icon={Timer} gradient="from-sky-500 to-blue-600" />
                            <h3 className="text-[15px] font-bold mt-3.5 mb-1 tracking-tight">Focus Timer</h3>
                            <p className="text-[13px] text-muted-foreground leading-relaxed">
                                Built-in Pomodoro timer to protect deep work sessions and track focus streaks.
                            </p>
                        </BentoCard>

                        <BentoCard className="p-6" delay={0.16}>
                            <IconBox icon={Shield} gradient="from-violet-500 to-purple-600" />
                            <h3 className="text-[15px] font-bold mt-3.5 mb-1 tracking-tight">Secure &amp; Private</h3>
                            <p className="text-[13px] text-muted-foreground leading-relaxed">
                                E2E encryption, bcrypt auth &amp; rate-limited APIs — your data stays yours.
                            </p>
                        </BentoCard>
                    </div>

                    {/* Row 3: Wide personalisation card */}
                    <BentoCard className="p-7 sm:p-8" delay={0.18}>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                            <div className="flex-1">
                                <IconBox icon={Palette} gradient="from-amber-500 to-orange-600" />
                                <h3 className="text-lg font-bold mt-4 mb-1.5 tracking-tight">Make it yours</h3>
                                <p className="text-[13.5px] text-muted-foreground leading-relaxed">
                                    Choose from 6 accent themes. Switch between dark and light. Every pixel adapts to your taste —
                                    glassmorphism, gradients, and all.
                                </p>
                            </div>
                            {/* Color swatches visual */}
                            <div className="flex sm:flex-col gap-2 sm:pt-2">
                                {[
                                    "bg-indigo-500",
                                    "bg-rose-500",
                                    "bg-emerald-500",
                                    "bg-amber-500",
                                    "bg-sky-500",
                                    "bg-violet-500",
                                ].map((c, i) => (
                                    <motion.div
                                        key={c}
                                        initial={{ scale: 0 }}
                                        whileInView={{ scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 + i * 0.05, type: "spring", stiffness: 300, damping: 15 }}
                                        className={`w-8 h-8 rounded-lg ${c} ring-2 ring-background shadow-md`}
                                    />
                                ))}
                            </div>
                        </div>
                    </BentoCard>
                </div>
            </section>

            {/* ═══════════ FINAL CTA ═══════════ */}
            <section className="px-4 pb-24 sm:pb-32">
                <motion.div
                    {...fadeUp}
                    transition={fadeUpTransition}
                    className="max-w-2xl mx-auto text-center"
                >
                    {/* Logo */}
                    <div className="w-14 h-14 mx-auto mb-6 relative">
                        <div className="absolute -inset-4 rounded-full bg-primary/10 blur-2xl" />
                        <img
                            src="/stride-logo.webp"
                            alt=""
                            className="relative w-full h-full object-contain drop-shadow-[0_2px_12px_rgba(99,102,241,0.3)]"
                        />
                    </div>

                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                        Ready to move faster?
                    </h2>
                    <p className="text-muted-foreground text-[15px] mb-7 max-w-sm mx-auto">
                        Start organising your work in seconds. Free, no credit card required.
                    </p>

                    <button
                        onClick={() => navigate(user ? "/home" : "/auth")}
                        className="group h-12 px-8 rounded-xl text-[15px] font-semibold inline-flex items-center gap-2
              bg-primary text-primary-foreground
              shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_16px_rgba(99,102,241,0.25)]
              hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_28px_rgba(99,102,241,0.4)]
              active:scale-[0.97] transition-all duration-200"
                    >
                        {user ? "Go to Home" : "Get started — it\u0027s free"}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </motion.div>
            </section>

        </main>
    );
}
