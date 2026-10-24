import RoleToggle from "./RoleToggle";

export default function Header({ title }: { title: string }) {
  return (
    <header className="flex flex-wrap justify-between items-center gap-3 border-b border-canvas-border pb-4">
      <div className="flex items-center gap-3 min-w-0">
        {/* The sidebar (and its logo) is hidden on phones */}
        <div className="md:hidden w-9 h-9 flex-shrink-0 rounded-full bg-canvas-orange text-white flex items-center justify-center font-black text-[10px] tracking-wider shadow-md">
          FAMU
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-500">
            Florida Agricultural and Mechanical University • famu.instructure.com
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <RoleToggle />
      </div>
    </header>
  );
}
