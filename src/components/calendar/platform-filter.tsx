"use client";

import { Platform, platformConfig } from "@/lib/mock-calendar";

interface PlatformFilterProps {
  selected: Platform[];
  onChange: (platforms: Platform[]) => void;
}

const allPlatforms: Platform[] = ["instagram", "youtube", "tiktok", "linkedin"];

export function PlatformFilter({ selected, onChange }: PlatformFilterProps) {
  function toggle(platform: Platform) {
    if (selected.includes(platform)) {
      // Don't allow deselecting all
      if (selected.length === 1) return;
      onChange(selected.filter((p) => p !== platform));
    } else {
      onChange([...selected, platform]);
    }
  }

  const allSelected = selected.length === allPlatforms.length;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(allPlatforms)}
        className={`border px-3 py-1.5 text-xs font-medium transition-colors ${
          allSelected
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        Todas
      </button>
      {allPlatforms.map((platform) => {
        const config = platformConfig[platform];
        const isActive = selected.includes(platform);
        return (
          <button
            key={platform}
            onClick={() => toggle(platform)}
            className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? `${config.color}`
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isActive ? config.dotColor : "bg-muted-foreground"}`}
            />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
