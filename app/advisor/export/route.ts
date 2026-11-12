import { db } from "@/db";
import { getActor } from "@/lib/auth/session";
import { todayInProgramTz } from "@/lib/capstone/validation";
import { verifiedHoursReport } from "@/lib/services/advisor";

/** Quote a CSV cell and neutralise spreadsheet formula injection (=, +, -, @ prefixes). */
function cell(value: string | number | null | undefined) {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  const actor = await getActor();
  if (!actor || actor.role !== "advisor") return new Response("Forbidden", { status: 403 });

  const report = await verifiedHoursReport(db, actor);
  const lines = [["Student", "Date", "Hours", "Location", "Activity", "Verified By", "Verified At", "Student Total Verified"].map(cell).join(",")];
  for (const { student, entries, summary } of report) {
    for (const e of entries) {
      lines.push(
        [student.name, e.date, e.hours, e.location, e.activity, e.approval?.reviewer, e.approval?.reviewedAt.toISOString(), summary.approved]
          .map(cell)
          .join(","),
      );
    }
  }

  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="verified-lab-hours-${todayInProgramTz()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
