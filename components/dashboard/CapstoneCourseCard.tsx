import Link from "next/link";
import Icon from "../Icon";
import { faAward, faDiagramProject, faEllipsisVertical, faFolder, faStopwatch } from "@/lib/icons";

export default function CapstoneCourseCard() {
  return (
    <Link
      href="/courses/capstone"
      className="block bg-white rounded-xl shadow-sm border border-canvas-border overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
    >
      <div className="h-32 bg-canvas-sidebar p-4 relative flex items-end">
        <div className="absolute top-3 right-3 text-white/80 hover:text-white">
          <Icon icon={faEllipsisVertical} className="text-lg" />
        </div>
        <span className="bg-canvas-orange text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
          SOE Requirement
        </span>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-slate-900 text-sm group-hover:text-canvas-orange transition-colors">
          FAMU-SOE Capstone and Lab Hub
        </h3>
        <p className="text-xs text-slate-500">Flagship • Capstone Track • 50-Hour Lab Requirement</p>
        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-slate-400 text-xs">
          <Icon icon={faAward} className="text-canvas-orange hover:text-slate-600" title="Flagship Track" />
          <Icon icon={faDiagramProject} className="hover:text-slate-600" title="Project Capstone" />
          <Icon icon={faStopwatch} className="text-canvas-sidebar hover:text-slate-600" title="50 Lab Hours" />
          <Icon icon={faFolder} className="hover:text-slate-600" />
        </div>
      </div>
    </Link>
  );
}
