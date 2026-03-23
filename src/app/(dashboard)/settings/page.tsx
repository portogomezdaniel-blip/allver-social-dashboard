"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CreatorIdentity } from "@/lib/supabase/identity";

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
        <h1 className="text-2xl font-bold text-[#C8C8C8]">Configuracion</h1>
        <p className="text-sm text-[#6B6B6B] mt-1">
          Ajustes de tu cuenta y perfil de creador.
        </p>
      </div>

      {/* CUENTA */}
      <section>
        <h2 className="text-xs tracking-[0.15em] uppercase text-[#6B6B6B] mb-4">
          Cuenta
        </h2>
        <div className="border border-[#1E2916] bg-[#131A0E] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#6B6B6B]">
                Email
              </p>
              <p className="text-sm text-[#C8C8C8] mt-1">{userEmail}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#6B6B6B]">
                Registro
              </p>
              <p className="text-sm text-[#C8C8C8] mt-1">
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
            Cerrar Sesion
          </button>
        </div>
      </section>

      <hr className="border-[rgba(74,124,47,0.1)]" />

      {/* PERFIL */}
      <section>
        <h2 className="text-xs tracking-[0.15em] uppercase text-[#6B6B6B] mb-4">
          Perfil
        </h2>
        <div className="border border-[#1E2916] bg-[#131A0E] p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.15em] text-[#6B6B6B]">
                Nombre
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#0D1008] border-[#1E2916] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.15em] text-[#6B6B6B]">
                Ciudad
              </label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Medellin"
                className="bg-[#0D1008] border-[#1E2916] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.15em] text-[#6B6B6B]">
                Gimnasio
              </label>
              <Input
                value={gym}
                onChange={(e) => setGym(e.target.value)}
                className="bg-[#0D1008] border-[#1E2916] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.15em] text-[#6B6B6B]">
                Instagram
              </label>
              <div className="flex items-center border border-[#1E2916] bg-[#0D1008]">
                <span className="px-2.5 text-sm text-[#6B6B6B]">@</span>
                <Input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="border-0 border-l border-[#1E2916] bg-transparent text-sm"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-[0.15em] text-[#6B6B6B]">
              Bio
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="bg-[#0D1008] border-[#1E2916] text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-[#4A7C2F] text-[#0D1008] px-5 py-2.5 text-xs tracking-[0.15em] uppercase font-bold hover:bg-[#6AAF3D] transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
            {saveMsg && (
              <span className="text-xs text-[#6AAF3D]">{saveMsg}</span>
            )}
          </div>
        </div>
      </section>

      <hr className="border-[rgba(74,124,47,0.1)]" />

      {/* I AM */}
      <section className="pb-4">
        <h2 className="text-[28px] font-bold text-[#C8C8C8] tracking-[0.1em]">
          I AM
        </h2>
        <p className="text-sm text-[#6B6B6B] mt-1 mb-8">
          Tu identidad como creador. Esto define como el sistema genera
          contenido para ti.
        </p>

        {identityLoading ? (
          <div className="flex items-center justify-center py-16 text-[#6B6B6B]">
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
              stroke="#4A7C2F"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <h3 className="text-sm font-bold text-[#C8C8C8] uppercase tracking-[0.15em]">
              Aun no has configurado tu identidad de creador
            </h3>
            <p className="text-xs text-[#6B6B6B] max-w-md mx-auto">
              Tu identidad define como el sistema genera contenido para ti. Sin
              ella, los agentes de IA no pueden trabajar.
            </p>
            <button
              onClick={() => alert("Onboarding proximamente")}
              className="bg-[#4A7C2F] text-[#0D1008] px-8 py-3 text-xs tracking-[0.15em] uppercase font-bold hover:bg-[#6AAF3D] transition-colors mt-4"
            >
              Comenzar Configuracion
            </button>
          </div>
        ) : onboardingStatus === "in_progress" ? (
          /* Estado B — En progreso */
          <div className="border border-[rgba(74,124,47,0.15)] bg-[rgba(74,124,47,0.05)] p-8 space-y-4">
            <p className="text-xs text-[#6B6B6B] uppercase tracking-[0.15em]">
              Paso {identity.current_step} de 6
            </p>
            <div className="w-full h-2 bg-[#1E2916]">
              <div
                className="h-full bg-[#4A7C2F] transition-all"
                style={{
                  width: `${((identity.current_step || 1) / 6) * 100}%`,
                }}
              />
            </div>
            <button
              onClick={() => alert("Onboarding proximamente")}
              className="bg-[#4A7C2F] text-[#0D1008] px-6 py-2.5 text-xs tracking-[0.15em] uppercase font-bold hover:bg-[#6AAF3D] transition-colors"
            >
              Continuar
            </button>
          </div>
        ) : (
          /* Estado C — Completado */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1 — Identidad Base */}
            <IdentityCard label="01 — Identidad Base">
              <p className="text-sm text-[#C8C8C8]">
                {identity.niche || "Sin nicho"} —{" "}
                {identity.experience_years || "?"} anos
              </p>
              <p className="text-sm text-[#C8C8C8]">
                {identity.city || "Sin ciudad"}
                {identity.gym_name ? ` — ${identity.gym_name}` : ""}
              </p>
              {identity.specialties && identity.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {identity.specialties.map((s, i) => (
                    <span
                      key={i}
                      className="border border-[rgba(74,124,47,0.3)] bg-[rgba(74,124,47,0.1)] px-2 py-0.5 text-[10px] text-[#6AAF3D] uppercase tracking-wider"
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
              {renderJsonTags(identity.voice_profile, "key_vocabulary", "#4A7C2F")}
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
                      className="border border-[rgba(74,124,47,0.3)] bg-[rgba(74,124,47,0.1)] px-2 py-0.5 text-[10px] text-[#6AAF3D] uppercase tracking-wider"
                    >
                      {goalLabels[g] || g}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6B6B6B]">Sin metas configuradas</p>
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
        <h2 className="text-xs tracking-[0.15em] uppercase text-[#6B6B6B] mb-4">
          Apariencia
        </h2>
        <div className="border border-[#1E2916] bg-[#131A0E] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#4A7C2F]" />
            <p className="text-sm text-[#C8C8C8]">Color de acento</p>
            <span className="text-xs text-[#6B6B6B]">#4A7C2F</span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-[#C8C8C8]">Tema: Dark Mode</p>
            <span className="text-[10px] text-[#6B6B6B] uppercase tracking-wider">
              Proximamente
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
    <div className="bg-[rgba(74,124,47,0.05)] border border-[rgba(74,124,47,0.15)] border-l-2 border-l-[#4A7C2F] p-5 relative">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-[0.15em] text-[#6B6B6B]">
          {label}
        </p>
        <button
          onClick={() => alert("Edicion proximamente")}
          className="text-[10px] uppercase tracking-[0.15em] text-[#4A7C2F] hover:text-[#6AAF3D] transition-colors"
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
      <p className="text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">
        {label}
      </p>
      <p className="text-xs text-[#C8C8C8] mt-0.5">{String(obj[key])}</p>
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
      <p className="text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">
        {label}
      </p>
      <ul className="mt-1 space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-[#C8C8C8]">
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
