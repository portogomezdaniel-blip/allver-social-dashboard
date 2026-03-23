"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  PenSquare,
  Calendar,
  Newspaper,
  Radar,
  Zap,
  LayoutTemplate,
  Bot,
  Settings,
  LogOut,
} from "lucide-react";

const navSections = [
  {
    label: "Principal",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Content", href: "/instagram", icon: PenSquare },
      { name: "Calendar", href: "/calendar", icon: Calendar },
      { name: "Intel", href: "/news", icon: Newspaper },
    ],
  },
  {
    label: "Analisis",
    items: [
      { name: "Recon", href: "/competitors", icon: Radar },
      { name: "Hooks", href: "/hooks", icon: Zap },
      { name: "Templates", href: "/templates", icon: LayoutTemplate },
    ],
  },
  {
    label: "Sistema",
    items: [
      { name: "Agents", href: "/agents", icon: Bot },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initial = userEmail ? userEmail[0].toUpperCase() : "?";
  const displayName = userEmail ? userEmail.split("@")[0] : "...";

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
          <div key={section.label}>
            <p className="text-[10px] font-medium tracking-[0.08em] uppercase text-[var(--text-tertiary)] px-6 mb-1.5">
              {section.label}
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
                    {item.name}
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
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
