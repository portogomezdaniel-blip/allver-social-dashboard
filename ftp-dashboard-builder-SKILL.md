---
name: ftp-dashboard-builder
description: >
  Skill para construir y personalizar dashboards de FTP by LLVR (Full Time Player).
  Usa este skill SIEMPRE que el usuario mencione: FTP, LLVR, dashboard de creador,
  panel de contenido, Mauro, entrenador, coach fitness, Instagram Manager, Command Center,
  banco de hooks, templates de copy, contenido del día, scraping de competidores,
  RECON, agentes de IA para contenido, personalizar dashboard, white-label para coach,
  o cualquier combinación de dashboard + fitness + contenido + IA. También activa cuando
  el usuario quiera agregar módulos al panel, conectar Supabase, crear API routes para
  agentes de Anthropic, o personalizar la experiencia para un creador específico.
  Stack: Next.js 14, Tailwind CSS, shadcn/ui, Supabase, Anthropic API, Apify.
---

# FTP Dashboard Builder

## Filosofía

FTP by LLVR construye sistemas operativos para creadores de contenido fitness.
Cada dashboard es personalizado para UN creador específico. El sistema primero aprende
quién es el creador (onboarding → creator_identity), luego todo se adapta a él.

**Regla #1**: Sin `compiled_prompt`, no hay generación de IA. Punto.
**Regla #2**: RLS en Supabase garantiza que cada creador solo ve lo suyo.
**Regla #3**: La estética es militar minimalista — #0D1008, #C8C8C8, #4A7C2F, Barlow Condensed, 0 border-radius.

---

## Stack

| Capa | Herramienta | Config |
|------|------------|--------|
| Frontend | Next.js 14, App Router | Tailwind + shadcn/ui |
| Auth + DB | Supabase | RLS habilitado en todo |
| IA | Anthropic API | claude-sonnet-4-20250514 |
| Scraping | Apify | Instagram Profile Scraper |
| Deploy | Vercel | Auto-deploy desde GitHub |

---

## Estructura de Archivos

```
src/
├── app/
│   ├── dashboard/         → Command Center (HOME)
│   │   └── page.tsx
│   ├── content/           → Instagram Manager
│   │   └── page.tsx
│   ├── calendar/          → Calendario editorial
│   │   └── page.tsx
│   ├── recon/             → Competidores + scraping
│   │   └── page.tsx
│   ├── hooks/             → Banco de Hooks
│   │   └── page.tsx
│   ├── templates/         → Templates Rápidos
│   │   └── page.tsx
│   ├── agents/            → Panel de Agentes (log)
│   │   └── page.tsx
│   ├── api/
│   │   └── agents/
│   │       ├── daily-content.ts
│   │       ├── write-copy.ts
│   │       ├── generate-hooks.ts
│   │       ├── analyze-competitor.ts
│   │       └── _shared/
│   │           ├── get-identity.ts
│   │           └── call-claude.ts
│   ├── login/
│   └── register/
├── components/
│   ├── dashboard/
│   │   ├── StatsRow.tsx
│   │   ├── DailyContent.tsx
│   │   ├── ContentPipeline.tsx
│   │   ├── ReconPreview.tsx
│   │   ├── HooksPreview.tsx
│   │   └── WeekView.tsx
│   ├── hooks/
│   │   ├── HookCard.tsx
│   │   └── HookGenerator.tsx
│   ├── templates/
│   │   ├── TemplateCard.tsx
│   │   └── TemplateFiller.tsx
│   ├── recon/
│   │   ├── CompetitorCard.tsx
│   │   └── CompetitorAnalysis.tsx
│   └── shared/
│       ├── Sidebar.tsx
│       └── Header.tsx
├── lib/
│   ├── supabase.ts
│   ├── anthropic.ts
│   └── apify.ts
└── types/
    └── index.ts
```

---

## Módulos — Especificación Rápida

### Command Center (/dashboard)
- Header: "Buenos días/tardes/noches, {nombre}" + fecha + @handle
- Stats: posts del mes, engagement avg, mejor post, ideas en backlog
- Contenido del Día: sugerencia con hook, formato, tema
- Content Pipeline: barras por status
- Recon: competidor más activo
- Hooks: top 5 por engagement
- Mini calendario: próximos 7 días

### Banco de Hooks (/hooks)
- Lista filtrable por categoría (controversia, pregunta, dato, historia, reto)
- Cada hook: texto, source, engagement, veces usado, favorito
- Acciones: copiar, generar variaciones con IA, usar en post
- Botón: guardar hook manual, generar nuevos con IA

### Templates (/templates)
- Cards con nombre, descripción, formato, frecuencia sugerida
- Acción "Usar": abre editor con la estructura y campos a llenar
- Acción "Llenar con IA": el agente llena el template con un tema dado
- Templates precargados por nicho (is_system: true)

### RECON (/recon)
- Lista de competidores con métricas
- Por competidor: top 3 posts, patrones detectados
- Acciones: guardar hooks del competidor, analizar con IA, actualizar scraping
- Botón: agregar competidor (por @handle)

---

## Agentes — Prompts Base

### Daily Content Strategist
System: compiled_prompt del creador
User: "Genera sugerencia para hoy. Últimos 10 posts: {resumen}. Calendario semanal: {programado}. No repetir temas de últimos 7 días. Alternar formatos."
Output: JSON { tema, formato, hook, puntos_clave[], hora_optima, hashtags[], cta_sugerido }

### Copy Writer
System: compiled_prompt del creador
User: "Escribe el caption completo. Tema: {tema}. Hook: {hook}. Formato: {formato}. Template: {estructura si aplica}. Debe sonar 100% como {nombre}."
Output: texto del caption

### Hook Generator
System: compiled_prompt del creador
User: "Hook original: '{hook}'. Engagement: {score}. Genera 5 variaciones para diferentes temas de {nicho}."
Output: JSON { variations: [{ hook, suggested_topic, format }] }

### Competitor Analyst
System: "Eres analista de contenido fitness en Instagram."
User: "Analiza estos 20 posts de @{handle}: {data}. Identifica: frecuencia, formatos ganadores, temas recurrentes, patrones de hooks, CTAs, gaps."
Output: JSON estructurado

---

## Estética — Componentes

### Card estándar
```css
background: rgba(74, 124, 47, 0.05);
border: 1px solid rgba(74, 124, 47, 0.15);
border-radius: 0;
padding: 20px 24px;
```
Hover: `border-color: rgba(74, 124, 47, 0.35);`

### Stat Block
```css
background: rgba(74, 124, 47, 0.08);
border-left: 2px solid #4A7C2F;
padding: 16px 20px;
```
Número: Barlow Condensed, 32px, bold, #C8C8C8
Label: 10px, uppercase, tracking 0.15em, #666

### Botón primario
```css
background: #4A7C2F;
color: #0D1008;
font-family: 'Barlow Condensed';
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.1em;
padding: 10px 24px;
border-radius: 0;
```

### Sidebar
```css
background: #0D1008;
border-right: 1px solid rgba(74, 124, 47, 0.15);
width: 200px;
```
Links: uppercase, 11px, tracking 0.15em, color #666, active: #4A7C2F

---

## Protocolo de Construcción

1. Siempre leer CLAUDE.md antes de tocar código
2. Crear tablas en Supabase ANTES de construir componentes
3. Insertar seed data ANTES de construir vistas
4. Cada API route de agente verifica que compiled_prompt existe
5. Cada componente que muestra data tiene estado de loading y empty state
6. Testing: verificar que RLS funciona (user A no ve data de user B)
7. Deploy: push a main → Vercel hace auto-deploy
