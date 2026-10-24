import { FLAGSHIP_DELIVERABLE_TYPES, FLAGSHIP_MILESTONES, FLAGSHIP_THEMES } from "@/lib/data";
import { faCloudArrowUp, faFileSignature } from "@/lib/icons";
import Icon from "../Icon";
import AlertForm from "./AlertForm";
import FormField, { fieldClass } from "./FormField";
import MilestoneProgress from "./MilestoneProgress";

export default function FlagshipPanel() {
  return (
    <div className="space-y-6">
      <MilestoneProgress heading="Flagship Capstone Milestone Progression" milestones={FLAGSHIP_MILESTONES} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-canvas-border space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Icon icon={faFileSignature} className="text-canvas-orange" /> Stage 2: Flagship Research Proposal
            </h3>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
              Proposal Submitted
            </span>
          </div>
          <AlertForm message="Submitted Flagship Proposal for advisor review!">
            <FormField label="Flagship Research Theme">
              <select className={fieldClass}>
                {FLAGSHIP_THEMES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Problem Statement">
              <textarea rows={2} className={fieldClass} placeholder="Describe the environmental problem..." />
            </FormField>
            <FormField label="Expected Deliverable Type">
              <select className={fieldClass}>
                {FLAGSHIP_DELIVERABLE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Methodology">
              <textarea rows={2} className={fieldClass} placeholder="Outline steps and software..." />
            </FormField>
            <button
              type="submit"
              className="w-full bg-canvas-orange hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm"
            >
              Submit Proposal to Advisor
            </button>
          </AlertForm>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-canvas-border space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Icon icon={faCloudArrowUp} className="text-canvas-sidebar" /> Stage 3 & 4: Completed Project & Deck
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">
              Final Milestone
            </span>
          </div>
          <AlertForm message="Submitted Flagship Final Deliverables for advisor review!">
            <FormField label="Completed Report Document (PDF Link / Drive URL)">
              <input type="url" required placeholder="https://drive.google.com/file/d/..." className={fieldClass} />
            </FormField>
            <FormField label="Presentation Slides Link">
              <input type="url" required placeholder="https://docs.google.com/presentation/..." className={fieldClass} />
            </FormField>
            <FormField label="Project Artifact / Code Repository URL">
              <input type="url" placeholder="https://github.com/..." className={fieldClass} />
            </FormField>
            <FormField label="Executive Summary">
              <textarea rows={2} className={fieldClass} placeholder="Summarize findings..." />
            </FormField>
            <button
              type="submit"
              className="w-full bg-canvas-sidebar hover:bg-canvas-active text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm"
            >
              Submit Final Milestone Package
            </button>
          </AlertForm>
        </div>
      </div>
    </div>
  );
}
