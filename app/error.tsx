"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="max-w-lg mx-auto bg-white rounded-xl border border-red-200 p-6 space-y-3 text-sm">
      <h1 className="text-lg font-bold text-slate-900">Something went wrong</h1>
      <p className="text-slate-600">We couldn&apos;t load this page. Your saved work is safe. Try again, or relaunch the tool from Canvas.</p>
      <button onClick={reset} className="px-4 py-2 bg-canvas-sidebar text-white text-xs font-bold rounded-lg hover:bg-canvas-active">
        Try again
      </button>
    </div>
  );
}
