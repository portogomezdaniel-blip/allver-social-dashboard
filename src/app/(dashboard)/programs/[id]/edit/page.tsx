"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle, Copy } from "lucide-react";
import GlassCard from "@/components/mirror/GlassCard";
import RoutineEditor from "../../components/RoutineEditor";
import { ProgramData, createDefaultProgram } from "@/lib/programs";

export default function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [program, setProgram] = useState<ProgramData>(createDefaultProgram());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/programs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setProgram(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/programs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(program),
      });
      if (res.ok) {
        setMessage("Guardado");
        setTimeout(() => setMessage(""), 2000);
      }
    } catch {
      setMessage("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    // Save first
    setPublishing(true);
    setMessage("");
    try {
      await fetch(`/api/programs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(program),
      });

      const res = await fetch(`/api/programs/${id}/publish`, { method: "POST" });
      const data = await res.json();

      if (data.slug) {
        setProgram((prev) => ({ ...prev, is_published: true, slug: data.slug }));
        const url = `${window.location.origin}/r/${data.slug}`;
        setPublishedUrl(url);
        setMessage("Publicado");
      }
    } catch {
      setMessage("Error al publicar");
    } finally {
      setPublishing(false);
    }
  }

  function copyUrl() {
    if (publishedUrl) {
      navigator.clipboard.writeText(publishedUrl);
      setMessage("Link copiado");
      setTimeout(() => setMessage(""), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/programs")}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1
            className="text-[20px] font-[800]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {program.client_name || "Nuevo programa"}
          </h1>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
            {program.is_published ? "Publicado" : "Borrador"}
            {program.is_published && program.slug && (
              <span className="ml-2 text-[var(--blue)]">/r/{program.slug}</span>
            )}
          </p>
        </div>
        {message && (
          <span className="flex items-center gap-1 text-[11px] text-[var(--olive)]">
            <CheckCircle size={12} /> {message}
          </span>
        )}
      </div>

      {/* Published URL banner */}
      {publishedUrl && (
        <div className="flex items-center gap-3 bg-[rgba(168,183,142,0.1)] border border-[var(--olive)] rounded-[var(--radius-sm)] px-4 py-3">
          <span className="text-[11px] text-[var(--olive)] flex-1 font-mono truncate">
            {publishedUrl}
          </span>
          <button
            onClick={copyUrl}
            className="flex items-center gap-1 text-[10px] text-[var(--olive)] hover:text-[var(--text-primary)] border border-[var(--olive)] px-2 py-1 rounded-[var(--radius-sm)]"
          >
            <Copy size={11} /> Copiar
          </button>
        </div>
      )}

      {/* Editor */}
      <GlassCard intensity="ghost" className="p-5">
        <RoutineEditor
          program={program}
          onChange={setProgram}
          onSave={handleSave}
          onPublish={handlePublish}
          saving={saving}
          publishing={publishing}
        />
      </GlassCard>
    </div>
  );
}
