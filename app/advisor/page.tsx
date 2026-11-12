import Link from "next/link";
import ReviewForm from "@/components/capstone/ReviewForm";
import { SubmissionView } from "@/components/capstone/SubmissionView";
import Header from "@/components/Header";
import { db } from "@/db";
import { requireActor } from "@/lib/auth/session";
import { STAGE_TITLES, TRACKS } from "@/lib/curriculum";
import { formatDate, formatDateTime, formatHours } from "@/lib/format";
import { getQueue } from "@/lib/services/advisor";

const card = "bg-white rounded-xl p-5 shadow-sm border border-canvas-border space-y-3";

export default async function AdvisorQueuePage() {
  const actor = await requireActor("advisor");
  const queue = await getQueue(db, actor);
  const total = queue.submissions.length + queue.labLogs.length;

  return (
    <>
      <Header title="Faculty Advisor Approval Queue" />

      <div className="flex flex-wrap justify-between items-center gap-3">
        <p className="text-xs text-slate-600">Review student milestone submissions and verify lab-hour entries.</p>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-canvas-sidebar text-white font-bold px-2.5 py-1 rounded-lg whitespace-nowrap">
            {total} Pending {total === 1 ? "Action" : "Actions"}
          </span>
          <a
            href="/advisor/export"
            className="text-xs font-bold px-3 py-1.5 pointer-coarse:py-2.5 rounded-lg border border-canvas-border bg-white hover:bg-slate-50 text-slate-700"
          >
            Export verified hours (CSV)
          </a>
        </div>
      </div>

      <section aria-labelledby="sub-heading" className="space-y-3">
        <h2 id="sub-heading" className="text-sm font-bold uppercase text-slate-500 tracking-wider">
          Milestone Submissions ({queue.submissions.length})
        </h2>
        {queue.submissions.length === 0 && <p className="text-xs text-slate-500">Nothing waiting for review.</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          {queue.submissions.map(({ submission, stage, student, isResubmission }) => (
            <article key={submission.id} className={card}>
              <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <Link href={`/advisor/students/${student.membershipId}`} className="font-bold text-sm text-slate-900 hover:underline">
                    {student.name}
                  </Link>
                  <p className="text-[11px] text-slate-500">{student.track ? TRACKS[student.track].name : "No track"}</p>
                </div>
                <span className="self-start bg-canvas-sidebar text-white px-2 py-0.5 rounded font-bold text-[10px] whitespace-nowrap">
                  Stage {stage}: {STAGE_TITLES[stage]}
                  {isResubmission && " · Resubmitted"}
                </span>
              </div>
              <SubmissionView submission={submission} />
              <ReviewForm kind="submission" id={submission.id} />
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="lab-heading" className="space-y-3">
        <h2 id="lab-heading" className="text-sm font-bold uppercase text-slate-500 tracking-wider">
          Lab Hour Entries ({queue.labLogs.length})
        </h2>
        {queue.labLogs.length === 0 && <p className="text-xs text-slate-500">No lab entries waiting for verification.</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          {queue.labLogs.map(({ log, student }) => (
            <article key={log.id} className={card}>
              <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-2">
                <Link href={`/advisor/students/${student.membershipId}`} className="font-bold text-sm text-slate-900 hover:underline">
                  {student.name}
                </Link>
                <span className="self-start bg-canvas-orange text-white px-2 py-0.5 rounded font-bold text-[10px] whitespace-nowrap">
                  Lab Log · {formatHours(log.hours)}
                </span>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                <dt className="font-bold text-slate-500">Date</dt>
                <dd>{formatDate(log.date)}</dd>
                <dt className="font-bold text-slate-500">Location</dt>
                <dd>{log.location}</dd>
                <dt className="font-bold text-slate-500">Activity</dt>
                <dd className="whitespace-pre-wrap break-words">{log.activity}</dd>
                <dt className="font-bold text-slate-500">Logged</dt>
                <dd>{formatDateTime(log.createdAt)}</dd>
              </dl>
              <ReviewForm kind="labLog" id={log.id} />
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="students-heading" className={card}>
        <h2 id="students-heading" className="font-bold text-sm text-slate-900">My Students ({queue.students.length})</h2>
        <ul className="divide-y divide-slate-100 text-xs">
          {queue.students.map((s) => (
            <li key={s.membershipId} className="py-2 flex justify-between gap-2">
              <Link href={`/advisor/students/${s.membershipId}`} className="font-semibold text-canvas-sidebar hover:underline">
                {s.name}
              </Link>
              <span className="text-slate-500">
                {s.track ? TRACKS[s.track].name : "Track not chosen"}
                {!s.advisorId && " · unassigned"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
