import { useTheme } from "@/components/ThemeProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={isMobile ? "bottom-center" : "bottom-right"}
      gap={10}
      visibleToasts={4}
      offset={isMobile ? 80 : 16}
      style={isMobile ? { maxWidth: "calc(100vw - 2rem)", margin: "0 auto" } : undefined}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: [
            "group toast",
            // ── Glassmorphic base ──
            "group-[.toaster]:backdrop-blur-[48px]",
            "group-[.toaster]:bg-white/95 dark:group-[.toaster]:bg-[#0a0a14]/95",
            "md:group-[.toaster]:bg-white/75 md:dark:group-[.toaster]:bg-[#0a0a14]/75",
            "group-[.toaster]:text-foreground",
            // ── Border & ring ──
            "group-[.toaster]:border-[0.5px] group-[.toaster]:border-black/[0.06] dark:group-[.toaster]:border-white/10",
            "group-[.toaster]:ring-1 group-[.toaster]:ring-white/20 dark:group-[.toaster]:ring-white/[0.06]",
            // ── Shadows (flat on mobile, glass on desktop) ──
            "group-[.toaster]:shadow-sm",
            "md:group-[.toaster]:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.3)]",
            "md:dark:group-[.toaster]:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.04)]",
            // ── Shape ──
            "group-[.toaster]:rounded-2xl",
            "group-[.toaster]:w-full",
            "group-[.toaster]:px-4 group-[.toaster]:py-3",
          ].join(" "),
          // ── Success state ──
          success: [
            "group-[.toaster]:!border-emerald-500/20 dark:group-[.toaster]:!border-emerald-400/15",
            "group-[.toaster]:!ring-emerald-500/10",
            "group-[.toaster]:!bg-emerald-50/80 dark:group-[.toaster]:!bg-emerald-950/40",
            "group-[.toaster]:!text-emerald-900 dark:group-[.toaster]:!text-emerald-100",
            "group-[.toaster]:!shadow-sm",
            "md:group-[.toaster]:!shadow-[0_16px_48px_-12px_rgba(16,185,129,0.15),inset_0_1px_1px_rgba(255,255,255,0.3)]",
            "md:dark:group-[.toaster]:!shadow-[0_16px_48px_-12px_rgba(16,185,129,0.15),inset_0_1px_1px_rgba(255,255,255,0.04)]",
          ].join(" "),
          // ── Error state ──
          error: [
            "group-[.toaster]:!border-rose-500/20 dark:group-[.toaster]:!border-rose-400/15",
            "group-[.toaster]:!ring-rose-500/10",
            "group-[.toaster]:!bg-rose-50/80 dark:group-[.toaster]:!bg-rose-950/40",
            "group-[.toaster]:!text-rose-900 dark:group-[.toaster]:!text-rose-100",
            "group-[.toaster]:!shadow-sm",
            "md:group-[.toaster]:!shadow-[0_16px_48px_-12px_rgba(244,63,94,0.15),inset_0_1px_1px_rgba(255,255,255,0.3)]",
            "md:dark:group-[.toaster]:!shadow-[0_16px_48px_-12px_rgba(244,63,94,0.15),inset_0_1px_1px_rgba(255,255,255,0.04)]",
          ].join(" "),
          // ── Warning state (reused for info/update toasts) ──
          warning: [
            "group-[.toaster]:!border-amber-500/20 dark:group-[.toaster]:!border-amber-400/15",
            "group-[.toaster]:!ring-amber-500/10",
            "group-[.toaster]:!bg-amber-50/80 dark:group-[.toaster]:!bg-amber-950/40",
            "group-[.toaster]:!text-amber-900 dark:group-[.toaster]:!text-amber-100",
          ].join(" "),
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs group-[.toast]:opacity-80",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-xl group-[.toast]:text-xs group-[.toast]:font-semibold group-[.toast]:px-3 group-[.toast]:py-1.5",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl group-[.toast]:text-xs group-[.toast]:font-semibold",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
