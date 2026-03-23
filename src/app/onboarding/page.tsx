"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { GlowButton } from "@/components/ui/glow-button";

const ONBOARDING_QUESTIONS = [
  {
    id: 1,
    domain: "IDENTIDAD",
    domainColor: "var(--purple)",
    question: "Quien eres cuando nadie te ve entrenar?",
    subtext: "No tu titulo. No tu certificacion. Quien eres realmente cuando estas solo con la barra.",
    placeholder: "Lo que se te venga a la mente, sin filtro...",
  },
  {
    id: 2,
    domain: "SOMBRA",
    domainColor: "var(--red)",
    question: "Que verdad incomoda sobre tu industria te gustaria gritarle al mundo?",
    subtext: "Eso que piensas pero no publicas. Eso que ves que todos hacen mal y nadie dice.",
    placeholder: "Se honesto, esto es entre tu y tu sistema...",
  },
  {
    id: 3,
    domain: "PROPOSITO",
    domainColor: "var(--green)",
    question: "Por que haces esto y no otra cosa? Que te pasa por el cuerpo cuando ves a alguien transformarse?",
    subtext: "No la respuesta de LinkedIn. La respuesta real.",
    placeholder: "Conecta con el momento...",
  },
  {
    id: 4,
    domain: "AUDIENCIA",
    domainColor: "var(--blue)",
    question: "Quien es la persona que llega a ti pidiendo ayuda? Que tiene roto por dentro que el fitness puede arreglar?",
    subtext: "Piensa en tu cliente mas memorable. El que te marco.",
    placeholder: "Describelo como si lo tuvieras enfrente...",
  },
  {
    id: 5,
    domain: "VOZ",
    domainColor: "var(--amber)",
    question: "Como hablas cuando estas en el gym corrigiendo a alguien? Directo? Paciente? Sarcastico? Tecnico? Dame un ejemplo real.",
    subtext: "Tu voz real, no la que usas en Instagram. La que sale cuando no estas actuando.",
    placeholder: "Escribe como si estuvieras hablando...",
  },
  {
    id: 6,
    domain: "METODO",
    domainColor: "var(--green)",
    question: "Que haces diferente a todos los demas? Si tuvieras 60 segundos para convencer a alguien de que TU eres su entrenador, que le dirias?",
    subtext: "No features. No certificaciones. Tu ventaja injusta.",
    placeholder: "Vendete a ti mismo, pero siendo real...",
  },
  {
    id: 7,
    domain: "VISION",
    domainColor: "var(--purple)",
    question: "Que quieres construir con tu presencia digital? Mas clientes? Un imperio? Libertad? Legacy? Se especifico.",
    subtext: "Esta respuesta define hacia donde apunta todo tu contenido.",
    placeholder: "Suena en voz alta...",
  },
];

const TRANSITION_MESSAGES = [
  "Procesando tu identidad...",
  "Analizando tu sombra...",
  "Conectando con tu proposito...",
  "Mapeando tu audiencia...",
  "Calibrando tu voz...",
  "Construyendo tu metodo...",
];

const ANALYSIS_MESSAGES = [
  "Analizando tus respuestas...",
  "Identificando tu voz...",
  "Mapeando tu filosofia...",
  "Construyendo tu avatar de creador...",
  "Preparando tu Command Center...",
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
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

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUserId(data.user.id);
    });
  }, [router]);

  useEffect(() => {
    if (!showProcessing && !isAnalyzing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentStep, showProcessing, isAnalyzing]);

  // Analysis progress animation
  useEffect(() => {
    if (!isAnalyzing) return;

    const msgInterval = setInterval(() => {
      setAnalysisMsg((prev) => (prev < ANALYSIS_MESSAGES.length - 1 ? prev + 1 : prev));
    }, 3000);

    const progInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 8 + 2;
      });
    }, 500);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progInterval);
    };
  }, [isAnalyzing]);

  const currentAnswer = answers[currentStep] || "";
  const canProceed = currentAnswer.trim().length >= 15;

  async function handleNext() {
    if (!canProceed) return;

    setDirection(1);
    setShowProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
      setShowProcessing(false);
    } else {
      setShowProcessing(false);
      setIsAnalyzing(true);
      await analyzeAndCreateIdentity();
    }
  }

  async function analyzeAndCreateIdentity() {
    if (!userId) return;

    const startTime = Date.now();

    try {
      const response = await fetch("/api/onboarding/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          answers: ONBOARDING_QUESTIONS.map((q, i) => ({
            question: q.question,
            domain: q.domain,
            answer: answers[i],
          })),
        }),
      });

      await response.json();

      // Ensure minimum 8 seconds for the experience
      const elapsed = Date.now() - startTime;
      if (elapsed < 8000) {
        await new Promise((resolve) => setTimeout(resolve, 8000 - elapsed));
      }

      setAnalysisProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Show Instagram connect step
      setIsAnalyzing(false);
      setShowInstagram(true);
    } catch {
      setAnalysisProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsAnalyzing(false);
      setShowInstagram(true);
    }
  }

  async function handleConnectInstagram() {
    if (!userId || !igHandle.trim()) return;
    setIgImporting(true);

    try {
      await fetch("/api/import/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, handle: igHandle.trim() }),
      });
    } catch {
      // Continue regardless
    }

    router.push("/");
    router.refresh();
  }

  function handleSkipInstagram() {
    router.push("/");
    router.refresh();
  }

  function updateAnswer(value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentStep] = value;
      return next;
    });
  }

  // Instagram connect screen
  if (showInstagram) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[500px] text-center space-y-8"
        >
          <div className="w-16 h-16 rounded-full bg-[var(--green)]/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">✓</span>
          </div>

          <div>
            <h1 className="text-[24px] font-medium tracking-[-0.03em]">Tu avatar esta listo</h1>
            <p className="text-[14px] text-[var(--text-tertiary)] mt-3 max-w-sm mx-auto leading-relaxed">
              Ultimo paso: conecta tu Instagram para importar tus posts y que el sistema se alimente de tu contenido real.
            </p>
          </div>

          <div className="max-w-xs mx-auto space-y-4">
            <div className="flex items-center border border-[var(--border)] rounded-[8px] bg-[var(--bg-card)]">
              <span className="px-3 text-[14px] text-[var(--text-tertiary)]">@</span>
              <Input
                value={igHandle}
                onChange={(e) => setIgHandle(e.target.value)}
                placeholder="tu_handle_de_instagram"
                className="border-0 border-l border-[var(--border)] bg-transparent text-[14px] rounded-none h-11"
              />
            </div>

            <GlowButton
              variant="primary"
              containerClassName="w-full"
              className="w-full text-center h-11"
              onClick={handleConnectInstagram}
              disabled={!igHandle.trim() || igImporting}
            >
              {igImporting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Importando...
                </span>
              ) : (
                "Conectar Instagram →"
              )}
            </GlowButton>

            <button
              onClick={handleSkipInstagram}
              className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Saltar por ahora
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Analysis screen
  if (isAnalyzing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-8"
        >
          <Loader2 size={32} className="animate-spin mx-auto text-[var(--text-tertiary)]" />
          <div>
            <p className="text-[16px] font-medium text-[var(--text-primary)]">
              {ANALYSIS_MESSAGES[analysisMsg]}
            </p>
          </div>
          <div className="w-64 mx-auto">
            <div className="w-full h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--text-primary)] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(analysisProgress, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-[12px] font-mono text-[var(--text-tertiary)] mt-2">
              {Math.round(Math.min(analysisProgress, 100))}%
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const q = ONBOARDING_QUESTIONS[currentStep];

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-[600px]">
        <AnimatePresence mode="wait" custom={direction}>
          {showProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-center py-24"
            >
              <Loader2 size={24} className="animate-spin mx-auto text-[var(--text-tertiary)] mb-4" />
              <p className="text-[14px] text-[var(--text-tertiary)]">
                {TRANSITION_MESSAGES[currentStep] || "Procesando..."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="text-center"
            >
              {/* Step number */}
              <p className="text-[14px] font-mono font-light text-[var(--text-tertiary)] mb-3">
                {currentStep + 1} / 7
              </p>

              {/* Domain */}
              <p
                className="text-[10px] uppercase tracking-[0.15em] font-medium mb-8"
                style={{ color: q.domainColor }}
              >
                {q.domain}
              </p>

              {/* Question */}
              <h1 className="text-[24px] font-medium tracking-[-0.02em] leading-snug max-w-[500px] mx-auto mb-2">
                {q.question}
              </h1>

              {/* Subtext */}
              <p className="text-[13px] text-[var(--text-tertiary)] max-w-[440px] mx-auto leading-relaxed">
                {q.subtext}
              </p>

              {/* Textarea */}
              <div className="mt-8">
                <textarea
                  ref={textareaRef}
                  value={currentAnswer}
                  onChange={(e) => updateAnswer(e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full min-h-[120px] max-h-[200px] resize-y bg-[var(--bg-card)] border border-[var(--border)] rounded-[8px] p-4 text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-focus)] transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey && canProceed) {
                      handleNext();
                    }
                  }}
                />
              </div>

              {/* Next button */}
              <div className="flex justify-end mt-4 h-10">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: canProceed ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlowButton
                    variant="primary"
                    onClick={handleNext}
                    disabled={!canProceed}
                    className="px-7"
                  >
                    {currentStep === 6 ? "Finalizar →" : "Siguiente →"}
                  </GlowButton>
                </motion.div>
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2 mt-12">
                {ONBOARDING_QUESTIONS.map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-colors duration-200"
                    style={{
                      backgroundColor:
                        i < currentStep
                          ? "var(--green)"
                          : i === currentStep
                            ? "var(--text-primary)"
                            : "var(--border)",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
