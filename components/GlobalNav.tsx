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

const inactiveClass =
  "flex flex-col items-center text-slate-300 hover:text-white transition-colors";

export default function GlobalNav() {
  return (
    <aside className="w-20 bg-canvas-sidebar text-white flex flex-col items-center py-4 space-y-6 flex-shrink-0 min-h-screen z-50">
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
            {item.badge && (
              <span className="absolute top-0 right-3 bg-canvas-orange text-white text-[9px] px-1 rounded-full font-bold">
                {item.badge}
              </span>
            )}
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
