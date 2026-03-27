"use client";

import type { ScoredIdea } from "@/lib/supabase/program-output";

interface StoriesSectionProps {
  ideas: ScoredIdea[];
  isExpanded: boolean;
  onToggle: () => void;
  onApprove: (id: string) => void;
}

const SLIDE_DEFAULTS = [
  { type: "Encuesta", idea: "Pregunta interactiva al publico" },
  { type: "Behind Scenes", idea: "Momento real de tu dia" },
  { type: "CTA", idea: "Call to action → link en bio" },
];

const AESTHETIC_DEFAULTS: Record<string, { desc: string; tags: string[] }> = {
  "Encuesta": {
    desc: "Fondo oscuro minimalista. Barra de encuesta grande. Elemento visual del nicho al costado con blur de fondo.",
    tags: ["dark minimal", "close-up", "moody"],
  },
  "Behind Scenes": {
    desc: "Video corto o foto en movimiento. Angulo bajo. Espacio de trabajo vacio o casi vacio. Luz natural lateral. Grano de film.",
    tags: ["raw", "film grain", "angulo bajo", "luz natural"],
  },
  "CTA": {
    desc: "Fondo limpio, texto grande centrado. Foto de perfil pequeña abajo. Flecha sutil hacia link. Paleta monocromatica.",
    tags: ["clean", "tipografico", "CTA directo"],
  },
  "Demo": {
    desc: "Screen recording o secuencia paso a paso. Fondo neutro. Texto overlay con pasos numerados.",
    tags: ["tutorial", "screen", "paso a paso"],
  },
  "Dato": {
    desc: "Numero grande centrado sobre fondo oscuro. Fuente impactante. Dato estadistico como protagonista.",
    tags: ["data", "bold number", "contraste"],
  },
  "Testimonio": {
    desc: "Screenshot de mensaje o foto del cliente (con permiso). Marco sutil. Texto de validacion.",
    tags: ["social proof", "screenshot", "real"],
  },
};

function getSlides(ideas: ScoredIdea[]) {
  return Array.from({ length: 3 }, (_, i) => {
    const idea = ideas[i];
    const fallback = SLIDE_DEFAULTS[i];
    const slideType = idea?.title || fallback.type;
    const slideIdea = idea?.hook || fallback.idea;
    const aesthetic = AESTHETIC_DEFAULTS[slideType] || AESTHETIC_DEFAULTS["Behind Scenes"];
    return { num: i + 1, type: slideType, idea: slideIdea, aesthetic, ideaId: idea?.id };
  });
}

export default function StoriesSection({ ideas, isExpanded, onToggle, onApprove }: StoriesSectionProps) {
  const slides = getSlides(ideas);
  const total = ideas.length;

  return (
    <div
      className="mb-3 rounded-[12px] overflow-hidden"
      style={{
        background: "rgba(0,0,0,0.18)",
        backdropFilter: "blur(12px)",
        border: "0.5px solid rgba(168,183,142,0.08)",
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-[14px_16px] transition-colors hover:bg-[rgba(0,0,0,0.06)]"
      >
        <div className="flex items-center gap-3">
          <div className="w-[4px] h-[32px] rounded-[2px] flex-shrink-0" style={{ background: "#6B8CBA" }} />
          <div>
            <span
              className="text-[14px] font-[800] tracking-[-0.01em] block"
              style={{ fontFamily: "var(--font-display)", color: "#6B8CBA" }}
            >
              Stories
            </span>
            <span
              className="text-[8px] tracking-[0.08em] uppercase block mt-0.5"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
            >
              Instagram Stories · 3 slides
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[8px]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            {total > 0 ? `${total} ideas` : "3 slides"}
          </span>
          <span
            className="text-[10px] transition-transform"
            style={{ color: "var(--text-ghost)", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ›
          </span>
        </div>
      </button>

      {/* Body */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-[fadeUp_0.25s_ease-out]">
          <div className="border-t mb-3" style={{ borderColor: "var(--border)" }} />

          {/* 3-col grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-[6px]">
            {slides.map((slide) => (
              <div
                key={slide.num}
                className="rounded-[10px] p-[14px_10px] text-center transition-colors hover:border-[var(--border)]"
                style={{
                  background: "rgba(0,0,0,0.1)",
                  border: "0.5px solid transparent",
                }}
              >
                {/* Slide number */}
                <span
                  className="text-[22px] font-[800] block"
                  style={{ fontFamily: "var(--font-display)", color: "#6B8CBA", lineHeight: 1 }}
                >
                  {slide.num}
                </span>

                {/* Type */}
                <span
                  className="text-[7px] tracking-[0.1em] uppercase block mt-1"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
                >
                  {slide.type}
                </span>

                {/* Idea */}
                <p className="text-[11px] mt-2" style={{ color: "var(--text-secondary)" }}>
                  {slide.idea}
                </p>

                {/* Aesthetic section */}
                <div className="mt-3 pt-2" style={{ borderTop: "0.5px solid var(--border)" }}>
                  <span
                    className="text-[6px] tracking-[0.1em] uppercase block mb-1"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--text-ghost)" }}
                  >
                    FOTO / VISUAL
                  </span>
                  <p
                    className="text-[10px] font-light leading-[1.35]"
                    style={{ fontStyle: "italic", color: "var(--text-muted)" }}
                  >
                    {slide.aesthetic.desc}
                  </p>
                  <div className="flex flex-wrap justify-center gap-[3px] mt-2">
                    {slide.aesthetic.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[6px] tracking-[0.05em] uppercase px-[6px] py-[2px] rounded-[4px]"
                        style={{ fontFamily: "var(--font-mono)", background: "rgba(107,140,186,0.08)", color: "#6B8CBA" }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={() => ideas.forEach((i) => onApprove(i.id))}
              className="text-[8px] tracking-[0.08em] uppercase px-3.5 py-[5px] rounded-[8px] transition-colors"
              style={{ fontFamily: "var(--font-mono)", background: "rgba(168,183,142,0.12)", color: "var(--middle)", border: "0.5px solid rgba(168,183,142,0.2)" }}
            >
              Aprobar secuencia
            </button>
            <button
              className="text-[8px] tracking-[0.08em] uppercase px-3.5 py-[5px] rounded-[8px] transition-colors"
              style={{ fontFamily: "var(--font-mono)", background: "rgba(107,140,186,0.1)", color: "#6B8CBA", border: "0.5px solid rgba(107,140,186,0.15)" }}
              onClick={() => console.log("TODO: editar slides")}
            >
              Editar slides
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
