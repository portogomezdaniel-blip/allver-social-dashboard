"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlowButton } from "@/components/ui/glow-button";

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm border border-border bg-card p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl tracking-[0.2em] text-foreground">FTP</h1>
        <p className="text-[10px] tracking-[0.3em] text-muted-foreground mt-1">
          BY LLVR
        </p>
        <div className="w-8 h-px bg-primary mx-auto mt-4" />
      </div>
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[11px] tracking-[0.1em] uppercase text-muted-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-background border-border h-10 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-[11px] tracking-[0.1em] uppercase text-muted-foreground">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-background border-border h-10 text-sm"
          />
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <GlowButton
          as="button"
          containerClassName="w-full"
          className="w-full text-center"
          onClick={(e: React.MouseEvent) => {
            if (!loading) {
              handleLogin(e as unknown as React.FormEvent);
            }
          }}
          disabled={loading}
        >
          {loading ? "Accediendo..." : "Acceder"}
        </GlowButton>

        <p className="text-center text-xs text-muted-foreground">
          Sin cuenta?{" "}
          <Link
            href="/register"
            className="text-primary hover:text-[#6AAF3D] transition-colors"
          >
            Registrarse
          </Link>
        </p>
      </form>
    </div>
  );
}
