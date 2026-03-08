import { ReactNode, useEffect, useRef, useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import UserOnboarding from "./UserOnboarding";
import { useTheme } from "./ThemeProvider";
import { toast } from "sonner";
import { FocusTimerProvider } from "./FocusTimerContext";
import FocusTimer from "./FocusTimer";
import FeedbackModal from "./FeedbackModal";

// ── Daily motivational toast ───────────────────────────
const MOTIVATIONAL_QUOTES = [
  "Let's build some momentum today! 🚀",
  "Ready to architect your week?",
  "Small steps compound. Ship something today. ⚡",
  "Focus mode: activated. Let's crush it.",
  "Today's progress is tomorrow's foundation.",
  "One task at a time. You've got this. 💪",
  "Great things are built in daily increments.",
  "Time to turn ideas into action.",
  "Your future self will thank you. Let's go!",
  "Another day, another chance to ship. 🎯",
];

const LAST_OPEN_KEY = "stride_last_open_date";

function useDailyToast() {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    const today = new Date().toDateString();
    const lastOpen = localStorage.getItem(LAST_OPEN_KEY);

    if (lastOpen !== today) {
      localStorage.setItem(LAST_OPEN_KEY, today);
      const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
      // Small delay so the layout is fully painted first
      const timer = setTimeout(() => toast.success(quote, { duration: 5000 }), 600);
      shown.current = true;
      return () => clearTimeout(timer);
    }
    shown.current = true;
  }, []);
}

// ── Global FocusTimer (persists across navigation) ─────
function GlobalFocusTimer() {
  return <FocusTimer />;
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  useDailyToast();

  return (
    <FocusTimerProvider>
      <main
        className={`min-h-screen ${theme === "dark" ? "mesh-gradient-dark" : "mesh-gradient-light"
          }`}
      >
        <DashboardSidebar onFeedback={() => setFeedbackOpen(true)} />
        {/* md: has sidebar (pl-20), mobile: no sidebar, has bottom nav (pb-16) */}
        <div className="md:pl-20 pb-16 md:pb-0">
          <DashboardHeader />
          <section className="px-4 pb-6 md:px-8 md:pb-8">{children}</section>
        </div>
        <UserOnboarding />
        <GlobalFocusTimer />
        <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      </main>
    </FocusTimerProvider>
  );
}

export default DashboardLayout;
