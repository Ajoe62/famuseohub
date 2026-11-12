import { and, count, desc, eq, isNull } from "drizzle-orm";
import type { DB } from "@/db";
import { memberships, notifications } from "@/db/schema";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

export async function notify(db: DB | Tx, membershipIds: string[], message: string, href?: string) {
  if (membershipIds.length === 0) return;
  await db.insert(notifications).values(membershipIds.map((membershipId) => ({ membershipId, message, href })));
}

/** Advisors who should hear about a student's activity: the assigned advisor, or every advisor in the course. */
export async function advisorsFor(db: DB | Tx, student: { courseId: string; advisorId: string | null }) {
  if (student.advisorId) return [student.advisorId];
  const rows = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(and(eq(memberships.courseId, student.courseId), eq(memberships.role, "advisor")));
  return rows.map((r) => r.id);
}

export async function unreadCount(db: DB, membershipId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.membershipId, membershipId), isNull(notifications.readAt)));
  return row?.n ?? 0;
}

export async function listNotifications(db: DB, membershipId: string, limit = 50) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.membershipId, membershipId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markAllRead(db: DB, membershipId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.membershipId, membershipId), isNull(notifications.readAt)));
}
