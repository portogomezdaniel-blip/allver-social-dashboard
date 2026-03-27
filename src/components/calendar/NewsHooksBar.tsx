"use client";

import Link from "next/link";
import type { DailyNews } from "@/lib/supabase/daily-news";

interface NewsHooksBarProps {
  news: DailyNews[];
}

const URGENCY_STYLES: Record<string, { color: string; label: string }> = {
  hot:       { color: "#C4453A", label: "HOT" },
  warm:      { color: "#C8AA50", label: "WARM" },
  evergreen: { color: "#A8B78E", label: "EVERGREEN" },
};

export default function NewsHooksBar({ news }: NewsHooksBarProps) {
  if (news.length === 0) return null;

  return (
    <div className="mb-5">
      {/* Label */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-[5px] h-[5px] rounded-full" style={{ background: "#C8AA50" }} />
        <span
          className="text-[8px] tracking-[0.12em] uppercase"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
        >
          INTEL DEL DÍA · CLICK PARA USAR
        </span>
      </div>

      {/* Scrollable row */}
      <div className="flex gap-[4px] overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {news.map((item) => {
          const urgency = URGENCY_STYLES[item.urgency || "warm"] || URGENCY_STYLES.warm;

          return (
            <Link
              key={item.id}
              href="/news"
              className="flex-shrink-0 max-w-[240px] rounded-[10px] p-[10px_12px] transition-all hover:translate-y-[-1px]"
              style={{
                background: "rgba(0,0,0,0.18)",
                backdropFilter: "blur(10px)",
                border: "0.5px solid rgba(168,183,142,0.08)",
                borderTop: `2px solid ${urgency.color}`,
              }}
            >
              {/* Urgency label */}
              <span
                className="text-[6px] tracking-[0.1em] uppercase"
                style={{ fontFamily: "var(--font-mono)", color: urgency.color }}
              >
                • {urgency.label}
              </span>

              {/* Hook */}
              <p
                className="text-[11px] mt-1 leading-[1.35] line-clamp-2"
                style={{ color: "var(--text-secondary)" }}
              >
                {item.suggested_hook || item.title}
              </p>

              {/* CTA */}
              <p
                className="text-[7px] mt-1.5"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}
              >
                Click → usar en contenido
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
