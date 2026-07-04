"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { TopBar } from "@/components/TopBar";
import { supabase } from "@/lib/supabaseClient";
import type { Order, Profile } from "@/types/database";

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  en_preparacion: "En preparación",
  lista: "Lista para entregar",
  entregada: "Entregada",
  cancelada: "Cancelada"
};

const STATUS_COLOR: Record<string, string> = {
  pendiente: "bg-queso/20 text-queso",
  en_preparacion: "bg-tomate/15 text-tomateOsc",
  lista: "bg-albahaca/15 text-albahaca",
  entregada: "bg-carbon/10 text-humo",
  cancelada: "bg-carbon/10 text-humo"
};

function SupervisorDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*, order_items(*), profiles!orders_waiter_id_fkey(*)")
      .in("status", ["pendiente", "en_preparacion", "lista"])
      .order("created_at", { ascending: true });
    setOrders((ordersData as unknown as Order[]) ?? []);

    const { data: staffData } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["cocina", "mesero"])
      .order("role");
    setStaff((staffData as unknown as Profile[]) ?? []);

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("supervisor-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const ordersByWaiter = new Map<string, number>();
  for (const o of orders) {
    ordersByWaiter.set(o.waiter_id, (ordersByWaiter.get(o.waiter_id) ?? 0) + 1);
  }

  return (
    <div className="min-h-screen bg-masa">
      <TopBar title="Panel de Supervisor" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <h2 className="font-display text-xl text-carbon mb-4">Órdenes en proceso</h2>
          {loading ? (
            <p className="text-humo text-sm">Cargando…</p>
          ) : orders.length === 0 ? (
            <p className="text-humo text-sm">No hay órdenes activas en este momento.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="bg-white rounded-xl border border-carbon/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-carbon">Mesa {o.table_number}</p>
                      <p className="text-xs text-humo">Mesero: {o.profiles?.full_name ?? "—"}</p>
                    </div>
                    <span className={`text-xs rounded-full px-3 py-1 font-medium ${STATUS_COLOR[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </div>
                  <p className="text-sm text-humo">
                    {(o.order_items ?? []).map((it) => `${it.quantity}× ${it.product_name}`).join(", ")}
                  </p>
                  <p className="text-xs text-humo/70 mt-1">
                    Recibida:{" "}
                    {new Date(o.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-xl text-carbon mb-4">Equipo</h2>
          <div className="space-y-2">
            {staff.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-carbon/10 p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-carbon text-sm">{s.full_name}</p>
                  <p className="text-xs text-humo capitalize">{s.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!s.active && (
                    <span className="text-[10px] bg-tomate/10 text-tomateOsc rounded px-2 py-0.5">Inactivo</span>
                  )}
                  {s.role === "mesero" && (ordersByWaiter.get(s.id) ?? 0) > 0 && (
                    <span className="text-[10px] bg-albahaca/10 text-albahaca rounded px-2 py-0.5">
                      {ordersByWaiter.get(s.id)} activa(s)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function SupervisorPage() {
  return (
    <RoleGuard allowed={["supervisor"]}>
      <SupervisorDashboard />
    </RoleGuard>
  );
}
