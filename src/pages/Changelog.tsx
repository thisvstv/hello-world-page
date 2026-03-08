import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Bug, Zap, Wrench } from "lucide-react";

const releases = [
  {
    version: "1.0.0",
    date: "February 20, 2026",
    title: "Public Launch",
    type: "major" as const,
    changes: [
      { kind: "feature", text: "Task boards with drag-and-drop management" },
      { kind: "feature", text: "Daily Focused View for streamlined planning" },
      { kind: "feature", text: "Focus Timer — attach a Pomodoro timer to any task" },
      { kind: "feature", text: "Stealth Mode — blur sensitive content instantly" },
      { kind: "feature", text: "Auto-Rollover — unfinished tasks carry to the next day" },
      { kind: "feature", text: "Project Notes with rich text editor" },
      { kind: "feature", text: "Secure authentication with password reset flow" },
      { kind: "feature", text: "Dark / light mode with accent color themes" },
      { kind: "feature", text: "Responsive design — desktop, tablet, and mobile" },
      { kind: "feature", text: "PWA support — install as a native app" },
    ],
  },
  {
    version: "0.9.0-beta",
    date: "January 15, 2026",
    title: "Private Beta",
    type: "minor" as const,
    changes: [
      { kind: "feature", text: "Initial task board implementation" },
      { kind: "feature", text: "User authentication and account management" },
      { kind: "feature", text: "Project CRUD operations" },
      { kind: "fix", text: "Fixed authentication redirect loop on protected routes" },
      { kind: "improvement", text: "Improved dark mode contrast ratios for accessibility" },
    ],
  },
  {
    version: "0.1.0-alpha",
    date: "December 1, 2025",
    title: "Internal Alpha",
    type: "minor" as const,
    changes: [
      { kind: "feature", text: "Core Express API with PostgreSQL database" },
      { kind: "feature", text: "Basic React frontend with Tailwind CSS" },
    ],
  },
];

function KindBadge({ kind }: { kind: string }) {
  const config: Record<string, { icon: typeof Sparkles; label: string; class: string }> = {
    feature: { icon: Sparkles, label: "New", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
    fix: { icon: Bug, label: "Fix", class: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" },
    improvement: { icon: Zap, label: "Improved", class: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
  };
  const c = config[kind] || config.feature;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${c.class}`}>
      <c.icon className="w-2.5 h-2.5" />
      {c.label}
    </span>
  );
}

export default function Changelog() {
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
          <span className="text-sm font-semibold">Changelog</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <div className="flex items-center gap-3 mb-3">
          <Wrench className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Changelog</p>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">What's New</h1>
        <p className="text-lg text-gray-600 dark:text-neutral-400 mb-12 max-w-xl">
          A detailed log of every feature, fix, and improvement shipped in Stride.
        </p>

        <div className="space-y-12">
          {releases.map((release) => (
            <div key={release.version} className="relative">
              {/* Version header */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-sm font-bold font-['JetBrains_Mono',monospace] text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                  v{release.version}
                </span>
                <h2 className="text-lg font-bold">{release.title}</h2>
                <span className="text-xs text-gray-400 dark:text-neutral-500">{release.date}</span>
              </div>

              {/* Changes */}
              <div className="space-y-2 ml-1">
                {release.changes.map((change, i) => (
                  <div key={i} className="flex items-start gap-3 py-1.5">
                    <KindBadge kind={change.kind} />
                    <span className="text-sm text-gray-700 dark:text-neutral-300 leading-relaxed">{change.text}</span>
                  </div>
                ))}
              </div>

              {/* Separator */}
              <div className="mt-8 h-px bg-gray-200 dark:bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
