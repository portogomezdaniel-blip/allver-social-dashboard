import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("client_programs")
    .select("id, client_name, period_label, period_start, period_end, status, is_published, slug, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("client_programs")
    .insert({
      client_name: body.client_name,
      period_label: body.period_label || null,
      period_start: body.period_start || null,
      period_end: body.period_end || null,
      frequency: body.frequency || 4,
      general_notes: body.general_notes || null,
      resources: body.resources || null,
      program_json: body.program_json || { days: [] },
      status: "active",
      is_published: false,
      client_id: "00000000-0000-0000-0000-000000000000",
      block_number: body.block_number || 1,
      week_number: body.week_number || 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
