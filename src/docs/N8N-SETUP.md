# Configurar workflows de n8n para FTP by LLVR

## Variables de entorno en n8n
- SUPABASE_URL: https://ledkfowjyikhqvyvtsoq.supabase.co
- SUPABASE_SERVICE_ROLE_KEY: [tu key]
- FTP_API_URL: https://allver-social-dashboard.vercel.app
- CRON_SECRET: ftp-llvr-cron-2026

## Workflows a crear

### 1. Daily News (diario, 5:30 AM Colombia / 10:30 UTC)
- Cron Trigger (5:30 AM)
- HTTP Request GET: {SUPABASE_URL}/rest/v1/creator_identity?onboarding_status=eq.completed&select=user_id
  - Headers: apikey={SUPABASE_SERVICE_ROLE_KEY}, Authorization=Bearer {SUPABASE_SERVICE_ROLE_KEY}
- Split In Batches (1)
- HTTP Request GET: {SUPABASE_URL}/rest/v1/daily_news?user_id=eq.{user_id}&news_date=eq.{today}&select=id
- IF: length === 0
- HTTP Request POST: {FTP_API_URL}/api/agents/daily-news
  - Body: { "userId": "{user_id}" }
  - Headers: x-cron-secret={CRON_SECRET}, Content-Type=application/json
  - Timeout: 60000ms
- Wait 5s
- Loop back to Split In Batches

### 2. Weekly Hooks (lunes, 6:00 AM Colombia / 11:00 UTC)
- Cron Trigger (lunes 6:00 AM)
- HTTP Request GET: {FTP_API_URL}/api/crons/weekly-hooks
  - Headers: authorization=Bearer {CRON_SECRET}

### 3. Weekly Templates (lunes, 7:00 AM Colombia / 12:00 UTC)
- Cron Trigger (lunes 7:00 AM)
- HTTP Request GET: {FTP_API_URL}/api/crons/weekly-templates
  - Headers: authorization=Bearer {CRON_SECRET}

### 4. Weekly Recon (lunes, 5:00 AM Colombia / 10:00 UTC)
- Cron Trigger (lunes 5:00 AM)
- HTTP Request GET: {FTP_API_URL}/api/crons/weekly-recon
  - Headers: authorization=Bearer {CRON_SECRET}

## Headers requeridos en cada HTTP Request a la API
```
x-cron-secret: ftp-llvr-cron-2026
Content-Type: application/json
```

## Notas
- Los crons de Vercel (vercel.json) sirven como fallback si n8n esta caido
- Cada workflow debe tener error handling con notification (email o Slack)
- El Wait de 5s entre usuarios evita saturar la Anthropic API
