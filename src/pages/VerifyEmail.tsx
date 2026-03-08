import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, RotateCw, CheckCircle2, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthContext";
import { useTheme } from "@/components/ThemeProvider";

const CODE_LENGTH = 6;

export default function VerifyEmail() {
    const { user, verifyEmail, resendVerification, loading: authLoading } = useAuth();
    const { theme, toggleTheme: toggleThemeContext } = useTheme();
    const navigate = useNavigate();

    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const toggleTheme = () => toggleThemeContext();

    // If user is already verified, redirect to home
    useEffect(() => {
        if (!authLoading && user?.isVerified) {
            navigate("/home", { replace: true });
        }
    }, [user?.isVerified, authLoading, navigate]);

    // If no user at all, redirect to login
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login", { replace: true });
        }
    }, [user, authLoading, navigate]);

    // Cooldown timer for resend
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleChange = useCallback((index: number, value: string) => {
        // Only allow digits
        const digit = value.replace(/\D/g, "").slice(-1);
        setDigits((prev) => {
            const next = [...prev];
            next[index] = digit;
            return next;
        });
        // Auto-advance to next input
        if (digit && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    }, []);

    const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }, [digits]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
        if (!pasted) return;
        const newDigits = Array(CODE_LENGTH).fill("");
        for (let i = 0; i < pasted.length; i++) newDigits[i] = pasted[i];
        setDigits(newDigits);
        // Focus the last filled input or the next empty one
        const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
        inputRefs.current[focusIdx]?.focus();
    }, []);

    const code = digits.join("");
    const isComplete = code.length === CODE_LENGTH;

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!isComplete || loading) return;

        setLoading(true);
        const res = await verifyEmail(code);
        setLoading(false);

        if (res.success) {
            toast.success("Email verified! Welcome to STRIDE.");
            navigate("/home", { replace: true });
        } else {
            toast.error(res.error);
            // Clear inputs on error
            setDigits(Array(CODE_LENGTH).fill(""));
            inputRefs.current[0]?.focus();
        }
    };

    const handleResend = async () => {
        if (resending || cooldown > 0) return;
        setResending(true);
        const res = await resendVerification();
        setResending(false);

        if (res.success) {
            toast.success("New verification code sent! Check your email.");
            setCooldown(60); // 60 second cooldown
            setDigits(Array(CODE_LENGTH).fill(""));
            inputRefs.current[0]?.focus();
        } else {
            toast.error(res.error);
        }
    };

    // Auto-submit when all digits are filled
    useEffect(() => {
        if (isComplete && !loading) {
            handleSubmit();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isComplete]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-1 items-center justify-center min-h-[100dvh] bg-gray-50 dark:bg-[#0a0a0f]">
            {/* Theme toggle */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.08 }}
                onClick={toggleTheme}
                className="
          fixed top-5 right-5 z-50 w-10 h-10 rounded-xl
          flex items-center justify-center
          bg-black/[0.06] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08]
          text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white
          transition-all duration-300
        "
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={theme}
                        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.3 }}
                    >
                        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </motion.div>
                </AnimatePresence>
            </motion.button>

            <div className="w-full max-w-[440px] flex flex-col px-6 sm:px-8">
                {/* Logo */}
                <div className="flex items-center gap-2.5 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-600/20 flex items-center justify-center ring-1 ring-indigo-500/20 dark:ring-indigo-500/30 overflow-hidden">
                        <img src="/stride-logo.webp" alt="STRIDE" className="w-6 h-6 object-contain" />
                    </div>
                    <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">STRIDE</span>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 dark:bg-indigo-600/20 flex items-center justify-center ring-1 ring-indigo-500/20 dark:ring-indigo-500/30 mb-6">
                        <CheckCircle2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                    </div>

                    <h1 className="text-[28px] font-bold tracking-tight text-gray-900 dark:text-white mb-1">
                        Verify your email
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-neutral-400 mb-8">
                        We sent a 6-digit code to{" "}
                        <span className="font-medium text-gray-900 dark:text-white">{user?.email ?? "your email"}</span>.
                        Enter it below to activate your account.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* OTP inputs */}
                        <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
                            {digits.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => { inputRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    className="
                    w-12 h-14 text-center text-xl font-bold
                    rounded-xl border border-gray-200 dark:border-white/[0.08]
                    bg-white dark:bg-white/[0.03]
                    text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                    transition-all duration-200
                    placeholder:text-gray-300 dark:placeholder:text-neutral-600
                  "
                                    placeholder="·"
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>

                        {/* Verify button */}
                        <motion.button
                            type="submit"
                            disabled={!isComplete || loading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="
                w-full h-11 rounded-xl text-sm font-semibold
                bg-indigo-600 hover:bg-indigo-500 text-white
                shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]
                disabled:opacity-50 disabled:pointer-events-none
                flex items-center justify-center gap-2 transition-all duration-300
              "
                        >
                            {loading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                />
                            ) : (
                                <>
                                    Verify Email
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Resend */}
                    <div className="mt-6 text-center">
                        <span className="text-sm text-gray-500 dark:text-neutral-500">
                            Didn't receive the code?{" "}
                        </span>
                        <button
                            onClick={handleResend}
                            disabled={resending || cooldown > 0}
                            className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                        >
                            {resending ? (
                                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                            ) : cooldown > 0 ? (
                                `Resend in ${cooldown}s`
                            ) : (
                                "Resend code"
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* Bottom copyright */}
                <div className="mt-8">
                    <p className="text-[11px] text-gray-400 dark:text-neutral-600">&copy; {new Date().getFullYear()} Stride Technologies. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
