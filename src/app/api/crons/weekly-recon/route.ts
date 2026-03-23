import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Placeholder for weekly competitor scraping
  // Future: integrate with Apify to scrape competitor posts
  return NextResponse.json({ message: "Weekly recon cron executed" });
}
