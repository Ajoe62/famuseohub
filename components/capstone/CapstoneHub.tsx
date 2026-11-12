"use client";

import { useState } from "react";

// Only tab switching runs on the client; panels are server-rendered and passed in.
type Tab = { key: string; label: React.ReactNode; panel: React.ReactNode };

const tabClass = "px-4 py-2 pointer-coarse:py-2.5 font-bold text-xs rounded-lg";
const activeTabClass = `${tabClass} bg-canvas-sidebar text-white shadow-sm`;
const inactiveTabClass = `${tabClass} bg-white text-slate-600 hover:bg-slate-100 border border-canvas-border`;

export default function CapstoneHub({ tabs, initial }: { tabs: Tab[]; initial?: string }) {
  const [active, setActive] = useState(() => Math.max(0, tabs.findIndex((t) => t.key === initial)));
  const id = "hub";

  return (
    <>
      <div role="tablist" aria-label="Capstone sections" className="flex flex-wrap gap-2 border-b border-canvas-border pb-2">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={active === i}
            aria-controls={`${id}-panel-${i}`}
            onClick={() => setActive(i)}
            className={active === i ? activeTabClass : inactiveTabClass}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels stay mounted (hidden via CSS) so in-progress form input survives tab switches */}
      {tabs.map((t, i) => (
        <div key={t.key} role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} hidden={active !== i} className="space-y-6">
          {t.panel}
        </div>
      ))}
    </>
  );
}
