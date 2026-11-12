import { notFound } from "next/navigation";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { devLoginAction } from "@/app/actions";
import { db } from "@/db";
import { courses, memberships, users } from "@/db/schema";
import { devLoginEnabled } from "@/lib/auth/session";

/**
 * Development stand-in for the Canvas LTI launch: pick a seeded user to act as.
 * Disabled in production unless ENABLE_DEV_LOGIN=true.
 */
export default async function DevLoginPage() {
  await connection(); // Always render per request. Never prerender the user list at build time.
  if (!devLoginEnabled()) notFound();

  const rows = await db
    .select({ id: memberships.id, role: memberships.role, name: users.name, course: courses.title })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .innerJoin(courses, eq(courses.id, memberships.courseId))
    .orderBy(asc(memberships.role), asc(users.name));

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
        <strong>Development login.</strong> In production, users arrive through the Canvas LTI launch and this page is disabled.
      </div>
      <h1 className="text-xl font-bold text-slate-900">Sign in as…</h1>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-600">
          No users found. Stop the dev server and run <code className="bg-slate-100 px-1 rounded">npm run db:setup</code>.
        </p>
      ) : (
        <ul className="bg-white rounded-xl border border-canvas-border divide-y divide-slate-100">
          {rows.map((r) => (
            <li key={r.id}>
              <form action={devLoginAction}>
                <input type="hidden" name="membershipId" value={r.id} />
                <button className="w-full text-left p-4 hover:bg-slate-50 flex justify-between items-center gap-2">
                  <span>
                    <span className="block font-bold text-sm text-slate-900">{r.name}</span>
                    <span className="block text-xs text-slate-500">{r.course}</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      r.role === "advisor" ? "bg-canvas-sidebar text-white" : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {r.role === "advisor" ? "Advisor" : "Student"}
                  </span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
