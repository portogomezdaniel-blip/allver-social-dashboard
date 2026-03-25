# CLAUDE.md — Allver Creator System

> Este archivo es la memoria permanente del proyecto. Léelo completo antes de tocar cualquier
> archivo. Contiene la visión de negocio, la arquitectura técnica, los tipos de usuario, las
> decisiones de diseño, y el roadmap por fases. Cada decisión técnica debe estar alineada con
> lo que está escrito aquí.

---

## Visión del Producto

**Allver Creator System** es un sistema operativo completo para creadores de contenido —
específicamente entrenadores, coaches, y expertos con autoridad presencial que quieren
construir presencia digital sin perder su voz ni su tiempo.

No es una herramienta de generación de contenido genérica. Es un sistema que primero
**aprende quién es el creador**, luego **analiza qué le está funcionando**, y solo entonces
**genera estrategia y contenido adaptado a su identidad real**.

La propuesta de valor en una línea:
> "Convertimos tu autoridad en el gimnasio en presencia digital que genera clientes mientras
> entrenas."

---

## El Problema que Resuelve

Los entrenadores de renombre en LATAM (específicamente el mercado inicial: Medellín,
Colombia) tienen autoridad real — clientela fiel, reputación construida, resultados
probados. Pero esa autoridad no traspasa las paredes del gimnasio porque no tienen
presencia digital consistente. No por falta de ganas, sino porque:

- No saben qué publicar cada día
- Lo que generan no suena como ellos, suena genérico
- No tienen tiempo de sentarse a crear contenido
- No entienden qué les está funcionando y qué no

El sistema resuelve los tres problemas simultáneamente: aprende su voz, analiza su
performance, y genera el plan. El creador solo aprueba o rechaza.

---

## Arquitectura del Producto por Fases

### Fase 1 — Base (COMPLETADA)
Panel con autenticación real (Supabase Auth), Instagram Manager con CRUD real en base de
datos, y las siguientes secciones con frontend completo en espera de backend:

- `/instagram` — Instagram Manager (CRUD real en Supabase ✅)
- `/analytics` — Analytics de performance (mock, pendiente Meta API)
- `/calendar` — Calendario editorial (mock, pendiente conexión posts)
- `/competitors` — Tracker de competidores (mock, pendiente tabla Supabase)
- `/news` — Consolidador de noticias (mock, pendiente RSS real)
- `/agents` — Panel de control de agentes (mock, pendiente conexión hub)

### Fase 2 — Identidad del Creador (SIGUIENTE)
El onboarding inteligente. Cuando un creador entra por primera vez, el sistema lo guía
a través de un proceso de una semana de autoconocimiento estructurado. No es un formulario
— es una conversación guiada con prompts específicos que el creador responde a su ritmo.
Al final, el sistema construye un **Perfil de Identidad** que contiene:

- Voz y tono (cómo habla, qué palabras usa, qué nunca diría)
- Filosofía de entrenamiento (sus principios, su método)
- Historia y credenciales (de dónde viene, por qué lo hace)
- Audiencia objetivo (a quién le habla, qué buscan)
- Metas de contenido (qué quiere lograr con su presencia digital)
- Prohibiciones (qué nunca publicaría, qué va en contra de su marca)

Este perfil se guarda en Supabase y es la base de todo lo que el sistema genera después.
Ningún agente genera nada sin leer este perfil primero.

### Fase 3 — Análisis e Inteligencia (REQUIERE META API)
Conexión con la Instagram Graph API para leer datos reales del creador:

- Posts publicados y su performance (likes, comments, saves, reach, impressions)
- Horarios con mejor engagement
- Formatos que mejor funcionan (reels vs carruseles vs singles)
- Temas que generan más interacción
- Crecimiento de seguidores en el tiempo

Con esos datos el sistema genera un **Diagnóstico de Contenido** mensual: qué está
funcionando, qué hay que cambiar, y por qué. Este diagnóstico alimenta directamente
el Calendario Editorial.

**Nota técnica**: La conexión con Meta requiere una Facebook App aprobada con permisos
`instagram_basic`, `instagram_manage_insights`, y `pages_read_engagement`. El proceso
de aprobación puede tomar días. Implementar primero con datos mock del mismo formato
para que la UI esté lista cuando llegue la aprobación.

### Fase 4 — Generación de Contenido (AGENTES IA)
Una vez que el sistema conoce al creador (Fase 2) y sabe qué le funciona (Fase 3),
entra la generación inteligente:

- **Calendario Editorial Automático**: 30 días de contenido planificado basado en el
  perfil del creador y su historial de performance. El creador lo revisa y ajusta.
- **Generación de Posts**: Para cada item del calendario, el agente Writer genera el
  copy en la voz del creador. El Humanizer elimina patrones de IA. El Designer genera
  las piezas visuales.
- **Aprobación en el Dashboard**: El creador ve el preview completo, aprueba o rechaza,
  y el sistema guarda el historial de decisiones para aprender.

Esta fase se conecta con el hub de agentes existente en el VPS (Instagram Agent System
ya construido). El Agent Control Panel del dashboard es la interfaz de control de ese hub.

### Fase 5 — Recursos y Verticales de Negocio
El dashboard evoluciona a una plataforma completa con módulos adicionales:

- **Landing Page Generator**: El creador describe su programa o servicio, el sistema
  genera una landing page lista para deployar en su dominio.
- **Meta Ads Optimizer**: Análisis de campañas activas con recomendaciones de mejora
  basadas en los datos de performance orgánico.
- **Email Sequences**: El creador sube sus PDFs de contenido y el sistema genera
  secuencias de correos en su tono para nutrir su lista.
- **Verticales**: Módulos especializados para marcas de suplementos, ropa, y otros
  productos físicos que el creador quiera lanzar.

---

## Tipos de Usuario y Roles

### Creator (usuario principal)
El entrenador, coach, o experto. Tiene acceso a su panel personalizado con su identidad,
su contenido, y sus métricas. No ve datos de otros creadores.

**Sub-tipos de Creator por nicho** (afecta el onboarding y las sugerencias de contenido):
- `strength_coach` — entrenamiento de fuerza, powerlifting, musculación
- `functional_coach` — crossfit, funcional, movilidad
- `wellness_coach` — yoga, meditación, bienestar holístico
- `nutrition_coach` — nutrición deportiva, dietas, hábitos alimenticios
- `running_coach` — running, triatlón, resistencia
- `general_fitness` — entrenamiento general, pérdida de peso

### Admin (operador del sistema)
Allver o quien opere la plataforma. Puede ver todos los creadores, sus métricas de uso,
y gestionar el sistema. Tiene acceso a un panel de administración separado.

### Guest (demo)
Acceso de solo lectura a un panel de demo con datos precargados. Se usa para mostrar
el producto a prospectos sin que creen cuenta.

---

## Stack Técnico

**Frontend**: Next.js 14+ con App Router, Tailwind CSS, shadcn/ui. Dark theme global con
acento en violeta/purple. Tipografía: display font bold para headers, sans-serif limpio
para body.

**Autenticación y Base de Datos**: Supabase. Auth con email/password. Row Level Security
(RLS) habilitado en todas las tablas para que cada usuario solo vea sus datos.

**Tablas principales en Supabase**:
- `profiles` — perfil extendido del usuario (tipo de creador, bio, configuración)
- `creator_identity` — respuestas del onboarding, perfil de identidad construido
- `posts` — posts del Instagram Manager (id, user_id, caption, type, status, scheduled_date)
- `competitors` — competidores trackeados por usuario
- `content_calendar` — items del calendario editorial generados
- `agent_runs` — historial de ejecuciones de agentes con outputs y decisiones

**Agentes IA**: Anthropic API con claude-sonnet-4-20250514. Los agentes viven en el
Instagram Agent System (proyecto separado en ~/Desktop/instagram-agent-system). El
Agent Control Panel de este dashboard se conecta a ese sistema via webhooks de n8n.

**Deploy**: Vercel para el frontend. Hetzner VPS para el hub de agentes (n8n + Python
scripts). Vercel se conecta automáticamente con GitHub — cada push a main hace deploy.

**Variables de entorno requeridas**:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
META_APP_ID=
META_APP_SECRET=
ANTHROPIC_API_KEY=
N8N_WEBHOOK_BASE_URL=
```

---

## Decisiones de Diseño

**Por qué dark theme**: El usuario target son creadores que viven en Instagram, TikTok,
y WhatsApp. Un dark theme premium con acentos en violeta comunica "herramienta profesional
de nivel agencia", no "app de startup genérica". Genera confianza en un mercado donde la
mayoría de herramientas similares se ven igual.

**Por qué un módulo por vez**: El onboarding guiado (Fase 2) existe porque los creadores
no son marketers. Si les das 20 opciones al mismo tiempo, los paralizas. El sistema los
lleva de la mano: primero te conozco, luego te analizo, luego te genero. Esa secuencia
reduce la fricción de adopción.

**Por qué shadcn/ui**: Consistencia visual garantizada sin tener que diseñar cada
componente desde cero. Los componentes de shadcn son sobrios y profesionales — funcionan
bien en dark theme y se personalizan fácil con Tailwind.

**Por qué Supabase y no Firebase**: RLS nativo hace que la seguridad por usuario sea
declarativa, no imperativa. No tienes que escribir lógica de autorización en cada query —
la base de datos la aplica automáticamente. Eso es crítico cuando tienes múltiples
creadores con datos sensibles de negocio.

---

## Lo que NUNCA debe hacer este sistema

- Publicar contenido sin aprobación explícita del creador. Siempre hay un paso de revisión
  humana antes de que algo salga al mundo.
- Generar contenido que no esté basado en el perfil de identidad del creador. Sin perfil,
  no hay generación.
- Mezclar datos de un creador con otro. RLS garantiza esto a nivel de base de datos, pero
  también debe garantizarse a nivel de lógica de aplicación.
- Conectarse a cuentas de Instagram sin consentimiento explícito y documentado del creador.
- Guardar tokens de acceso de Meta en texto plano. Siempre encriptados en Supabase con
  `pgsodium` o variables de entorno del servidor.

---

## Estado Actual del Proyecto

**URL de producción**: https://allver-social-dashboard.vercel.app  
**Repositorio**: https://github.com/portogomezdaniel-blip/allver-social-dashboard  
**Base de datos**: Supabase (proyecto allver-dashboard)

**Completado**:
- Auth completo con Supabase (login, registro, sesiones)
- Instagram Manager con CRUD real en base de datos
- Frontend completo de los 6+ módulos (analytics, calendar, competitors, news, agents, hooks, ideas, journal, templates)
- Deploy en Vercel con auto-deploy desde GitHub
- i18n completo (ES/EN toggle)
- Journal con preguntas diarias rotativas (21 preguntas, 3/día) + briefing de contenido IA
- Content Calendar conectado a tabla `posts` de Supabase (lee posts reales)
- Pipeline diario automatizado: 1 cron consolidado (5:30 AM Colombia) genera noticias + contenido
- Pipeline semanal (lunes): hooks, recon competidores, analytics, identity evolution
- Todos los botones "Crear post" insertan en posts con scheduled_date (aparecen en calendario)
- Dashboard Command Center con stats, intel, journal preview, idea bar, mini calendario

**Siguiente tarea prioritaria**:
Personalizar el dashboard para dos creadores específicos (Mauro y otro entrenador de
Medellín) con sus datos de ejemplo, su nicho, y posts representativos de su estilo.
El objetivo es que en el demo se vean reflejados en los primeros 30 segundos.

**Nota técnica sobre crons**:
Vercel Hobby tier permite máximo 2 crons. Todo está consolidado en `/api/crons/daily-all`
(schedule: 30 10 * * * = 5:30 AM Colombia). Ejecuta daily news + content diario, y
hooks + recon + analytics + identity los lunes.

---

## Contexto de Allver

Este proyecto es parte del ecosistema **Allver** — marca personal y constructora de
sistemas de un solo fundador que construye herramientas de IA para creadores y negocios
en LATAM.

Los proyectos activos dentro de este ecosistema son el **Allver Creator System** (este
proyecto) y el **Amethyst Protocol**, además de nuevos proyectos en construcción. No
mezclar este ecosistema con otros proyectos externos o marcas de terceros.

Todos los proyectos comparten el mismo hub de agentes en Hetzner (n8n + Claude API) y
el mismo stack base (Supabase, Vercel, Anthropic). Las decisiones técnicas de este
proyecto deben ser consistentes con el ecosistema completo de Allver.
