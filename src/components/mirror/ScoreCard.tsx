interface ScoreCardProps {
  score: number;
  hook: string;
  format: string;
  funnelRole: string;
  source: string;
  children?: React.ReactNode;
}

export default function ScoreCard({ score, hook, format, funnelRole, source, children }: ScoreCardProps) {
  const opacity = score >= 8.5 ? 1 : score >= 7 ? 0.85 : score >= 5 ? 0.65 : 0.4;
  const bgAlpha = score >= 8.5 ? 0.22 : score >= 7 ? 0.15 : score >= 5 ? 0.1 : 0.05;

  const formatColors: Record<string, string> = {
    reel: "var(--filter)",
    carousel: "var(--authority)",
    story: "var(--conversion)",
    single: "var(--brand)",
  };

  const sourceIcons: Record<string, string> = {
    journal: "\uD83D\uDCD4",
    program: "\uD83C\uDFAF",
    ideas_bar: "\uD83D\uDCA1",
    intel: "\uD83D\uDCF0",
  };

  const roleLabels: Record<string, string> = {
    filter: "Filtro",
    authority: "Autoridad",
    conversion: "CTA",
    brand: "Marca",
  };

  return (
    <div
      className="backdrop-blur-sm rounded-[18px] p-4"
      style={{
        opacity,
        background: `rgba(0,0,0,${bgAlpha})`,
        border: `0.5px solid rgba(168,183,142,${bgAlpha * 0.5})`,
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-[18px] font-[800] font-mono"
            style={{ color: score >= 8.5 ? "var(--olive)" : score >= 7 ? "var(--text-secondary)" : "var(--text-muted)" }}
          >
            {score.toFixed(1)}
          </span>
          <span
            className="text-[9px] px-2 py-[2px] rounded-md"
            style={{ background: `${formatColors[format] || "var(--olive)"}15`, color: formatColors[format] || "var(--olive)" }}
          >
            {format.toUpperCase()} &middot; {roleLabels[funnelRole] || funnelRole}
          </span>
        </div>
        <span className="text-[9px] px-2 py-[2px] rounded-md" style={{ background: "rgba(0,0,0,0.1)", color: "var(--text-muted)" }}>
          {sourceIcons[source] || "\uD83D\uDCC4"}{" "}
          {source === "journal" ? "Journal" : source === "program" ? "Programa" : source === "ideas_bar" ? "Ideas" : source === "intel" ? "Intel" : source}
        </span>
      </div>
      <p
        className="text-[13px] leading-relaxed mb-0"
        style={{
          color: score >= 7 ? "var(--text-secondary)" : "var(--text-muted)",
          fontStyle: score >= 8 ? "italic" : "normal",
          fontFamily: score >= 8 ? "var(--font-serif)" : "inherit",
        }}
      >
        &ldquo;{hook}&rdquo;
      </p>
      {children}
    </div>
  );
}
