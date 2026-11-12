import { logLabHoursAction } from "@/app/actions";
import { LAB_HOURS_MAX, LAB_HOURS_MIN, LAB_HOURS_STEP } from "@/lib/curriculum";
import { todayInProgramTz } from "@/lib/capstone/validation";
import type { StudentOverview } from "@/lib/services/student";
import { faCirclePlus } from "@/lib/icons";
import Icon from "../Icon";
import ActionForm, { fieldClass, FormField, SubmitButton } from "../ui/ActionForm";
import LabLogTable from "./LabLogTable";

export default function LabHoursPanel({ overview }: { overview: StudentOverview }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section className="bg-white rounded-xl p-6 shadow-sm border border-canvas-border space-y-4 lg:col-span-1">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
          <Icon icon={faCirclePlus} className="text-canvas-orange" /> Log New Lab Activity
        </h3>
        <ActionForm id="lab-log" action={logLabHoursAction}>
          <FormField label="Date" name="date">
            <input type="date" max={todayInProgramTz()} className={fieldClass} />
          </FormField>
          <FormField label="Hours Spent" name="hours" hint={`${LAB_HOURS_MIN}–${LAB_HOURS_MAX} hours, in ${LAB_HOURS_STEP}-hour steps.`}>
            <input
              type="number"
              inputMode="decimal"
              step={LAB_HOURS_STEP}
              min={LAB_HOURS_MIN}
              max={LAB_HOURS_MAX}
              placeholder="e.g. 3.5"
              className={fieldClass}
            />
          </FormField>
          <FormField label="Location / Lab Room" name="location">
            <input type="text" placeholder="e.g. SOE Room 204 / Field Site B" className={fieldClass} />
          </FormField>
          <FormField label="Activity Description" name="activity">
            <textarea rows={3} placeholder="Describe experiments, sample prep, or field work…" className={fieldClass} />
          </FormField>
          <SubmitButton
            pendingLabel="Logging…"
            className="w-full bg-canvas-sidebar hover:bg-canvas-active text-white font-bold py-2 pointer-coarse:py-3 rounded-lg text-xs transition-colors"
          >
            Log Hours for Approval
          </SubmitButton>
        </ActionForm>
      </section>

      <section className="bg-white rounded-xl p-6 shadow-sm border border-canvas-border space-y-4 lg:col-span-2">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex flex-wrap gap-2 items-center justify-between">
          <span>Logged Hours History</span>
          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
            Requirement: {overview.hours.required} Hours
          </span>
        </h3>
        <LabLogTable logs={overview.labLogs} />
      </section>
    </div>
  );
}
