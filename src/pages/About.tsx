import { Link } from "react-router-dom";
import { ArrowLeft, Target, Lightbulb, Heart, Rocket } from "lucide-react";

export default function About() {
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
          <span className="text-sm font-semibold">About Stride</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        {/* Hero */}
        <div className="mb-16">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">Our Story</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Built by makers,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">for makers.</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
            Stride was born out of frustration. We were tired of bloated project management tools that demanded hours of setup before you could create your first task. We wanted something that felt fast, looked beautiful, and stayed out of your way.
          </p>
        </div>

        {/* Mission */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Our Mission</h2>
          <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]">
            <p className="text-base text-gray-700 dark:text-neutral-300 leading-relaxed">
              To create the most intuitive and beautiful productivity workspace for developers, designers, and indie creators. We believe that great tools should reduce cognitive load, not add to it. Every feature in Stride exists to help you ship faster and think clearer.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold tracking-tight mb-8">What We Stand For</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: Target,
                title: "Focus Over Features",
                desc: "We'd rather do 10 things exceptionally well than 100 things poorly. Every feature is deliberate, tested, and refined before shipping.",
              },
              {
                icon: Lightbulb,
                title: "Simplicity Is Power",
                desc: "Complex problems deserve elegant solutions. We invest heavily in design and UX so that powerful capabilities feel effortless to use.",
              },
              {
                icon: Heart,
                title: "Craft & Care",
                desc: "From pixel-perfect animations to thoughtful keyboard shortcuts, we obsess over the details that make Stride a joy to use every day.",
              },
              {
                icon: Rocket,
                title: "Ship & Iterate",
                desc: "We release early, listen to feedback, and improve fast. Our users shape our roadmap — not the other way around.",
              },
            ].map((v) => (
              <div key={v.title} className="p-5 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-600/15 flex items-center justify-center mb-3">
                  <v.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-sm font-bold mb-1">{v.title}</h3>
                <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold tracking-tight mb-4">The Team</h2>
          <p className="text-base text-gray-600 dark:text-neutral-400 leading-relaxed mb-4">
            Stride is built by a small, independent team of engineers and designers who believe that the best software is crafted with intention. We're remote-first, bootstrapped, and laser-focused on building a product that we ourselves use every single day.
          </p>
          <p className="text-base text-gray-600 dark:text-neutral-400 leading-relaxed">
            We're not trying to be the next enterprise monolith. We're building the tool we wish existed — fast, beautiful, and uncompromisingly focused on individual and small-team productivity.
          </p>
        </section>

        {/* CTA */}
        <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-500/10 text-center">
          <h3 className="text-xl font-bold mb-2">Ready to try Stride?</h3>
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-5">Free to use. No credit card. Setup in 30 seconds.</p>
          <Link
            to="/auth?mode=register"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
          >
            Get Started Free <Rocket className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </main>
  );
}
