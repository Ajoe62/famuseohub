import { reviewLabLogAction, reviewSubmissionAction } from "@/app/actions";
import ActionForm, { fieldClass, FormField, SubmitButton } from "../ui/ActionForm";

const btn = "px-3 py-1.5 pointer-coarse:py-2.5 rounded font-bold whitespace-nowrap transition-colors text-xs";

/** Approve, or send back with a required comment. */
export default function ReviewForm({ kind, id }: { kind: "submission" | "labLog"; id: string }) {
  const isSubmission = kind === "submission";
  return (
    <ActionForm id={`review-${id}`} action={isSubmission ? reviewSubmissionAction : reviewLabLogAction} resetOnSuccess={false} className="space-y-2">
      <input type="hidden" name={isSubmission ? "submissionId" : "labLogId"} value={id} />
      <FormField label="Comment" name="comment" hint={isSubmission ? "Required when requesting a revision." : "Required when returning an entry."}>
        <textarea rows={2} className={fieldClass} placeholder="Feedback for the student…" />
      </FormField>
      <div className="flex flex-wrap justify-end gap-2">
        <SubmitButton
          name="decision"
          value={isSubmission ? "revision" : "returned"}
          className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}
        >
          {isSubmission ? "Request Revision" : "Return Entry"}
        </SubmitButton>
        <SubmitButton name="decision" value="approved" className={`${btn} bg-canvas-sidebar text-white hover:bg-canvas-active`}>
          {isSubmission ? "Approve" : "Verify Hours"}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
