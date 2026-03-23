import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude } from "../_shared/call-claude";
import { getIdentity } from "../_shared/get-identity";
import { logAgentRun } from "../_shared/log-run";

export async function POST(req: NextRequest) {
  try {
    const { userId, hookText, engagementScore, originalCaption } =
      await req.json();

    if (!userId || !hookText) {
      return NextResponse.json(
        { error: "userId and hookText required" },
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

    const niche = identity.niche || "fitness";

    const systemPrompt = `Eres el copywriter de ${niche} en ${identity.city || "Medellin"}.

${identity.compiled_prompt}`;

    const userMessage = `Hook original que funciono bien${engagementScore ? ` (engagement: ${engagementScore})` : ""}:
"${hookText}"

${originalCaption ? `Contexto del post original: ${originalCaption.slice(0, 500)}` : ""}

Genera 5 variaciones de este hook para DIFERENTES temas de ${niche}.
Cada variacion debe:
1. Mantener la misma estructura/patron del hook original
2. Aplicarse a un tema diferente dentro del nicho
3. Sonar 100% como el creador
4. Provocar la misma reaccion (curiosidad/controversia/sorpresa)

Responde SOLO en JSON valido, sin markdown:
{
  "variations": [
    {"hook": "", "suggested_topic": "", "format": "reel|carousel|single"}
  ]
}`;

    const { text, tokensUsed, durationMs } = await callClaude(
      systemPrompt,
      userMessage
    );

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { variations: [] };
    }

    // Save generated hooks to DB
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (parsed.variations && parsed.variations.length > 0) {
      const hookRows = parsed.variations.map(
        (v: { hook: string; suggested_topic: string }) => ({
          user_id: userId,
          text: v.hook,
          source: "ai_generated",
          category: "variation",
        })
      );
      await supabase.from("hooks").insert(hookRows);
    }

    await logAgentRun({
      userId,
      agentName: "generate-hooks",
      inputSummary: `Variaciones de: "${hookText.slice(0, 50)}..."`,
      outputData: parsed,
      tokensUsed,
      durationMs,
    });

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
