"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, DollarSign, Users, AlertTriangle, Calendar, Plus, X, Copy, Check } from "lucide-react";
import GlassCard from "@/components/mirror/GlassCard";
import { createClient } from "@/lib/supabase/client";

type Tab = "dashboard" | "payments" | "pnl" | "capacity";
const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "payments", label: "Pagos" },
  { key: "pnl", label: "P&L" },
  { key: "capacity", label: "Capacity" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReportData = any;

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [data, setData] = useState<ReportData>(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);

  const loadTab = useCallback(async (t: Tab) => {
    setLoading(true);
    setData(null);
    try {
      const actionMap: Record<Tab, string> = { dashboard: "get_dashboard", payments: "get_payments", pnl: "get_pnl", capacity: "get_capacity" };
      const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: actionMap[t] }) });
      const json = await res.json();
      if (json.success) setData(json.report);
    } catch { /* */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTab(tab); }, [tab, loadTab]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-[800]" style={{ fontFamily: "var(--font-display)" }}>Admin</h1>
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Finanzas, capacidad y operaciones del negocio.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-[10px]" style={{ background: "rgba(255,255,255,0.04)" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 text-[11px] font-[600] py-2 rounded-[8px] transition-all"
            style={{
              background: tab === t.key ? "rgba(122,140,101,0.2)" : "transparent",
              color: tab === t.key ? "var(--olive)" : "var(--text-muted)",
              border: tab === t.key ? "1px solid rgba(122,140,101,0.3)" : "1px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <GlassCard intensity="ghost" className="p-12 flex justify-center"><Loader2 size={18} className="animate-spin" style={{ color: "var(--text-muted)" }} /></GlassCard>
      ) : !data ? (
        <GlassCard intensity="ghost" className="p-8 text-center"><p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Error cargando datos</p></GlassCard>
      ) : (
        <>
          {tab === "dashboard" && <DashboardTab data={data} />}
          {tab === "payments" && <PaymentsTab data={data} onRegister={() => setShowPayModal(true)} />}
          {tab === "pnl" && <PnlTab data={data} onAddCost={() => setShowCostModal(true)} />}
          {tab === "capacity" && <CapacityTab data={data} />}
        </>
      )}

      {showPayModal && <PaymentModal onClose={() => { setShowPayModal(false); loadTab("payments"); }} />}
      {showCostModal && <CostModal onClose={() => { setShowCostModal(false); loadTab("pnl"); }} />}
    </div>
  );
}

/* ─── DASHBOARD TAB ─── */
function DashboardTab({ data }: { data: ReportData }) {
  const d = data.data;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard icon={<Users size={14} />} label="Clientes" value={`${d.clients.active}/${d.clients.max}`} color="var(--olive)" />
        <StatCard icon={<DollarSign size={14} />} label="Revenue mes" value={`$${d.revenue.this_month}`} color="var(--green)" />
        <StatCard icon={<AlertTriangle size={14} />} label="Alertas" value={d.alerts.count} color={d.alerts.count > 0 ? "var(--red)" : "var(--text-muted)"} />
        <StatCard icon={<Calendar size={14} />} label="Sesiones sem" value={d.sessions_this_week} color="var(--blue)" />
      </div>

      {d.clients.list.length > 0 && (
        <GlassCard intensity="ghost" className="p-3">
          <span className="text-[9px] font-[700] uppercase tracking-wider block mb-2" style={{ color: "var(--text-ghost)" }}>Clientes activos</span>
          <div className="space-y-1.5">
            {d.clients.list.map((c: ReportData, i: number) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className="w-2 h-2 rounded-full" style={{ background: c.risk_level === "red" ? "#ef4444" : c.risk_level === "yellow" ? "#f59e0b" : "#22c55e" }} />
                <span className="font-[500]">{c.name}</span>
                <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{c.phase} · sem {c.week}</span>
                <span className="ml-auto text-[9px] px-1.5 py-px rounded" style={{ color: c.status === "active" ? "#22c55e" : "#8b5cf6", background: c.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(139,92,246,0.1)" }}>{c.status}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {d.expiring_programs.length > 0 && (
        <GlassCard intensity="ghost" className="p-3">
          <span className="text-[9px] font-[700] uppercase tracking-wider block mb-2" style={{ color: "#f59e0b" }}>Programas por vencer (14 días)</span>
          {d.expiring_programs.map((p: ReportData, i: number) => (
            <p key={i} className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{p.client_name} — {p.program_end}</p>
          ))}
        </GlassCard>
      )}
    </div>
  );
}

/* ─── PAYMENTS TAB ─── */
function PaymentsTab({ data, onRegister }: { data: ReportData; onRegister: () => void }) {
  const d = data.data;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          Total cobrado: <strong style={{ color: "var(--olive)" }}>${d.total_collected} USD</strong>
        </div>
        <button onClick={onRegister} className="flex items-center gap-1.5 text-[10px] font-[700] px-3 py-1.5 rounded-[6px]" style={{ background: "var(--olive)", color: "var(--bg-deep)" }}>
          <Plus size={12} /> Registrar pago
        </button>
      </div>

      {d.unpaid_clients.length > 0 && (
        <GlassCard intensity="ghost" className="p-3">
          <span className="text-[9px] font-[700] uppercase tracking-wider block mb-2" style={{ color: "#f59e0b" }}>Sin pago registrado</span>
          {d.unpaid_clients.map((c: ReportData) => (
            <p key={c.id} className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{c.full_name} — {c.status}</p>
          ))}
        </GlassCard>
      )}

      {d.payments.length > 0 ? (
        <GlassCard intensity="ghost" className="p-3">
          <span className="text-[9px] font-[700] uppercase tracking-wider block mb-2" style={{ color: "var(--text-ghost)" }}>Historial de pagos</span>
          <div className="space-y-1.5">
            {d.payments.map((p: ReportData) => (
              <div key={p.id} className="flex items-center gap-2 text-[11px]">
                <span className="w-2 h-2 rounded-full" style={{ background: p.status === "paid" ? "#22c55e" : p.status === "pending" ? "#f59e0b" : "#ef4444" }} />
                <span className="font-[500]">{p.client_name}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--olive)" }}>${p.amount}</span>
                <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{p.payment_method || "—"}</span>
                <span className="ml-auto text-[9px]" style={{ color: "var(--text-ghost)" }}>{new Date(p.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : (
        <GlassCard intensity="ghost" className="p-6 text-center">
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No hay pagos registrados</p>
        </GlassCard>
      )}
    </div>
  );
}

/* ─── P&L TAB ─── */
function PnlTab({ data, onAddCost }: { data: ReportData; onAddCost: () => void }) {
  const d = data.data;
  const marginColor = d.profit.margin_pct >= 80 ? "#22c55e" : d.profit.margin_pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <GlassCard intensity="ghost" className="p-3 text-center">
          <p className="text-[18px] font-[800]" style={{ fontFamily: "var(--font-mono)", color: "var(--olive)" }}>${d.revenue.monthly_estimated}</p>
          <p className="text-[9px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Revenue/mes</p>
        </GlassCard>
        <GlassCard intensity="ghost" className="p-3 text-center">
          <p className="text-[18px] font-[800]" style={{ fontFamily: "var(--font-mono)", color: "#ef4444" }}>${d.costs.monthly_total}</p>
          <p className="text-[9px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Costos/mes</p>
        </GlassCard>
        <GlassCard intensity="ghost" className="p-3 text-center">
          <p className="text-[18px] font-[800]" style={{ fontFamily: "var(--font-mono)", color: marginColor }}>${d.profit.monthly}</p>
          <p className="text-[9px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Profit ({d.profit.margin_pct}%)</p>
        </GlassCard>
      </div>

      {/* Revenue vs costs bar */}
      <GlassCard intensity="ghost" className="p-3">
        <span className="text-[9px] font-[700] uppercase tracking-wider block mb-2" style={{ color: "var(--text-ghost)" }}>Revenue vs Costos</span>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          {d.revenue.monthly_estimated > 0 && (
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((d.revenue.monthly_estimated - d.costs.monthly_total) / d.revenue.monthly_estimated) * 100)}%`, background: "var(--olive)" }} />
          )}
        </div>
        <div className="flex justify-between mt-1 text-[9px]" style={{ color: "var(--text-ghost)" }}>
          <span>Costos: ${d.costs.monthly_total}</span>
          <span>Revenue: ${d.revenue.monthly_estimated}</span>
        </div>
      </GlassCard>

      {/* Projections */}
      <div className="grid grid-cols-2 gap-2">
        <GlassCard intensity="ghost" className="p-3">
          <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "var(--text-ghost)" }}>A 3 clientes</p>
          <p className="text-[16px] font-[800]" style={{ fontFamily: "var(--font-mono)", color: "var(--olive)" }}>${d.projections.at_3_clients.monthly_profit}<span className="text-[10px] font-[400]">/mes</span></p>
        </GlassCard>
        <GlassCard intensity="ghost" className="p-3">
          <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "var(--text-ghost)" }}>A 5 clientes</p>
          <p className="text-[16px] font-[800]" style={{ fontFamily: "var(--font-mono)", color: "var(--olive)" }}>${d.projections.at_5_clients.monthly_profit}<span className="text-[10px] font-[400]">/mes</span></p>
        </GlassCard>
      </div>

      {/* Costs breakdown */}
      <GlassCard intensity="ghost" className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-[700] uppercase tracking-wider" style={{ color: "var(--text-ghost)" }}>Costos fijos</span>
          <button onClick={onAddCost} className="text-[9px] px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}>+ Agregar</button>
        </div>
        <div className="space-y-1">
          {d.costs.breakdown.map((c: ReportData) => (
            <div key={c.id} className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-[8px] uppercase px-1.5 py-px rounded" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-ghost)" }}>{c.category}</span>
                <span style={{ color: "var(--text-secondary)" }}>{c.description}</span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", color: c.amount > 0 ? "var(--text-primary)" : "var(--text-ghost)" }}>${c.amount}/{c.recurrence === "yearly" ? "año" : "mes"}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

/* ─── CAPACITY TAB ─── */
function CapacityTab({ data }: { data: ReportData }) {
  const d = data.data;
  const pct = (d.slots.occupied / d.slots.max) * 100;
  const barColor = pct >= 100 ? "#ef4444" : pct >= 80 ? "#f59e0b" : "var(--olive)";
  return (
    <div className="space-y-4">
      {/* Slots bar */}
      <GlassCard intensity="ghost" className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-[600]">Slots</span>
          <span className="text-[14px] font-[800]" style={{ fontFamily: "var(--font-mono)" }}>{d.slots.occupied}/{d.slots.max}</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>{d.slots.available} disponibles</p>
      </GlassCard>

      {/* Phase kanban */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(["IGNICION", "FORJA", "DOMINIO", "TRASCENDENCIA"] as const).map((phase, i) => {
          const colors = ["#f59e0b", "#ef4444", "#6366f1", "#22c55e"];
          const names: string[] = d.by_phase[phase] || [];
          return (
            <GlassCard key={phase} intensity="ghost" className="p-3">
              <p className="text-[9px] font-[700] uppercase tracking-wider mb-2" style={{ color: colors[i] }}>{phase}</p>
              {names.length === 0 ? (
                <p className="text-[10px]" style={{ color: "var(--text-ghost)" }}>—</p>
              ) : (
                names.map((n: string) => (
                  <p key={n} className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{n}</p>
                ))
              )}
            </GlassCard>
          );
        })}
      </div>

      {/* Graduating */}
      {d.graduating_soon.length > 0 && (
        <GlassCard intensity="ghost" className="p-3">
          <span className="text-[9px] font-[700] uppercase tracking-wider block mb-2" style={{ color: "#22c55e" }}>Graduándose pronto</span>
          {d.graduating_soon.map((g: ReportData) => (
            <p key={g.name} className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{g.name} — {g.ends}</p>
          ))}
        </GlassCard>
      )}

      {/* Recommendation */}
      {d.recommendation && (
        <GlassCard intensity="medium" className="p-3">
          <span className="text-[9px] font-[700] uppercase tracking-wider block mb-1" style={{ color: "var(--olive)" }}>Recomendación</span>
          <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{d.recommendation}</p>
        </GlassCard>
      )}
    </div>
  );
}

/* ─── STAT CARD ─── */
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <GlassCard intensity="ghost" className="p-3">
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>{icon}<span className="text-[9px] uppercase tracking-wider">{label}</span></div>
      <p className="text-[18px] font-[800]" style={{ fontFamily: "var(--font-mono)" }}>{value}</p>
    </GlassCard>
  );
}

/* ─── PAYMENT MODAL ─── */
function PaymentModal({ onClose }: { onClose: () => void }) {
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([]);
  const [form, setForm] = useState({ client_id: "", amount: "500", payment_method: "transferencia", program_start: new Date().toISOString().split("T")[0], notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("clients").select("id, full_name").in("status", ["active", "onboarding", "onboarding_pending"]).then(({ data }) => setClients(data || []));
  }, []);

  const programEnd = form.program_start ? new Date(new Date(form.program_start).getTime() + 90 * 86400000).toISOString().split("T")[0] : "";

  async function handleSave() {
    if (!form.client_id) return;
    setSaving(true);
    const supabase = createClient();
    const client = clients.find((c) => c.id === form.client_id);
    await supabase.from("admin_payments").insert({
      client_id: form.client_id,
      client_name: client?.full_name || "",
      amount: parseFloat(form.amount),
      payment_method: form.payment_method,
      program_start: form.program_start,
      program_end: programEnd,
      status: "paid",
      notes: form.notes || null,
    });
    setSaving(false);
    onClose();
  }

  const inputClass = "w-full bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.08)] rounded-[6px] px-2.5 py-1.5 text-[12px] outline-none focus:border-[rgba(122,140,101,0.4)]";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-[12px] p-5 w-full max-w-md mx-4 space-y-3" style={{ background: "var(--bg-deep)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-[700]" style={{ fontFamily: "var(--font-display)" }}>Registrar pago</h3>
          <button onClick={onClose}><X size={16} style={{ color: "var(--text-muted)" }} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[9px] uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Cliente</label>
            <select className={inputClass} value={form.client_id} onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}>
              <option value="">Seleccionar...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[9px] uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Monto USD</label><input className={inputClass} type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} /></div>
            <div>
              <label className="text-[9px] uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Método</label>
              <select className={inputClass} value={form.payment_method} onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}>
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="nequi">Nequi</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[9px] uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Inicio</label><input className={inputClass} type="date" value={form.program_start} onChange={(e) => setForm((f) => ({ ...f, program_start: e.target.value }))} /></div>
            <div><label className="text-[9px] uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Fin (auto)</label><input className={inputClass} type="date" value={programEnd} readOnly style={{ color: "var(--text-muted)" }} /></div>
          </div>
          <div><label className="text-[9px] uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Notas</label><input className={inputClass} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notas opcionales" /></div>
        </div>
        <button onClick={handleSave} disabled={saving || !form.client_id} className="w-full text-[12px] font-[700] py-2.5 rounded-[8px] disabled:opacity-40" style={{ background: "var(--olive)", color: "var(--bg-deep)" }}>
          {saving ? "Guardando..." : "Registrar pago"}
        </button>
      </div>
    </div>
  );
}

/* ─── COST MODAL ─── */
function CostModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ category: "tools", description: "", amount: "", recurrence: "monthly" });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.description || !form.amount) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("admin_costs").insert({
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount),
      recurrence: form.recurrence,
      is_recurring: true,
    });
    setSaving(false);
    onClose();
  }

  const inputClass = "w-full bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.08)] rounded-[6px] px-2.5 py-1.5 text-[12px] outline-none focus:border-[rgba(122,140,101,0.4)]";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-[12px] p-5 w-full max-w-sm mx-4 space-y-3" style={{ background: "var(--bg-deep)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-[700]" style={{ fontFamily: "var(--font-display)" }}>Agregar costo</h3>
          <button onClick={onClose}><X size={16} style={{ color: "var(--text-muted)" }} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[9px] uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Categoría</label>
            <select className={inputClass} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              <option value="infrastructure">Infraestructura</option>
              <option value="ai">IA / APIs</option>
              <option value="tools">Herramientas</option>
              <option value="marketing">Marketing</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div><label className="text-[9px] uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Descripción</label><input className={inputClass} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Ej: Hosting adicional" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[9px] uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Monto USD</label><input className={inputClass} type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} /></div>
            <div>
              <label className="text-[9px] uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Recurrencia</label>
              <select className={inputClass} value={form.recurrence} onChange={(e) => setForm((f) => ({ ...f, recurrence: e.target.value }))}>
                <option value="monthly">Mensual</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || !form.description || !form.amount} className="w-full text-[12px] font-[700] py-2.5 rounded-[8px] disabled:opacity-40" style={{ background: "var(--olive)", color: "var(--bg-deep)" }}>
          {saving ? "Guardando..." : "Agregar costo"}
        </button>
      </div>
    </div>
  );
}
