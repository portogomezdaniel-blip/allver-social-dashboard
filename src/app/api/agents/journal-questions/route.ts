import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../_shared/call-claude";
import { getIdentity } from "../_shared/get-identity";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const identity = await getIdentity(userId);
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: recent } = await supabase.from("journal_entries").select("question_1, question_2, question_3").eq("user_id", userId).order("entry_date", { ascending: false }).limit(5);

    const recentQs = (recent ?? []).map((e) => `- ${e.question_1}\n- ${e.question_2}\n- ${e.question_3}`).join("\n") || "Sin entradas anteriores";

    const { text } = await callClaude(
      "Eres un guia de autoconocimiento inspirado en Carl Jung, adaptado para creadores de contenido fitness.",
      `Perfil del creador:\n${identity?.compiled_prompt || "Entrenador de fuerza en Medellin."}\n\nPreguntas anteriores (NO repetir):\n${recentQs}\n\nGenera 3 preguntas catarticas para hoy:\n1. Una sobre SU PRACTICA\n2. Una sobre SUS CLIENTES\n3. Una FILOSOFICA\n\nCada pregunta debe ser profunda, jungiana, y provocar reflexion autentica.\n\nResponde SOLO en JSON:\n{\n  "questions": [\n    {"text": "...", "domain": "practice|clients|philosophy", "intent": "..."}\n  ]\n}`,
      1500
    );

    let parsed;
    try { parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()); }
    catch { parsed = { questions: [{ text: "Que te motiva a entrenar hoy?", domain: "practice" }, { text: "Que ves en tus clientes que ellos no ven?", domain: "clients" }, { text: "Por que elegiste la fuerza?", domain: "philosophy" }] }; }

    const qs = parsed.questions || [];
    const today = new Date().toISOString().split("T")[0];

    const { data: entry } = await supabase.from("journal_entries").upsert({
      user_id: userId, entry_date: today,
      question_1: qs[0]?.text || "Reflexiona sobre tu practica de hoy.",
      question_2: qs[1]?.text || "Que aprendiste de tus clientes esta semana?",
      question_3: qs[2]?.text || "Que significa la fuerza para ti?",
      status: "pending",
    }, { onConflict: "user_id,entry_date" }).select().single();

    return NextResponse.json({ entry });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
