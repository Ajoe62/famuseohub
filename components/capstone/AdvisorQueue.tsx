import { AlertButton } from "./AlertForm";

const approveButtonClass =
  "bg-canvas-sidebar text-white px-2.5 py-1 rounded font-bold hover:bg-canvas-active transition-colors";

export default function AdvisorQueue() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-canvas-border space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Faculty Advisor Approval Queue</h3>
            <p className="text-xs text-slate-500">Review student proposals, reports, and verify 50-hour lab logs</p>
          </div>
          <span className="text-xs bg-canvas-sidebar text-white font-bold px-2.5 py-1 rounded-lg">2 Pending Actions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-canvas-border">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Type</th>
                <th className="p-3">Details</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr>
                <td className="p-3 font-bold text-slate-900">Rabi Elabor (#ST-88421)</td>
                <td className="p-3">
                  <span className="bg-canvas-sidebar text-white px-2 py-0.5 rounded font-bold">Proposal</span>
                </td>
                <td className="p-3 text-slate-700">Project 1: Microbes & Toxic Metal Survival</td>
                <td className="p-3 text-right space-x-2">
                  <AlertButton message="Proposal approved! Student unlocked Stage 3." className={approveButtonClass}>
                    Approve Proposal
                  </AlertButton>
                  <AlertButton
                    message="Revision request sent to student."
                    className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-bold hover:bg-slate-200 transition-colors"
                  >
                    Request Revision
                  </AlertButton>
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">Rabi Elabor (#ST-88421)</td>
                <td className="p-3">
                  <span className="bg-canvas-orange text-white px-2 py-0.5 rounded font-bold">Lab Log</span>
                </td>
                <td className="p-3 text-slate-700">3.0 Hours • Pond Field Site A (Sensor Calibration)</td>
                <td className="p-3 text-right space-x-2">
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
