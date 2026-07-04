"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  cocina: "/cocina",
  supervisor: "/supervisor",
  mesero: "/mesero"
};

export default function HomePage() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (profile) {
      router.replace(ROLE_HOME[profile.role] ?? "/login");
    }
  }, [loading, session, profile, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-masa">
      <p className="text-humo">Cargando…</p>
    </div>
  );
}
