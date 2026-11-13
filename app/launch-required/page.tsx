import { LAUNCH_ERROR_MESSAGES, type LaunchErrorCode } from "@/lib/lti/claims";

export default async function LaunchRequiredPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  const message = reason && reason in LAUNCH_ERROR_MESSAGES ? LAUNCH_ERROR_MESSAGES[reason as LaunchErrorCode] : null;

  return (
    <div role={message ? "alert" : undefined} className="max-w-lg mx-auto bg-white rounded-xl border border-canvas-border p-6 space-y-2 text-sm">
      <h1 className="text-lg font-bold text-slate-900">{message ? "We couldn't open the Capstone Hub" : "Open this tool from Canvas"}</h1>
      <p className="text-slate-600">
        {message ?? (
          <>
            Your session has expired or you opened this page directly. Go back to your course in Canvas and click{" "}
            <strong>Capstone Hub</strong> in the course navigation.
          </>
        )}
      </p>
      {reason && <p className="text-xs text-slate-600">Error code: {reason}</p>}
    </div>
  );
}
