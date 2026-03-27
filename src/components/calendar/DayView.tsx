"use client";

import { useState, useMemo } from "react";
import NewsHooksBar from "./NewsHooksBar";
import FormatSection from "./FormatSection";
import StoriesSection from "./StoriesSection";
import TwitterHooks from "./TwitterHooks";
import type { ScoredIdea } from "@/lib/supabase/program-output";
import type { DailyNews } from "@/lib/supabase/daily-news";
import type { DbPost } from "@/lib/supabase/posts";

interface DayViewProps {
  date: string;
  dayName: string;
  dayNum: number;
  monthLabel: string;
  ideas: ScoredIdea[];
  news: DailyNews[];
  posts: DbPost[];
  onBack: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const FORMAT_STYLES = {
  reel:     { color: "#C4453A", label: "Reel",     plat: "Instagram + TikTok" },
  carousel: { color: "#A8B78E", label: "Carrusel", plat: "Instagram" },
  tiktok:   { color: "#C4453A", label: "TikTok",   plat: "TikTok (formato propio)" },
  youtube:  { color: "#C4453A", label: "YouTube",  plat: "YouTube (recomendacion semanal)" },
} as const;

export default function DayView({ date, dayName, dayNum, monthLabel, ideas, news, posts, onBack, onApprove, onReject }: DayViewProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Group ideas by format
  const reelIdeas = useMemo(() => ideas.filter((i) => i.format === "reel"), [ideas]);
  const carouselIdeas = useMemo(() => ideas.filter((i) => i.format === "carousel"), [ideas]);
  const storyIdeas = useMemo(() => ideas.filter((i) => i.format === "story"), [ideas]);
  const tiktokIdeas = reelIdeas; // same hooks, different platform for now
  const youtubeIdeas = useMemo(() => ideas.filter((i) => i.total_score >= 7.5).slice(0, 1), [ideas]);

  // Build sections (only those with ideas)
  const sections = useMemo(() => {
    const result: { key: string; label: string; plat: string; color: string; ideas: ScoredIdea[] }[] = [];
    if (reelIdeas.length > 0) result.push({ key: "reel", ...FORMAT_STYLES.reel, ideas: reelIdeas });
    if (carouselIdeas.length > 0) result.push({ key: "carousel", ...FORMAT_STYLES.carousel, ideas: carouselIdeas });
    if (tiktokIdeas.length > 0) result.push({ key: "tiktok", ...FORMAT_STYLES.tiktok, ideas: tiktokIdeas });
    if (youtubeIdeas.length > 0) result.push({ key: "youtube", ...FORMAT_STYLES.youtube, ideas: youtubeIdeas });
    return result;
  }, [reelIdeas, carouselIdeas, tiktokIdeas, youtubeIdeas]);

  // Stats
  const scheduled = ideas.filter((i) => i.status === "scheduled").length;
  const approved = ideas.filter((i) => i.status === "approved").length;
  const pending = ideas.filter((i) => i.status === "suggested").length;

  function toggleSection(key: string) {
    setExpandedSection((prev) => prev === key ? null : key);
  }

  return (
    <div className="animate-[fadeUp_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-baseline gap-2.5">
          <h1
            className="text-[28px] font-[800] tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {dayName} {dayNum}
          </h1>
          <span
            className="text-[10px]"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
          >
            {monthLabel}
          </span>
        </div>
        <button
          onClick={onBack}
          className="w-[32px] h-[32px] rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(0,0,0,0.15)]"
          style={{
            background: "rgba(0,0,0,0.08)",
            border: "0.5px solid rgba(168,183,142,0.08)",
            color: "var(--text-muted)",
            fontSize: 14,
          }}
        >
          ←
        </button>
      </div>

      {/* News Hooks Bar */}
      <NewsHooksBar news={news} />

      {/* Format sections */}
      {sections.map((sec) => (
        <FormatSection
          key={sec.key}
          format={sec.key}
          label={sec.label}
          platform={sec.plat}
          color={sec.color}
          ideas={sec.ideas}
          isExpanded={expandedSection === sec.key}
          onToggle={() => toggleSection(sec.key)}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}

      {/* Stories section */}
      {(storyIdeas.length > 0 || ideas.length > 0) && (
        <StoriesSection
          ideas={storyIdeas}
          isExpanded={expandedSection === "stories"}
          onToggle={() => toggleSection("stories")}
          onApprove={onApprove}
        />
      )}

      {/* Twitter/X hooks */}
      <TwitterHooks ideas={ideas} />

      {/* Summary bar */}
      {ideas.length > 0 && (
        <div
          className="p-2.5 rounded-[10px] text-center"
          style={{ background: "rgba(0,0,0,0.06)", border: "0.5px solid rgba(168,183,142,0.06)" }}
        >
          <span className="text-[9px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            {scheduled} hechos · {approved} aprobados · {pending} pendientes
          </span>
        </div>
      )}

      {/* Empty state */}
      {ideas.length === 0 && posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[16px] font-[800]" style={{ fontFamily: "var(--font-display)", color: "var(--text-muted)" }}>
            Dia libre
          </p>
          <p className="text-[12px] mt-1" style={{ color: "var(--text-ghost)" }}>
            Sin contenido programado
          </p>
        </div>
      )}
    </div>
  );
}
