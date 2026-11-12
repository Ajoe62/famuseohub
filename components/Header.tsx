import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, users } from "@/db/schema";
import { logoutAction } from "@/app/actions";
import { devLoginEnabled, getActor } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { unreadCount } from "@/lib/services/notifications";
import { faInbox } from "@/lib/icons";
import Icon from "./Icon";

/** App header. Canvas supplies the global navigation around the iframe, so this stays minimal. */
export default async function Header({ title }: { title: string }) {
  const actor = await getActor();
  const [user, course, unread] = actor
    ? await Promise.all([
        db.select().from(users).where(eq(users.id, actor.userId)).then((r) => r[0]),
        db.select().from(courses).where(eq(courses.id, actor.courseId)).then((r) => r[0]),
        unreadCount(db, actor.membershipId),
      ])
    : [undefined, undefined, 0];

  return (
    <header className="flex flex-wrap justify-between items-center gap-3 border-b border-canvas-border pb-4">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h1>
        {course && (
          <p className="text-xs text-slate-500">
            {course.title} • {course.term}
            {course.deadline && <> • Capstone deadline: {formatDate(course.deadline)}</>}
          </p>
        )}
      </div>

      {actor && user && (
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/notifications"
            className="relative inline-flex items-center gap-1.5 px-3 py-1.5 pointer-coarse:py-2.5 rounded-lg border border-canvas-border bg-white font-bold text-slate-700 hover:bg-slate-50"
          >
            <Icon icon={faInbox} />
            <span>Notifications</span>
            {unread > 0 && (
              <span className="bg-canvas-orange text-white text-[10px] px-1.5 rounded-full font-bold" aria-label={`${unread} unread`}>
                {unread}
              </span>
            )}
          </Link>
          <span className="hidden sm:inline text-slate-600">
            <strong className="text-slate-900">{user.name}</strong> · {actor.role === "advisor" ? "Advisor" : "Student"}
          </span>
          {devLoginEnabled() && (
            <form action={logoutAction}>
              <button className="px-3 py-1.5 pointer-coarse:py-2.5 bg-canvas-sidebar text-white font-bold rounded-lg hover:bg-canvas-active">
                Switch user (dev)
              </button>
            </form>
          )}
        </div>
      )}
    </header>
  );
}
