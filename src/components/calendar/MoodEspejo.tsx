"use client";

import GlassCard from "@/components/mirror/GlassCard";

interface MoodEspejoProps {
  temperature: number;
  mood: string | null;
}

function getLayerInfo(temp: number) {
  if (temp >= 7) return { color: "var(--surface)", label: "Superficie", desc: "Energia alta — contenido confrontacional y directo" };
  if (temp >= 4) return { color: "var(--middle)", label: "Medio", desc: "Equilibrio — contenido educativo y tecnico" };
  return { color: "var(--depth)", label: "Profundidad", desc: "Reflexion — contenido introspectivo y personal" };
}

export default function MoodEspejo({ temperature, mood }: MoodEspejoProps) {
  const layer = getLayerInfo(temperature);
  const moodDisplay = mood || "Sin estado";

  return (
    <GlassCard intensity="subtle" className="p-4 relative overflow-hidden">
      <div style={{ borderLeft: `2px solid ${layer.color}`, paddingLeft: 12 }}>
        <div className="flex items-center gap-3">
          {/* Mini orb */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: `radial-gradient(circle at 40% 40%, ${layer.color}30, rgba(0,0,0,0.05))`,
              border: `1px solid ${layer.color}25`,
              animation: "pulse 3s ease-in-out infinite",
            }}
          >
            <span className="text-[14px] font-[800]" style={{ fontFamily: "var(--font-display)", lineHeight: 1 }}>
              {temperature.toFixed(1)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-[600]" style={{ color: "var(--text-primary)" }}>
              {moodDisplay} · {temperature.toFixed(1)}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              {layer.desc}
            </p>
          </div>
        </div>

        {/* 3 layer dots */}
        <div className="flex items-center gap-2 mt-3">
          {(["surface", "middle", "depth"] as const).map((l) => {
            const dotColor = l === "surface" ? "var(--surface)" : l === "middle" ? "var(--middle)" : "var(--depth)";
            const isActive =
              (l === "surface" && temperature >= 7) ||
              (l === "middle" && temperature >= 4 && temperature < 7) ||
              (l === "depth" && temperature < 4);
            return (
              <div key={l} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full transition-opacity"
                  style={{ background: dotColor, opacity: isActive ? 1 : 0.3 }}
                />
                <span className="text-[7px] tracking-[0.1em] uppercase font-mono" style={{ color: dotColor, opacity: isActive ? 0.8 : 0.3 }}>
                  {l === "surface" ? "Sup" : l === "middle" ? "Med" : "Prof"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
