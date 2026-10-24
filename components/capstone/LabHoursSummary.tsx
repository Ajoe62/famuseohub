import { LAB_HOURS_LOGGED, LAB_HOURS_REQUIRED } from "@/lib/data";
import { faStopwatch } from "@/lib/icons";
import Icon from "../Icon";

export default function LabHoursSummary() {
  const percent = Math.round((LAB_HOURS_LOGGED / LAB_HOURS_REQUIRED) * 100);

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-canvas-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-canvas-sidebar text-white flex items-center justify-center font-bold text-lg">
          <Icon icon={faStopwatch} className="text-canvas-orange" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">50-Hour Laboratory & Field Log Progress</h3>
          <p className="text-xs text-slate-500">
            Required hands-on lab work for School of the Environment capstone verification.
          </p>
        </div>
      </div>
      <div className="w-full md:w-64 space-y-1">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-slate-700">
            Logged: {LAB_HOURS_LOGGED} / {LAB_HOURS_REQUIRED} hrs
          </span>
          <span className="text-canvas-orange">{percent}%</span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
          <div
            className="bg-canvas-orange h-full rounded-full transition-all"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
