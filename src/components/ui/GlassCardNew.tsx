"use client";

interface GlassCardNewProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "strong" | "medium" | "subtle" | "ghost";
  shine?: boolean;
  hover?: boolean;
  borderLeft?: string;
  onClick?: () => void;
}

const INTENSITY: Record<string, string> = {
  strong: "rgba(255,255,255,0.1)",
  medium: "rgba(255,255,255,0.07)",
  subtle: "rgba(255,255,255,0.04)",
  ghost: "rgba(255,255,255,0.02)",
};

export default function GlassCardNew({
  children,
  className = "",
  intensity = "medium",
  shine = true,
  hover = true,
  borderLeft,
  onClick,
}: GlassCardNewProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-lg)] transition-all duration-150 ${hover ? "hover:translate-y-[-1px]" : ""} ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        background: INTENSITY[intensity],
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderLeftWidth: borderLeft ? 3 : undefined,
        borderLeftColor: borderLeft || undefined,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hover) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
      }}
      onMouseLeave={(e) => {
        if (hover) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
      }}
    >
      {shine && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)",
          }}
        />
      )}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
