import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../_shared/call-claude";
import { getIdentity, getKnowledgeContext, getRecentPosts, getWeekSchedule } from "../_shared/get-identity";
import { logAgentRun } from "../_shared/log-run";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const identity = await getIdentity(userId);
    if (!identity || !identity.compiled_prompt) {
      return NextResponse.json(
        { error: "Creator identity not found. Complete onboarding first." },
        { status: 404 }
      );
    }

    const recentPosts = await getRecentPosts(userId, 10);
    const weekSchedule = await getWeekSchedule(userId);

    // Use Colombia time (UTC-5) for consistent date
    const now = new Date();
    const today = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
    const knowledgeCtx = await getKnowledgeContext(userId);

    const systemPrompt = `Eres el estratega de contenido de ${identity.niche || "un creador de fitness"} en ${identity.city || "Medellin"}.

${identity.compiled_prompt}${knowledgeCtx}

Tu tarea: generar la sugerencia de contenido para HOY.

Reglas:
1. No repetir un tema que se publico en los ultimos 7 dias
2. Alternar formatos (si ayer fue reel, hoy carrusel o single)
3. El hook debe ser controversia controlada, pregunta directa, o dato tecnico sorprendente
4. Incluir un CTA natural (no "link in bio" generico)
5. El contenido debe sonar 100% como el creador, no como un marketer

Responde SOLO en JSON valido, sin markdown:
{
  "tema": "",
  "formato": "reel|carousel|single",
  "hook": "",
  "puntos_clave": ["", "", ""],
  "hora_optima": "HH:MM",
  "hashtags": ["", "", ""],
  "cta_sugerido": "",
  "razonamiento": ""
}`;

    const userMessage = `Dia de la semana: ${dayNames[today.getDay()]}
Fecha: ${today.toISOString().split("T")[0]}

Ultimos 10 posts publicados:
${recentPosts.map((p, i) => `${i + 1}. [${p.post_type}] ${p.caption.slice(0, 100)}...`).join("\n") || "No hay posts publicados aun."}

Calendario de la semana:
${weekSchedule.map((p) => `- ${p.scheduled_date}: [${p.post_type}] ${p.caption.slice(0, 60)}`).join("\n") || "No hay posts programados esta semana."}

Genera la sugerencia de contenido para hoy.`;

    const { text, tokensUsed, durationMs } = await callClaude(systemPrompt, userMessage);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { tema: "Error parsing", formato: "single", hook: text, puntos_clave: [], razonamiento: "Parse error" };
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("daily_suggestions")
      .upsert(
        {
          user_id: userId,
          suggestion_date: today.toISOString().split("T")[0],
          tema: parsed.tema,
          formato: parsed.formato,
          hook: parsed.hook,
          puntos_clave: parsed.puntos_clave,
          hora_optima: parsed.hora_optima,
          hashtags: parsed.hashtags,
          cta_sugerido: parsed.cta_sugerido,
          razonamiento: parsed.razonamiento,
          status: "pending",
        },
        { onConflict: "user_id,suggestion_date" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAgentRun({
      userId,
      agentName: "daily-content",
      inputSummary: `Sugerencia diaria para ${today.toISOString().split("T")[0]}`,
      outputData: parsed,
      tokensUsed,
      durationMs,
    });

    return NextResponse.json({ suggestion: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
