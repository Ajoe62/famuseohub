import Link from "next/link";
import { CAPSTONE_DEADLINE, LAB_HOURS_LOGGED, LAB_HOURS_REQUIRED } from "@/lib/data";

export default function RightSidebar() {
  return (
    <aside className="w-full lg:w-64 p-6 border-t lg:border-t-0 lg:border-l border-canvas-border space-y-6 flex-shrink-0 bg-white">
      <div className="space-y-2 border-b border-canvas-border pb-3">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Lab Requirements</h3>
        <p className="text-xs text-slate-600">
          Total Required: <strong>{LAB_HOURS_REQUIRED} Hours</strong>
        </p>
        <p className="text-xs text-slate-600">
          Current Status:{" "}
          <strong className="text-canvas-orange">{LAB_HOURS_LOGGED} Approved / Pending</strong>
        </p>
      </div>

      <div className="space-y-2 border-b border-canvas-border pb-3">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Coming Up</h3>
        <p className="text-xs text-slate-600 font-semibold">Capstone Deliverable Deadline:</p>
        <p className="text-xs text-slate-500">{CAPSTONE_DEADLINE}</p>
      </div>

      <Link
        href="/courses/capstone"
        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg text-center block"
      >
        View Capstone Hub
      </Link>
    </aside>
  );
}
