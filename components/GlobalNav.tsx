import Link from "next/link";
import Icon from "./Icon";
import {
  faBook,
  faCalendarDays,
  faCircleQuestion,
  faCircleUser,
  faClockRotateLeft,
  faGaugeHigh,
  faInbox,
  faUsers,
} from "@/lib/icons";

const NAV_ITEMS = [
  { label: "Courses", icon: faBook },
  { label: "Groups", icon: faUsers },
  { label: "Calendar", icon: faCalendarDays },
  { label: "Inbox", icon: faInbox, badge: 2 },
  { label: "History", icon: faClockRotateLeft },
  { label: "Help", icon: faCircleQuestion },
];

// Phones get a bottom tab bar with the most-used items instead of the full sidebar.
const MOBILE_ITEMS = ["Courses", "Calendar", "Inbox"];

const inactiveClass =
  "flex flex-col items-center text-slate-300 hover:text-white transition-colors";

function Badge({ count, className }: { count: number; className: string }) {
  return (
    <span className={`absolute bg-canvas-orange text-white text-[9px] px-1 rounded-full font-bold ${className}`}>
      {count}
    </span>
  );
}

export default function GlobalNav() {
  return (
    <>
      <aside className="hidden md:flex w-20 bg-canvas-sidebar text-white flex-col items-center py-4 space-y-6 flex-shrink-0 min-h-screen z-50">
        <div className="w-10 h-10 rounded-full bg-canvas-orange text-white flex items-center justify-center font-black text-xs tracking-wider shadow-md">
          FAMU
        </div>

        <nav className="flex flex-col space-y-5 w-full items-center text-[11px] font-semibold">
          <a href="#" className={inactiveClass}>
            <Icon icon={faCircleUser} className="text-xl mb-1" />
            <span>Account</span>
          </a>
          <Link
            href="/"
            className="flex flex-col items-center text-white bg-canvas-active w-full py-2 border-l-4 border-canvas-orange"
          >
            <Icon icon={faGaugeHigh} className="text-xl mb-1" />
            <span>Dashboard</span>
          </Link>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href="#"
              className={item.badge ? `${inactiveClass} relative` : inactiveClass}
            >
              <Icon icon={item.icon} className="text-xl mb-1" />
              {item.badge && <Badge count={item.badge} className="top-0 right-3" />}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 h-16 bg-canvas-sidebar text-[10px] font-semibold flex justify-around items-stretch pb-[env(safe-area-inset-bottom)]">
        <Link href="/" className="flex-1 flex flex-col items-center justify-center text-white border-t-4 border-canvas-orange bg-canvas-active">
          <Icon icon={faGaugeHigh} className="text-lg mb-0.5" />
          <span>Dashboard</span>
        </Link>
        {NAV_ITEMS.filter((item) => MOBILE_ITEMS.includes(item.label)).map((item) => (
          <a key={item.label} href="#" className={`${inactiveClass} flex-1 justify-center relative`}>
            <Icon icon={item.icon} className="text-lg mb-0.5" />
            {item.badge && <Badge count={item.badge} className="top-2 left-1/2 ml-1" />}
            <span>{item.label}</span>
          </a>
        ))}
        <a href="#" className={`${inactiveClass} flex-1 justify-center`}>
          <Icon icon={faCircleUser} className="text-lg mb-0.5" />
          <span>Account</span>
        </a>
      </nav>
    </>
  );
}
