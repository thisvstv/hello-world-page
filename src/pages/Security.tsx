import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Server, Bug, Key } from "lucide-react";

const practices = [
  {
    icon: Lock,
    title: "Encryption Everywhere",
    desc: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Your project data, notes, and files are protected at every layer of our infrastructure.",
  },
  {
    icon: Key,
    title: "Secure Authentication",
    desc: "Passwords are hashed with bcrypt (cost factor 12). Authentication uses short-lived JWT access tokens (15 min) with HTTP-only secure refresh tokens. CSRF protection is enforced on all state-changing endpoints.",
  },
  {
    icon: Shield,
    title: "Input Sanitization & Validation",
    desc: "All user input is validated server-side with strict schemas (Zod) and sanitized against XSS with DOMPurify. We enforce Content Security Policy headers and use parameterized queries to prevent SQL injection.",
  },
  {
    icon: Server,
    title: "Infrastructure Security",
    desc: "Stride runs on SOC 2-compliant cloud infrastructure with automated security patching, network isolation, and encrypted backups. Database access is restricted to application-level service accounts only.",
  },
  {
    icon: Bug,
    title: "Rate Limiting & Abuse Prevention",
    desc: "All API endpoints are rate-limited to prevent brute-force attacks and abuse. Login attempts are throttled, and suspicious activity triggers automatic alerts. Password reset tokens are single-use and expire quickly.",
  },
  {
    icon: Eye,
    title: "Minimal Data Collection",
    desc: "We collect only what's necessary to provide the service. No third-party analytics, no advertising trackers, no social pixels. Your data is yours — we never sell or share it.",
  },
];

export default function Security() {
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
          <span className="text-sm font-semibold">Security</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">Security</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
          Your data is safe.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">We take security seriously.</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-neutral-400 leading-relaxed mb-16 max-w-2xl">
          Security isn't an afterthought at Stride — it's foundational. From encrypted storage to strict input validation, every layer of our stack is designed to protect your data.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-16">
          {practices.map((p) => (
            <div
              key={p.title}
              className="p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-600/15 flex items-center justify-center mb-4">
                <p.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-base font-bold mb-2">{p.title}</h3>
              <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Responsible Disclosure */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Responsible Disclosure</h2>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/10 border border-indigo-200/50 dark:border-indigo-500/10">
            <p className="text-sm text-gray-700 dark:text-neutral-300 leading-relaxed mb-4">
              We appreciate the security community's efforts to responsibly disclose vulnerabilities. If you discover a security issue in Stride, please report it to us privately so we can address it before public disclosure.
            </p>
            <p className="text-sm text-gray-700 dark:text-neutral-300 leading-relaxed mb-4">
              <strong>Report to:</strong> security@stride.app
            </p>
            <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
              Please include a detailed description of the vulnerability, steps to reproduce, and any potential impact. We aim to acknowledge reports within 48 hours and resolve critical issues within 7 days.
            </p>
          </div>
        </section>

        {/* Trust indicators */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { stat: "TLS 1.3", label: "In-transit encryption" },
            { stat: "AES-256", label: "At-rest encryption" },
            { stat: "bcrypt 12", label: "Password hashing" },
          ].map((t) => (
            <div key={t.stat} className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-['JetBrains_Mono',monospace]">{t.stat}</p>
              <p className="text-xs text-gray-500 dark:text-neutral-500 mt-1">{t.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
