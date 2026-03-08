import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { Eye, EyeOff, ArrowRight, Sun, Moon } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "sonner";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

// ── Zod Schemas ─────────────────────────────────────
const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Please enter a valid email")
  .max(255, "Email is too long");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[0-9]/, "Must contain a number");

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
}).strict();

const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Name is too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
  jobTitle: z
    .string()
    .trim()
    .min(1, "Job title is required")
    .max(80, "Job title is too long"),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).strict().refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ── Strength meter ──────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: s, label: "Weak", color: "bg-red-500" };
  if (s <= 3) return { score: s, label: "Fair", color: "bg-amber-500" };
  return { score: s, label: "Strong", color: "bg-emerald-500" };
}

// ── Silk Input ──────────────────────────────────────
function SilkInput({
  label, type = "text", value, onChange, placeholder, error, children,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; children?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-gray-500 dark:text-neutral-400 tracking-widest uppercase">
        {label}
      </label>
      <div className="relative group">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="
            w-full h-11 px-4 rounded-xl text-sm
            bg-gray-100 dark:bg-white/[0.06] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-500
            border border-gray-200 dark:border-white/[0.08]
            focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
            focus:shadow-[0_0_20px_rgba(99,102,241,0.15)]
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
            className="text-xs text-red-500 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}


// ── Main Auth Page ──────────────────────────────────
export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">(
    searchParams.get("mode") === "register" ? "register" : "login"
  );
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = useMemo(() => getStrength(password), [password]);
  const { theme, toggleTheme } = useTheme();

  const toggle = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setErrors({});
    setConfirmPassword("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrors({});

    const schema = mode === "login" ? loginSchema : registerSchema;
    const data = mode === "login" ? { email, password } : { fullName, jobTitle, email, password, confirmPassword };
    const result = schema.safeParse(data);

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
    setTimeout(async () => {
      if (mode === "login") {
        const res = await login(email, password);
        setLoading(false);
        if (!res.success) {
          toast.error(res.error);
        }
      } else {
        const res = await register(email, password, fullName, jobTitle);
        setLoading(false);
        if (res.success) {
          navigate("/verify-email");
        } else {
          toast.error(res.error);
        }
      }
    }, 600);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 dark:bg-[#0a0a0f]">
      {/* ── Auth Navbar ── */}
      <nav className="w-full px-6 py-4 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-gray-200 dark:ring-white/10 shadow-sm">
            <img src="/stride-logo.webp" alt="STRIDE" className="w-full h-full object-contain" />
          </div>
          <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">STRIDE</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/about"
            className="text-xs font-medium text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            About
          </Link>
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            onClick={toggleTheme}
            className="
              w-9 h-9 rounded-xl flex items-center justify-center
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
        </div>
      </nav>

      {/* ═══ Centered Auth Form ═══ */}
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[440px] flex flex-col px-6 sm:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-600/20 flex items-center justify-center ring-1 ring-indigo-500/20 dark:ring-indigo-500/30 overflow-hidden">
              <img src="/stride-logo.webp" alt="STRIDE" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">STRIDE</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "login" ? 16 : -16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <h1 className="text-[28px] font-bold tracking-tight text-gray-900 dark:text-white mb-1">
                {mode === "login" ? "Welcome back" : "Create account"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-neutral-400 mb-8">
                {mode === "login"
                  ? "Sign in to continue to your workspace"
                  : "Start building your productivity system"}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <>
                    <SilkInput label="Full Name" value={fullName} onChange={setFullName} placeholder="John Doe" error={errors.fullName} />
                    <SilkInput label="Job Title" value={jobTitle} onChange={setJobTitle} placeholder="Frontend Developer" error={errors.jobTitle} />
                  </>
                )}

                <SilkInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" error={errors.email} />

                <div className="space-y-2">
                  <SilkInput label="Password" type={showPw ? "text" : "password"} value={password} onChange={setPassword} placeholder="••••••••" error={errors.password}>
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-white transition-colors">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </SilkInput>

                  {mode === "register" && password.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1.5">
                      <div className="flex gap-1 h-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : "bg-gray-200 dark:bg-white/[0.08]"}`} />
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-neutral-500">Strength: {strength.label}</p>
                    </motion.div>
                  )}
                </div>

                {mode === "register" && (
                  <SilkInput label="Confirm Password" type={showConfirmPw ? "text" : "password"} value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" error={errors.confirmPassword}>
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-white transition-colors">
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </SilkInput>
                )}

                {mode === "login" && (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => navigate("/forgot-password")} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                      Forgot password?
                    </button>
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
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
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <>
                      {mode === "login" ? "Sign In" : "Create Account"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <span className="text-sm text-gray-500 dark:text-neutral-500">
                  {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                </span>
                <button onClick={toggle} className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom copyright */}
          <div className="mt-8">
            <p className="text-[11px] text-gray-400 dark:text-neutral-600">&copy; {new Date().getFullYear()} Stride Technologies. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
