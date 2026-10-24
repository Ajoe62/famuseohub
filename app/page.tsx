import CapstoneCourseCard from "@/components/dashboard/CapstoneCourseCard";
import CourseCard from "@/components/dashboard/CourseCard";
import Header from "@/components/Header";
import { OTHER_COURSES } from "@/lib/data";

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />

      <div className="space-y-6">
        <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Published Courses</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          <CapstoneCourseCard />
          {OTHER_COURSES.map((course) => (
            <CourseCard key={course.title} course={course} />
          ))}
        </div>
      </div>
    </>
  );
}
