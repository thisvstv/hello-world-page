import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

interface StealthContextType {
    isStealthMode: boolean;
    toggleStealth: () => void;
}

const StealthContext = createContext<StealthContextType>({
    isStealthMode: false,
    toggleStealth: () => { },
});

export const useStealth = () => useContext(StealthContext);

export function StealthProvider({ children }: { children: ReactNode }) {
    const [isStealthMode, setIsStealthMode] = useState(false);
    const { user } = useAuth();

    const toggleStealth = useCallback(() => setIsStealthMode((p) => !p), []);

    // Global Shift+S listener (only when logged in and not focused in an input)
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!user) return;
            // Don't trigger when typing in inputs/textareas/contenteditable
            const tag = (e.target as HTMLElement)?.tagName;
            const isEditable =
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                (e.target as HTMLElement)?.isContentEditable;
            if (isEditable) return;

            if (e.key === "S" && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                setIsStealthMode((p) => !p);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [user]);

    return (
        <StealthContext.Provider value={{ isStealthMode, toggleStealth }}>
            <div className={isStealthMode ? "stealth-active" : ""}>
                {children}
            </div>
        </StealthContext.Provider>
    );
}
