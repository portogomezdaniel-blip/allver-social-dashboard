"use client";

interface TemperatureOrbProps {
  temperature: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function TemperatureOrb({ temperature, size = "md", showLabel = true }: TemperatureOrbProps) {
  const color = temperature >= 7 ? "var(--surface)" : temperature >= 4 ? "var(--olive)" : "var(--depth)";
  const label = temperature >= 9 ? "Explosivo" : temperature >= 7 ? "En llamas" : temperature >= 4 ? "Estable" : "Reflexivo";

  const sizes = {
    sm: { orb: "w-12 h-12", text: "text-[18px]", label: "text-[7px]" },
    md: { orb: "w-20 h-20", text: "text-[28px]", label: "text-[8px]" },
    lg: { orb: "w-24 h-24", text: "text-[32px]", label: "text-[8px]" },
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`${sizes[size].orb} rounded-full flex items-center justify-center flex-col`}
        style={{
          background: `radial-gradient(circle at 40% 40%, ${color}30, rgba(168,183,142,0.03))`,
          border: `1px solid ${color}30`,
        }}
      >
        <span className={`${sizes[size].text} font-[800] text-[var(--text-primary)]`} style={{ lineHeight: 1 }}>
          {temperature.toFixed(1)}
        </span>
        {showLabel && (
          <span className={`${sizes[size].label} tracking-[0.12em] uppercase mt-[2px]`} style={{ color }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
