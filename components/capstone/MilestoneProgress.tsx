import { STAGE_TITLES, type Stage } from "@/lib/curriculum";
import { MILESTONE_LABELS, type MilestoneStatus } from "@/lib/capstone/rules";

const STATUS_STYLES: Record<MilestoneStatus, { card: string; badge: string; title: string; label: string }> = {
  approved: {
    card: "bg-emerald-50 border-emerald-300",
    badge: "bg-canvas-sidebar text-white",
    title: "text-canvas-sidebar",
    label: "text-emerald-700 font-semibold",
  },
  submitted: {
    card: "bg-amber-50 border-amber-300",
    badge: "bg-amber-500 text-white",
    title: "text-amber-900",
    label: "text-amber-800 font-bold",
  },
  revision: {
    card: "bg-red-50 border-red-300",
    badge: "bg-red-600 text-white",
    title: "text-red-900",
    label: "text-red-700 font-bold",
  },
  open: {
    card: "bg-white border-canvas-orange",
    badge: "bg-canvas-orange text-white",
    title: "text-slate-900",
    label: "text-slate-600 font-semibold",
  },
  locked: {
    card: "bg-slate-50 border-slate-200",
    badge: "bg-slate-300 text-slate-700",
    title: "text-slate-600",
    label: "text-slate-600",
  },
};

export default function MilestoneProgress({
  heading,
  stages,
}: {
  heading: string;
  stages: { stage: Stage; status: MilestoneStatus }[];
}) {
  return (
    <section aria-label={heading} className="bg-white rounded-xl p-5 shadow-sm border border-canvas-border">
      <h3 className="text-xs font-bold uppercase text-slate-600 tracking-wider mb-4">{heading}</h3>
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-center">
        {stages.map(({ stage, status }) => {
          const s = STATUS_STYLES[status];
          return (
            <li key={stage} className={`p-3 rounded-lg border ${s.card}`}>
              <span className={`w-6 h-6 rounded-full ${s.badge} text-xs font-bold inline-flex items-center justify-center mb-1`}>
                {stage}
              </span>
              <p className={`text-xs font-bold ${s.title}`}>{STAGE_TITLES[stage]}</p>
              <p className={`text-[10px] ${s.label}`}>{MILESTONE_LABELS[status]}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
