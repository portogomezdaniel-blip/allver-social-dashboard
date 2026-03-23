import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../_shared/call-claude";
import { getIdentity } from "../_shared/get-identity";
import { logAgentRun } from "../_shared/log-run";

export async function POST(req: NextRequest) {
  try {
    const { userId, tema, hook, formato, puntasClave, templateStructure } =
      await req.json();

    if (!userId || !tema) {
      return NextResponse.json(
        { error: "userId and tema required" },
        { status: 400 }
      );
    }

    const identity = await getIdentity(userId);
    if (!identity || !identity.compiled_prompt) {
      return NextResponse.json(
        { error: "Creator identity not found." },
        { status: 404 }
      );
    }

    const systemPrompt = `Eres el copywriter de ${identity.niche || "un creador de fitness"} en ${identity.city || "Medellin"}.

${identity.compiled_prompt}

Tu tarea: escribir el caption COMPLETO listo para publicar en Instagram.

Reglas:
1. El caption debe sonar 100% como el creador — usa su vocabulario, su tono, su estilo
2. Incluir el hook de apertura proporcionado (o mejorarlo si puedes)
3. Estructura clara con espaciado visual (saltos de linea entre secciones)
4. CTA natural al final
5. Hashtags relevantes al final (5-8 hashtags)
6. NO usar emojis excesivos — maximo 2-3 si el creador los usa
7. NO sonar como IA — nada de "en este post vamos a..." o "hoy quiero compartir..."`;

    const userMessage = `Tema: ${tema}
Formato: ${formato || "single"}
Hook sugerido: ${hook || "Genera uno"}
Puntos clave: ${JSON.stringify(puntasClave || [])}
${templateStructure ? `Estructura del template:\n${JSON.stringify(templateStructure)}` : ""}

Escribe el caption completo. Solo el texto del caption, nada mas.`;

    const { text, tokensUsed, durationMs } = await callClaude(
      systemPrompt,
      userMessage,
      3000
    );

    // If there's a suggestion_date context, save to daily_suggestions
    await logAgentRun({
      userId,
      agentName: "write-copy",
      inputSummary: `Copy para: ${tema}`,
      outputData: { caption: text, formato, tema },
      tokensUsed,
      durationMs,
    });

    return NextResponse.json({ caption: text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
