import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../../agents/_shared/call-claude";
import { logAgentRun } from "../../agents/_shared/log-run";

interface ScrapedPost {
  caption?: string;
  likesCount?: number;
  commentsCount?: number;
  type?: string;
  timestamp?: string;
  url?: string;
}

async function scrapeWithApify(handle: string): Promise<ScrapedPost[]> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) return [];

  const cleanHandle = handle.replace("@", "").trim();
  const res = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        directUrls: [`https://www.instagram.com/${cleanHandle}/`],
        resultsLimit: 30,
        resultsType: "posts",
      }),
    }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function POST(req: NextRequest) {
  try {
    const { userId, handle, manualCaptions } = await req.json();
    if (!userId || (!handle && !manualCaptions)) {
      return NextResponse.json({ error: "userId and handle or manualCaptions required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const cleanHandle = handle ? handle.replace("@", "").trim() : "";
    let posts: ScrapedPost[] = [];

    // Try Apify first
    if (handle && process.env.APIFY_API_TOKEN) {
      posts = await scrapeWithApify(cleanHandle);
    }

    // If no posts from Apify, use manual captions
    if (posts.length === 0 && manualCaptions && manualCaptions.length > 0) {
      posts = manualCaptions.map((caption: string, i: number) => ({
        caption,
        likesCount: 0,
        commentsCount: 0,
        type: "Image",
        timestamp: new Date(Date.now() - i * 86400000 * 3).toISOString(),
      }));
    }

    if (posts.length === 0) {
      return NextResponse.json({
        error: "no_posts",
        message: "No se pudieron obtener posts. Usa el modo manual.",
        needsManual: true,
      });
    }

    // Insert posts into DB
    const postRows = posts
      .filter((p) => p.caption && p.caption.trim().length > 0)
      .map((p) => ({
        user_id: userId,
        caption: p.caption!.slice(0, 5000),
        post_type: mapPostType(p.type),
        status: "published",
        platform: "instagram",
        scheduled_date: p.timestamp ? p.timestamp.split("T")[0] : null,
      }));

    if (postRows.length > 0) {
      await supabase.from("posts").insert(postRows);
    }

    // Extract hooks (first sentence of each caption)
    const hookRows = posts
      .filter((p) => p.caption && p.caption.trim().length > 10)
      .map((p) => {
        const firstSentence = p.caption!.split(/[.!?\n]/)[0].trim();
        return {
          user_id: userId,
          text: firstSentence,
          source: "extracted" as const,
          category: "extracted",
          engagement_score: (p.likesCount || 0) + (p.commentsCount || 0),
        };
      })
      .filter((h) => h.text.length >= 10);

    if (hookRows.length > 0) {
      await supabase.from("hooks").insert(hookRows);
    }

    // Analyze identity with Claude
    const captionsForAnalysis = posts
      .filter((p) => p.caption)
      .slice(0, 20)
      .map((p, i) => `Post ${i + 1} (${p.likesCount || 0} likes, ${p.commentsCount || 0} comments):\n"${p.caption!.slice(0, 500)}"`)
      .join("\n\n");

    const analysisPrompt = `Analiza estos posts de Instagram de un creador de contenido fitness:

${captionsForAnalysis}

A partir de estos posts, identifica:

1. NICHO: Que tipo de entrenador/coach es? (strength_coach, functional_coach, wellness_coach, nutrition_coach, running_coach, general_fitness)
2. FILOSOFIA: Cuales son sus principios? Que lo diferencia? Cual es su metodo?
3. VOZ Y TONO: Como habla? Que palabras usa? Que NUNCA usa? Formal o informal?
4. AUDIENCIA: A quien le habla? Edad, nivel, frustraciones?
5. COMPILED PROMPT: Escribe un system prompt de 200-300 palabras que capture completamente la identidad de este creador.

Responde SOLO en JSON valido, sin markdown:
{
  "niche": "strength_coach",
  "experience_estimate": 10,
  "philosophy": {
    "core_principles": ["..."],
    "what_differentiates": "...",
    "training_approach": "...",
    "signature_method": "..."
  },
  "voice_profile": {
    "tone": "...",
    "key_vocabulary": ["..."],
    "never_says": ["..."],
    "language_style": "...",
    "formality": "informal_professional"
  },
  "audience_profile": {
    "ideal_client": "...",
    "frustrations": ["..."],
    "goals": ["..."],
    "age_range": "25-40"
  },
  "content_goals": ["more_clients", "authority"],
  "compiled_prompt": "..."
}`;

    const { text: analysisText, tokensUsed, durationMs } = await callClaude(
      "Eres un analista de marketing digital especializado en fitness creators en LATAM.",
      analysisPrompt,
      3000
    );

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      analysis = { niche: "general_fitness", compiled_prompt: analysisText };
    }

    // Upsert creator_identity
    await supabase.from("creator_identity").upsert(
      {
        user_id: userId,
        onboarding_status: "in_progress",
        current_step: 2,
        niche: analysis.niche,
        experience_years: analysis.experience_estimate || null,
        specialties: [],
        philosophy: analysis.philosophy || {},
        voice_profile: analysis.voice_profile || {},
        audience_profile: analysis.audience_profile || {},
        content_goals: analysis.content_goals || [],
        prohibitions: {},
        compiled_prompt: analysis.compiled_prompt || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    await logAgentRun({
      userId,
      agentName: "instagram-import",
      inputSummary: `Importado @${cleanHandle}: ${postRows.length} posts, ${hookRows.length} hooks`,
      outputData: { postsImported: postRows.length, hooksExtracted: hookRows.length, analysis },
      tokensUsed,
      durationMs,
    });

    return NextResponse.json({
      postsImported: postRows.length,
      hooksExtracted: hookRows.length,
      analysis,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function mapPostType(type?: string): "reel" | "carousel" | "single" | "story" {
  if (!type) return "single";
  const t = type.toLowerCase();
  if (t.includes("video") || t.includes("reel")) return "reel";
  if (t.includes("sidecar") || t.includes("carousel")) return "carousel";
  return "single";
}
