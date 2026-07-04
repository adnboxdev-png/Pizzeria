"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile, UserRole } from "@/types/database";

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrador",
  cocina: "Cocina",
  supervisor: "Supervisor",
  mesero: "Mesero"
};

export function UsersManager() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("mesero");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("role").order("full_name");
    setUsers((data as unknown as Profile[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email, password, full_name: fullName, role })
    });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(json.error ?? "No se pudo crear el usuario.");
      return;
    }

    setShowForm(false);
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("mesero");
    load();
  };

  const toggleActive = async (u: Profile) => {
    await supabase.from("profiles").update({ active: !u.active } as never).eq("id", u.id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-carbon">Usuarios</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-tomate text-white rounded-lg px-4 py-2 text-sm hover:bg-tomateOsc transition-colors"
        >
          {showForm ? "Cancelar" : "+ Agregar usuario"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createUser} className="bg-white rounded-xl border border-carbon/10 p-5 mb-6 space-y-4">
          {error && <div className="text-sm bg-tomate/10 text-tomateOsc rounded-lg px-3 py-2">{error}</div>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-humo mb-1">Nombre completo</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-carbon/15 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-humo mb-1">Rol</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-carbon/15 px-3 py-2"
              >
                {Object.entries(ROLE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-humo mb-1">Correo</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-carbon/15 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-humo mb-1">Contraseña temporal</label>
              <input
                required
                type="text"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-carbon/15 px-3 py-2"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-albahaca text-white rounded-lg px-4 py-2 text-sm hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Creando…" : "Crear usuario"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-humo text-sm">Cargando usuarios…</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map((u) => (
            <div
              key={u.id}
              className={`rounded-xl border p-4 bg-white ${u.active ? "border-carbon/10" : "border-tomate/30 opacity-60"}`}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-carbon">{u.full_name}</h3>
                <span className="text-[10px] uppercase tracking-wide text-humo bg-carbon/5 rounded px-1.5 py-0.5">
                  {ROLE_LABEL[u.role]}
                </span>
              </div>
              <p className="text-xs text-humo mt-1">{u.active ? "Activo" : "Desactivado"}</p>
              <button
                onClick={() => toggleActive(u)}
                className={`mt-3 text-xs rounded-lg px-3 py-1.5 ${
                  u.active
                    ? "bg-tomate/10 text-tomateOsc hover:bg-tomate/20"
                    : "bg-albahaca/10 text-albahaca hover:bg-albahaca/20"
                }`}
              >
                {u.active ? "Desactivar" : "Reactivar"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
