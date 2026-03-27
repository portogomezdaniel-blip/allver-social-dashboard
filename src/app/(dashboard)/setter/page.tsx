"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Copy, Check, AlertTriangle, Users, MessageSquare, Clock, ChevronRight, Loader2 } from "lucide-react";
import GlassCard from "@/components/mirror/GlassCard";
import LayerLabel from "@/components/mirror/LayerLabel";
import LayerDivider from "@/components/mirror/LayerDivider";
import { fetchLeads, fetchMessages, fetchCapacity, type SetterLead, type SetterMessage, type SetterCapacity } from "@/lib/supabase/setter";

const statusColors: Record<string, string> = {
  new: "#6366f1",
  qualifying: "#f59e0b",
  qualified: "#22c55e",
  disqualified: "#ef4444",
  loom_sent: "#8b5cf6",
  call_scheduled: "#06b6d4",
  closed: "#10b981",
  cold: "#6b7280",
  escalated: "#ef4444",
  waitlist: "#f97316",
};

const statusLabels: Record<string, string> = {
  new: "Nuevo",
  qualifying: "Calificando",
  qualified: "Calificado",
  disqualified: "No calificado",
  loom_sent: "Loom enviado",
  call_scheduled: "Call agendada",
  closed: "Cerrado",
  cold: "Frío",
  escalated: "Escalado",
  waitlist: "Lista de espera",
};

export default function SetterPage() {
  const [leads, setLeads] = useState<SetterLead[]>([]);
  const [capacity, setCapacity] = useState<SetterCapacity | null>(null);
  const [selectedLead, setSelectedLead] = useState<SetterLead | null>(null);
  const [messages, setMessages] = useState<SetterMessage[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Inbox state
  const [igHandle, setIgHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [dmMessage, setDmMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [response, setResponse] = useState<{
    message_to_lead: string;
    action: string;
    lead_status: string;
    should_escalate: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [leadsData, capData] = await Promise.all([
        fetchLeads(statusFilter),
        fetchCapacity(),
      ]);
      setLeads(leadsData);
      setCapacity(capData);
    } catch (err) {
      console.error("Error loading setter data:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function loadMessages(lead: SetterLead) {
    setSelectedLead(lead);
    setMessagesLoading(true);
    try {
      const msgs = await fetchMessages(lead.id);
      setMessages(msgs);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  }

  async function handleProcess() {
    if (!igHandle.trim() || !dmMessage.trim()) return;
    setProcessing(true);
    setResponse(null);

    try {
      const res = await fetch("/api/setter/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ig_handle: igHandle.startsWith("@") ? igHandle : `@${igHandle}`,
          display_name: displayName || null,
          message: dmMessage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResponse(data);
        loadData();
      } else {
        console.error("Process error:", data.error);
      }
    } catch (err) {
      console.error("Process error:", err);
    } finally {
      setProcessing(false);
    }
  }

  function handleCopy() {
    if (!response) return;
    navigator.clipboard.writeText(response.message_to_lead);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  }

  const slotsUsed = capacity ? capacity.active_clients : 0;
  const slotsMax = capacity ? capacity.max_clients : 5;
  const slotsAvailable = capacity ? capacity.slots_available : 5;
  const slotPct = (slotsUsed / slotsMax) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Setter Agent</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Califica leads desde Instagram DMs. Habla como Mauro.
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Leads: <span className="text-foreground font-medium">{leads.length}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-muted-foreground">
            Slots: <span className="text-foreground font-medium">{slotsAvailable}/{slotsMax}</span>
          </span>
        </div>
        {leads.filter((l) => l.status === "escalated").length > 0 && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-medium">
              {leads.filter((l) => l.status === "escalated").length} escalados
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left column: Inbox + Capacity */}
        <div className="xl:col-span-5 space-y-5">
          <LayerLabel layer="surface" label="INBOX" />

          {/* Setter Inbox */}
          <GlassCard intensity="medium" className="p-5">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                    @Handle
                  </label>
                  <input
                    type="text"
                    value={igHandle}
                    onChange={(e) => setIgHandle(e.target.value)}
                    placeholder="@juanfuerza"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-white/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Juan"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                  Mensaje del DM
                </label>
                <textarea
                  value={dmMessage}
                  onChange={(e) => setDmMessage(e.target.value)}
                  placeholder="Pega el mensaje del lead aquí..."
                  rows={4}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-white/20 resize-none"
                />
              </div>

              <button
                onClick={handleProcess}
                disabled={processing || !igHandle.trim() || !dmMessage.trim()}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed text-foreground text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Procesar con Setter
                  </>
                )}
              </button>
            </div>

            {/* Response */}
            {response && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                      Respuesta del Setter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        color: statusColors[response.lead_status] || "#6b7280",
                        background: `${statusColors[response.lead_status] || "#6b7280"}20`,
                      }}
                    >
                      {statusLabels[response.lead_status] || response.lead_status}
                    </span>
                  </div>
                </div>

                {response.should_escalate && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-xs text-red-400">
                      ESCALADO A MAURO — Requiere atención directa
                    </span>
                  </div>
                )}

                <div className="bg-black/20 rounded-lg p-4 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {response.message_to_lead}
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar respuesta
                    </>
                  )}
                </button>
              </div>
            )}
          </GlassCard>

          {/* Capacity Widget */}
          <GlassCard intensity="subtle" className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Capacidad
              </span>
              <span className="text-sm font-medium text-foreground">
                {slotsUsed}/{slotsMax}
              </span>
            </div>
            <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${slotPct}%`,
                  background:
                    slotPct >= 100
                      ? "#ef4444"
                      : slotPct >= 80
                        ? "#f59e0b"
                        : "#22c55e",
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              {slotsAvailable > 0
                ? `${slotsAvailable} slots disponibles`
                : "Sin cupos — leads van a waitlist"}
            </p>
          </GlassCard>
        </div>

        {/* Right column: Leads list + Conversation */}
        <div className="xl:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
            <LayerLabel layer="middle" label="LEADS" />
            <div className="flex items-center gap-1">
              {["all", "new", "qualifying", "qualified", "escalated", "cold"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full transition-colors ${
                    statusFilter === s
                      ? "bg-white/15 text-foreground"
                      : "text-muted-foreground hover:text-foreground/70"
                  }`}
                >
                  {s === "all" ? "Todos" : statusLabels[s] || s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <GlassCard intensity="subtle" className="p-8 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </GlassCard>
          ) : leads.length === 0 ? (
            <GlassCard intensity="subtle" className="p-8 text-center">
              <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No hay leads todavia. Procesa un DM en el inbox.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {leads.map((lead) => (
                <GlassCard
                  key={lead.id}
                  intensity={selectedLead?.id === lead.id ? "strong" : "subtle"}
                  className="p-3 flex items-center gap-3"
                  onClick={() => loadMessages(lead)}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: statusColors[lead.status] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {lead.ig_handle}
                      </span>
                      {lead.display_name && (
                        <span className="text-xs text-muted-foreground truncate">
                          {lead.display_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span
                        className="text-[10px] uppercase tracking-wider"
                        style={{ color: statusColors[lead.status] }}
                      >
                        {statusLabels[lead.status] || lead.status}
                      </span>
                      {lead.training_goal && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {lead.training_goal}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(lead.last_message_at)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {/* Conversation view */}
          {selectedLead && (
            <>
              <LayerDivider />
              <LayerLabel layer="depth" label={`CONVERSACION — ${selectedLead.ig_handle}`} />
              <GlassCard intensity="medium" className="p-4 max-h-[400px] overflow-y-auto">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin mensajes registrados.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "setter" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            msg.role === "setter"
                              ? "bg-emerald-500/15 text-foreground/90"
                              : msg.role === "system"
                                ? "bg-amber-500/10 text-amber-300/80 text-xs italic"
                                : "bg-white/5 text-foreground/80"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-[9px] text-muted-foreground mt-1">
                            {msg.role === "setter" ? "Setter" : msg.role === "system" ? "Sistema" : "Lead"} · {new Date(msg.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
