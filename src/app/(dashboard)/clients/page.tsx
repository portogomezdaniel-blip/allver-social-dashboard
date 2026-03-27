"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Loader2, Copy, Check, AlertTriangle, ChevronRight, Clock, X, MessageSquare, Shield, Zap, Flame, Crown } from "lucide-react";
import GlassCard from "@/components/mirror/GlassCard";
import { fetchClients, fetchInteractions, fetchOnboarding, fetchAlertCounts, createClientRecord, updateClientNotes, resolveAlert, type Client, type ClientInteraction, type ClientOnboarding } from "@/lib/supabase/clients";
import { createClient } from "@/lib/supabase/client";

const statusColors: Record<string, string> = {
  onboarding: "#6366f1",
  onboarding_pending: "#8b5cf6",
  active: "#22c55e",
  at_risk: "#f59e0b",
  red_flag: "#ef4444",
  completed: "#6b7280",
  paused: "#6b7280",
};
const statusLabels: Record<string, string> = {
  onboarding: "Onboarding",
  onboarding_pending: "Onboarding pendiente",
  active: "Activo",
  at_risk: "En riesgo",
  red_flag: "Red flag",
  completed: "Completado",
  paused: "Pausado",
};
const riskColors: Record<string, string> = { green: "#22c55e", yellow: "#f59e0b", red: "#ef4444" };
const phaseIcons: Record<number, React.ReactNode> = { 1: <Zap size={12} />, 2: <Flame size={12} />, 3: <Shield size={12} />, 4: <Crown size={12} /> };
const phaseColors: Record<number, string> = { 1: "#f59e0b", 2: "#ef4444", 3: "#6366f1", 4: "#22c55e" };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [alertCounts, setAlertCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Client | null>(null);
  const [interactions, setInteractions] = useState<ClientInteraction[]>([]);
  const [onboardings, setOnboardings] = useState<ClientOnboarding[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ for_client?: { message: string }; for_mauro?: { summary: string; recommendation: string }; risk_level?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [alerts, setAlerts] = useState<{ id: string; alert_type: string; severity: string; message: string; created_at: string }[]>([]);
  const [trainerNotes, setTrainerNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [c, ac] = await Promise.all([fetchClients(), fetchAlertCounts()]);
      setClients(c);
      setAlertCounts(ac);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function selectClient(c: Client) {
    setSelected(c);
    setActionResult(null);
    setDetailLoading(true);
    setTrainerNotes(c.trainer_notes || "");
    try {
      const [ints, obs] = await Promise.all([fetchInteractions(c.id), fetchOnboarding(c.id)]);
      setInteractions(ints);
      setOnboardings(obs);
    } catch { /* */ } finally {
      setDetailLoading(false);
    }
  }

  async function callClientOps(action: string, clientId: string) {
    setActionLoading(action);
    setActionResult(null);
    try {
      const res = await fetch("/api/client-ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, client_id: clientId }),
      });
      const data = await res.json();
      if (data.success) {
        setActionResult(data);
        if (selected) {
          const [ints, obs] = await Promise.all([fetchInteractions(clientId), fetchOnboarding(clientId)]);
          setInteractions(ints);
          setOnboardings(obs);
        }
        loadData();
      }
    } catch { /* */ } finally {
      setActionLoading(null);
    }
  }

  async function loadAlerts(clientId: string) {
    setActionLoading("check_alerts");
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("client_alerts")
        .select("*")
        .eq("client_id", clientId)
        .eq("resolved", false)
        .order("created_at", { ascending: false });
      setAlerts(data || []);
      // Also call the API to generate new alerts
      await callClientOps("check_alerts", clientId);
    } catch { /* */ } finally {
      setActionLoading(null);
    }
  }

  async function handleResolveAlert(alertId: string) {
    await resolveAlert(alertId);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    loadData();
  }

  async function saveNotes() {
    if (!selected) return;
    setSavingNotes(true);
    try {
      await updateClientNotes(selected.id, trainerNotes);
    } catch { /* */ } finally {
      setSavingNotes(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeClients = clients.filter((c) => ["active", "onboarding", "onboarding_pending"].includes(c.status));
  const riskCounts = { green: 0, yellow: 0, red: 0 };
  for (const c of activeClients) {
    if (c.risk_level in riskCounts) riskCounts[c.risk_level as keyof typeof riskCounts]++;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-[800]" style={{ fontFamily: "var(--font-display)" }}>Clientes</h1>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Retención post-venta. El bot piensa, Mauro ejecuta.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 text-[11px] font-[700] px-3 py-2 rounded-[8px]" style={{ background: "var(--olive)", color: "var(--bg-deep)" }}>
          <Plus size={13} /> AGREGAR
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-[12px]">
        <span style={{ color: "var(--text-secondary)" }}><Users size={14} className="inline mr-1" />{activeClients.length}/5 activos</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: riskColors.green }} />{riskCounts.green}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: riskColors.yellow }} />{riskCounts.yellow}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: riskColors.red }} />{riskCounts.red}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Client list */}
        <div className="lg:col-span-5 space-y-2">
          {loading ? (
            <GlassCard intensity="ghost" className="p-8 flex justify-center"><Loader2 size={18} className="animate-spin" style={{ color: "var(--text-muted)" }} /></GlassCard>
          ) : clients.length === 0 ? (
            <GlassCard intensity="ghost" className="p-8 text-center">
              <Users size={24} className="mx-auto mb-2" style={{ color: "var(--text-ghost)" }} />
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Sin clientes. Agrega uno para empezar.</p>
            </GlassCard>
          ) : (
            clients.map((c) => (
              <GlassCard key={c.id} intensity={selected?.id === c.id ? "strong" : "ghost"} className="p-3 flex items-center gap-3" onClick={() => selectClient(c)}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: riskColors[c.risk_level] || riskColors.green }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-[600] truncate">{c.full_name}</span>
                    {c.ig_handle && <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{c.ig_handle}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-px rounded" style={{ color: statusColors[c.status] || "#6b7280", background: `${statusColors[c.status] || "#6b7280"}15` }}>{statusLabels[c.status] || c.status}</span>
                    <span className="flex items-center gap-0.5 text-[9px]" style={{ color: phaseColors[c.current_phase] || "var(--text-muted)" }}>
                      {phaseIcons[c.current_phase]}{c.phase_name}
                    </span>
                    <span className="text-[9px]" style={{ color: "var(--text-ghost)" }}>sem {c.current_week}/12</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(alertCounts[c.id] || 0) > 0 && (
                    <span className="text-[9px] font-[700] px-1.5 py-px rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>{alertCounts[c.id]}</span>
                  )}
                  <ChevronRight size={14} style={{ color: "var(--text-ghost)" }} />
                </div>
              </GlassCard>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-7 space-y-4">
          {!selected ? (
            <GlassCard intensity="ghost" className="p-12 text-center">
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Selecciona un cliente para ver detalles</p>
            </GlassCard>
          ) : detailLoading ? (
            <GlassCard intensity="ghost" className="p-12 flex justify-center"><Loader2 size={18} className="animate-spin" style={{ color: "var(--text-muted)" }} /></GlassCard>
          ) : (
            <>
              {/* Profile header */}
              <GlassCard intensity="medium" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-[16px] font-[700]">{selected.full_name}</h2>
                    <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {selected.age && <span>{selected.age} años</span>}
                      {selected.weight_kg && <span>{selected.weight_kg}kg</span>}
                      {selected.primary_goal && <span>{selected.primary_goal}</span>}
                    </div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: riskColors[selected.risk_level] || riskColors.green }} />
                </div>
                {(selected.squat_1rm || selected.bench_1rm || selected.deadlift_1rm) && (
                  <div className="flex gap-4 text-[11px]" style={{ fontFamily: "var(--font-mono)" }}>
                    <span>S: <strong>{selected.squat_1rm || "—"}</strong></span>
                    <span>B: <strong>{selected.bench_1rm || "—"}</strong></span>
                    <span>D: <strong>{selected.deadlift_1rm || "—"}</strong></span>
                  </div>
                )}
                <div className="flex gap-3 mt-3 text-[10px]" style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: phaseColors[selected.current_phase] }}>{selected.phase_name}</span>
                  <span>Sem {selected.current_week}/12</span>
                  <span>Streak: {selected.current_streak}d</span>
                  <span>{selected.total_workouts_completed} workouts</span>
                </div>
              </GlassCard>

              {/* Action buttons */}
              <div className="flex gap-2">
                {["onboarding", "onboarding_pending"].includes(selected.status) && (
                  <button
                    onClick={() => callClientOps("generate_onboarding", selected.id)}
                    disabled={!!actionLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-[600] py-2 rounded-[8px] transition-colors"
                    style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}
                  >
                    {actionLoading === "generate_onboarding" ? <Loader2 size={12} className="animate-spin" /> : <MessageSquare size={12} />}
                    Onboarding
                  </button>
                )}
                {["active", "onboarding_pending", "at_risk", "red_flag"].includes(selected.status) && (
                  <button
                    onClick={() => callClientOps("generate_checkin", selected.id)}
                    disabled={!!actionLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-[600] py-2 rounded-[8px] transition-colors"
                    style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}
                  >
                    {actionLoading === "generate_checkin" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Check-in
                  </button>
                )}
                <button
                  onClick={() => loadAlerts(selected.id)}
                  disabled={!!actionLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-[600] py-2 rounded-[8px] transition-colors relative"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  {actionLoading === "check_alerts" ? <Loader2 size={12} className="animate-spin" /> : <AlertTriangle size={12} />}
                  Alertas
                  {(alertCounts[selected.id] || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 text-[8px] font-[700] w-4 h-4 flex items-center justify-center rounded-full" style={{ background: "#ef4444", color: "#fff" }}>{alertCounts[selected.id]}</span>
                  )}
                </button>
              </div>

              {/* Action result */}
              {actionResult?.for_client?.message && (
                <GlassCard intensity="medium" className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-[700] uppercase tracking-wider" style={{ color: "var(--olive)" }}>Mensaje para WhatsApp</span>
                    <button onClick={() => handleCopy(actionResult.for_client!.message)} className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {copied ? <><Check size={11} style={{ color: "var(--olive)" }} /> Copiado</> : <><Copy size={11} /> Copiar</>}
                    </button>
                  </div>
                  <p className="text-[12px] whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text-secondary)" }}>{actionResult.for_client.message}</p>
                  {actionResult.for_mauro && (
                    <div className="pt-2 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "var(--text-ghost)" }}>Para Mauro</p>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{actionResult.for_mauro.summary}</p>
                      {actionResult.for_mauro.recommendation && <p className="text-[10px] mt-1" style={{ color: "var(--olive)" }}>{actionResult.for_mauro.recommendation}</p>}
                    </div>
                  )}
                </GlassCard>
              )}

              {/* Alerts list */}
              {alerts.length > 0 && (
                <GlassCard intensity="ghost" className="p-3 space-y-2">
                  <span className="text-[9px] font-[700] uppercase tracking-wider" style={{ color: "#f87171" }}>Alertas activas</span>
                  {alerts.map((a) => (
                    <div key={a.id} className="flex items-start gap-2 p-2 rounded-[6px]" style={{ background: a.severity === "red" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)" }}>
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" style={{ color: a.severity === "red" ? "#ef4444" : "#f59e0b" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-[600]" style={{ color: a.severity === "red" ? "#f87171" : "#fbbf24" }}>{a.alert_type}</p>
                        <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{a.message}</p>
                      </div>
                      <button onClick={() => handleResolveAlert(a.id)} className="text-[9px] px-2 py-1 rounded shrink-0" style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-muted)" }}>Resolver</button>
                    </div>
                  ))}
                </GlassCard>
              )}

              {/* Pending onboarding messages */}
              {onboardings.filter((o) => o.status === "pending_review").length > 0 && (
                <GlassCard intensity="ghost" className="p-3 space-y-2">
                  <span className="text-[9px] font-[700] uppercase tracking-wider" style={{ color: "#818cf8" }}>Onboarding pendiente de envío</span>
                  {onboardings.filter((o) => o.status === "pending_review").map((o) => (
                    <div key={o.id} className="p-2 rounded-[6px]" style={{ background: "rgba(99,102,241,0.08)" }}>
                      <p className="text-[11px] whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{o.welcome_message}</p>
                      <button onClick={() => handleCopy(o.welcome_message)} className="flex items-center gap-1 text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>
                        {copied ? <><Check size={11} style={{ color: "var(--olive)" }} /> Copiado</> : <><Copy size={11} /> Copiar para WhatsApp</>}
                      </button>
                    </div>
                  ))}
                </GlassCard>
              )}

              {/* Trainer notes */}
              <GlassCard intensity="ghost" className="p-3">
                <span className="text-[9px] font-[700] uppercase tracking-wider block mb-2" style={{ color: "var(--text-ghost)" }}>Notas del entrenador</span>
                <textarea
                  value={trainerNotes}
                  onChange={(e) => setTrainerNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-transparent text-[12px] resize-none outline-none"
                  style={{ color: "var(--text-secondary)" }}
                  placeholder="Notas libres sobre este cliente..."
                />
                <button onClick={saveNotes} disabled={savingNotes} className="text-[10px] mt-1 px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}>
                  {savingNotes ? "Guardando..." : "Guardar notas"}
                </button>
              </GlassCard>

              {/* Timeline */}
              <div>
                <span className="text-[9px] font-[700] uppercase tracking-wider block mb-2 px-1" style={{ color: "var(--text-ghost)" }}>Timeline</span>
                {interactions.length === 0 ? (
                  <p className="text-[11px] px-1" style={{ color: "var(--text-muted)" }}>Sin interacciones registradas</p>
                ) : (
                  <div className="space-y-1.5">
                    {interactions.map((i) => (
                      <GlassCard key={i.id} intensity="ghost" className="p-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] uppercase tracking-wider font-[600]" style={{ color: i.interaction_type === "generate_onboarding" ? "#818cf8" : i.interaction_type === "generate_checkin" ? "#4ade80" : i.interaction_type === "check_alerts" ? "#f87171" : "var(--text-muted)" }}>{i.interaction_type.replace("generate_", "").replace("_", " ")}</span>
                          <span className="text-[9px]" style={{ color: "var(--text-ghost)" }}>{new Date(i.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })} {new Date(i.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        {i.content && <p className="text-[11px] line-clamp-2" style={{ color: "var(--text-muted)" }}>{i.content}</p>}
                      </GlassCard>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} onCreated={(c) => { setShowAddModal(false); loadData(); selectClient(c); }} />}
    </div>
  );
}

/* ============================================================
   ADD CLIENT MODAL
   ============================================================ */
function AddClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Client) => void }) {
  const [form, setForm] = useState({
    full_name: "", phone: "", ig_handle: "", age: "", weight_kg: "", height_cm: "",
    fitness_level: "intermediate", training_frequency: "4", primary_goal: "fuerza maxima",
    squat_1rm: "", bench_1rm: "", deadlift_1rm: "", injuries: "", trainer_notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSave() {
    if (!form.full_name.trim()) { setError("Nombre es requerido"); return; }
    setSaving(true);
    setError("");
    try {
      const client = await createClientRecord({
        full_name: form.full_name,
        phone: form.phone || null,
        ig_handle: form.ig_handle || null,
        age: form.age ? parseInt(form.age) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        fitness_level: form.fitness_level,
        training_frequency: parseInt(form.training_frequency),
        primary_goal: form.primary_goal,
        squat_1rm: form.squat_1rm ? parseFloat(form.squat_1rm) : null,
        bench_1rm: form.bench_1rm ? parseFloat(form.bench_1rm) : null,
        deadlift_1rm: form.deadlift_1rm ? parseFloat(form.deadlift_1rm) : null,
        injuries: form.injuries || null,
        trainer_notes: form.trainer_notes || null,
      });
      // Auto-generate onboarding
      fetch("/api/client-ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_onboarding", client_id: client.id }),
      }).catch(() => {});
      onCreated(client);
    } catch {
      setError("Error guardando cliente");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.08)] rounded-[6px] px-2.5 py-1.5 text-[12px] outline-none focus:border-[rgba(122,140,101,0.4)]";
  const labelClass = "text-[9px] uppercase tracking-[0.1em] block mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-[12px] p-5 w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto space-y-3" style={{ background: "var(--bg-deep)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-[700]" style={{ fontFamily: "var(--font-display)" }}>Agregar cliente</h3>
          <button onClick={onClose}><X size={16} style={{ color: "var(--text-muted)" }} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className={labelClass} style={{ color: "var(--text-muted)" }}>Nombre *</label><input className={inputClass} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Nombre completo" /></div>
          <div><label className={labelClass} style={{ color: "var(--text-muted)" }}>Teléfono</label><input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+57..." /></div>
          <div><label className={labelClass} style={{ color: "var(--text-muted)" }}>Instagram</label><input className={inputClass} value={form.ig_handle} onChange={(e) => set("ig_handle", e.target.value)} placeholder="@handle" /></div>
          <div><label className={labelClass} style={{ color: "var(--text-muted)" }}>Edad</label><input className={inputClass} type="number" value={form.age} onChange={(e) => set("age", e.target.value)} /></div>
          <div><label className={labelClass} style={{ color: "var(--text-muted)" }}>Peso (kg)</label><input className={inputClass} type="number" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} /></div>
          <div><label className={labelClass} style={{ color: "var(--text-muted)" }}>Altura (cm)</label><input className={inputClass} type="number" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} /></div>
          <div>
            <label className={labelClass} style={{ color: "var(--text-muted)" }}>Nivel</label>
            <select className={inputClass} value={form.fitness_level} onChange={(e) => set("fitness_level", e.target.value)}>
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </div>
          <div>
            <label className={labelClass} style={{ color: "var(--text-muted)" }}>Frecuencia</label>
            <select className={inputClass} value={form.training_frequency} onChange={(e) => set("training_frequency", e.target.value)}>
              <option value="3">3 días/sem</option>
              <option value="4">4 días/sem</option>
              <option value="5">5 días/sem</option>
              <option value="6">6 días/sem</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelClass} style={{ color: "var(--text-muted)" }}>Objetivo</label>
            <select className={inputClass} value={form.primary_goal} onChange={(e) => set("primary_goal", e.target.value)}>
              <option value="fuerza maxima">Fuerza máxima</option>
              <option value="hipertrofia">Hipertrofia</option>
              <option value="recomposicion">Recomposición</option>
              <option value="powerlifting">Powerlifting competitivo</option>
            </select>
          </div>
          <div><label className={labelClass} style={{ color: "var(--text-muted)" }}>Squat 1RM</label><input className={inputClass} type="number" value={form.squat_1rm} onChange={(e) => set("squat_1rm", e.target.value)} placeholder="kg" /></div>
          <div><label className={labelClass} style={{ color: "var(--text-muted)" }}>Bench 1RM</label><input className={inputClass} type="number" value={form.bench_1rm} onChange={(e) => set("bench_1rm", e.target.value)} placeholder="kg" /></div>
          <div className="col-span-2"><label className={labelClass} style={{ color: "var(--text-muted)" }}>Deadlift 1RM</label><input className={inputClass} type="number" value={form.deadlift_1rm} onChange={(e) => set("deadlift_1rm", e.target.value)} placeholder="kg" /></div>
          <div className="col-span-2"><label className={labelClass} style={{ color: "var(--text-muted)" }}>Lesiones</label><textarea className={inputClass} rows={2} value={form.injuries} onChange={(e) => set("injuries", e.target.value)} placeholder="Lesiones o condiciones relevantes" /></div>
          <div className="col-span-2"><label className={labelClass} style={{ color: "var(--text-muted)" }}>Notas</label><textarea className={inputClass} rows={2} value={form.trainer_notes} onChange={(e) => set("trainer_notes", e.target.value)} placeholder="Notas internas de Mauro" /></div>
        </div>

        {error && <p className="text-[11px]" style={{ color: "var(--red)" }}>{error}</p>}

        <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 text-[12px] font-[700] py-2.5 rounded-[8px]" style={{ background: "var(--olive)", color: "var(--bg-deep)" }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {saving ? "Guardando..." : "Guardar y generar onboarding"}
        </button>
      </div>
    </div>
  );
}
