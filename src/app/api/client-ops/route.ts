import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, client_id, trainer_notes } = body;

    if (!action || !client_id) {
      return NextResponse.json(
        { error: 'action y client_id son requeridos' },
        { status: 400 }
      );
    }

    // 1. Traer system prompt del agente
    const { data: promptData, error: promptError } = await supabase
      .from('agent_prompts')
      .select('system_prompt')
      .eq('agent_name', 'mauro-client-ops')
      .eq('is_active', true)
      .single();

    if (promptError || !promptData) {
      return NextResponse.json(
        { error: 'System prompt no encontrado' },
        { status: 500 }
      );
    }

    // 2. Traer datos del cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // 3. Traer datos adicionales según la acción
    let additionalContext = '';

    if (action === 'generate_checkin') {
      const { data: recentCheckins } = await supabase
        .from('client_checkins')
        .select('*')
        .eq('client_id', client_id)
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: currentProgram } = await supabase
        .from('client_programs')
        .select('*')
        .eq('client_id', client_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      additionalContext = `
ÚLTIMOS CHECK-INS: ${JSON.stringify(recentCheckins || [])}
PROGRAMA ACTUAL: ${JSON.stringify(currentProgram?.[0] || 'Sin programa activo')}
      `;
    }

    if (action === 'check_alerts') {
      const { data: activeAlerts } = await supabase
        .from('client_alerts')
        .select('*')
        .eq('client_id', client_id)
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      const { data: recentCheckins } = await supabase
        .from('client_checkins')
        .select('*')
        .eq('client_id', client_id)
        .order('created_at', { ascending: false })
        .limit(4);

      additionalContext = `
ALERTAS ACTIVAS: ${JSON.stringify(activeAlerts || [])}
ÚLTIMOS CHECK-INS: ${JSON.stringify(recentCheckins || [])}
ÚLTIMO WORKOUT: ${client.last_workout_at || 'Sin registro'}
DÍAS SIN ENTRENAR: ${client.last_workout_at ? Math.floor((Date.now() - new Date(client.last_workout_at).getTime()) / 86400000) : 'N/A'}
      `;
    }

    if (action === 'generate_onboarding') {
      let leadData = null;
      if (client.setter_lead_id) {
        const { data: lead } = await supabase
          .from('setter_leads')
          .select('*')
          .eq('id', client.setter_lead_id)
          .single();
        leadData = lead;
      }

      additionalContext = `
DATOS DEL LEAD ORIGINAL: ${JSON.stringify(leadData || 'Sin lead asociado')}
      `;
    }

    // 4. Construir el prompt del usuario
    const userPrompt = `
ACCIÓN: ${action}
DATOS DEL CLIENTE: ${JSON.stringify(client)}
${additionalContext}
${trainer_notes ? `NOTAS DEL ENTRENADOR: ${trainer_notes}` : ''}

Ejecuta la acción "${action}" para este cliente y responde en el formato JSON especificado.
    `;

    // 5. Llamar a Claude con retry para 529
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [2000, 4000, 8000];
    let message;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: promptData.system_prompt,
          messages: [{ role: 'user', content: userPrompt }],
        });
        break;
      } catch (err: unknown) {
        const isOverloaded =
          err instanceof Error &&
          (err.message.includes('529') || err.message.includes('overloaded'));
        if (isOverloaded && attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
          continue;
        }
        throw err;
      }
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Servidor ocupado, reintentando... No se pudo completar después de varios intentos.' },
        { status: 529 }
      );
    }

    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // 6. Parsear respuesta JSON
    let parsedResponse;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsedResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: responseText };
    } catch {
      parsedResponse = { raw: responseText };
    }

    // 7. Guardar según la acción
    if (action === 'generate_onboarding' && parsedResponse.for_client) {
      await supabase.from('client_onboarding').insert({
        client_id,
        welcome_message: parsedResponse.for_client.message,
        day1_checklist: parsedResponse.data?.checklist || null,
        initial_assessment: parsedResponse.data?.assessment || null,
        status: 'pending_review',
      });

      await supabase
        .from('clients')
        .update({ status: 'onboarding_pending' })
        .eq('id', client_id);
    }

    if (action === 'generate_checkin' && parsedResponse.for_client) {
      await supabase.from('client_checkins').insert({
        client_id,
        week_number: client.current_week,
        adherence_pct: parsedResponse.data?.adherence_pct || null,
        rpe_average: parsedResponse.data?.rpe_average || null,
        risk_level: parsedResponse.risk_level || 'green',
        message_to_client: parsedResponse.for_client.message,
        summary_for_mauro: parsedResponse.for_mauro?.summary || null,
      });

      if (parsedResponse.risk_level) {
        await supabase
          .from('clients')
          .update({
            risk_level: parsedResponse.risk_level,
            last_checkin_at: new Date().toISOString(),
          })
          .eq('id', client_id);
      }
    }

    if (action === 'check_alerts') {
      const alerts = parsedResponse.data?.alerts || [];
      for (const alert of alerts) {
        await supabase.from('client_alerts').insert({
          client_id,
          alert_type: alert.type,
          severity: alert.severity,
          message: alert.message,
        });
      }
    }

    // 8. Registrar interacción
    await supabase.from('client_interactions').insert({
      client_id,
      interaction_type: action,
      title: `${action} ejecutado`,
      content: parsedResponse.for_mauro?.summary || responseText.substring(0, 500),
      metadata: {
        risk_level: parsedResponse.risk_level,
        priority: parsedResponse.for_mauro?.priority,
      },
      actor: 'system',
    });

    // 9. Responder
    return NextResponse.json({
      success: true,
      ...parsedResponse,
    });
  } catch (error: unknown) {
    console.error('Client Ops error:', error);
    const isOverloaded =
      error instanceof Error &&
      (error.message.includes('529') || error.message.includes('overloaded'));
    if (isOverloaded) {
      return NextResponse.json(
        { error: 'Servidor ocupado, reintentando... No se pudo completar después de varios intentos.' },
        { status: 529 }
      );
    }
    return NextResponse.json(
      { error: 'Error interno del agente', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
