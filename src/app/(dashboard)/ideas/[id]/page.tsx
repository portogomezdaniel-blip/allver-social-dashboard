"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fetchIdeaById, updateIdeaFormat, updateIdeaStatus, type ScoredIdea } from "@/lib/supabase/program-output";
import IdeaHero from "@/components/ideas/IdeaHero";
import FormatSelector from "@/components/ideas/FormatSelector";
import HooksSection from "@/components/ideas/HooksSection";
import CopySection from "@/components/ideas/CopySection";
import ScriptSection from "@/components/ideas/ScriptSection";
import OutlineSection from "@/components/ideas/OutlineSection";
import { Toast } from "@/components/ui/Toast";
import { Loader2 } from "lucide-react";

const LOADING_STEPS = [
  "Generando hooks...",
  "Escribiendo copy...",
  "Creando guiones...",
];

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ideaId = params.id as string;

  const [idea, setIdea] = useState<ScoredIdea | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Generated content
  const [hooks, setHooks] = useState<string[] | null>(null);
  const [copy, setCopy] = useState<string | null>(null);
  const [script, setScript] = useState<Array<{ title: string; desc: string; time: string }> | null>(null);
  const [outline, setOutline] = useState<Array<{ title: string; desc: string }> | null>(null);

  // Generate all state
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);

  const handleToastDone = useCallback(() => setToast(null), []);

  // Fetch idea + user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id); });

    fetchIdeaById(ideaId).then((data) => {
      if (!data) { router.push("/ideas"); return; }
      setIdea(data);
      const o = (data.outline as Record<string, unknown>) || {};
      if (o.generated_hooks) setHooks(o.generated_hooks as string[]);
      if (o.generated_copy) setCopy(o.generated_copy as string);
      if (o.generated_script) setScript(o.generated_script as Array<{ title: string; desc: string; time: string }>);
      if (o.generated_slides) setOutline(o.generated_slides as Array<{ title: string; desc: string }>);
      setLoading(false);
    }).catch(() => router.push("/ideas"));
  }, [ideaId, router]);

  // ─── API caller ──────────────────────────────────────
  async function callAgent(endpoint: string, body: Record<string, unknown>) {
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res.json();
  }

  // ─── Generate All ────────────────────────────────────
  async function handleGenerateAll() {
    if (!idea || !userId) return;
    setGenerating(true);
    setGenStep(0);

    // Animate loading steps
    const stepInterval = setInterval(() => {
      setGenStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s));
    }, 3000);

    try {
      const calls: Promise<unknown>[] = [
        callAgent("/api/agents/generate-hooks", { userId, ideaId: idea.id, hook: idea.hook }),
        callAgent("/api/agents/generate-copy", { userId, ideaId: idea.id, hook: idea.hook, format: idea.format }),
      ];

      const isReel = idea.format === "reel" || idea.format === "story";
      const isCarousel = idea.format === "carousel";

      if (isReel) {
        calls.push(callAgent("/api/agents/generate-script", { userId, ideaId: idea.id, hook: idea.hook }));
      }
      if (isCarousel) {
        calls.push(callAgent("/api/agents/generate-outline", { userId, ideaId: idea.id, hook: idea.hook }));
      }

      const results = await Promise.all(calls);

      // Parse results
      const hooksData = results[0] as { hooks?: string[] };
      const copyData = results[1] as { copy?: string };

      if (hooksData.hooks) setHooks(hooksData.hooks);
      if (copyData.copy) setCopy(copyData.copy);

      if (isReel) {
        const scriptData = results[2] as { script?: Array<{ title: string; desc: string; time: string }> };
        if (scriptData.script) setScript(scriptData.script);
      }
      if (isCarousel) {
        const outlineData = results[2] as { slides?: Array<{ title: string; desc: string }> };
        if (outlineData.slides) setOutline(outlineData.slides);
      }

      setToast("Contenido generado");
    } catch {
      setToast("Error generando contenido");
    }

    clearInterval(stepInterval);
    setGenerating(false);
  }

  // ─── Format change ───────────────────────────────────
  async function handleChangeFormat(newFormat: string) {
    if (!idea) return;
    const funnel_role = newFormat === "carousel" ? "authority" : newFormat === "story" ? "conversion" : newFormat === "single" ? "conversion" : "filter";
    await updateIdeaFormat(idea.id, newFormat, funnel_role);
    setIdea((prev) => prev ? { ...prev, format: newFormat, funnel_role } : null);
    if (newFormat !== "reel" && newFormat !== "story") setScript(null);
    if (newFormat !== "carousel") setOutline(null);
    setToast(`Formato: ${newFormat}`);
  }

  // ─── Quick actions ───────────────────────────────────
  async function handleApprove() {
    if (!idea) return;
    await updateIdeaStatus(idea.id, "approved");
    setIdea((prev) => prev ? { ...prev, status: "approved" } : null);
    setToast("Marcada para grabar");
  }

  async function handleDiscard() {
    if (!idea) return;
    await updateIdeaStatus(idea.id, "rejected");
    setToast("Idea descartada");
    router.push("/ideas");
  }

  function handleCopyText(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setToast("Copiado");
  }

  function toggleSection(key: string) {
    setExpandedSection((s) => s === key ? null : key);
  }

  // ─── Render ──────────────────────────────────────────
  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--text-muted)] text-sm">...</div>;
  if (!idea) return null;

  const isReel = idea.format === "reel" || idea.format === "story";
  const isCarousel = idea.format === "carousel";

  // Check if content has been generated
  const hasGenerated = !!(hooks && hooks.length > 0 && copy);

  return (
    <div className="space-y-1">
      {/* Back */}
      <Link href="/ideas" className="inline-flex items-center gap-1 text-[11px] mb-3 transition-colors hover:text-white" style={{ color: "var(--text-muted)" }}>
        ← Ideas
      </Link>

      {/* Hero */}
      <IdeaHero idea={idea} />

      {/* Format selector */}
      <FormatSelector current={idea.format} onChange={handleChangeFormat} />

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        <button
          onClick={handleApprove}
          disabled={idea.status === "approved" || idea.status === "scheduled"}
          className="py-2 rounded-[8px] text-center transition-colors"
          style={{
            fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.06em", textTransform: "uppercase" as const,
            background: idea.status === "approved" || idea.status === "scheduled" ? "var(--olive-bg)" : "rgba(255,255,255,0.06)",
            color: idea.status === "approved" || idea.status === "scheduled" ? "var(--olive)" : "var(--text-muted)",
            border: "1px solid rgba(255,255,255,0.08)",
            opacity: idea.status === "approved" || idea.status === "scheduled" ? 0.6 : 1,
          }}
        >
          {idea.status === "scheduled" ? "✓ Hecho" : idea.status === "approved" ? "✓ Aprobado" : "Grabar hoy"}
        </button>
        <button
          onClick={() => handleCopyText(idea.hook)}
          className="py-2 rounded-[8px] text-center transition-colors"
          style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.06em", textTransform: "uppercase" as const, background: "rgba(255,255,255,0.06)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          Copiar hook
        </button>
        <button
          onClick={handleDiscard}
          className="py-2 rounded-[8px] text-center transition-colors hover:text-[var(--red)]"
          style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--text-ghost)", border: "1px solid rgba(255,255,255,0.04)" }}
        >
          Descartar
        </button>
      </div>

      {/* GENERATE ALL button — only when no content generated yet */}
      {!hasGenerated && !generating && (
        <button
          onClick={handleGenerateAll}
          className="w-full py-3.5 rounded-[10px] text-center transition-all hover:brightness-110 active:scale-[0.99] mb-4"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 13,
            letterSpacing: "0.04em",
            color: "white",
            background: "#8B9A6B",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          ⚡ GENERAR TODO
        </button>
      )}

      {/* Loading state */}
      {generating && (
        <div
          className="w-full py-4 rounded-[10px] text-center mb-4"
          style={{
            background: "rgba(139,154,107,0.15)",
            border: "1px solid rgba(139,154,107,0.3)",
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" style={{ color: "#8B9A6B" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#8B9A6B" }}>
              {LOADING_STEPS[genStep]}
            </span>
          </div>
        </div>
      )}

      {/* Generated content sections — only visible after generation */}
      {hasGenerated && (
        <>
          <HooksSection hooks={hooks} isExpanded={expandedSection === "hooks"} onToggle={() => toggleSection("hooks")} onCopy={handleCopyText} />

          <CopySection copy={copy} isExpanded={expandedSection === "copy"} onToggle={() => toggleSection("copy")} onCopy={() => { if (copy) handleCopyText(copy); }} />

          {isReel && script && script.length > 0 && (
            <ScriptSection script={script} isExpanded={expandedSection === "script"} onToggle={() => toggleSection("script")} onCopy={() => { if (script) handleCopyText(script.map((b) => `${b.title}\n${b.desc}`).join("\n\n")); }} />
          )}

          {isCarousel && outline && outline.length > 0 && (
            <OutlineSection outline={outline} isExpanded={expandedSection === "outline"} onToggle={() => toggleSection("outline")} onCopy={() => { if (outline) handleCopyText(outline.map((s, i) => `Slide ${i + 1}: ${s.title}\n${s.desc}`).join("\n\n")); }} />
          )}
        </>
      )}

      <Toast message={toast} onDone={handleToastDone} />
    </div>
  );
}
