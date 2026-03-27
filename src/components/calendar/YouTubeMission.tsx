"use client";

import GlassCard from "@/components/mirror/GlassCard";
import type { DailyNews } from "@/lib/supabase/daily-news";

interface YouTubeMissionProps {
  topNews: DailyNews | null;
  temperature: number;
  journalMood: string | null;
  journalThemes: string[] | null;
}

function generateMissionTitle(news: DailyNews, temp: number): string {
  const topic = news.title;
  if (temp >= 7) return `Lo que NADIE te dice sobre ${topic}`;
  if (temp >= 4) return `Guia completa: como ${topic.toLowerCase()}`;
  return `Mi experiencia personal con ${topic.toLowerCase()}`;
}

export default function YouTubeMission({ topNews, temperature, journalMood, journalThemes }: YouTubeMissionProps) {
  if (!topNews) {
    return (
      <GlassCard intensity="subtle" className="p-4">
        <div style={{ borderTop: "3px solid var(--surface)", marginTop: -16, marginLeft: -16, marginRight: -16, paddingTop: 16, paddingLeft: 16, paddingRight: 16, borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-4 rounded-[2px] flex items-center justify-center" style={{ background: "var(--surface)" }}>
              <div className="w-0 h-0" style={{ borderLeft: "5px solid white", borderTop: "3px solid transparent", borderBottom: "3px solid transparent" }} />
            </div>
            <span className="text-[8px] tracking-[0.15em] uppercase font-mono" style={{ color: "var(--text-muted)" }}>
              MISION SEMANAL · YOUTUBE
            </span>
          </div>
          <p className="text-[12px]" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
            Completa tu journal y genera intel para desbloquear tu mision YouTube
          </p>
        </div>
      </GlassCard>
    );
  }

  const title = generateMissionTitle(topNews, temperature);
  const themeTag = journalThemes?.length ? journalThemes[0] : "—";

  return (
    <GlassCard intensity="subtle" className="p-4 relative overflow-hidden">
      <div style={{ borderTop: "3px solid var(--surface)", marginTop: -16, marginLeft: -16, marginRight: -16, paddingTop: 16, paddingLeft: 16, paddingRight: 16, borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}>
        {/* Tag */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-4 rounded-[2px] flex items-center justify-center" style={{ background: "var(--surface)" }}>
            <div className="w-0 h-0" style={{ borderLeft: "5px solid white", borderTop: "3px solid transparent", borderBottom: "3px solid transparent" }} />
          </div>
          <span className="text-[8px] tracking-[0.15em] uppercase font-mono" style={{ color: "var(--text-muted)" }}>
            MISION SEMANAL · YOUTUBE
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[16px] font-[800] leading-[1.2] tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h3>

        {/* Cross info */}
        <p className="text-[9px] mt-2 font-mono" style={{ color: "var(--text-muted)" }}>
          Intel semana × Temperatura {temperature.toFixed(1)} × Journal ({journalMood || themeTag})
        </p>

        {/* Pills */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[8px] px-2 py-0.5 rounded-full font-mono" style={{ background: "rgba(0,0,0,0.15)", color: "var(--text-secondary)" }}>
            video largo · 12-18 min
          </span>
          <span className="text-[8px] px-2 py-0.5 rounded-full font-mono" style={{ background: "rgba(196,69,58,0.12)", color: "var(--surface)" }}>
            guion pendiente
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
