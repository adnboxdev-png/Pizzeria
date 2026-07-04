"use client";

import { useAuth } from "@/context/AuthContext";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  cocina: "Cocina",
  supervisor: "Supervisor",
  mesero: "Mesero"
};

export function TopBar({ title }: { title: string }) {
  const { profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-carbon text-masa px-4 sm:px-6 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-tomate flex items-center justify-center font-display text-sm">
          P
        </div>
        <div>
          <h1 className="font-display text-lg leading-tight">{title}</h1>
          {profile && (
            <p className="text-xs text-masa/60 leading-tight">
              {profile.full_name} · {ROLE_LABEL[profile.role]}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => signOut()}
        className="text-sm bg-masa/10 hover:bg-masa/20 transition-colors rounded-lg px-3 py-1.5"
      >
        Salir
      </button>
    </header>
  );
}
