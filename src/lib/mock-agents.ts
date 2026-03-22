export type AgentStatus = "active" | "idle" | "error";
export type OutputStatus = "pending" | "approved" | "rejected";

export interface CarouselSlide {
  id: string;
  alt: string;
  gradient: string; // CSS gradient as placeholder for real images
  label: string;
}

export interface AgentOutput {
  id: string;
  type: "instagram-post" | "text" | "report";
  caption?: string;
  slides?: CarouselSlide[];
  textContent?: string;
  generatedAt: string;
  status: OutputStatus;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  lastRun: string;
  nextScheduled: string | null;
  successRate: number;
  totalRuns: number;
  lastOutput: AgentOutput;
}

export interface AgentLogEntry {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  timestamp: string;
  status: "success" | "error" | "pending";
  detail: string;
}

export const mockAgents: Agent[] = [
  {
    id: "agent-instagram",
    name: "Instagram Content Agent",
    description:
      "Genera carruseles, reels y captions optimizados para Instagram basados en el calendario de contenido y tendencias actuales.",
    status: "active",
    lastRun: "2026-03-21T09:15:00",
    nextScheduled: "2026-03-21T15:00:00",
    successRate: 94,
    totalRuns: 127,
    lastOutput: {
      id: "out-ig-1",
      type: "instagram-post",
      caption:
        "La automatizacion no reemplaza la creatividad — la amplifica.\n\nEn los ultimos 30 dias hemos ayudado a 12 negocios locales a:\n\n1. Reducir el tiempo de creacion de contenido en un 60%\n2. Aumentar su engagement rate en un 3.2x\n3. Generar 40% mas leads desde Instagram\n\nLa clave no es publicar mas, es publicar mejor.\n\nGuarda este post si quieres aprender como hacerlo.\n\n#AIAutomation #MarketingDigital #NegociosLocales #ContentStrategy #AllverHub",
      slides: [
        {
          id: "s1",
          alt: "Slide 1 - Titulo",
          gradient: "from-violet-600 via-purple-600 to-indigo-700",
          label: "La automatizacion amplifica tu creatividad",
        },
        {
          id: "s2",
          alt: "Slide 2 - Estadistica 1",
          gradient: "from-indigo-600 via-blue-600 to-cyan-600",
          label: "60% menos tiempo en creacion de contenido",
        },
        {
          id: "s3",
          alt: "Slide 3 - Estadistica 2",
          gradient: "from-cyan-600 via-teal-600 to-emerald-600",
          label: "3.2x mas engagement rate",
        },
        {
          id: "s4",
          alt: "Slide 4 - Estadistica 3",
          gradient: "from-emerald-600 via-green-600 to-lime-600",
          label: "40% mas leads desde Instagram",
        },
        {
          id: "s5",
          alt: "Slide 5 - CTA",
          gradient: "from-purple-600 via-pink-600 to-rose-600",
          label: "Guarda este post - Allver Hub",
        },
      ],
      generatedAt: "2026-03-21T09:15:00",
      status: "pending",
    },
  },
  {
    id: "agent-andrea",
    name: "Andrea Engine",
    description:
      "Motor de analisis de audiencia y optimizacion de horarios de publicacion. Procesa datos de Metricool para generar recomendaciones.",
    status: "idle",
    lastRun: "2026-03-21T06:00:00",
    nextScheduled: "2026-03-22T06:00:00",
    successRate: 98,
    totalRuns: 89,
    lastOutput: {
      id: "out-andrea-1",
      type: "report",
      textContent: `## Reporte de Audiencia — 21 Mar 2026

### Mejores horarios detectados
- **Lunes a Viernes:** 10:00 - 11:30 AM (engagement +42% vs promedio)
- **Sabados:** 9:00 - 10:00 AM (reach +35%)
- **Domingos:** Baja actividad, no recomendado publicar

### Audiencia principal
- 68% entre 25-34 anos
- 72% desde Colombia, 15% Mexico, 8% Argentina
- Intereses top: tecnologia, emprendimiento, marketing digital

### Recomendaciones
1. Priorizar carruseles educativos entre semana
2. Reels cortos (<30s) los sabados
3. Evitar publicar despues de las 8 PM
4. Hashtags con mejor rendimiento: #AIAutomation, #NegociosLocales, #MarketingDigital`,
      generatedAt: "2026-03-21T06:00:00",
      status: "approved",
    },
  },
  {
    id: "agent-amethyst",
    name: "Amethyst Agent",
    description:
      "Agente de respuesta automatica y engagement. Monitorea comentarios, DMs y menciones para generar respuestas contextuales.",
    status: "error",
    lastRun: "2026-03-21T08:45:00",
    nextScheduled: null,
    successRate: 87,
    totalRuns: 203,
    lastOutput: {
      id: "out-amethyst-1",
      type: "text",
      textContent: `Error: No se pudo conectar con la API de Instagram.

Detalles:
- Endpoint: graph.instagram.com/v19.0/me/messages
- Error code: 190 — OAuth token expirado
- Ultima renovacion del token: 2026-02-19

Accion requerida: Renovar el token de acceso en la configuracion de Meta Business Suite.

Ultimo lote procesado antes del error:
- 14 comentarios respondidos
- 3 DMs procesados
- 2 menciones detectadas`,
      generatedAt: "2026-03-21T08:45:00",
      status: "pending",
    },
  },
];

export const mockLog: AgentLogEntry[] = [
  {
    id: "log1",
    agentId: "agent-instagram",
    agentName: "Instagram Content Agent",
    action: "Contenido generado: carrusel de 5 slides",
    timestamp: "2026-03-21T09:15:00",
    status: "success",
    detail: "Carrusel sobre automatizacion y creatividad",
  },
  {
    id: "log2",
    agentId: "agent-amethyst",
    agentName: "Amethyst Agent",
    action: "Error de conexion con API de Instagram",
    timestamp: "2026-03-21T08:45:00",
    status: "error",
    detail: "OAuth token expirado — requiere renovacion manual",
  },
  {
    id: "log3",
    agentId: "agent-amethyst",
    agentName: "Amethyst Agent",
    action: "Lote de engagement procesado",
    timestamp: "2026-03-21T08:30:00",
    status: "success",
    detail: "14 comentarios, 3 DMs, 2 menciones",
  },
  {
    id: "log4",
    agentId: "agent-andrea",
    agentName: "Andrea Engine",
    action: "Reporte de audiencia generado",
    timestamp: "2026-03-21T06:00:00",
    status: "success",
    detail: "Analisis de 30 dias con recomendaciones de horarios",
  },
  {
    id: "log5",
    agentId: "agent-instagram",
    agentName: "Instagram Content Agent",
    action: "Post aprobado y enviado a cola de publicacion",
    timestamp: "2026-03-20T16:20:00",
    status: "success",
    detail: "Reel: 5 herramientas de IA para negocios locales",
  },
  {
    id: "log6",
    agentId: "agent-amethyst",
    agentName: "Amethyst Agent",
    action: "Lote de engagement procesado",
    timestamp: "2026-03-20T14:00:00",
    status: "success",
    detail: "22 comentarios, 5 DMs, 4 menciones",
  },
  {
    id: "log7",
    agentId: "agent-instagram",
    agentName: "Instagram Content Agent",
    action: "Contenido rechazado por el usuario",
    timestamp: "2026-03-20T10:30:00",
    status: "pending",
    detail: "Caption no alineado con tono de marca",
  },
  {
    id: "log8",
    agentId: "agent-andrea",
    agentName: "Andrea Engine",
    action: "Sincronizacion con Metricool completada",
    timestamp: "2026-03-20T06:00:00",
    status: "success",
    detail: "Datos de 7 dias importados correctamente",
  },
  {
    id: "log9",
    agentId: "agent-instagram",
    agentName: "Instagram Content Agent",
    action: "Contenido generado: reel script",
    timestamp: "2026-03-20T09:00:00",
    status: "success",
    detail: "Script de 45 segundos sobre herramientas de IA",
  },
  {
    id: "log10",
    agentId: "agent-amethyst",
    agentName: "Amethyst Agent",
    action: "Respuesta automatica enviada",
    timestamp: "2026-03-19T21:15:00",
    status: "success",
    detail: "Respuesta a consulta de precio en DM",
  },
];
