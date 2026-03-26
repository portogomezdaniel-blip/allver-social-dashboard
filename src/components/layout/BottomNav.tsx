"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", icon: "\uD83C\uDFE0", label: "Home" },
  { href: "/journal", icon: "\uD83D\uDCDD", label: "Journal" },
  { href: "/ideas", icon: "\uD83D\uDCA1", label: "Ideas" },
  { href: "/calendar", icon: "\uD83D\uDCC5", label: "Calendar" },
  { href: "/instagram", icon: "\uD83D\uDCC4", label: "Content" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-[var(--bg-overlay)] backdrop-blur-xl border-t border-[var(--border-subtle)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
    >
      <div className="flex justify-around pt-2 pb-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center py-1"
            >
              <span className="text-[18px] mb-[1px]">{item.icon}</span>
              <span
                className={`text-[9px] ${
                  isActive
                    ? "text-[var(--olive)] font-medium"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
