import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../../agents/_shared/call-claude";
import { logAgentRun } from "../../agents/_shared/log-run";

function mapDomainToCategory(domain: string): string {
  const map: Record<string, string> = {
    IDENTIDAD: "belief",
    SOMBRA: "vulnerability",
    PROPOSITO: "passion",
    AUDIENCIA: "audience_insight",
    VOZ: "vocabulary",
    METODO: "method",
    VISION: "passion",
  };
  return map[domain] || "belief";
}

export async function POST(req: NextRequest) {
  try {
    const { userId, answers } = await req.json();
    if (!userId || !answers) {
      return NextResponse.json({ error: "userId and answers required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const answersFormatted = answers
      .map((a: { domain: string; question: string; answer: string }) =>
        `${a.domain}: "${a.question}"\nRespuesta: "${a.answer}"`
      )
      .join("\n\n");

    const start = Date.now();

    const result = await callClaude(
      "Eres un analista de identidad para creadores de contenido. Construyes perfiles completos a partir de reflexiones profundas.",
      `Un creador de contenido fitness acaba de responder 7 preguntas de autoconocimiento:

${answersFormatted}

A partir de estas respuestas, construye su PERFIL DE IDENTIDAD COMPLETO.

Responde SOLO en JSON valido sin markdown:
{
  "display_name": "nombre o alias que se infiere de las respuestas",
  "niche": "strength_coach|functional_coach|wellness_coach|nutrition_coach|running_coach|general_fitness",
  "experience_estimate": 10,
  "city": "ciudad si la menciona, sino vacio",
  "gym_name": "gym si lo menciona, sino vacio",
  "specialties": ["especialidad 1", "especialidad 2"],

  "philosophy": {
    "core_principles": ["principio 1 extraido de sus respuestas", "principio 2", "principio 3"],
    "what_differentiates": "que lo hace diferente, en sus propias palabras",
    "training_approach": "como entrena/ensena",
    "signature_method": "si tiene un metodo o sistema propio"
  },

  "voice_profile": {
    "tone": "descripcion de su tono en 1-2 lineas",
    "vocabulary": ["palabras que usa naturalmente"],
    "never_says": ["palabras que claramente no usaria basado en su personalidad"],
    "language_style": "tuteo/formal, jerga, longitud de frases",
    "formality": "informal_professional|formal|casual|raw",
    "humor_style": "tipo de humor si lo tiene"
  },

  "audience_profile": {
    "ideal_client": "descripcion basada en Pregunta 4",
    "client_frustrations": ["frustracion 1", "frustracion 2"],
    "client_goals": ["meta 1", "meta 2"],
    "age_range": "estimado",
    "gender_focus": "mixed|male|female"
  },

  "content_goals": ["more_clients", "online_programs", "authority", "education", "brand_building", "community"],

  "prohibitions": {
    "never_post": ["tipo de contenido que claramente rechazaria"],
    "tone_limits": ["limites de tono basados en su personalidad"],
    "topics_off_limits": ["temas que evitaria"]
  },

  "shadow": "lo que revelo en la pregunta de sombra — su verdad incomoda",
  "purpose": "su proposito profundo basado en Pregunta 3",
  "vision": "su vision basada en Pregunta 7",

  "compiled_prompt": "System prompt de 300-400 palabras que captura TODA su identidad. Incluye su tono, vocabulario, filosofia, audiencia, y personalidad. Un agente de IA que lea este prompt debe poder generar contenido indistinguible del creador real. Usa fragmentos textuales de sus respuestas cuando sean poderosos."
}`,
      4000
    );

    let identity;
    try {
      const clean = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const match = clean.match(/\{[\s\S]*"compiled_prompt"[\s\S]*\}/);
      identity = JSON.parse(match ? match[0] : clean);
    } catch {
      return NextResponse.json({ error: "Failed to parse identity", raw: result.text }, { status: 500 });
    }

    // Create or update profile
    await supabase.from("profiles").upsert(
      {
        user_id: userId,
        display_name: identity.display_name || "Creator",
        role: "creator",
        bio: identity.purpose || "",
        city: identity.city || "",
        gym_name: identity.gym_name || "",
        niche: identity.niche || "general_fitness",
      },
      { onConflict: "user_id" }
    );

    // Create creator_identity
    await supabase.from("creator_identity").upsert(
      {
        user_id: userId,
        onboarding_status: "completed",
        current_step: 7,
        niche: identity.niche,
        experience_years: identity.experience_estimate,
        city: identity.city || "",
        gym_name: identity.gym_name || "",
        specialties: identity.specialties || [],
        philosophy: identity.philosophy,
        voice_profile: identity.voice_profile,
        audience_profile: identity.audience_profile,
        content_goals: identity.content_goals || ["more_clients", "authority"],
        prohibitions: identity.prohibitions,
        compiled_prompt: identity.compiled_prompt,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    // Save onboarding answers as first journal entry
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("journal_entries").upsert(
      {
        user_id: userId,
        entry_date: today,
        question_1: answers[0]?.question || "",
        question_2: answers[3]?.question || "",
        question_3: answers[6]?.question || "",
        answer_1: answers[0]?.answer || "",
        answer_2: answers[3]?.answer || "",
        answer_3: answers[6]?.answer || "",
        status: "completed",
        generated_content: {
          shadow: identity.shadow,
          purpose: identity.purpose,
          vision: identity.vision,
        },
        mood: "determined",
        themes: ["onboarding", "identity", "vision"],
      },
      { onConflict: "user_id,entry_date" }
    );

    // Extract knowledge fragments
    for (let i = 0; i < answers.length; i++) {
      const a = answers[i];
      if (a?.answer && a.answer.length > 20) {
        await supabase.from("creator_knowledge").insert({
          user_id: userId,
          source_type: "onboarding",
          source_date: today,
          category: mapDomainToCategory(a.domain),
          content: a.answer.slice(0, 500),
          context: `Onboarding Q${i + 1}: ${a.question}`,
          emotional_weight: "high",
          content_potential: "high",
          tags: [a.domain.toLowerCase(), "onboarding"],
        });
      }
    }

    await logAgentRun({
      userId,
      agentName: "onboarding-analyze",
      inputSummary: "7 respuestas de onboarding Jungiano",
      outputData: { niche: identity.niche, tone: identity.voice_profile?.tone },
      tokensUsed: result.tokensUsed,
      durationMs: Date.now() - start,
    });

    return NextResponse.json({
      success: true,
      identity: { niche: identity.niche, display_name: identity.display_name },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}
