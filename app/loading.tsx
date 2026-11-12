export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="space-y-6 animate-pulse">
      <div className="h-12 w-2/3 rounded-lg bg-slate-200" />
      <div className="h-24 rounded-xl bg-slate-200" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl bg-slate-200" />
        <div className="h-64 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}
