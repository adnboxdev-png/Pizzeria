"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const { signIn, session, profile } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const desactivado = params.get("desactivado") === "1";

  useEffect(() => {
    if (session && profile) {
      const home: Record<string, string> = {
        admin: "/admin",
        cocina: "/cocina",
        supervisor: "/supervisor",
        mesero: "/mesero"
      };
      router.replace(home[profile.role] ?? "/");
    }
  }, [session, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) setError("Correo o contraseña incorrectos.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-masa px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-carbon/5 p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-tomate flex items-center justify-center text-masa font-display text-xl">
            P
          </div>
          <h1 className="font-display text-2xl text-carbon">Control de Sucursal</h1>
          <p className="text-sm text-humo mt-1">Inicia sesión para continuar</p>
        </div>

        {desactivado && (
          <div className="mb-4 text-sm bg-tomate/10 text-tomateOsc rounded-lg px-3 py-2">
            Tu usuario fue desactivado. Contacta al administrador.
          </div>
        )}
        {error && (
          <div className="mb-4 text-sm bg-tomate/10 text-tomateOsc rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-humo mb-1">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-carbon/15 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tomate"
              placeholder="usuario@pizzeria.com"
            />
          </div>
          <div>
            <label className="block text-sm text-humo mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-carbon/15 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tomate"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-tomate hover:bg-tomateOsc transition-colors text-white rounded-lg py-2.5 font-medium disabled:opacity-60"
          >
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="text-xs text-humo/70 text-center mt-6">
          Las cuentas las crea el administrador desde su panel.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
