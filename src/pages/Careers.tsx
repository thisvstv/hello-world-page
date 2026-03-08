import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Briefcase, Heart } from "lucide-react";

const openings = [
  {
    title: "Senior Frontend Engineer",
    team: "Engineering",
    location: "Remote (Worldwide)",
    type: "Full-time",
    desc: "Help us build the most beautiful and performant project management UI on the web. You'll work with React, TypeScript, Tailwind CSS, and Framer Motion to craft pixel-perfect interactions.",
  },
  {
    title: "Backend Engineer",
    team: "Engineering",
    location: "Remote (Worldwide)",
    type: "Full-time",
    desc: "Design and build the APIs, real-time infrastructure, and data layer that powers Stride. You'll work with Node.js, PostgreSQL, Prisma, and WebSockets.",
  },
  {
    title: "Product Designer",
    team: "Design",
    location: "Remote (Worldwide)",
    type: "Full-time",
    desc: "Own the end-to-end design process — from research and wireframes to high-fidelity prototypes and design system components. You'll shape how thousands of people experience productivity.",
  },
];

const perks = [
  "Fully remote — work from anywhere in the world",
  "Flexible hours — we care about output, not clock-in times",
  "Latest hardware — MacBook Pro or equivalent of your choice",
  "Learning budget — $2,000/year for books, courses, and conferences",
  "Health & wellness stipend — $150/month",
  "Generous PTO — 25 days + local holidays",
];

export default function Careers() {
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
          <span className="text-sm font-semibold">Careers</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">Careers</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
          Build the future<br />of productivity.
        </h1>
        <p className="text-lg text-gray-600 dark:text-neutral-400 leading-relaxed mb-16 max-w-2xl">
          We're a small, remote-first team obsessed with craft. If you care deeply about building software that people love to use, we'd love to hear from you.
        </p>

        {/* Open Roles */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Open Positions</h2>
          <div className="space-y-4">
            {openings.map((role) => (
              <div
                key={role.title}
                className="p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-indigo-300 dark:hover:border-indigo-500/20 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-base font-bold">{role.title}</h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                    {role.team}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-gray-500 dark:text-neutral-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{role.location}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{role.type}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed mb-4">{role.desc}</p>
                <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
                  Apply →
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Perks */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Why Work With Us</h2>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/10 border border-indigo-200/50 dark:border-indigo-500/10">
            <ul className="space-y-3">
              {perks.map((perk) => (
                <li key={perk} className="flex items-start gap-3">
                  <Heart className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-neutral-300">{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">
            Don't see a role that fits? We're always looking for exceptional people.
          </p>
          <a
            href="mailto:careers@stride.app"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
          >
            Send an open application
          </a>
        </div>
      </div>
    </main>
  );
}
