import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl border border-canvas-border p-6 space-y-2 text-sm">
      <h1 className="text-lg font-bold text-slate-900">Not found</h1>
      <p className="text-slate-600">This page doesn&apos;t exist, or you don&apos;t have access to it.</p>
      <Link href="/" className="text-canvas-sidebar font-semibold hover:underline">
        Back to the hub
      </Link>
    </div>
  );
}
