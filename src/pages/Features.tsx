import { Link } from "react-router-dom";
import { ArrowLeft, FolderKanban, Timer, Calendar, Shield, Kanban, EyeOff, RotateCcw, BarChart3, Palette, Sparkles } from "lucide-react";

const features = [
  {
    icon: FolderKanban,
    title: "Solo Kanban Boards",
    desc: "Create unlimited projects with drag-and-drop Kanban boards. Organize tasks into customizable columns, set priorities, add subtasks, and track progress visually — all in a clean, distraction-free interface.",
    gradient: "from-indigo-500 to-violet-600",
  },
  {
    icon: Calendar,
    title: "Chronos Timeline",
    desc: "Plan your work in weekly sprints with the Chronos timeline view. See your tasks mapped across time, identify bottlenecks at a glance, and keep your projects on track with visual progress indicators.",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    icon: Timer,
    title: "Focus Pomodoro Timer",
    desc: "Lock into deep work with the built-in 25/5 Pomodoro timer. Attach it to any task, track your focus sessions, and build a daily productivity rhythm that helps you consistently ship great work.",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    icon: Shield,
    title: "Secure Authentication",
    desc: "Bank-grade security from day one. Passwords hashed with bcrypt, short-lived JWT tokens with automatic refresh, CSRF protection on every endpoint, and rate limiting to prevent brute-force attacks.",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: Kanban,
    title: "Daily Focused View",
    desc: "Start each day with a focused view of what matters most. See today's tasks, carry over unfinished items, and maintain a clear sense of progress without the noise of your entire backlog.",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    icon: EyeOff,
    title: "Cyber-Stealth Mode",
    desc: "Press Shift+S to instantly blur all sensitive content on screen. Hover to reveal individual items. Perfect for demo calls, screen-sharing sessions, or working in public spaces.",
    gradient: "from-slate-600 to-zinc-800",
  },
  {
    icon: RotateCcw,
    title: "Auto-Rollover Tasks",
    desc: "Missed a deadline? No problem. Unfinished tasks automatically carry over to the next day so nothing slips through the cracks. Your board stays clean and your focus stays sharp.",
    gradient: "from-purple-500 to-fuchsia-600",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    desc: "Track your productivity with real-time analytics. See completion rates, daily streaks, weekly output, and sprint-level progress — all presented in clean, actionable dashboards.",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    icon: Palette,
    title: "Themes & Personalization",
    desc: "Choose from 6 accent color themes and switch between dark and light mode. Every element adapts — glassmorphism, gradients, and all. Make Stride feel like it was designed just for you.",
    gradient: "from-pink-500 to-rose-600",
  },
];

export default function Features() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#0a0a0f] text-gray-900 dark:text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="h-4 w-px bg-gray-200 dark:bg-white/10" />
          <span className="text-sm font-semibold">Features</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16 sm:py-24">
        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">Features</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
          Everything you need.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Nothing you don't.</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-neutral-400 leading-relaxed mb-16 max-w-2xl">
          Stride is built for focus. Every feature is designed to help you plan smarter and ship faster — without the bloat of enterprise tools.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-indigo-300 dark:hover:border-indigo-500/20 transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4`}>
                <f.icon className="w-5 h-5 text-white/90" />
              </div>
              <h3 className="text-base font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-500/10">
            <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">Ready to get started?</h3>
            <p className="text-sm text-gray-600 dark:text-neutral-400 mb-5">Free to use. No credit card required. Start shipping in 30 seconds.</p>
            <Link
              to="/auth?mode=register"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            >
              Create Your Workspace
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
