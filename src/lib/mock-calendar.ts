export type Platform = "instagram" | "youtube" | "tiktok" | "linkedin";

export type CalendarPostStatus = "scheduled" | "published";

export interface CalendarPost {
  id: string;
  title: string;
  platform: Platform;
  status: CalendarPostStatus;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export const platformConfig: Record<
  Platform,
  { label: string; color: string; dotColor: string }
> = {
  instagram: {
    label: "Instagram",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    dotColor: "bg-purple-400",
  },
  youtube: {
    label: "YouTube",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    dotColor: "bg-red-400",
  },
  tiktok: {
    label: "TikTok",
    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    dotColor: "bg-cyan-400",
  },
  linkedin: {
    label: "LinkedIn",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    dotColor: "bg-blue-400",
  },
};

export const calendarPosts: CalendarPost[] = [
  // March 2026
  { id: "c1", title: "Reel: 5 tools de IA", platform: "instagram", status: "published", date: "2026-03-03", time: "10:00" },
  { id: "c2", title: "Short: Tips automatizacion", platform: "youtube", status: "published", date: "2026-03-03", time: "14:00" },
  { id: "c3", title: "Carrusel: Caso de estudio", platform: "instagram", status: "published", date: "2026-03-05", time: "11:00" },
  { id: "c4", title: "Video: Tutorial chatbot", platform: "youtube", status: "published", date: "2026-03-07", time: "16:00" },
  { id: "c5", title: "Post: Nuevo servicio IA", platform: "linkedin", status: "published", date: "2026-03-07", time: "09:00" },
  { id: "c6", title: "Reel: Errores en redes", platform: "instagram", status: "published", date: "2026-03-10", time: "10:00" },
  { id: "c7", title: "TikTok: Hack de productividad", platform: "tiktok", status: "published", date: "2026-03-10", time: "18:00" },
  { id: "c8", title: "Carrusel: Agentes de IA", platform: "instagram", status: "published", date: "2026-03-12", time: "11:00" },
  { id: "c9", title: "Short: Antes y despues", platform: "youtube", status: "published", date: "2026-03-14", time: "15:00" },
  { id: "c10", title: "Reel: Dia de un founder", platform: "instagram", status: "published", date: "2026-03-15", time: "10:00" },
  { id: "c11", title: "Post: Tendencias IA 2026", platform: "linkedin", status: "published", date: "2026-03-17", time: "08:30" },
  { id: "c12", title: "TikTok: ChatGPT vs Claude", platform: "tiktok", status: "published", date: "2026-03-17", time: "19:00" },
  { id: "c13", title: "Carrusel: Marketing con IA", platform: "instagram", status: "published", date: "2026-03-19", time: "11:00" },
  { id: "c14", title: "Reel: Automatiza tu negocio", platform: "instagram", status: "scheduled", date: "2026-03-24", time: "10:00" },
  { id: "c15", title: "Video: Review herramientas", platform: "youtube", status: "scheduled", date: "2026-03-24", time: "16:00" },
  { id: "c16", title: "TikTok: IA en 60 segundos", platform: "tiktok", status: "scheduled", date: "2026-03-25", time: "18:00" },
  { id: "c17", title: "Carrusel: Guia automatizacion", platform: "instagram", status: "scheduled", date: "2026-03-26", time: "11:00" },
  { id: "c18", title: "Post: Resultados Q1", platform: "linkedin", status: "scheduled", date: "2026-03-27", time: "09:00" },
  { id: "c19", title: "Reel: Behind the scenes", platform: "instagram", status: "scheduled", date: "2026-03-28", time: "10:00" },
  { id: "c20", title: "Short: Tip rapido", platform: "youtube", status: "scheduled", date: "2026-03-31", time: "14:00" },
  // April 2026
  { id: "c21", title: "Reel: Novedades abril", platform: "instagram", status: "scheduled", date: "2026-04-01", time: "10:00" },
  { id: "c22", title: "Video: Masterclass agentes", platform: "youtube", status: "scheduled", date: "2026-04-02", time: "16:00" },
  { id: "c23", title: "TikTok: Mito vs realidad", platform: "tiktok", status: "scheduled", date: "2026-04-03", time: "18:00" },
  { id: "c24", title: "Carrusel: ROI de la IA", platform: "instagram", status: "scheduled", date: "2026-04-07", time: "11:00" },
  { id: "c25", title: "Post: Alianza estrategica", platform: "linkedin", status: "scheduled", date: "2026-04-09", time: "09:00" },
];
