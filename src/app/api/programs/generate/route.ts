import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../../agents/_shared/call-claude";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { level, numbers, goal, sessions } = await req.json();

    // Fetch the Program Architect system prompt from DB
    const { data: promptData, error: promptErr } = await supabase
      .from("agent_prompts")
      .select("system_prompt")
      .eq("agent_name", "mauro-program-architect")
      .eq("is_active", true)
      .single();

    if (promptErr || !promptData) {
      return NextResponse.json({ error: "No se encontró el prompt del Program Architect" }, { status: 500 });
    }

    const userMessage = `ACCIÓN: new_program. DATOS DEL CLIENTE: Nivel: ${level}. Números: Squat ${numbers.squat}kg, Bench ${numbers.bench}kg, Deadlift ${numbers.deadlift}kg. Meta: ${goal}. Lesiones: ninguna reportada. Sesiones disponibles: ${sessions} por semana. Genera el assessment inicial + bloque 1 completo (4 semanas con deload en semana 4). IMPORTANTE: Responde SOLO con el JSON de <program_output>, sin texto adicional.`;

    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [2000, 4000, 8000];
    let result;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        result = await callClaude(promptData.system_prompt, userMessage, 4000);
        break;
      } catch (err: unknown) {
        const isOverloaded =
          err instanceof Error &&
          (err.message.includes("529") || err.message.includes("overloaded"));
        if (isOverloaded && attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
          continue;
        }
        throw err;
      }
    }

    if (!result) {
      return NextResponse.json(
        { error: "Servidor ocupado, reintentando... No se pudo completar después de varios intentos." },
        { status: 529 }
      );
    }

    // Extract JSON from <program_output> tags or raw JSON
    let programJson;
    const tagMatch = result.text.match(/<program_output>\s*```?json?\s*([\s\S]*?)\s*```?\s*<\/program_output>/);
    const rawJson = tagMatch ? tagMatch[1] : result.text;

    try {
      const clean = rawJson.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      // Try to find JSON object in the response
      const jsonStart = clean.indexOf("{");
      const jsonEnd = clean.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        programJson = JSON.parse(clean.slice(jsonStart, jsonEnd + 1));
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      return NextResponse.json({
        error: "No se pudo parsear la respuesta del agente",
        raw: result.text.slice(0, 500),
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      program: programJson,
      tokensUsed: result.tokensUsed,
      durationMs: result.durationMs,
    });
  } catch (error) {
    const isOverloaded =
      error instanceof Error &&
      (error.message.includes("529") || error.message.includes("overloaded"));
    if (isOverloaded) {
      return NextResponse.json(
        { error: "Servidor ocupado, reintentando... No se pudo completar después de varios intentos." },
        { status: 529 }
      );
    }
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
