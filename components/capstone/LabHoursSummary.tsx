import type { HoursSummary } from "@/lib/capstone/rules";
import { formatHours } from "@/lib/format";
import { faStopwatch } from "@/lib/icons";
import Icon from "../Icon";

export default function LabHoursSummary({ hours }: { hours: HoursSummary }) {
  return (
    <section
      aria-labelledby="lab-progress-heading"
      className="bg-white rounded-xl p-5 shadow-sm border border-canvas-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 flex-shrink-0 rounded-full bg-canvas-sidebar text-white flex items-center justify-center font-bold text-lg">
          <Icon icon={faStopwatch} className="text-canvas-orange" />
        </div>
        <div>
          <h2 id="lab-progress-heading" className="font-bold text-slate-900 text-sm">
            {hours.required}-Hour Laboratory & Field Log Progress
          </h2>
          <p className="text-xs text-slate-600">
            {hours.complete
              ? "Requirement complete. All required hours are verified."
              : `${formatHours(hours.remaining)} of verified lab work remaining.`}
          </p>
        </div>
      </div>
      <div className="w-full md:w-72 space-y-1">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-slate-700">
            Verified: {hours.approved} / {hours.required} hrs
          </span>
          <span className="text-canvas-orange">{hours.percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Verified lab hours"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={hours.percent}
          className="relative w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200"
        >
          {/* Pending hours shown as a lighter extension behind the verified bar */}
          <div className="absolute inset-y-0 left-0 bg-orange-200" style={{ width: `${hours.projectedPercent}%` }} />
          <div className="absolute inset-y-0 left-0 bg-canvas-orange rounded-full" style={{ width: `${hours.percent}%` }} />
        </div>
        {hours.pending > 0 && (
          <p className="text-[11px] text-slate-600">+ {formatHours(hours.pending)} pending advisor verification</p>
        )}
      </div>
    </section>
  );
}
