import { redirect } from "next/navigation";
import { getActor } from "@/lib/auth/session";

/**
 * Where a launch lands. If the session cookie survived (most browsers, via Partitioned
 * cookies), continue straight into the app. If the browser blocked it inside the Canvas
 * iframe (e.g. Safari), offer to continue in a new tab with the single-use ticket.
 */
export default async function LtiLandingPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const actor = await getActor();
  if (actor) redirect(actor.role === "advisor" ? "/advisor" : "/");

  const { t } = await searchParams;
  if (!t) redirect("/launch-required?reason=invalid_state");

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl border border-canvas-border p-6 space-y-3 text-sm">
      <h1 className="text-lg font-bold text-slate-900">Continue to the Capstone Hub</h1>
      <p className="text-slate-600">
        Your browser blocked the Capstone Hub from signing you in inside Canvas. Open it in a new tab to continue.
        This link works once and expires in 2 minutes.
      </p>
      <a
        href={`/api/lti/ticket?t=${encodeURIComponent(t)}`}
        target="_blank"
        rel="noopener"
        className="inline-block px-4 py-2 pointer-coarse:py-3 bg-canvas-orange hover:bg-canvas-orange-hover text-white text-xs font-bold rounded-lg"
      >
        Open Capstone Hub in a new tab
      </a>
      <p className="text-xs text-slate-600">If the link has expired, go back to Canvas and click Capstone Hub again.</p>
    </div>
  );
}
