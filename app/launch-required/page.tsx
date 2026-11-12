export default function LaunchRequiredPage() {
  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl border border-canvas-border p-6 space-y-2 text-sm">
      <h1 className="text-lg font-bold text-slate-900">Open this tool from Canvas</h1>
      <p className="text-slate-600">
        Your session has expired or you opened this page directly. Go back to your course in Canvas and click{" "}
        <strong>Capstone Hub</strong> in the course navigation.
      </p>
    </div>
  );
}
