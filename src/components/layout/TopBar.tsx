"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TopBar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);
  const [initial, setInitial] = useState("?");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: profile } = await supabase
          .from("creators")
          .select("full_name")
          .eq("id", data.user.id)
          .maybeSingle();
        if (profile?.full_name) {
          setUserName(profile.full_name);
          setInitial(profile.full_name[0]?.toUpperCase() || "?");
        } else {
          const name = data.user.email?.split("@")[0] || "?";
          setUserName(name);
          setInitial(name[0]?.toUpperCase() || "?");
        }
      }
    });
  }, []);

  const isHome = pathname === "/";
  const layerColor = getLayerColor(pathname);
  const layerLabel = getLayerLabel(pathname);

  return (
    <div className="hidden md:flex justify-between items-center px-7 py-3 border-b border-[var(--border-subtle)] relative z-[2]">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[var(--olive)] flex items-center justify-center text-[11px] font-[800] text-[var(--black)]">
          F
        </div>
        <span className="text-[13px] font-bold text-[var(--text-secondary)]">FTP</span>
        <span className="text-[8px] text-[var(--text-muted)] font-mono tracking-[0.1em]">BY LLVR</span>
      </div>

      <div className="flex items-center gap-2">
        {!isHome && (
          <Link href="/" className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            &larr; Volver
          </Link>
        )}
        {layerLabel && (
          <span className="text-[10px] font-mono ml-2" style={{ color: layerColor }}>
            {layerLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link href="/settings">
          <div className="w-7 h-7 rounded-full bg-[var(--bg-card)] flex items-center justify-center text-[10px] text-[var(--olive)] font-semibold border border-[var(--border-subtle)]">
            {initial}
          </div>
        </Link>
      </div>
    </div>
  );
}

function getLayerColor(pathname: string): string {
  if (["/journal", "/settings"].includes(pathname)) return "var(--depth)";
  if (["/ideas", "/hooks", "/templates"].includes(pathname)) return "var(--middle)";
  return "var(--surface)";
}

function getLayerLabel(pathname: string): string {
  if (pathname === "/journal") return "PROFUNDIDAD \u00B7 SIENTE";
  if (pathname === "/settings") return "PROFUNDIDAD \u00B7 TU ESENCIA";
  if (pathname === "/ideas") return "MEDIO \u00B7 PIENSA";
  if (pathname === "/hooks") return "MEDIO \u00B7 PIENSA";
  if (pathname === "/templates") return "MEDIO \u00B7 PIENSA";
  if (pathname === "/calendar") return "SUPERFICIE \u00B7 ACT\u00DAA";
  if (pathname === "/instagram") return "SUPERFICIE \u00B7 ACT\u00DAA";
  if (pathname === "/news") return "SUPERFICIE \u00B7 ACT\u00DAA";
  if (pathname === "/competitors") return "SUPERFICIE \u00B7 ACT\u00DAA";
  if (pathname === "/analytics") return "SUPERFICIE \u00B7 ACT\u00DAA";
  if (pathname === "/agents") return "SISTEMA";
  return "";
}
