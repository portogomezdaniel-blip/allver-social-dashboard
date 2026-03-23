import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface RealNewsItem {
  title: string;
  source: string;
  sourceUrl: string;
  summary: string;
  publishedAt: string;
  imageUrl?: string;
  category: string;
}

export async function fetchNewsWithClaude(niche: string, city: string, topics: string[] = []): Promise<RealNewsItem[]> {
  try {
    const topicsStr = topics.length > 0 ? topics.join(", ") : niche;
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{
        role: "user",
        content: `Busca las 10 noticias mas recientes y relevantes para un creador de contenido de ${niche} en ${city}. Temas: ${topicsStr}.

Categorias: industry (3-4), science (2-3), social_media (1-2), business (1-2), trending (1-2).

Para cada noticia: titulo, fuente, URL, resumen 2-3 oraciones, fecha, categoria.

IMPORTANTE: Solo noticias REALES. No inventes.

Responde SOLO en JSON:
{"news": [{"title": "", "source": "", "sourceUrl": "", "summary": "", "publishedAt": "YYYY-MM-DD", "category": "industry|science|social_media|business|trending"}]}`
      }],
    });

    let fullText = "";
    for (const block of response.content) {
      if (block.type === "text") fullText += block.text;
    }

    const cleanJson = fullText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const jsonMatch = cleanJson.match(/\{[\s\S]*"news"[\s\S]*\}/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    return (parsed.news || []).map((item: Record<string, string>) => ({
      title: item.title || "",
      source: item.source || "Unknown",
      sourceUrl: item.sourceUrl || item.source_url || "",
      summary: item.summary || "",
      publishedAt: item.publishedAt || item.published_at || new Date().toISOString().split("T")[0],
      category: item.category || "industry",
    }));
  } catch (error) {
    console.error("Error fetching news with Claude:", error);
    return [];
  }
}

export async function fetchNewsWithNewsAPI(keywords: string[]): Promise<RealNewsItem[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return [];

  try {
    const query = keywords.join(" OR ");
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=es&sortBy=publishedAt&pageSize=10`,
      { headers: { "X-Api-Key": apiKey } }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (data.articles || []).map((a: Record<string, unknown>) => ({
      title: (a.title as string) || "",
      source: (a.source as Record<string, string>)?.name || "Unknown",
      sourceUrl: (a.url as string) || "",
      summary: (a.description as string) || "",
      publishedAt: a.publishedAt ? (a.publishedAt as string).split("T")[0] : new Date().toISOString().split("T")[0],
      imageUrl: (a.urlToImage as string) || undefined,
      category: "industry",
    }));
  } catch { return []; }
}

export async function fetchAllNews(niche: string, city: string, keywords: string[]): Promise<RealNewsItem[]> {
  const [claudeNews, apiNews] = await Promise.all([
    fetchNewsWithClaude(niche, city, keywords),
    fetchNewsWithNewsAPI(keywords),
  ]);

  const allNews = [...claudeNews, ...apiNews];
  const seen = new Set<string>();
  const unique: RealNewsItem[] = [];
  for (const item of allNews) {
    const key = item.title.toLowerCase().slice(0, 50);
    if (!seen.has(key) && item.title.length > 10) { seen.add(key); unique.push(item); }
  }
  return unique.slice(0, 10);
}
