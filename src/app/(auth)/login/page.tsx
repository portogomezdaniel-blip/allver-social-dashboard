"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
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
        <h1 className="text-lg font-medium tracking-[-0.03em] text-[var(--text-primary)]">Bienvenido</h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Inicia sesion en tu command center</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Email</label>
          <Input type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-[var(--bg)] border-[var(--border)] h-9 text-[13px]" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-medium">Password</label>
          <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-[var(--bg)] border-[var(--border)] h-9 text-[13px]" />
        </div>
        {error && <p className="text-xs text-[var(--red)]">{error}</p>}
        <button type="submit" disabled={loading} className="w-full h-9 rounded-[6px] bg-[var(--text-primary)] text-[var(--bg)] text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? "Accediendo..." : "Acceder"}
        </button>
        <p className="text-center text-xs text-[var(--text-tertiary)]">
          Sin cuenta?{" "}
          <Link href="/register" className="text-[var(--text-primary)] hover:underline">Registrarse</Link>
        </p>
      </form>
    </div>
  );
}
