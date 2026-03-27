import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'action es requerido' }, { status: 400 });
    }

    switch (action) {
      case 'get_dashboard':
        return await getDashboard();
      case 'get_payments':
        return await getPayments();
      case 'get_pnl':
        return await getPnl();
      case 'get_capacity':
        return await getCapacity();
      default:
        return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Admin Bot error:', error);
    return NextResponse.json(
      { error: 'Error interno', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// ============================================================
// GET DASHBOARD
// ============================================================
async function getDashboard() {
  const { data: clients, count: activeClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .in('status', ['active', 'onboarding', 'onboarding_pending']);

  const { data: capacity } = await supabase
    .from('setter_capacity')
    .select('*')
    .single();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthPayments } = await supabase
    .from('admin_payments')
    .select('amount')
    .gte('created_at', startOfMonth.toISOString())
    .eq('status', 'paid');

  const monthRevenue = (monthPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);

  const in14Days = new Date();
  in14Days.setDate(in14Days.getDate() + 14);

  const { data: expiring } = await supabase
    .from('admin_payments')
    .select('client_name, program_end')
    .lte('program_end', in14Days.toISOString().split('T')[0])
    .gte('program_end', new Date().toISOString().split('T')[0])
    .eq('status', 'paid');

  const { data: alerts, count: alertCount } = await supabase
    .from('client_alerts')
    .select('*', { count: 'exact' })
    .eq('resolved', false);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const { data: weekSessions } = await supabase
    .from('admin_calendar')
    .select('*')
    .gte('date', startOfWeek.toISOString().split('T')[0])
    .lte('date', endOfWeek.toISOString().split('T')[0]);

  return NextResponse.json({
    success: true,
    action_completed: 'get_dashboard',
    report: {
      title: 'Dashboard — Resumen del negocio',
      summary: `${activeClients || 0}/${capacity?.max_clients || 5} clientes activos. $${monthRevenue} USD este mes. ${alertCount || 0} alertas activas.`,
      data: {
        clients: {
          active: activeClients || 0,
          max: capacity?.max_clients || 5,
          slots_available: (capacity?.max_clients || 5) - (activeClients || 0),
          list: (clients || []).map(c => ({
            name: c.full_name,
            status: c.status,
            risk_level: c.risk_level,
            phase: c.phase_name,
            week: c.current_week,
          })),
        },
        revenue: {
          this_month: monthRevenue,
          currency: 'USD',
        },
        expiring_programs: expiring || [],
        alerts: {
          count: alertCount || 0,
          list: (alerts || []).slice(0, 5),
        },
        sessions_this_week: (weekSessions || []).length,
      },
    },
    generated_at: new Date().toISOString(),
  });
}

// ============================================================
// GET PAYMENTS
// ============================================================
async function getPayments() {
  const { data: payments } = await supabase
    .from('admin_payments')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: activeClients } = await supabase
    .from('clients')
    .select('id, full_name, status, program_start_date, program_end_date')
    .in('status', ['active', 'onboarding', 'onboarding_pending']);

  const clientIds = (payments || []).map(p => p.client_id).filter(Boolean);
  const unpaid = (activeClients || []).filter(c => !clientIds.includes(c.id));

  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const { data: expiring } = await supabase
    .from('admin_payments')
    .select('*')
    .lte('program_end', in30Days.toISOString().split('T')[0])
    .gte('program_end', new Date().toISOString().split('T')[0]);

  const totalCollected = (payments || [])
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return NextResponse.json({
    success: true,
    action_completed: 'get_payments',
    report: {
      title: 'Payments — Estado financiero',
      summary: `$${totalCollected} USD cobrado total. ${unpaid.length} clientes sin pago registrado. ${(expiring || []).length} programas por vencer.`,
      data: {
        total_collected: totalCollected,
        payments: payments || [],
        unpaid_clients: unpaid,
        expiring_soon: expiring || [],
      },
    },
    generated_at: new Date().toISOString(),
  });
}

// ============================================================
// GET P&L
// ============================================================
async function getPnl() {
  const { data: payments } = await supabase
    .from('admin_payments')
    .select('amount, created_at')
    .eq('status', 'paid');

  const totalRevenue = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);

  const { data: costs } = await supabase
    .from('admin_costs')
    .select('*')
    .eq('status', 'active');

  const monthlyCosts = (costs || [])
    .filter(c => c.is_recurring && c.recurrence === 'monthly')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const yearlyCosts = (costs || [])
    .filter(c => c.is_recurring && c.recurrence === 'yearly')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const totalMonthlyCost = monthlyCosts + (yearlyCosts / 12);

  const { count: activeClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const monthlyRevenue = ((activeClients || 0) * 500) / 3;
  const profit = monthlyRevenue - totalMonthlyCost;
  const margin = monthlyRevenue > 0 ? (profit / monthlyRevenue) * 100 : 0;

  return NextResponse.json({
    success: true,
    action_completed: 'get_pnl',
    report: {
      title: 'P&L — Profit & Loss',
      summary: `Revenue mensual estimado: $${monthlyRevenue.toFixed(0)} USD. Costos: $${totalMonthlyCost.toFixed(0)} USD. Profit: $${profit.toFixed(0)} USD (${margin.toFixed(0)}% margen).`,
      data: {
        revenue: {
          total_collected: totalRevenue,
          monthly_estimated: Number(monthlyRevenue.toFixed(2)),
          active_clients: activeClients || 0,
          price_per_client: 500,
          program_duration_months: 3,
        },
        costs: {
          monthly_total: Number(totalMonthlyCost.toFixed(2)),
          breakdown: costs || [],
        },
        profit: {
          monthly: Number(profit.toFixed(2)),
          margin_pct: Number(margin.toFixed(1)),
        },
        projections: {
          at_3_clients: {
            monthly_revenue: Number(((3 * 500) / 3).toFixed(2)),
            monthly_profit: Number((((3 * 500) / 3) - totalMonthlyCost).toFixed(2)),
          },
          at_5_clients: {
            monthly_revenue: Number(((5 * 500) / 3).toFixed(2)),
            monthly_profit: Number((((5 * 500) / 3) - totalMonthlyCost).toFixed(2)),
          },
        },
      },
    },
    generated_at: new Date().toISOString(),
  });
}

// ============================================================
// GET CAPACITY
// ============================================================
async function getCapacity() {
  const { data: capacity } = await supabase
    .from('setter_capacity')
    .select('*')
    .single();

  const { data: clients } = await supabase
    .from('clients')
    .select('full_name, status, current_phase, phase_name, current_week, program_end_date')
    .in('status', ['active', 'onboarding', 'onboarding_pending']);

  const byPhase = {
    IGNICION: (clients || []).filter(c => c.current_phase === 1),
    FORJA: (clients || []).filter(c => c.current_phase === 2),
    DOMINIO: (clients || []).filter(c => c.current_phase === 3),
    TRASCENDENCIA: (clients || []).filter(c => c.current_phase === 4),
  };

  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const graduating = (clients || []).filter(c => {
    if (!c.program_end_date) return false;
    const endDate = new Date(c.program_end_date);
    return endDate <= in30Days && endDate >= new Date();
  });

  const slotsAvailable = (capacity?.max_clients || 5) - (clients || []).length;

  let recommendation = '';
  if (slotsAvailable === 0) {
    recommendation = 'Capacidad llena. No abrir captación. Considerar subir precio o aumentar max_clients cuando un slot se libere.';
  } else if (slotsAvailable <= 2) {
    recommendation = `${slotsAvailable} slots disponibles. Captación moderada — priorizar calidad sobre cantidad.`;
  } else {
    recommendation = `${slotsAvailable} slots disponibles. Abrir captación. Activar Setter y Content Engine a máxima potencia.`;
  }

  return NextResponse.json({
    success: true,
    action_completed: 'get_capacity',
    report: {
      title: 'Capacity — Slots y fases',
      summary: `${(clients || []).length}/${capacity?.max_clients || 5} slots ocupados. ${graduating.length} clientes graduándose pronto.`,
      data: {
        slots: {
          max: capacity?.max_clients || 5,
          occupied: (clients || []).length,
          available: slotsAvailable,
        },
        by_phase: {
          IGNICION: byPhase.IGNICION.map(c => c.full_name),
          FORJA: byPhase.FORJA.map(c => c.full_name),
          DOMINIO: byPhase.DOMINIO.map(c => c.full_name),
          TRASCENDENCIA: byPhase.TRASCENDENCIA.map(c => c.full_name),
        },
        graduating_soon: graduating.map(c => ({
          name: c.full_name,
          ends: c.program_end_date,
        })),
        recommendation,
      },
    },
    generated_at: new Date().toISOString(),
  });
}
