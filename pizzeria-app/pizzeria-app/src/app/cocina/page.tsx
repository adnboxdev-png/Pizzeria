"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { TopBar } from "@/components/TopBar";
import { supabase } from "@/lib/supabaseClient";
import type { Order } from "@/types/database";

function CocinaDashboard() {
  const [queue, setQueue] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadQueue = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .in("status", ["pendiente", "en_preparacion"])
      .order("created_at", { ascending: true });
    setQueue((data as unknown as Order[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadQueue();
    const channel = supabase
      .channel("cocina-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadQueue())
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => loadQueue())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadQueue]);

  const current = queue[0];

  const startIfNeeded = useCallback(async (order: Order) => {
    if (order.status === "pendiente") {
      await supabase
        .from("orders")
        .update({ status: "en_preparacion", started_at: new Date().toISOString() } as never)
        .eq("id", order.id);
    }
  }, []);

  useEffect(() => {
    if (current) startIfNeeded(current);
  }, [current, startIfNeeded]);

  const markDone = async () => {
    if (!current) return;
    setUpdating(true);
    await supabase
      .from("orders")
      .update({ status: "lista", ready_at: new Date().toISOString() } as never)
      .eq("id", current.id);
    setUpdating(false);
  };

  return (
    <div className="min-h-screen bg-masa">
      <TopBar title="Cocina" />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <p className="text-humo text-center">Cargando órdenes…</p>
        ) : !current ? (
          <div className="text-center py-24">
            <p className="text-2xl font-display text-albahaca mb-2">¡Todo al día!</p>
            <p className="text-humo">No hay órdenes pendientes por preparar.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-carbon/10 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-humo">Mesa</p>
                <p className="font-display text-3xl text-carbon">{current.table_number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-humo">Recibida</p>
                <p className="text-sm text-humo">
                  {new Date(current.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>

            <ul className="divide-y divide-carbon/10 mb-6">
              {(current.order_items ?? []).map((item) => (
                <li key={item.id} className="py-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-carbon">
                      {item.quantity}× {item.product_name}
                      {item.size_name ? ` (${item.size_name})` : ""}
                    </span>
                  </div>
                  {item.flavor_name && <p className="text-sm text-humo">Sabor: {item.flavor_name}</p>}
                  {item.notes && <p className="text-sm text-tomateOsc">Nota: {item.notes}</p>}
                </li>
              ))}
            </ul>

            {current.notes && (
              <p className="text-sm text-tomateOsc mb-4">Nota general: {current.notes}</p>
            )}

            <button
              onClick={markDone}
              disabled={updating}
              className="w-full bg-albahaca hover:opacity-90 transition-opacity text-white rounded-xl py-3 font-medium text-lg disabled:opacity-60"
            >
              {updating ? "Guardando…" : "✓ Marcar como concluida"}
            </button>

            {queue.length > 1 && (
              <p className="text-center text-xs text-humo mt-3">
                {queue.length - 1} orden{queue.length - 1 === 1 ? "" : "es"} más en espera
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function CocinaPage() {
  return (
    <RoleGuard allowed={["cocina"]}>
      <CocinaDashboard />
    </RoleGuard>
  );
}
