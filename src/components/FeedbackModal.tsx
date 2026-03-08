/**
 * FeedbackModal.tsx
 *
 * A slide-in modal for submitting user feedback.
 * Category selector + textarea + submit button.
 * Uses the API client to POST /api/feedback.
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/api/apiClient";
import { sanitizeInput } from "@/lib/sanitize";

interface FeedbackModalProps {
    open: boolean;
    onClose: () => void;
}

const CATEGORIES = [
    { value: "general", label: "General" },
    { value: "bug", label: "Bug Report" },
    { value: "feature", label: "Feature Request" },
    { value: "improvement", label: "Improvement" },
    { value: "other", label: "Other" },
] as const;

export default function FeedbackModal({ open, onClose }: FeedbackModalProps) {
    const [message, setMessage] = useState("");
    const [category, setCategory] = useState<string>("general");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = useCallback(async () => {
        const trimmed = message.trim();
        if (trimmed.length < 10) {
            toast.error("Feedback must be at least 10 characters.");
            return;
        }

        setSubmitting(true);
        try {
            await apiClient.post("/api/feedback", {
                message: sanitizeInput(trimmed),
                category,
            });
            toast.success("Thank you for your feedback!");
            setMessage("");
            setCategory("general");
            onClose();
        } catch {
            toast.error("Failed to submit feedback. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }, [message, category, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
                    />

                    {/* Centering wrapper — flex-based for reliable mobile centering */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="
              pointer-events-auto
              w-full max-w-lg
              max-h-[85vh] overflow-y-auto
              bg-white/95 dark:bg-slate-950/95
              backdrop-blur-[64px]
              rounded-3xl shadow-2xl
              ring-1 ring-black/5 dark:ring-white/10
              p-4 sm:p-6
              flex flex-col gap-4 sm:gap-5
            "
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        <MessageSquarePlus className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-foreground">Send Feedback</h2>
                                        <p className="text-[11px] text-muted-foreground">Help us improve Stride</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2 block">
                                    Category
                                </label>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.value}
                                            onClick={() => setCategory(cat.value)}
                                            className={`
                      px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-semibold
                      ring-1 backdrop-blur-xl transition-all duration-200
                      ${category === cat.value
                                                    ? "bg-primary/15 ring-primary/40 text-primary shadow-[0_0_10px_rgba(99,102,241,0.15)]"
                                                    : "ring-white/10 dark:ring-white/10 text-muted-foreground hover:ring-primary/20 bg-foreground/[0.02] dark:bg-white/[0.03]"
                                                }
                    `}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2 block">
                                    Your Feedback
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value.slice(0, 5000))}
                                    placeholder="Tell us what's on your mind…"
                                    rows={5}
                                    className="
                  w-full rounded-2xl p-4 text-sm text-foreground
                  bg-foreground/[0.03] dark:bg-white/[0.04]
                  ring-1 ring-white/10
                  placeholder:text-muted-foreground/50
                  outline-none focus:ring-primary/40 transition-all
                  resize-none
                "
                                />
                                <p className="text-[10px] text-muted-foreground mt-1 text-right">
                                    {message.length}/5000
                                </p>
                            </div>

                            {/* Submit */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                disabled={submitting || message.trim().length < 10}
                                className="
                w-full h-11 rounded-2xl
                bg-gradient-to-r from-indigo-500 to-violet-500
                text-white font-semibold text-sm
                flex items-center justify-center gap-2
                shadow-[0_4px_14px_rgba(99,102,241,0.35)]
                hover:shadow-[0_6px_20px_rgba(99,102,241,0.45)]
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all
              "
                            >
                                <Send className="w-4 h-4" />
                                {submitting ? "Sending…" : "Submit Feedback"}
                            </motion.button>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
