import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { Eye, EyeOff, ArrowLeft, KeyRound } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/axios";

const resetSchema = z
    .object({
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(128, "Password is too long")
            .regex(/[A-Z]/, "Must contain an uppercase letter")
            .regex(/[0-9]/, "Must contain a number"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .strict()
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

function getStrength(pw: string): { score: number; label: string; color: string } {
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 1) return { score: s, label: "Weak", color: "bg-destructive" };
    if (s <= 3) return { score: s, label: "Fair", color: "bg-amber-500" };
    return { score: s, label: "Strong", color: "bg-emerald-500" };
}

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

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const strength = useMemo(() => getStrength(password), [password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setErrors({});

        if (!token) {
            toast.error("Invalid or missing reset token.");
            return;
        }

        const result = resetSchema.safeParse({ password, confirmPassword });
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
            await api.post("/api/auth/reset-password", { token, password, confirmPassword });
            toast.success("Password has been reset. Please log in with your new password.");
            navigate("/login");
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                || "Reset failed. The link may have expired.";
            toast.error(message);
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
                            <KeyRound className="w-7 h-7 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight mb-1">Reset your password</h1>
                        <p className="text-sm text-muted-foreground">
                            Choose a strong new password for your account.
                        </p>
                    </div>

                    {!token ? (
                        <div className="text-center space-y-4">
                            <p className="text-sm text-destructive">
                                No reset token found. Please use the link from your email.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate("/forgot-password")}
                                className="
                  w-full h-12 rounded-2xl text-sm font-semibold
                  bg-primary text-primary-foreground
                  shadow-[0_8px_32px_rgba(99,102,241,0.35)]
                  transition-all duration-300
                "
                            >
                                Request a new link
                            </motion.button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <SilkInput
                                    label="New password"
                                    type={showPw ? "text" : "password"}
                                    value={password}
                                    onChange={setPassword}
                                    placeholder="••••••••"
                                    error={errors.password}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(!showPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </SilkInput>
                                {/* Strength meter */}
                                {password.length > 0 && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex-1 h-1.5 rounded-full bg-foreground/[0.06] dark:bg-white/[0.06] overflow-hidden flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`flex-1 rounded-full transition-all duration-300 ${i < strength.score ? strength.color : "bg-transparent"}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-medium text-muted-foreground">{strength.label}</span>
                                    </div>
                                )}
                            </div>

                            <SilkInput
                                label="Confirm password"
                                type={showConfirmPw ? "text" : "password"}
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                placeholder="••••••••"
                                error={errors.confirmPassword}
                            >
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </SilkInput>

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
                                    "Reset password"
                                )}
                            </motion.button>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
