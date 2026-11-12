// Touch devices get 16px text: iOS zooms the page when focusing a field with smaller text.
export const fieldClass =
  "w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs pointer-coarse:text-base focus:ring-1 focus:ring-canvas-sidebar";

export default function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
