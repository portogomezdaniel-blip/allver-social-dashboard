# CLAUDE.md — FTP by LLVR

> Memoria permanente del proyecto. Lee completo antes de tocar código.

---

## Visión

**FTP by LLVR** = sistema operativo para creadores de contenido fitness.
Aprende quién es el creador → analiza qué le funciona → genera contenido en su voz.

Propuesta: "Convertimos tu autoridad en el gimnasio en presencia digital que genera clientes mientras entrenas."

Mercado: entrenadores de fuerza en Medellín. Primer cliente: Mauro.

---

## Stack

- **Frontend**: Next.js 14, App Router, Tailwind CSS, shadcn/ui
- **Auth + DB**: Supabase (email/password, RLS en todas las tablas)
- **IA**: Anthropic API (claude-sonnet-4-20250514)
- **Scraping**: Apify Instagram Scraper
- **Deploy**: Vercel (auto-deploy desde GitHub)
- **Agentes**: API routes en `/api/agents/`

## URLs

- Producción: https://allver-social-dashboard.vercel.app
- Repo: https://github.com/portogomezdaniel-blip/allver-social-dashboard
- DB: Supabase proyecto allver-dashboard

---

## Variables de Entorno

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
APIFY_API_TOKEN=
```

---

## Estética

- Fondo: #0D1008
- Texto: #C8C8C8
- Acento: #4A7C2F (verde militar)
- Headers: Barlow Condensed, bold, uppercase
- Body: sans-serif limpio
- Bordes: 0px radius. SIEMPRE angular.
- Bordes sutiles 1px para separar secciones
- Dark theme obligatorio

---

## Rutas de la App

```
/dashboard      → Command Center (HOME) — resumen ejecutivo
/content        → Instagram Manager (CRUD de posts)
/calendar       → Calendario editorial (conectado a posts)
/recon          → Competidores (scraping real + análisis IA)
/hooks          → Banco de Hooks (frases ganadoras)
/templates      → Templates Rápidos (estructuras de copy)
/agents         → Panel de Agentes (log de ejecuciones)
/login          → Login
/register       → Registro
```

---

## Tablas en Supabase

### profiles
Perfil del usuario. Campos: display_name, role, bio, city, gym_name, instagram_handle, niche, accent_color.

### creator_identity
Corazón del sistema. Contiene el perfil completo del creador: filosofía, voz, audiencia, metas, prohibiciones. Campo crítico: `compiled_prompt` — el system prompt que leen TODOS los agentes. Sin este campo lleno, ningún agente genera nada.

### posts
Posts del Instagram Manager. Campos: caption, type (reel/carousel/single/story), status (draft/scheduled/published/archived), hashtags, scheduled_date, métricas de engagement.

### daily_suggestions
Sugerencia diaria generada por IA. Una por día por usuario. Campos: tema, formato, hook, puntos_clave, hora_optima, hashtags, status (pending/accepted/rejected).

### hooks
Banco de hooks. Campos: text, source (extracted/ai_generated/saved/competitor), category (controversy/question/data/story/challenge), engagement_score, is_favorite.

### content_templates
Templates de copy. Campos: name, structure (JSONB con placeholders), format, category, suggested_frequency, times_used, is_system.

### competitors
Competidores trackeados. Campos: name, instagram_handle, follower_count, avg_engagement, last_scraped_at.

### competitor_posts
Posts scrapeados de competidores. Campos: caption, post_type, likes_count, comments_count, views_count, posted_at, engagement_rate.

### agent_runs
Log de ejecuciones de IA. Campos: agent_name, input_summary, output_data, tokens_used, duration_ms, status.

**RLS**: Todas las tablas tienen RLS habilitado. Cada user solo ve sus datos. Policy: `auth.uid() = user_id`.

---

## Agentes de IA

Todos en `/api/agents/`. Todos usan claude-sonnet-4-20250514.

### /api/agents/daily-content (POST)
- Genera la sugerencia diaria
- Lee compiled_prompt + últimos 10 posts + calendario semanal
- Output: JSON con tema, formato, hook, puntos_clave, hora_optima, hashtags
- Guarda en daily_suggestions

### /api/agents/write-copy (POST)
- Genera caption completo a partir de tema + hook + template
- Lee compiled_prompt
- Output: texto del caption listo para publicar

### /api/agents/generate-hooks (POST)
- Genera 5 variaciones de un hook exitoso
- Lee compiled_prompt + hook original + engagement data
- Output: JSON con array de variaciones

### /api/agents/analyze-competitor (POST)
- Analiza los últimos 20 posts de un competidor
- Output: patrones, frecuencia, formatos ganadores, gaps

### Shared utils en /api/agents/_shared/
- `get-identity.ts` → lee compiled_prompt de Supabase
- `call-claude.ts` → wrapper para Anthropic API

**REGLA ABSOLUTA**: Ningún agente genera nada si el user no tiene `creator_identity.onboarding_status = 'completed'` y `compiled_prompt` no es null.

---

## Scraping de Competidores

Usa Apify Instagram Profile Scraper.
- API Token en env: APIFY_API_TOKEN
- Endpoint: POST a Apify Actor API
- Frecuencia: 1 scrape por competidor por día
- Data se guarda en competitor_posts
- El análisis con IA es on-demand (cuando el user pide)

---

## Command Center (Dashboard Home)

Layout:
1. Header con saludo + fecha + handle
2. Stats row: posts del mes, engagement promedio, mejor post, ideas en backlog
3. Contenido del Día: sugerencia con hook, formato, tema, hora
4. Content Pipeline: barras por status de posts
5. Recon preview: competidor más activo
6. Banco de Hooks preview: top 5 por engagement
7. Vista de 7 días: mini calendario horizontal

---

## Personalización White-Label

Lo que cambia por creador (leído de profiles + creator_identity):
- Nombre en header
- Niche → determina templates precargados
- accent_color → color de acento del dashboard
- compiled_prompt → personaliza toda la generación de IA

Lo que es igual para todos:
- Estructura del dashboard, módulos, auth, estética base, lógica de agentes

---

## Lo que NUNCA hace este sistema

- Publicar sin aprobación del creador
- Generar contenido sin compiled_prompt
- Mezclar datos entre creadores (RLS lo garantiza)
- Conectar Instagram sin consentimiento
- Guardar tokens en texto plano

---

## Contexto Allver

Parte del ecosistema Allver. Proyectos hermanos: Amethyst Protocol. Stack compartido: Supabase, Vercel, Anthropic. Hub de agentes en Hetzner (n8n + Python) — futuro.
