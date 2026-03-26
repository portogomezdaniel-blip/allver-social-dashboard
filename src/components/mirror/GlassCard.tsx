interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "strong" | "medium" | "subtle" | "ghost";
  onClick?: () => void;
}

export default function GlassCard({ children, className = "", intensity = "medium", onClick }: GlassCardProps) {
  const bg: Record<string, string> = {
    strong: "rgba(0,0,0,0.25)",
    medium: "rgba(0,0,0,0.18)",
    subtle: "rgba(0,0,0,0.12)",
    ghost: "rgba(0,0,0,0.06)",
  };
  const border: Record<string, string> = {
    strong: "rgba(168,183,142,0.12)",
    medium: "rgba(168,183,142,0.08)",
    subtle: "rgba(168,183,142,0.05)",
    ghost: "rgba(168,183,142,0.03)",
  };

  return (
    <div
      className={`backdrop-blur-sm rounded-[var(--radius-lg)] ${className} ${onClick ? "cursor-pointer" : ""}`}
      style={{ background: bg[intensity], border: `0.5px solid ${border[intensity]}` }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
