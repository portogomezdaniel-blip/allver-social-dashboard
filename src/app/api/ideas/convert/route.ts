import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { idea_stream_id, format, text, creator_id } = await req.json();
    if (!idea_stream_id || !format || !text || !creator_id) {
      return NextResponse.json({ error: "idea_stream_id, format, text, and creator_id required" }, { status: 400 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const title = text.length > 60 ? text.slice(0, 57) + "..." : text;
    const funnel_role = format === "carousel" ? "authority" : format === "story" ? "conversion" : format === "single" ? "conversion" : "filter";

    // Create scored_content_ideas entry
    const { data: scored, error: scoredErr } = await supabase
      .from("scored_content_ideas")
      .insert({
        user_id: creator_id,
        source: "ideas_stream",
        source_output_id: idea_stream_id,
        title,
        hook: text,
        format,
        funnel_role,
        description: text,
        suggested_day: "any",
        temperature_score: 5,
        relevance_score: 7,
        virality_score: 5,
        authority_score: 5,
        conversion_score: 5,
        total_score: 5.4,
        score_reasoning: "Idea capturada del stream — pendiente de generación",
        status: "suggested",
      })
      .select("id")
      .single();

    if (scoredErr) return NextResponse.json({ error: scoredErr.message }, { status: 500 });

    // Update ideas_stream
    await supabase
      .from("ideas_stream")
      .update({ status: "converted", converted_to: scored.id, converted_format: format })
      .eq("id", idea_stream_id);

    return NextResponse.json({ scored_content_id: scored.id });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
