const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
});

/** "2026-10-14" → "Oct 14, 2026" (calendar dates, no timezone shift). */
export function formatDate(isoDate: string | null | undefined) {
  if (!isoDate) return "—";
  return dateFmt.format(new Date(`${isoDate}T00:00:00Z`));
}

export function formatDateTime(d: Date) {
  return dateTimeFmt.format(d);
}

export function formatHours(h: number) {
  return `${Number.isInteger(h) ? h : h.toFixed(1)} hr${h === 1 ? "" : "s"}`;
}

/** Human labels for submission JSON fields. */
export const FIELD_LABELS: Record<string, string> = {
  theme: "Theme",
  problemStatement: "Problem Statement",
  deliverableType: "Expected Deliverable Type",
  methodology: "Methodology",
  reportUrl: "Completed Report",
  repoUrl: "Project Artifact / Code Repository",
  executiveSummary: "Executive Summary",
  slidesUrl: "Presentation Slides",
};
