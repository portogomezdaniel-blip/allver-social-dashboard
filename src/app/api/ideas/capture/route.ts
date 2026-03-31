import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { creator_id, text } = await req.json();
    if (!creator_id || !text) return NextResponse.json({ error: "creator_id and text required" }, { status: 400 });
    if (text.length > 500) return NextResponse.json({ error: "Text exceeds 500 characters" }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await supabase
      .from("ideas_stream")
      .insert({ creator_id, text, status: "active" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
