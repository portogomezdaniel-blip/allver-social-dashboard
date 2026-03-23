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
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("creators").insert({ id: data.user.id, email, full_name: fullName });
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Logo */}
      <div className="text-center">
        <h1 className="text-[48px] font-bold tracking-[-0.04em] text-[var(--text-primary)]">FTP</h1>
        <p className="text-[12px] font-mono font-light tracking-[0.2em] text-[var(--text-tertiary)] mt-1">BY LLVR</p>
        <p className="text-[14px] text-[var(--text-tertiary)] mt-4">Tu sistema operativo de contenido</p>
      </div>

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Nombre</label>
          <Input
            type="text"
            placeholder="Tu nombre"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="bg-[var(--bg-card)] border-[var(--border)] h-11 text-[14px] rounded-[8px]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Email</label>
          <Input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-[var(--bg-card)] border-[var(--border)] h-11 text-[14px] rounded-[8px]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Password</label>
          <Input
            type="password"
            placeholder="Min. 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-[var(--bg-card)] border-[var(--border)] h-11 text-[14px] rounded-[8px]"
          />
        </div>
        {error && <p className="text-xs text-[var(--red)]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-[8px] bg-[var(--text-primary)] text-[var(--bg)] text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Creando..." : "Registrarse"}
        </button>
        <p className="text-center text-[13px] text-[var(--text-tertiary)]">
          Ya tienes cuenta?{" "}
          <Link href="/login" className="text-[var(--text-primary)] hover:underline">
            Acceder
          </Link>
        </p>
      </form>

      {/* Quote */}
      <div className="pt-4 border-t border-[var(--border)]">
        <p className="text-[13px] italic text-[var(--text-tertiary)] text-center leading-relaxed">
          &ldquo;Convertimos tu autoridad en presencia digital que genera clientes mientras entrenas.&rdquo;
        </p>
      </div>
    </div>
  );
}
