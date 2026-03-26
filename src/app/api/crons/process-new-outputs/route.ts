import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: unprocessed } = await supabase
      .from("weekly_program_output")
      .select("id, user_id")
      .eq("processed", false)
      .order("created_at", { ascending: true })
      .limit(5);

    if (!unprocessed?.length) {
      return NextResponse.json({ message: "No new outputs to process" });
    }

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://allver-social-dashboard.vercel.app";

    const results = [];

    for (const output of unprocessed) {
      try {
        const response = await fetch(`${baseUrl}/api/program/process-output`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: output.user_id, outputId: output.id }),
        });
        const data = await response.json();
        results.push({ outputId: output.id, status: "processed", ideas: data.ideasGenerated });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "error";
        results.push({ outputId: output.id, status: "error", error: msg });
      }
      await new Promise((r) => setTimeout(r, 5000));
    }

    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
