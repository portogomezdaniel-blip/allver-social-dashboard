import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeInstagramPosts, type ApifyInstagramPost } from "@/lib/apify";
import { callClaude } from "../../agents/_shared/call-claude";
import { logAgentRun } from "../../agents/_shared/log-run";

function categorizeHook(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("?") || lower.startsWith("por qu") || lower.startsWith("como")) return "question";
  if (lower.includes("no es") || lower.includes("no significa") || lower.includes("error")) return "controversy";
  if (/\d/.test(text) && (lower.includes("kg") || lower.includes("rep") || lower.includes("%"))) return "data";
  if (lower.includes("historia") || lower.includes("cuando") || lower.includes("empec")) return "story";
  if (lower.includes("reto") || lower.includes("intenta") || lower.includes("prueba")) return "challenge";
  return "data";
}

function mapType(type: string): "reel" | "carousel" | "single" | "story" {
  const t = type.toLowerCase();
  if (t.includes("video") || t.includes("reel")) return "reel";
  if (t.includes("sidecar") || t.includes("carousel")) return "carousel";
  return "single";
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

    const cleanHandle = handle ? handle.replace("@", "").trim() : "manual";
    let posts: ApifyInstagramPost[] = [];
    let profileData: { fullName: string; biography: string; followersCount: number; profilePicUrl: string } | null = null;

    // Try Apify scraping
    if (handle && process.env.APIFY_API_TOKEN) {
      try {
        const result = await scrapeInstagramPosts(cleanHandle, 30);
        posts = result.posts;
        if (result.profile) {
          profileData = {
            fullName: result.profile.fullName,
            biography: result.profile.biography,
            followersCount: result.profile.followersCount,
            profilePicUrl: result.profile.profilePicUrl,
          };
        }
      } catch {
        // Apify failed, fall through to manual
      }
    }

    // Fallback to manual captions
    if (posts.length === 0 && manualCaptions && manualCaptions.length > 0) {
      posts = manualCaptions.map((caption: string, i: number) => ({
        id: `manual-${i}`,
        shortCode: `manual-${i}`,
        caption,
        commentsCount: 0,
        likesCount: 0,
        timestamp: new Date(Date.now() - i * 86400000 * 3).toISOString(),
        type: "Image",
        url: "",
        displayUrl: "",
        hashtags: [],
        ownerUsername: cleanHandle,
      }));
    }

    if (posts.length === 0) {
      return NextResponse.json({
        error: "no_posts",
        message: "No se pudieron obtener posts. Usa el modo manual.",
        needsManual: true,
      });
    }

    // Insert posts
    const postRows = posts
      .filter((p) => p.caption && p.caption.trim().length > 0)
      .map((p) => ({
        user_id: userId,
        caption: p.caption.slice(0, 5000),
        post_type: mapType(p.type),
        status: "published",
        platform: "instagram",
        scheduled_date: p.timestamp ? p.timestamp.split("T")[0] : null,
      }));

    if (postRows.length > 0) {
      await supabase.from("posts").insert(postRows);
    }

    // Extract hooks
    const avgEngagement =
      posts.reduce((sum, p) => sum + p.likesCount + p.commentsCount, 0) / Math.max(posts.length, 1);

    const hookRows = posts
      .filter((p) => p.caption && p.caption.trim().length > 10)
      .map((p) => {
        const firstSentence = p.caption.split(/[.!?\n]/)[0].trim();
        const eng = p.likesCount + p.commentsCount;
        return {
          user_id: userId,
          text: firstSentence,
          source: "extracted" as const,
          category: categorizeHook(firstSentence),
          engagement_score: eng,
          is_favorite: eng > avgEngagement,
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
      .map(
        (p, i) =>
          `Post ${i + 1} (${p.likesCount} likes, ${p.commentsCount} comments, tipo: ${p.type}):\n"${p.caption.slice(0, 500)}"`
      )
      .join("\n\n");

    const { text: analysisText, tokensUsed, durationMs } = await callClaude(
      "Eres un analista experto de contenido de redes sociales para creadores fitness en LATAM.",
      `Analiza estos ${Math.min(posts.length, 20)} posts de Instagram de un creador de contenido fitness:

${captionsForAnalysis}

A partir de estos posts, identifica:
1. NICHO: strength_coach, functional_coach, wellness_coach, nutrition_coach, running_coach, general_fitness
2. FILOSOFIA: principios, diferenciador, metodo
3. VOZ Y TONO: como habla, vocabulario frecuente, que nunca dice
4. AUDIENCIA: cliente ideal, frustraciones, rango de edad
5. COMPILED PROMPT: system prompt de 200-300 palabras que capture su identidad

Responde SOLO en JSON valido sin markdown:
{
  "niche": "",
  "experience_estimate": 0,
  "philosophy": { "core_principles": [], "what_differentiates": "", "signature_method": "" },
  "voice_profile": { "tone": "", "key_vocabulary": [], "never_says": [], "language_style": "" },
  "audience_profile": { "ideal_client": "", "frustrations": [], "age_range": "" },
  "content_goals": [],
  "compiled_prompt": ""
}`,
      3000
    );

    let analysis;
    try {
      const cleanJson = analysisText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(cleanJson);
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
      inputSummary: `Importado @${cleanHandle}: ${postRows.length} posts, ${hookRows.length} hooks (Apify: ${!!profileData})`,
      outputData: { postsImported: postRows.length, hooksExtracted: hookRows.length, hadApify: !!profileData },
      tokensUsed,
      durationMs,
    });

    return NextResponse.json({
      success: true,
      profile: profileData,
      postsImported: postRows.length,
      hooksExtracted: hookRows.length,
      analysis,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
