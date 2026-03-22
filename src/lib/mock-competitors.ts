export type CompetitorPlatform = "instagram" | "youtube" | "tiktok";

export interface CompetitorPost {
  caption: string;
  likes: number;
  comments: number;
  date: string;
}

export interface Competitor {
  id: string;
  handle: string;
  name: string;
  platform: CompetitorPlatform;
  followers: number;
  followersChange: number; // last 30d
  avgEngagement: number;
  postsPerWeek: number;
  recentPosts: CompetitorPost[];
}

export const platformLabels: Record<CompetitorPlatform, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
};

export const mockCompetitors: Competitor[] = [
  {
    id: "comp1",
    handle: "@ai.marketing.pro",
    name: "AI Marketing Pro",
    platform: "instagram",
    followers: 45200,
    followersChange: 1840,
    avgEngagement: 4.7,
    postsPerWeek: 5,
    recentPosts: [
      { caption: "El futuro del SEO con inteligencia artificial", likes: 892, comments: 67, date: "2026-03-19" },
      { caption: "5 prompts que usan las agencias top", likes: 1240, comments: 103, date: "2026-03-17" },
      { caption: "Automatiza tus reportes en 3 pasos", likes: 678, comments: 45, date: "2026-03-15" },
    ],
  },
  {
    id: "comp2",
    handle: "@digitalflow.co",
    name: "Digital Flow",
    platform: "instagram",
    followers: 32800,
    followersChange: 920,
    avgEngagement: 3.9,
    postsPerWeek: 4,
    recentPosts: [
      { caption: "Tendencias de contenido para Q2 2026", likes: 534, comments: 38, date: "2026-03-20" },
      { caption: "Caso real: de 0 a 10k en 60 dias", likes: 1890, comments: 156, date: "2026-03-18" },
      { caption: "Herramientas gratuitas para creadores", likes: 723, comments: 52, date: "2026-03-14" },
    ],
  },
  {
    id: "comp3",
    handle: "@automate.labs",
    name: "Automate Labs",
    platform: "instagram",
    followers: 18500,
    followersChange: 2150,
    avgEngagement: 6.2,
    postsPerWeek: 7,
    recentPosts: [
      { caption: "Construye tu primer agente en 10 min", likes: 445, comments: 89, date: "2026-03-20" },
      { caption: "Por que no necesitas saber programar", likes: 612, comments: 73, date: "2026-03-18" },
      { caption: "Review: las mejores APIs de IA en 2026", likes: 389, comments: 41, date: "2026-03-16" },
    ],
  },
  {
    id: "comp4",
    handle: "@TechAutomation",
    name: "Tech Automation",
    platform: "youtube",
    followers: 128000,
    followersChange: 4500,
    avgEngagement: 2.8,
    postsPerWeek: 2,
    recentPosts: [
      { caption: "Agentes de IA: guia completa 2026", likes: 3400, comments: 245, date: "2026-03-16" },
      { caption: "Automatiza tu negocio con n8n", likes: 2100, comments: 178, date: "2026-03-09" },
      { caption: "Claude vs ChatGPT: test real", likes: 5600, comments: 412, date: "2026-03-02" },
    ],
  },
  {
    id: "comp5",
    handle: "@growthwithai",
    name: "Growth with AI",
    platform: "tiktok",
    followers: 67400,
    followersChange: 8200,
    avgEngagement: 8.1,
    postsPerWeek: 10,
    recentPosts: [
      { caption: "Este prompt me ahorra 3 horas al dia", likes: 12400, comments: 340, date: "2026-03-20" },
      { caption: "La IA que escribe mejor que tu", likes: 8900, comments: 267, date: "2026-03-19" },
      { caption: "Hack: automatiza tus DMs", likes: 6700, comments: 189, date: "2026-03-18" },
    ],
  },
  {
    id: "comp6",
    handle: "@socialmedia.ia",
    name: "Social Media IA",
    platform: "instagram",
    followers: 22100,
    followersChange: -340,
    avgEngagement: 2.1,
    postsPerWeek: 3,
    recentPosts: [
      { caption: "Tips para mejorar tu feed", likes: 210, comments: 12, date: "2026-03-19" },
      { caption: "Mejores horarios para publicar", likes: 345, comments: 23, date: "2026-03-15" },
      { caption: "Como usar hashtags en 2026", likes: 189, comments: 8, date: "2026-03-11" },
    ],
  },
];
