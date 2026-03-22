"use client";

import { Tiles } from "@/components/ui/tiles";

export function TilesBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <Tiles
        rows={80}
        cols={12}
        tileSize="md"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D1008]/60 via-[#0D1008]/90 to-[#0D1008]" />
    </div>
  );
}
