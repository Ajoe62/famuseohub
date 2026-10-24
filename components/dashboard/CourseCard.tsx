import Icon from "../Icon";
import { faBullhorn, faEllipsisVertical, faFileLines } from "@/lib/icons";
import type { Course } from "@/lib/data";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-canvas-border overflow-hidden opacity-90">
      <div className={`h-32 ${course.bannerClass} p-4 relative`}>
        <div className="absolute top-3 right-3 text-white/80">
          <Icon icon={faEllipsisVertical} className="text-lg" />
        </div>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-slate-900 text-sm">{course.title}</h3>
        <p className="text-xs text-slate-500">{course.subtitle}</p>
        <div className="pt-3 border-t border-slate-100 flex space-x-4 text-slate-400 text-xs">
          <Icon icon={faBullhorn} />
          <Icon icon={faFileLines} />
        </div>
      </div>
    </div>
  );
}
