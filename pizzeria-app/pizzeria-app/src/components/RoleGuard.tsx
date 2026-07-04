"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types/database";

const ROLE_HOME: Record<UserRole, string> = {
  admin: "/admin",
  cocina: "/cocina",
  supervisor: "/supervisor",
  mesero: "/mesero"
};

export function RoleGuard({
  allowed,
  children
}: {
  allowed: UserRole[];
  children: ReactNode;
}) {
  const { session, profile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (profile && !profile.active) {
      signOut();
      router.replace("/login?desactivado=1");
      return;
    }
    if (profile && !allowed.includes(profile.role)) {
      router.replace(ROLE_HOME[profile.role]);
    }
  }, [loading, session, profile, allowed, router, signOut]);

  if (loading || !session || !profile || !allowed.includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-masa">
        <p className="text-humo font-body">Cargando…</p>
      </div>
    );
  }

  return <>{children}</>;
}
