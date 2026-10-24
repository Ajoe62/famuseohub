import type { Milestone, MilestoneStatus } from "@/lib/data";

const STATUS_STYLES: Record<
  MilestoneStatus,
  { card: string; badge: string; title: string; label: string }
> = {
  completed: {
    card: "bg-emerald-50 border-emerald-300",
    badge: "bg-canvas-sidebar text-white",
    title: "text-canvas-sidebar",
    label: "text-emerald-700 font-semibold",
  },
  review: {
    card: "bg-amber-50 border-amber-300",
    badge: "bg-amber-500 text-white",
    title: "text-amber-900",
    label: "text-amber-700 font-bold",
  },
  notStarted: {
    card: "bg-slate-50 border-slate-200",
    badge: "bg-slate-300 text-slate-600",
    title: "text-slate-700",
    label: "text-slate-400",
  },
  locked: {
    card: "bg-slate-50 border-slate-200 opacity-60",
    badge: "bg-slate-300 text-slate-600",
    title: "text-slate-700",
    label: "text-slate-400",
  },
};

export default function MilestoneProgress({
  heading,
  milestones,
}: {
  heading: string;
  milestones: Milestone[];
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-canvas-border">
      <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">{heading}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-center">
        {milestones.map((m, i) => {
          const s = STATUS_STYLES[m.status];
          return (
            <div key={m.title} className={`p-3 rounded-lg border ${s.card}`}>
              <span
                className={`w-6 h-6 rounded-full ${s.badge} text-xs font-bold inline-flex items-center justify-center mb-1`}
              >
                {i + 1}
              </span>
              <p className={`text-xs font-bold ${s.title}`}>{m.title}</p>
              <p className={`text-[10px] ${s.label}`}>{m.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
