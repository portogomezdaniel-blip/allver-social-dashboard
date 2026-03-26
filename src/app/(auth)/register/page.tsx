"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data.user) await supabase.from("creators").insert({ id: data.user.id, email, full_name: fullName });
    router.push("/"); router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "radial-gradient(circle at 40% 40%, rgba(168,183,142,0.08), transparent)", border: "1px solid rgba(168,183,142,0.1)" }}>
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--text-muted)]" style={{ opacity: 0.4 }} />
        </div>
      </div>
      <div className="text-center">
        <h1 className="text-[48px] font-[800] tracking-[-0.04em] text-[var(--text-primary)]" style={{ fontFamily: "var(--font-display)" }}>FTP</h1>
        <p className="text-[12px] font-mono tracking-[0.2em] text-[var(--text-muted)] mt-1">BY LLVR</p>
        <p className="text-[13px] text-[var(--text-muted)] mt-4 italic" style={{ fontFamily: "var(--font-serif)" }}>Tu sistema operativo de contenido</p>
      </div>
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="backdrop-blur-sm rounded-[16px] p-5 space-y-4" style={{ background: "rgba(0,0,0,0.18)", border: "0.5px solid rgba(168,183,142,0.08)" }}>
          <div className="space-y-1.5">
            <label className="text-[8px] tracking-[0.2em] uppercase font-mono text-[var(--text-muted)]">Nombre</label>
            <input type="text" placeholder="Tu nombre" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] focus:outline-none focus:border-[var(--border-focus)]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[8px] tracking-[0.2em] uppercase font-mono text-[var(--text-muted)]">Email</label>
            <input type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] focus:outline-none focus:border-[var(--border-focus)]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[8px] tracking-[0.2em] uppercase font-mono text-[var(--text-muted)]">Password</label>
            <input type="password" placeholder="Min. 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] focus:outline-none focus:border-[var(--border-focus)]" />
          </div>
          {error && <p className="text-[11px] text-[var(--red)]">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-[12px] font-medium transition-opacity disabled:opacity-50" style={{ background: "var(--olive)", color: "var(--black)" }}>
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </div>
        <p className="text-center text-[12px] text-[var(--text-muted)]">
          Ya tienes cuenta? <Link href="/login" className="text-[var(--olive)] hover:underline">Acceder</Link>
        </p>
      </form>
      <div className="px-6">
        <div className="h-[0.5px] mb-5" style={{ background: "linear-gradient(90deg, transparent, rgba(168,183,142,0.1), transparent)" }} />
        <p className="text-[12px] italic text-center leading-relaxed" style={{ fontFamily: "var(--font-serif)", color: "var(--text-muted)", opacity: 0.7 }}>
          &ldquo;Convertimos tu autoridad en presencia digital que genera clientes mientras entrenas.&rdquo;
        </p>
      </div>
    </div>
  );
}
