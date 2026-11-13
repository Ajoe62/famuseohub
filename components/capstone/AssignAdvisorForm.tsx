import { assignAdvisorAction } from "@/app/actions";
import ActionForm, { fieldClass, FormField, SubmitButton } from "../ui/ActionForm";

export default function AssignAdvisorForm({
  studentId,
  studentName,
  current,
  advisors,
}: {
  studentId: string;
  studentName: string;
  current: string | null;
  advisors: { membershipId: string; name: string }[];
}) {
  return (
    <ActionForm id={`assign-${studentId}`} action={assignAdvisorAction} resetOnSuccess={false} className="flex items-end gap-2">
      <input type="hidden" name="studentId" value={studentId} />
      <div className="min-w-0 flex-1 sm:w-52 sm:flex-none">
        <FormField label={`Advisor for ${studentName}`} name="advisorId" hideLabel>
          <select className={fieldClass} defaultValue={current ?? ""}>
            <option value="">Unassigned</option>
            {advisors.map((a) => (
              <option key={a.membershipId} value={a.membershipId}>
                {a.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <SubmitButton
        pendingLabel="Saving…"
        className="px-3 py-2 pointer-coarse:py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold whitespace-nowrap"
      >
        Save
      </SubmitButton>
    </ActionForm>
  );
}
