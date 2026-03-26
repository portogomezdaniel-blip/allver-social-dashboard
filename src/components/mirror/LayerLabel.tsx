interface LayerLabelProps {
  layer: "surface" | "middle" | "depth";
  label: string;
}

export default function LayerLabel({ layer, label }: LayerLabelProps) {
  const colors = {
    surface: "var(--surface)",
    middle: "var(--middle)",
    depth: "var(--depth)",
  };

  return (
    <p className="text-[8px] tracking-[0.2em] uppercase font-mono mb-3 pl-1" style={{ color: colors[layer] }}>
      {label}
    </p>
  );
}
