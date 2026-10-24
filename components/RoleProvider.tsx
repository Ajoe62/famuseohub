"use client";

import { createContext, useContext, useState } from "react";

type RoleContextValue = {
  isAdvisorView: boolean;
  switchRole: () => void;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [isAdvisorView, setIsAdvisorView] = useState(false);

  return (
    <RoleContext.Provider
      value={{ isAdvisorView, switchRole: () => setIsAdvisorView((v) => !v) }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
