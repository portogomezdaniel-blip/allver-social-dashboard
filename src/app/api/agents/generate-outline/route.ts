import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../_shared/call-claude";
import { getIdentity, getCreatorTemperature, buildTemperatureContext } from "../_shared/get-identity";
import { logAgentRun } from "../_shared/log-run";

export async function POST(req: NextRequest) {
  try {
    const { userId, ideaId, hook } = await req.json();
    if (!userId || !ideaId || !hook) return NextResponse.json({ error: "userId, ideaId, and hook required" }, { status: 400 });

    const identity = await getIdentity(userId);
    const temperature = await getCreatorTemperature(userId);
    const tempCtx = buildTemperatureContext(temperature);

    const systemPrompt = `Eres el estratega de contenido de un creador de fitness.\n\n${identity?.compiled_prompt || "Genera contenido autentico y directo."}${tempCtx}\n\nGenera el OUTLINE de un carrusel de Instagram. Estructura:\n- Slide 1: Hook visual (texto impactante, sin imagen compleja)\n- Slides 2-5: Desarrollo (cada slide = 1 punto, con indicacion de visual)\n- Slide final: CTA (seguir, guardar, compartir)\n\nPara cada slide incluye:\n- Titulo del slide\n- Contenido + descripcion visual sugerida`;

    const userPrompt = `Hook: "${hook}"\n\nResponde en JSON:\n{\n  "slides": [\n    { "title": "Slide 1: Hook", "desc": "contenido + visual" },\n    { "title": "Slide 2: ...", "desc": "contenido + visual" },\n    { "title": "Slide 3: ...", "desc": "contenido + visual" },\n    { "title": "Slide 4: ...", "desc": "contenido + visual" },\n    { "title": "Slide 5: ...", "desc": "contenido + visual" },\n    { "title": "Slide 6: CTA", "desc": "call to action" }\n  ],\n  "total_slides": 6\n}`;

    const { text, tokensUsed, durationMs } = await callClaude(systemPrompt, userPrompt, 1500);

    let parsed;
    try { parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()); }
    catch { parsed = { slides: [], total_slides: 0 }; }

    const slides = parsed.slides || [];

    // Save to idea outline
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: ideaData } = await supabase.from("scored_content_ideas").select("outline").eq("id", ideaId).maybeSingle();
    const currentOutline = (ideaData?.outline as Record<string, unknown>) || {};
    await supabase.from("scored_content_ideas").update({ outline: { ...currentOutline, generated_slides: slides } }).eq("id", ideaId);

    await logAgentRun({ userId, agentName: "generate-outline", inputSummary: `Outline para: "${hook.slice(0, 50)}"`, outputData: { slides: slides.length }, tokensUsed, durationMs });

    return NextResponse.json({ slides, total_slides: parsed.total_slides });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
