import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

const socials = [
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
];

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Features", to: "/features" },
      { label: "Changelog", to: "/changelog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Blog", to: "/blog" },
      { label: "Contact Us", to: "mailto:support@strideworkspace.app" },
    ],
  },
  // Legal links temporarily hidden — Privacy & Terms pages under construction
  // {
  //   title: "Legal",
  //   links: [
  //     { label: "Privacy", to: "/privacy" },
  //     { label: "Terms", to: "/terms" },
  //   ],
  // },
];

/* ═══════════════════════════════════════════════════════
   Premium Footer — Light & Dark Theme, Fully Responsive
   ═══════════════════════════════════════════════════════ */
export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-gray-200 dark:border-white/[0.06] bg-gray-50/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl">
      {/* Gradient separator */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        {/* ── Top section: Brand + Link columns ── */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-5">
          {/* Brand block */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-2 mb-4 lg:mb-0">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-gray-200 dark:ring-white/10 shadow-[0_0_15px_rgba(99,102,241,0.1)] dark:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-shadow group-hover:shadow-[0_0_25px_rgba(99,102,241,0.2)] dark:group-hover:shadow-[0_0_25px_rgba(99,102,241,0.3)]">
                <img src="/stride-logo.webp" alt="STRIDE" className="w-full h-full object-contain" />
              </div>
              <span className="text-base font-black tracking-tight text-gray-900 dark:text-white font-['JetBrains_Mono',monospace]">
                STRIDE
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-500 dark:text-neutral-400 leading-relaxed max-w-xs">
              Plan smarter, move faster. The modern project management tool built for developers and creators.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-2 mt-5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="
                    w-9 h-9 rounded-xl grid place-items-center
                    text-gray-400 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-white
                    bg-gray-100 dark:bg-white/[0.04] hover:bg-gray-200 dark:hover:bg-white/[0.08]
                    ring-1 ring-gray-200 dark:ring-white/[0.06] hover:ring-gray-300 dark:hover:ring-white/[0.12]
                    transition-all duration-200
                  "
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-400 mb-3 font-['JetBrains_Mono',monospace]">
                {group.title}
              </h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.to.startsWith("mailto:") ? (
                      <a
                        href={link.to}
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        className="text-sm text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400 dark:text-neutral-500">
            &copy; {new Date().getFullYear()} Stride. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 dark:text-neutral-600">
            Crafted with precision &amp; care.
          </p>
        </div>
      </div>
    </footer>
  );
}
