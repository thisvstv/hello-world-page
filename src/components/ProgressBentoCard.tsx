import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, CheckCircle2 } from "lucide-react";
import { useProjectData } from "./ProjectDataContext";

export default function ProgressBentoCard() {
  const { projects } = useProjectData();

  const stats = useMemo(() => {
    const total = projects.length;
    if (!total) return { avg: 0, completed: 0, total: 0, onTrack: 0 };
    const avg = Math.round(projects.reduce((s, p) => s + p.progress, 0) / total);
    const completed = projects.filter((p) => p.status === "completed").length;
    const onTrack = projects.filter((p) => p.status === "on-track").length;
    return { avg, completed, total, onTrack };
  }, [projects]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="
        rounded-[2rem] p-6 relative overflow-hidden
        bg-white/40 dark:bg-white/[0.06]
        backdrop-blur-[40px] border-[0.5px] border-black/5 dark:border-white/20
        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08),0_8px_24px_-8px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.6),inset_0_-1px_1px_rgba(0,0,0,0.02)]
        dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5),0_0_30px_rgba(99,102,241,0.05),inset_0_1px_1px_rgba(255,255,255,0.06),inset_0_-1px_1px_rgba(0,0,0,0.2)]
      "
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Overall Progress
        </span>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-5xl font-black tracking-tighter text-foreground">
          {stats.avg}%
        </span>
        {stats.completed > 0 && (
          <span className="text-sm font-medium text-emerald-500 mb-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {stats.completed} done
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
        {stats.onTrack} of {stats.total} projects on track. Average progress across all projects.
      </p>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-foreground/[0.06] dark:bg-white/[0.08] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${stats.avg}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 shadow-neon"
        />
      </div>
    </motion.div>
  );
}
