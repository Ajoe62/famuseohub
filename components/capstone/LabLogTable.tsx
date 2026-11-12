import type { StudentOverview } from "@/lib/services/student";
import { formatDate, formatHours } from "@/lib/format";
import { stackedCell, stackedHead, stackedRow } from "./stackedTable";

const STATUS_BADGE = {
  approved: { className: "bg-emerald-100 text-emerald-800", label: "Verified" },
  pending: { className: "bg-amber-100 text-amber-800", label: "Pending Review" },
  returned: { className: "bg-red-100 text-red-800", label: "Returned" },
} as const;

export default function LabLogTable({ logs }: { logs: StudentOverview["labLogs"] }) {
  if (logs.length === 0) {
    return <p className="text-xs text-slate-500">No lab hours logged yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className={`${stackedHead} bg-slate-50 text-slate-500 uppercase font-bold border-b border-canvas-border`}>
          <tr>
            <th scope="col" className="p-2.5">Date</th>
            <th scope="col" className="p-2.5">Location</th>
            <th scope="col" className="p-2.5">Activity</th>
            <th scope="col" className="p-2.5">Hours</th>
            <th scope="col" className="p-2.5 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {logs.map((entry) => {
            const badge = STATUS_BADGE[entry.status];
            return (
              <tr key={entry.id} className={stackedRow}>
                <td data-label="Date" className={`${stackedCell} sm:p-2.5 sm:whitespace-nowrap`}>{formatDate(entry.date)}</td>
                <td data-label="Location" className={`${stackedCell} sm:p-2.5`}>{entry.location}</td>
                <td data-label="Activity" className={`${stackedCell} sm:p-2.5`}>
                  <span>
                    {entry.activity}
                    {entry.review?.comment && (
                      <span className="block text-[11px] text-red-700 font-semibold mt-0.5">Advisor: {entry.review.comment}</span>
                    )}
                  </span>
                </td>
                <td data-label="Hours" className={`${stackedCell} sm:p-2.5 sm:whitespace-nowrap font-bold text-slate-900`}>
                  {formatHours(entry.hours)}
                </td>
                <td data-label="Status" className={`${stackedCell} sm:p-2.5 text-right`}>
                  <span className={`${badge.className} px-2 py-0.5 rounded font-bold whitespace-nowrap`}>{badge.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
