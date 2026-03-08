import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { ArrowLeft, Mail } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";

const emailSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, "Email is required")
        .email("Please enter a valid email")
        .max(255, "Email is too long"),
}).strict();

function SilkInput({
    label, type = "text", value, onChange, placeholder, error, children,
}: {
    label: string; type?: string; value: string; onChange: (v: string) => void;
    placeholder?: string; error?: string; children?: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground tracking-wide uppercase font-['JetBrains_Mono',monospace]">
                {label}
            </label>
            <div className="relative group">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="
            w-full h-12 px-4 rounded-2xl text-sm
            bg-foreground/[0.04] dark:bg-white/[0.06]
            text-foreground placeholder:text-muted-foreground/50
            border-[0.5px] border-black/5 dark:border-white/15
            backdrop-blur-xl
            focus:outline-none focus:ring-2 focus:ring-primary/40 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] focus:border-transparent
            transition-all duration-300
          "
                />
                {children}
            </div>
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-xs text-destructive"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setErrors({});

        const result = emailSchema.safeParse({ email });
        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            result.error.errors.forEach((err) => {
                const key = err.path[0] as string;
                if (!fieldErrors[key]) fieldErrors[key] = err.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setLoading(true);
        try {
            await api.post("/api/auth/forgot-password", { email: email.trim() });
            setSent(true);
            toast.success("If that email is registered, a reset link has been sent.");
        } catch {
            // Even on error, show generic message to prevent enumeration
            toast.info("If that email is registered, a reset link has been sent.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`fixed inset-0 flex ${theme === "dark" ? "mesh-gradient-dark" : "mesh-gradient-light"}`}>
            <div className="m-auto w-full max-w-md px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="
            relative rounded-[28px] p-8
            bg-white/60 dark:bg-white/[0.04]
            backdrop-blur-[80px] backdrop-saturate-[1.8]
            border-[0.5px] border-black/[0.06] dark:border-white/[0.08]
            shadow-[0_24px_80px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.04)]
            dark:shadow-[0_24px_80px_rgba(0,0,0,0.5),0_8px_32px_rgba(0,0,0,0.4)]
          "
                >
                    {/* ── Back to login ── */}
                    <button
                        onClick={() => navigate("/login")}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to login
                    </button>

                    {/* ── Header ── */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                            <Mail className="w-7 h-7 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight mb-1">Forgot your password?</h1>
                        <p className="text-sm text-muted-foreground">
                            {sent
                                ? "Check your inbox for a reset link."
                                : "Enter your email and we'll send a reset link."}
                        </p>
                    </div>

                    {!sent ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <SilkInput
                                label="Email"
                                type="email"
                                value={email}
                                onChange={setEmail}
                                placeholder="you@company.com"
                                error={errors.email}
                            />

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className="
                  w-full h-12 rounded-2xl text-sm font-semibold
                  bg-primary text-primary-foreground
                  shadow-[0_8px_32px_rgba(99,102,241,0.35)]
                  hover:shadow-[0_12px_40px_rgba(99,102,241,0.45)]
                  transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                "
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                ) : (
                                    "Send reset link"
                                )}
                            </motion.button>
                        </form>
                    ) : (
                        <div className="space-y-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                Didn't receive it? Check your spam folder or try again.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSent(false)}
                                className="
                  w-full h-12 rounded-2xl text-sm font-semibold
                  bg-foreground/[0.06] dark:bg-white/[0.08]
                  hover:bg-foreground/[0.1] dark:hover:bg-white/[0.12]
                  text-foreground transition-all duration-300
                "
                            >
                                Try again
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
