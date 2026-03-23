# FTP by LLVR — Blueprint de Infraestructura Completa
## Panel Personalizado: MAURO | Strength Coach | Medellín

> Este documento es el plano maestro. Claude Code lee esto y construye TODO.
> No es código — es arquitectura, decisiones, y especificaciones exactas.

---

## CONTEXTO RÁPIDO

**Qué existe hoy:**
- App en Next.js 14 + Tailwind + shadcn/ui deployada en Vercel
- Auth con Supabase (login, registro, sesiones, RLS)
- Instagram Manager con CRUD real (crear, leer, editar, eliminar posts)
- 6 módulos en sidebar: CONTENT, ANALYTICS, CALENDAR, RECON, INTEL, AGENTS
- Estética militar: fondo #0D1008, texto gris #C8C8C8, acento verde #4A7C2F, tipografía Barlow Condensed
- URL: https://allver-social-dashboard.vercel.app
- Repo: https://github.com/portogomezdaniel-blip/allver-social-dashboard

**Qué falta para el demo de Mauro (mañana):**
- Dashboard principal tipo command center (inspirado en Shipyard) — NO el Instagram Manager vacío como landing
- 3 módulos nuevos: Contenido del Día, Banco de Hooks, Templates Rápidos
- Agentes de IA activos con Anthropic API (generación real, no mock)
- Scraping real de Instagram para competidores
- Personalización completa para Mauro (nombre, nicho, datos, voz)

---

## 1. REDISEÑO DEL HOME — COMMAND CENTER

### Problema actual
Mauro abre el panel y cae en Instagram Manager vacío. No hay impacto visual, no hay información útil de entrada.

### Solución: Dashboard tipo Command Center
Cuando Mauro abre el panel, la PRIMERA pantalla (ruta `/` o `/dashboard`) muestra un resumen ejecutivo de todo su mundo de contenido en un solo vistazo.

### Layout del Command Center (inspirado en Shipyard pero con estética militar FTP)

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER                                                              │
│ "Buenos días, Mauro"          [fecha]          [@mauro.strength]    │
│ "Tu sistema operativo de contenido"                                 │
├─────────────┬───────────────┬───────────────┬───────────────────────┤
│ STAT CARD   │ STAT CARD     │ STAT CARD     │ STAT CARD             │
│ Posts este  │ Engagement    │ Mejor post    │ Ideas en              │
│ mes: 12     │ promedio: 4.2%│ 3,127 likes   │ backlog: 8            │
├─────────────┴───────────────┴───────────────┴───────────────────────┤
│                                                                     │
│ ┌─── CONTENIDO DEL DÍA ──────────────────────────────────────────┐ │
│ │ HOY PUBLICA:                                                    │ │
│ │ Formato: Reel                                                   │ │
│ │ Tema: Técnica de deadlift — errores en la excéntrica            │ │
│ │ Hook: "Si te duele la espalda después de peso muerto, el        │ │
│ │        problema no es el ejercicio."                            │ │
│ │ Mejor hora: 6:30 PM (Medellín)                                 │ │
│ │ [Generar Copy Completo]  [Editar]  [Mover a Mañana]            │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─── CONTENT PIPELINE ──────────┐ ┌─── RECON: COMPETENCIA ──────┐ │
│ │ Borradores    ███░░  3        │ │ @andres.fuerza              │ │
│ │ Listos        █████  5        │ │ Último post: hace 2h        │ │
│ │ Programados   ███░░  3        │ │ Engagement: 4.8%            │ │
│ │ Publicados    ████████ 12     │ │ Top reel: 15K views         │ │
│ │                               │ │                             │ │
│ │ [Ver calendario completo →]   │ │ [Ver análisis completo →]   │ │
│ └───────────────────────────────┘ └─────────────────────────────┘ │
│                                                                     │
│ ┌─── BANCO DE HOOKS (top 5 del mes) ────────────────────────────┐ │
│ │ 1. "Si tu squat no baja de paralelo..." — 847 likes           │ │
│ │ 2. "RPE 8 significa que te quedan 2..." — 1,203 likes         │ │
│ │ 3. "El deadlift no se 'siente' en..." — 2,341 likes           │ │
│ │ [Ver todos →]  [Generar variaciones con IA →]                  │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─── PRÓXIMOS 7 DÍAS ───────────────────────────────────────────┐ │
│ │ Lun 24  │ Mar 25  │ Mié 26  │ Jue 27  │ Vie 28  │ Sáb │ Dom │ │
│ │ Reel    │ Carrus. │  —      │ Single  │ Reel    │  —  │  —  │ │
│ │ Técnica │ Program │         │ Filosof │ PR Atl. │     │     │ │
│ └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Componentes del Command Center

**Header personalizado:**
- Saludo dinámico por hora del día ("Buenos días/tardes/noches, Mauro")
- Fecha actual en español
- Handle de Instagram del creador
- Subtítulo: "Tu sistema operativo de contenido"

**Stats Row (4 cards):**
- Posts publicados este mes (cuenta de posts con status 'published' del mes actual)
- Engagement promedio (promedio de (likes + comments + saves) / reach de posts del mes)
- Mejor post del mes (el post con mayor engagement_score)
- Ideas en backlog (cuenta de posts con status 'draft' o ideas guardadas)

**Contenido del Día (módulo nuevo — detalle en sección 2):**
- La sugerencia diaria generada por IA
- Hook, formato, tema, hora óptima
- Botones de acción: generar copy completo, editar, posponer

**Content Pipeline:**
- Barras horizontales mostrando cuántos posts hay en cada estado
- Borradores, Listos para publicar, Programados, Publicados
- Lee directamente de tabla `posts` agrupando por status

**Recon de Competencia (resumen):**
- Card compacta con el competidor más activo
- Último post, engagement, top reel
- Link a vista completa de RECON

**Banco de Hooks (resumen — detalle en sección 3):**
- Top 5 frases de apertura por engagement
- Extraídas de los posts publicados del creador
- Botón para generar variaciones con IA

**Vista de 7 días:**
- Mini-calendario horizontal con los próximos 7 días
- Muestra formato y tema de cada día programado
- Días vacíos visibles (señal visual de "necesitas llenar esto")

---

## 2. MÓDULO: CONTENIDO DEL DÍA

### Ruta: Se muestra en el Command Center (/) y también en /content/today

### Lógica de generación
Cada día a las 6:00 AM (hora Medellín, UTC-5), un cron job o edge function:
1. Lee el `creator_identity.compiled_prompt` de Mauro
2. Lee los últimos 10 posts publicados (para no repetir temas)
3. Lee el calendario de la semana (para mantener variedad de formatos)
4. Llama a Anthropic API con este contexto y genera:
   - Tema del día
   - Formato recomendado (reel, carrusel, single)
   - Hook de apertura (primera frase)
   - Esquema de contenido (3-5 puntos clave)
   - Hora óptima de publicación
   - Hashtags sugeridos

### Prompt para el agente (system prompt base)
```
Eres el estratega de contenido de {creator_name}, un {niche} en {city}.

{compiled_prompt}

Tu tarea: generar la sugerencia de contenido para HOY.

Contexto:
- Últimos 10 posts: {últimos 10 captions resumidos}
- Calendario de la semana: {qué hay programado para los otros días}
- Día de la semana: {día actual}
- Posts con mejor engagement reciente: {top 3 por engagement}

Reglas:
1. No repetir un tema que se publicó en los últimos 7 días
2. Alternar formatos (si ayer fue reel, hoy carrusel o single)
3. El hook debe ser controversia controlada, pregunta directa, o dato técnico sorprendente
4. Incluir un CTA natural (no "link in bio" genérico)
5. El contenido debe sonar 100% como {creator_name}, no como un marketer

Responde en JSON exacto:
{
  "tema": "",
  "formato": "reel|carousel|single",
  "hook": "",
  "puntos_clave": ["", "", ""],
  "hora_optima": "HH:MM",
  "hashtags": ["", "", ""],
  "cta_sugerido": "",
  "razonamiento": ""
}
```

### Tabla Supabase: `daily_suggestions`
```sql
CREATE TABLE daily_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_date DATE NOT NULL,
  tema TEXT NOT NULL,
  formato TEXT NOT NULL,
  hook TEXT NOT NULL,
  puntos_clave JSONB NOT NULL,
  hora_optima TIME,
  hashtags TEXT[],
  cta_sugerido TEXT,
  razonamiento TEXT,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, modified
  generated_copy TEXT, -- se llena cuando el user pide "generar copy completo"
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, suggestion_date)
);
```

### Interacciones del usuario
- **Aceptar**: marca status = 'accepted', mueve a calendario
- **Rechazar**: marca status = 'rejected', genera nueva sugerencia (máximo 3 regeneraciones por día)
- **Editar**: abre editor inline, el user modifica lo que quiera
- **Generar Copy Completo**: llama a Anthropic API con el tema + hook + puntos clave y genera el caption listo para publicar. Se guarda en `generated_copy`.

---

## 3. MÓDULO: BANCO DE HOOKS

### Ruta: /hooks

### Qué es
Biblioteca de frases de apertura organizadas por rendimiento. Un hook es la primera oración de un post — lo que decide si alguien sigue leyendo o sigue scrolleando.

### Fuentes de hooks
1. **Extraídos**: de los posts publicados del creador (primera oración del caption)
2. **Generados por IA**: variaciones de hooks exitosos adaptadas a nuevos temas
3. **Guardados**: hooks que Mauro ve en la competencia y quiere adaptar

### Tabla Supabase: `hooks`
```sql
CREATE TABLE hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  source TEXT NOT NULL, -- 'extracted', 'ai_generated', 'saved', 'competitor'
  source_post_id UUID REFERENCES posts(id),
  category TEXT, -- 'controversy', 'question', 'data', 'story', 'challenge'
  engagement_score NUMERIC(10,2), -- del post original si existe
  times_used INT DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Vista del módulo
```
┌──────────────────────────────────────────────────────────────┐
│ BANCO DE HOOKS                        [+ Guardar Hook]       │
│ "Tus mejores frases de apertura"      [Generar Nuevos con IA]│
├──────────────────────────────────────────────────────────────┤
│ Filtros: [Todos] [Controversia] [Pregunta] [Dato] [Historia]│
├──────────────────────────────────────────────────────────────┤
│ ★ "Si tu squat no baja de paralelo, no es un squat."        │
│   Categoría: Controversia | Engagement: 847 | Usado: 1x     │
│   [Copiar] [Generar Variación] [Usar en Post]               │
├──────────────────────────────────────────────────────────────┤
│   "RPE 8 significa que te quedan 2 reps en el tanque."       │
│   Categoría: Dato técnico | Engagement: 1,203 | Usado: 1x   │
│   [Copiar] [Generar Variación] [Usar en Post]               │
├──────────────────────────────────────────────────────────────┤
```

### Funcionalidad "Generar Variaciones con IA"
Cuando Mauro selecciona un hook y pide variaciones:
1. Lee el hook original + su contexto (post completo)
2. Lee el `compiled_prompt` del creador
3. Genera 5 variaciones que mantienen la estructura pero cambian el tema/ángulo
4. Ejemplo: "Si tu squat no baja de paralelo..." → variaciones:
   - "Si tu deadlift empieza con la espalda redonda, no es un deadlift."
   - "Si necesitas straps para todo, tu grip es el problema."
   - "Si tu bench rebota en el pecho, esos kilos no cuentan."

### Prompt para generar variaciones
```
Eres el copywriter de {creator_name}.

{compiled_prompt}

Hook original que funcionó bien (engagement: {score}):
"{hook_text}"

Contexto del post original: {caption completo}

Genera 5 variaciones de este hook para DIFERENTES temas de {niche}.
Cada variación debe:
1. Mantener la misma estructura/patrón del hook original
2. Aplicarse a un tema diferente dentro del nicho
3. Sonar 100% como {creator_name}
4. Provocar la misma reacción (curiosidad/controversia/sorpresa)

Responde en JSON:
{
  "variations": [
    {"hook": "", "suggested_topic": "", "format": "reel|carousel|single"}
  ]
}
```

---

## 4. MÓDULO: TEMPLATES RÁPIDOS

### Ruta: /templates

### Qué es
Estructuras de copy precargadas para los formatos que mejor le funcionan a Mauro. No son posts completos — son esqueletos que él llena con su contenido del día.

### Templates iniciales para Mauro (strength_coach)

**Template 1: "Mito vs Realidad"**
```
Estructura:
- Hook: [Mito popular del fitness]
- "La realidad es que..." [corrección técnica]
- "Por qué importa:" [explicación en 2-3 líneas]
- "Qué hacer en su lugar:" [consejo accionable]
- CTA: [pregunta que invite a comentar]

Formato ideal: Carrusel (5 slides)
Frecuencia sugerida: 1x por semana
```

**Template 2: "Protocolo del Día"**
```
Estructura:
- Hook: [Ejercicio o técnica específica]
- "Protocolo:" [sets x reps, RPE, tempo]
- "Error más común:" [qué hacen mal]
- "Corrección:" [cómo hacerlo bien]
- CTA: "Guárdalo para tu próxima sesión"

Formato ideal: Single o Reel
Frecuencia sugerida: 2-3x por semana
```

**Template 3: "PR de mi Atleta"**
```
Estructura:
- Hook: [Número del PR + ejercicio]
- "Contexto:" [dónde empezó, hace cuánto]
- "El proceso:" [qué hicimos diferente]
- "Sistema M:" Medir → Mover → Mejorar
- CTA: "¿Cuál es tu meta para los próximos 3 meses?"

Formato ideal: Reel con video del PR
Frecuencia sugerida: 1-2x por mes
```

**Template 4: "Programa de la Semana"**
```
Estructura:
- Hook: [Para quién es este programa]
- Día por día: [ejercicio principal + accesorios]
- "Nota importante:" [deload, RPE, autoregulación]
- CTA: "¿Preguntas? Comenta abajo"

Formato ideal: Carrusel (6-7 slides)
Frecuencia sugerida: 1x por semana
```

**Template 5: "Educativo Corto"**
```
Estructura:
- Hook: [Pregunta o afirmación directa]
- "Explicación:" [concepto técnico en lenguaje accesible]
- "Ejemplo práctico:" [cómo se aplica en el gym]
- CTA: [invita a guardar o compartir]

Formato ideal: Single (texto largo)
Frecuencia sugerida: 2x por semana
```

### Tabla Supabase: `content_templates`
```sql
CREATE TABLE content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  structure JSONB NOT NULL, -- la estructura del template con placeholders
  format TEXT NOT NULL, -- 'reel', 'carousel', 'single', 'story'
  category TEXT, -- 'educational', 'social_proof', 'engagement', 'authority'
  suggested_frequency TEXT, -- '1x_week', '2x_week', '1x_month'
  times_used INT DEFAULT 0,
  avg_engagement NUMERIC(10,2), -- promedio de engagement de posts que usaron este template
  is_system BOOLEAN DEFAULT true, -- true = precargado, false = creado por el user
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Funcionalidad "Llenar Template con IA"
Cuando Mauro elige un template y un tema:
1. Lee la estructura del template
2. Lee el `compiled_prompt` del creador
3. Lee el tema/input que Mauro le da (ej: "hoy hicimos pausa bench")
4. Genera el post completo llenando cada sección del template
5. Mauro edita lo que quiera y publica

---

## 5. SCRAPING REAL DE COMPETIDORES

### Estrategia técnica

Instagram no tiene API pública para ver posts de terceros. Opciones viables:

**Opción A: Apify Instagram Scraper (RECOMENDADA para demo)**
- Servicio: apify.com/apify/instagram-profile-scraper
- Free tier: 5 USD de crédito al registrarte
- Lo que da: posts recientes, likes, comments, caption, fecha, tipo de contenido
- Integración: API REST → llamar desde una API route de Next.js o edge function
- Frecuencia: 1 scrape por competidor por día (para no quemar créditos)

**Opción B: RapidAPI Instagram Scrapers**
- Varios proveedores con free tier limitado
- Más simple de integrar (fetch directo)
- Menos confiable a largo plazo

**Opción C: Playwright headless (largo plazo)**
- Scraping directo con browser headless
- Corre en Hetzner VPS
- Más control, pero más frágil ante cambios de Instagram

### Para el demo de mañana: Opción A (Apify)

### Tabla Supabase: `competitor_posts`
```sql
CREATE TABLE competitor_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_post_id TEXT,
  post_url TEXT,
  caption TEXT,
  post_type TEXT, -- 'Image', 'Sidecar', 'Video'
  likes_count INT,
  comments_count INT,
  views_count INT, -- para reels
  posted_at TIMESTAMPTZ,
  thumbnail_url TEXT,
  hashtags TEXT[],
  engagement_rate NUMERIC(5,2),
  scraped_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabla actualizada: `competitors`
```sql
-- Agregar columnas a la tabla existente
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS
  last_scraped_at TIMESTAMPTZ,
  profile_pic_url TEXT,
  bio TEXT,
  posts_count INT,
  is_active BOOLEAN DEFAULT true;
```

### Vista del módulo RECON

```
┌────────────────────────────────────────────────────────────────────┐
│ RECON — INTELIGENCIA DE COMPETENCIA              [+ Agregar]       │
│ "Qué está haciendo tu competencia ahora"         [Actualizar]      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ ┌─ @andres.fuerza ──────────────────────────────────────────────┐ │
│ │ 15K followers │ Engagement: 4.8% │ Último post: hace 2h      │ │
│ │                                                                │ │
│ │ TOP 3 POSTS (últimos 30 días):                                │ │
│ │ 1. "5 errores en tu squat..." — Carrusel — 2,340 likes       │ │
│ │ 2. "PR de mi atleta: 200kg..." — Reel — 1,890 likes          │ │
│ │ 3. "Programa gratis para..."  — Single — 1,456 likes         │ │
│ │                                                                │ │
│ │ PATRONES DETECTADOS:                                           │ │
│ │ - Publica 4x/semana (Lun, Mié, Vie, Sáb)                     │ │
│ │ - Carruseles educativos le dan mejor engagement               │ │
│ │ - Hooks con números específicos funcionan mejor                │ │
│ │                                                                │ │
│ │ [Guardar hooks]  [Analizar con IA]  [Ver todos sus posts]     │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ ┌─ @powerhouse_med ─────────────────────────────────────────────┐ │
│ │ 28K followers │ Engagement: 3.2% │ Último post: hace 1d      │ │
│ │ ...                                                            │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### Funcionalidad "Analizar con IA"
Cuando Mauro pide análisis de un competidor:
1. Toma los últimos 20 posts del competidor
2. Llama a Anthropic API con este prompt:

```
Analiza los últimos 20 posts de este competidor de {niche}:

{lista de posts con caption, tipo, engagement}

Identifica:
1. Frecuencia de publicación (días y horas)
2. Formatos que mejor le funcionan (por engagement)
3. Temas recurrentes
4. Patrones en hooks (primera frase de cada post)
5. Qué tipo de CTAs usa
6. Gaps: qué NO está cubriendo que tú podrías cubrir

Responde en JSON estructurado.
```

---

## 6. AGENTES DE IA — INTEGRACIÓN CON ANTHROPIC API

### Arquitectura de agentes para el demo

Todos los agentes usan `claude-sonnet-4-20250514` via API directa desde Next.js API routes.

**Agente 1: Daily Content Strategist**
- Trigger: cron diario a las 6 AM o manual desde el dashboard
- Input: compiled_prompt + últimos 10 posts + calendario semanal
- Output: sugerencia del día (tabla `daily_suggestions`)
- Endpoint: `/api/agents/daily-content`

**Agente 2: Copy Writer**
- Trigger: usuario pide "Generar Copy Completo" desde cualquier módulo
- Input: compiled_prompt + tema + hook + formato + template (si aplica)
- Output: caption listo para publicar
- Endpoint: `/api/agents/write-copy`

**Agente 3: Hook Generator**
- Trigger: usuario pide "Generar Variaciones" en el banco de hooks
- Input: compiled_prompt + hook original + engagement data
- Output: 5 variaciones con tema sugerido
- Endpoint: `/api/agents/generate-hooks`

**Agente 4: Competitor Analyst**
- Trigger: usuario pide "Analizar con IA" en RECON
- Input: últimos 20 posts del competidor
- Output: análisis de patrones, gaps, oportunidades
- Endpoint: `/api/agents/analyze-competitor`

### Estructura de cada API route

```
/api/agents/
├── daily-content.ts    — POST → genera sugerencia diaria
├── write-copy.ts       — POST → genera caption completo
├── generate-hooks.ts   — POST → genera variaciones de hooks
├── analyze-competitor.ts — POST → analiza posts de competidor
└── _shared/
    ├── get-identity.ts — lee compiled_prompt de Supabase
    └── call-claude.ts  — wrapper para Anthropic API
```

### Wrapper compartido para Anthropic API

```typescript
// Pseudocódigo — la estructura que debe seguir cada agente

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function callClaude(systemPrompt: string, userMessage: string) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }]
  });
  return response.content[0].text;
}
```

### Variables de entorno requeridas (agregar a Vercel)
```
ANTHROPIC_API_KEY=sk-ant-...
APIFY_API_TOKEN=apify_api_...  (para scraping de competidores)
```

---

## 7. ESQUEMA COMPLETO DE SUPABASE

### Tablas existentes (verificar que estén actualizadas):
- `profiles` — perfil del usuario
- `posts` — posts del Instagram Manager
- `competitors` — competidores trackeados

### Tablas nuevas a crear:

```sql
-- 1. Creator Identity (Fase 2 - Onboarding)
CREATE TABLE creator_identity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
  current_step INT DEFAULT 1,
  niche TEXT,
  experience_years INT,
  city TEXT,
  gym_name TEXT,
  specialties TEXT[],
  philosophy JSONB DEFAULT '{}',
  voice_profile JSONB DEFAULT '{}',
  audience_profile JSONB DEFAULT '{}',
  content_goals TEXT[],
  prohibitions JSONB DEFAULT '{}',
  compiled_prompt TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Daily Suggestions (Contenido del Día)
CREATE TABLE daily_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_date DATE NOT NULL,
  tema TEXT NOT NULL,
  formato TEXT NOT NULL,
  hook TEXT NOT NULL,
  puntos_clave JSONB NOT NULL,
  hora_optima TIME,
  hashtags TEXT[],
  cta_sugerido TEXT,
  razonamiento TEXT,
  status TEXT DEFAULT 'pending',
  generated_copy TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, suggestion_date)
);

-- 3. Hooks (Banco de Hooks)
CREATE TABLE hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  source TEXT NOT NULL, -- extracted, ai_generated, saved, competitor
  source_post_id UUID REFERENCES posts(id),
  category TEXT,
  engagement_score NUMERIC(10,2),
  times_used INT DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Content Templates
CREATE TABLE content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  structure JSONB NOT NULL,
  format TEXT NOT NULL,
  category TEXT,
  suggested_frequency TEXT,
  times_used INT DEFAULT 0,
  avg_engagement NUMERIC(10,2),
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Competitor Posts (scraping)
CREATE TABLE competitor_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_post_id TEXT,
  post_url TEXT,
  caption TEXT,
  post_type TEXT,
  likes_count INT,
  comments_count INT,
  views_count INT,
  posted_at TIMESTAMPTZ,
  thumbnail_url TEXT,
  hashtags TEXT[],
  engagement_rate NUMERIC(5,2),
  scraped_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Agent Runs (log de ejecuciones de IA)
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  input_summary TEXT,
  output_data JSONB,
  tokens_used INT,
  duration_ms INT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para todas las tablas nuevas
ALTER TABLE creator_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

-- Policies: cada user solo ve lo suyo
CREATE POLICY "own_data" ON creator_identity FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON daily_suggestions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON hooks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON content_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON competitor_posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON agent_runs FOR ALL USING (auth.uid() = user_id);
```

---

## 8. SEED DATA DE MAURO

### Después de que Mauro tenga cuenta (o con un user_id de prueba), insertar:

**creator_identity** — onboarding completo con:
- niche: 'strength_coach'
- experience_years: 12
- city: 'Medellín'
- gym_name: 'Iron Cave Gym'
- specialties: ['Powerlifting', 'Fuerza máxima', 'Periodización ondulante']
- philosophy: principios de fuerza como base, técnica antes de carga, progreso medible
- voice_profile: directo, técnico pero accesible, tuteo, jerga de gym, nunca dice "guerrero/bestia mode/no pain no gain"
- audience_profile: 25-40 años, entrenan hace 1+ año, estancados, buscan estructura
- content_goals: ['more_clients', 'online_programs', 'authority', 'education']
- compiled_prompt: generar automáticamente con la función

**posts** — 6-8 posts de ejemplo que suenan como Mauro:
- Posts sobre técnica de squat, bench, deadlift
- Posts sobre RPE y autoregulación
- Posts sobre PRs de atletas
- Posts con programa semanal
- Variedad de formatos: reel, carrusel, single
- Con métricas realistas (500-3000 likes, engagement variable)

**competitors** — 3 competidores:
- @andres.fuerza (strength coach, 15K followers, alto engagement)
- @powerhouse_med (gym grande, 28K followers, engagement bajo)
- @elite.performance.co (functional, 45K followers, contenido genérico)

**hooks** — extraídos de los posts seed:
- "Si tu squat no baja de paralelo, no es un squat."
- "RPE 8 significa que te quedan 2 reps en el tanque."
- "El deadlift no se 'siente' en la espalda baja si lo haces bien."
- "180kg squat PR para mi atleta"
- Todos con categoría y engagement_score

**content_templates** — los 5 templates descritos arriba, pre-cargados como is_system: true

**daily_suggestions** — 1 sugerencia para hoy, pre-generada, status 'pending'

---

## 9. SIDEBAR ACTUALIZADO

### Navegación actual → nueva
```
ANTES:                    DESPUÉS:
CONTENT          →        HOME (Command Center)
ANALYTICS        →        CONTENT (Instagram Manager)
CALENDAR         →        CALENDAR (conectado a posts reales)
RECON            →        RECON (con scraping real + análisis IA)
INTEL            →        HOOKS (Banco de Hooks)
AGENTS           →        TEMPLATES (Templates Rápidos)
                          AGENTS (log de ejecuciones de IA)
```

### Lógica de navegación
- `/` o `/dashboard` → Command Center (HOME)
- `/content` → Instagram Manager (el que ya existe)
- `/calendar` → Calendario editorial (conectar a tabla posts)
- `/recon` → Competidores con scraping
- `/hooks` → Banco de hooks
- `/templates` → Templates rápidos
- `/agents` → Panel de control de agentes (log de runs)

---

## 10. PERSONALIZACIÓN WHITE-LABEL PARA MAURO

### Qué se personaliza por creador (leído de `profiles` + `creator_identity`):
- Nombre en el header ("Buenos días, Mauro")
- Niche que determina los templates precargados
- Color de acento (campo `accent_color` en profiles, default #4A7C2F)
- Los templates de contenido específicos de su nicho
- Los prompts de IA incluyen su compiled_prompt
- Los competidores son los suyos, no genéricos

### Qué es white-label (igual para todos):
- La estructura del dashboard
- Los módulos disponibles
- La estética militar base
- La lógica de agentes
- El sistema de auth y RLS

---

## 11. PRIORIDAD DE CONSTRUCCIÓN PARA MAÑANA

### Orden de ejecución en Claude Code:

1. **SQL en Supabase** — crear todas las tablas nuevas + RLS (15 min)
2. **Seed data de Mauro** — insertar identity, posts, competitors, hooks, templates (10 min)
3. **Command Center** — nueva ruta `/dashboard` como home page (45 min)
4. **Contenido del Día** — componente en el Command Center + API route (30 min)
5. **API routes de agentes** — daily-content + write-copy + generate-hooks (30 min)
6. **Banco de Hooks** — nueva ruta `/hooks` con vista completa (30 min)
7. **Templates** — nueva ruta `/templates` con los 5 templates precargados (20 min)
8. **RECON con scraping** — integrar Apify + vista de competitor posts (45 min)
9. **Sidebar actualizado** — reorganizar navegación (10 min)
10. **Testing y ajustes** — verificar que todo fluye, que la data se ve bien (30 min)

**Tiempo estimado total: ~4.5 horas de construcción enfocada en Claude Code.**

---

## 12. ESTÉTICA — REFERENCIA VISUAL

### Base: estética militar actual del FTP
- Fondo: #0D1008
- Texto principal: #C8C8C8
- Acento: #4A7C2F (verde militar)
- Tipografía: Barlow Condensed para headers, sans-serif para body
- Sin bordes redondeados
- Bordes sutiles 1px para separar secciones

### Inspiración del dashboard de Shipyard (imagen de referencia):
- Header con saludo + métricas rápidas en row
- Content Pipeline como barras de progreso (no números solos)
- Competitor Intel como card compacta en el home
- Calendario horizontal de 7 días como preview
- Layout de 2 columnas para pipeline + recon side by side
- Todo denso pero legible — la información habla

### Lo que NO copiar del Shipyard:
- Los colores claros/salmon (mantener verde militar)
- La tipografía genérica (mantener Barlow Condensed)
- Los iconos redondos (mantener estética angular)

---

## FIN DEL BLUEPRINT

Este documento contiene todo lo que Claude Code necesita para construir el panel completo de Mauro. Cada decisión está tomada. Cada tabla está definida. Cada módulo tiene su especificación. Solo falta ejecutar.
