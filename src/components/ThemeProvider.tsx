import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

type Theme = "light" | "dark";
export type AccentColor = "indigo" | "rose" | "emerald" | "amber" | "sky" | "violet";

interface ThemeContextType {
  theme: Theme;
  accent: AccentColor;
  toggleTheme: () => void;
  setAccent: (c: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  accent: "indigo",
  toggleTheme: () => { },
  setAccent: () => { },
});

export const useTheme = () => useContext(ThemeContext);

// ── Accent color palettes ──────────────────────────────
const ACCENT_VARS: Record<AccentColor, {
  primary: string;
  neon: string;
  neonHover: string;
  btnFrom: string;
  btnTo: string;
  meshLight: string;
  meshDark: string;
}> = {
  indigo: {
    primary: "239 84% 67%",
    neon: "0 0 20px rgba(99,102,241,0.VAR), 0 0 60px rgba(99,102,241,0.GLOW)",
    neonHover: "0 0 32px rgba(99,102,241,0.5), 0 8px 24px rgba(99,102,241,0.3)",
    btnFrom: "#4f46e5",
    btnTo: "#8b5cf6",
    meshLight: "radial-gradient(ellipse at 0% 0%,#EEF2FF 0%,transparent 50%),radial-gradient(ellipse at 100% 50%,#E0F2FE 0%,transparent 50%),radial-gradient(ellipse at 50% 100%,#EDE9FE 0%,transparent 50%),linear-gradient(135deg,#F5F7FF 0%,#EEF0FB 50%,#F0F5FF 100%)",
    meshDark: "radial-gradient(ellipse at 0% 0%,#020617 0%,transparent 50%),radial-gradient(ellipse at 100% 100%,#1E1B4B 0%,transparent 50%),linear-gradient(135deg,#020617 0%,#0F172A 50%,#1E1B4B 100%)",
  },
  rose: {
    primary: "346 77% 60%",
    neon: "0 0 20px rgba(244,63,94,0.VAR), 0 0 60px rgba(244,63,94,0.GLOW)",
    neonHover: "0 0 32px rgba(244,63,94,0.5), 0 8px 24px rgba(244,63,94,0.3)",
    btnFrom: "#e11d48",
    btnTo: "#f43f5e",
    meshLight: "radial-gradient(ellipse at 0% 0%,#FFF1F2 0%,transparent 50%),radial-gradient(ellipse at 100% 50%,#FFE4E6 0%,transparent 50%),radial-gradient(ellipse at 50% 100%,#FECDD3 0%,transparent 50%),linear-gradient(135deg,#FFF5F6 0%,#FFF0F1 50%,#FFF5F7 100%)",
    meshDark: "radial-gradient(ellipse at 0% 0%,#0C0A09 0%,transparent 50%),radial-gradient(ellipse at 100% 100%,#4C0519 0%,transparent 50%),linear-gradient(135deg,#0C0A09 0%,#1C1017 50%,#3B0716 100%)",
  },
  emerald: {
    primary: "160 84% 39%",
    neon: "0 0 20px rgba(16,185,129,0.VAR), 0 0 60px rgba(16,185,129,0.GLOW)",
    neonHover: "0 0 32px rgba(16,185,129,0.5), 0 8px 24px rgba(16,185,129,0.3)",
    btnFrom: "#059669",
    btnTo: "#10b981",
    meshLight: "radial-gradient(ellipse at 0% 0%,#ECFDF5 0%,transparent 50%),radial-gradient(ellipse at 100% 50%,#D1FAE5 0%,transparent 50%),radial-gradient(ellipse at 50% 100%,#A7F3D0 0%,transparent 50%),linear-gradient(135deg,#F0FDF9 0%,#ECFDF5 50%,#F0FDFA 100%)",
    meshDark: "radial-gradient(ellipse at 0% 0%,#022C22 0%,transparent 50%),radial-gradient(ellipse at 100% 100%,#064E3B 0%,transparent 50%),linear-gradient(135deg,#022C22 0%,#052e16 50%,#064E3B 100%)",
  },
  amber: {
    primary: "38 92% 50%",
    neon: "0 0 20px rgba(245,158,11,0.VAR), 0 0 60px rgba(245,158,11,0.GLOW)",
    neonHover: "0 0 32px rgba(245,158,11,0.5), 0 8px 24px rgba(245,158,11,0.3)",
    btnFrom: "#d97706",
    btnTo: "#f59e0b",
    meshLight: "radial-gradient(ellipse at 0% 0%,#FFFBEB 0%,transparent 50%),radial-gradient(ellipse at 100% 50%,#FEF3C7 0%,transparent 50%),radial-gradient(ellipse at 50% 100%,#FDE68A 0%,transparent 50%),linear-gradient(135deg,#FFFCF0 0%,#FFFBEB 50%,#FEFCE8 100%)",
    meshDark: "radial-gradient(ellipse at 0% 0%,#1C1917 0%,transparent 50%),radial-gradient(ellipse at 100% 100%,#451A03 0%,transparent 50%),linear-gradient(135deg,#1C1917 0%,#27190a 50%,#451A03 100%)",
  },
  sky: {
    primary: "199 89% 48%",
    neon: "0 0 20px rgba(14,165,233,0.VAR), 0 0 60px rgba(14,165,233,0.GLOW)",
    neonHover: "0 0 32px rgba(14,165,233,0.5), 0 8px 24px rgba(14,165,233,0.3)",
    btnFrom: "#0284c7",
    btnTo: "#0ea5e9",
    meshLight: "radial-gradient(ellipse at 0% 0%,#F0F9FF 0%,transparent 50%),radial-gradient(ellipse at 100% 50%,#E0F2FE 0%,transparent 50%),radial-gradient(ellipse at 50% 100%,#BAE6FD 0%,transparent 50%),linear-gradient(135deg,#F0F9FF 0%,#E8F4FD 50%,#F0FAFF 100%)",
    meshDark: "radial-gradient(ellipse at 0% 0%,#0C1929 0%,transparent 50%),radial-gradient(ellipse at 100% 100%,#0C4A6E 0%,transparent 50%),linear-gradient(135deg,#0C1929 0%,#082f49 50%,#0C4A6E 100%)",
  },
  violet: {
    primary: "263 70% 58%",
    neon: "0 0 20px rgba(139,92,246,0.VAR), 0 0 60px rgba(139,92,246,0.GLOW)",
    neonHover: "0 0 32px rgba(139,92,246,0.5), 0 8px 24px rgba(139,92,246,0.3)",
    btnFrom: "#7c3aed",
    btnTo: "#a78bfa",
    meshLight: "radial-gradient(ellipse at 0% 0%,#F5F3FF 0%,transparent 50%),radial-gradient(ellipse at 100% 50%,#EDE9FE 0%,transparent 50%),radial-gradient(ellipse at 50% 100%,#DDD6FE 0%,transparent 50%),linear-gradient(135deg,#FAF5FF 0%,#F5F3FF 50%,#F9F5FF 100%)",
    meshDark: "radial-gradient(ellipse at 0% 0%,#0E0428 0%,transparent 50%),radial-gradient(ellipse at 100% 100%,#2E1065 0%,transparent 50%),linear-gradient(135deg,#0E0428 0%,#1e1145 50%,#2E1065 100%)",
  },
};

function applyAccentVars(accent: AccentColor, theme: Theme) {
  const v = ACCENT_VARS[accent];
  const root = document.documentElement;
  root.style.setProperty("--primary", v.primary);
  root.style.setProperty("--ring", v.primary);
  root.style.setProperty("--sidebar-primary", v.primary);
  root.style.setProperty("--sidebar-ring", v.primary);

  const neonIntensity = theme === "dark" ? "0.4" : "0.2";
  const glowIntensity = theme === "dark" ? "0.15" : "0.06";
  root.style.setProperty("--shadow-neon", v.neon.replace("0.VAR", neonIntensity).replace("0.GLOW", glowIntensity));
  root.style.setProperty("--accent-btn-from", v.btnFrom);
  root.style.setProperty("--accent-btn-to", v.btnTo);
  root.style.setProperty("--accent-mesh-light", v.meshLight);
  root.style.setProperty("--accent-mesh-dark", v.meshDark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "dark";
    }
    return "dark";
  });

  const [accent, setAccentState] = useState<AccentColor>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("accent") as AccentColor) || "indigo";
    }
    return "indigo";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
    applyAccentVars(accent, theme);
  }, [theme, accent]);

  const toggleTheme = useCallback(() => setTheme((prev) => (prev === "dark" ? "light" : "dark")), []);

  const setAccent = useCallback((c: AccentColor) => {
    setAccentState(c);
    localStorage.setItem("accent", c);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, accent, toggleTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}
