"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";

const NAV_ITEMS = [
  { href: "/", icon: "⌂", labelKey: "nav.home" },
  { href: "/clients", icon: "◈", labelKey: "nav.clients" },
  { href: "/programs", icon: "▦", labelKey: "nav.programs" },
  { href: "/admin", icon: "◆", labelKey: "nav.admin" },
  { href: "/calendar", icon: "▣", labelKey: "nav.calendar" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 md:hidden z-50"
      style={{
        background: "rgba(30,32,28,0.95)",
        backdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex justify-around pt-2 pb-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center py-1 relative"
            >
              {/* Active line */}
              {isActive && (
                <div
                  className="absolute top-0 left-2 right-2 h-[2px] rounded-full"
                  style={{ background: "var(--olive)" }}
                />
              )}

              {/* Icon */}
              <span
                className="text-[18px] mb-[2px] relative"
                style={{ color: isActive ? "var(--olive)" : "var(--text-ghost)" }}
              >
                {item.icon}
              </span>

              {/* Label */}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 7,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--olive)" : "var(--text-ghost)",
                }}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
