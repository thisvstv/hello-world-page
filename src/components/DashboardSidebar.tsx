import { useState } from "react";
import { motion } from "framer-motion";
import { FolderKanban, UserCircle, LogOut, Home, HelpCircle, FileText, Settings, MessageSquarePlus, CalendarDays } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useTranslation } from "react-i18next";

const navItems = [
  { key: "nav.home", icon: Home, path: "/home" },
  { key: "nav.projects", icon: FolderKanban, path: "/dashboard" },
  { key: "nav.calendar", icon: CalendarDays, path: "/calendar" },
  { key: "nav.profile", icon: UserCircle, path: "/profile" },
];

export function DashboardSidebar({ onFeedback }: { onFeedback?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();
  const { t } = useTranslation();

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────── */}
      <motion.aside
        className="fixed left-4 top-4 bottom-4 z-50 glass rounded-3xl hidden md:flex flex-col py-6 overflow-hidden"
        initial={false}
        animate={{ width: expanded ? 256 : 80 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Logo */}
        <Link to="/home" className="flex items-center px-5 mb-10">
          <div className="flex-shrink-0 w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center">
            <img src="/stride-logo.webp" alt="STRIDE" className="w-10 h-10 object-contain" />
          </div>
          <motion.span
            className="ml-3 text-lg font-black tracking-tighter text-foreground whitespace-nowrap overflow-hidden flex items-center gap-2"
            animate={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            STRIDE
            <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-md bg-primary/15 text-primary ring-1 ring-primary/25">Beta</span>
          </motion.span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.key}
                to={item.path}
                className={`
                  relative flex items-center h-11 rounded-2xl px-3 transition-premium active:scale-[0.97]
                  ${isActive
                    ? "text-primary shadow-neon"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-2xl bg-primary/10 shadow-inner-glow"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon className="w-5 h-5 flex-shrink-0 relative z-10" />
                <motion.span
                  className="ms-3 text-sm font-medium whitespace-nowrap overflow-hidden relative z-10"
                  animate={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {t(item.key)}
                </motion.span>
              </Link>
            );
          })}
        </nav>

        {/* Mini-Footer Links */}
        <div className="px-3 mt-auto mb-2">
          <div className="border-t border-white/[0.06] pt-2 flex flex-col gap-0.5">
            {onFeedback && (
              <button
                id="onboarding-feedback"
                onClick={onFeedback}
                className="
                  flex items-center h-8 rounded-xl px-3 transition-all duration-200
                  text-neutral-500 hover:text-primary hover:bg-primary/[0.06]
                "
              >
                <MessageSquarePlus className="w-3.5 h-3.5 flex-shrink-0" />
                <motion.span
                  className="ms-2.5 text-[11px] font-medium whitespace-nowrap overflow-hidden"
                  animate={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  Feedback
                </motion.span>
              </button>
            )}
            {[
              { icon: HelpCircle, label: "Help & Support", href: "/about" },
              { icon: FileText, label: "Terms", href: "/terms" },
              { icon: Settings, label: "Settings", href: "/profile" },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="
                  flex items-center h-8 rounded-xl px-3 transition-all duration-200
                  text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]
                "
              >
                <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <motion.span
                  className="ms-2.5 text-[11px] font-medium whitespace-nowrap overflow-hidden"
                  animate={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {item.label}
                </motion.span>
              </Link>
            ))}
          </div>
        </div>

        {/* Logout at bottom */}
        <div className="px-3 pb-2">
          <button
            onClick={logout}
            className="
              relative flex items-center h-11 w-full rounded-2xl px-3 transition-premium active:scale-[0.97]
              text-muted-foreground hover:text-red-500 dark:hover:text-red-400
              hover:bg-red-500/[0.06] dark:hover:bg-red-500/[0.08]
            "
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <motion.span
              className="ms-3 text-sm font-medium whitespace-nowrap overflow-hidden"
              animate={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {t("nav.logout")}
            </motion.span>
          </button>
        </div>
      </motion.aside>

      {/* ── Mobile Bottom Nav ───────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass border-t-[0.5px] border-black/5 dark:border-white/10 pb-safe">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.key}
                to={item.path}
                className={`
                  relative flex flex-col items-center justify-center gap-0.5 w-14 h-14 transition-colors active:scale-[0.93]
                  ${isActive ? "text-primary" : "text-muted-foreground"}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveNav"
                    className="absolute -top-0.5 left-3 right-3 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-semibold">{t(item.key)}</span>
              </Link>
            );
          })}
          {/* Logout button (mobile) */}
          <button
            onClick={logout}
            className="flex flex-col items-center justify-center gap-0.5 w-14 h-14 text-muted-foreground hover:text-red-500 dark:hover:text-red-400 transition-colors active:scale-[0.93]"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[9px] font-semibold">{t("nav.logout")}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
