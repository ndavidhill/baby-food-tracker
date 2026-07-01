"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogSheet } from "./LogSheet";
import {
  InsightsIcon,
  JournalIcon,
  LeafIcon,
  PlusIcon,
  SunriseIcon,
} from "./icons";

const TABS = [
  { href: "/", label: "Today", Icon: SunriseIcon },
  { href: "/foods", label: "Foods", Icon: LeafIcon },
  { href: "/journal", label: "Journal", Icon: JournalIcon },
  { href: "/insights", label: "Insights", Icon: InsightsIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const { openLog } = useLogSheet();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto w-full max-w-md px-5 pb-[calc(env(safe-area-inset-bottom)+0.9rem)]">
        <nav className="pointer-events-auto relative flex items-center justify-between rounded-[26px] border border-line bg-paper-raised/85 px-3 py-2 shadow-[0_6px_24px_-14px_rgba(60,50,35,0.45)] backdrop-blur-xl">
          {TABS.slice(0, 2).map((tab) => (
            <Tab key={tab.href} tab={tab} pathname={pathname} />
          ))}

          <button
            onClick={() => openLog()}
            aria-label="Log a food"
            className="mx-1 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-paper-raised shadow-[0_6px_18px_-6px_rgba(51,48,42,0.7)] transition-transform active:scale-95"
          >
            <PlusIcon className="h-6 w-6" />
          </button>

          {TABS.slice(2, 4).map((tab) => (
            <Tab key={tab.href} tab={tab} pathname={pathname} />
          ))}
        </nav>
      </div>
    </div>
  );
}

function Tab({
  tab,
  pathname,
}: {
  tab: { href: string; label: string; Icon: typeof SunriseIcon };
  pathname: string;
}) {
  const active =
    tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
  const { Icon } = tab;
  return (
    <Link
      href={tab.href}
      className="flex flex-1 flex-col items-center gap-0.5 py-1"
    >
      <Icon
        className={`h-[22px] w-[22px] transition-colors ${
          active ? "text-ink" : "text-ink-faint"
        }`}
      />
      <span
        className={`text-[10.5px] tracking-wide transition-colors ${
          active ? "font-medium text-ink" : "text-ink-faint"
        }`}
      >
        {tab.label}
      </span>
    </Link>
  );
}
