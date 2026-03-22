"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const sections = [
  { name: "Content", href: "/instagram", icon: "Instagram" },
  { name: "Analytics", href: "/analytics", icon: "BarChart3" },
  { name: "Calendar", href: "/calendar", icon: "Calendar" },
  { name: "Recon", href: "/competitors", icon: "Users" },
  { name: "Intel", href: "/news", icon: "Newspaper" },
  { name: "Agents", href: "/agents", icon: "Bot" },
];

const icons: Record<string, React.ReactNode> = {
  Instagram: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="0" ry="0"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
  ),
  BarChart3: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
  ),
  Calendar: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="0"/><path d="M3 10h18"/></svg>
  ),
  Users: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Newspaper: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
  ),
  Bot: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="0"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
  ),
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-sidebar border-r border-border">
      <div className="px-5 py-6">
        <h1 className="text-base font-bold tracking-[0.15em] text-foreground">
          FTP
        </h1>
        <p className="text-[10px] text-muted-foreground tracking-[0.2em] mt-0.5">
          BY LLVR
        </p>
      </div>
      <nav className="flex-1 px-2 space-y-0.5">
        {sections.map((section) => {
          const isActive = pathname === section.href;
          return (
            <Link
              key={section.href}
              href={section.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-xs tracking-[0.1em] uppercase transition-colors border-l-2 ${
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-sidebar-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <span className={isActive ? "text-primary" : "opacity-50"}>
                {icons[section.icon]}
              </span>
              {section.name}
            </Link>
          );
        })}
      </nav>
      <div className="px-2 py-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          Salir
        </button>
      </div>
    </aside>
  );
}
