import { submitStageAction } from "@/app/actions";
import { FLAGSHIP_DELIVERABLE_TYPES, STAGE_TITLES, THEMES, type Stage, type Track } from "@/lib/curriculum";
import { canSubmit, MILESTONE_LABELS } from "@/lib/capstone/rules";
import type { StudentOverview } from "@/lib/services/student";
import ActionForm, { fieldClass, FormField, SubmitButton } from "../ui/ActionForm";
import { ReviewNote, SubmissionView } from "./SubmissionView";

type StageRow = StudentOverview["stages"][number];

const BADGE: Record<StageRow["status"], string> = {
  approved: "bg-emerald-100 text-emerald-800",
  submitted: "bg-amber-100 text-amber-800",
  revision: "bg-red-100 text-red-800",
  open: "bg-orange-100 text-orange-800",
  locked: "bg-slate-100 text-slate-600",
};

function StageFields({ track, stage, defaults }: { track: Track; stage: Stage; defaults: Record<string, string> }) {
  switch (stage) {
    case 1:
      return (
        <FormField label={track === "flagship" ? "Flagship Research Theme" : "DOE Environmental Management Theme"} name="theme">
          <select className={fieldClass} defaultValue={defaults.theme ?? ""}>
            <option value="" disabled>
              Select a theme…
            </option>
            {THEMES[track].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </FormField>
      );
    case 2:
      return (
        <>
          <FormField label="Problem Statement" name="problemStatement" hint="At least 20 characters.">
            <textarea rows={3} className={fieldClass} defaultValue={defaults.problemStatement} placeholder="Describe the environmental problem…" />
          </FormField>
          {track === "flagship" && (
            <>
              <FormField label="Expected Deliverable Type" name="deliverableType">
                <select className={fieldClass} defaultValue={defaults.deliverableType ?? ""}>
                  <option value="" disabled>
                    Select a deliverable…
                  </option>
                  {FLAGSHIP_DELIVERABLE_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Methodology" name="methodology" hint="Outline steps, instruments and software.">
                <textarea rows={3} className={fieldClass} defaultValue={defaults.methodology} placeholder="Outline steps and software…" />
              </FormField>
            </>
          )}
        </>
      );
    case 3:
      return (
        <>
          <FormField
            label={track === "flagship" ? "Completed Report Document (PDF / Drive link)" : "Completed Report (10+ pages, PDF / Drive link)"}
            name="reportUrl"
          >
            <input type="url" className={fieldClass} defaultValue={defaults.reportUrl} placeholder="https://drive.google.com/file/d/…" />
          </FormField>
          {track === "flagship" && (
            <>
              <FormField label="Project Artifact / Code Repository URL (optional)" name="repoUrl">
                <input type="url" className={fieldClass} defaultValue={defaults.repoUrl} placeholder="https://github.com/…" />
              </FormField>
              <FormField label="Executive Summary (optional)" name="executiveSummary">
                <textarea rows={3} className={fieldClass} defaultValue={defaults.executiveSummary} placeholder="Summarize findings…" />
              </FormField>
            </>
          )}
        </>
      );
    case 4:
      return (
        <FormField label="Presentation Slides Link" name="slidesUrl">
          <input type="url" className={fieldClass} defaultValue={defaults.slidesUrl} placeholder="https://docs.google.com/presentation/…" />
        </FormField>
      );
  }
}

/** One capstone stage. `editable` is false for the advisor's read-only view. */
export default function StageCard({ row, track, editable }: { row: StageRow; track: Track; editable: boolean }) {
  const showForm = editable && canSubmit(row.status);
  const isRevision = row.status === "revision";

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm border border-canvas-border space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-900 text-sm">
          Stage {row.stage}: {STAGE_TITLES[row.stage]}
        </h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${BADGE[row.status]}`}>
          {MILESTONE_LABELS[row.status]}
        </span>
      </div>

      {row.status === "locked" && (
        <p className="text-xs text-slate-600">Unlocks when Stage {row.stage - 1} is approved by your advisor.</p>
      )}

      {row.latestReview && <ReviewNote review={row.latestReview} />}

      {row.latestSubmission && !showForm && <SubmissionView submission={row.latestSubmission} />}

      {showForm && (
        <ActionForm id={`stage-${row.stage}`} action={submitStageAction} resetOnSuccess={false}>
          <input type="hidden" name="stage" value={row.stage} />
          <StageFields track={track} stage={row.stage} defaults={row.latestSubmission?.data ?? {}} />
          <SubmitButton
            pendingLabel="Submitting…"
            className="w-full bg-canvas-orange hover:bg-canvas-orange-hover text-white font-bold py-2 pointer-coarse:py-3 rounded-lg text-xs transition-colors shadow-sm"
          >
            {isRevision ? "Resubmit to Advisor" : "Submit to Advisor"}
          </SubmitButton>
        </ActionForm>
      )}
    </section>
  );
}
