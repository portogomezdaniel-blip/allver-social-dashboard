"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fetchIdeaById, updateIdeaFormat, updateIdeaStatus, saveIdeaNotes, type ScoredIdea } from "@/lib/supabase/program-output";
import { assignIdeaToDay } from "@/lib/supabase/cockpit";
import IdeaHero from "@/components/ideas/IdeaHero";
import FormatSelector from "@/components/ideas/FormatSelector";
import HooksSection from "@/components/ideas/HooksSection";
import CopySection from "@/components/ideas/CopySection";
import ScriptSection from "@/components/ideas/ScriptSection";
import OutlineSection from "@/components/ideas/OutlineSection";
import NotesSection from "@/components/ideas/NotesSection";
import { Toast } from "@/components/ui/Toast";

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
  const [notes, setNotes] = useState("");

  // Generation loading
  const [genHooks, setGenHooks] = useState(false);
  const [genCopy, setGenCopy] = useState(false);
  const [genScript, setGenScript] = useState(false);
  const [genOutline, setGenOutline] = useState(false);

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
      if (o.creator_notes) setNotes(o.creator_notes as string);
      setLoading(false);
    }).catch(() => router.push("/ideas"));
  }, [ideaId, router]);

  // Auto-save notes
  useEffect(() => {
    if (!idea) return;
    const currentNotes = ((idea.outline as Record<string, unknown>)?.creator_notes as string) || "";
    if (notes === currentNotes) return;
    const timer = setTimeout(() => { saveIdeaNotes(idea.id, notes); }, 2000);
    return () => clearTimeout(timer);
  }, [notes, idea]);

  // ─── Generation handlers ─────────────────────────────
  async function callAgent(endpoint: string, body: Record<string, unknown>) {
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res.json();
  }

  async function handleGenerateHooks() {
    if (!idea || !userId) return;
    setGenHooks(true);
    try {
      const data = await callAgent("/api/agents/generate-hooks", { userId, ideaId: idea.id, hook: idea.hook });
      if (data.hooks) { setHooks(data.hooks); setToast("Hooks generados"); }
    } catch { setToast("Error generando hooks"); }
    setGenHooks(false);
  }

  async function handleGenerateCopy() {
    if (!idea || !userId) return;
    setGenCopy(true);
    try {
      const data = await callAgent("/api/agents/generate-copy", { userId, ideaId: idea.id, hook: idea.hook, format: idea.format });
      if (data.copy) { setCopy(data.copy); setToast("Copy generado"); }
    } catch { setToast("Error generando copy"); }
    setGenCopy(false);
  }

  async function handleGenerateScript() {
    if (!idea || !userId) return;
    setGenScript(true);
    try {
      const data = await callAgent("/api/agents/generate-script", { userId, ideaId: idea.id, hook: idea.hook });
      if (data.script) { setScript(data.script); setToast("Guion generado"); }
    } catch { setToast("Error generando guion"); }
    setGenScript(false);
  }

  async function handleGenerateOutline() {
    if (!idea || !userId) return;
    setGenOutline(true);
    try {
      const data = await callAgent("/api/agents/generate-outline", { userId, ideaId: idea.id, hook: idea.hook });
      if (data.slides) { setOutline(data.slides); setToast("Outline generado"); }
    } catch { setToast("Error generando outline"); }
    setGenOutline(false);
  }

  // ─── Format change ───────────────────────────────────
  async function handleChangeFormat(newFormat: string) {
    if (!idea) return;
    const funnel_role = newFormat === "carousel" ? "authority" : newFormat === "story" ? "conversion" : newFormat === "single" ? "conversion" : "filter";
    await updateIdeaFormat(idea.id, newFormat, funnel_role);
    setIdea((prev) => prev ? { ...prev, format: newFormat, funnel_role } : null);
    if (newFormat !== "reel") setScript(null);
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

  const isReel = idea.format === "reel";
  const isCarousel = idea.format === "carousel";

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

      {/* Sections */}
      <HooksSection hooks={hooks} generating={genHooks} isExpanded={expandedSection === "hooks"} onToggle={() => toggleSection("hooks")} onGenerate={handleGenerateHooks} onCopy={handleCopyText} />

      <CopySection copy={copy} generating={genCopy} isExpanded={expandedSection === "copy"} onToggle={() => toggleSection("copy")} onGenerate={handleGenerateCopy} onCopy={() => { if (copy) handleCopyText(copy); }} />

      {isReel && (
        <ScriptSection script={script} generating={genScript} isExpanded={expandedSection === "script"} onToggle={() => toggleSection("script")} onGenerate={handleGenerateScript} onCopy={() => { if (script) handleCopyText(script.map((b) => `${b.title}\n${b.desc}`).join("\n\n")); }} />
      )}

      {isCarousel && (
        <OutlineSection outline={outline} generating={genOutline} isExpanded={expandedSection === "outline"} onToggle={() => toggleSection("outline")} onGenerate={handleGenerateOutline} onCopy={() => { if (outline) handleCopyText(outline.map((s, i) => `Slide ${i + 1}: ${s.title}\n${s.desc}`).join("\n\n")); }} />
      )}

      <NotesSection notes={notes} isExpanded={expandedSection === "notes"} onToggle={() => toggleSection("notes")} onChange={setNotes} />

      <Toast message={toast} onDone={handleToastDone} />
    </div>
  );
}
