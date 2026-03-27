"use client";

import { useRouter } from "next/navigation";
import { Globe, FileText, ExternalLink } from "lucide-react";
import GlassCard from "@/components/mirror/GlassCard";

interface ProgramListItem {
  id: string;
  client_name: string;
  period_label: string | null;
  period_start: string | null;
  period_end: string | null;
  status: string;
  is_published: boolean;
  slug: string | null;
  created_at: string;
}

interface ProgramListProps {
  programs: ProgramListItem[];
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export default function ProgramList({ programs }: ProgramListProps) {
  const router = useRouter();

  if (programs.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[12px] text-[var(--text-muted)]">No hay programas todavía</p>
        <p className="text-[10px] text-[var(--text-ghost)] mt-1">Crea el primero con el botón de arriba</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)] border-b border-[var(--border-ghost)]">
            <th className="pb-3 text-left">Cliente</th>
            <th className="pb-3 text-left">Período</th>
            <th className="pb-3 text-center">Estado</th>
            <th className="pb-3 text-center">Link</th>
            <th className="pb-3 text-right">Creado</th>
          </tr>
        </thead>
        <tbody>
          {programs.map((p) => (
            <tr
              key={p.id}
              onClick={() => router.push(`/programs/${p.id}/edit`)}
              className="border-b border-[var(--border-ghost)] hover:bg-[rgba(0,0,0,0.1)] cursor-pointer transition-colors"
            >
              <td className="py-3 text-[12px] font-[600] text-[var(--text-primary)]">
                {p.client_name || "Sin nombre"}
              </td>
              <td className="py-3 text-[11px] text-[var(--text-secondary)]">
                {p.period_label || (p.period_start && p.period_end
                  ? `${formatDate(p.period_start)} – ${formatDate(p.period_end)}`
                  : "—")}
              </td>
              <td className="py-3 text-center">
                {p.is_published ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[var(--olive)] bg-[rgba(168,183,142,0.1)] px-2 py-0.5 rounded-full">
                    <Globe size={10} /> Publicado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-muted)] bg-[rgba(0,0,0,0.15)] px-2 py-0.5 rounded-full">
                    <FileText size={10} /> Borrador
                  </span>
                )}
              </td>
              <td className="py-3 text-center">
                {p.is_published && p.slug ? (
                  <a
                    href={`/r/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[10px] text-[var(--blue)] hover:underline"
                  >
                    /r/{p.slug} <ExternalLink size={10} />
                  </a>
                ) : (
                  <span className="text-[10px] text-[var(--text-ghost)]">—</span>
                )}
              </td>
              <td className="py-3 text-right text-[10px] text-[var(--text-muted)] font-mono">
                {formatDate(p.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
