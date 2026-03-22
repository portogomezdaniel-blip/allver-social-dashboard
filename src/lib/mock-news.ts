export type NewsTopic = "tools" | "research" | "business";

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  date: string;
  summary: string;
  topic: NewsTopic;
  url: string;
}

export const topicConfig: Record<NewsTopic, { label: string; color: string }> = {
  tools: {
    label: "Herramientas",
    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  research: {
    label: "Investigacion",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  business: {
    label: "Negocios",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
};

export const mockNews: NewsItem[] = [
  {
    id: "n1",
    headline: "Claude 4.5 Opus establece nuevo record en benchmarks de razonamiento",
    source: "Anthropic Blog",
    date: "2026-03-21",
    summary: "Anthropic lanza su modelo mas avanzado con capacidades de razonamiento mejoradas, superando a GPT-5 en multiples benchmarks de codigo y analisis.",
    topic: "research",
    url: "#",
  },
  {
    id: "n2",
    headline: "Meta lanza herramienta gratuita de automatizacion para creadores de contenido",
    source: "TechCrunch",
    date: "2026-03-21",
    summary: "La nueva suite de Meta permite a creadores programar, editar y optimizar contenido en Instagram y Facebook con asistencia de IA integrada.",
    topic: "tools",
    url: "#",
  },
  {
    id: "n3",
    headline: "El mercado de agentes de IA alcanzara los $65B para 2028, segun Gartner",
    source: "Gartner Research",
    date: "2026-03-20",
    summary: "Nuevo reporte proyecta un crecimiento explosivo en el sector de agentes autonomos, con adopcion acelerada en marketing, ventas y operaciones.",
    topic: "business",
    url: "#",
  },
  {
    id: "n4",
    headline: "n8n 2.0: nueva version con nodos de IA nativos y marketplace de workflows",
    source: "n8n Blog",
    date: "2026-03-20",
    summary: "La plataforma de automatizacion open-source introduce nodos nativos para OpenAI, Anthropic y Google, junto a un marketplace comunitario de workflows.",
    topic: "tools",
    url: "#",
  },
  {
    id: "n5",
    headline: "Estudio de Harvard: empresas con IA en marketing crecen 3.2x mas rapido",
    source: "Harvard Business Review",
    date: "2026-03-19",
    summary: "Investigacion con 2,400 empresas demuestra que la adopcion de IA en estrategias de marketing digital correlaciona directamente con tasas de crecimiento superiores.",
    topic: "research",
    url: "#",
  },
  {
    id: "n6",
    headline: "Metricool integra analisis predictivo con IA para planificacion de contenido",
    source: "Metricool Blog",
    date: "2026-03-19",
    summary: "La plataforma de analytics ahora sugiere horarios optimos, tipos de contenido y hashtags basados en modelos predictivos entrenados con datos historicos.",
    topic: "tools",
    url: "#",
  },
  {
    id: "n7",
    headline: "OpenAI anuncia programa de certificacion para desarrolladores de agentes",
    source: "OpenAI Blog",
    date: "2026-03-18",
    summary: "El programa incluye formacion en diseno de agentes, integracion con APIs y mejores practicas de seguridad. Primeras certificaciones disponibles en abril.",
    topic: "business",
    url: "#",
  },
  {
    id: "n8",
    headline: "Google DeepMind publica paper sobre agentes multimodales colaborativos",
    source: "arXiv",
    date: "2026-03-18",
    summary: "Nuevo framework permite que multiples agentes de IA colaboren en tareas complejas combinando vision, lenguaje y ejecucion de codigo en tiempo real.",
    topic: "research",
    url: "#",
  },
  {
    id: "n9",
    headline: "Shopify lanza AI Commerce Suite para automatizar operaciones de e-commerce",
    source: "Shopify Engineering",
    date: "2026-03-17",
    summary: "Suite integrada que automatiza inventario, pricing dinamico, atencion al cliente y campanas de marketing usando modelos de lenguaje especializados.",
    topic: "tools",
    url: "#",
  },
  {
    id: "n10",
    headline: "Las agencias de automatizacion crecen 400% en Latinoamerica durante 2025",
    source: "Bloomberg Linea",
    date: "2026-03-17",
    summary: "El ecosistema de agencias de automatizacion con IA en la region se cuadruplico, con Colombia, Mexico y Brasil liderando la adopcion.",
    topic: "business",
    url: "#",
  },
  {
    id: "n11",
    headline: "Canva presenta modo agente: disena presentaciones con instrucciones en texto",
    source: "The Verge",
    date: "2026-03-16",
    summary: "El nuevo modo agente de Canva genera presentaciones completas a partir de briefs de texto, incluyendo seleccion de imagenes, layout y animaciones.",
    topic: "tools",
    url: "#",
  },
  {
    id: "n12",
    headline: "MIT: los modelos de lenguaje pueden predecir tendencias de contenido viral",
    source: "MIT Technology Review",
    date: "2026-03-15",
    summary: "Investigadores del MIT demuestran que LLMs fine-tuneados con datos de redes sociales predicen viralidad con 78% de precision antes de la publicacion.",
    topic: "research",
    url: "#",
  },
];
