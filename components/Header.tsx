import RoleToggle from "./RoleToggle";

export default function Header({ title }: { title: string }) {
  return (
    <header className="flex justify-between items-center border-b border-canvas-border pb-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-xs text-slate-500">
          Florida Agricultural and Mechanical University • famu.instructure.com
        </p>
      </div>
      <div className="flex items-center space-x-3">
        <RoleToggle />
      </div>
    </header>
  );
}
