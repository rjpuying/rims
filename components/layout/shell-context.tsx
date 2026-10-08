"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "rims.sidebar-collapsed";

function applyStoredSidebar() {
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === "true") {
      document.documentElement.setAttribute("data-sidebar", "collapsed");
    } else {
      document.documentElement.removeAttribute("data-sidebar");
    }
  } catch {
    // storage unavailable; sidebar stays expanded
  }
}

type ShellState = {
  toggleCollapsed: () => void;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
};

const ShellContext = createContext<ShellState | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [sheetOpen, setSheetOpen] = useState(false);

  useLayoutEffect(() => {
    // Re-apply after hydration (React Strict Mode remounts reset <html>
    // attributes it manages). Storage events sync other tabs.
    applyStoredSidebar();
    const onStorage = () => applyStoredSidebar();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleCollapsed = useCallback(() => {
    const root = document.documentElement;
    const next = root.getAttribute("data-sidebar") !== "collapsed";
    if (next) {
      root.setAttribute("data-sidebar", "collapsed");
    } else {
      root.removeAttribute("data-sidebar");
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // storage unavailable; state still toggles for this page
    }
  }, []);

  const value: ShellState = {
    toggleCollapsed,
    sheetOpen,
    setSheetOpen,
  };

  return <ShellContext value={value}>{children}</ShellContext>;
}

export function useShell(): ShellState {
  const ctx = useContext(ShellContext);
  if (!ctx) {
    throw new Error("useShell must be used within ShellProvider");
  }
  return ctx;
}
