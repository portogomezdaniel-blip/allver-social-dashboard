"use client";

import type { ScoredIdea } from "@/lib/supabase/program-output";

interface TwitterHooksProps {
  ideas: ScoredIdea[];
}

export default function TwitterHooks({ ideas }: TwitterHooksProps) {
  const uniqueHooks = [...new Set(ideas.map((i) => i.hook).filter(Boolean))];
  if (uniqueHooks.length === 0) return null;

  return (
    <div className="mb-4">
      {/* Label */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-[5px] h-[5px] rounded-full" style={{ background: "var(--text-muted)" }} />
        <span
          className="text-[8px] tracking-[0.12em] uppercase"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
        >
          X / THREADS
        </span>
      </div>

      {/* Pills */}
      <div className="flex flex-wrap gap-[4px]">
        {uniqueHooks.map((hook, i) => (
          <span
            key={i}
            className="text-[11px] px-[14px] py-[8px] rounded-[20px] cursor-pointer transition-colors hover:bg-[rgba(0,0,0,0.25)]"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              color: "var(--text-secondary)",
              background: "rgba(0,0,0,0.18)",
              borderLeft: "2px solid var(--text-muted)",
            }}
          >
            {hook}
          </span>
        ))}
      </div>
    </div>
  );
}
