import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../_shared/call-claude";
import { getIdentity, getKnowledgeContext, getCreatorTemperature, buildTemperatureContext } from "../_shared/get-identity";
import { logAgentRun } from "../_shared/log-run";

export async function POST(req: NextRequest) {
  try {
    const { userId, input } = await req.json();
    if (!userId || !input) return NextResponse.json({ error: "userId and input required" }, { status: 400 });

    const identity = await getIdentity(userId);
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: recentHooks } = await supabase.from("hooks").select("text").eq("user_id", userId).order("engagement_score", { ascending: false }).limit(5);
    const { data: recentSessions } = await supabase.from("idea_sessions").select("input_text").eq("user_id", userId).order("created_at", { ascending: false }).limit(3);

    const hooksContext = (recentHooks ?? []).map((h) => `- "${h.text}"`).join("\n") || "Sin hooks previos";
    const sessionsContext = (recentSessions ?? []).map((s) => `- "${s.input_text}"`).join("\n") || "Sin sesiones previas";
    const knowledgeCtx = await getKnowledgeContext(userId);
    const temperature = await getCreatorTemperature(userId);
    const tempCtx = buildTemperatureContext(temperature);

    // Cross-context: journal + program
    const { data: lastJournal } = await supabase.from("journal_entries").select("themes, mood").eq("user_id", userId).eq("status", "completed").order("entry_date", { ascending: false }).limit(1).maybeSingle();
    const { data: lastProgram } = await supabase.from("weekly_program_output").select("phase, key_themes").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const crossCtx = `${lastJournal ? `\nMOOD JOURNAL: ${lastJournal.mood}. TEMAS: ${(lastJournal.themes || []).join(", ")}` : ""}${lastProgram ? `\nFASE PROGRAMA: ${lastProgram.phase}. TEMAS: ${(lastProgram.key_themes || []).join(", ")}` : ""}\nCruza estos contextos con la idea del creador.`;

    const systemPrompt = `Eres el director creativo de un creador de contenido fitness. Tu trabajo es tomar UNA idea semilla y generar 4 ANGULOS DE CONTENIDO completamente diferentes.

REGLAS CRITICAS:
1. Cada angulo debe explorar la idea desde una DIRECCION DIFERENTE. No reformular lo mismo.
2. Cada angulo esta disenado para un formato y plataforma especifica.
3. El hook de cada angulo debe funcionar de forma independiente — si alguien solo lee ese hook, debe querer ver mas.
4. NUNCA repitas la frase original del creador textualmente en mas de un angulo.

${identity?.compiled_prompt || "Genera contenido autentico y directo."}${knowledgeCtx}${tempCtx}${crossCtx}

LOS 4 ANGULOS (genera EXACTAMENTE estos 4):

ANGULO 1 — CONFRONTACIONAL → Reel (Instagram + TikTok)
- Formato: reel, 15-45 segundos
- Objetivo: FILTRAR audiencia. Opinion fuerte que hace que la gente correcta se quede y la incorrecta se vaya.
- Tono: directo, sin filtro, face to camera
- El hook debe provocar una reaccion inmediata (scroll-stopper)
- Incluye: hook + descripcion visual del reel + CTA implicito

ANGULO 2 — EDUCATIVO → Carrusel (Instagram)
- Formato: carousel, 6-8 slides
- Objetivo: CONSTRUIR AUTORIDAD. Demostrar expertise con informacion que solo alguien con experiencia real puede dar.
- Tono: tecnico pero accesible, respaldado con logica o experiencia
- NO es un listicle generico — debe tener un angulo que sorprenda
- Incluye: hook del slide 1 + outline de los slides + CTA del ultimo slide

ANGULO 3 — NARRATIVO → YouTube (video largo)
- Formato: youtube, 8-15 minutos
- Objetivo: PROFUNDIZAR. Historia personal o caso de estudio que conecta emocionalmente.
- Tono: storytelling, vulnerabilidad controlada, el creador como personaje
- Debe tener un arco: situacion → conflicto → resolucion/leccion
- Incluye: titulo del video + hook de los primeros 30 segundos + outline de 5 puntos + CTA

ANGULO 4 — PROVOCADOR → Twitter/X + Post (Instagram)
- Formato: single (post de texto / frase)
- Objetivo: GENERAR CONVERSACION. Una frase que la gente comparta o debata.
- Tono: aforismo, sentencia corta, maxima personal
- Maximo 2 oraciones. Debe funcionar como screenshot.
- Incluye: la frase + 2 variaciones alternativas

ADEMAS genera 3 IDEAS DE STORIES (Instagram):
- Story 1: Encuesta/Poll interactiva relacionada con la idea
- Story 2: Behind scenes / momento real que conecte con la idea
- Story 3: CTA directo con link
- Para cada story incluye: tipo, texto, y descripcion de la foto/visual (estetica, angulo, iluminacion, mood)`;

    const userPrompt = `El creador acaba de escribir esta idea semilla:
"${input}"

Hooks que YA EXISTEN (NO repetir ni parafrasear):
${hooksContext}

Ideas recientes (NO repetir temas):
${sessionsContext}

Responde SOLO en JSON valido, sin markdown ni backticks:
{
  "seed": "la idea original del creador resumida en una linea",
  "angles": [
    {
      "angle_type": "confrontacional",
      "format": "reel",
      "platform": "instagram_tiktok",
      "funnel_role": "filter",
      "hook": "el hook scroll-stopper del reel",
      "title": "titulo corto del contenido",
      "description": "descripcion visual: que se ve, como se graba, duracion, estilo",
      "cta": "call to action implicito o explicito",
      "outline": null
    },
    {
      "angle_type": "educativo",
      "format": "carousel",
      "platform": "instagram",
      "funnel_role": "authority",
      "hook": "hook del primer slide",
      "title": "titulo del carrusel",
      "description": "descripcion general del carrusel",
      "cta": "CTA del ultimo slide",
      "outline": ["Slide 1: ...", "Slide 2: ...", "Slide 3: ...", "Slide 4: ...", "Slide 5: ...", "Slide 6: CTA"]
    },
    {
      "angle_type": "narrativo",
      "format": "youtube",
      "platform": "youtube",
      "funnel_role": "authority",
      "hook": "hook de los primeros 30 segundos",
      "title": "titulo del video de YouTube",
      "description": "resumen del arco narrativo",
      "cta": "CTA del video",
      "outline": ["Intro: ...", "Punto 1: ...", "Punto 2: ...", "Punto 3: ...", "Cierre: ..."]
    },
    {
      "angle_type": "provocador",
      "format": "single",
      "platform": "twitter_instagram",
      "funnel_role": "conversion",
      "hook": "la frase principal",
      "title": "tema en 3 palabras",
      "description": "contexto de por que esta frase funciona",
      "cta": null,
      "variations": ["variacion 1", "variacion 2"]
    }
  ],
  "stories": [
    {
      "slide_number": 1,
      "type": "encuesta",
      "text": "texto de la story",
      "visual": "descripcion de la foto: angulo, luz, composicion, mood",
      "visual_tags": ["tag1", "tag2", "tag3"]
    },
    {
      "slide_number": 2,
      "type": "behind_scenes",
      "text": "texto de la story",
      "visual": "descripcion de la foto",
      "visual_tags": ["tag1", "tag2"]
    },
    {
      "slide_number": 3,
      "type": "cta",
      "text": "texto con CTA",
      "visual": "descripcion del visual",
      "visual_tags": ["tag1", "tag2"]
    }
  ],
  "twitter_hooks": [
    "hook 1 para Twitter en una linea",
    "hook 2 variacion para Twitter"
  ]
}`;

    const { text, tokensUsed, durationMs } = await callClaude(systemPrompt, userPrompt, 3500);

    let parsed;
    try { parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()); }
    catch { parsed = { angles: [], stories: [], twitter_hooks: [] }; }

    const angles = parsed.angles || [];
    const stories = parsed.stories || [];
    const twitterHooks: string[] = parsed.twitter_hooks || [];

    // Save session (backward-compatible structure)
    const { data: session } = await supabase.from("idea_sessions").insert({
      user_id: userId,
      input_text: input,
      generated_hooks: [
        ...angles.map((a: Record<string, unknown>) => ({ text: a.hook, category: a.angle_type })),
        ...twitterHooks.map((h: string) => ({ text: h, category: "provocador" })),
      ],
      generated_ideas: angles.map((a: Record<string, unknown>) => ({
        title: a.title,
        format: a.format,
        description: a.description,
        angle: a.angle_type,
      })),
    }).select().single();

    // Insert into unified scored_content_ideas
    const scored: Record<string, unknown>[] = [];

    for (const angle of angles) {
      let relevance = 7, virality = 6, authority = 5, conversion = 5;

      if (angle.angle_type === "confrontacional") {
        virality = temperature >= 7 ? 9 : temperature >= 4 ? 7 : 5;
        relevance = 8;
        authority = 4;
        conversion = 4;
      } else if (angle.angle_type === "educativo") {
        authority = 9;
        relevance = 7;
        virality = 5;
        conversion = 6;
      } else if (angle.angle_type === "narrativo") {
        authority = 8;
        relevance = 7;
        virality = 4;
        conversion = 7;
      } else if (angle.angle_type === "provocador") {
        virality = 8;
        conversion = 7;
        relevance = 6;
        authority = 5;
      }

      const total = Number(((relevance * 0.35) + (virality * 0.25) + (authority * 0.20) + (conversion * 0.20)).toFixed(1));

      // YouTube uses format='single' with outline.type='youtube' to avoid schema changes
      const isYoutube = angle.format === "youtube";

      scored.push({
        user_id: userId,
        source: "ideas_bar",
        source_id: session?.id || null,
        title: angle.title,
        hook: angle.hook,
        format: isYoutube ? "single" : angle.format,
        funnel_role: isYoutube ? "brand" : (angle.funnel_role || "filter"),
        description: angle.description || "",
        outline: isYoutube
          ? { type: "youtube", slides: angle.outline }
          : angle.outline ? { slides: angle.outline } : null,
        temperature_score: temperature,
        relevance_score: relevance,
        virality_score: virality,
        authority_score: authority,
        conversion_score: conversion,
        total_score: total,
        score_reasoning: `Angulo ${angle.angle_type} de semilla: "${input.slice(0, 40)}..."`,
        status: "suggested",
      });
    }

    // Stories as format='story'
    for (const story of stories) {
      scored.push({
        user_id: userId,
        source: "ideas_bar",
        source_id: session?.id || null,
        title: `Story ${story.slide_number}: ${story.type}`,
        hook: story.text,
        format: "story",
        funnel_role: "conversion",
        description: story.visual || "",
        outline: { visual_tags: story.visual_tags || [] },
        temperature_score: temperature,
        relevance_score: 7,
        virality_score: 5,
        authority_score: 4,
        conversion_score: 8,
        total_score: 6.2,
        score_reasoning: `Story ${story.type} de semilla: "${input.slice(0, 40)}..."`,
        status: "suggested",
      });
    }

    // Twitter hooks as format='single'
    for (const hook of twitterHooks) {
      scored.push({
        user_id: userId,
        source: "ideas_bar",
        source_id: session?.id || null,
        title: `X: ${hook.slice(0, 50)}`,
        hook: hook,
        format: "single",
        funnel_role: "conversion",
        description: "Hook para Twitter/X",
        temperature_score: temperature,
        relevance_score: 6,
        virality_score: 8,
        authority_score: 4,
        conversion_score: 6,
        total_score: 6.0,
        score_reasoning: "Hook Twitter de barra de ideas",
        status: "suggested",
      });
    }

    if (scored.length) await supabase.from("scored_content_ideas").insert(scored);

    const { recalculateTemperature } = await import("@/lib/temperature");
    await recalculateTemperature(userId);

    await logAgentRun({
      userId,
      agentName: "idea-generator",
      inputSummary: `Idea: "${input.slice(0, 50)}..."`,
      outputData: { angles: angles.length, stories: stories.length, twitter: twitterHooks.length, scored: scored.length },
      tokensUsed,
      durationMs,
    });

    return NextResponse.json({
      session,
      seed: parsed.seed || input,
      angles: parsed.angles || [],
      stories: parsed.stories || [],
      twitter_hooks: parsed.twitter_hooks || [],
      // Backward-compatible for Home + Ideas pages
      hooks: [
        ...angles.map((a: Record<string, unknown>) => ({ text: a.hook, category: a.angle_type })),
        ...twitterHooks.map((h: string) => ({ text: h, category: "provocador" })),
      ],
      ideas: angles.map((a: Record<string, unknown>) => ({
        title: a.title,
        format: a.format,
        description: a.description,
        angle: a.angle_type,
      })),
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
