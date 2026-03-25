import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// One-time seed route for Mauro's demo data
// Call: POST /api/seed/mauro with { userId: "..." }
// After seeding, delete this route or protect it

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Use Colombia time
    const now = new Date();
    const colombiaTime = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    const today = colombiaTime.toISOString().split("T")[0];

    const log: string[] = [];

    // 1. Upsert creator profile
    await supabase.from("creators").upsert({
      id: userId,
      email: "mauro@ftpbyallver.com",
      full_name: "Mauro",
      avatar_url: null,
    }, { onConflict: "id" });
    log.push("Creator profile upserted");

    // 2. Upsert creator identity
    const compiledPrompt = `IDENTIDAD DEL CREADOR: Mauro — Strength Coach en Medellin

NICHO: Entrenamiento de fuerza, powerlifting, musculacion funcional
EXPERIENCIA: 8+ anos entrenando atletas y personas comunes
CIUDAD: Medellin, Colombia
GYM: Entrena en varios gyms de El Poblado y Laureles

VOZ Y TONO:
- Habla directo, sin rodeos. No usa jerga de marketing.
- Mezcla tecnicismo con humor seco. "Si tu squat no baja de paralelo, no es un squat."
- Nunca condescendiente. Trata a sus seguidores como adultos inteligentes.
- Usa RPE, tempo, series/reps con naturalidad — no simplifica de mas.
- Spanglish natural: mezcla terminos en ingles del powerlifting con espanol coloquial.

FILOSOFIA:
- La fuerza es la base de todo. Sin fuerza no hay rendimiento, no hay estetica, no hay salud.
- El proceso > el resultado. Los PRs vienen solos cuando respetas la progresion.
- Cero atajos. No promueve suplementos magicos ni rutinas de 10 minutos.
- La tecnica es negociable solo cuando entiendes por que rompes la regla.
- El ego es el enemigo. Mas peso sin tecnica = mas riesgo sin beneficio.

AUDIENCIA:
- Hombres 22-38 anos en Medellin y LATAM
- Quieren verse bien Y ser fuertes (no uno u otro)
- Ya entrenan pero estancados o con mala tecnica
- Buscan un coach que sepa de verdad, no un influencer
- Responden a contenido tecnico con actitud

PROHIBICIONES:
- Nunca promover esteroides ni sustancias
- Nunca hablar mal de otros entrenadores por nombre
- Nunca prometer transformaciones en X dias
- Nunca usar clickbait deshonesto

FORMATOS QUE FUNCIONAN:
- Reels de correccion tecnica (antes/despues de forma)
- Carruseles de "Mito vs Realidad" con datos tecnicos
- Singles con frases directas tipo manifiesto
- Stories de entrenamiento en tiempo real`;

    await supabase.from("creator_identity").upsert({
      user_id: userId,
      onboarding_status: "completed",
      current_step: 7,
      niche: "strength_coach",
      experience_years: 8,
      city: "Medellin",
      gym_name: "El Poblado / Laureles",
      specialties: ["powerlifting", "fuerza", "tecnica", "hipertrofia"],
      philosophy: {
        core: "La fuerza es la base de todo",
        method: "Progresion lineal con periodizacion ondulante",
        belief: "El proceso importa mas que el resultado"
      },
      voice_profile: {
        tone: "Directo, tecnico, con humor seco",
        vocabulary: ["RPE", "tempo", "deficit", "excentric", "PR", "squat", "deadlift", "bench"],
        never_says: ["link in bio", "solo por hoy", "resultados garantizados"]
      },
      audience_profile: {
        age_range: "22-38",
        gender: "mayoria hombres",
        location: "Medellin, LATAM",
        pain_points: ["estancamiento", "mala tecnica", "falta de estructura"]
      },
      content_goals: ["autoridad tecnica", "generar clientes presenciales", "comunidad de fuerza"],
      prohibitions: {
        substances: true,
        trash_talk: true,
        false_promises: true,
        clickbait: true
      },
      compiled_prompt: compiledPrompt,
      completed_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    log.push("Creator identity upserted");

    // 3. Seed posts (representative of Mauro's style)
    const posts = [
      { caption: "Si tu squat no baja de paralelo, no es un squat. Es un cuarto de sentadilla disfrazada de ego.\n\nLa profundidad no es negociable. Tu rodilla puede pasar la punta del pie — eso es anatomia, no pecado.\n\nDeja el ego en la puerta. Baja el peso. Haz el rango completo. Tu cuerpo te lo va a agradecer.\n\n#squat #powerlifting #fuerzamedellin #tecnica", post_type: "reel", status: "published", scheduled_date: shiftDate(today, -14), platform: "instagram" },
      { caption: "MITO: 'El peso muerto es malo para la espalda'\nREALIDAD: Lo malo es hacerlo con la tecnica de alguien que nunca lo ha hecho bien.\n\nEl deadlift es el ejercicio mas funcional que existe. Levantas cosas del suelo todos los dias.\n\nEl problema nunca es el ejercicio. El problema es la ejecucion.\n\nSlide 3: Setup correcto paso a paso\nSlide 4: Los 3 errores mas comunes\nSlide 5: Progresion para principiantes\n\n#deadlift #mitovscalidad #fuerzareal", post_type: "carousel", status: "published", scheduled_date: shiftDate(today, -12), platform: "instagram" },
      { caption: "RPE 8 significa que te quedan 2 repeticiones en el tanque.\n\nNo significa que la barra volo. No significa que fue facil.\n\nSignifica que controlaste la fatiga sin destruirte. Eso es entrenar inteligente.\n\nLa proxima vez que alguien te diga 'pero no diste todo', explicale que dar todo en CADA serie es la receta perfecta para lesionarte.\n\n#RPE #entrenamientointeligente #fuerzamedellin", post_type: "single", status: "published", scheduled_date: shiftDate(today, -10), platform: "instagram" },
      { caption: "Mi atleta acaba de hacer PR en squat: 180kg a RPE 9.\n\nHace 6 meses llegaba con 140kg y la rodilla le dolia en cada serie.\n\nQue hicimos? Bajamos el peso. Arreglamos la tecnica. Le meti 8 semanas de tempo squats a 3-1-2-0.\n\nEl resultado? +40kg sin dolor. Sin magia. Solo proceso.\n\n#PR #squat #entrenadordefuerza #resultadosreales", post_type: "reel", status: "published", scheduled_date: shiftDate(today, -8), platform: "instagram" },
      { caption: "Si necesitas straps para TODO, tu grip es el problema.\n\nLos straps son una herramienta. No una muleta.\n\nUsalos para tus sets pesados de deadlift. Pero si no puedes sostener 60kg sin ellos, tienes un deficit que te va a cobrar despues.\n\nFarmer walks, dead hangs, fat gripz. Invierte en tu agarre.\n\n#grip #deadlift #fuerza #consejosdeentrenador", post_type: "single", status: "published", scheduled_date: shiftDate(today, -6), platform: "instagram" },
      { caption: "3 senales de que tu programa no sirve:\n\n1. Llevas 3 meses con el mismo peso en los basicos\n2. Siempre estas adolorido pero nunca mas fuerte\n3. No tienes idea de que RPE manejas\n\nSi te identificas con las 3, no necesitas mas motivacion. Necesitas un programa real con progresion real.\n\nDM si quieres que revise tu rutina. Sin costo. Sin compromiso.\n\n#programadeentrenamiento #estancamiento #fuerzamedellin", post_type: "carousel", status: "published", scheduled_date: shiftDate(today, -4), platform: "instagram" },
      { caption: "El bench press no se 'siente' en el pecho si no retraes las escapulas.\n\nAntes de descolgar la barra:\n1. Aprieta las escapulas como si quisieras romper una nuez entre ellas\n2. Hunde los hombros en el banco\n3. Arco toracico natural (no lumbar)\n4. Pies firmes en el suelo\n\nAhora si. Ahora siente como trabaja el pecho.\n\n#benchpress #tecnica #pecho #powerlifting", post_type: "reel", status: "published", scheduled_date: shiftDate(today, -2), platform: "instagram" },
      // Scheduled posts (future)
      { caption: "[REEL] Progresion de hip thrust: de 0 a 100kg en 8 semanas — protocolo completo para atletas", post_type: "reel", status: "scheduled", scheduled_date: shiftDate(today, 1), platform: "instagram" },
      { caption: "[CARRUSEL] 5 ejercicios accesorios que todo powerlifter deberia hacer pero nadie hace", post_type: "carousel", status: "scheduled", scheduled_date: shiftDate(today, 3), platform: "instagram" },
      { caption: "[SINGLE] La diferencia entre entrenar duro y entrenar inteligente — reflexion del viernes", post_type: "single", status: "scheduled", scheduled_date: shiftDate(today, 5), platform: "instagram" },
    ];

    // Delete existing demo posts first
    await supabase.from("posts").delete().eq("user_id", userId);

    for (const post of posts) {
      await supabase.from("posts").insert({ ...post, user_id: userId });
    }
    log.push(`Seeded ${posts.length} posts`);

    // 4. Seed hooks
    await supabase.from("hooks").delete().eq("user_id", userId);

    const hooks = [
      { text: "Si tu squat no baja de paralelo, no es un squat.", source: "extracted", category: "controversy", engagement_score: 847 },
      { text: "RPE 8 significa que te quedan 2 reps en el tanque.", source: "extracted", category: "data", engagement_score: 1203 },
      { text: "El bench press no se 'siente' en el pecho si no retraes las escapulas.", source: "extracted", category: "data", engagement_score: 2341 },
      { text: "Si necesitas straps para TODO, tu grip es el problema.", source: "extracted", category: "controversy", engagement_score: 956 },
      { text: "El deadlift no destruye tu espalda. Tu tecnica destruye tu espalda.", source: "ai_generated", category: "controversy", engagement_score: null },
      { text: "Llevas 3 meses con el mismo peso? No necesitas motivacion. Necesitas un programa.", source: "ai_generated", category: "challenge", engagement_score: null },
      { text: "El ego es el musculo que mas te va a lesionar.", source: "ai_generated", category: "story", engagement_score: null },
      { text: "Mas peso sin tecnica = mas riesgo sin beneficio.", source: "extracted", category: "controversy", engagement_score: 1580 },
    ];

    for (const hook of hooks) {
      await supabase.from("hooks").insert({ ...hook, user_id: userId, times_used: Math.floor(Math.random() * 3), is_favorite: hook.engagement_score ? hook.engagement_score > 1000 : false });
    }
    log.push(`Seeded ${hooks.length} hooks`);

    // 5. Seed daily suggestion for today
    await supabase.from("daily_suggestions").upsert({
      user_id: userId,
      suggestion_date: today,
      tema: "Errores en la excentric del peso muerto que nadie te corrige",
      formato: "reel",
      hook: "Si te duele la espalda despues de peso muerto, el problema no es el ejercicio.",
      puntos_clave: [
        "La excentrica es donde ocurren la mayoria de lesiones",
        "3 errores: soltar tension en el core, redondear lumbar al bajar, no controlar la velocidad",
        "Protocolo de correccion: tempo 3-1-3-0 con 60% del 1RM"
      ],
      hora_optima: "18:30",
      hashtags: ["pesomuerto", "deadlift", "tecnica", "fuerzamedellin", "correccion"],
      cta_sugerido: "Etiqueta a alguien que necesita ver esto antes de su proximo dia de espalda",
      razonamiento: "Los reels de correccion tecnica son el formato con mayor engagement historico. El peso muerto no se ha tocado en 8 dias. La excentrica es un tema tecnico que genera controversia controlada.",
      status: "pending",
    }, { onConflict: "user_id,suggestion_date" });
    log.push("Seeded daily suggestion");

    // 6. Seed daily news for today
    const { count: newsCount } = await supabase
      .from("daily_news")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("news_date", today);

    if ((newsCount || 0) < 3) {
      await supabase.from("daily_news").delete().eq("user_id", userId).eq("news_date", today);

      const newsItems = [
        {
          title: "Estudio: La fase excentrica genera 40% mas hipertrofia que la concentrica",
          source: "Journal of Strength & Conditioning",
          source_url: "",
          summary: "Nuevo meta-analisis confirma que enfatizar la fase negativa del movimiento produce significativamente mas crecimiento muscular. Implicaciones directas para programacion de tempo.",
          urgency: "hot",
          suggested_hook: "Si no controlas la bajada, estas dejando el 40% de tus ganancias en la mesa.",
          suggested_format: "carousel",
        },
        {
          title: "Colombia sera sede del Campeonato Sudamericano de Powerlifting 2026",
          source: "IPF News",
          source_url: "",
          summary: "Medellin fue seleccionada como sede del campeonato sudamericano. Se esperan 200+ atletas de 12 paises. Oportunidad de visibilidad para coaches locales.",
          urgency: "warm",
          suggested_hook: "Medellin va a ser la capital del powerlifting en Sudamerica. Y tu, ya estas entrenando para estar a la altura?",
          suggested_format: "reel",
        },
        {
          title: "El 73% de lesiones en el gym ocurren por exceso de volumen, no por peso",
          source: "British Journal of Sports Medicine",
          source_url: "",
          summary: "Contrario a la creencia popular, la mayoria de lesiones no vienen de levantar pesado sino de acumular demasiado volumen sin recuperacion adecuada.",
          urgency: "evergreen",
          suggested_hook: "No te lesionaste por levantar pesado. Te lesionaste por no saber cuando parar.",
          suggested_format: "single",
        },
      ];

      for (const item of newsItems) {
        await supabase.from("daily_news").insert({
          ...item,
          user_id: userId,
          news_date: today,
          relevance: "",
          used_as_post: false,
        });
      }
      log.push("Seeded 3 daily news");
    } else {
      log.push("Daily news already exists, skipped");
    }

    return NextResponse.json({ success: true, log });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function shiftDate(base: string, days: number): string {
  const [y, m, d] = base.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-CA");
}
