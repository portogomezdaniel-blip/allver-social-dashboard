"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ONBOARDING_QUESTIONS = [
  { id: 1, domain: "IDENTIDAD", domainColor: "var(--depth)", question: "Quien eres cuando nadie te ve entrenar?", subtext: "No tu titulo. No tu certificacion. Quien eres realmente cuando estas solo con la barra.", placeholder: "Lo que se te venga a la mente, sin filtro..." },
  { id: 2, domain: "SOMBRA", domainColor: "var(--surface)", question: "Que verdad incomoda sobre tu industria te gustaria gritarle al mundo?", subtext: "Eso que piensas pero no publicas. Eso que ves que todos hacen mal y nadie dice.", placeholder: "Se honesto, esto es entre tu y tu sistema..." },
  { id: 3, domain: "PROPOSITO", domainColor: "var(--olive)", question: "Por que haces esto y no otra cosa? Que te pasa por el cuerpo cuando ves a alguien transformarse?", subtext: "No la respuesta de LinkedIn. La respuesta real.", placeholder: "Conecta con el momento..." },
  { id: 4, domain: "AUDIENCIA", domainColor: "var(--blue)", question: "Quien es la persona que llega a ti pidiendo ayuda? Que tiene roto por dentro que el fitness puede arreglar?", subtext: "Piensa en tu cliente mas memorable. El que te marco.", placeholder: "Describelo como si lo tuvieras enfrente..." },
  { id: 5, domain: "VOZ", domainColor: "var(--amber)", question: "Como hablas cuando estas en el gym corrigiendo a alguien? Directo? Paciente? Sarcastico? Tecnico? Dame un ejemplo real.", subtext: "Tu voz real, no la que usas en Instagram. La que sale cuando no estas actuando.", placeholder: "Escribe como si estuvieras hablando..." },
  { id: 6, domain: "METODO", domainColor: "var(--olive)", question: "Que haces diferente a todos los demas? Si tuvieras 60 segundos para convencer a alguien de que TU eres su entrenador, que le dirias?", subtext: "No features. No certificaciones. Tu ventaja injusta.", placeholder: "Vendete a ti mismo, pero siendo real..." },
  { id: 7, domain: "VISION", domainColor: "var(--depth)", question: "Que quieres construir con tu presencia digital? Mas clientes? Un imperio? Libertad? Legacy? Se especifico.", subtext: "Esta respuesta define hacia donde apunta todo tu contenido.", placeholder: "Suena en voz alta..." },
];

const TRANSITION_MESSAGES = ["Procesando tu identidad...", "Analizando tu sombra...", "Conectando con tu proposito...", "Mapeando tu audiencia...", "Calibrando tu voz...", "Construyendo tu metodo..."];
const ANALYSIS_MESSAGES = ["Analizando tus respuestas...", "Identificando tu voz...", "Mapeando tu filosofia...", "Construyendo tu avatar de creador...", "Preparando tu Command Center..."];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
};

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(7).fill(""));
  const [direction, setDirection] = useState(1);
  const [showProcessing, setShowProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMsg, setAnalysisMsg] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showInstagram, setShowInstagram] = useState(false);
  const [igHandle, setIgHandle] = useState("");
  const [igImporting, setIgImporting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { const supabase = createClient(); supabase.auth.getUser().then(({ data }) => { if (!data.user) { router.push("/login"); return; } setUserId(data.user.id); }); }, [router]);
  useEffect(() => { if (!showProcessing && !isAnalyzing && textareaRef.current) textareaRef.current.focus(); }, [currentStep, showProcessing, isAnalyzing]);
  useEffect(() => { if (!isAnalyzing) return; const m = setInterval(() => setAnalysisMsg(p => p < ANALYSIS_MESSAGES.length - 1 ? p + 1 : p), 3000); const p = setInterval(() => setAnalysisProgress(p => p >= 90 ? p : p + Math.random() * 8 + 2), 500); return () => { clearInterval(m); clearInterval(p); }; }, [isAnalyzing]);

  const currentAnswer = answers[currentStep] || "";
  const canProceed = currentAnswer.trim().length >= 15;

  async function handleNext() {
    if (!canProceed) return;
    setDirection(1); setShowProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    if (currentStep < 6) { setCurrentStep(p => p + 1); setShowProcessing(false); }
    else { setShowProcessing(false); setIsAnalyzing(true); await analyzeAndCreateIdentity(); }
  }

  async function analyzeAndCreateIdentity() {
    if (!userId) return;
    const start = Date.now();
    try {
      await (await fetch("/api/onboarding/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, answers: ONBOARDING_QUESTIONS.map((q, i) => ({ question: q.question, domain: q.domain, answer: answers[i] })) }) })).json();
      const elapsed = Date.now() - start;
      if (elapsed < 8000) await new Promise(r => setTimeout(r, 8000 - elapsed));
    } catch {}
    setAnalysisProgress(100); await new Promise(r => setTimeout(r, 500));
    setIsAnalyzing(false); setShowInstagram(true);
  }

  async function handleConnectInstagram() {
    if (!userId || !igHandle.trim()) return;
    setIgImporting(true);
    try { await fetch("/api/import/instagram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, handle: igHandle.trim() }) }); } catch {}
    router.push("/"); router.refresh();
  }

  function updateAnswer(value: string) { setAnswers(prev => { const next = [...prev]; next[currentStep] = value; return next; }); }

  // Instagram connect
  if (showInstagram) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "var(--bg)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[440px] text-center space-y-8">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: "radial-gradient(circle, rgba(168,183,142,0.15), transparent)", border: "1px solid rgba(168,183,142,0.2)" }}>
            <span className="text-[20px]">{"\u2713"}</span>
          </div>
          <div>
            <h1 className="text-[22px] font-[800] tracking-[-0.03em]" style={{ fontFamily: "var(--font-display)" }}>Tu avatar esta listo</h1>
            <p className="text-[12px] text-[var(--text-muted)] mt-3 max-w-sm mx-auto italic" style={{ fontFamily: "var(--font-serif)" }}>Conecta tu Instagram para que el sistema se alimente de tu contenido real.</p>
          </div>
          <div className="max-w-xs mx-auto space-y-3">
            <div className="flex items-center rounded-lg overflow-hidden" style={{ background: "rgba(0,0,0,0.18)", border: "0.5px solid rgba(168,183,142,0.08)" }}>
              <span className="px-3 text-[13px] text-[var(--text-muted)]">@</span>
              <input value={igHandle} onChange={(e) => setIgHandle(e.target.value)} placeholder="tu_handle" className="flex-1 bg-transparent border-l border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] focus:outline-none" />
            </div>
            <button onClick={handleConnectInstagram} disabled={!igHandle.trim() || igImporting} className="w-full py-2.5 rounded-lg text-[12px] font-medium disabled:opacity-50" style={{ background: "var(--olive)", color: "var(--black)" }}>
              {igImporting ? <span className="inline-flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" />Importando...</span> : "Conectar Instagram \u2192"}
            </button>
            <button onClick={() => { router.push("/"); router.refresh(); }} className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">Saltar por ahora</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Analysis
  if (isAnalyzing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "var(--bg)" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ background: "radial-gradient(circle, rgba(168,183,142,0.1), transparent)", border: "1px solid rgba(168,183,142,0.15)" }}>
            <Loader2 size={24} className="animate-spin text-[var(--olive)]" />
          </div>
          <p className="text-[14px] font-medium">{ANALYSIS_MESSAGES[analysisMsg]}</p>
          <div className="w-64 mx-auto">
            <div className="w-full h-1 rounded-full" style={{ background: "rgba(0,0,0,0.12)" }}>
              <motion.div className="h-full rounded-full" style={{ background: "var(--olive)" }} initial={{ width: 0 }} animate={{ width: `${Math.min(analysisProgress, 100)}%` }} transition={{ duration: 0.3 }} />
            </div>
            <p className="text-[11px] font-mono text-[var(--text-muted)] mt-2">{Math.round(Math.min(analysisProgress, 100))}%</p>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] italic" style={{ fontFamily: "var(--font-serif)" }}>Cada respuesta construye tu reflejo...</p>
        </motion.div>
      </div>
    );
  }

  const q = ONBOARDING_QUESTIONS[currentStep];

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-[540px]">
        <AnimatePresence mode="wait" custom={direction}>
          {showProcessing ? (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-24">
              <Loader2 size={20} className="animate-spin mx-auto text-[var(--text-muted)] mb-4" />
              <p className="text-[13px] text-[var(--text-muted)] italic" style={{ fontFamily: "var(--font-serif)" }}>{TRANSITION_MESSAGES[currentStep] || "Procesando..."}</p>
            </motion.div>
          ) : (
            <motion.div key={currentStep} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeInOut" }} className="text-center">
              {/* Orb with step */}
              <div className="w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: `radial-gradient(circle at 40% 40%, ${q.domainColor}20, transparent)`, border: `1px solid ${q.domainColor}30` }}>
                <span className="text-[16px] font-mono font-[800] text-[var(--text-primary)]">{currentStep + 1}/7</span>
              </div>

              {/* Domain */}
              <p className="text-[9px] uppercase tracking-[0.2em] font-mono mb-6" style={{ color: q.domainColor }}>{q.domain}</p>

              {/* Question */}
              <h1 className="text-[20px] md:text-[24px] leading-snug max-w-[480px] mx-auto mb-2" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-secondary)" }}>
                {q.question}
              </h1>
              <p className="text-[12px] text-[var(--text-muted)] max-w-[400px] mx-auto leading-relaxed">{q.subtext}</p>

              {/* Textarea */}
              <div className="mt-8">
                <textarea ref={textareaRef} value={currentAnswer} onChange={(e) => updateAnswer(e.target.value)} placeholder={q.placeholder}
                  className="w-full min-h-[130px] max-h-[220px] resize-y backdrop-blur-sm rounded-[18px] p-5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] focus:outline-none"
                  style={{ background: "rgba(0,0,0,0.18)", border: "0.5px solid rgba(168,183,142,0.08)" }}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey && canProceed) handleNext(); }}
                />
              </div>

              {/* Next */}
              <div className="flex justify-end mt-4 h-10">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: canProceed ? 1 : 0 }}>
                  <button onClick={handleNext} disabled={!canProceed} className="px-6 py-2 rounded-lg text-[12px] font-medium" style={{ background: "var(--olive)", color: "var(--black)" }}>
                    {currentStep === 6 ? "Finalizar \u2192" : "Siguiente \u2192"}
                  </button>
                </motion.div>
              </div>

              {/* Progress orbs */}
              <div className="flex items-center justify-center gap-2.5 mt-12">
                {ONBOARDING_QUESTIONS.map((_, i) => (
                  <div key={i} className="w-2.5 h-2.5 rounded-full transition-all duration-300" style={{ background: i < currentStep ? "var(--olive)" : i === currentStep ? "var(--text-primary)" : "rgba(168,183,142,0.1)", border: i <= currentStep ? "none" : "0.5px solid rgba(168,183,142,0.08)", transform: i === currentStep ? "scale(1.3)" : "scale(1)" }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
