import { DOE_THEMES, PROJECT_MILESTONES } from "@/lib/data";
import { faCloudArrowUp, faDiagramProject } from "@/lib/icons";
import Icon from "../Icon";
import AlertForm from "./AlertForm";
import FormField, { fieldClass } from "./FormField";
import MilestoneProgress from "./MilestoneProgress";

export default function ProjectPanel() {
  return (
    <div className="space-y-6">
      <MilestoneProgress heading="Project Capstone Milestone Progression" milestones={PROJECT_MILESTONES} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-canvas-border space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
            <Icon icon={faDiagramProject} className="text-canvas-orange" /> Stage 2: Project Proposal Submission
          </h3>
          <AlertForm message="Submitted Project Proposal for advisor review!">
            <FormField label="DOE Environmental Management Theme">
              <select className={fieldClass}>
                {DOE_THEMES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Problem Statement">
              <textarea rows={2} className={fieldClass} placeholder="Describe the problem..." />
            </FormField>
            <button
              type="submit"
              className="w-full bg-canvas-orange hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-xs"
            >
              Submit Proposal
            </button>
          </AlertForm>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-canvas-border space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
            <Icon icon={faCloudArrowUp} className="text-canvas-sidebar" /> Stage 3 & 4: Project Deliverables
          </h3>
          <AlertForm message="Submitted Project Final Deliverables for advisor review!">
            <FormField label="Completed Report (10+ Pages, PDF Link)">
              <input type="url" required placeholder="https://drive.google.com/file/d/..." className={fieldClass} />
            </FormField>
            <FormField label="Presentation Slides Link">
              <input type="url" required placeholder="https://docs.google.com/presentation/..." className={fieldClass} />
            </FormField>
            <button
              type="submit"
              className="w-full bg-canvas-sidebar hover:bg-canvas-active text-white font-bold py-2 rounded-lg text-xs"
            >
              Submit Final Package
            </button>
          </AlertForm>
        </div>
      </div>
    </div>
  );
}
