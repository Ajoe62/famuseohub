import { CURRICULUM_LINKS } from "@/lib/data";
import { faArrowUpRightFromSquare, faFileWord, faFlask } from "@/lib/icons";
import Icon from "../Icon";

export default function CurriculumLinks() {
  return (
    <div className="bg-canvas-sidebar text-white rounded-xl p-4 shadow-sm border border-emerald-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center space-x-3">
        <div className="bg-canvas-orange p-2.5 rounded-lg text-white">
          <Icon icon={faFileWord} className="text-xl" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Official Curriculum & Topic Reference Guides</h3>
          <p className="text-xs text-emerald-200">Review guidelines before submitting your milestone proposals.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={CURRICULUM_LINKS.doeGuidelines}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-emerald-700"
        >
          <Icon icon={faArrowUpRightFromSquare} className="text-[10px]" /> DOE Capstone Guidelines
        </a>
        <a
          href={CURRICULUM_LINKS.bioremediationGuide}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-canvas-orange hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Icon icon={faFlask} className="text-[10px]" /> Flagship Bioremediation Guide
        </a>
      </div>
    </div>
  );
}
