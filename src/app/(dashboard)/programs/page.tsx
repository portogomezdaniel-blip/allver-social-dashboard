"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import GlassCard from "@/components/mirror/GlassCard";
import ProgramList from "./components/ProgramList";

export default function ProgramsPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/programs")
      .then((r) => r.json())
      .then((data) => setPrograms(Array.isArray(data) ? data : []))
      .catch(() => setPrograms([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: "",
          frequency: 4,
          program_json: {
            days: Array.from({ length: 4 }, (_, i) => ({
              id: crypto.randomUUID(),
              name: `Día ${i + 1}`,
              exercises: [
                { id: crypto.randomUUID(), name: "", sets: "", reps: "", rpe: "", weight: "", rest: "", notes: "" },
              ],
            })),
          },
        }),
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/programs/${data.id}/edit`);
      }
    } catch {
      // silently fail
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-[24px] font-[800]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Programas
          </h1>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Rutinas de entrenamiento para tus clientes
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 bg-[var(--olive)] text-[var(--bg-deep)] font-[700] text-[11px] px-4 py-2.5 rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          NUEVO PROGRAMA
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <GlassCard intensity="ghost" className="p-3">
          <div style={{ borderLeft: "2px solid var(--olive)", paddingLeft: "10px" }}>
            <p className="text-[18px] font-mono font-[800]">
              {programs.length}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">Total</p>
          </div>
        </GlassCard>
        <GlassCard intensity="ghost" className="p-3">
          <div style={{ borderLeft: "2px solid var(--blue)", paddingLeft: "10px" }}>
            <p className="text-[18px] font-mono font-[800]">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {programs.filter((p: any) => p.is_published).length}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">Publicados</p>
          </div>
        </GlassCard>
        <GlassCard intensity="ghost" className="p-3">
          <div style={{ borderLeft: "2px solid var(--text-muted)", paddingLeft: "10px" }}>
            <p className="text-[18px] font-mono font-[800]">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {programs.filter((p: any) => !p.is_published).length}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">Borradores</p>
          </div>
        </GlassCard>
      </div>

      {/* List */}
      <GlassCard intensity="ghost" className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
          </div>
        ) : (
          <ProgramList programs={programs} />
        )}
      </GlassCard>
    </div>
  );
}
