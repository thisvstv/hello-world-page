import { createContext, useContext, ReactNode, useState, useCallback, useMemo } from "react";

interface SettingsContextType {
  openSettings: () => void;
  settingsRequested: boolean;
  clearSettingsRequest: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
  openSettings: () => { },
  settingsRequested: false,
  clearSettingsRequest: () => { },
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settingsRequested, setSettingsRequested] = useState(false);

  const openSettings = useCallback(() => setSettingsRequested(true), []);
  const clearSettingsRequest = useCallback(() => setSettingsRequested(false), []);

  // Memoize context value to prevent cascading re-renders
  const contextValue = useMemo<SettingsContextType>(
    () => ({ openSettings, settingsRequested, clearSettingsRequest }),
    [openSettings, settingsRequested, clearSettingsRequest]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettingsContext = () => useContext(SettingsContext);
