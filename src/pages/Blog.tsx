import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";

const posts = [
  {
    date: "Feb 20, 2026",
    title: "Introducing Stride: A Productivity Workspace for Makers",
    excerpt:
      "We built Stride because we were tired of project management tools that felt like tax software. Today, we're launching the first public version — a clean, focused workspace with Kanban boards, a Chronos timeline, and a built-in focus timer.",
    tag: "Launch",
    tagColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  {
    date: "Feb 10, 2026",
    title: "Why We Made the Focus Timer a Core Feature",
    excerpt:
      "Most project management tools are obsessed with tracking time after the fact. We wanted something different: a Pomodoro-style timer that helps you enter flow state, attached directly to the task you're working on. Here's the philosophy behind it.",
    tag: "Design",
    tagColor: "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  },
  {
    date: "Jan 28, 2026",
    title: "The Architecture Behind Stride's Real-Time Kanban",
    excerpt:
      "Building a drag-and-drop board that feels instant while keeping data consistent is harder than it looks. In this post, we break down our optimistic UI approach, how we handle column reordering, and why we chose a weekly sprint model.",
    tag: "Engineering",
    tagColor: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  },
  {
    date: "Jan 15, 2026",
    title: "Designing for Dark Mode First",
    excerpt:
      "Stride was designed dark-first, then adapted for light. This post covers our design token strategy, how we handle glassmorphism in both themes, and the custom Tailwind utilities that make it all work seamlessly.",
    tag: "Design",
    tagColor: "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  },
  {
    date: "Jan 5, 2026",
    title: "Auto-Rollover: How We Handle Missed Deadlines Gracefully",
    excerpt:
      "Nobody likes seeing a wall of overdue tasks. Stride's auto-rollover feature automatically moves unfinished tasks to the current day, keeping your board clean and your focus sharp. Here's how it works under the hood.",
    tag: "Feature",
    tagColor: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
];

export default function Blog() {
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
          <span className="text-sm font-semibold">Blog</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">Blog</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Updates & Insights
        </h1>
        <p className="text-lg text-gray-600 dark:text-neutral-400 mb-12 max-w-xl">
          Product updates, engineering deep-dives, and design thinking from the Stride team.
        </p>

        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.title}
              className="group p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-indigo-300 dark:hover:border-indigo-500/20 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${post.tagColor}`}>
                  {post.tag}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-neutral-500">
                  <Calendar className="w-3 h-3" />
                  {post.date}
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {post.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed mb-3">
                {post.excerpt}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Read more <ArrowRight className="w-3 h-3" />
              </span>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
