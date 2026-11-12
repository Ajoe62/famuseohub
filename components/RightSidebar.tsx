import Link from "next/link";
import { CAPSTONE_DEADLINE, LAB_HOURS_LOGGED, LAB_HOURS_REQUIRED } from "@/lib/data";

// Below xl this sits under the page content as a row of panels; from xl up it's a right-hand column.
const sectionClass =
  "space-y-2 border-b border-canvas-border pb-3 sm:border-b-0 sm:pb-0 xl:border-b xl:pb-3";

export default function RightSidebar() {
  return (
    <aside className="w-full xl:w-64 p-4 sm:p-6 border-t xl:border-t-0 xl:border-l border-canvas-border flex-shrink-0 bg-white grid gap-6 sm:grid-cols-3 sm:items-start xl:block xl:space-y-6">
      <div className={sectionClass}>
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Lab Requirements</h3>
        <p className="text-xs text-slate-600">
          Total Required: <strong>{LAB_HOURS_REQUIRED} Hours</strong>
        </p>
        <p className="text-xs text-slate-600">
          Current Status:{" "}
          <strong className="text-canvas-orange">{LAB_HOURS_LOGGED} Approved / Pending</strong>
        </p>
      </div>

      <div className={sectionClass}>
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Coming Up</h3>
        <p className="text-xs text-slate-600 font-semibold">Capstone Deliverable Deadline:</p>
        <p className="text-xs text-slate-500">{CAPSTONE_DEADLINE}</p>
      </div>

      <Link
        href="/courses/capstone"
        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 pointer-coarse:py-3 px-3 rounded-lg text-center block"
      >
        View Capstone Hub
      </Link>
    </aside>
  );
}
