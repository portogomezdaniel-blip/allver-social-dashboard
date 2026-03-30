"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/locale-context";
import {
  LayoutDashboard,
  PenSquare,
  Calendar,
  Sparkles,
  BookOpen,
  Newspaper,
  Radar,
  Zap,
  LayoutTemplate,
  BarChart3,
  Bot,
  Settings,
  LogOut,
} from "lucide-react";

const navSections = [
  {
    labelKey: "nav.principal",
    items: [
      { nameKey: "nav.journal", href: "/journal", icon: BookOpen },
      { nameKey: "nav.ideas", href: "/ideas", icon: Sparkles },
      { nameKey: "nav.calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    labelKey: "nav.crear",
    items: [
      { nameKey: "nav.content", href: "/instagram", icon: PenSquare },
      { nameKey: "nav.hooks", href: "/hooks", icon: Zap },
      { nameKey: "nav.templates", href: "/templates", icon: LayoutTemplate },
    ],
  },
  // HIDDEN v1.1 — not content-focused
  // {
  //   labelKey: "nav.analisis",
  //   items: [
  //     { nameKey: "nav.intel", href: "/news", icon: Newspaper },
  //     { nameKey: "nav.analytics", href: "/analytics", icon: BarChart3 },
  //     { nameKey: "nav.recon", href: "/competitors", icon: Radar },
  //   ],
  // },
  // {
  //   labelKey: "nav.operaciones",
  //   items: [
  //     { nameKey: "nav.clients", href: "/clients", icon: LayoutDashboard },
  //     { nameKey: "nav.admin", href: "/admin", icon: Settings },
  //     { nameKey: "nav.programs", href: "/programs", icon: LayoutTemplate },
  //   ],
  // },
  // {
  //   labelKey: "nav.sistema",
  //   items: [
  //     { nameKey: "nav.agents", href: "/agents", icon: Bot },
  //   ],
  // },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email ?? null);
        const { data: profile } = await supabase.from("creators").select("full_name").eq("id", data.user.id).maybeSingle();
        if (profile?.full_name) setUserName(profile.full_name);
      }
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const displayName = userName || (userEmail ? userEmail.split("@")[0] : "...");
  const initial = displayName[0]?.toUpperCase() || "?";

  return (
    <aside
      className="flex flex-col w-[220px] min-h-screen border-r border-[var(--border)]"
      style={{
        background: "#232325",
        backgroundImage: "var(--satin)",
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-[7px] bg-[var(--text-primary)] flex items-center justify-center">
            <span className="text-[10px] font-semibold text-[var(--bg)] tracking-wider">
              FTP
            </span>
          </div>
          <div>
            <p className="text-[14px] font-medium tracking-[-0.02em] text-[var(--text-primary)]">
              FTP
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.06em]">
              by LLVR
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5">
        {navSections.map((section) => (
          <div key={section.labelKey}>
            <p className="text-[10px] font-medium tracking-[0.08em] uppercase text-[var(--text-tertiary)] px-6 mb-1.5">
              {t(section.labelKey)}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-2.5 px-6 py-2 text-[13px] transition-all duration-150 ${
                      isActive
                        ? "text-[var(--text-primary)] font-medium bg-[rgba(255,255,255,0.05)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-[var(--text-primary)] rounded-r-sm" />
                    )}
                    <Icon
                      size={16}
                      className={
                        isActive ? "opacity-75" : "opacity-45"
                      }
                    />
                    {t(item.nameKey)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--border)] p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-2 py-2 rounded-[6px] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[11px] font-medium text-[var(--text-primary)]">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)]">Creator</p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-2 py-1.5 mt-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <LogOut size={13} className="opacity-45" />
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}
