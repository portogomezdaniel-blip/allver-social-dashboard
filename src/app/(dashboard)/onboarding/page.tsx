"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GlowButton } from "@/components/ui/glow-button";
import { Card, CardContent } from "@/components/ui/card";
import { Instagram, Check, Users, Loader2 } from "lucide-react";

type AnalysisResult = {
  niche?: string;
  experience_estimate?: number;
  philosophy?: Record<string, unknown>;
  voice_profile?: Record<string, unknown>;
  audience_profile?: Record<string, unknown>;
  content_goals?: string[];
  compiled_prompt?: string;
};

const nicheLabels: Record<string, string> = {
  strength_coach: "Strength Coach",
  functional_coach: "Functional / CrossFit",
  wellness_coach: "Wellness / Yoga",
  nutrition_coach: "Nutricion",
  running_coach: "Running / Resistencia",
  general_fitness: "Fitness General",
};

const loadingMessages = [
  "Conectando con Instagram...",
  "Descargando tus posts...",
  "Analizando tu contenido...",
  "Construyendo tu identidad con IA...",
  "Casi listo...",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  // Step 1
  const [handle, setHandle] = useState("");
  const [importing, setImporting] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [needsManual, setNeedsManual] = useState(false);
  const [manualCaptions, setManualCaptions] = useState("");
  const [importError, setImportError] = useState("");

  // Step 2 — analysis result
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [editNiche, setEditNiche] = useState("");
  const [editTone, setEditTone] = useState("");
  const [editAudience, setEditAudience] = useState("");
  const [editPhilosophy, setEditPhilosophy] = useState("");
  const [postsImported, setPostsImported] = useState(0);
  const [hooksExtracted, setHooksExtracted] = useState(0);

  // Step 3
  const [comp1, setComp1] = useState("");
  const [comp2, setComp2] = useState("");
  const [comp3, setComp3] = useState("");
  const [addingComps, setAddingComps] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (!importing) return;
    const interval = setInterval(() => {
      setLoadingMsg((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 8000);
    return () => clearInterval(interval);
  }, [importing]);

  async function handleImport() {
    if (!userId) return;
    setImporting(true);
    setImportError("");
    setLoadingMsg(0);

    try {
      const body: Record<string, unknown> = { userId };
      if (needsManual) {
        body.manualCaptions = manualCaptions
          .split("\n---\n")
          .filter((c) => c.trim().length > 0);
        body.handle = handle || "manual";
      } else {
        body.handle = handle;
      }

      const res = await fetch("/api/import/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.needsManual) {
        setNeedsManual(true);
        setImporting(false);
        return;
      }

      if (data.error && !data.analysis) {
        setImportError(data.error);
        setImporting(false);
        return;
      }

      setAnalysis(data.analysis);
      setPostsImported(data.postsImported || 0);
      setHooksExtracted(data.hooksExtracted || 0);
      setEditNiche(data.analysis?.niche || "general_fitness");
      setEditTone(
        typeof data.analysis?.voice_profile?.tone === "string"
          ? data.analysis.voice_profile.tone
          : ""
      );
      setEditAudience(
        typeof data.analysis?.audience_profile?.ideal_client === "string"
          ? data.analysis.audience_profile.ideal_client
          : ""
      );
      setEditPhilosophy(
        typeof data.analysis?.philosophy?.what_differentiates === "string"
          ? data.analysis.philosophy.what_differentiates
          : ""
      );

      setStep(2);
    } catch {
      setImportError("Error de conexion. Intenta de nuevo.");
    }
    setImporting(false);
  }

  async function handleConfirmIdentity() {
    if (!userId) return;
    const supabase = createClient();

    const updatedIdentity = {
      user_id: userId,
      onboarding_status: "in_progress",
      current_step: 3,
      niche: editNiche,
      philosophy: {
        ...(analysis?.philosophy || {}),
        what_differentiates: editPhilosophy,
      },
      voice_profile: {
        ...(analysis?.voice_profile || {}),
        tone: editTone,
      },
      audience_profile: {
        ...(analysis?.audience_profile || {}),
        ideal_client: editAudience,
      },
      content_goals: analysis?.content_goals || [],
      compiled_prompt: analysis?.compiled_prompt || null,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from("creator_identity")
      .upsert(updatedIdentity, { onConflict: "user_id" });

    setStep(3);
  }

  async function handleFinish() {
    if (!userId) return;
    setAddingComps(true);

    const handles = [comp1, comp2, comp3].filter((h) => h.trim().length > 0);

    for (const h of handles) {
      try {
        await fetch("/api/import/competitor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, handle: h }),
        });
      } catch {
        // Continue with next
      }
    }

    // Mark onboarding complete
    const supabase = createClient();
    await supabase
      .from("creator_identity")
      .update({
        onboarding_status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    setAddingComps(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  s < step
                    ? "bg-[var(--green)] text-[var(--bg)]"
                    : s === step
                      ? "bg-[var(--text-primary)] text-[var(--bg)]"
                      : "bg-[var(--bg-hover)] text-[var(--text-tertiary)]"
                }`}
              >
                {s < step ? <Check size={14} /> : s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-px ${s < step ? "bg-[var(--green)]" : "bg-[var(--border)]"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <Card>
            <CardContent className="pt-8 pb-6 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mx-auto">
                <Instagram size={28} className="text-[var(--text-secondary)]" />
              </div>
              <div>
                <h1 className="text-xl font-medium tracking-[-0.03em]">Conecta tu Instagram</h1>
                <p className="text-[13px] text-[var(--text-tertiary)] mt-2 max-w-sm mx-auto">
                  El sistema analizara tus posts para aprender tu voz, tono y estilo de contenido.
                </p>
              </div>

              {!needsManual ? (
                <div className="space-y-3 max-w-xs mx-auto">
                  <div className="flex items-center border border-[var(--border)] rounded-[6px] bg-[var(--bg)]">
                    <span className="px-3 text-[13px] text-[var(--text-tertiary)]">@</span>
                    <Input
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="tu_handle"
                      className="border-0 border-l border-[var(--border)] bg-transparent text-[13px] rounded-none"
                    />
                  </div>
                  {importError && <p className="text-xs text-[var(--red)]">{importError}</p>}
                  <GlowButton
                    variant="primary"
                    containerClassName="w-full"
                    className="w-full text-center"
                    onClick={handleImport}
                    disabled={!handle.trim() || importing}
                  >
                    {importing ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        {loadingMessages[loadingMsg]}
                      </span>
                    ) : (
                      "Conectar"
                    )}
                  </GlowButton>
                  <button
                    onClick={() => setNeedsManual(true)}
                    className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    No tengo Apify — ingresar posts manualmente
                  </button>
                </div>
              ) : (
                <div className="space-y-3 text-left max-w-sm mx-auto">
                  <p className="text-[11px] text-[var(--text-tertiary)]">
                    Pega tus ultimos 5-10 captions de Instagram. Separa cada uno con una linea que diga ---
                  </p>
                  <Textarea
                    value={manualCaptions}
                    onChange={(e) => setManualCaptions(e.target.value)}
                    placeholder={"Mi primer post sobre entrenamiento...\n---\nOtro post sobre nutricion..."}
                    className="bg-[var(--bg)] border-[var(--border)] text-[13px] min-h-[200px]"
                  />
                  {importError && <p className="text-xs text-[var(--red)]">{importError}</p>}
                  <GlowButton
                    variant="primary"
                    containerClassName="w-full"
                    className="w-full text-center"
                    onClick={handleImport}
                    disabled={manualCaptions.trim().length < 20 || importing}
                  >
                    {importing ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        {loadingMessages[loadingMsg]}
                      </span>
                    ) : (
                      "Analizar mi contenido"
                    )}
                  </GlowButton>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2 */}
        {step === 2 && analysis && (
          <Card>
            <CardContent className="pt-6 pb-6 space-y-5">
              <div className="text-center mb-2">
                <h1 className="text-xl font-medium tracking-[-0.03em]">Confirma tu identidad</h1>
                <p className="text-[13px] text-[var(--text-tertiary)] mt-1">
                  {postsImported} posts importados · {hooksExtracted} hooks extraidos
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Nicho detectado</label>
                  <select
                    value={editNiche}
                    onChange={(e) => setEditNiche(e.target.value)}
                    className="w-full h-9 rounded-[6px] bg-[var(--bg)] border border-[var(--border)] px-3 text-[13px] text-[var(--text-primary)]"
                  >
                    {Object.entries(nicheLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Tu tono</label>
                  <Textarea
                    value={editTone}
                    onChange={(e) => setEditTone(e.target.value)}
                    className="bg-[var(--bg)] border-[var(--border)] text-[13px]"
                    rows={2}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Tu audiencia</label>
                  <Textarea
                    value={editAudience}
                    onChange={(e) => setEditAudience(e.target.value)}
                    className="bg-[var(--bg)] border-[var(--border)] text-[13px]"
                    rows={2}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Que te diferencia</label>
                  <Textarea
                    value={editPhilosophy}
                    onChange={(e) => setEditPhilosophy(e.target.value)}
                    className="bg-[var(--bg)] border-[var(--border)] text-[13px]"
                    rows={2}
                  />
                </div>
              </div>

              <GlowButton
                variant="primary"
                containerClassName="w-full"
                className="w-full text-center"
                onClick={handleConfirmIdentity}
              >
                Confirmar identidad
              </GlowButton>
            </CardContent>
          </Card>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <Card>
            <CardContent className="pt-8 pb-6 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mx-auto">
                <Users size={28} className="text-[var(--text-secondary)]" />
              </div>
              <div>
                <h1 className="text-xl font-medium tracking-[-0.03em]">Agrega competidores</h1>
                <p className="text-[13px] text-[var(--text-tertiary)] mt-2 max-w-sm mx-auto">
                  Agrega al menos 1 competidor para que el sistema analice tu mercado.
                </p>
              </div>

              <div className="space-y-3 max-w-xs mx-auto text-left">
                {[
                  { val: comp1, set: setComp1, label: "Competidor 1" },
                  { val: comp2, set: setComp2, label: "Competidor 2" },
                  { val: comp3, set: setComp3, label: "Competidor 3 (opcional)" },
                ].map((c, i) => (
                  <div key={i} className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">{c.label}</label>
                    <div className="flex items-center border border-[var(--border)] rounded-[6px] bg-[var(--bg)]">
                      <span className="px-3 text-[13px] text-[var(--text-tertiary)]">@</span>
                      <Input
                        value={c.val}
                        onChange={(e) => c.set(e.target.value)}
                        placeholder="handle"
                        className="border-0 border-l border-[var(--border)] bg-transparent text-[13px] rounded-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                <GlowButton
                  variant="primary"
                  containerClassName="w-full"
                  className="w-full text-center"
                  onClick={handleFinish}
                  disabled={(!comp1.trim() && !comp2.trim() && !comp3.trim()) || addingComps}
                >
                  {addingComps ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Escaneando competidores...
                    </span>
                  ) : (
                    "Empezar"
                  )}
                </GlowButton>
                <button
                  onClick={async () => {
                    if (!userId) return;
                    const supabase = createClient();
                    await supabase
                      .from("creator_identity")
                      .update({
                        onboarding_status: "completed",
                        completed_at: new Date().toISOString(),
                      })
                      .eq("user_id", userId);
                    router.push("/");
                    router.refresh();
                  }}
                  className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Saltar por ahora
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
