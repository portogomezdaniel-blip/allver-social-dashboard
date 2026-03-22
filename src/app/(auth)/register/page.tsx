"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlowButton } from "@/components/ui/glow-button";

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
      options: {
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("creators").insert({
        id: data.user.id,
        email,
        full_name: fullName,
      });
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm border border-border bg-card p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl tracking-[0.2em] text-foreground">FTP</h1>
        <p className="text-[10px] tracking-[0.3em] text-muted-foreground mt-1">
          NUEVO OPERADOR
        </p>
        <div className="w-8 h-px bg-primary mx-auto mt-4" />
      </div>
      <form onSubmit={handleRegister} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-[11px] tracking-[0.1em] uppercase text-muted-foreground">
            Nombre
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Tu nombre"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="bg-background border-border h-10 text-sm"
          />
        </div>
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
            placeholder="Min. 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
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
              handleRegister(e as unknown as React.FormEvent);
            }
          }}
          disabled={loading}
        >
          {loading ? "Creando..." : "Registrarse"}
        </GlowButton>

        <p className="text-center text-xs text-muted-foreground">
          Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary hover:text-[#6AAF3D] transition-colors">
            Acceder
          </Link>
        </p>
      </form>
    </div>
  );
}
