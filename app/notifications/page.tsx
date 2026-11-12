import Link from "next/link";
import Header from "@/components/Header";
import { markNotificationsReadAction } from "@/app/actions";
import { db } from "@/db";
import { requireActor } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { listNotifications } from "@/lib/services/notifications";

export default async function NotificationsPage() {
  const actor = await requireActor();
  const items = await listNotifications(db, actor.membershipId);
  const hasUnread = items.some((n) => !n.readAt);
  const home = actor.role === "advisor" ? "/advisor" : "/";

  return (
    <>
      <Header title="Notifications" />
      <div className="flex flex-wrap justify-between items-center gap-2">
        <Link href={home} className="text-xs font-semibold text-canvas-sidebar hover:underline pointer-coarse:py-2.5">
          ← Back to hub
        </Link>
        {hasUnread && (
          <form action={markNotificationsReadAction}>
            <button className="text-xs font-bold px-3 py-1.5 pointer-coarse:py-2.5 rounded-lg border border-canvas-border bg-white hover:bg-slate-50">
              Mark all as read
            </button>
          </form>
        )}
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-canvas-border">
        {items.length === 0 ? (
          <p className="p-6 text-xs text-slate-500">You&apos;re all caught up.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((n) => (
              <li key={n.id} className={`p-4 flex gap-3 items-start ${n.readAt ? "" : "bg-orange-50/60"}`}>
                {!n.readAt && <span className="mt-1.5 w-2 h-2 rounded-full bg-canvas-orange flex-shrink-0" aria-label="Unread" />}
                <div className="min-w-0 text-xs">
                  {n.href ? (
                    <Link href={n.href} className="font-semibold text-slate-900 hover:underline">
                      {n.message}
                    </Link>
                  ) : (
                    <p className="font-semibold text-slate-900">{n.message}</p>
                  )}
                  <p className="text-slate-500 mt-0.5">{formatDateTime(n.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
