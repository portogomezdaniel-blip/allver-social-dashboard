"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import type { CreatorIdentity } from "@/lib/supabase/identity";
import { useLocale } from "@/lib/locale-context";
import GlassCard from "@/components/mirror/GlassCard";
import LayerDivider from "@/components/mirror/LayerDivider";

const goalLabels: Record<string, string> = { more_clients: "Mas clientes", online_programs: "Programas online", authority: "Autoridad", education: "Educacion", brand_building: "Construir marca", community: "Comunidad" };

export default function SettingsPage() {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const [userEmail, setUserEmail] = useState("");
  const [userCreatedAt, setUserCreatedAt] = useState("");
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [gym, setGym] = useState("");
  const [handle, setHandle] = useState("");
  const [profileExists, setProfileExists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [identity, setIdentity] = useState<CreatorIdentity | null>(null);
  const [identityLoading, setIdentityLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUserEmail(data.user.email ?? ""); setUserCreatedAt(data.user.created_at ?? ""); setUserId(data.user.id);
      supabase.from("creators").select("*").eq("id", data.user.id).single().then(({ data: profile }) => {
        if (profile) { setProfileExists(true); setName(profile.full_name || ""); }
      });
      supabase.from("creator_identity").select("*").eq("user_id", data.user.id).single().then(({ data: id }) => { setIdentity(id); setIdentityLoading(false); });
    });
  }, []);

  async function handleSaveProfile() {
    setSaving(true); setSaveMsg("");
    const supabase = createClient();
    if (profileExists) await supabase.from("creators").update({ full_name: name }).eq("id", userId);
    setSaveMsg(t("settings.saved")); setSaving(false); setTimeout(() => setSaveMsg(""), 2000);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut(); router.push("/login"); router.refresh();
  }

  const onboardingStatus = identity?.onboarding_status ?? "not_started";
  const initial = name?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || "?";

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-[24px] font-[800] tracking-[-0.03em]" style={{ fontFamily: "var(--font-display)" }}>Tu esencia</h1>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">Tu reflejo completo como creador</p>
      </div>

      <div className="md:grid md:grid-cols-[280px_1fr] md:gap-8">
        {/* LEFT: Account + Profile + Language */}
        <div className="space-y-4 mb-8 md:mb-0">
          {/* Account */}
          <GlassCard intensity="medium" className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-[800]" style={{ background: "rgba(168,183,142,0.1)", border: "1px solid var(--olive)", color: "var(--olive)" }}>{initial}</div>
              <div>
                <p className="text-[13px] font-medium text-[var(--text-primary)]">{name || userEmail?.split("@")[0]}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{userEmail}</p>
              </div>
            </div>
            <p className="text-[9px] text-[var(--text-muted)] mb-3">Registrado: {userCreatedAt ? format(new Date(userCreatedAt), "d MMM yyyy", { locale: es }) : "..."}</p>
            <button onClick={handleLogout} className="text-[10px] px-3 py-1.5 rounded-lg border text-[var(--red)] border-[var(--red)]/30 hover:border-[var(--red)]/60 transition-colors">Cerrar sesion</button>
          </GlassCard>

          {/* Profile */}
          <GlassCard intensity="subtle" className="p-5 space-y-3">
            <span className="text-[8px] tracking-[0.2em] uppercase font-mono text-[var(--text-muted)]">PERFIL</span>
            {[
              { label: "Nombre", value: name, set: setName, placeholder: "Tu nombre" },
              { label: "Ciudad", value: city, set: setCity, placeholder: "Medellin" },
              { label: "Gym", value: gym, set: setGym, placeholder: "Tu gym" },
              { label: "Instagram", value: handle, set: setHandle, placeholder: "@handle" },
            ].map((f) => (
              <div key={f.label} className="space-y-1">
                <label className="text-[8px] tracking-[0.15em] uppercase font-mono text-[var(--text-muted)]">{f.label}</label>
                <input value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] focus:outline-none focus:border-[var(--border-focus)]" />
              </div>
            ))}
            <div className="flex items-center gap-2">
              <button onClick={handleSaveProfile} disabled={saving} className="text-[10px] px-3 py-1.5 rounded-lg font-medium" style={{ background: "var(--olive)", color: "var(--black)" }}>{saving ? "..." : "Guardar"}</button>
              {saveMsg && <span className="text-[9px] text-[var(--olive)]">{saveMsg}</span>}
            </div>
          </GlassCard>

          {/* Language */}
          <GlassCard intensity="ghost" className="p-4">
            <span className="text-[8px] tracking-[0.2em] uppercase font-mono text-[var(--text-muted)] mb-2 block">IDIOMA</span>
            <div className="flex gap-2">
              {(["es", "en"] as const).map((lang) => (
                <button key={lang} onClick={() => setLocale(lang)} className="px-3 py-1.5 text-[11px] rounded-lg border transition-all" style={{ background: locale === lang ? "var(--text-primary)" : "rgba(0,0,0,0.12)", color: locale === lang ? "var(--black)" : "var(--text-muted)", borderColor: locale === lang ? "var(--text-primary)" : "var(--border)" }}>
                  {lang === "es" ? "ES Espanol" : "EN English"}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* RIGHT: I AM */}
        <div>
          <div className="mb-6">
            <h2 className="text-[28px] font-[800] tracking-[-0.03em]" style={{ fontFamily: "var(--font-display)" }}>I AM</h2>
            <p className="text-[12px] italic mt-1" style={{ fontFamily: "var(--font-serif)", color: "var(--depth)" }}>Tu reflejo como creador</p>
          </div>

          {identityLoading ? (
            <div className="flex items-center justify-center py-16 text-[var(--text-muted)] text-sm">...</div>
          ) : onboardingStatus !== "completed" || !identity ? (
            <GlassCard intensity="subtle" className="p-8 text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(168,183,142,0.08)", border: "1px solid var(--border)" }}>
                <span className="text-[var(--text-muted)] text-lg">?</span>
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] mb-2">{t("settings.not_configured")}</p>
              <p className="text-[11px] text-[var(--text-muted)] mb-4">{t("settings.not_configured_detail")}</p>
              <button onClick={() => router.push("/onboarding")} className="text-[11px] px-4 py-2 rounded-lg" style={{ background: "var(--olive)", color: "var(--black)" }}>{t("settings.start_config")}</button>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {/* Identity layers */}
              <IdentityLayer color="var(--olive)" label="01 - IDENTIDAD BASE">
                <p className="text-[12px] text-[var(--text-secondary)]">{identity.niche || "Sin nicho"} &mdash; {identity.experience_years || "?"} anos</p>
                <p className="text-[12px] text-[var(--text-secondary)]">{identity.city || "Sin ciudad"}{identity.gym_name ? ` &mdash; ${identity.gym_name}` : ""}</p>
                {(identity.specialties?.length ?? 0) > 0 && <div className="flex flex-wrap gap-1 mt-2">{identity.specialties!.map((s, i) => <span key={i} className="text-[9px] px-2 py-0.5 rounded-md" style={{ background: "rgba(168,183,142,0.12)", color: "var(--olive)" }}>{s}</span>)}</div>}
              </IdentityLayer>

              <IdentityLayer color="var(--depth)" label="02 - FILOSOFIA Y METODO">
                {renderJsonList(identity.philosophy, "core_principles", "Principios")}
                {renderJsonField(identity.philosophy, "what_differentiates", "Diferenciador")}
                {renderJsonField(identity.philosophy, "signature_method", "Metodo")}
              </IdentityLayer>

              <IdentityLayer color="var(--surface)" label="03 - VOZ Y TONO">
                {renderJsonField(identity.voice_profile, "tone", "Tono")}
                {renderJsonTags(identity.voice_profile, "key_vocabulary", "var(--olive)")}
                {renderJsonTags(identity.voice_profile, "never_says", "var(--surface)")}
              </IdentityLayer>

              <IdentityLayer color="var(--blue)" label="04 - AUDIENCIA">
                {renderJsonField(identity.audience_profile, "ideal_client", "Cliente ideal")}
                {renderJsonList(identity.audience_profile, "frustrations", "Frustraciones")}
              </IdentityLayer>

              <IdentityLayer color="var(--amber)" label="05 - METAS">
                {(identity.content_goals?.length ?? 0) > 0 ? (
                  <div className="flex flex-wrap gap-1">{identity.content_goals!.map((g, i) => <span key={i} className="text-[9px] px-2 py-0.5 rounded-md" style={{ background: "rgba(200,170,80,0.12)", color: "var(--amber)" }}>{goalLabels[g] || g}</span>)}</div>
                ) : <p className="text-[11px] text-[var(--text-muted)]">Sin metas configuradas</p>}
              </IdentityLayer>

              <IdentityLayer color="var(--surface)" label="06 - PROHIBICIONES">
                {renderJsonList(identity.prohibitions, "never_post", "Nunca publicar")}
                {renderJsonList(identity.prohibitions, "tone_limits", "Limites de tono")}
              </IdentityLayer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IdentityLayer({ color, label, children }: { color: string; label: string; children: React.ReactNode }) {
  return (
    <div className="backdrop-blur-sm rounded-[16px] p-4" style={{ background: "rgba(0,0,0,0.12)", border: "0.5px solid rgba(168,183,142,0.06)", borderLeft: `2px solid ${color}` }}>
      <span className="text-[8px] tracking-[0.2em] uppercase font-mono mb-2 block" style={{ color }}>{label}</span>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function renderJsonField(obj: Record<string, unknown> | null | undefined, key: string, label: string) {
  if (!obj || !obj[key]) return null;
  return <div><span className="text-[8px] tracking-[0.1em] uppercase font-mono text-[var(--text-muted)]">{label}</span><p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{String(obj[key])}</p></div>;
}

function renderJsonList(obj: Record<string, unknown> | null | undefined, key: string, label: string) {
  if (!obj || !obj[key]) return null;
  const items = Array.isArray(obj[key]) ? (obj[key] as string[]) : [];
  if (items.length === 0) return null;
  return <div><span className="text-[8px] tracking-[0.1em] uppercase font-mono text-[var(--text-muted)]">{label}</span><ul className="mt-0.5 space-y-0.5">{items.map((item, i) => <li key={i} className="text-[11px] text-[var(--text-secondary)]">&mdash; {item}</li>)}</ul></div>;
}

function renderJsonTags(obj: Record<string, unknown> | null | undefined, key: string, color: string) {
  if (!obj || !obj[key]) return null;
  const items = Array.isArray(obj[key]) ? (obj[key] as string[]) : [];
  if (items.length === 0) return null;
  return <div className="flex flex-wrap gap-1 mt-1">{items.map((item, i) => <span key={i} className="px-2 py-0.5 text-[9px] rounded-md" style={{ background: `${color}15`, color, border: `0.5px solid ${color}30` }}>{item}</span>)}</div>;
}
