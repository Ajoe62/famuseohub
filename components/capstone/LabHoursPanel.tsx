import { LAB_HOURS_REQUIRED, LAB_LOG } from "@/lib/data";
import { faCirclePlus } from "@/lib/icons";
import Icon from "../Icon";
import AlertForm from "./AlertForm";
import FormField, { fieldClass } from "./FormField";
import { stackedCell, stackedHead, stackedRow } from "./stackedTable";

const STATUS_BADGE = {
  Approved: "bg-emerald-100 text-emerald-800",
  "Pending Review": "bg-amber-100 text-amber-800",
};

export default function LabHoursPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Log Hours Form */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-canvas-border space-y-4 lg:col-span-1">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
          <Icon icon={faCirclePlus} className="text-canvas-orange" /> Log New Lab Activity
        </h3>
        <AlertForm message="Lab hours logged successfully! Sent to faculty advisor for verification.">
          <FormField label="Date">
            <input type="date" required className={fieldClass} />
          </FormField>
          <FormField label="Hours Spent">
            <input type="number" step="0.5" min="0.5" max="10" required placeholder="e.g. 3.5" className={fieldClass} />
          </FormField>
          <FormField label="Location / Lab Room">
            <input type="text" required placeholder="e.g. SOE Room 204 / Field Site B" className={fieldClass} />
          </FormField>
          <FormField label="Activity Description">
            <textarea
              rows={2}
              required
              placeholder="Describe experiments, sample prep, or field work..."
              className={fieldClass}
            />
          </FormField>
          <button
            type="submit"
            className="w-full bg-canvas-sidebar hover:bg-canvas-active text-white font-bold py-2 rounded-lg text-xs transition-colors"
          >
            Log Hours for Approval
          </button>
        </AlertForm>
      </div>

      {/* Logged Hours History Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-canvas-border space-y-4 lg:col-span-2">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>Logged Hours History</span>
          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
            Requirement: {LAB_HOURS_REQUIRED} Hours
          </span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`${stackedHead} bg-slate-50 text-slate-500 uppercase font-bold border-b border-canvas-border`}>
              <tr>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Location</th>
                <th className="p-2.5">Activity</th>
                <th className="p-2.5">Hours</th>
                <th className="p-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {LAB_LOG.map((entry) => (
                <tr key={`${entry.date}-${entry.location}`} className={stackedRow}>
                  <td data-label="Date" className={`${stackedCell} sm:p-2.5`}>{entry.date}</td>
                  <td data-label="Location" className={`${stackedCell} sm:p-2.5`}>{entry.location}</td>
                  <td data-label="Activity" className={`${stackedCell} sm:p-2.5`}>{entry.activity}</td>
                  <td data-label="Hours" className={`${stackedCell} sm:p-2.5 font-bold text-slate-900`}>{entry.hours.toFixed(1)} hrs</td>
                  <td data-label="Status" className={`${stackedCell} sm:p-2.5 text-right`}>
                    <span className={`${STATUS_BADGE[entry.status]} px-2 py-0.5 rounded font-bold`}>
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
