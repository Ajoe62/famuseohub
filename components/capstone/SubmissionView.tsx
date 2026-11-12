import type { Review, Submission } from "@/db/schema";
import { FIELD_LABELS, formatDateTime } from "@/lib/format";

export function SubmissionView({ submission }: { submission: Submission }) {
  return (
    <dl className="space-y-2 text-xs">
      {Object.entries(submission.data).map(([key, value]) => (
        <div key={key}>
          <dt className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">{FIELD_LABELS[key] ?? key}</dt>
          <dd className="text-slate-800 whitespace-pre-wrap break-words">
            {/^https?:\/\//.test(value) ? (
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-canvas-sidebar font-semibold underline">
                {value}
              </a>
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
      <p className="text-[11px] text-slate-500">Submitted {formatDateTime(submission.createdAt)}</p>
    </dl>
  );
}

export function ReviewNote({ review }: { review: Review }) {
  if (!review.comment) return null;
  const tone = review.decision === "approved" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-red-50 border-red-200 text-red-900";
  return (
    <div className={`rounded-lg border p-3 text-xs ${tone}`}>
      <p className="font-bold mb-0.5">Advisor feedback · {formatDateTime(review.createdAt)}</p>
      <p className="whitespace-pre-wrap">{review.comment}</p>
    </div>
  );
}
