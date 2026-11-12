"use client";

import { useRole } from "./RoleProvider";

export default function RoleToggle() {
  const { isAdvisorView, switchRole } = useRole();

  return (
    <button
      onClick={switchRole}
      className="whitespace-nowrap px-3 py-1.5 pointer-coarse:py-2.5 bg-canvas-sidebar text-white text-xs font-bold rounded-lg hover:bg-canvas-active transition-colors shadow-sm"
    >
      {isAdvisorView ? "Switch to Student View" : "Switch to Advisor View"}
    </button>
  );
}
