"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } },
    });

    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    if (data.user) {
      await supabase.from("creators").insert({ id: data.user.id, email, full_name: fullName });
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm rounded-[12px] border border-[var(--border)] bg-[var(--bg-card)] p-8" style={{ backgroundImage: "var(--satin)" }}>
      <div className="text-center mb-8">
        <div className="w-10 h-10 rounded-[10px] bg-[var(--text-primary)] flex items-center justify-center mx-auto mb-4">
          <span className="text-[11px] font-semibold text-[var(--bg)] tracking-wider">FTP</span>
        </div>
        <h1 className="text-lg font-medium tracking-[-0.03em] text-[var(--text-primary)]">Crear cuenta</h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Registrate para acceder al command center</p>
      </div>
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Nombre</label>
          <Input type="text" placeholder="Tu nombre" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="bg-[var(--bg)] border-[var(--border)] h-9 text-[13px]" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Email</label>
          <Input type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-[var(--bg)] border-[var(--border)] h-9 text-[13px]" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Password</label>
          <Input type="password" placeholder="Min. 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-[var(--bg)] border-[var(--border)] h-9 text-[13px]" />
        </div>
        {error && <p className="text-xs text-[var(--red)]">{error}</p>}
        <button type="submit" disabled={loading} className="w-full h-9 rounded-[6px] bg-[var(--text-primary)] text-[var(--bg)] text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? "Creando..." : "Registrarse"}
        </button>
        <p className="text-center text-xs text-[var(--text-tertiary)]">
          Ya tienes cuenta?{" "}
          <Link href="/login" className="text-[var(--text-primary)] hover:underline">Acceder</Link>
        </p>
      </form>
    </div>
  );
}
