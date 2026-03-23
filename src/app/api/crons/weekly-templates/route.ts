import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Placeholder for weekly template analysis
  // Future: analyze which templates perform best and suggest new ones
  return NextResponse.json({ message: "Weekly templates cron executed" });
}
