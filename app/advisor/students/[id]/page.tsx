import Link from "next/link";
import { notFound } from "next/navigation";
import LabHoursSummary from "@/components/capstone/LabHoursSummary";
import LabLogTable from "@/components/capstone/LabLogTable";
import MilestoneProgress from "@/components/capstone/MilestoneProgress";
import StageCard from "@/components/capstone/StageCard";
import Header from "@/components/Header";
import { db } from "@/db";
import { requireActor } from "@/lib/auth/session";
import { TRACKS } from "@/lib/curriculum";
import { visibleStudents } from "@/lib/services/advisor";
import { getStudentOverview } from "@/lib/services/student";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor("advisor");
  const { id } = await params;

  // Authorization: only students this advisor may see. Unknown and forbidden look the same.
  const students = await visibleStudents(db, actor);
  if (!students.some((s) => s.membershipId === id)) notFound();

  const overview = await getStudentOverview(db, id);
  const track = overview.membership.track;

  return (
    <>
      <Header title={overview.user.name} />
      <nav className="text-xs text-slate-600 flex items-center gap-2">
        <Link href="/advisor" className="hover:underline text-canvas-sidebar font-semibold pointer-coarse:py-2.5">
          Approval Queue
        </Link>
        <span aria-hidden>/</span>
        <span className="font-bold text-slate-800">{overview.user.name}</span>
      </nav>

      <LabHoursSummary hours={overview.hours} />

      {track ? (
        <>
          <MilestoneProgress heading={`${TRACKS[track].name} · Milestone Progression`} stages={overview.stages} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {overview.stages.map((row) => (
              <StageCard key={row.id} row={row} track={track} editable={false} />
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs text-slate-600">This student hasn&apos;t chosen a capstone track yet.</p>
      )}

      <section className="bg-white rounded-xl p-6 shadow-sm border border-canvas-border space-y-4">
        <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Lab Hours History</h2>
        <LabLogTable logs={overview.labLogs} />
      </section>
    </>
  );
}
