"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/locale-context";

interface NavItem {
  href: string;
  icon: string;
  labelKey: string;
  badge?: boolean;
}

interface NavSection {
  labelKey: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    labelKey: "nav.principal",
    items: [
      { href: "/journal", icon: "✎", labelKey: "nav.journal" },
      { href: "/ideas", icon: "★", labelKey: "nav.ideas", badge: true },
      { href: "/calendar", icon: "▣", labelKey: "nav.calendar" },
    ],
  },
  {
    labelKey: "nav.crear",
    items: [
      { href: "/instagram", icon: "⌂", labelKey: "nav.content" },
      { href: "/hooks", icon: "⚡", labelKey: "nav.hooks" },
      { href: "/templates", icon: "☷", labelKey: "nav.templates" },
    ],
  },
  {
    labelKey: "nav.analisis",
    items: [
      { href: "/news", icon: "◇", labelKey: "nav.intel" },
      { href: "/analytics", icon: "◆", labelKey: "nav.analytics" },
      { href: "/competitors", icon: "◎", labelKey: "nav.recon" },
    ],
  },
  {
    labelKey: "nav.operaciones",
    items: [
      { href: "/clients", icon: "◈", labelKey: "nav.clients" },
      { href: "/admin", icon: "◆", labelKey: "nav.admin" },
      { href: "/programs", icon: "▦", labelKey: "nav.programs" },
    ],
  },
  {
    labelKey: "nav.sistema",
    items: [
      { href: "/agents", icon: "●", labelKey: "nav.agents" },
    ],
  },
];

interface SidebarProps {
  creatorName?: string;
  temperature?: number;
}

export default function Sidebar({ creatorName = "Creador", temperature = 5 }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLocale();

  const tempLabel = temperature >= 7 ? "En llamas" : temperature >= 4 ? "Estable" : "Reflexivo";
  const initials = creatorName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      className="w-[230px] sticky top-0 h-screen flex flex-col p-[20px_14px]"
      style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {/* Brand */}
      <Link href="/" className="mb-6 px-2">
        <span style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
          FTP<span style={{ color: "var(--red)" }}>.</span>
        </span>
        <span
          className="block mt-[-2px]"
          style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}
        >
          by LLVR
        </span>
      </Link>

      {/* Nav sections */}
      <nav className="flex-1 space-y-5 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.labelKey}>
            <p
              className="px-2 mb-1.5"
              style={{ fontFamily: "var(--font-mono)", fontSize: 7, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-ghost)" }}
            >
              {t(section.labelKey)}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-[10px] py-[7px] rounded-[8px] transition-all relative"
                    style={{
                      fontSize: 13,
                      color: isActive ? "var(--olive)" : "var(--text-secondary)",
                      fontWeight: isActive ? 600 : 400,
                      background: isActive ? "rgba(122,140,101,0.15)" : "transparent",
                      border: isActive ? "1px solid rgba(122,140,101,0.25)" : "1px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <span className="text-[14px] w-5 text-center">{item.icon}</span>
                    <span>{t(item.labelKey)}</span>
                    {item.badge && (
                      <span className="ml-auto w-[6px] h-[6px] rounded-full bg-[var(--red)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <Link
        href="/settings"
        className="flex items-center gap-2.5 px-2 py-2 mt-4 rounded-[8px] transition-colors hover:bg-[rgba(255,255,255,0.06)]"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-[600] flex-shrink-0"
          style={{ background: "rgba(122,140,101,0.2)", border: "1px solid rgba(122,140,101,0.3)", color: "var(--olive)" }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-[500] truncate" style={{ color: "var(--text-secondary)" }}>
            {creatorName}
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-muted)" }}>
            Temp {temperature.toFixed(1)} · {tempLabel}
          </p>
        </div>
      </Link>
    </div>
  );
}
