"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { TopBar } from "@/components/TopBar";
import { ProductsManager } from "@/components/admin/ProductsManager";
import { SalesCharts } from "@/components/admin/SalesCharts";
import { UsersManager } from "@/components/admin/UsersManager";

type Tab = "ventas" | "productos" | "usuarios";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("ventas");

  return (
    <RoleGuard allowed={["admin"]}>
      <div className="min-h-screen bg-masa">
        <TopBar title="Panel de Administrador" />
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 flex gap-2">
          {[
            { key: "ventas", label: "Ventas" },
            { key: "productos", label: "Productos" },
            { key: "usuarios", label: "Usuarios" }
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as Tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? "bg-carbon text-masa" : "bg-white text-humo hover:bg-carbon/5"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {tab === "ventas" && <SalesCharts />}
          {tab === "productos" && <ProductsManager />}
          {tab === "usuarios" && <UsersManager />}
        </main>
      </div>
    </RoleGuard>
  );
}
