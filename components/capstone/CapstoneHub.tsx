"use client";

import { useState } from "react";
import { useRole } from "../RoleProvider";

// Only the tab/role switching runs on the client; the panels themselves are
// server-rendered and passed in as props.
type Tab = { label: React.ReactNode; panel: React.ReactNode };

const tabClass = "px-4 py-2 pointer-coarse:py-2.5 font-bold text-xs rounded-lg";
const activeTabClass = `${tabClass} bg-canvas-sidebar text-white shadow-sm`;
const inactiveTabClass = `${tabClass} bg-white text-slate-600 hover:bg-slate-100 border border-canvas-border`;

export default function CapstoneHub({ tabs, advisor }: { tabs: Tab[]; advisor: React.ReactNode }) {
  const [active, setActive] = useState(0);
  const { isAdvisorView } = useRole();

  return (
    <>
      {/* Navigation Tabs (Tracks + 50-Hour Lab Tracker) */}
      <div className="flex flex-wrap gap-2 border-b border-canvas-border pb-2">
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={active === i ? activeTabClass : inactiveTabClass}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels stay mounted (hidden via CSS) so in-progress form input survives tab/role switches */}
      <div className={isAdvisorView ? "hidden" : "space-y-6"}>
        {tabs.map((t, i) => (
          <div key={i} className={active === i ? "" : "hidden"}>
            {t.panel}
          </div>
        ))}
      </div>

      <div className={isAdvisorView ? "" : "hidden"}>{advisor}</div>
    </>
  );
}
