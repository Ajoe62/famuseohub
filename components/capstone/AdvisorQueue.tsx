import { AlertButton } from "./AlertForm";
import { stackedCell, stackedHead, stackedRow } from "./stackedTable";

const actionButtonClass = "px-2.5 py-1 pointer-coarse:py-2 rounded font-bold whitespace-nowrap transition-colors";
const approveButtonClass = `${actionButtonClass} bg-canvas-sidebar text-white hover:bg-canvas-active`;
const secondaryButtonClass = `${actionButtonClass} bg-slate-100 text-slate-700 hover:bg-slate-200`;

export default function AdvisorQueue() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-canvas-border space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Faculty Advisor Approval Queue</h3>
            <p className="text-xs text-slate-500">Review student proposals, reports, and verify 50-hour lab logs</p>
          </div>
          <span className="text-xs bg-canvas-sidebar text-white font-bold px-2.5 py-1 rounded-lg whitespace-nowrap">2 Pending Actions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`${stackedHead} bg-slate-50 text-slate-500 uppercase font-bold border-b border-canvas-border`}>
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Type</th>
                <th className="p-3">Details</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr className={stackedRow}>
                <td data-label="Student" className={`${stackedCell} sm:p-3 font-bold text-slate-900`}>
                  <span>
                    Rabi Elabor
                    <span className="block text-[11px] font-medium text-slate-500">#ST-88421</span>
                  </span>
                </td>
                <td data-label="Type" className={`${stackedCell} sm:p-3`}>
                  <span className="bg-canvas-sidebar text-white px-2 py-0.5 rounded font-bold whitespace-nowrap">Proposal</span>
                </td>
                <td data-label="Details" className={`${stackedCell} sm:p-3 text-slate-700`}>Project 1: Microbes & Toxic Metal Survival</td>
                <td className={`${stackedCell} before:hidden max-sm:justify-end max-sm:flex-wrap max-sm:gap-2 max-sm:pt-2 sm:p-3 sm:space-x-2 sm:whitespace-nowrap text-right`}>
                  <AlertButton message="Proposal approved! Student unlocked Stage 3." className={approveButtonClass}>
                    Approve Proposal
                  </AlertButton>
                  <AlertButton
                    message="Revision request sent to student."
                    className={secondaryButtonClass}
                  >
                    Request Revision
                  </AlertButton>
                </td>
              </tr>
              <tr className={stackedRow}>
                <td data-label="Student" className={`${stackedCell} sm:p-3 font-bold text-slate-900`}>
                  <span>
                    Rabi Elabor
                    <span className="block text-[11px] font-medium text-slate-500">#ST-88421</span>
                  </span>
                </td>
                <td data-label="Type" className={`${stackedCell} sm:p-3`}>
                  <span className="bg-canvas-orange text-white px-2 py-0.5 rounded font-bold whitespace-nowrap">Lab Log</span>
                </td>
                <td data-label="Details" className={`${stackedCell} sm:p-3 text-slate-700`}>3.0 Hours • Pond Field Site A (Sensor Calibration)</td>
                <td className={`${stackedCell} before:hidden max-sm:justify-end max-sm:flex-wrap max-sm:gap-2 max-sm:pt-2 sm:p-3 sm:space-x-2 sm:whitespace-nowrap text-right`}>
                  <AlertButton message="Lab Hours Approved!" className={approveButtonClass}>
                    Approve Hours
                  </AlertButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
