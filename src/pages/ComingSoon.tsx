import { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Rocket } from "lucide-react";
import { Link } from "react-router-dom";

/* ─── Countdown target: 30 days from now (static demo) ─── */
const LAUNCH_DATE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

function useCountdown(target: Date) {
    const calc = () => {
        const diff = Math.max(0, target.getTime() - Date.now());
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60),
        };
    };
    const [time, setTime] = useState(calc);

    useEffect(() => {
        const id = setInterval(() => setTime(calc), 1000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return time;
}

/* ─── Countdown digit block ─────────────────────────── */
const Digit = memo(function Digit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className="
        w-16 h-16 sm:w-20 sm:h-20 rounded-2xl
        bg-white/[0.04] backdrop-blur-sm
        border border-white/[0.06]
        flex items-center justify-center
        shadow-[0_0_20px_rgba(99,102,241,0.06)]
      ">
                <span className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground tabular-nums">
                    {String(value).padStart(2, "0")}
                </span>
            </div>
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                {label}
            </span>
        </div>
    );
});

/* ═══════════════════════════════════════════════════════
   ComingSoon Page
   ═══════════════════════════════════════════════════════ */
export default function ComingSoon() {
    const countdown = useCountdown(LAUNCH_DATE);
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        // In production, this would POST to an API
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen mesh-gradient-dark flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden selection:bg-primary/20">
            {/* Background effects */}
            <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
            </div>

            {/* Logo */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-2.5 mb-12"
            >
                <div className="w-10 h-10 rounded-2xl overflow-hidden">
                    <img src="/stride-logo.webp" alt="STRIDE" className="w-10 h-10 object-contain" />
                </div>
                <span className="text-lg font-black tracking-tighter text-foreground">STRIDE</span>
            </motion.div>

            {/* Heading */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-center max-w-2xl mx-auto mb-10"
            >
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-[1.08] mb-4">
                    STRIDE is coming
                    <span className="bg-gradient-to-r from-primary via-violet-400 to-primary bg-clip-text text-transparent"> soon.</span>
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground/70 leading-relaxed max-w-md mx-auto">
                    The high-performance workspace for deep work and project mastery.
                </p>
            </motion.div>

            {/* Countdown */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3 sm:gap-5 mb-12"
            >
                <Digit value={countdown.days} label="Days" />
                <span className="text-xl font-bold text-muted-foreground/30 mt-[-1.5rem]">:</span>
                <Digit value={countdown.hours} label="Hours" />
                <span className="text-xl font-bold text-muted-foreground/30 mt-[-1.5rem]">:</span>
                <Digit value={countdown.minutes} label="Min" />
                <span className="text-xl font-bold text-muted-foreground/30 mt-[-1.5rem]">:</span>
                <Digit value={countdown.seconds} label="Sec" />
            </motion.div>

            {/* Progress bar */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="w-full max-w-sm mb-10"
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">Progress</span>
                    <span className="text-[10px] font-bold text-primary">85%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "85%" }}
                        transition={{ duration: 1.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-primary via-violet-500 to-primary shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                    />
                </div>
            </motion.div>

            {/* Email signup */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm"
            >
                {!submitted ? (
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="
                flex-1 h-11 px-4 rounded-2xl text-sm
                bg-white/[0.04] border border-white/[0.08]
                text-foreground placeholder:text-muted-foreground/40
                focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30
                transition-all
              "
                        />
                        <button
                            type="submit"
                            className="
                h-11 px-5 rounded-2xl text-sm font-semibold
                inline-flex items-center gap-1.5
                bg-primary text-primary-foreground
                shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_16px_rgba(99,102,241,0.3)]
                hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_6px_24px_rgba(99,102,241,0.4)]
                active:scale-[0.97] transition-all duration-150
                whitespace-nowrap
              "
                        >
                            Join Waitlist
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-center gap-2 h-11 px-4 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 text-emerald-400 text-sm font-semibold"
                    >
                        <Sparkles className="w-4 h-4" />
                        You're on the list! We'll notify you.
                    </motion.div>
                )}
            </motion.div>

            {/* Footer links */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="mt-16 flex items-center gap-6 text-[11px] text-muted-foreground/30"
            >
                <Link to="/" className="hover:text-muted-foreground transition-colors flex items-center gap-1">
                    <Rocket className="w-3 h-3" />
                    Landing
                </Link>
                <Link to="/auth" className="hover:text-muted-foreground transition-colors">
                    Sign In
                </Link>
            </motion.div>
        </div>
    );
}
