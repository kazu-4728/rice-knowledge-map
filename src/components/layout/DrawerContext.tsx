"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type DrawerContextValue = {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
};

const DrawerContext = createContext<DrawerContextValue>({
  drawerOpen: false,
  setDrawerOpen: () => {},
});

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <DrawerContext.Provider value={{ drawerOpen, setDrawerOpen }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  return useContext(DrawerContext);
}
