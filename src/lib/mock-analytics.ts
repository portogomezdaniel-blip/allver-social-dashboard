export interface DailyMetric {
  date: string;
  impressions: number;
  engagementRate: number;
  followers: number;
}

export interface TopPost {
  id: string;
  caption: string;
  postType: string;
  impressions: number;
  likes: number;
  comments: number;
  saves: number;
  engagementRate: number;
  publishedDate: string;
}

function generateDailyMetrics(): DailyMetric[] {
  const data: DailyMetric[] = [];
  let followers = 2340;
  const startDate = new Date("2026-02-19");

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const baseImpressions = isWeekend ? 1800 : 2400;
    const impressions =
      baseImpressions + Math.floor(Math.random() * 1200) - 300;
    const engagementRate =
      Math.round((3.2 + Math.random() * 3.5 - 0.8) * 100) / 100;
    followers += Math.floor(Math.random() * 25) - 5;

    data.push({
      date: date.toISOString().split("T")[0],
      impressions,
      engagementRate,
      followers,
    });
  }

  return data;
}

export const dailyMetrics = generateDailyMetrics();

export const topPosts: TopPost[] = [
  {
    id: "tp1",
    caption: "3 errores que cometen los negocios locales en Instagram",
    postType: "Imagen",
    impressions: 4820,
    likes: 312,
    comments: 47,
    saves: 89,
    engagementRate: 9.3,
    publishedDate: "2026-03-15",
  },
  {
    id: "tp2",
    caption: "Nuevo servicio: chatbots con IA para negocios locales",
    postType: "Reel",
    impressions: 6150,
    likes: 284,
    comments: 63,
    saves: 112,
    engagementRate: 7.5,
    publishedDate: "2026-03-10",
  },
  {
    id: "tp3",
    caption: "La verdad sobre los agentes de IA: que pueden y que no",
    postType: "Carrusel",
    impressions: 3980,
    likes: 198,
    comments: 35,
    saves: 67,
    engagementRate: 7.5,
    publishedDate: "2026-03-05",
  },
  {
    id: "tp4",
    caption: "Como elegir la mejor herramienta de automatizacion",
    postType: "Carrusel",
    impressions: 3420,
    likes: 176,
    comments: 28,
    saves: 54,
    engagementRate: 7.5,
    publishedDate: "2026-03-01",
  },
  {
    id: "tp5",
    caption: "Un dia en la vida de un founder de IA",
    postType: "Reel",
    impressions: 5200,
    likes: 245,
    comments: 41,
    saves: 38,
    engagementRate: 6.2,
    publishedDate: "2026-02-26",
  },
];

export const summaryStats = {
  totalImpressions: dailyMetrics.reduce((sum, d) => sum + d.impressions, 0),
  avgEngagement:
    Math.round(
      (dailyMetrics.reduce((sum, d) => sum + d.engagementRate, 0) /
        dailyMetrics.length) *
        100
    ) / 100,
  currentFollowers: dailyMetrics[dailyMetrics.length - 1].followers,
  followerGrowth:
    dailyMetrics[dailyMetrics.length - 1].followers - dailyMetrics[0].followers,
};
