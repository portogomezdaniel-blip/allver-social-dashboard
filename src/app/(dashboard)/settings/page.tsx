"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CreatorIdentity } from "@/lib/supabase/identity";
import { useLocale } from "@/lib/locale-context";

const goalLabels: Record<string, string> = {
  more_clients: "Mas clientes",
  online_programs: "Programas online",
  authority: "Autoridad",
  education: "Educacion",
  brand_building: "Construir marca",
  community: "Comunidad",
};

export default function SettingsPage() {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const [userEmail, setUserEmail] = useState("");
  const [userCreatedAt, setUserCreatedAt] = useState("");
  const [userId, setUserId] = useState("");

  // Profile fields
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [gym, setGym] = useState("");
  const [handle, setHandle] = useState("");
  const [profileExists, setProfileExists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Identity
  const [identity, setIdentity] = useState<CreatorIdentity | null>(null);
  const [identityLoading, setIdentityLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUserEmail(data.user.email ?? "");
      setUserCreatedAt(data.user.created_at ?? "");
      setUserId(data.user.id);

      // Load profile
      supabase
        .from("creators")
        .select("*")
        .eq("id", data.user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile) {
            setProfileExists(true);
            setName(profile.full_name || "");
          }
        });

      // Load identity
      supabase
        .from("creator_identity")
        .select("*")
        .eq("user_id", data.user.id)
        .single()
        .then(({ data: id }) => {
          setIdentity(id);
          setIdentityLoading(false);
        });
    });
  }, []);

  async function handleSaveProfile() {
    setSaving(true);
    setSaveMsg("");
    const supabase = createClient();

    if (profileExists) {
      await supabase
        .from("creators")
        .update({ full_name: name })
        .eq("id", userId);
    }

    setSaveMsg("Guardado");
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 2000);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const onboardingStatus = identity?.onboarding_status ?? "not_started";

  return (
    <div className="max-w-[800px] mx-auto space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t("settings.title")}</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* CUENTA */}
      <section>
        <h2 className="text-xs tracking-[0.15em] uppercase text-[var(--text-tertiary)] mb-4">
          {t("settings.account")}
        </h2>
        <div className="border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
                {t("settings.email")}
              </p>
              <p className="text-sm text-[var(--text-primary)] mt-1">{userEmail}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
                {t("settings.registered")}
              </p>
              <p className="text-sm text-[var(--text-primary)] mt-1">
                {userCreatedAt
                  ? format(new Date(userCreatedAt), "d MMM yyyy", {
                      locale: es,
                    })
                  : "..."}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="border border-[rgba(255,100,100,0.3)] bg-transparent px-4 py-2 text-xs tracking-[0.15em] uppercase text-[rgba(255,100,100,0.6)] hover:border-[rgba(255,100,100,0.6)] hover:text-[rgba(255,100,100,0.8)] transition-colors"
          >
            {t("settings.logout")}
          </button>
        </div>
      </section>

      <hr className="border-[rgba(74,124,47,0.1)]" />

      {/* PERFIL */}
      <section>
        <h2 className="text-xs tracking-[0.15em] uppercase text-[var(--text-tertiary)] mb-4">
          {t("settings.profile")}
        </h2>
        <div className="border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
                {t("settings.name")}
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[var(--bg)] border-[var(--border)] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
                {t("settings.city")}
              </label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Medellin"
                className="bg-[var(--bg)] border-[var(--border)] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
                {t("settings.gym")}
              </label>
              <Input
                value={gym}
                onChange={(e) => setGym(e.target.value)}
                className="bg-[var(--bg)] border-[var(--border)] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
                {t("settings.instagram")}
              </label>
              <div className="flex items-center border border-[var(--border)] bg-[var(--bg)]">
                <span className="px-2.5 text-sm text-[var(--text-tertiary)]">@</span>
                <Input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="border-0 border-l border-[var(--border)] bg-transparent text-sm"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
              {t("settings.bio")}
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="bg-[var(--bg)] border-[var(--border)] text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-[var(--green)] text-[var(--bg)] px-5 py-2.5 text-xs tracking-[0.15em] uppercase font-bold hover:bg-[var(--green)] transition-colors disabled:opacity-50"
            >
              {saving ? t("settings.saving") : t("settings.save_changes")}
            </button>
            {saveMsg && (
              <span className="text-xs text-[var(--green)]">{saveMsg}</span>
            )}
          </div>
        </div>
      </section>

      <hr className="border-[rgba(74,124,47,0.1)]" />

      {/* I AM */}
      <section className="pb-4">
        <h2 className="text-[28px] font-bold text-[var(--text-primary)] tracking-[0.1em]">
          {t("settings.iam")}
        </h2>
        <p className="text-sm text-[var(--text-tertiary)] mt-1 mb-8">
          {t("settings.iam_subtitle")}
        </p>

        {identityLoading ? (
          <div className="flex items-center justify-center py-16 text-[var(--text-tertiary)]">
            Cargando...
          </div>
        ) : onboardingStatus === "not_started" || !identity ? (
          /* Estado A — Sin identidad */
          <div className="border border-[rgba(74,124,47,0.15)] bg-[rgba(74,124,47,0.05)] p-12 text-center space-y-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--green)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-[0.15em]">
              Aun no has configurado tu identidad de creador
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] max-w-md mx-auto">
              Tu identidad define como el sistema genera contenido para ti. Sin
              ella, los agentes de IA no pueden trabajar.
            </p>
            <button
              onClick={() => alert("Onboarding proximamente")}
              className="bg-[var(--green)] text-[var(--bg)] px-8 py-3 text-xs tracking-[0.15em] uppercase font-bold hover:bg-[var(--green)] transition-colors mt-4"
            >
              Comenzar Configuracion
            </button>
          </div>
        ) : onboardingStatus === "in_progress" ? (
          /* Estado B — En progreso */
          <div className="border border-[rgba(74,124,47,0.15)] bg-[rgba(74,124,47,0.05)] p-8 space-y-4">
            <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-[0.15em]">
              Paso {identity.current_step} de 6
            </p>
            <div className="w-full h-2 bg-[var(--border)]">
              <div
                className="h-full bg-[var(--green)] transition-all"
                style={{
                  width: `${((identity.current_step || 1) / 6) * 100}%`,
                }}
              />
            </div>
            <button
              onClick={() => alert("Onboarding proximamente")}
              className="bg-[var(--green)] text-[var(--bg)] px-6 py-2.5 text-xs tracking-[0.15em] uppercase font-bold hover:bg-[var(--green)] transition-colors"
            >
              Continuar
            </button>
          </div>
        ) : (
          /* Estado C — Completado */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1 — Identidad Base */}
            <IdentityCard label="01 — Identidad Base">
              <p className="text-sm text-[var(--text-primary)]">
                {identity.niche || "Sin nicho"} —{" "}
                {identity.experience_years || "?"} anos
              </p>
              <p className="text-sm text-[var(--text-primary)]">
                {identity.city || "Sin ciudad"}
                {identity.gym_name ? ` — ${identity.gym_name}` : ""}
              </p>
              {identity.specialties && identity.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {identity.specialties.map((s, i) => (
                    <span
                      key={i}
                      className="border border-[rgba(74,124,47,0.3)] bg-[rgba(74,124,47,0.1)] px-2 py-0.5 text-[10px] text-[var(--green)] uppercase tracking-wider"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </IdentityCard>

            {/* Card 2 — Filosofia */}
            <IdentityCard label="02 — Filosofia y Metodo">
              {renderJsonList(identity.philosophy, "core_principles", "Principios")}
              {renderJsonField(identity.philosophy, "what_differentiates", "Diferenciador")}
              {renderJsonField(identity.philosophy, "signature_method", "Metodo")}
            </IdentityCard>

            {/* Card 3 — Voz y Tono */}
            <IdentityCard label="03 — Voz y Tono">
              {renderJsonField(identity.voice_profile, "tone", "Tono")}
              {renderJsonTags(identity.voice_profile, "key_vocabulary", "var(--green)")}
              {renderJsonTags(identity.voice_profile, "never_says", "rgba(255,100,100,0.5)")}
            </IdentityCard>

            {/* Card 4 — Audiencia */}
            <IdentityCard label="04 — Audiencia">
              {renderJsonField(identity.audience_profile, "ideal_client", "Cliente ideal")}
              {renderJsonList(identity.audience_profile, "frustrations", "Frustraciones")}
              {renderJsonField(identity.audience_profile, "age_range", "Edad")}
            </IdentityCard>

            {/* Card 5 — Metas */}
            <IdentityCard label="05 — Metas de Contenido">
              {identity.content_goals && identity.content_goals.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {identity.content_goals.map((g, i) => (
                    <span
                      key={i}
                      className="border border-[rgba(74,124,47,0.3)] bg-[rgba(74,124,47,0.1)] px-2 py-0.5 text-[10px] text-[var(--green)] uppercase tracking-wider"
                    >
                      {goalLabels[g] || g}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)]">Sin metas configuradas</p>
              )}
            </IdentityCard>

            {/* Card 6 — Prohibiciones */}
            <IdentityCard label="06 — Prohibiciones">
              {renderJsonList(identity.prohibitions, "never_post", "Nunca publicar")}
              {renderJsonList(identity.prohibitions, "tone_limits", "Limites de tono")}
              {renderJsonTags(identity.prohibitions, "topics_off_limits", "rgba(255,100,100,0.5)")}
            </IdentityCard>
          </div>
        )}
      </section>

      <hr className="border-[rgba(74,124,47,0.1)]" />

      {/* APARIENCIA */}
      <section className="pb-12">
        <h2 className="text-xs tracking-[0.15em] uppercase text-[var(--text-tertiary)] mb-4">
          {t("settings.appearance")}
        </h2>
        <div className="border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-6">
          {/* Language Toggle */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-2">
              {t("settings.language")}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setLocale("es")}
                className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                  locale === "es"
                    ? "bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)]"
                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-focus)]"
                }`}
              >
                ES Espanol
              </button>
              <button
                onClick={() => setLocale("en")}
                className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                  locale === "en"
                    ? "bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)]"
                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-focus)]"
                }`}
              >
                EN English
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[var(--green)]" />
            <p className="text-sm text-[var(--text-primary)]">{t("settings.accent_color")}</p>
            <span className="text-xs text-[var(--text-tertiary)]">var(--green)</span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-[var(--text-primary)]">{t("settings.theme")}: {t("settings.dark_mode")}</p>
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
              {t("settings.coming_soon")}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function IdentityCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[rgba(74,124,47,0.05)] border border-[rgba(74,124,47,0.15)] border-l-2 border-l-[var(--green)] p-5 relative">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
          {label}
        </p>
        <button
          onClick={() => alert("Edicion proximamente")}
          className="text-[10px] uppercase tracking-[0.15em] text-[var(--green)] hover:text-[var(--green)] transition-colors"
        >
          Editar
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function renderJsonField(
  obj: Record<string, unknown> | null | undefined,
  key: string,
  label: string
) {
  if (!obj || !obj[key]) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
        {label}
      </p>
      <p className="text-xs text-[var(--text-primary)] mt-0.5">{String(obj[key])}</p>
    </div>
  );
}

function renderJsonList(
  obj: Record<string, unknown> | null | undefined,
  key: string,
  label: string
) {
  if (!obj || !obj[key]) return null;
  const items = Array.isArray(obj[key]) ? (obj[key] as string[]) : [];
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
        {label}
      </p>
      <ul className="mt-1 space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-[var(--text-primary)]">
            — {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function renderJsonTags(
  obj: Record<string, unknown> | null | undefined,
  key: string,
  color: string
) {
  if (!obj || !obj[key]) return null;
  const items = Array.isArray(obj[key]) ? (obj[key] as string[]) : [];
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {items.map((item, i) => (
        <span
          key={i}
          className="px-2 py-0.5 text-[10px] uppercase tracking-wider border"
          style={{
            borderColor: color,
            color: color,
            backgroundColor: `${color}15`,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
