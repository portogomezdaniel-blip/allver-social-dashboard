"use client";

import { useState } from "react";
import { Agent, AgentOutput, OutputStatus } from "@/lib/mock-agents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlowButton } from "@/components/ui/glow-button";

const outputStatusConfig: Record<
  OutputStatus,
  { label: string; color: string }
> = {
  pending: {
    label: "Pendiente",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  approved: {
    label: "Aprobado",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  rejected: {
    label: "Rechazado",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
  },
};

interface OutputPreviewProps {
  agent: Agent;
  onApprove: (outputId: string) => void;
  onReject: (outputId: string) => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("es", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CarouselPreview({ output }: { output: AgentOutput }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = output.slides ?? [];

  if (slides.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Carousel viewer */}
      <div className="relative overflow-hidden aspect-square max-w-[400px]">
        {/* Slide */}
        <div
          className={`w-full h-full bg-gradient-to-br ${slides[currentSlide].gradient} flex items-center justify-center p-8 transition-all duration-300`}
        >
          <p className="text-white text-center text-lg font-bold leading-snug drop-shadow-lg">
            {slides[currentSlide].label}
          </p>
        </div>

        {/* Nav arrows */}
        {currentSlide > 0 && (
          <button
            onClick={() => setCurrentSlide(currentSlide - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        )}
        {currentSlide < slides.length - 1 && (
          <button
            onClick={() => setCurrentSlide(currentSlide + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        )}

        {/* Slide counter */}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
          {currentSlide + 1}/{slides.length}
        </div>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentSlide ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Caption */}
      {output.caption && (
        <div className="border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground mb-1.5 font-medium">
            Caption
          </p>
          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
            {output.caption}
          </p>
        </div>
      )}
    </div>
  );
}

function TextPreview({ output }: { output: AgentOutput }) {
  if (!output.textContent) return null;

  return (
    <div className="border border-border bg-background p-4">
      <p className="text-sm text-foreground whitespace-pre-line leading-relaxed font-mono">
        {output.textContent}
      </p>
    </div>
  );
}

export function OutputPreview({
  agent,
  onApprove,
  onReject,
}: OutputPreviewProps) {
  const output = agent.lastOutput;
  const statusConf = outputStatusConfig[output.status];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Ultimo output — {agent.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generado: {formatTime(output.generatedAt)}
            </p>
          </div>
          <Badge variant="outline" className={statusConf.color}>
            {statusConf.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {output.type === "instagram-post" && <CarouselPreview output={output} />}
        {(output.type === "text" || output.type === "report") && (
          <TextPreview output={output} />
        )}

        {/* Approve / Reject */}
        {output.status === "pending" && (
          <div className="flex items-center gap-3 pt-2">
            <GlowButton
              containerClassName="flex-1"
              className="w-full text-center flex items-center justify-center gap-2"
              onClick={() => onApprove(output.id)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
              Aprobar
            </GlowButton>
            <GlowButton
              variant="danger"
              containerClassName="flex-1"
              className="w-full text-center flex items-center justify-center gap-2"
              onClick={() => onReject(output.id)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              Rechazar
            </GlowButton>
          </div>
        )}

        {output.status === "approved" && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm pt-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
            Contenido aprobado y en cola de publicacion
          </div>
        )}

        {output.status === "rejected" && (
          <div className="flex items-center gap-2 text-red-400 text-sm pt-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            Contenido rechazado — el agente generara una nueva version
          </div>
        )}
      </CardContent>
    </Card>
  );
}
