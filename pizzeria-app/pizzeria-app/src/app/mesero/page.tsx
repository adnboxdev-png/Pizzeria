"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { TopBar } from "@/components/TopBar";
import { ProductGrid } from "@/components/mesero/ProductGrid";
import { ProductModal } from "@/components/mesero/ProductModal";
import { Cart } from "@/components/mesero/Cart";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import type { Order, Product } from "@/types/database";
import type { CartLine } from "@/types/cart";
import { lineSubtotal } from "@/types/cart";

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  en_preparacion: "En preparación",
  lista: "¡Lista! Pasa a recogerla",
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

function MeseroDashboard() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [lines, setLines] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  const loadProducts = useCallback(async () => {
    const { data } = await supabase.from("products").select("*").eq("active", true).order("category").order("name");
    setProducts((data as unknown as Product[]) ?? []);
  }, []);

  const loadMyOrders = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("waiter_id", profile.id)
      .neq("status", "cancelada")
      .order("created_at", { ascending: false })
      .limit(10);
    setMyOrders((data as unknown as Order[]) ?? []);
  }, [profile]);

  useEffect(() => {
    loadProducts();
    loadMyOrders();
    const channel = supabase
      .channel("mesero-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadMyOrders())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadProducts, loadMyOrders]);

  const addLine = (line: CartLine) => setLines((prev) => [...prev, line]);
  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

  const submitOrder = async () => {
    if (!profile || lines.length === 0 || !tableNumber.trim()) return;
    setSubmitting(true);

    const total = lines.reduce((sum, l) => sum + lineSubtotal(l), 0);

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        table_number: tableNumber.trim(),
        waiter_id: profile.id,
        status: "pendiente",
        total
      } as never)
      .select()
      .single();

    if (error || !order) {
      setSubmitting(false);
      alert("No se pudo enviar la orden. Intenta de nuevo.");
      return;
    }

    const orderRow = order as unknown as Order;

    await supabase.from("order_items").insert(
      lines.map((l) => ({
        order_id: orderRow.id,
        product_id: l.product_id,
        product_name: l.product_name,
        size_name: l.size_name,
        size_price: l.size_price,
        flavor_name: l.flavor_name,
        flavor_extra: l.flavor_extra,
        quantity: l.quantity,
        subtotal: lineSubtotal(l),
        notes: l.notes
      })) as never
    );

    setLines([]);
    setTableNumber("");
    setSubmitting(false);
    loadMyOrders();
  };

  const markDelivered = async (order: Order) => {
    await supabase
      .from("orders")
      .update({ status: "entregada", delivered_at: new Date().toISOString() } as never)
      .eq("id", order.id);
    loadMyOrders();
  };

  return (
    <div className="min-h-screen bg-masa">
      <TopBar title="Panel de Mesero" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-8">
          <ProductGrid products={products} onSelect={setActiveProduct} />

          <div>
            <h2 className="font-display text-lg text-carbon mb-3">Mis órdenes recientes</h2>
            <div className="space-y-2">
              {myOrders.length === 0 && <p className="text-sm text-humo">Aún no has enviado órdenes.</p>}
              {myOrders.map((o) => (
                <div key={o.id} className="bg-white rounded-xl border border-carbon/10 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-carbon">Mesa {o.table_number}</p>
                    <p className="text-xs text-humo">${Number(o.total).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs rounded-full px-3 py-1 font-medium ${STATUS_COLOR[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                    {o.status === "lista" && (
                      <button
                        onClick={() => markDelivered(o)}
                        className="text-xs bg-carbon text-masa rounded-lg px-3 py-1.5"
                      >
                        Marcar entregada
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <Cart
            tableNumber={tableNumber}
            onTableNumberChange={setTableNumber}
            lines={lines}
            onRemove={removeLine}
            onSubmit={submitOrder}
            submitting={submitting}
          />
        </section>
      </main>

      {activeProduct && (
        <ProductModal product={activeProduct} onClose={() => setActiveProduct(null)} onAdd={addLine} />
      )}
    </div>
  );
}

export default function MeseroPage() {
  return (
    <RoleGuard allowed={["mesero"]}>
      <MeseroDashboard />
    </RoleGuard>
  );
}
