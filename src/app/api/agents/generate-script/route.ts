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

    const systemPrompt = `Eres el director creativo de un creador de contenido fitness.\n\n${identity?.compiled_prompt || "Genera contenido autentico y directo."}${tempCtx}\n\nGenera 2 GUIONES DISTINTOS para un reel/TikTok basados en el mismo hook pero con angulos diferentes:\n\nGUIÓN 1 — ENFOQUE DIRECTO/CONFRONTACIONAL:\nVa al grano, confronta al espectador, tono retador. Ideal para contenido polarizante.\n\nGUIÓN 2 — ENFOQUE NARRATIVO/STORYTELLING:\nCuenta una historia, usa un ejemplo o anécdota, tono conversacional. Ideal para conectar.\n\nPara cada guion, estructura en 4 bloques:\n1. HOOK (0-3s): lo que se dice/muestra para atrapar\n2. CONFLICTO (3-12s): el problema o la tension\n3. PUNTO FUERTE (12-20s): la verdad o solucion\n4. CTA (20-25s): cierre con call to action\n\nPara cada bloque incluye:\n- Que dice el creador (texto exacto)\n- Que se ve en pantalla (indicaciones de camara)\n- Duracion del bloque`;

    const userPrompt = `Hook: "${hook}"\n\nResponde en JSON:\n{\n  "guiones": [\n    {\n      "label": "Guión 1 — Directo",\n      "blocks": [\n        { "title": "Hook (0-3s)", "desc": "texto y visual", "time": "3s" },\n        { "title": "Conflicto (3-12s)", "desc": "texto y visual", "time": "9s" },\n        { "title": "Punto fuerte (12-20s)", "desc": "texto y visual", "time": "8s" },\n        { "title": "CTA (20-25s)", "desc": "texto y visual", "time": "5s" }\n      ],\n      "total_duration": "25s"\n    },\n    {\n      "label": "Guión 2 — Narrativo",\n      "blocks": [\n        { "title": "Hook (0-3s)", "desc": "texto y visual", "time": "3s" },\n        { "title": "Conflicto (3-12s)", "desc": "texto y visual", "time": "9s" },\n        { "title": "Punto fuerte (12-20s)", "desc": "texto y visual", "time": "8s" },\n        { "title": "CTA (20-25s)", "desc": "texto y visual", "time": "5s" }\n      ],\n      "total_duration": "25s"\n    }\n  ]\n}`;

    const { text, tokensUsed, durationMs } = await callClaude(systemPrompt, userPrompt, 3000);

    let parsed;
    try { parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()); }
    catch { parsed = { guiones: [] }; }

    const guiones = parsed.guiones || [];

    // Save to idea outline
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: ideaData } = await supabase.from("scored_content_ideas").select("outline").eq("id", ideaId).maybeSingle();
    const currentOutline = (ideaData?.outline as Record<string, unknown>) || {};
    await supabase.from("scored_content_ideas").update({ outline: { ...currentOutline, generated_script: guiones } }).eq("id", ideaId);

    await logAgentRun({ userId, agentName: "generate-script", inputSummary: `2 guiones para: "${hook.slice(0, 50)}"`, outputData: { guiones: guiones.length }, tokensUsed, durationMs });

    // Return as "script" for backward compat with the frontend
    return NextResponse.json({ script: guiones });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
